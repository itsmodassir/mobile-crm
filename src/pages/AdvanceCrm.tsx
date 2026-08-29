import { useNavigate } from 'react-router-dom';
import { Users, Target, FileText, Receipt, Crown, Store, UserCog, Clock, Banknote, Calculator, BarChart3 } from 'lucide-react';
import { PageTransition } from '../components/MotionWrapper';
import { cn } from '../lib/cn';

export function AdvanceCrm() {
    const navigate = useNavigate();

    const modules = [
        { id: 'clients', label: 'Clients', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', path: '/advance-crm/clients' },
        { id: 'pipeline', label: 'Pipeline', icon: Target, color: 'text-orange-500', bg: 'bg-orange-500/10', path: '/advance-crm/pipeline' },
        { id: 'invoices', label: 'Invoices', icon: Receipt, color: 'text-emerald-500', bg: 'bg-emerald-500/10', path: '/advance-crm/invoices' },
        { id: 'proposals', label: 'Proposals', icon: FileText, color: 'text-purple-500', bg: 'bg-purple-500/10', path: '/advance-crm/proposals' },
        { id: 'catalogue', label: 'Catalogue', icon: Store, color: 'text-pink-500', bg: 'bg-pink-500/10', path: '/advance-crm/catalogue' },
        { id: 'employee-management', label: 'Employee Mgt', icon: UserCog, color: 'text-indigo-500', bg: 'bg-indigo-500/10', path: '/advance-crm/employees' },
        { id: 'attendance', label: 'Attendance', icon: Clock, color: 'text-teal-500', bg: 'bg-teal-500/10', path: '/advance-crm/attendance' },
        { id: 'payroll', label: 'Payroll', icon: Banknote, color: 'text-green-500', bg: 'bg-green-500/10', path: '/advance-crm/payroll' },
        { id: 'accounts', label: 'Accounts', icon: Calculator, color: 'text-cyan-500', bg: 'bg-cyan-500/10', path: '/advance-crm/accounts' },
        { id: 'reports', label: 'Reports', icon: BarChart3, color: 'text-rose-500', bg: 'bg-rose-500/10', path: '/advance-crm/reports' },
    ];

    return (
        <PageTransition className="safe-top min-h-screen pb-32 bg-slate-50/50">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Crown className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Advance CRM</h1>
                    <p className="text-xs text-muted-foreground">Operations hub</p>
                </div>
            </div>

            {/* Modules Grid */}
            <div className="p-4 grid grid-cols-2 gap-4">
                {modules.map((m) => {
                    const Icon = m.icon;
                    return (
                        <button
                            key={m.id}
                            onClick={() => navigate(m.path)}
                            className="bg-card border border-border/50 rounded-2xl p-5 flex flex-col items-start gap-4 transition-all active:scale-95 shadow-sm hover:shadow-md text-left"
                        >
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", m.bg)}>
                                <Icon className={cn("w-6 h-6", m.color)} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">{m.label}</h3>
                            </div>
                        </button>
                    );
                })}
            </div>
        </PageTransition>
    );
}
