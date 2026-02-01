import type { Lead } from '../types';

interface StatsRowProps {
    leads: Lead[];
}

export function StatsRow({ leads }: StatsRowProps) {
    const total = leads.length;
    const hot = leads.filter(l => l.status === 'Hot').length;
    const warm = leads.filter(l => l.status === 'Warm').length;
    const fresh = leads.filter(l => l.status === 'Fresh').length;

    return (
        <div className="grid grid-cols-4 gap-2 mb-6">
            <div className="bg-card border border-border rounded-xl p-3 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{total}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total</span>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-orange-500">{hot}</span>
                <span className="text-[10px] uppercase tracking-wider text-orange-500/70 font-semibold">Hot</span>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-yellow-500">{warm}</span>
                <span className="text-[10px] uppercase tracking-wider text-yellow-500/70 font-semibold">Warm</span>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-green-500">{fresh}</span>
                <span className="text-[10px] uppercase tracking-wider text-green-500/70 font-semibold">Fresh</span>
            </div>
        </div>
    );
}
