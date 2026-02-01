import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, FileText } from 'lucide-react';

export function Legal() {
    const navigate = useNavigate();

    return (
        <div className="p-4 safe-top pb-24 max-w-2xl mx-auto">
            <header className="mb-6 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-3 bg-zinc-800 rounded-full text-zinc-400 hover:text-white">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold">Legal & Privacy</h1>
            </header>

            <div className="space-y-8 text-zinc-300">
                <section className="space-y-3">
                    <div className="flex items-center gap-2 text-primary mb-2">
                        <Shield size={24} />
                        <h2 className="text-xl font-semibold text-white">Privacy Policy</h2>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-5 space-y-4 text-sm leading-relaxed shadow-sm">
                        <p className="text-zinc-400 text-xs"><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>

                        <h3 className="text-base font-medium text-white">1. Introduction</h3>
                        <p>
                            Welcome to <strong>Mobile CRM</strong>. We respect your privacy and represent a "Local-First" philosophy.
                            This policy describes how we handle (or rather, do not handle) your data.
                        </p>

                        <h3 className="text-base font-medium text-white">2. Data Ownership & Storage</h3>
                        <p>
                            You retain full ownership of your data.
                            All leads, contacts, templates, and notes are stored <strong>locally on your device</strong> using browser storage (IndexedDB).
                            We do not have a central server, and we cannot access, view, or sell your data.
                        </p>

                        <h3 className="text-base font-medium text-white">3. Cloud Backup (Google Drive)</h3>
                        <p>
                            If you enable "Cloud Sync", the app creates a connection directly between your device and your Google Drive.
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                            <li><strong>Access Scope:</strong> We strictly use the `drive.file` scope, meaning we can ONLY access files created by this app. We cannot see your other documents or photos.</li>
                            <li><strong>Data Transmission:</strong> Data is sent directly from your device to Google's servers. It does not pass through any intermediate server owned by us.</li>
                        </ul>

                        <h3 className="text-base font-medium text-white">4. Cookies & Local Data</h3>
                        <p>
                            We do not use tracking cookies for advertising. We use "Local Storage" strictly to save your preferences (e.g., your profile name, theme settings, and last active filters).
                        </p>
                    </div>
                </section>

                <section className="space-y-3">
                    <div className="flex items-center gap-2 text-primary mb-2">
                        <FileText size={24} />
                        <h2 className="text-xl font-semibold text-white">Terms of Service</h2>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-5 space-y-4 text-sm leading-relaxed shadow-sm">
                        <h3 className="text-base font-medium text-white">1. Permitted Use</h3>
                        <p>
                            Mobile CRM is a productivity tool for managing business leads. You agree to use this tool in compliance with all applicable local laws,
                            including data protection (GDPR/CCPA) and telemarketing regulations.
                        </p>

                        <h3 className="text-base font-medium text-white">2. Disclaimer of Warranties</h3>
                        <p>
                            The application is provided "as is". While we strive for stability, we do not guarantee specific uptime or data integrity.
                            <strong>You are solely responsible for backing up your data.</strong>
                        </p>

                        <h3 className="text-base font-medium text-white">3. Limitation of Liability</h3>
                        <p>
                            Since we do not host your data, the developers of Mobile CRM are not liable for any data loss, business interruption, or loss of profits arising from the use of this software.
                        </p>
                    </div>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-semibold text-white">Contact Us</h2>
                    <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-5 text-sm">
                        <p>
                            If you have questions about this policy or need technical support, please contact us at:
                        </p>
                        <a href="mailto:support@mobilecrm.app" className="block mt-2 text-blue-400 hover:underline font-medium">support@mobilecrm.app</a>
                    </div>
                </section>
            </div>
        </div>
    );
}
