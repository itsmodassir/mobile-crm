import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../lib/storage';
import type { Lead } from '../types';
import { CATEGORIES } from '../lib/constants';
import { PageTransition } from '../components/MotionWrapper';

export function AddLead() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        phone: '',
        categoryName: '',
        street: '',
        city: '',
        website: '',
        email: '',
        source: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.phone) return;

        setLoading(true);
        const newLead: Lead = {
            id: uuidv4(),
            title: formData.title,
            phone: formData.phone,
            status: 'Fresh',
            notes: [],
            categoryName: formData.categoryName || 'Other',
            street: formData.street,
            city: formData.city,
            website: formData.website,
            email: formData.email,
            source: formData.source,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        await storage.saveLead(newLead);
        navigate('/');
    };

    return (
        <PageTransition className="bg-background min-h-screen pb-24 safe-top">
            <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md p-4 flex items-center gap-4 border-b border-white/5">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full active:bg-zinc-800">
                    <ArrowLeft />
                </button>
                <h1 className="font-semibold text-lg">Add New Lead</h1>
            </header>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div className="space-y-2">
                    <label className="text-sm text-muted-foreground ml-1">Business Name *</label>
                    <input
                        required
                        type="text"
                        placeholder="e.g. Acme Corp"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-card border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm text-muted-foreground ml-1">Phone Number *</label>
                    <input
                        required
                        type="tel"
                        placeholder="+91 99999 99999"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-card border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm text-muted-foreground ml-1">Email Address</label>
                    <input
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-card border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm text-muted-foreground ml-1">Category</label>
                    <select
                        value={formData.categoryName}
                        onChange={e => setFormData({ ...formData, categoryName: e.target.value })}
                        className="w-full bg-card border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all appearance-none"
                    >
                        <option value="" disabled>Select Category</option>
                        {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm text-muted-foreground ml-1">Source</label>
                    <input
                        type="text"
                        placeholder="e.g. Instagram, Web, Referral"
                        value={formData.source}
                        onChange={e => setFormData({ ...formData, source: e.target.value })}
                        className="w-full bg-card border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm text-muted-foreground ml-1">City</label>
                        <input
                            type="text"
                            placeholder="Mumbai"
                            value={formData.city}
                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                            className="w-full bg-card border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm text-muted-foreground ml-1">Address/Street</label>
                        <input
                            type="text"
                            placeholder="Main St."
                            value={formData.street}
                            onChange={e => setFormData({ ...formData, street: e.target.value })}
                            className="w-full bg-card border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm text-muted-foreground ml-1">Website</label>
                    <input
                        type="url"
                        placeholder="https://..."
                        value={formData.website}
                        onChange={e => setFormData({ ...formData, website: e.target.value })}
                        className="w-full bg-card border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    />
                </div>

                <button
                    disabled={loading}
                    type="submit"
                    className="w-full bg-primary text-primary-foreground h-12 rounded-xl font-semibold flex items-center justify-center gap-2 mt-8 active:scale-95 transition-transform disabled:opacity-50"
                >
                    <Save size={18} />
                    {loading ? 'Saving...' : 'Save Lead'}
                </button>
            </form>
        </PageTransition>
    );
}
