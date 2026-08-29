import { useState, useEffect } from 'react';
import { PageTransition } from '../../components/MotionWrapper';
import { ChevronLeft, Plus, Search, Loader2, Trash2, X, Building, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth, API_BASE_URL } from '../../lib/auth';

const newClient = () => ({ name: "", company: "", email: "", phone: "", vertical: "", status: "prospect" });

export function Clients() {
    const navigate = useNavigate();
    const [clients, setClients] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [form, setForm] = useState<any>(newClient());
    const [isSaving, setIsSaving] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const token = auth.getToken();
            const workspaceId = auth.getWorkspaceId();
            if (!token || !workspaceId) return;

            const res = await axios.post(
                `${API_BASE_URL}/data/crm_clients`,
                { action: 'select', filters: [{ column: 'workspace_id', operator: 'eq', value: workspaceId }] },
                { headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': workspaceId } }
            );
            
            const rows = res.data?.data || res.data || [];
            setClients(Array.isArray(rows) ? rows : []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filtered = clients.filter(r => 
        (r.name && r.name.toLowerCase().includes(search.toLowerCase())) || 
        (r.company && r.company.toLowerCase().includes(search.toLowerCase())) ||
        (r.email && r.email.toLowerCase().includes(search.toLowerCase()))
    );

    const openAdd = () => {
        setForm(newClient());
        setIsFormOpen(true);
    };

    const openEdit = (record: any) => {
        setForm(record);
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

            const dataToPush = { ...form, workspace_id: workspaceId };

            await axios.post(
                `${API_BASE_URL}/data/crm_clients`,
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
            alert('Failed to save client');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this client?')) return;
        
        try {
            const token = auth.getToken();
            const workspaceId = auth.getWorkspaceId();
            if (!token || !workspaceId) return;

            await axios.post(
                `${API_BASE_URL}/data/crm_clients`,
                { action: 'delete', filters: [{ column: 'id', operator: 'eq', value: id }] },
                { headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': workspaceId } }
            );
            await loadData();
        } catch (err) {
            console.error(err);
            alert('Failed to delete client');
        }
    };

    return (
        <PageTransition className="min-h-screen bg-slate-50/50 pb-20">
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center gap-3 safe-top">
                <button onClick={() => navigate('/advance-crm')} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all">
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-bold">Clients</h1>
                    <p className="text-xs text-muted-foreground">{clients.length} Total</p>
                </div>
                <button onClick={openAdd} className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white shadow-sm active:scale-95 transition-all">
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div className="p-4">
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                        type="text"
                        placeholder="Search clients..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                    />
                </div>

                <div className="space-y-3">
                    {isLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                            <Loader2 className="w-6 h-6 animate-spin mb-2" />
                            <p className="text-sm">Loading clients...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-12 text-center text-slate-400">
                            <p className="text-sm">No clients found.</p>
                        </div>
                    ) : (
                        filtered.map(client => (
                            <div key={client.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                            {client.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900">{client.name}</h3>
                                            <p className="text-xs text-slate-500 capitalize">{client.status}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => openEdit(client)} className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors">
                                            Edit
                                        </button>
                                        <button onClick={() => handleDelete(client.id)} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                                    <div className="flex items-center gap-1.5 truncate">
                                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span className="truncate">{client.company || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 truncate">
                                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span className="truncate">{client.email || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 truncate col-span-2">
                                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span className="truncate">{client.phone || '-'}</span>
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
                            <h2 className="font-semibold text-lg">{form.id ? 'Edit' : 'Add'} Client</h2>
                            <button onClick={() => setIsFormOpen(false)} className="p-2 rounded-full hover:bg-slate-100">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        
                        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Name *</label>
                                <input 
                                    type="text" 
                                    value={form.name} 
                                    onChange={e => setForm({...form, name: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Company</label>
                                <input 
                                    type="text" 
                                    value={form.company || ''} 
                                    onChange={e => setForm({...form, company: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                                    <input 
                                        type="email" 
                                        value={form.email || ''} 
                                        onChange={e => setForm({...form, email: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
                                    <input 
                                        type="tel" 
                                        value={form.phone || ''} 
                                        onChange={e => setForm({...form, phone: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                                    <select 
                                        value={form.status || 'prospect'} 
                                        onChange={e => setForm({...form, status: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                    >
                                        <option value="prospect">Prospect</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Vertical</label>
                                    <input 
                                        type="text" 
                                        value={form.vertical || ''} 
                                        onChange={e => setForm({...form, vertical: e.target.value})}
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
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Client'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PageTransition>
    );
}
