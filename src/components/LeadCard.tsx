import { Phone, MapPin, Star, MessageCircle, ExternalLink, Mail, Check, Share2 } from 'lucide-react';
import type { Lead } from '../types';
import { cn } from '../lib/cn';

interface LeadCardProps {
    lead: Lead;
    onCall: (lead: Lead) => void;
    onClick: (lead: Lead) => void;
    onWhatsApp: (lead: Lead) => void;
    selectionMode?: boolean;
    isSelected?: boolean;
    onToggleSelect?: (id: string) => void;
}

export function LeadCard({ lead, onCall, onClick, onWhatsApp, selectionMode, isSelected, onToggleSelect }: LeadCardProps) {

    const handleClick = () => {
        if (selectionMode && onToggleSelect) {
            onToggleSelect(lead.id);
        } else {
            onClick(lead);
        }
    };

    const hasEmail = Boolean(lead.email);

    return (
        <div
            onClick={handleClick}
            className={cn(
                "group relative bg-zinc-900/50 backdrop-blur-sm border rounded-2xl p-4 flex flex-col gap-4 active:scale-[0.99] transition-all duration-200 overflow-hidden cursor-pointer",
                isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-white/5 hover:border-zinc-700"
            )}
        >
            {/* Glow Effect */}
            <div className={cn(
                "absolute inset-0 bg-gradient-to-br transition-opacity",
                isSelected ? "from-primary/10 via-transparent to-transparent opacity-100" : "from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100"
            )} />

            {/* Selection Checkbox Overlay */}
            {selectionMode && (
                <div className="absolute top-4 right-4 z-20">
                    <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shadow-sm",
                        isSelected ? "bg-primary border-primary text-black scale-110" : "border-zinc-600 bg-zinc-900/50 hover:border-zinc-400"
                    )}>
                        {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>
                </div>
            )}

            <div className="relative flex items-start gap-4">
                {lead.imageUrl ? (
                    <img
                        src={lead.imageUrl}
                        alt={lead.title}
                        className="w-16 h-16 rounded-xl object-cover bg-zinc-800 shadow-sm"
                    />
                ) : (
                    <div className="w-16 h-16 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold text-xl shadow-inner">
                        {lead.title.charAt(0)}
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h3 className="text-base font-bold text-zinc-100 truncate leading-tight pr-8">{lead.title}</h3>
                        {!selectionMode && lead.totalScore && (
                            <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold bg-yellow-500/10 px-1.5 py-0.5 rounded-md">
                                <Star size={10} fill="currentColor" />
                                <span>{lead.totalScore}</span>
                            </div>
                        )}
                    </div>

                    <p className="text-sm text-blue-400 font-medium mt-0.5 truncate">{lead.categoryName || 'Lead'}</p>

                    <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-400">
                        <MapPin size={12} />
                        <span className="truncate">{lead.city || lead.state || 'Unknown Location'}</span>
                    </div>
                </div>
            </div>

            {/* Action Buttons - Icon Only Row */}
            <div className={cn("relative flex items-center gap-3 mt-1 transition-opacity", selectionMode && "opacity-50 pointer-events-none")}>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onCall(lead);
                    }}
                    className="h-12 flex-1 rounded-xl flex items-center justify-center text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                    aria-label="Call"
                >
                    <Phone size={18} />
                </button>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onWhatsApp(lead);
                    }}
                    className="h-12 flex-1 rounded-xl flex items-center justify-center text-green-100 bg-green-600 hover:bg-green-500 shadow-lg shadow-green-500/20 active:scale-95 transition-all"
                    aria-label="WhatsApp"
                >
                    <MessageCircle size={18} />
                </button>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (hasEmail) {
                            window.location.href = `mailto:${lead.email}?subject=Inquiry from ${lead.title}`;
                        } else {
                            alert('No email address available for this lead.');
                        }
                    }}
                    className={cn(
                        "h-12 flex-1 rounded-xl flex items-center justify-center transition-all border border-white/5",
                        hasEmail
                            ? "text-zinc-300 bg-zinc-800 hover:bg-zinc-700 active:scale-95"
                            : "text-zinc-600 bg-zinc-900/50 cursor-not-allowed opacity-60"
                    )}
                    aria-label="Email"
                >
                    <Mail size={18} />
                </button>

                <button
                    onClick={async (e) => {
                        e.stopPropagation();
                        const shareData = {
                            title: lead.title,
                            text: `Lead: ${lead.title}\nPhone: ${lead.phone}\nStatus: ${lead.status || 'Fresh'}\n${lead.categoryName ? `Category: ${lead.categoryName}` : ''}`,
                            url: `tel:${lead.phone}`
                        };

                        try {
                            if (navigator.share) {
                                await navigator.share(shareData);
                            } else {
                                await navigator.clipboard.writeText(shareData.text);
                                alert('Lead details copied to clipboard!');
                            }
                        } catch (err) {
                            console.error('Error sharing:', err);
                        }
                    }}
                    className="h-12 w-12 flex items-center justify-center rounded-xl border border-white/5 text-zinc-400 bg-zinc-800 hover:text-white hover:bg-zinc-700 active:scale-95 transition-all shrink-0"
                    aria-label="Share"
                >
                    <Share2 size={18} />
                </button>

                {lead.url && (
                    <a
                        href={lead.url}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="h-12 w-12 flex items-center justify-center rounded-xl border border-white/5 text-zinc-400 bg-zinc-800 hover:text-white hover:bg-zinc-700 active:scale-95 transition-all shrink-0"
                        aria-label="Website"
                    >
                        <ExternalLink size={18} />
                    </a>
                )}
            </div>

            <div className="relative flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                <span className={cn(
                    "px-2.5 py-1 rounded-full font-medium border text-[10px] uppercase tracking-wide shadow-sm",
                    lead.status === 'Hot' && "bg-orange-500/10 text-orange-400 border-orange-500/20",
                    lead.status === 'Warm' && "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
                    lead.status === 'Cold' && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                    lead.status === 'Fresh' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                    (lead.status === 'Dead' || !lead.status) && "bg-zinc-800 text-zinc-400 border-zinc-700",
                )}>
                    {lead.status || 'Fresh'}
                </span>

                <div className="flex items-center gap-1.5 text-zinc-500 font-medium">
                    <MessageCircle size={12} />
                    <span>{lead.notes?.length || 0} Notes</span>
                </div>
            </div>
        </div>
    );
}
