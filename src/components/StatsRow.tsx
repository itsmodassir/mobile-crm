import type { Lead, CustomStatus } from '../types';

interface StatsRowProps {
    leads: Lead[];
    customStatuses?: CustomStatus[];
}

export function StatsRow({ leads, customStatuses = [] }: StatsRowProps) {
    const total = leads.length;

    // Use top 3-4 active statuses, or fallback to default
    const displayStatuses = customStatuses.filter(s => !s.isDefault).slice(0, 3);
    
    // Grid cols = 1 for total + how many display statuses we have
    const cols = 1 + displayStatuses.length;

    return (
        <div className={`grid grid-cols-2 sm:grid-cols-${Math.min(cols, 4)} lg:grid-cols-${Math.min(cols, 5)} gap-2 mb-6`}>
            <div className="bg-card border border-border rounded-xl p-3 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{total}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total</span>
            </div>
            
            {displayStatuses.map(status => {
                const count = leads.filter(l => l.status === status.value).length;
                return (
                    <div 
                        key={status.value} 
                        className="rounded-xl p-3 flex flex-col items-center justify-center border"
                        style={{
                            backgroundColor: `${status.color}15`,
                            borderColor: `${status.color}30`
                        }}
                    >
                        <span className="text-2xl font-bold" style={{ color: status.color }}>
                            {count}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider font-semibold opacity-80" style={{ color: status.color }}>
                            {status.label || status.value}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
