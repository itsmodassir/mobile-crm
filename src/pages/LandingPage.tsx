import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Lock, Zap, CheckCircle2, Globe, Database, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function LandingPage() {
    const navigate = useNavigate();
    const [isFooterOpen, setIsFooterOpen] = useState(false);

    const handleGetStarted = () => {
        localStorage.setItem('crm_onboarded', 'true');
        // Force a reload or navigate to trigger the main app view
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-background text-white flex flex-col font-sans selection:bg-primary/30">

            {/* Navbar */}
            <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-purple-500/20">
                        A
                    </div>
                    <span className="font-bold text-xl tracking-tight">Aerostic CRM</span>
                </div>
                <button
                    onClick={handleGetStarted}
                    className="hidden sm:block px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-sm font-medium transition-colors border border-white/5"
                >
                    Login
                </button>
            </nav>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12 relative overflow-hidden">

                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative z-10 max-w-4xl mx-auto space-y-8"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-4">
                        <Zap size={12} fill="currentColor" />
                        <span>v1.0 Now Live for Android & IOS</span>
                    </div>

                    <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.1]">
                        Manage Leads <br />
                        <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Without Limits
                        </span>
                    </h1>

                    <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                        The <strong>Local-First</strong> CRM that works offline, syncs with Google Drive, and respects your privacy. No monthly fees. No servers. Just you and your business.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <button
                            onClick={handleGetStarted}
                            className="w-full sm:w-auto px-8 py-4 bg-white text-black font-bold rounded-full text-lg hover:bg-zinc-200 transition-colors shadow-xl shadow-white/10 active:scale-95 transform"
                        >
                            Get Started Free
                        </button>
                        <button
                            onClick={handleGetStarted}
                            className="w-full sm:w-auto px-8 py-4 bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium rounded-full text-lg hover:bg-zinc-800 transition-colors active:scale-95 transform flex items-center justify-center gap-2"
                        >
                            <Smartphone size={20} />
                            Install App
                        </button>
                    </div>

                    {/* Trust Indicators */}
                    <div className="pt-12 flex flex-wrap justify-center gap-8 text-zinc-500 grayscale opacity-60">
                        <div className="flex items-center gap-2 text-sm"><CheckCircle2 size={16} /> Offline Ready</div>
                        <div className="flex items-center gap-2 text-sm"><Database size={16} /> Local Storage</div>
                        <div className="flex items-center gap-2 text-sm"><Globe size={16} /> Google Sync</div>
                        <div className="flex items-center gap-2 text-sm"><Lock size={16} /> 100% Private</div>
                    </div>

                </motion.div>
            </main>

            {/* Feature Grid (Condensed) */}
            <section className="bg-zinc-900/30 border-t border-white/5 py-12">
                <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-blue-500/30 transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
                            <Lock size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Privacy First</h3>
                        <p className="text-zinc-400 text-sm">Your data never leaves your device unless you sync it to your own Google Drive.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-purple-500/30 transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4">
                            <Zap size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Instant Action</h3>
                        <p className="text-zinc-400 text-sm">One-tap WhatsApp messaging with templates. Call, message, and track leads in seconds.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-green-500/30 transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 mb-4">
                            <Smartphone size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Installable PWA</h3>
                        <p className="text-zinc-400 text-sm">Install directly on iOS and Android. Works perfectly without an internet connection.</p>
                    </div>
                </div>
            </section>

            {/* Mobile Footer Toggle */}
            <footer className="border-t border-white/10 bg-black/50 backdrop-blur-lg fixed bottom-0 w-full z-50 md:relative md:bg-transparent md:backdrop-blur-none">

                {/* Mobile Handle */}
                <button
                    onClick={() => setIsFooterOpen(!isFooterOpen)}
                    className="w-full md:hidden flex flex-col items-center justify-center py-2 text-zinc-500 hover:text-white transition-colors"
                >
                    <div className="w-12 h-1 bg-zinc-800 rounded-full mb-2" />
                    <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-widest">
                        {isFooterOpen ? 'Close Menu' : 'Legal & Info'}
                        {isFooterOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    </div>
                </button>

                {/* Footer Content */}
                <AnimatePresence>
                    {(isFooterOpen || window.innerWidth >= 768) && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden md:h-auto md:opacity-100"
                        >
                            <div className="max-w-7xl mx-auto px-6 pb-8 pt-2 md:py-8 flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="text-sm text-zinc-500">
                                    © {new Date().getFullYear()} Aerostic CRM. All rights reserved.
                                </div>
                                <div className="flex gap-6 text-sm font-medium text-zinc-400">
                                    <a href="/privacy-policy" onClick={(e) => { e.preventDefault(); navigate('/privacy-policy'); }} className="hover:text-white transition-colors">Privacy Policy</a>
                                    <a href="/terms-condition" onClick={(e) => { e.preventDefault(); navigate('/terms-condition'); }} className="hover:text-white transition-colors">Terms of Service</a>
                                    <a href="mailto:support@aerostic.online" className="hover:text-white transition-colors">Contact</a>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </footer>
        </div>
    );
}

// Default export as well for lazy loading if needed
export default LandingPage;
