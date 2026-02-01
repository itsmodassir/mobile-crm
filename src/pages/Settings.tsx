import { useRef, useState, useEffect } from 'react';
import { Download, Upload, Trash2, Database, Plus, X, Edit2 } from 'lucide-react';
import { storage } from '../lib/storage';
import { importer } from '../lib/importer';
import { CATEGORIES, type Category } from '../lib/constants';
import type { MessageTemplate } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';

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
                // Basic validation before parsing
                if (!json.trim()) throw new Error("File is empty");

                const leads = importer.validateAndParse(json, importCategory);
                if (leads.length === 0) throw new Error("No valid leads found in file");

                await storage.bulkSaveLeads(leads);
                setStatus(`Success! Imported ${leads.length} leads as ${importCategory}. Redirecting...`);
                setTimeout(() => {
                    setStatus('');
                    navigate('/'); // Auto-redirect to Dashboard
                }, 1500);
            } catch (err: any) {
                console.error(err);
                setStatus(`Error: ${err.message || 'Invalid JSON format'}`);
            }
        };
        reader.readAsText(file);
        // Reset input
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

        // Define generic headers
        const headers = ['Name', 'Phone', 'Status', 'Email', 'Source', 'Business Type', 'City', 'Notes Count'];
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
                `"${lead.notes.length}"`
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
                <button onClick={() => navigate('/')} className="p-3 bg-zinc-800 rounded-full text-zinc-400 hover:text-white">
                    <X size={20} />
                </button>
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

                <section className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-500">
                        <Database size={12} />
                        <span>Local Storage v1.0</span>
                    </div>
                </section>
            </div>
        </div>
    );
}
