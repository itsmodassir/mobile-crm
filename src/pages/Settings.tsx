import { useRef, useState, useEffect } from 'react';
import { Download, Upload, Trash2, Database, Plus, X, Edit2, Cloud, RefreshCw, LogOut } from 'lucide-react';
import { storage } from '../lib/storage';
import { importer } from '../lib/importer';
import { googleSync, GOOGLE_CLIENT_ID } from '../lib/googleSync';
import { CATEGORIES, type Category } from '../lib/constants';
import type { MessageTemplate } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { cn } from '../lib/cn';
import { AdBanner } from '../components/AdBanner';

function TemplateManager() {
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', content: '' });

    useEffect(() => {
        const saved = localStorage.getItem('crm_templates');
        if (saved) {
            setTemplates(JSON.parse(saved));
        }
    }, []);

    const saveTemplates = (newTemplates: MessageTemplate[]) => {
        setTemplates(newTemplates);
        localStorage.setItem('crm_templates', JSON.stringify(newTemplates));
    };

    const handleSave = () => {
        if (!form.name || !form.content) return;

        if (editingId) {
            const updated = templates.map(t => t.id === editingId ? { ...t, ...form } : t);
            saveTemplates(updated);
            setEditingId(null);
        } else {
            const newTemplate = { id: uuidv4(), ...form };
            saveTemplates([...templates, newTemplate]);
            setIsAdding(false);
        }
        setForm({ name: '', content: '' });
    };

    const handleDelete = (id: string) => {
        if (confirm('Delete this template?')) {
            saveTemplates(templates.filter(t => t.id !== id));
        }
    };

    const startEdit = (t: MessageTemplate) => {
        setForm({ name: t.name, content: t.content });
        setEditingId(t.id);
        setIsAdding(false);
    };

    return (
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            {!isAdding && !editingId && (
                <button
                    onClick={() => setIsAdding(true)}
                    className="w-full py-2 border border-dashed border-zinc-700 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                >
                    <Plus size={16} />
                    Create New Template
                </button>
            )}

            {(isAdding || editingId) && (
                <div className="space-y-3 bg-zinc-900/50 p-3 rounded-lg border border-border">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium">{editingId ? 'Edit Template' : 'New Template'}</h3>
                        <button
                            onClick={() => { setIsAdding(false); setEditingId(null); setForm({ name: '', content: '' }); }}
                            className="text-zinc-500 hover:text-zinc-300"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    <input
                        placeholder="Template Name (e.g. Intro)"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        className="w-full bg-zinc-900 border border-border rounded-lg p-2.5 text-sm"
                    />
                    <textarea
                        placeholder="Message content..."
                        value={form.content}
                        onChange={e => setForm({ ...form, content: e.target.value })}
                        className="w-full bg-zinc-900 border border-border rounded-lg p-2.5 text-sm min-h-[80px]"
                    />
                    <button
                        onClick={handleSave}
                        disabled={!form.name || !form.content}
                        className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                        Save Template
                    </button>
                </div>
            )}

            <div className="space-y-2">
                {templates.map(t => (
                    <div key={t.id} className="group flex items-center justify-between p-3 bg-zinc-900/50 hover:bg-zinc-900 border border-border/50 rounded-lg transition-colors">
                        <div className="min-w-0 flex-1 mr-4">
                            <h4 className="text-sm font-medium text-zinc-200 truncate">{t.name}</h4>
                            <p className="text-xs text-muted-foreground truncate opacity-70">{t.content}</p>
                        </div>
                        <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(t)} className="p-1.5 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md">
                                <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDelete(t.id)} className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
                {templates.length === 0 && !isAdding && !editingId && (
                    <p className="text-center text-xs text-muted-foreground py-2">No templates yet.</p>
                )}
            </div>
        </div>
    );
}

function CloudSyncSection() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [syncStatus, setSyncStatus] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        setIsAuthenticated(googleSync.isAuthenticated());
    }, []);

    const login = useGoogleLogin({
        onSuccess: async (codeResponse) => {
            googleSync.setSession(codeResponse.access_token, codeResponse.expires_in);
            setIsAuthenticated(true);
            setSyncStatus('Connected! Creating/Finding Sheet...');
            try {
                await googleSync.initSpreadsheet();
                setSyncStatus('Ready to sync.');
            } catch (err) {
                setSyncStatus('Error preparing sheet.');
                console.error(err);
            }
        },
        onError: (error) => console.log('Login Failed:', error),
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file'
    });

    const handleSync = async () => {
        if (!isAuthenticated) return;
        setIsSyncing(true);
        setSyncStatus('Syncing...');
        try {
            // 1. Pull from Cloud
            const cloudLeads = await googleSync.pullFromSheet();
            if (cloudLeads.length > 0) {
                await storage.bulkSaveLeads(cloudLeads);
            }

            // 2. Push merged data back to Cloud
            const allLeads = await storage.getLeads();
            await googleSync.pushToSheet(allLeads);

            setSyncStatus(`Synced ${allLeads.length} leads successfully!`);
        } catch (err) {
            console.error(err);
            setSyncStatus('Sync failed. Check console.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleLogout = () => {
        googleSync.logout();
        setIsAuthenticated(false);
        setSyncStatus('');
    };

    return (
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            {GOOGLE_CLIENT_ID.includes('YOUR_CLIENT_ID') ? (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-200 text-xs">
                    <strong>Setup Required:</strong> Please replace <code>YOUR_CLIENT_ID_HERE</code> in <code>src/lib/googleSync.ts</code> with your actual Google Cloud Client ID to enable this feature.
                </div>
            ) : null}

            {!isAuthenticated ? (
                <button
                    onClick={() => login()}
                    className="w-full py-3 bg-white text-black font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Connect Google Drive
                </button>
            ) : (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-green-400">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-sm font-medium">Connected</span>
                        </div>
                        <button onClick={handleLogout} className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1">
                            <LogOut size={12} /> Unlink
                        </button>
                    </div>

                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className={cn(
                            "w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all",
                            isSyncing ? "bg-zinc-800 text-zinc-400 cursor-wait" : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20"
                        )}
                    >
                        <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
                        {isSyncing ? 'Syncing...' : 'Sync Now'}
                    </button>

                    {syncStatus && (
                        <p className="text-xs text-center text-muted-foreground">{syncStatus}</p>
                    )}
                </div>
            )}
        </div>
    );
}

// ... existing TemplateManager ...

export function Settings() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState<string>('');
    const [importCategory, setImportCategory] = useState<Category | 'Other'>('Other');

    // Profile State
    const [profile, setProfile] = useState({ name: '', business: '', avatar: '' });

    useEffect(() => {
        const savedProfile = {
            name: localStorage.getItem('crm_user_name') || '',
            business: localStorage.getItem('crm_business_name') || '',
            avatar: localStorage.getItem('crm_user_avatar') || ''
        };
        setProfile(savedProfile);
    }, []);

    const updateProfile = (key: string, value: string) => {
        const newProfile = { ...profile, [key]: value };
        setProfile(newProfile);

        if (key === 'name') localStorage.setItem('crm_user_name', value);
        if (key === 'business') localStorage.setItem('crm_business_name', value);
        if (key === 'avatar') localStorage.setItem('crm_user_avatar', value);
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            updateProfile('avatar', base64);
        };
        reader.readAsDataURL(file);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setStatus('Reading file...');
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = event.target?.result as string;
                if (!json.trim()) throw new Error("File is empty");

                const leads = importer.validateAndParse(json, importCategory);
                if (leads.length === 0) throw new Error("No valid leads found in file");

                await storage.bulkSaveLeads(leads);
                setStatus(`Success! Imported ${leads.length} leads as ${importCategory}. Redirecting...`);
                setTimeout(() => {
                    setStatus('');
                    navigate('/');
                }, 1500);
            } catch (err: any) {
                console.error(err);
                setStatus(`Error: ${err.message || 'Invalid JSON format'}`);
            }
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleExport = async () => {
        const leads = await storage.getLeads();
        const json = JSON.stringify(leads, null, 2);
        const file = new File([json], `crm-backup-${new Date().toISOString().split('T')[0]}.json`, { type: 'application/json' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: 'CRM Backup',
                    text: 'Here is my CRM backup file.'
                });
                return;
            } catch (error) {
                console.log('Share failed or cancelled, falling back to download.');
            }
        }

        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
        setStatus('Export downloaded.');
    };

    const handleExportCSV = async () => {
        const leads = await storage.getLeads();
        if (leads.length === 0) {
            setStatus('No leads to export.');
            return;
        }

        const headers = ['Name', 'Phone', 'Status', 'Email', 'Source', 'Business Type', 'City', 'Notes Count', 'JSON_DATA'];
        const csvRows = [headers.join(',')];

        for (const lead of leads) {
            const row = [
                `"${lead.title.replace(/"/g, '""')}"`,
                `"${lead.phone}"`,
                `"${lead.status}"`,
                `"${lead.email || ''}"`,
                `"${lead.source || ''}"`,
                `"${lead.categoryName || ''}"`,
                `"${lead.city || ''}"`,
                `"${lead.notes.length}"`,
                `"${JSON.stringify(lead).replace(/"/g, '""')}"` // Include full JSON support for round-trip sync if needed via CSV too
            ];
            csvRows.push(row.join(','));
        }

        const csvString = csvRows.join('\n');
        const file = new File([csvString], `crm-leads-${new Date().toISOString().split('T')[0]}.csv`, { type: 'text/csv' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: 'CRM Leads Export',
                    text: 'Here is my leads CSV file.'
                });
                return;
            } catch (error) {
                console.log('Share failed or cancelled, falling back to download.');
            }
        }

        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
        setStatus('CSV Export downloaded.');
    };

    const handleClear = async () => {
        if (confirm('Are you sure you want to delete ALL data? This cannot be undone.')) {
            await storage.clearAll();
            setStatus('All data cleared.');
        }
    };

    return (
        <div className="p-4 safe-top pb-24">
            <header className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Settings</h1>
                <div className="flex gap-2">
                    <button onClick={() => navigate('/doc')} className="px-3 py-1.5 bg-zinc-800 rounded-lg text-xs font-medium text-blue-400 hover:bg-zinc-700 transition-colors flex items-center gap-1.5">
                        <span>Help & Guide</span>
                    </button>
                    <button onClick={() => navigate('/')} className="p-3 bg-zinc-800 rounded-full text-zinc-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>
            </header>

            <div className="space-y-6">

                {/* Profile Section */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Personal Profile</h2>
                    <div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-4">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-dashed border-zinc-700 flex items-center justify-center overflow-hidden">
                                {profile.avatar ? (
                                    <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-bold text-zinc-600">
                                        {(profile.name || 'U').charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-full cursor-pointer transition-opacity">
                                <Upload size={20} className="text-white" />
                                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                            </label>
                        </div>

                        <div className="w-full space-y-3">
                            <div>
                                <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Your Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Modassir"
                                    value={profile.name}
                                    onChange={(e) => updateProfile('name', e.target.value)}
                                    className="w-full bg-zinc-900 border border-border rounded-lg p-2.5 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Business Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. My Agency"
                                    value={profile.business}
                                    onChange={(e) => updateProfile('business', e.target.value)}
                                    className="w-full bg-zinc-900 border border-border rounded-lg p-2.5 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Cloud Sync Section */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Cloud size={14} /> Cloud Backup
                    </h2>
                    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                        <CloudSyncSection />
                    </GoogleOAuthProvider>
                </section>

                <section className="space-y-3">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Communication Config</h2>
                    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                        <div>
                            <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Default Country Code</label>
                            <input
                                type="text"
                                placeholder="e.g. 91 (India)"
                                defaultValue={localStorage.getItem('crm_default_country') || ''}
                                onChange={(e) => localStorage.setItem('crm_default_country', e.target.value)}
                                className="w-full bg-zinc-900 border border-border rounded-lg p-2.5 text-sm"
                            />
                            <p className="text-[10px] text-muted-foreground mt-1">Used if lead phone number has no country code.</p>
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground font-medium mb-1.5 block">WhatsApp Default Message</label>
                            <textarea
                                placeholder="Hi, I am reaching out regarding..."
                                defaultValue={localStorage.getItem('crm_default_wa_msg') || ''}
                                onChange={(e) => localStorage.setItem('crm_default_wa_msg', e.target.value)}
                                className="w-full bg-zinc-900 border border-border rounded-lg p-2.5 text-sm min-h-[80px]"
                            />
                        </div>
                    </div>
                </section>

                <section className="space-y-3">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Message Templates</h2>
                    <TemplateManager />
                </section>

                <section className="space-y-3">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Data Management</h2>

                    <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
                        <div className="p-4 space-y-3">
                            <label className="text-xs text-muted-foreground font-medium block">Default Category for Import</label>
                            <select
                                value={importCategory}
                                onChange={(e) => setImportCategory(e.target.value as any)}
                                className="w-full bg-zinc-900 border border-border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="Other">Other (Default)</option>
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-2 flex items-center gap-4 active:bg-zinc-800/50 transition-colors cursor-pointer bg-zinc-800/20 p-3 rounded-lg border border-dashed border-zinc-700 hover:bg-zinc-800/40"
                            >
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <Upload size={20} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-sm">Tap to Import JSON</h3>
                                    <p className="text-xs text-muted-foreground">Applies selected category if missing</p>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".json"
                                    className="hidden"
                                    onChange={handleImport}
                                />
                            </div>
                        </div>

                        <div
                            onClick={handleExport}
                            className="p-4 flex items-center gap-4 active:bg-zinc-800/50 transition-colors cursor-pointer border-b border-border/50"
                        >
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                <Database size={20} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium text-sm">Export JSON</h3>
                                <p className="text-xs text-muted-foreground">Detailed backup format</p>
                            </div>
                        </div>

                        <div
                            onClick={handleExportCSV}
                            className="p-4 flex items-center gap-4 active:bg-zinc-800/50 transition-colors cursor-pointer"
                        >
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <Download size={20} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium text-sm">Export CSV / Excel</h3>
                                <p className="text-xs text-muted-foreground">Spreadsheet friendly format</p>
                            </div>
                        </div>

                        <div
                            onClick={handleClear}
                            className="p-4 flex items-center gap-4 active:bg-zinc-800/50 transition-colors cursor-pointer"
                        >
                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                <Trash2 size={20} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium text-sm text-red-400">Clear All Data</h3>
                                <p className="text-xs text-muted-foreground">Remove all local data</p>
                            </div>
                        </div>
                    </div>

                    {status && (
                        <p className="text-center text-sm font-medium text-primary animate-pulse">{status}</p>
                    )}
                </section>

                <section className="space-y-3">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Support</h2>
                    <div className="bg-card border border-border rounded-xl p-4">
                        <a
                            href="mailto:crm@aerostic.com?subject=Support Request"
                            className="flex items-center gap-4 w-full"
                        >
                            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                            </div>
                            <div className="flex-1 text-left">
                                <h3 className="font-medium text-sm">Contact Support</h3>
                                <p className="text-xs text-muted-foreground">crm@aerostic.com</p>
                            </div>
                        </a>
                    </div>
                </section>

                <section className="text-center space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-500">
                        <Database size={12} />
                        <span>Local Storage v1.0</span>
                    </div>
                    <div>
                        <button onClick={() => navigate('/legal')} className="text-[10px] text-zinc-600 hover:text-zinc-400 underline">
                            Privacy Policy & Terms
                        </button>
                    </div>
                </section>
            </div>

            <AdBanner />
        </div>
    );
}
