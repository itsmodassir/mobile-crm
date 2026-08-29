import { useState, useEffect } from 'react';
import { PageTransition } from '../../components/MotionWrapper';
import { ChevronLeft, Plus, Search, Loader2, X, Trash2, Edit2, Mail, Phone, Building, DollarSign, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth, API_BASE_URL } from '../../lib/auth';
import { cn } from '../../lib/cn';

const newEmployee = () => ({ 
    name: "", email: "", phone: "", country_code: "+1", currency: "INR", role: "", department: "", salary: 0, status: "active", join_date: new Date().toISOString().split('T')[0] 
});

export function Employees() {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [form, setForm] = useState<any>(newEmployee());
    const [isSaving, setIsSaving] = useState(false);
    const [globalCurrency, setGlobalCurrency] = useState(localStorage.getItem('crm_currency') || 'INR');

    const loadEmployees = async () => {
        setIsLoading(true);
        try {
            const token = auth.getToken();
            const workspaceId = auth.getWorkspaceId();
            if (!token || !workspaceId) return;

            const res = await axios.post(
                `${API_BASE_URL}/data/crm_employees`,
                { action: 'select', filters: [{ column: 'workspace_id', operator: 'eq', value: workspaceId }] },
                { headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': workspaceId } }
            );
            
            const rows = res.data?.data || res.data || [];
            setEmployees(Array.isArray(rows) ? rows : []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadEmployees();
    }, []);

    const filtered = employees.filter(e => 
        (e.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.department || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.role || '').toLowerCase().includes(search.toLowerCase())
    );

    const openAdd = () => {
        setForm(newEmployee());
        setIsFormOpen(true);
    };

    const openEdit = (emp: any) => {
        let cc = "+1";
        let num = emp.phone || "";
        if (num.includes(" ")) {
            const parts = num.split(" ");
            cc = parts[0];
            num = parts.slice(1).join(" ");
        }
        setForm({ ...emp, country_code: cc, phone: num, currency: globalCurrency });
        setIsFormOpen(true);
    };

    const handleSave = async () => {
        if (!form.name) {
            alert('Name is required');
            return;
        }
        setIsSaving(true);
        try {
            const token = auth.getToken();
            const workspaceId = auth.getWorkspaceId();
            if (!token || !workspaceId) return;

            if (form.currency && form.currency !== globalCurrency) {
                setGlobalCurrency(form.currency);
                localStorage.setItem('crm_currency', form.currency);
            }

            const finalPhone = form.phone ? `${form.country_code} ${form.phone}` : "";
            const { country_code, currency, ...dbData } = form;
            const dataToPush = { ...dbData, phone: finalPhone, workspace_id: workspaceId };

            await axios.post(
                `${API_BASE_URL}/data/crm_employees`,
                { 
                    action: form.id ? 'update' : 'insert', 
                    data: dataToPush,
                    ...(form.id ? { filters: [{ column: 'id', operator: 'eq', value: form.id }] } : {})
                },
                { headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': workspaceId } }
            );

            await loadEmployees();
            setIsFormOpen(false);
        } catch (err) {
            console.error(err);
            alert('Failed to save employee');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this employee?')) return;
        
        try {
            const token = auth.getToken();
            const workspaceId = auth.getWorkspaceId();
            if (!token || !workspaceId) return;

            await axios.post(
                `${API_BASE_URL}/data/crm_employees`,
                { action: 'delete', filters: [{ column: 'id', operator: 'eq', value: id }] },
                { headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': workspaceId } }
            );
            await loadEmployees();
        } catch (err) {
            console.error(err);
            alert('Failed to delete employee');
        }
    };

    return (
        <PageTransition className="min-h-screen bg-slate-50/50 pb-20">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center gap-3 safe-top">
                <button 
                    onClick={() => navigate('/advance-crm')}
                    className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
                >
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-bold">Employees</h1>
                    <p className="text-xs text-muted-foreground">{employees.length} team members</p>
                </div>
                <button 
                    onClick={openAdd}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-500 text-white shadow-sm active:scale-95 transition-all"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            {/* Search */}
            <div className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                        type="text"
                        placeholder="Search employees..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* List */}
            <div className="px-4 space-y-3">
                {isLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mb-2" />
                        <p className="text-sm">Loading employees...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                        <p className="text-sm">No employees found.</p>
                    </div>
                ) : (
                    filtered.map(emp => (
                        <div key={emp.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden group">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-semibold text-slate-900">{emp.name}</h3>
                                    <p className="text-sm text-indigo-600 font-medium">{emp.role}</p>
                                </div>
                                <span className={cn(
                                    "px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider",
                                    emp.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                )}>
                                    {emp.status}
                                </span>
                            </div>
                            
                            <div className="space-y-2 mt-4 text-sm text-slate-600">
                                {emp.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-slate-400" />
                                        <a href={`mailto:${emp.email}`} className="hover:text-indigo-600">{emp.email}</a>
                                    </div>
                                )}
                                {emp.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-slate-400" />
                                        <a href={`tel:${emp.phone}`} className="hover:text-indigo-600">{emp.phone}</a>
                                    </div>
                                )}
                                {emp.department && (
                                    <div className="flex items-center gap-2">
                                        <Building className="w-4 h-4 text-slate-400" />
                                        <span>{emp.department}</span>
                                    </div>
                                )}
                                {emp.salary > 0 && (
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-slate-400" />
                                        <span>{globalCurrency} {emp.salary.toLocaleString()} / mo</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    Joined {emp.join_date ? new Date(emp.join_date).toLocaleDateString() : 'N/A'}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openEdit(emp)} className="p-2 bg-slate-50 text-slate-600 rounded-lg active:scale-95 transition-all">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(emp.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg active:scale-95 transition-all">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Form Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100">
                            <h2 className="font-semibold text-lg">{form.id ? 'Edit' : 'Add'} Employee</h2>
                            <button onClick={() => setIsFormOpen(false)} className="p-2 rounded-full hover:bg-slate-100">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        
                        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                                <input 
                                    type="text" 
                                    value={form.name} 
                                    onChange={e => setForm({...form, name: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                    placeholder="John Doe"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                                    <input 
                                        type="email" 
                                        value={form.email} 
                                        onChange={e => setForm({...form, email: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
                                    <div className="flex">
                                        <select
                                            value={form.country_code}
                                            onChange={e => setForm({...form, country_code: e.target.value})}
                                            className="px-2 py-2 border border-slate-200 border-r-0 rounded-l-xl text-sm bg-slate-50 focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="+1">+1 (US)</option>
                                            <option value="+44">+44 (UK)</option>
                                            <option value="+91">+91 (IN)</option>
                                            <option value="+61">+61 (AU)</option>
                                            <option value="+971">+971 (UAE)</option>
                                        </select>
                                        <input 
                                            type="tel" 
                                            value={form.phone} 
                                            onChange={e => setForm({...form, phone: e.target.value})}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-r-xl text-sm focus:outline-none focus:border-indigo-500"
                                            placeholder="234 567 8900"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Role</label>
                                    <input 
                                        type="text" 
                                        value={form.role} 
                                        onChange={e => setForm({...form, role: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                        placeholder="Sales Manager"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Department</label>
                                    <input 
                                        type="text" 
                                        value={form.department} 
                                        onChange={e => setForm({...form, department: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                        placeholder="Sales"
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Salary</label>
                                    <div className="flex">
                                        <select
                                            value={form.currency}
                                            onChange={e => setForm({...form, currency: e.target.value})}
                                            className="px-2 py-2 border border-slate-200 border-r-0 rounded-l-xl text-sm bg-slate-50 focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="USD">USD ($)</option>
                                            <option value="EUR">EUR (€)</option>
                                            <option value="GBP">GBP (£)</option>
                                            <option value="INR">INR (₹)</option>
                                            <option value="AED">AED (د.إ)</option>
                                        </select>
                                        <input 
                                            type="number" 
                                            value={form.salary} 
                                            onChange={e => setForm({...form, salary: parseFloat(e.target.value) || 0})}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-r-xl text-sm focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Join Date</label>
                                    <input 
                                        type="date" 
                                        value={form.join_date?.split('T')[0]} 
                                        onChange={e => setForm({...form, join_date: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                                <select 
                                    value={form.status} 
                                    onChange={e => setForm({...form, status: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50">
                            <button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full py-3 bg-indigo-600 text-white font-medium rounded-xl disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center"
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Employee'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PageTransition>
    );
}
