import { get, set, update } from 'idb-keyval';
import type { Lead } from '../types';
import { apiSync } from './apiSync';

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
        
        // Push to backend asynchronously, fire and forget for UI responsiveness
        // (but ideally you'd have a sync queue for offline support)
        apiSync.pushLeadToBackend(lead).catch(err => console.error('Background sync failed', err));
    },

    async bulkSaveLeads(newLeads: Lead[]): Promise<void> {
        await update<Lead[]>(STORE_KEY, (val) => {
            const leads = val || [];

            newLeads.forEach(newLead => {
                const index = leads.findIndex((l) => l.id === newLead.id);
                if (index !== -1) {
                    const currentLead = leads[index];
                    const currentUpdated = currentLead.updated_at ? new Date(currentLead.updated_at).getTime() : 0;
                    const newUpdated = newLead.updated_at ? new Date(newLead.updated_at).getTime() : 0;

                    // CONFLICT RESOLUTION: Last Write Wins
                    if (newUpdated >= currentUpdated) {
                        leads[index] = newLead;
                    }
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
        
        // Push to backend asynchronously, fire and forget
        apiSync.deleteLeadFromBackend(id).catch(err => console.error('Background delete failed', err));
    },

    async clearAll(): Promise<void> {
        await set(STORE_KEY, []);
        await set('chat_messages', []);
    },

    async getMessages(leadId: string): Promise<any[]> {
        const msgs = (await get<any[]>('chat_messages')) || [];
        return msgs.filter(m => m.lead_id === leadId);
    },

    async saveMessage(msg: any): Promise<void> {
        await update<any[]>('chat_messages', (val) => {
            const msgs = val || [];
            const index = msgs.findIndex((m) => m.id === msg.id);
            if (index !== -1) {
                msgs[index] = msg;
            } else {
                msgs.push(msg);
            }
            return msgs;
        });
    }
};
