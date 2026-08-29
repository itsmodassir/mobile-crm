import { Phone, MessageCircle, Mail, Check } from 'lucide-react';
import type { Lead, CustomStatus } from '../types';
import { cn } from '../lib/cn';

interface LeadCardProps {
    lead: Lead;
    onCall: (lead: Lead) => void;
    onClick: (lead: Lead) => void;
    onWhatsApp: (lead: Lead) => void;
    selectionMode?: boolean;
    isSelected?: boolean;
    onToggleSelect?: (id: string) => void;
    customStatuses?: CustomStatus[];
    onAddNote?: (lead: Lead) => void;
}

export function LeadCard({ lead, onCall, onClick, onWhatsApp, selectionMode, isSelected, onToggleSelect, customStatuses = [], onAddNote }: LeadCardProps) {

    const handleClick = () => {
        if (selectionMode && onToggleSelect) {
            onToggleSelect(lead.id);
        } else {
            onClick(lead);
        }
    };

    const hasEmail = Boolean(lead.email);

    // Find custom status matching lead's status
    const statusObj = customStatuses.find(s => s.value === lead.status);
    const statusLabel = statusObj?.label || lead.status || 'Fresh';
    const statusColor = statusObj?.color || '#94a3b8'; // Default slate if not found

    return (
        <div 
            onClick={handleClick}
            className={cn(
                "group flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4 p-4 border-b border-border hover:bg-slate-50 transition-colors cursor-pointer relative",
                isSelected ? "bg-primary/5" : "bg-card"
            )}
        >
            {/* Selection Checkbox (Absolute on mobile, inline on desktop) */}
            {selectionMode && (
                <div className="absolute top-4 right-4 lg:static lg:col-span-1 lg:flex lg:items-center">
                    <div 
                        onClick={(e) => { e.stopPropagation(); onToggleSelect && onToggleSelect(lead.id); }}
                        className={cn(
                            "w-6 h-6 lg:w-5 lg:h-5 rounded-md border flex items-center justify-center cursor-pointer",
                            isSelected ? "bg-primary border-primary text-white" : "border-slate-300 bg-white"
                        )}
                    >
                        {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>
                </div>
            )}
            
            {/* Contact Info (Spans 3 cols on desktop) */}
            <div className={cn("flex items-center gap-3", selectionMode ? "lg:col-span-2" : "lg:col-span-3")}>
                {lead.imageUrl ? (
                    <img src={lead.imageUrl} alt={lead.name} className="w-10 h-10 lg:w-8 lg:h-8 rounded-full object-cover bg-slate-100 shadow-sm shrink-0" />
                ) : (
                    <div className="w-10 h-10 lg:w-8 lg:h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm lg:text-xs shadow-inner uppercase shrink-0">
                        {lead.name ? lead.name.charAt(0) : '?'}
                    </div>
                )}
                <div className="min-w-0">
                    <div className="font-semibold text-slate-900 text-sm lg:text-sm truncate">{lead.name || 'Unknown'}</div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">{lead.phone_number}</div>
                </div>
            </div>

            {/* Mobile details grid, Desktop inline columns */}
            <div className="grid grid-cols-2 gap-2 mt-2 lg:mt-0 lg:contents text-xs">
                {/* Status (Col 1) */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:col-span-1">
                    <span className="text-[10px] uppercase text-muted-foreground font-semibold lg:hidden">Status</span>
                    <span className="px-2 py-1 rounded-full font-bold border text-[10px] uppercase tracking-wider whitespace-nowrap opacity-90 w-fit"
                        style={{ backgroundColor: `${statusColor}20`, color: statusColor, borderColor: `${statusColor}40` }}>
                        {statusLabel}
                    </span>
                </div>

                {/* Follow-up (Col 1) */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:col-span-1">
                    <span className="text-[10px] uppercase text-muted-foreground font-semibold lg:hidden">Follow-up</span>
                    <span className={cn(
                        "px-1.5 py-0.5 rounded font-bold uppercase tracking-wide text-[10px] w-fit",
                        lead.followup_stage === 'completed' && "bg-emerald-100 text-emerald-700",
                        lead.followup_stage === 'followup_1_pending' && "bg-amber-100 text-amber-700",
                        lead.followup_stage === 'followup_2_pending' && "bg-orange-100 text-orange-700",
                        !lead.followup_stage && "text-slate-300"
                    )}>
                        {lead.followup_stage ? lead.followup_stage.replace(/_/g, ' ') : '—'}
                    </span>
                </div>

                {/* Source & Tags (Col 1 & 2) */}
                <div className="flex flex-col lg:justify-center gap-1 lg:col-span-1">
                    <span className="text-[10px] uppercase text-muted-foreground font-semibold lg:hidden">Source</span>
                    <span className="text-slate-600 font-medium truncate max-w-[120px]">{lead.source_group || lead.categoryName || '-'}</span>
                </div>

                <div className="flex flex-col lg:justify-center gap-1 lg:col-span-1">
                    <span className="text-[10px] uppercase text-muted-foreground font-semibold lg:hidden">Tags</span>
                    <div className="flex flex-wrap gap-1">
                        {lead.tags && lead.tags.length > 0 ? lead.tags.map((tag, idx) => (
                            <span key={idx} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider">{tag}</span>
                        )) : <span className="text-slate-300">—</span>}
                    </div>
                </div>

                {/* Requirement (Col 1) */}
                <div className="col-span-2 lg:col-span-1 flex flex-col lg:justify-center gap-1">
                    <span className="text-[10px] uppercase text-muted-foreground font-semibold lg:hidden">Requirement / Quotation</span>
                    <div className="line-clamp-1 leading-tight text-slate-500">
                        {lead.lead_requirement || <span className="text-slate-300">No req</span>} 
                        <span className="mx-1 text-slate-300">|</span> 
                        {lead.quotation || <span className="text-slate-300">No quote</span>}
                    </div>
                </div>

                {/* Note (Col 2 wide) */}
                <div 
                    onClick={(e) => {
                        if (onAddNote) {
                            e.stopPropagation();
                            onAddNote(lead);
                        }
                    }}
                    className={cn(
                        "col-span-2 lg:col-span-2 flex flex-col lg:justify-center gap-1",
                        onAddNote && "cursor-pointer hover:bg-slate-100 p-1 -m-1 rounded transition-colors"
                    )}
                    title="Click to quickly update note"
                >
                    <span className="text-[10px] uppercase text-muted-foreground font-semibold lg:hidden">Recent Note</span>
                    <div className="line-clamp-1 leading-tight text-slate-500 text-xs italic">
                        {lead.notes && lead.notes.length > 0 
                            ? `"${[...lead.notes].sort((a, b) => b.timestamp - a.timestamp)[0].content}"` 
                            : <span className="text-slate-300 not-italic">No note (click to add)</span>}
                    </div>
                </div>
            </div>

            {/* Actions (Spans 2 cols on desktop, full width on mobile) */}
            <div className="mt-3 lg:mt-0 pt-3 lg:pt-0 border-t border-slate-100 lg:border-0 flex items-center justify-between lg:justify-end gap-2 lg:col-span-2 w-full">
                <div className="flex items-center gap-1.5 text-slate-500 font-medium text-xs lg:mr-2">
                    <MessageCircle size={14} />
                    <span>{lead.notes?.length || 0}</span>
                </div>

                <div className={cn("flex items-center gap-1.5", selectionMode && "opacity-50 pointer-events-none")}>
                    <button
                        onClick={(e) => { e.stopPropagation(); onCall(lead); }}
                        className="flex-1 lg:flex-none py-2 px-4 lg:p-2 rounded-lg text-white bg-blue-600 hover:bg-blue-500 shadow-sm active:scale-95 transition-all flex justify-center"
                        aria-label="Call"
                    >
                        <Phone size={14} className="lg:m-0 mr-1 inline" />
                        <span className="lg:hidden text-xs font-semibold">Call</span>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onWhatsApp(lead); }}
                        className="flex-1 lg:flex-none py-2 px-4 lg:p-2 rounded-lg text-white bg-green-500 hover:bg-green-400 shadow-sm active:scale-95 transition-all flex justify-center"
                        aria-label="WhatsApp"
                    >
                        <MessageCircle size={14} className="lg:m-0 mr-1 inline" />
                        <span className="lg:hidden text-xs font-semibold">WhatsApp</span>
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (hasEmail) window.location.href = `mailto:${lead.email}?subject=Inquiry`;
                        }}
                        className={cn(
                            "flex-1 lg:flex-none py-2 px-4 lg:p-2 rounded-lg transition-all flex justify-center border",
                            hasEmail ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm active:scale-95" : "bg-slate-50 border-transparent text-slate-300 cursor-not-allowed"
                        )}
                        aria-label="Email"
                    >
                        <Mail size={14} className="lg:m-0 mr-1 inline" />
                        <span className="lg:hidden text-xs font-semibold">Email</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
