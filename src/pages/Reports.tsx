import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PieChart, BarChart, TrendingUp } from 'lucide-react';
import { storage } from '../lib/storage';
import type { Lead } from '../types';
import { PageTransition } from '../components/MotionWrapper';

export function Reports() {
    const navigate = useNavigate();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const data = await storage.getLeads();
        setLeads(data);
        setLoading(false);
    }

    // --- Analytics Logic ---

    // 1. Status Distribution
    const statusCounts = {
        Fresh: leads.filter(l => l.status === 'Fresh').length,
        Hot: leads.filter(l => l.status === 'Hot').length,
        Warm: leads.filter(l => l.status === 'Warm').length,
        Cold: leads.filter(l => l.status === 'Cold').length,
        Dead: leads.filter(l => l.status === 'Dead').length,
    };
    const totalStatus = leads.length || 1;

    // 2. Source Breakdown
    const sourceCounts: Record<string, number> = {};
    leads.forEach(l => {
        const src = l.source || 'Direct';
        sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });
    // Sort by count desc and take top 5
    const topSources = Object.entries(sourceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    const maxSourceCount = Math.max(...topSources.map(s => s[1]), 1);

    // 3. Category Breakdown
    const categoryCounts: Record<string, number> = {};
    leads.forEach(l => {
        const cat = l.categoryName || 'Other';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    const topCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    const maxCategoryCount = Math.max(...topCategories.map(c => c[1]), 1);


    return (
        <PageTransition className="bg-background min-h-screen pb-24 safe-top">
            <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md p-4 flex items-center gap-4 border-b border-black/5">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full active:bg-zinc-100">
                    <ArrowLeft />
                </button>
                <h1 className="font-semibold text-lg">Analytics & Reports</h1>
            </header>

            <div className="p-4 space-y-8">
                {loading ? (
                    <div className="text-center text-muted-foreground mt-20 animate-pulse">Generating reports...</div>
                ) : leads.length === 0 ? (
                    <div className="text-center text-muted-foreground mt-20">No data available to analyze.</div>
                ) : (
                    <>
                        {/* Status Donut Chart */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                <PieChart size={16} />
                                <h2>Lead Status Distribution</h2>
                            </div>
                            <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center">
                                {/* CSS Conic Gradient Chart */}
                                <div
                                    className="w-48 h-48 rounded-full relative mb-6 shadow-2xl opacity-90"
                                    style={{
                                        background: `conic-gradient(
                                            #10b981 0% ${(statusCounts.Fresh / totalStatus) * 100}%,
                                            #f97316 ${(statusCounts.Fresh / totalStatus) * 100}% ${(statusCounts.Fresh + statusCounts.Hot) / totalStatus * 100}%,
                                            #eab308 ${(statusCounts.Fresh + statusCounts.Hot) / totalStatus * 100}% ${(statusCounts.Fresh + statusCounts.Hot + statusCounts.Warm) / totalStatus * 100}%,
                                            #3b82f6 ${(statusCounts.Fresh + statusCounts.Hot + statusCounts.Warm) / totalStatus * 100}% ${(statusCounts.Fresh + statusCounts.Hot + statusCounts.Warm + statusCounts.Cold) / totalStatus * 100}%,
                                            #3f3f46 ${(statusCounts.Fresh + statusCounts.Hot + statusCounts.Warm + statusCounts.Cold) / totalStatus * 100}% 100%
                                        )`
                                    }}
                                >
                                    {/* Inner Circle for Donut Effect */}
                                    <div className="absolute inset-4 bg-card rounded-full flex flex-col items-center justify-center">
                                        <span className="text-3xl font-bold">{leads.length}</span>
                                        <span className="text-xs text-muted-foreground">Total Leads</span>
                                    </div>
                                </div>

                                <div className="w-full grid grid-cols-2 gap-3 text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                        <span className="text-emerald-500 font-medium">{statusCounts.Fresh} Fresh</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                        <span className="text-orange-500 font-medium">{statusCounts.Hot} Hot</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                        <span className="text-yellow-500 font-medium">{statusCounts.Warm} Warm</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                        <span className="text-blue-500 font-medium">{statusCounts.Cold} Cold</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-zinc-600"></div>
                                        <span className="text-zinc-500 font-medium">{statusCounts.Dead} Dead</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Top Sources Bar Chart */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                <TrendingUp size={16} />
                                <h2>Top Lead Sources</h2>
                            </div>
                            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                                {topSources.map(([source, count]) => (
                                    <div key={source} className="space-y-1">
                                        <div className="flex justify-between text-xs font-medium">
                                            <span>{source}</span>
                                            <span className="text-muted-foreground">{count}</span>
                                        </div>
                                        <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                                                style={{ width: `${(count / maxSourceCount) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Category Distribution */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                <BarChart size={16} />
                                <h2>Category Breakdown</h2>
                            </div>
                            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                                {topCategories.map(([cat, count]) => (
                                    <div key={cat} className="space-y-1">
                                        <div className="flex justify-between text-xs font-medium">
                                            <span>{cat}</span>
                                            <span className="text-muted-foreground">{count}</span>
                                        </div>
                                        <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-purple-500 rounded-full transition-all duration-500 ease-out"
                                                style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </PageTransition>
    );
}
