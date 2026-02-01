import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Database, Cloud, Share2 } from 'lucide-react';

export function UserGuide() {
    const navigate = useNavigate();

    return (
        <div className="safe-top min-h-screen pb-24 bg-background px-4 py-4 space-y-8">
            {/* Header */}
            <header className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    User Guide
                </h1>
            </header>

            {/* Section 1: Installation */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-lg border-b border-white/10 pb-2">
                    <Download size={20} />
                    <h2>Installation (PWA)</h2>
                </div>
                <div className="space-y-4 text-zinc-300 text-sm leading-relaxed">
                    <p>
                        This CRM is designed to be installed on your phone for the best experience. It works offline and feels like a native app.
                    </p>

                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 space-y-2">
                        <h3 className="font-bold text-white">Android (Chrome)</h3>
                        <ol className="list-decimal list-inside space-y-1 text-zinc-400">
                            <li>Open this website in <strong>Chrome</strong>.</li>
                            <li>Tap the <strong>three dots</strong> menu (top right).</li>
                            <li>Select <strong>"Install App"</strong> or <strong>"Add to Home Screen"</strong>.</li>
                        </ol>
                    </div>

                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 space-y-2">
                        <h3 className="font-bold text-white">iOS (Safari)</h3>
                        <ol className="list-decimal list-inside space-y-1 text-zinc-400">
                            <li>Open this website in <strong>Safari</strong>.</li>
                            <li>Tap the <strong>Share</strong> button (bottom center).</li>
                            <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
                        </ol>
                    </div>
                </div>
            </section>

            {/* Section 2: Google Sync */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-green-400 font-bold text-lg border-b border-white/10 pb-2">
                    <Cloud size={20} />
                    <h2>Cloud Backup (Google Drive)</h2>
                </div>
                <div className="text-zinc-300 text-sm leading-relaxed space-y-3">
                    <p>
                        By default, your data lives <strong>only on this device</strong>. To safeguard your data or sync across devices, connect your Google Drive.
                    </p>
                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                        <ul className="list-disc list-inside space-y-2 text-zinc-400">
                            <li>Go to <strong>Settings</strong>.</li>
                            <li>Scroll to <strong>Cloud Backup</strong>.</li>
                            <li>Tap <strong>Connect Google Drive</strong>.</li>
                            <li>Tap <strong>Sync Now</strong> to push your local leads to the cloud.</li>
                        </ul>
                    </div>
                    <p className="text-xs text-zinc-500 italic">
                        Note: We create a file named 'CRM_Leads' in your Drive. We cannot access any other files.
                    </p>
                </div>
            </section>

            {/* Section 3: Import / Export */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-lg border-b border-white/10 pb-2">
                    <Database size={20} />
                    <h2>Import & Export data</h2>
                </div>
                <div className="text-zinc-300 text-sm leading-relaxed space-y-3">
                    <p>
                        You can move your data in and out using common file formats like JSON and CSV (Excel).
                    </p>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                            <h3 className="font-bold text-white flex items-center gap-2 mb-2">
                                <Share2 size={16} /> Export (Backup)
                            </h3>
                            <p className="text-zinc-400">
                                Go to <strong>Settings &gt; Data Management</strong>. Tap "Export JSON" for a full backup or "Export CSV" for a spreadsheet list.
                            </p>
                        </div>

                        <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                            <h3 className="font-bold text-white flex items-center gap-2 mb-2">
                                <Download size={16} /> Import Leads
                            </h3>
                            <p className="text-zinc-400">
                                You can bulk import leads via a JSON file. Ensure the structure matches our format.
                                Select a <strong>Default Category</strong> in Settings before importing to auto-assign unmatched leads.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
}
