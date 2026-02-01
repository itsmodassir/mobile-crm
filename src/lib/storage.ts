import { get, set, update } from 'idb-keyval';
import type { Lead } from '../types';

const STORE_KEY = 'leads_data';

export const storage = {
    async getLeads(): Promise<Lead[]> {
        return (await get<Lead[]>(STORE_KEY)) || [];
    },

    async saveLead(lead: Lead): Promise<void> {
        await update<Lead[]>(STORE_KEY, (val) => {
            const leads = val || [];
            const index = leads.findIndex((l) => l.id === lead.id);
            if (index !== -1) {
                leads[index] = lead;
            } else {
                leads.push(lead);
            }
            return leads;
        });
    },

    async bulkSaveLeads(newLeads: Lead[]): Promise<void> {
        await update<Lead[]>(STORE_KEY, (val) => {
            const leads = val || [];
            // Simple merge: add new ones, update existing ones by ID
            newLeads.forEach(newLead => {
                const index = leads.findIndex((l) => l.id === newLead.id);
                if (index !== -1) {
                    leads[index] = { ...leads[index], ...newLead };
                } else {
                    leads.push(newLead);
                }
            });
            return leads;
        });
    },

    async getLead(id: string): Promise<Lead | undefined> {
        const leads = await this.getLeads();
        return leads.find((l) => l.id === id);
    },

    async deleteLead(id: string): Promise<void> {
        await update<Lead[]>(STORE_KEY, (val) => {
            return (val || []).filter((l) => l.id !== id);
        });
    },

    async clearAll(): Promise<void> {
        await set(STORE_KEY, []);
    }
};
