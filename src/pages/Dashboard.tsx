import { useEffect, useState, useMemo, memo } from 'react';
import { Plus, Search, CheckSquare, Trash2, MessageCircle, X, TrendingUp, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../lib/storage';
import { LeadCard } from '../components/LeadCard';
import { StatsRow } from '../components/StatsRow';
import type { Lead, MessageTemplate } from '../types';
import { cn } from '../lib/cn';
import { CATEGORIES, type Category } from '../lib/constants';
import { PageTransition } from '../components/MotionWrapper';
import { motion, AnimatePresence } from 'framer-motion';

// Memoized LeadCard to prevent unnecessary re-renders of the entire list
const MemoizedLeadCard = memo(LeadCard);

export function Dashboard() {
    const navigate = useNavigate();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Hot' | 'Warm' | 'Cold' | 'Fresh'>('All');
    const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All');
    const [loading, setLoading] = useState(true);

    // Bulk Selection State
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Template Modal State
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [userProfile, setUserProfile] = useState({ name: '', avatar: '' });

    useEffect(() => {
        loadLeads();
        const savedTemplates = localStorage.getItem('crm_templates');
        if (savedTemplates) {
            setTemplates(JSON.parse(savedTemplates));
        }
        setUserProfile({
            name: localStorage.getItem('crm_user_name') || '',
            avatar: localStorage.getItem('crm_user_avatar') || ''
        });
    }, []);

    async function loadLeads() {
        // setLoading(true); // Don't show loading spinner on refresh to keep UI stable
        const data = await storage.getLeads();
        data.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        setLeads(data);
        setLoading(false);
    }

    // Optimized Filtering with useMemo and Fuzzy Matching
    const filteredLeads = useMemo(() => {
        return leads.filter(l => {
            const matchesSearch = l.title.toLowerCase().includes(search.toLowerCase()) ||
                l.phone.includes(search) ||
                l.city?.toLowerCase().includes(search.toLowerCase());

            const matchesStatus = statusFilter === 'All' || l.status === statusFilter;

            // Fuzzy Category Matching: "Real Estate" matches "Real Estate Agency"
            const matchesCategory = categoryFilter === 'All' ||
                (l.categoryName && l.categoryName.toLowerCase().includes(categoryFilter.toLowerCase()));

            return matchesSearch && matchesStatus && matchesCategory;
        });
    }, [leads, search, statusFilter, categoryFilter]);

    const handleCall = (lead: Lead) => {
        localStorage.setItem('crm_is_calling', lead.id);
        window.location.href = `tel:${lead.phone}`;
    };

    // Selection Handlers
    const toggleSelectionMode = () => {
        setSelectionMode(!selectionMode);
        setSelectedIds(new Set());
    };

    const handleToggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedIds.size === filteredLeads.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredLeads.map(l => l.id)));
        }
    };

    const [showStatusModal, setShowStatusModal] = useState(false);

    // Bulk Actions
    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedIds.size} leads? This cannot be undone.`)) return;

        for (const id of selectedIds) {
            await storage.deleteLead(id);
        }

        await loadLeads();
        setSelectionMode(false);
        setSelectedIds(new Set());
    };

    const handleBulkWhatsApp = (template: MessageTemplate) => {
        setShowTemplateModal(false);
        const selectedLeads = leads.filter(l => selectedIds.has(l.id));

        if (confirm(`Ready to send to ${selectedLeads.length} leads?\n\nI will open WhatsApp for each lead sequentially. Please send the message and return here to continue.`)) {
            processWhatsAppQueue(selectedLeads, template.content);
        }
    };

    const handleBulkEmail = () => {
        const selectedLeads = leads.filter(l => selectedIds.has(l.id));
        const emails = selectedLeads.map(l => l.email).filter(Boolean);

        if (emails.length === 0) {
            alert('No emails found in selected leads.');
            return;
        }

        const mailto = `mailto:?bcc=${emails.join(',')}`;
        window.open(mailto, '_blank');
        setSelectionMode(false);
        setSelectedIds(new Set());
    };

    const handleBulkStatus = async (newStatus: 'Fresh' | 'Hot' | 'Warm' | 'Cold' | 'Dead') => {
        setShowStatusModal(false);
        const updates = Array.from(selectedIds).map(id => ({ id, status: newStatus } as Lead));
        await storage.bulkSaveLeads(updates);
        await loadLeads();
        setSelectionMode(false);
        setSelectedIds(new Set());
    };

    const processWhatsAppQueue = async (queue: Lead[], message: string) => {
        setIsSenderMode(true);
        setSenderQueue(queue);
        setSenderMessage(message);
    };

    const [isSenderMode, setIsSenderMode] = useState(false);
    const [senderQueue, setSenderQueue] = useState<Lead[]>([]);
    const [senderMessage, setSenderMessage] = useState('');

    return (
        <PageTransition className="safe-top min-h-screen pb-32">
            <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-md pb-4 pt-4 px-4 border-b border-white/5 space-y-4 shadow-sm">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {!selectionMode && userProfile.avatar && (
                            <img src={userProfile.avatar} alt="Profile" className="w-8 h-8 rounded-full border border-white/10 object-cover shadow-sm" />
                        )}
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent truncate max-w-[200px]">
                            {selectionMode ? `${selectedIds.size} Selected` : (userProfile.name ? `Hello, ${userProfile.name}` : 'My Leads')}
                        </h1>
                    </div>

                    <div className="flex gap-2">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/reports')}
                            className="p-3 rounded-full border border-border bg-card text-zinc-400 hover:text-primary transition-colors"
                        >
                            <TrendingUp size={20} />
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={toggleSelectionMode}
                            className={cn(
                                "p-3 rounded-full shadow-lg transition-colors border",
                                selectionMode ? "bg-zinc-800 text-white border-zinc-700" : "bg-card text-zinc-400 border-border"
                            )}
                        >
                            {selectionMode ? <X size={20} /> : <CheckSquare size={20} />}
                        </motion.button>

                        {!selectionMode && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/add')}
                                className="bg-primary text-primary-foreground p-3 rounded-full shadow-lg shadow-primary/20"
                            >
                                <Plus size={20} />
                            </motion.button>
                        )}
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input
                        type="text"
                        placeholder="Search leads..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-card border border-border rounded-xl h-10 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium placeholder:text-muted-foreground"
                    />
                </div>

                {/* Status Filters */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {['All', 'Hot', 'Warm', 'Fresh', 'Cold'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s as any)}
                            className={cn(
                                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border",
                                statusFilter === s
                                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/10 scale-105"
                                    : "bg-card border-border text-muted-foreground hover:bg-zinc-800 active:scale-95"
                            )}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                {/* Category Filters */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 pt-1 border-t border-white/5">
                    <button
                        onClick={() => setCategoryFilter('All')}
                        className={cn(
                            "px-4 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all border",
                            categoryFilter === 'All'
                                ? "bg-zinc-100 text-zinc-900 border-white shadow-sm"
                                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 active:scale-95"
                        )}
                    >
                        All Categories
                    </button>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={cn(
                                "px-4 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all border",
                                categoryFilter === cat
                                    ? "bg-zinc-100 text-zinc-900 border-white shadow-sm"
                                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 active:scale-95"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </header>

            <div className="px-4 py-4 space-y-6">
                {selectionMode && (
                    <div className="flex justify-between items-center bg-zinc-800/50 p-3 rounded-xl border border-white/5">
                        <span className="text-sm font-medium text-zinc-400">Select All Visible</span>
                        <button onClick={handleSelectAll} className="text-primary text-sm font-bold">
                            {selectedIds.size === filteredLeads.length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>
                )}

                {!loading && !selectionMode && <StatsRow leads={leads} />}

                {loading ? (
                    <div className="text-center text-muted-foreground mt-20 animate-pulse">Loading leads...</div>
                ) : (
                    // REMOVED heavy layout animations (motion.div wrapping list) for performance
                    <div className="space-y-4">
                        {filteredLeads.length === 0 ? (
                            <div className="text-center text-muted-foreground mt-10 p-8 border border-dashed border-border rounded-xl">
                                <p>No leads found.</p>
                            </div>
                        ) : (
                            filteredLeads.map(lead => (
                                <MemoizedLeadCard
                                    key={lead.id}
                                    lead={lead}
                                    onCall={handleCall}
                                    onClick={(l) => navigate(`/leads/${l.id}`)}
                                    selectionMode={selectionMode}
                                    isSelected={selectedIds.has(lead.id)}
                                    onToggleSelect={handleToggleSelect}
                                />
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Bulk Action Toolbar */}
            <AnimatePresence>
                {selectionMode && selectedIds.size > 0 && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-6 left-4 right-4 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-2 z-50 flex items-center justify-between gap-2"
                    >
                        <button
                            onClick={() => setShowTemplateModal(true)}
                            className="flex-1 px-3 py-3 bg-green-600 text-green-100 rounded-xl font-medium text-xs flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
                        >
                            <MessageCircle size={18} />
                            <span>WhatsApp</span>
                        </button>

                        <button
                            onClick={handleBulkEmail}
                            className="flex-1 px-3 py-3 bg-blue-600 text-blue-100 rounded-xl font-medium text-xs flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
                        >
                            <Mail size={18} />
                            <span>Email</span>
                        </button>

                        <button
                            onClick={() => setShowStatusModal(true)}
                            className="flex-1 px-3 py-3 bg-zinc-700 text-zinc-100 rounded-xl font-medium text-xs flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
                        >
                            <CheckSquare size={18} />
                            <span>Status</span>
                        </button>

                        <button
                            onClick={handleBulkDelete}
                            className="px-4 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl active:scale-95 transition-transform flex items-center"
                        >
                            <Trash2 size={18} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Helper Modals */}
            {showTemplateModal && (
                <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
                    <div className="bg-card w-full max-w-sm rounded-2xl border border-border p-4 space-y-4 animate-in slide-in-from-bottom">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold">Select Template</h3>
                            <button onClick={() => setShowTemplateModal(false)}><X size={20} /></button>
                        </div>
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                            {templates.length === 0 && <p className="text-sm text-zinc-500">No templates found in Settings.</p>}
                            {templates.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => handleBulkWhatsApp(t)}
                                    className="w-full text-left p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 border border-white/5 transition-colors"
                                >
                                    <h4 className="font-medium text-sm">{t.name}</h4>
                                    <p className="text-xs text-muted-foreground truncate opacity-70">{t.content}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {showStatusModal && (
                <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
                    <div className="bg-card w-full max-w-sm rounded-2xl border border-border p-4 space-y-4 animate-in slide-in-from-bottom">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold">Update Status</h3>
                            <button onClick={() => setShowStatusModal(false)}><X size={20} /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {['Fresh', 'Hot', 'Warm', 'Cold', 'Dead'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => handleBulkStatus(s as any)}
                                    className={cn(
                                        "p-3 rounded-xl border font-medium text-sm transition-colors",
                                        s === 'Hot' && "border-orange-500/30 bg-orange-500/10 text-orange-400",
                                        s === 'Warm' && "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
                                        s === 'Cold' && "border-blue-500/30 bg-blue-500/10 text-blue-400",
                                        s === 'Fresh' && "border-green-500/30 bg-green-500/10 text-green-400",
                                        s === 'Dead' && "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
                                    )}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {isSenderMode && (
                <div className="fixed inset-0 z-[60] bg-background flex flex-col">
                    <header className="p-4 border-b border-border flex justify-between items-center">
                        <h2 className="font-bold">Bulk Sender Queue</h2>
                        <button onClick={() => { setIsSenderMode(false); setSelectionMode(false); setSelectedIds(new Set()); }}>Close</button>
                    </header>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        <p className="text-sm text-muted-foreground text-center mb-4">Tap 'Send' for each lead to open WhatsApp.</p>
                        {senderQueue.map((lead) => (
                            <div key={lead.id} className="p-3 bg-card border border-border rounded-xl flex justify-between items-center">
                                <div>
                                    <h3 className="font-medium text-sm">{lead.title}</h3>
                                    <p className="text-xs text-muted-foreground">{lead.phone}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        const cleanPhone = lead.phone.replace(/\D/g, '');
                                        const country = localStorage.getItem('crm_default_country') || '';
                                        let finalPhone = cleanPhone;
                                        if (country && !cleanPhone.startsWith(country) && cleanPhone.length <= 10) {
                                            finalPhone = `${country}${cleanPhone}`;
                                        }
                                        const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(senderMessage)}`;
                                        window.open(url, '_blank');
                                    }}
                                    className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-green-500 active:scale-95 transition-transform"
                                >
                                    Send
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </PageTransition>
    );
}
