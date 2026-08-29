import { useState, useEffect } from 'react';
import { PageTransition } from '../../components/MotionWrapper';
import { ChevronLeft, Plus, Search, Loader2, X, Trash2, Edit2, Calendar, Banknote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth, API_BASE_URL } from '../../lib/auth';
import { cn } from '../../lib/cn';

const newPayroll = () => {
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    return { 
        employee_id: "", period: currentMonth, base_salary: 0, bonus: 0, deductions: 0, net: 0, present_days: 0, status: "draft"
    };
};

export function Payroll() {
    const navigate = useNavigate();
    const [records, setRecords] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [form, setForm] = useState<any>(newPayroll());
    const [isSaving, setIsSaving] = useState(false);
    const globalCurrency = localStorage.getItem('crm_currency') || 'INR';

    const loadData = async () => {
        setIsLoading(true);
        try {
            const token = auth.getToken();
            const workspaceId = auth.getWorkspaceId();
            if (!token || !workspaceId) return;

            const [payRes, empRes] = await Promise.all([
                axios.post(
                    `${API_BASE_URL}/data/crm_payroll`,
                    { action: 'select', filters: [{ column: 'workspace_id', operator: 'eq', value: workspaceId }] },
                    { headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': workspaceId } }
                ),
                axios.post(
                    `${API_BASE_URL}/data/crm_employees`,
                    { action: 'select', filters: [{ column: 'workspace_id', operator: 'eq', value: workspaceId }] },
                    { headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': workspaceId } }
                )
            ]);
            
            const payRows = payRes.data?.data || payRes.data || [];
            const empRows = empRes.data?.data || empRes.data || [];
            
            setRecords(Array.isArray(payRows) ? payRows : []);
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
               (r.period && r.period.toLowerCase().includes(search.toLowerCase()));
    });

    // Sort by period descending
    filtered.sort((a, b) => b.period.localeCompare(a.period));

    const openAdd = () => {
        setForm(newPayroll());
        setIsFormOpen(true);
    };

    const openEdit = (record: any) => {
        setForm(record);
        setIsFormOpen(true);
    };

    const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const empId = e.target.value;
        const emp = employees.find(x => x.id === empId);
        setForm({
            ...form,
            employee_id: empId,
            base_salary: emp ? emp.salary : 0,
            net: emp ? emp.salary + form.bonus - form.deductions : form.net
        });
    };

    const handleCalcChange = (field: string, val: string) => {
        const num = parseFloat(val) || 0;
        const newForm = { ...form, [field]: num };
        newForm.net = newForm.base_salary + newForm.bonus - newForm.deductions;
        setForm(newForm);
    };

    const handleSave = async () => {
        if (!form.employee_id || !form.period) {
            alert('Employee and Period are required');
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
                paid_at: form.status === 'paid' && !form.paid_at ? new Date().toISOString() : form.paid_at
            };

            await axios.post(
                `${API_BASE_URL}/data/crm_payroll`,
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
            alert('Failed to save payroll record');
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
                `${API_BASE_URL}/data/crm_payroll`,
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
                    <h1 className="text-lg font-bold">Payroll</h1>
                    <p className="text-xs text-muted-foreground">{records.length} records</p>
                </div>
                <button onClick={openAdd} className="w-8 h-8 flex items-center justify-center rounded-full bg-green-500 text-white shadow-sm active:scale-95 transition-all">
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                        type="text"
                        placeholder="Search by employee or period (e.g. 2026-08)..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm"
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
                        <p className="text-sm">No payroll records found.</p>
                    </div>
                ) : (
                    filtered.map(record => {
                        const emp = employees.find(e => e.id === record.employee_id);
                        const isPaid = record.status === 'paid';
                        
                        return (
                            <div key={record.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden group">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", isPaid ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600")}>
                                            <Banknote className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900">{emp ? emp.name : 'Unknown Employee'}</h3>
                                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                                                <Calendar className="w-3 h-3" />
                                                <span>Period: {record.period}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider",
                                        isPaid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                                    )}>
                                        {record.status}
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100">
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Base Salary</p>
                                        <p className="font-medium text-slate-700 text-sm">{globalCurrency} {Number(record.base_salary).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Net Pay</p>
                                        <p className="font-semibold text-green-600 text-sm">{globalCurrency} {Number(record.net).toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <div className="text-xs text-slate-500">
                                        {record.present_days > 0 ? `${record.present_days} Days Present` : ''}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openEdit(record)} className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(record.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
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
                            <h2 className="font-semibold text-lg">{form.id ? 'Edit' : 'Create'} Payroll</h2>
                            <button onClick={() => setIsFormOpen(false)} className="p-2 rounded-full hover:bg-slate-100">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        
                        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Employee</label>
                                <select 
                                    value={form.employee_id} 
                                    onChange={handleEmployeeChange}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                >
                                    <option value="">Select Employee...</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.name} ({globalCurrency} {emp.salary})</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Period (Month)</label>
                                    <input 
                                        type="month" 
                                        value={form.period} 
                                        onChange={e => setForm({...form, period: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Present Days</label>
                                    <input 
                                        type="number" 
                                        value={form.present_days} 
                                        onChange={e => setForm({...form, present_days: parseInt(e.target.value) || 0})}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                    />
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50 rounded-xl space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Base Salary</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">{globalCurrency}</span>
                                        <input 
                                            type="number" 
                                            value={form.base_salary} 
                                            onChange={e => handleCalcChange('base_salary', e.target.value)}
                                            className="w-full pl-12 pr-3 py-2 border border-slate-200 rounded-xl text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Bonus (+)</label>
                                        <input 
                                            type="number" 
                                            value={form.bonus} 
                                            onChange={e => handleCalcChange('bonus', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-green-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Deductions (-)</label>
                                        <input 
                                            type="number" 
                                            value={form.deductions} 
                                            onChange={e => handleCalcChange('deductions', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-rose-600"
                                        />
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                                    <span className="text-sm font-medium text-slate-600">Net Pay:</span>
                                    <span className="text-lg font-bold text-green-600">{globalCurrency} {form.net.toLocaleString()}</span>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                                <select 
                                    value={form.status} 
                                    onChange={e => setForm({...form, status: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="paid">Paid</option>
                                </select>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50">
                            <button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full py-3 bg-green-600 text-white font-medium rounded-xl disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center"
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Payroll Record'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PageTransition>
    );
}
