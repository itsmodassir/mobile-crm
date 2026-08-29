import { useState, useEffect } from 'react';
import { PageTransition } from '../../components/MotionWrapper';
import { ChevronLeft, Plus, Search, Loader2, X, Trash2, ShoppingBag, Link2, ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth, API_BASE_URL } from '../../lib/auth';
import { cn } from '../../lib/cn';

const newProduct = () => ({ 
    retailer_id: "", name: "", description: "", price: 0, currency: localStorage.getItem('crm_currency') || "INR", availability: "in_stock", image_url: "", url: ""
});

export function Catalogue() {
    const navigate = useNavigate();
    const [tab, setTab] = useState<'custom' | 'meta'>('custom');
    
    // Custom Catalog State
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [form, setForm] = useState<any>(newProduct());
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const globalCurrency = localStorage.getItem('crm_currency') || 'INR';

    // Meta Catalog State
    const [metaCatalogId, setMetaCatalogId] = useState(localStorage.getItem('meta_catalog_id') || '');
    const [isSyncing, setIsSyncing] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const token = auth.getToken();
            const workspaceId = auth.getWorkspaceId();
            if (!token || !workspaceId) return;

            const res = await axios.post(
                `${API_BASE_URL}/data/bot_products`,
                { action: 'select', filters: [{ column: 'workspace_id', operator: 'eq', value: workspaceId }] },
                { headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': workspaceId } }
            );
            
            const rows = res.data?.data || res.data || [];
            setProducts(Array.isArray(rows) ? rows : []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (tab === 'custom') {
            loadData();
        }
    }, [tab]);

    const filtered = products.filter(r => 
        (r.name && r.name.toLowerCase().includes(search.toLowerCase())) || 
        (r.description && r.description.toLowerCase().includes(search.toLowerCase())) ||
        (r.retailer_id && r.retailer_id.toLowerCase().includes(search.toLowerCase()))
    );

    const openAdd = () => {
        setForm(newProduct());
        setIsFormOpen(true);
    };

    const openEdit = (record: any) => {
        setForm(record);
        setIsFormOpen(true);
    };

    const handleSave = async () => {
        if (!form.retailer_id) {
            alert('Retailer ID / SKU is required');
            return;
        }
        if (!form.name) {
            alert('Product name is required');
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
                `${API_BASE_URL}/data/bot_products`,
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
            alert('Failed to save product');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        
        try {
            const token = auth.getToken();
            const workspaceId = auth.getWorkspaceId();
            if (!token || !workspaceId) return;

            await axios.post(
                `${API_BASE_URL}/data/bot_products`,
                { action: 'delete', filters: [{ column: 'id', operator: 'eq', value: id }] },
                { headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': workspaceId } }
            );
            await loadData();
        } catch (err) {
            console.error(err);
            alert('Failed to delete product');
        }
    };

    const handleMetaSync = () => {
        if (!metaCatalogId) return;
        setIsSyncing(true);
        localStorage.setItem('meta_catalog_id', metaCatalogId);
        // Simulate sync
        setTimeout(() => {
            setIsSyncing(false);
            alert('Meta Catalog synced successfully! (Simulated for frontend)');
        }, 2000);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setForm({ ...form, image_url: base64 });
            setIsUploading(false);
        };
        reader.readAsDataURL(file);
    };

    return (
        <PageTransition className="min-h-screen bg-slate-50/50 pb-20">
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center gap-3 safe-top">
                <button onClick={() => navigate('/advance-crm')} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all">
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-bold">Catalogue</h1>
                    <p className="text-xs text-muted-foreground">{tab === 'custom' ? `${products.length} products` : 'Meta Integration'}</p>
                </div>
                {tab === 'custom' && (
                    <button onClick={openAdd} className="w-8 h-8 flex items-center justify-center rounded-full bg-pink-500 text-white shadow-sm active:scale-95 transition-all">
                        <Plus className="w-5 h-5" />
                    </button>
                )}
            </div>

            <div className="p-4">
                <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                    <button 
                        onClick={() => setTab('custom')}
                        className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-all", tab === 'custom' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}
                    >
                        Custom Catalogue
                    </button>
                    <button 
                        onClick={() => setTab('meta')}
                        className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-all", tab === 'meta' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}
                    >
                        Meta Catalogue
                    </button>
                </div>

                {tab === 'custom' ? (
                    <>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input 
                                type="text"
                                placeholder="Search products..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all shadow-sm"
                            />
                        </div>

                        <div className="space-y-3">
                            {isLoading ? (
                                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                                    <Loader2 className="w-6 h-6 animate-spin mb-2" />
                                    <p className="text-sm">Loading products...</p>
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="py-12 text-center text-slate-400">
                                    <p className="text-sm">No products found.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {filtered.map(product => (
                                        <div key={product.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm relative group flex flex-col">
                                            <div className="aspect-square bg-slate-100 relative">
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                        <ImageIcon className="w-8 h-8" />
                                                    </div>
                                                )}
                                                <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-sm text-slate-700 shadow-sm">
                                                    {product.availability === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                                                </div>
                                            </div>
                                            <div className="p-3 flex flex-col flex-1">
                                                <h3 className="font-semibold text-slate-900 text-sm line-clamp-1">{product.name}</h3>
                                                <p className="text-[10px] text-slate-500 mb-1">SKU: {product.retailer_id}</p>
                                                <p className="text-pink-600 font-bold">{product.currency || globalCurrency} {Number(product.price).toLocaleString()}</p>
                                                <div className="mt-auto pt-3 flex gap-2">
                                                    <button onClick={() => openEdit(product)} className="flex-1 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors">
                                                        Edit
                                                    </button>
                                                    <button onClick={() => handleDelete(product.id)} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                                <Link2 className="w-6 h-6" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-900 mb-1">Connect Meta Catalog</h2>
                            <p className="text-sm text-slate-500 mb-4">Sync your Facebook/Instagram Commerce Manager catalog directly with your CRM.</p>
                            
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Meta Catalog ID</label>
                                    <input 
                                        type="text" 
                                        value={metaCatalogId}
                                        onChange={e => setMetaCatalogId(e.target.value)}
                                        placeholder="e.g. 123456789012345"
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>
                                <button 
                                    onClick={handleMetaSync}
                                    disabled={!metaCatalogId || isSyncing}
                                    className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                    {isSyncing ? 'Syncing...' : 'Save & Sync'}
                                </button>
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                            <ShoppingBag className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-800">
                                This will enable two-way syncing of your products. Ensure your WhatsApp Business Account has permission to access this catalog.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100">
                            <h2 className="font-semibold text-lg">{form.id ? 'Edit' : 'Add'} Product</h2>
                            <button onClick={() => setIsFormOpen(false)} className="p-2 rounded-full hover:bg-slate-100">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        
                        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Retailer ID / SKU *</label>
                                    <input 
                                        type="text" 
                                        value={form.retailer_id} 
                                        onChange={e => setForm({...form, retailer_id: e.target.value})}
                                        placeholder="SKU-001"
                                        disabled={!!form.id}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm disabled:bg-slate-50 disabled:text-slate-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Availability</label>
                                    <select 
                                        value={form.availability} 
                                        onChange={e => setForm({...form, availability: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                    >
                                        <option value="in_stock">In Stock</option>
                                        <option value="out_of_stock">Out of Stock</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Name *</label>
                                <input 
                                    type="text" 
                                    value={form.name} 
                                    onChange={e => setForm({...form, name: e.target.value})}
                                    placeholder="Product name"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Price</label>
                                    <input 
                                        type="number" 
                                        value={form.price} 
                                        onChange={e => setForm({...form, price: parseFloat(e.target.value) || 0})}
                                        placeholder="1999"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Currency</label>
                                    <input 
                                        type="text" 
                                        value={form.currency} 
                                        onChange={e => setForm({...form, currency: e.target.value.toUpperCase()})}
                                        placeholder="INR"
                                        maxLength={3}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                                <textarea 
                                    value={form.description || ''} 
                                    onChange={e => setForm({...form, description: e.target.value})}
                                    rows={2}
                                    placeholder="Short product description"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Product link (optional)</label>
                                <input 
                                    type="url" 
                                    value={form.url || ''} 
                                    onChange={e => setForm({...form, url: e.target.value})}
                                    placeholder="https://your-store.com/product"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Image *</label>
                                <div className="flex items-center gap-3">
                                    <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 relative">
                                        {form.image_url ? (
                                            <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                <ImageIcon className="w-6 h-6" />
                                            </div>
                                        )}
                                        {isUploading && (
                                            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                                                <Loader2 className="w-4 h-4 animate-spin text-pink-600" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex">
                                            <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                                                <ImageIcon className="w-3.5 h-3.5" />
                                                Upload Image
                                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                            </label>
                                        </div>
                                        <input 
                                            type="url" 
                                            value={form.image_url || ''} 
                                            onChange={e => setForm({...form, image_url: e.target.value})}
                                            placeholder="...or paste a public URL"
                                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50">
                            <button 
                                onClick={handleSave}
                                disabled={isSaving || isUploading}
                                className="w-full py-3 bg-pink-600 text-white font-medium rounded-xl disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center"
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (form.id ? 'Save to Meta' : 'Add to Meta')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PageTransition>
    );
}

// Add RefreshCw icon manually since it wasn't imported
function RefreshCw(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
        </svg>
    )
}
