import { useState, useEffect } from 'react';
import { PageTransition } from '../../components/MotionWrapper';
import { ChevronLeft, Plus, Search, Loader2, X, Trash2, Edit2, TrendingUp, TrendingDown, Wallet, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth, API_BASE_URL } from '../../lib/auth';
import { cn } from '../../lib/cn';

const newTransaction = () => ({ 
    type: "expense", category: "", description: "", amount: 0, date: new Date().toISOString().split('T')[0]
});

export function Accounts() {
    const navigate = useNavigate();
    const [records, setRecords] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [form, setForm] = useState<any>(newTransaction());
    const [isSaving, setIsSaving] = useState(false);
    const globalCurrency = localStorage.getItem('crm_currency') || 'INR';

    const loadData = async () => {
        setIsLoading(true);
        try {
            const token = auth.getToken();
            const workspaceId = auth.getWorkspaceId();
            if (!token || !workspaceId) return;

            const res = await axios.post(
                `${API_BASE_URL}/data/crm_expenses`,
                { action: 'select', filters: [{ column: 'workspace_id', operator: 'eq', value: workspaceId }] },
                { headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': workspaceId } }
            );
            
            const rows = res.data?.data || res.data || [];
            setRecords(Array.isArray(rows) ? rows : []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filtered = records.filter(r => 
        (r.description && r.description.toLowerCase().includes(search.toLowerCase())) || 
        (r.category && r.category.toLowerCase().includes(search.toLowerCase()))
    );

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalIncome = records.filter(r => r.type === 'income').reduce((sum, r) => sum + Number(r.amount), 0);
    const totalExpense = records.filter(r => r.type === 'expense').reduce((sum, r) => sum + Number(r.amount), 0);
    const netBalance = totalIncome - totalExpense;

    const openAdd = () => {
        setForm(newTransaction());
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
        if (!form.description || !form.amount) {
            alert('Description and Amount are required');
            return;
        }
        setIsSaving(true);
        try {
            const token = auth.getToken();
            const workspaceId = auth.getWorkspaceId();
            if (!token || !workspaceId) return;

            const dataToPush = { 
                ...form, 
                workspace_id: workspaceId
            };

            await axios.post(
                `${API_BASE_URL}/data/crm_expenses`,
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
            alert('Failed to save record');
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
                `${API_BASE_URL}/data/crm_expenses`,
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
                    <h1 className="text-lg font-bold">Accounts</h1>
                    <p className="text-xs text-muted-foreground">{records.length} transactions</p>
                </div>
                <button onClick={openAdd} className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white shadow-sm active:scale-95 transition-all">
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div className="p-4 grid grid-cols-2 gap-3">
                <div className="col-span-2 bg-slate-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-white/60 text-sm font-medium mb-1">Net Balance</p>
                            <h2 className="text-3xl font-bold">{globalCurrency} {netBalance.toLocaleString()}</h2>
                        </div>
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            <Wallet className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-emerald-600 mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wider">Income</span>
                    </div>
                    <p className="font-semibold text-lg text-slate-900">{globalCurrency} {totalIncome.toLocaleString()}</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-rose-600 mb-1">
                        <TrendingDown className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wider">Expense</span>
                    </div>
                    <p className="font-semibold text-lg text-slate-900">{globalCurrency} {totalExpense.toLocaleString()}</p>
                </div>
            </div>

            <div className="px-4 mb-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                        type="text"
                        placeholder="Search transactions..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                    />
                </div>
            </div>

            <div className="px-4 space-y-3">
                {isLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mb-2" />
                        <p className="text-sm">Loading transactions...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                        <p className="text-sm">No transactions found.</p>
                    </div>
                ) : (
                    filtered.map(record => {
                        const isIncome = record.type === 'income';
                        return (
                            <div key={record.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden group">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-3">
                                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5", isIncome ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                                            {isIncome ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-slate-900">{record.description}</h3>
                                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                                                <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-medium bg-slate-100 text-slate-600">
                                                    {record.category || 'Uncategorized'}
                                                </span>
                                                •
                                                <Calendar className="w-3 h-3 inline" />
                                                {record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn("font-bold", isIncome ? "text-emerald-600" : "text-rose-600")}>
                                            {isIncome ? '+' : '-'}{globalCurrency} {Number(record.amount).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-slate-50 flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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
                            <h2 className="font-semibold text-lg">{form.id ? 'Edit' : 'Add'} Transaction</h2>
                            <button onClick={() => setIsFormOpen(false)} className="p-2 rounded-full hover:bg-slate-100">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        
                        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                                <button
                                    className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-all", form.type === 'expense' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}
                                    onClick={() => setForm({...form, type: 'expense'})}
                                >
                                    Expense
                                </button>
                                <button
                                    className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-all", form.type === 'income' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}
                                    onClick={() => setForm({...form, type: 'income'})}
                                >
                                    Income
                                </button>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Amount</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">{globalCurrency}</span>
                                    <input 
                                        type="number" 
                                        value={form.amount} 
                                        onChange={e => setForm({...form, amount: parseFloat(e.target.value) || 0})}
                                        className="w-full pl-12 pr-3 py-3 border border-slate-200 rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                                <input 
                                    type="text" 
                                    value={form.description} 
                                    onChange={e => setForm({...form, description: e.target.value})}
                                    placeholder="e.g. Office Supplies"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                                    <input 
                                        type="text" 
                                        value={form.category} 
                                        onChange={e => setForm({...form, category: e.target.value})}
                                        placeholder="e.g. Utilities"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                                    <input 
                                        type="date" 
                                        value={form.date} 
                                        onChange={e => setForm({...form, date: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50">
                            <button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center"
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Transaction'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PageTransition>
    );
}
