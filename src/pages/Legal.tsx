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
                    <div className="bg-card border border-border rounded-xl p-5 space-y-4 text-sm leading-relaxed">
                        <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>

                        <h3 className="text-base font-medium text-white">1. Data Ownership</h3>
                        <p>
                            You own your data completely. <strong>Mobile CRM</strong> is a "local-first" application.
                            All your leads, templates, and settings are stored directly on your device (in the browser's Local Storage)
                            or in your own personal Google Drive (if you enable Cloud Backup).
                        </p>

                        <h3 className="text-base font-medium text-white">2. Data Collection</h3>
                        <p>
                            We (the developers of Mobile CRM) <strong>do not collect, store, or have access to your data</strong>.
                            We have no central database. Your data never passes through our servers.
                        </p>

                        <h3 className="text-base font-medium text-white">3. Google Drive Access</h3>
                        <p>
                            If you choose to use "Cloud Backup", the app requires access to your Google Drive to create and manage a single spreadsheet named <code>CRM_Leads</code>.
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                            <li>We only access files created by this app.</li>
                            <li>We do not read your other personal files or emails.</li>
                            <li>This access is used strictly for backing up and syncing your leads.</li>
                        </ul>
                    </div>
                </section>

                <section className="space-y-3">
                    <div className="flex items-center gap-2 text-primary mb-2">
                        <FileText size={24} />
                        <h2 className="text-xl font-semibold text-white">Terms of Service</h2>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-5 space-y-4 text-sm leading-relaxed">
                        <h3 className="text-base font-medium text-white">1. Usage</h3>
                        <p>
                            <strong>Mobile CRM</strong> is provided "as is" as a tool to help you manage your personal leads.
                            You are responsible for ensuring your use complies with local laws regarding data privacy and telemarketing.
                        </p>

                        <h3 className="text-base font-medium text-white">2. Liability</h3>
                        <p>
                            Since we do not host your data, we are not responsible for data loss.
                            We strongly recommend frequently backing up your data (using the Export function or Cloud Sync).
                        </p>

                        <h3 className="text-base font-medium text-white">3. Contact</h3>
                        <p>
                            For support or privacy concerns, please contact our support team.
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}
