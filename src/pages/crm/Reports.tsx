import { useState, useEffect } from 'react';
import { PageTransition } from '../../components/MotionWrapper';
import { ChevronLeft, Loader2, TrendingUp, TrendingDown, Users, FileText, Banknote, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth, API_BASE_URL } from '../../lib/auth';

export function Reports() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    
    // Data states
    const [expenses, setExpenses] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [payrolls, setPayrolls] = useState<any[]>([]);

    const globalCurrency = localStorage.getItem('crm_currency') || 'INR';

    useEffect(() => {
        const fetchAllData = async () => {
            setIsLoading(true);
            try {
                const token = auth.getToken();
                const workspaceId = auth.getWorkspaceId();
                if (!token || !workspaceId) return;

                const headers = { 'Authorization': `Bearer ${token}`, 'x-workspace-id': workspaceId };
                const payload = { action: 'select', filters: [{ column: 'workspace_id', operator: 'eq', value: workspaceId }] };

                const [expRes, empRes, invRes, payRes] = await Promise.all([
                    axios.post(`${API_BASE_URL}/data/crm_expenses`, payload, { headers }),
                    axios.post(`${API_BASE_URL}/data/crm_employees`, payload, { headers }),
                    axios.post(`${API_BASE_URL}/data/crm_invoices`, payload, { headers }),
                    axios.post(`${API_BASE_URL}/data/crm_payroll`, payload, { headers })
                ]);

                setExpenses(expRes.data?.data || expRes.data || []);
                setEmployees(empRes.data?.data || empRes.data || []);
                setInvoices(invRes.data?.data || invRes.data || []);
                setPayrolls(payRes.data?.data || payRes.data || []);
            } catch (err) {
                console.error("Failed to load report data", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    }, []);

    // Derived Metrics
    const totalIncome = expenses.filter(e => e.type === 'income').reduce((sum, e) => sum + Number(e.amount), 0);
    const totalExpense = expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + Number(e.amount), 0);
    const netProfit = totalIncome - totalExpense;

    const activeEmployees = employees.filter(e => e.status === 'active').length;
    const totalPayrollPaid = payrolls.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.net), 0);

    const paidInvoicesCount = invoices.filter(i => i.status === 'paid').length;
    const totalInvoiceAmount = invoices.reduce((sum, i) => sum + Number(i.total || 0), 0);

    // Current Month calculations
    const currentMonthPrefix = new Date().toISOString().substring(0, 7); // YYYY-MM
    const thisMonthIncome = expenses.filter(e => e.type === 'income' && e.date?.startsWith(currentMonthPrefix)).reduce((sum, e) => sum + Number(e.amount), 0);
    const thisMonthExpense = expenses.filter(e => e.type === 'expense' && e.date?.startsWith(currentMonthPrefix)).reduce((sum, e) => sum + Number(e.amount), 0);

    return (
        <PageTransition className="min-h-screen bg-slate-50/50 pb-20">
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center gap-3 safe-top">
                <button onClick={() => navigate('/advance-crm')} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all">
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-bold">Business Reports</h1>
                    <p className="text-xs text-muted-foreground">Analytics & Overview</p>
                </div>
            </div>

            {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-4" />
                    <p className="text-sm font-medium">Compiling your reports...</p>
                </div>
            ) : (
                <div className="p-4 space-y-6">
                    {/* Financial Overview */}
                    <div>
                        <h2 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-500" />
                            Financial Overview
                        </h2>
                        <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                            <p className="text-white/60 text-sm font-medium mb-1">Net Profit (All Time)</p>
                            <h3 className="text-3xl font-bold mb-4">{globalCurrency} {netProfit.toLocaleString()}</h3>
                            
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                                <div>
                                    <p className="text-xs text-white/50 mb-1">Total Income</p>
                                    <p className="text-emerald-400 font-semibold">{globalCurrency} {totalIncome.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-white/50 mb-1">Total Expenses</p>
                                    <p className="text-rose-400 font-semibold">{globalCurrency} {totalExpense.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* This Month's Performance */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                                    <Calendar className="w-4 h-4 text-emerald-600" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">This Month</span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium mb-0.5">Income</p>
                            <p className="text-lg font-bold text-slate-900">{globalCurrency} {thisMonthIncome.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center">
                                    <TrendingDown className="w-4 h-4 text-rose-600" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded">This Month</span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium mb-0.5">Expenses</p>
                            <p className="text-lg font-bold text-slate-900">{globalCurrency} {thisMonthExpense.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* HR & Payroll */}
                    <div>
                        <h2 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider flex items-center gap-2">
                            <Users className="w-4 h-4 text-purple-500" />
                            HR & Payroll
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
                                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center mb-2">
                                    <Users className="w-5 h-5 text-purple-600" />
                                </div>
                                <p className="text-2xl font-bold text-slate-900">{activeEmployees} / {employees.length}</p>
                                <p className="text-xs font-medium text-slate-500 mt-1">Active Employees</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
                                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mb-2">
                                    <Banknote className="w-5 h-5 text-amber-600" />
                                </div>
                                <p className="text-lg font-bold text-slate-900">{globalCurrency} {totalPayrollPaid.toLocaleString()}</p>
                                <p className="text-xs font-medium text-slate-500 mt-1">Total Paid Payroll</p>
                            </div>
                        </div>
                    </div>

                    {/* Invoices */}
                    <div>
                        <h2 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider flex items-center gap-2">
                            <FileText className="w-4 h-4 text-teal-500" />
                            Invoicing
                        </h2>
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 mb-0.5">Total Invoiced Amount</p>
                                    <p className="text-xl font-bold text-slate-900">{globalCurrency} {totalInvoiceAmount.toLocaleString()}</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                                    <FileText className="w-6 h-6 text-teal-600" />
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-medium text-slate-700">Total Invoices Generated</p>
                                    <p className="text-xs text-slate-500">{invoices.length} invoices across all time</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-slate-900">{paidInvoicesCount}</p>
                                    <p className="text-[10px] uppercase font-bold text-teal-600 tracking-wider">Paid</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </PageTransition>
    );
}
