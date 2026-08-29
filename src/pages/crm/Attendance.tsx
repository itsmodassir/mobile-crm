import { useState, useEffect } from 'react';
import { PageTransition } from '../../components/MotionWrapper';
import { ChevronLeft, Plus, Search, Loader2, X, Trash2, Edit2, Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth, API_BASE_URL } from '../../lib/auth';
import { cn } from '../../lib/cn';

const newAttendance = () => ({ 
    employee_id: "", date: new Date().toISOString().split('T')[0], status: "present", check_in: "", check_out: "", notes: "" 
});

export function Attendance() {
    const navigate = useNavigate();
    const [records, setRecords] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [form, setForm] = useState<any>(newAttendance());
    const [isSaving, setIsSaving] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const token = auth.getToken();
            const workspaceId = auth.getWorkspaceId();
            if (!token || !workspaceId) return;

            const [attRes, empRes] = await Promise.all([
                axios.post(
                    `${API_BASE_URL}/data/crm_attendance`,
                    { action: 'select', filters: [{ column: 'workspace_id', operator: 'eq', value: workspaceId }] },
                    { headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': workspaceId } }
                ),
                axios.post(
                    `${API_BASE_URL}/data/crm_employees`,
                    { action: 'select', filters: [{ column: 'workspace_id', operator: 'eq', value: workspaceId }] },
                    { headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': workspaceId } }
                )
            ]);
            
            const attRows = attRes.data?.data || attRes.data || [];
            const empRows = empRes.data?.data || empRes.data || [];
            
            setRecords(Array.isArray(attRows) ? attRows : []);
            setEmployees(Array.isArray(empRows) ? empRows : []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filtered = records.filter(r => {
        const emp = employees.find(e => e.id === r.employee_id);
        const empName = emp ? emp.name.toLowerCase() : '';
        return empName.includes(search.toLowerCase()) || 
               (r.date && r.date.includes(search)) ||
               (r.status && r.status.toLowerCase().includes(search.toLowerCase()));
    });

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const openAdd = () => {
        setForm(newAttendance());
        setIsFormOpen(true);
    };

    const openEdit = (record: any) => {
        setForm({
            ...record,
            date: record.date ? record.date.split('T')[0] : ""
        });
        setIsFormOpen(true);
    };

    const handleSave = async () => {
        if (!form.employee_id || !form.date) {
            alert('Employee and Date are required');
            return;
        }
        setIsSaving(true);
        try {
            const token = auth.getToken();
            const workspaceId = auth.getWorkspaceId();
            if (!token || !workspaceId) return;

            const dataToPush = { 
                ...form, 
                workspace_id: workspaceId,
                check_in: form.check_in || null,
                check_out: form.check_out || null
            };

            await axios.post(
                `${API_BASE_URL}/data/crm_attendance`,
                { 
                    action: form.id ? 'update' : 'insert', 
                    data: dataToPush,
                    ...(form.id ? { filters: [{ column: 'id', operator: 'eq', value: form.id }] } : {})
                },
                { headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': workspaceId } }
            );

            await loadData();
            setIsFormOpen(false);
        } catch (err) {
            console.error(err);
            alert('Failed to save attendance');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this record?')) return;
        
        try {
            const token = auth.getToken();
            const workspaceId = auth.getWorkspaceId();
            if (!token || !workspaceId) return;

            await axios.post(
                `${API_BASE_URL}/data/crm_attendance`,
                { action: 'delete', filters: [{ column: 'id', operator: 'eq', value: id }] },
                { headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': workspaceId } }
            );
            await loadData();
        } catch (err) {
            console.error(err);
            alert('Failed to delete record');
        }
    };

    return (
        <PageTransition className="min-h-screen bg-slate-50/50 pb-20">
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center gap-3 safe-top">
                <button onClick={() => navigate('/advance-crm')} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all">
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-bold">Attendance</h1>
                    <p className="text-xs text-muted-foreground">{records.length} records found</p>
                </div>
                <button onClick={openAdd} className="w-8 h-8 flex items-center justify-center rounded-full bg-teal-500 text-white shadow-sm active:scale-95 transition-all">
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                        type="text"
                        placeholder="Search by employee or date..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm"
                    />
                </div>
            </div>

            <div className="px-4 space-y-3">
                {isLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mb-2" />
                        <p className="text-sm">Loading records...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                        <p className="text-sm">No attendance records found.</p>
                    </div>
                ) : (
                    filtered.map(record => {
                        const emp = employees.find(e => e.id === record.employee_id);
                        const isPresent = record.status === 'present';
                        
                        return (
                            <div key={record.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden group">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", isPresent ? "bg-teal-50 text-teal-600" : "bg-rose-50 text-rose-600")}>
                                            {isPresent ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900">{emp ? emp.name : 'Unknown Employee'}</h3>
                                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                                                <Calendar className="w-3 h-3" />
                                                <span>{record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider",
                                        isPresent ? "bg-teal-100 text-teal-700" : "bg-rose-100 text-rose-700"
                                    )}>
                                        {record.status}
                                    </span>
                                </div>
                                
                                {(record.check_in || record.check_out) && (
                                    <div className="flex items-center gap-4 mt-3 text-sm text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                        {record.check_in && (
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                <span className="font-medium text-slate-700">In:</span> {record.check_in.substring(0,5)}
                                            </div>
                                        )}
                                        {record.check_out && (
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                <span className="font-medium text-slate-700">Out:</span> {record.check_out.substring(0,5)}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {record.notes && (
                                    <p className="mt-3 text-sm text-slate-600 italic">"{record.notes}"</p>
                                )}

                                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEdit(record)} className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(record.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100">
                            <h2 className="font-semibold text-lg">{form.id ? 'Edit' : 'Add'} Attendance</h2>
                            <button onClick={() => setIsFormOpen(false)} className="p-2 rounded-full hover:bg-slate-100">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        
                        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Employee</label>
                                <select 
                                    value={form.employee_id} 
                                    onChange={e => setForm({...form, employee_id: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                >
                                    <option value="">Select Employee...</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                                    <input 
                                        type="date" 
                                        value={form.date} 
                                        onChange={e => setForm({...form, date: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                                    <select 
                                        value={form.status} 
                                        onChange={e => setForm({...form, status: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                    >
                                        <option value="present">Present</option>
                                        <option value="absent">Absent</option>
                                        <option value="half_day">Half Day</option>
                                        <option value="leave">Leave</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Check In</label>
                                    <input 
                                        type="time" 
                                        value={form.check_in || ""} 
                                        onChange={e => setForm({...form, check_in: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Check Out</label>
                                    <input 
                                        type="time" 
                                        value={form.check_out || ""} 
                                        onChange={e => setForm({...form, check_out: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
                                <textarea 
                                    value={form.notes || ""} 
                                    onChange={e => setForm({...form, notes: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none"
                                    rows={3}
                                    placeholder="Optional notes..."
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50">
                            <button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full py-3 bg-teal-600 text-white font-medium rounded-xl disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center"
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Attendance'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PageTransition>
    );
}
