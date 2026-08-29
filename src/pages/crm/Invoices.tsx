import { useState, useEffect } from 'react';
import { PageTransition } from '../../components/MotionWrapper';
import { ChevronLeft, Plus, Search, Loader2, Trash2, X, Calendar, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth, API_BASE_URL } from '../../lib/auth';
import { cn } from '../../lib/cn';

const newInvoice = () => ({ number: `INV-${Math.floor(1000 + Math.random() * 9000)}`, status: "draft", currency: localStorage.getItem('crm_currency') || "INR", total: 0, due_date: "" });

export function Invoices() {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [form, setForm] = useState<any>(newInvoice());
    const [isSaving, setIsSaving] = useState(false);
    const globalCurrency = localStorage.getItem('crm_currency') || 'INR';

    const loadData = async () => {
        setIsLoading(true);
        try {
            const token = auth.getToken();
            const workspaceId = auth.getWorkspaceId();
            if (!token || !workspaceId) return;

            const res = await axios.post(
                `${API_BASE_URL}/data/crm_invoices`,
                { action: 'select', filters: [{ column: 'workspace_id', operator: 'eq', value: workspaceId }] },
                { headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': workspaceId } }
            );
            
            const rows = res.data?.data || res.data || [];
            setInvoices(Array.isArray(rows) ? rows : []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filtered = invoices.filter(r => 
        (r.number && r.number.toLowerCase().includes(search.toLowerCase())) || 
        (r.status && r.status.toLowerCase().includes(search.toLowerCase()))
    );

    const openAdd = () => {
        setForm(newInvoice());
        setIsFormOpen(true);
    };

    const openEdit = (record: any) => {
        setForm({
            ...record,
            due_date: record.due_date ? new Date(record.due_date).toISOString().split('T')[0] : ""
        });
        setIsFormOpen(true);
    };

    const handleSave = async () => {
        if (!form.number) {
            alert('Invoice number is required');
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
                due_date: form.due_date || null
            };

            await axios.post(
                `${API_BASE_URL}/data/crm_invoices`,
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
            alert('Failed to save invoice');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this invoice?')) return;
        
        try {
            const token = auth.getToken();
            const workspaceId = auth.getWorkspaceId();
            if (!token || !workspaceId) return;

            await axios.post(
                `${API_BASE_URL}/data/crm_invoices`,
                { action: 'delete', filters: [{ column: 'id', operator: 'eq', value: id }] },
                { headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': workspaceId } }
            );
            await loadData();
        } catch (err) {
            console.error(err);
            alert('Failed to delete invoice');
        }
    };

    return (
        <PageTransition className="min-h-screen bg-slate-50/50 pb-20">
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center gap-3 safe-top">
                <button onClick={() => navigate('/advance-crm')} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all">
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-bold">Invoices</h1>
                    <p className="text-xs text-muted-foreground">{invoices.length} Invoices</p>
                </div>
                <button onClick={openAdd} className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm active:scale-95 transition-all">
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div className="p-4">
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                        type="text"
                        placeholder="Search invoices..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                    />
                </div>

                <div className="space-y-3">
                    {isLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                            <Loader2 className="w-6 h-6 animate-spin mb-2" />
                            <p className="text-sm">Loading invoices...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-12 text-center text-slate-400">
                            <p className="text-sm">No invoices found.</p>
                        </div>
                    ) : (
                        filtered.map(inv => (
                            <div key={inv.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 pr-4">
                                        <h3 className="font-semibold text-slate-900">{inv.number}</h3>
                                        <div className="flex gap-2 mt-1">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                                inv.status === 'paid' ? "bg-emerald-100 text-emerald-700" :
                                                inv.status === 'sent' ? "bg-blue-100 text-blue-700" :
                                                inv.status === 'overdue' ? "bg-rose-100 text-rose-700" :
                                                "bg-slate-100 text-slate-700"
                                            )}>
                                                {inv.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button onClick={() => openEdit(inv)} className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors">
                                            Edit
                                        </button>
                                        <button onClick={() => handleDelete(inv.id)} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                                    <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                                        <DollarSign className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate">{inv.currency || globalCurrency} {Number(inv.total).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 truncate">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span className="truncate">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'No due date'}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100">
                            <h2 className="font-semibold text-lg">{form.id ? 'Edit' : 'Add'} Invoice</h2>
                            <button onClick={() => setIsFormOpen(false)} className="p-2 rounded-full hover:bg-slate-100">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        
                        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Invoice Number *</label>
                                    <input 
                                        type="text" 
                                        value={form.number} 
                                        onChange={e => setForm({...form, number: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                                    <select 
                                        value={form.status} 
                                        onChange={e => setForm({...form, status: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm capitalize"
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="sent">Sent</option>
                                        <option value="paid">Paid</option>
                                        <option value="overdue">Overdue</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Total Amount</label>
                                    <input 
                                        type="number" 
                                        value={form.total} 
                                        onChange={e => setForm({...form, total: parseFloat(e.target.value) || 0})}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Currency</label>
                                    <input 
                                        type="text" 
                                        value={form.currency} 
                                        onChange={e => setForm({...form, currency: e.target.value.toUpperCase()})}
                                        maxLength={3}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Due Date</label>
                                <input 
                                    type="date" 
                                    value={form.due_date} 
                                    onChange={e => setForm({...form, due_date: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50">
                            <button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full py-3 bg-emerald-600 text-white font-medium rounded-xl disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center"
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Invoice'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PageTransition>
    );
}
