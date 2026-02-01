import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, Globe, Star, Save, X, Trash2, Edit2, MessageCircle, Plus } from 'lucide-react';
import type { Lead, Note } from '../types';
import { storage } from '../lib/storage';
import { cn } from '../lib/cn';
import { v4 as uuidv4 } from 'uuid';
import { CATEGORIES } from '../lib/constants';

export function LeadDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [lead, setLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(true);

    // Core Mode State
    const [isEditingLead, setIsEditingLead] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [updateMode, setUpdateMode] = useState<'call_summary' | 'manual_update'>('manual_update');

    // Update Modal State
    const [newStatus, setNewStatus] = useState<Lead['status']>('Warm');
    const [noteContent, setNoteContent] = useState('');

    // Lead Edit Form
    const [editForm, setEditForm] = useState<Partial<Lead>>({});

    // Note Editing State
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editNoteText, setEditNoteText] = useState('');

    useEffect(() => {
        if (id) loadLead(id);

        // Check for return from call
        const checkCallReturn = () => {
            const currentCallId = localStorage.getItem('crm_is_calling');
            if (currentCallId === id && document.visibilityState === 'visible') {
                setUpdateMode('call_summary');
                setShowUpdateModal(true);
                localStorage.removeItem('crm_is_calling');
            }
        };

        const isCalling = localStorage.getItem('crm_is_calling');
        if (isCalling === id) {
            setUpdateMode('call_summary');
            setShowUpdateModal(true);
            localStorage.removeItem('crm_is_calling');
        }

        document.addEventListener('visibilitychange', checkCallReturn);
        return () => document.removeEventListener('visibilitychange', checkCallReturn);
    }, [id]);

    async function loadLead(leadId: string) {
        const data = await storage.getLead(leadId);
        if (!data) {
            navigate('/');
            return;
        }
        setLead(data);
        setNewStatus(data.status || 'Fresh');
        setLoading(false);
    }

    // Actions
    const handleCall = () => {
        if (!lead) return;
        localStorage.setItem('crm_is_calling', lead.id);
        window.location.href = `tel:${lead.phone}`;
        // Modal will open on return via visibilitychange
    };

    const handleWhatsApp = () => {
        if (!lead) return;
        const cleanPhone = lead.phone.replace(/\D/g, '');
        const country = localStorage.getItem('crm_default_country') || '';
        const defaultMsg = localStorage.getItem('crm_default_wa_msg') || '';

        let finalPhone = cleanPhone;
        if (country && !cleanPhone.startsWith(country) && cleanPhone.length <= 10) {
            finalPhone = `${country}${cleanPhone}`;
        }

        const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(defaultMsg)}`;
        window.open(url, '_blank');
    };

    const handleEmail = () => {
        if (!lead) return;
        window.location.href = `mailto:?subject=Inquiry from ${lead.title}`;
    };

    const handleDeleteLead = async () => {
        if (!lead) return;
        if (confirm('Are you sure you want to delete this lead?')) {
            await storage.deleteLead(lead.id);
            navigate('/');
        }
    };

    // Updates (Status/Note)
    const saveUpdate = async () => {
        if (!lead) return;

        const note: Note = {
            id: uuidv4(),
            content: noteContent || `Status updated to ${newStatus}.`,
            timestamp: Date.now(),
            type: updateMode === 'call_summary' ? 'call_log' : 'manual'
        };

        // Only add note if content exists or it's a status change
        // Actually for call summary we always add a log.
        // For manual update, we add if note content exists OR status changed.
        const notes = [...lead.notes];
        if (noteContent || newStatus !== lead.status || updateMode === 'call_summary') {
            notes.unshift(note);
        }

        const updatedLead: Lead = {
            ...lead,
            status: newStatus,
            notes: notes,
            updatedAt: Date.now()
        };

        await storage.saveLead(updatedLead);
        setLead(updatedLead);
        setShowUpdateModal(false);
        setNoteContent('');
    };

    // Note Management
    const deleteNote = async (noteId: string) => {
        if (!lead || !confirm('Delete this note?')) return;
        const updatedLead = {
            ...lead,
            notes: lead.notes.filter(n => n.id !== noteId),
            updatedAt: Date.now()
        };
        await storage.saveLead(updatedLead);
        setLead(updatedLead);
    };

    const startEditingNote = (note: Note) => {
        setEditingNoteId(note.id);
        setEditNoteText(note.content);
    };

    const saveEditedNote = async () => {
        if (!lead || !editingNoteId) return;
        const updatedLead = {
            ...lead,
            notes: lead.notes.map(n => n.id === editingNoteId ? { ...n, content: editNoteText } : n),
            updatedAt: Date.now()
        };
        await storage.saveLead(updatedLead);
        setLead(updatedLead);
        setEditingNoteId(null);
    };

    // Edit Lead Details
    const startLeadEdit = () => {
        if (!lead) return;
        setEditForm({
            title: lead.title,
            phone: lead.phone,
            street: lead.street,
            city: lead.city,
            website: lead.website,
            categoryName: lead.categoryName
        });
        setIsEditingLead(true);
    };

    const saveLeadEdit = async () => {
        if (!lead) return;
        const updatedLead = { ...lead, ...editForm, updatedAt: Date.now() } as Lead;
        await storage.saveLead(updatedLead);
        setLead(updatedLead);
        setIsEditingLead(false);
    };

    if (loading || !lead) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

    return (
        <div className="bg-background min-h-screen pb-24 safe-top relative text-foreground">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md p-4 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full active:bg-zinc-800">
                        <ArrowLeft />
                    </button>
                    <h1 className="font-semibold text-lg truncate w-40">{lead.title}</h1>
                </div>
                <div className="flex gap-1">
                    <button onClick={startLeadEdit} className="p-2 rounded-full text-muted-foreground hover:bg-zinc-800">
                        <Edit2 size={18} />
                    </button>
                    <button onClick={handleDeleteLead} className="p-2 rounded-full text-red-500 hover:bg-red-500/10">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {!isEditingLead ? (
                <>
                    {/* Hero */}
                    <div className="p-4 flex flex-col items-center text-center">
                        {lead.imageUrl ? (
                            <img src={lead.imageUrl} alt={lead.title} className="w-24 h-24 rounded-2xl mb-4 bg-zinc-800 object-cover shadow-lg" />
                        ) : (
                            <div className="w-24 h-24 rounded-2xl mb-4 bg-zinc-800 flex items-center justify-center text-3xl font-bold text-zinc-500 shadow-inner">
                                {lead.title.charAt(0)}
                            </div>
                        )}
                        <h2 className="text-xl font-bold">{lead.title}</h2>
                        <p className="text-muted-foreground text-sm mt-1">{lead.categoryName}</p>

                        {lead.totalScore && (
                            <div className="flex items-center gap-1 text-yellow-500 text-sm font-medium mt-2">
                                <Star size={14} fill="currentColor" />
                                <span>{lead.totalScore}</span>
                                <span className="text-muted-foreground">({lead.reviewsCount} reviews)</span>
                            </div>
                        )}

                        {/* Status Badge - Clickable */}
                        <button
                            onClick={() => {
                                setUpdateMode('manual_update');
                                setNewStatus(lead.status);
                                setShowUpdateModal(true);
                            }}
                            className={cn(
                                "mt-3 px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-2 active:scale-95 transition-all shadow-sm ring-1 ring-inset ring-transparent hover:ring-white/10",
                                lead.status === 'Hot' ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                                    lead.status === 'Warm' ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                                        lead.status === 'Cold' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                            lead.status === 'Fresh' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                                "bg-zinc-800 text-zinc-400 border-zinc-700"
                            )}
                        >
                            <span className="relative flex h-2 w-2">
                                <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                                    lead.status === 'Hot' ? 'bg-orange-400' :
                                        lead.status === 'Warm' ? 'bg-yellow-400' :
                                            lead.status === 'Fresh' ? 'bg-emerald-400' : 'bg-transparent'
                                )}></span>
                                <span className={cn("relative inline-flex rounded-full h-2 w-2",
                                    lead.status === 'Hot' ? 'bg-orange-500' :
                                        lead.status === 'Warm' ? 'bg-yellow-500' :
                                            lead.status === 'Fresh' ? 'bg-emerald-500' : 'bg-zinc-500'
                                )}></span>
                            </span>
                            {lead.status || 'Fresh'}
                            <Edit2 size={10} className="opacity-50" />
                        </button>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-6 w-full max-w-sm">
                            <button
                                onClick={handleCall}
                                className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2 font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                            >
                                <Phone size={20} /> Call
                            </button>

                            <button
                                onClick={handleWhatsApp}
                                className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2 font-semibold text-green-100 bg-green-600 hover:bg-green-500 shadow-lg shadow-green-500/20 active:scale-95 transition-all"
                            >
                                <MessageCircle size={20} /> WhatsApp
                            </button>

                            <button
                                onClick={handleEmail}
                                className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2 font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-white/5 active:scale-95 transition-all"
                            >
                                <Mail size={20} /> Email
                            </button>
                        </div>
                    </div>

                    {/* Details Card */}
                    <div className="px-4 space-y-6 mt-2">
                        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                            {lead.phone && (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-muted-foreground">
                                        <Phone size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground">Mobile</p>
                                        <p className="font-medium text-sm">{lead.phone}</p>
                                    </div>
                                </div>
                            )}

                            {(lead.city || lead.state) && (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-muted-foreground">
                                        <MapPin size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground">Location</p>
                                        <p className="font-medium text-sm">{[lead.street, lead.city, lead.state].filter(Boolean).join(', ')}</p>
                                    </div>
                                </div>
                            )}

                            {lead.website && (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-muted-foreground">
                                        <Globe size={16} />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-xs text-muted-foreground">Website</p>
                                        <a href={lead.website} target="_blank" className="font-medium text-sm text-blue-400 truncate block">
                                            {lead.website}
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Notes Timeline */}
                        <div className="animate-in slide-in-from-bottom-2 duration-500">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Activity & Notes</h3>
                                <button
                                    onClick={() => {
                                        setUpdateMode('manual_update');
                                        setNewStatus(lead.status); // Keep current status
                                        setNoteContent('');
                                        setShowUpdateModal(true);
                                    }}
                                    className="text-xs font-medium text-primary flex items-center gap-1 hover:bg-primary/10 px-2 py-1 rounded-md transition-colors"
                                >
                                    <Plus size={14} /> Add Note
                                </button>
                            </div>

                            <div className="space-y-3 relative">
                                {/* Timeline Line */}
                                {lead.notes.length > 0 && (
                                    <div className="absolute left-[5px] top-2 bottom-2 w-[2px] bg-zinc-800" />
                                )}

                                {lead.notes.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground text-sm bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800">
                                        No logs found. Add a note or make a call!
                                    </div>
                                ) : (
                                    lead.notes.map(note => (
                                        <div key={note.id} className="relative pl-6 pb-2 group">
                                            {/* Dot */}
                                            <div className={cn(
                                                "absolute left-0 top-1.5 -translate-x-1 w-3 h-3 rounded-full border-2 border-background z-10",
                                                note.type === 'call_log' ? "bg-green-500" : "bg-blue-500"
                                            )} />

                                            <div className="bg-card border border-border rounded-xl p-3 text-sm hover:border-zinc-700 transition-colors">
                                                {editingNoteId === note.id ? (
                                                    <div className="space-y-2">
                                                        <textarea
                                                            value={editNoteText}
                                                            onChange={e => setEditNoteText(e.target.value)}
                                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                                                            rows={3}
                                                            autoFocus
                                                        />
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => setEditingNoteId(null)} className="px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-zinc-800">Cancel</button>
                                                            <button onClick={saveEditedNote} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">Save</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex justify-between items-start mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className={cn(
                                                                    "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md",
                                                                    note.type === 'call_log' ? "bg-green-500/10 text-green-500" : "bg-blue-500/10 text-blue-500"
                                                                )}>
                                                                    {note.type === 'call_log' ? 'Call Log' : 'Note'}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">{new Date(note.timestamp).toLocaleString()}</span>
                                                            </div>

                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => startEditingNote(note)} className="p-1 text-muted-foreground hover:text-white hover:bg-zinc-800 rounded">
                                                                    <Edit2 size={12} />
                                                                </button>
                                                                <button onClick={() => deleteNote(note.id)} className="p-1 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded">
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <p className="whitespace-pre-wrap text-zinc-300 leading-relaxed">{note.content}</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                // Edit Lead Form
                <div className="p-4 space-y-4 max-w-lg mx-auto">
                    <h2 className="text-xl font-bold mb-6">Edit Lead Details</h2>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Name</label>
                            <input
                                value={editForm.title || ''}
                                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                className="w-full bg-card border border-border rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Phone</label>
                            <input
                                value={editForm.phone || ''}
                                onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                className="w-full bg-card border border-border rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Category</label>
                            <select
                                value={editForm.categoryName || ''}
                                onChange={e => setEditForm({ ...editForm, categoryName: e.target.value })}
                                className="w-full bg-card border border-border rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                            >
                                <option value="" disabled>Select Category</option>
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">City</label>
                            <input
                                value={editForm.city || ''}
                                onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                                className="w-full bg-card border border-border rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Website</label>
                            <input
                                value={editForm.website || ''}
                                onChange={e => setEditForm({ ...editForm, website: e.target.value })}
                                className="w-full bg-card border border-border rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-6">
                        <button onClick={() => setIsEditingLead(false)} className="flex-1 bg-zinc-800 h-12 rounded-xl font-medium hover:bg-zinc-700 transition-colors">Cancel</button>
                        <button onClick={saveLeadEdit} className="flex-1 bg-primary text-primary-foreground h-12 rounded-xl font-semibold hover:bg-primary/90 transition-colors">Save Changes</button>
                    </div>
                </div>
            )}

            {/* Update Modal (Shared for Call Summary & Manual Update) */}
            {showUpdateModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">
                                {updateMode === 'call_summary' ? 'Call Summary' : 'Update Status'}
                            </h3>
                            <button onClick={() => setShowUpdateModal(false)} className="p-2 rounded-full text-muted-foreground hover:bg-zinc-800 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {updateMode === 'call_summary' && (
                            <p className="text-sm text-muted-foreground mb-4">
                                You just called <span className="font-semibold text-foreground">{lead.title}</span>. How did it go?
                            </p>
                        )}

                        <div className="space-y-2 mb-6">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Set Status</label>
                            <div className="grid grid-cols-4 gap-2">
                                {['Hot', 'Warm', 'Cold', 'Dead'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setNewStatus(s as any)}
                                        className={cn(
                                            "py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95",
                                            newStatus === s
                                                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                                                : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800"
                                        )}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2 mb-6">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add Note</label>
                            <textarea
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                placeholder="What happened?"
                                className="w-full bg-black/20 border border-zinc-800 rounded-xl p-4 text-sm min-h-[100px] focus:ring-2 focus:ring-primary/50 outline-none resize-none"
                                autoFocus={updateMode === 'manual_update'}
                            />
                        </div>

                        <button
                            onClick={saveUpdate}
                            className="w-full bg-primary text-primary-foreground h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-xl shadow-primary/20"
                        >
                            <Save size={20} />
                            Save {updateMode === 'call_summary' ? 'Log' : 'Update'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
