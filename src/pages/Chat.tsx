import { useState, useEffect, useRef } from 'react';
import { PageTransition } from '../components/MotionWrapper';
import { MessageSquare, ChevronLeft, Send, User, Loader2 } from 'lucide-react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { auth, API_BASE_URL } from '../lib/auth';
import { cn } from '../lib/cn';

export function Chat() {
    const [leads, setLeads] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoadingLeads, setIsLoadingLeads] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [selectedLead, setSelectedLead] = useState<any | null>(null);
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const loadLeads = async () => {
        setIsLoadingLeads(true);
        try {
            // Load from local storage first for instant UI
            const { storage } = await import('../lib/storage');
            const localLeads = await storage.getLeads();
            setLeads(localLeads);

            const token = auth.getToken();
            const workspaceId = auth.getWorkspaceId();
            if (!token || !workspaceId) return;

            const res = await axios.post(
                `${API_BASE_URL}/data/leads`,
                { action: 'select', filters: [{ column: 'workspace_id', operator: 'eq', value: workspaceId }] },
                { headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': workspaceId } }
            );
            
            const rows = res.data?.data || res.data || [];
            if (Array.isArray(rows) && rows.length > 0) {
                setLeads(rows);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingLeads(false);
        }
    };

    const loadMessages = async (leadId: string) => {
        setIsLoadingMessages(true);
        try {
            const { storage } = await import('../lib/storage');
            const localMsgs = await storage.getMessages(leadId);
            if (localMsgs.length > 0) {
                localMsgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                setMessages(localMsgs);
            }

            const token = auth.getToken();
            const workspaceId = auth.getWorkspaceId();
            if (!token || !workspaceId) return;

            const res = await axios.post(
                `${API_BASE_URL}/data/messages`,
                { 
                    action: 'select', 
                    filters: [
                        { column: 'workspace_id', operator: 'eq', value: workspaceId },
                        { column: 'lead_id', operator: 'eq', value: leadId }
                    ]
                },
                { headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': workspaceId } }
            );
            
            let rows = res.data?.data || res.data || [];
            if (Array.isArray(rows)) {
                // Merge local and remote
                const all = [...localMsgs, ...rows];
                const unique = Array.from(new Map(all.map(m => [m.id, m])).values());
                unique.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                setMessages(unique);
                
                // Cache them locally
                for (const r of unique) {
                    await storage.saveMessage(r);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingMessages(false);
            scrollToBottom();
        }
    };

    useEffect(() => {
        loadLeads();
    }, []);

    useEffect(() => {
        if (selectedLead) {
            loadMessages(selectedLead.id);
        }
    }, [selectedLead]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedLead) return;

        setIsSending(true);
        try {
            const token = auth.getToken();
            const workspaceId = auth.getWorkspaceId();
            if (!token || !workspaceId) return;

            const tempMessage = {
                id: uuidv4(),
                workspace_id: workspaceId,
                lead_id: selectedLead.id,
                direction: 'outbound',
                message_text: newMessage.trim(),
                is_read: false,
                created_at: new Date().toISOString()
            };

            // Optimistic update
            setMessages(prev => [...prev, tempMessage]);
            setNewMessage("");
            scrollToBottom();

            // Save to local storage for immediate persistence
            const { storage } = await import('../lib/storage');
            await storage.saveMessage(tempMessage);

            // Push to backend DB
            const dbRes = await axios.post(
                `${API_BASE_URL}/data/messages`,
                { 
                    action: 'insert', 
                    data: {
                        id: tempMessage.id, // specify the ID so the function can reference it
                        workspace_id: workspaceId,
                        lead_id: selectedLead.id,
                        direction: 'outbound',
                        message_text: tempMessage.message_text,
                        status: 'sending'
                    }
                },
                { headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': workspaceId } }
            ).catch(err => {
                console.error("Backend DB push failed", err);
                return null;
            });

            // Trigger the WhatsApp API function
            if (dbRes) {
                await axios.post(
                    `${API_BASE_URL}/functions/send-whatsapp-message`,
                    {
                        workspaceId,
                        leadId: selectedLead.id,
                        message: tempMessage.message_text,
                        clientMessageId: tempMessage.id
                    },
                    { headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': workspaceId } }
                ).catch(err => {
                    console.error("WhatsApp API trigger failed", err);
                });
            }

            // Reload to merge
            loadMessages(selectedLead.id);
        } catch (err) {
            console.error(err);
            alert("Failed to send message");
        } finally {
            setIsSending(false);
        }
    };

    const handleBack = () => {
        setSelectedLead(null);
        setMessages([]);
    };

    return (
        <PageTransition className="min-h-screen bg-slate-50 flex flex-col pb-20">
            {!selectedLead ? (
                <>
                    <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 safe-top">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">Live Chat</h1>
                                <p className="text-xs text-muted-foreground">Manage conversations with leads</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {isLoadingLeads ? (
                            <div className="py-20 flex justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                            </div>
                        ) : leads.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                                <MessageSquare className="w-12 h-12 mb-3 text-slate-200" />
                                <p className="text-sm font-medium">No leads available to chat.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {leads.map(lead => (
                                    <button 
                                        key={lead.id}
                                        onClick={() => setSelectedLead(lead)}
                                        className="w-full p-4 flex items-center gap-4 bg-white hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shrink-0 relative">
                                            <User className="w-6 h-6 text-blue-600" />
                                            {/* Simulate online indicator */}
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-slate-900 truncate">{lead.name || 'Unknown Lead'}</h3>
                                            <p className="text-sm text-slate-500 truncate">{lead.phone || lead.email || 'No contact info'}</p>
                                        </div>
                                        <ChevronLeft className="w-5 h-5 text-slate-300 rotate-180 shrink-0" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="flex flex-col h-[calc(100vh-80px)]">
                    {/* Chat Header */}
                    <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-border/50 px-2 py-2 flex items-center gap-2 safe-top shadow-sm">
                        <button onClick={handleBack} className="p-2 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors">
                            <ChevronLeft className="w-6 h-6 text-slate-700" />
                        </button>
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-blue-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="font-bold text-slate-900 truncate">{selectedLead.name || 'Unknown'}</h2>
                            <p className="text-[11px] text-emerald-600 font-medium">WhatsApp</p>
                        </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 space-y-4">
                        <div className="text-center pb-4">
                            <span className="bg-slate-200/50 text-slate-500 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                                Chat Started
                            </span>
                        </div>

                        {isLoadingMessages ? (
                            <div className="py-10 flex justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="py-10 flex flex-col items-center text-slate-400">
                                <p className="text-sm">No messages yet.</p>
                                <p className="text-xs mt-1">Send a message to start the conversation.</p>
                            </div>
                        ) : (
                            messages.map((msg, idx) => {
                                const isOutbound = msg.direction === 'outbound';
                                return (
                                    <div key={msg.id || idx} className={cn("flex w-full", isOutbound ? "justify-end" : "justify-start")}>
                                        <div className={cn(
                                            "max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm relative group",
                                            isOutbound 
                                                ? "bg-blue-600 text-white rounded-br-none" 
                                                : "bg-white border border-slate-200 text-slate-800 rounded-bl-none"
                                        )}>
                                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{msg.message_text}</p>
                                            <div className={cn(
                                                "flex items-center justify-end gap-1 mt-1 text-[10px]",
                                                isOutbound ? "text-blue-100" : "text-slate-400"
                                            )}>
                                                <span>
                                                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} className="h-1" />
                    </div>

                    {/* Chat Input */}
                    <div className="bg-white border-t border-slate-200 p-3 pb-safe shrink-0 shadow-[0_-4px_20px_-15px_rgba(0,0,0,0.1)]">
                        <form onSubmit={handleSend} className="flex items-center gap-2 max-w-3xl mx-auto relative">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 bg-slate-100 border-none rounded-full px-5 py-3.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 pr-12"
                            />
                            <button 
                                type="submit"
                                disabled={!newMessage.trim() || isSending}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:bg-blue-400 transition-all active:scale-95 shadow-sm"
                            >
                                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </PageTransition>
    );
}
