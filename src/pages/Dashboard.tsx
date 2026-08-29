import { useEffect, useState, useMemo, memo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Search, CheckSquare, Trash2, MessageCircle, X, TrendingUp, Mail, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../lib/storage';
import { apiSync } from '../lib/apiSync';
import { LeadCard } from '../components/LeadCard';
import type { Lead, MessageTemplate, CustomStatus } from '../types';
import { cn } from '../lib/cn';
import { CATEGORIES, DEFAULT_STATUSES, type Category } from '../lib/constants';
import { PageTransition } from '../components/MotionWrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { AdBanner } from '../components/AdBanner';

// Memoized LeadCard to prevent unnecessary re-renders of the entire list
const MemoizedLeadCard = memo(LeadCard);

export function Dashboard() {
    const navigate = useNavigate();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All');
    const [customStatuses, setCustomStatuses] = useState<CustomStatus[]>(DEFAULT_STATUSES);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Bulk Selection State
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Template Modal State
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [userProfile, setUserProfile] = useState({ name: '', avatar: '' });

    // Single Lead WhatsApp State
    const [activeLeadForWhatsApp, setActiveLeadForWhatsApp] = useState<Lead | null>(null);
    const [draftMessage, setDraftMessage] = useState('');

    const [showWelcomeModal, setShowWelcomeModal] = useState(false);

    // Note Modal State
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [noteModalLead, setNoteModalLead] = useState<Lead | null>(null);
    const [noteModalText, setNoteModalText] = useState('');

    useEffect(() => {
        loadLeads();
        const savedTemplates = localStorage.getItem('crm_templates');
        if (savedTemplates) {
            setTemplates(JSON.parse(savedTemplates));
        }
        const wsId = localStorage.getItem('workspace_id') || 'default';
        setUserProfile({
            name: localStorage.getItem(`crm_user_name_${wsId}`) || localStorage.getItem('crm_user_name') || '',
            avatar: localStorage.getItem(`crm_user_avatar_${wsId}`) || localStorage.getItem('crm_user_avatar') || ''
        });

        // Check for First Run
        const hasSeenWelcome = localStorage.getItem('crm_has_seen_welcome');
        if (!hasSeenWelcome) {
            setShowWelcomeModal(true);
        }
    }, []);

    const handleWhatsAppClick = (lead: Lead) => {
        setActiveLeadForWhatsApp(lead);
        const defaultMsg = localStorage.getItem('crm_default_wa_msg') || '';
        setDraftMessage(defaultMsg);
        setShowTemplateModal(true);
    };

    const handleSendSingleWhatsApp = () => {
        if (!activeLeadForWhatsApp) return;

        const cleanPhone = activeLeadForWhatsApp.phone_number.replace(/\D/g, '');
        const country = localStorage.getItem('crm_default_country') || '';
        let finalPhone = cleanPhone;
        if (country && !cleanPhone.startsWith(country) && cleanPhone.length <= 10) {
            finalPhone = `${country}${cleanPhone}`;
        }

        const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(draftMessage)}`;
        window.open(url, '_blank');

        setShowTemplateModal(false);
        setActiveLeadForWhatsApp(null);
    };

    async function loadLeads() {
        // Fetch local first
        const data = await storage.getLeads();
        data.sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
        setLeads(data);
        setLoading(false);

        // Sync with backend in background
        try {
            setErrorMsg(null);
            
            try {
                const remoteSettings = await apiSync.fetchSettings('custom_lead_statuses');
                if (Array.isArray(remoteSettings) && remoteSettings.length > 0) {
                    setCustomStatuses(remoteSettings.sort((a: CustomStatus, b: CustomStatus) => (a.order || 0) - (b.order || 0)));
                } else {
                    // It returned empty, which means no custom statuses configured for this workspace, use defaults
                    setCustomStatuses(DEFAULT_STATUSES);
                }
            } catch (err: any) {
                // If it fails to fetch (e.g. proxy doesn't support it), we keep the default and show error
                setCustomStatuses(DEFAULT_STATUSES);
                setErrorMsg(err.message || "Failed to fetch custom statuses");
                console.error("Settings sync error:", err);
            }
            
            const remoteLeads = await apiSync.pullFromBackend();
            if (remoteLeads.length > 0) {
                await storage.bulkSaveLeads(remoteLeads);
                const updatedData = await storage.getLeads();
                updatedData.sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
                setLeads(updatedData);
            }
        } catch (e: any) {
            console.error('Background sync failed:', e);
            setErrorMsg(e.message || "Sync failed");
        }
    }

    // Optimized Filtering with useMemo and Fuzzy Matching
    const filteredLeads = useMemo(() => {
        return leads.filter(l => {
            const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) ||
                l.phone_number.includes(search) ||
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
        window.location.href = `tel:${lead.phone_number}`;
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
        if (activeLeadForWhatsApp) {
            // If Single Lead Mode: Apply template to draft, but don't send yet
            setDraftMessage(template.content);
            return;
        }

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

    const handleBulkStatus = async (newStatus: string) => {
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

    const handleOpenNoteModal = (lead: Lead) => {
        setNoteModalLead(lead);
        const latestNote = lead.notes && lead.notes.length > 0 
            ? [...lead.notes].sort((a, b) => b.timestamp - a.timestamp)[0].content 
            : '';
        setNoteModalText(latestNote);
        setShowNoteModal(true);
    };

    const handleSaveNote = async () => {
        if (!noteModalLead) return;
        
        const note = {
            id: uuidv4(),
            content: noteModalText,
            timestamp: Date.now(),
            type: 'manual' as const
        };

        const updatedNotes = [...(noteModalLead.notes || [])];
        if (noteModalText.trim()) {
            updatedNotes.unshift(note);
        }

        const updatedLead = {
            ...noteModalLead,
            notes: updatedNotes,
            updated_at: new Date().toISOString()
        };

        await storage.saveLead(updatedLead);
        
        // Update local state immediately
        setLeads(prev => prev.map(l => l.id === noteModalLead.id ? updatedLead : l));
        
        setShowNoteModal(false);
        setNoteModalLead(null);
        setNoteModalText('');
    };

    return (
        <PageTransition className="safe-top min-h-screen pb-32">
            <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-md pb-4 pt-4 px-4 border-b border-black/5 space-y-4 shadow-sm">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {!selectionMode && userProfile.avatar && (
                            <img src={userProfile.avatar} alt="Profile" className="w-8 h-8 rounded-full border border-black/10 object-cover shadow-sm" />
                        )}
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Aerostic CRM</span>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent truncate max-w-[200px]">
                                {selectionMode ? `${selectedIds.size} Selected` : (userProfile.name ? `Hello, ${userProfile.name}` : 'My Leads')}
                            </h1>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/reports')}
                            className="p-3 rounded-full border border-border bg-card text-zinc-600 hover:text-primary transition-colors"
                        >
                            <TrendingUp size={20} />
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={toggleSelectionMode}
                            className={cn(
                                "p-3 rounded-full shadow-lg transition-colors border",
                                selectionMode ? "bg-zinc-100 text-foreground border-zinc-300" : "bg-card text-zinc-600 border-border"
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

                {errorMsg && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm font-medium mb-4 flex items-center gap-2">
                        <span>⚠️</span> {errorMsg}
                    </div>
                )}

                {/* Consolidated Filters Row */}
                <div className="flex flex-col md:flex-row gap-2">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                            type="text"
                            placeholder="Search leads..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-card border border-border rounded-xl h-10 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium placeholder:text-muted-foreground"
                        />
                    </div>

                    {/* Filters: Side-by-side on mobile */}
                    <div className="grid grid-cols-2 md:flex gap-2">
                        <div className="relative md:w-40">
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value as any)}
                                className="w-full h-10 bg-card border border-border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-zinc-700 font-medium cursor-pointer appearance-none"
                            >
                                <option value="All">All Categories</option>
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={14} />
                        </div>

                        <div className="relative md:w-40">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full h-10 bg-card border border-border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-zinc-700 font-medium cursor-pointer appearance-none"
                            >
                                <option value="All">All Statuses</option>
                                {customStatuses.map(s => (
                                    <option key={s.value} value={s.value}>{s.label || s.value}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={14} />
                        </div>
                    </div>
                </div>
            </header>

            <div className="px-4 py-4 space-y-6">
                {selectionMode && (
                    <div className="flex justify-between items-center bg-zinc-100/50 p-3 rounded-xl border border-black/5">
                        <span className="text-sm font-medium text-zinc-600">Select All Visible</span>
                        <button onClick={handleSelectAll} className="text-primary text-sm font-bold">
                            {selectedIds.size === filteredLeads.length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="text-center text-muted-foreground mt-20 animate-pulse">Loading leads...</div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
                        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-4 px-4 py-3 bg-slate-50 border-b border-border text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            <div className={cn("col-span-3", selectionMode ? "col-span-2" : "col-span-3")}>Contact</div>
                            <div className="col-span-1">Status</div>
                            <div className="col-span-1">Follow-up</div>
                            <div className="col-span-1">Source</div>
                            <div className="col-span-1">Tags</div>
                            <div className="col-span-1">Req / Quote</div>
                            <div className="col-span-2">Note</div>
                            <div className="col-span-2 text-right pr-4">Actions</div>
                        </div>
                        <div className="divide-y divide-border flex flex-col">
                            {filteredLeads.length === 0 ? (
                                <div className="text-center text-muted-foreground p-8">
                                    No leads found.
                                </div>
                            ) : (
                                filteredLeads.map(lead => (
                                    <MemoizedLeadCard
                                        key={lead.id}
                                        lead={lead}
                                        onCall={handleCall}
                                        onWhatsApp={handleWhatsAppClick}
                                        onClick={(l) => navigate(`/leads/${l.id}`)}
                                        selectionMode={selectionMode}
                                        isSelected={selectedIds.has(lead.id)}
                                        onToggleSelect={handleToggleSelect}
                                        customStatuses={customStatuses}
                                        onAddNote={handleOpenNoteModal}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Monetization: Ad Banner */}
                <AdBanner />

                <footer className="py-6 text-center space-y-2 border-t border-black/5">
                    <p className="text-xs text-zinc-500">© {new Date().getFullYear()} Aerostic CRM</p>
                    <div className="flex items-center justify-center gap-4 text-[10px] text-zinc-600">
                        <a href="/privacy-policy" className="hover:text-blue-400 transition-colors">Privacy Policy</a>
                        <span className="text-zinc-700">•</span>
                        <a href="/terms-condition" className="hover:text-blue-400 transition-colors">Terms of Service</a>
                    </div>
                </footer>
            </div>

            {/* Bulk Action Toolbar */}
            <AnimatePresence>
                {selectionMode && selectedIds.size > 0 && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-6 left-4 right-4 bg-white border border-black/10 rounded-2xl shadow-2xl p-2 z-50 flex items-center justify-between gap-2"
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
                            className="flex-1 px-3 py-3 bg-zinc-200 text-zinc-900 rounded-xl font-medium text-xs flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
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

            {/* Note Modal */}
            <AnimatePresence>
                {showNoteModal && noteModalLead && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowNoteModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
                        >
                            <h3 className="text-xl font-bold mb-4">Update Note</h3>
                            <div className="text-sm text-slate-500 mb-4">
                                Update the most recent note or add a new one for <strong>{noteModalLead.name || noteModalLead.phone_number}</strong>.
                            </div>
                            <textarea
                                value={noteModalText}
                                onChange={(e) => setNoteModalText(e.target.value)}
                                className="w-full border rounded-xl p-3 text-sm min-h-[120px] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                                placeholder="Enter note details..."
                            />
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowNoteModal(false)}
                                    className="flex-1 py-3 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveNote}
                                    className="flex-1 py-3 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
                                >
                                    Save Note
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Helper Modals */}
            {showTemplateModal && (
                <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
                    <div className="bg-card w-full max-w-sm rounded-2xl border border-border p-4 space-y-4 animate-in slide-in-from-bottom">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold">{activeLeadForWhatsApp ? `Message ${activeLeadForWhatsApp.name}` : 'Select Template'}</h3>
                            <button onClick={() => { setShowTemplateModal(false); setActiveLeadForWhatsApp(null); }}><X size={20} /></button>
                        </div>

                        {activeLeadForWhatsApp && (
                            <div className="space-y-2">
                                <textarea
                                    value={draftMessage}
                                    onChange={(e) => setDraftMessage(e.target.value)}
                                    className="w-full bg-white border border-black/10 rounded-xl p-3 text-sm min-h-[100px] focus:outline-none focus:ring-1 focus:ring-green-500"
                                    placeholder="Type your message..."
                                />
                                <button
                                    onClick={handleSendSingleWhatsApp}
                                    className="w-full bg-green-600 text-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-green-500 active:scale-95 transition-all"
                                >
                                    <MessageCircle size={18} />
                                    Send on WhatsApp
                                </button>
                                <div className="text-xs text-center text-muted-foreground pt-2 border-t border-black/5">
                                    OR Select a template below to auto-fill
                                </div>
                            </div>
                        )}

                        <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                            {templates.length === 0 && <p className="text-sm text-zinc-500">No templates found in Settings.</p>}
                            {templates.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => handleBulkWhatsApp(t)}
                                    className="w-full text-left p-3 rounded-xl bg-zinc-100/50 hover:bg-zinc-100 border border-black/5 transition-colors"
                                >
                                    <h4 className="font-medium text-sm">{t.name}</h4>
                                    <p className="text-xs text-muted-foreground truncate opacity-70">{t.content}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {showWelcomeModal && (
                <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-card w-full max-w-sm rounded-2xl border border-black/10 p-6 space-y-6 text-center animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <CheckSquare size={32} className="text-foreground" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-foreground">Welcome to CRM! 🚀</h2>
                            <p className="text-zinc-600 text-sm leading-relaxed">
                                Your new offline-ready, mobile-first CRM is ready. Manage leads, track status, and sync with Google Drive.
                            </p>
                        </div>

                        <div className="space-y-3 pt-2">
                            <button
                                onClick={() => {
                                    localStorage.setItem('crm_has_seen_welcome', 'true');
                                    setShowWelcomeModal(false);
                                    navigate('/doc');
                                }}
                                className="w-full py-3 bg-zinc-100 text-white font-medium rounded-xl hover:bg-zinc-200 transition-colors border border-black/5"
                            >
                                Read User Guide
                            </button>
                            <button
                                onClick={() => {
                                    localStorage.setItem('crm_has_seen_welcome', 'true');
                                    setShowWelcomeModal(false);
                                }}
                                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-transform"
                            >
                                Get Started
                            </button>
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
                            {customStatuses.map(s => (
                                <button
                                    key={s.value}
                                    onClick={() => handleBulkStatus(s.value)}
                                    className="p-3 rounded-xl border font-bold text-sm transition-colors text-center opacity-90"
                                    style={{ 
                                        backgroundColor: `${s.color}20`,
                                        color: s.color,
                                        borderColor: `${s.color}40`
                                    }}
                                >
                                    {s.label || s.value}
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
                                    <h3 className="font-medium text-sm">{lead.name}</h3>
                                    <p className="text-xs text-muted-foreground">{lead.phone_number}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        const cleanPhone = lead.phone_number.replace(/\D/g, '');
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
