import axios from 'axios';
import type { Lead } from '../types';
import { auth, API_BASE_URL } from './auth';

// Thin fetch wrapper for the plan-gated /api/crm/* endpoints
export async function crmApi(path: string, opts: { method?: string; body?: any } = {}) {
    const token = auth.getToken();
    const workspaceId = auth.getWorkspaceId();
    if (!token || !workspaceId) throw new Error('Not connected');

    const method = opts.method || 'GET';
    const url = new URL(`${API_BASE_URL}/crm${path}`, window.location.origin);
    
    if (method === 'GET' || method === 'DELETE') {
        url.searchParams.set('workspace_id', workspaceId);
    }

    try {
        const res = await axios({
            url: url.toString(),
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'x-workspace-id': workspaceId
            },
            data: method !== 'GET' ? { ...(opts.body || {}), workspace_id: workspaceId } : undefined
        });
        
        // Match the backend's data wrapper format
        return res.data.data ?? res.data;
    } catch (error: any) {
        throw new Error(error?.response?.data?.error || `Request failed (${error?.response?.status})`);
    }
}

export const apiSync = {
    // 1. Sync: Pull
    async pullFromBackend(): Promise<Lead[]> {
        const token = auth.getToken();
        const workspaceId = auth.getWorkspaceId();
        
        if (!token || !workspaceId) return [];

        try {
            const res = await axios.post(
                `${API_BASE_URL}/data/leads`,
                { 
                    action: 'select',
                    filters: [
                        { column: 'workspace_id', operator: 'eq', value: workspaceId }
                    ]
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'x-workspace-id': workspaceId
                    }
                }
            );

            // Fetch internal messages (Team Notes)
            const msgRes = await axios.post(
                `${API_BASE_URL}/data/internal_messages`,
                { 
                    action: 'select',
                    filters: [{ column: 'workspace_id', operator: 'eq', value: workspaceId }]
                },
                { headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': workspaceId } }
            ).catch(() => ({ data: { data: [] } }));
            
            const internalMsgs = msgRes.data?.data || msgRes.data || [];
            const msgsByLead: Record<string, any[]> = {};
            internalMsgs.forEach((m: any) => {
                if (!msgsByLead[m.lead_id]) msgsByLead[m.lead_id] = [];
                msgsByLead[m.lead_id].push({
                    id: m.id,
                    content: m.content,
                    timestamp: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
                    type: 'manual',
                    sender_id: m.sender_id
                });
            });

            // The backend returns { data: [...] } inside the axios res.data wrapper
            const rows = res.data?.data || [];
            return rows.map((row: any) => {
                const teamNotes = msgsByLead[row.id] || [];
                return { ...row, notes: teamNotes.sort((a: any, b: any) => b.timestamp - a.timestamp) };
            });
        } catch (error) {
            console.error('Pull failed:', error);
            return [];
        }
    },

    async fetchSettings(key: string): Promise<any> {
        const token = auth.getToken();
        const workspaceId = auth.getWorkspaceId();
        if (!token || !workspaceId) return null;

        try {
            const res = await axios.post(
                `${API_BASE_URL}/data/settings`,
                {
                    action: 'select',
                    filters: [
                        { column: 'workspace_id', operator: 'eq', value: workspaceId },
                        { column: 'key', operator: 'eq', value: key }
                    ]
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'x-workspace-id': workspaceId
                    }
                }
            );
            console.log('fetchSettings response:', res.data);
            const rows = res.data.data || [];
            if (rows.length > 0 && rows[0].value) {
                try {
                    return JSON.parse(rows[0].value);
                } catch {
                    return rows[0].value;
                }
            }
            return []; // Return empty array if not found instead of null, to distinguish from error
        } catch (error: any) {
            console.warn('Failed to fetch settings, degrading gracefully:', error?.response?.data || error);
            return null;
        }
    },

    // 2. Sync: Push (Insert/Update)
    // Note: Since idb-keyval stores local state, we push dirty records individually or batch them.
    // For simplicity, this takes a single lead and upserts it.
    async pushLeadToBackend(lead: Lead): Promise<void> {
        const token = auth.getToken();
        const workspaceId = auth.getWorkspaceId();
        
        if (!token || !workspaceId) throw new Error('Not connected');

        try {
            // First, push the lead data
            const dataToPush = { 
                ...lead, 
                workspace_id: workspaceId
            };
            // Do not send notes array to leads table!
            delete (dataToPush as any).notes;

            // Sync notes to internal_messages
            if (lead.notes && lead.notes.length > 0) {
                let senderId = localStorage.getItem('user_id');
                if (!senderId) {
                    const profilesRes = await axios.post(`${API_BASE_URL}/data/profiles`, 
                        { action: 'select', filters: [{ column: 'workspace_id', operator: 'eq', value: workspaceId }] },
                        { headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': workspaceId } }
                    ).catch(() => ({ data: { data: [] } }));
                    const profiles = profilesRes.data?.data || profilesRes.data || [];
                    if (profiles.length > 0) {
                        senderId = profiles[0].user_id || profiles[0].id;
                        localStorage.setItem('user_id', senderId || '');
                    }
                }

                if (senderId) {
                    const existingRes = await axios.post(`${API_BASE_URL}/data/internal_messages`, 
                        { action: 'select', filters: [{ column: 'lead_id', operator: 'eq', value: lead.id }] },
                        { headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': workspaceId } }
                    ).catch(() => ({ data: { data: [] } }));
                    const existingMsgs = existingRes.data?.data || existingRes.data || [];
                    const existingContents = new Set(existingMsgs.map((m: any) => m.content));

                    for (const note of lead.notes) {
                        if (!existingContents.has(note.content)) {
                            await axios.post(`${API_BASE_URL}/data/internal_messages`, {
                                action: 'insert',
                                data: {
                                    id: note.id?.length === 36 ? note.id : undefined,
                                    workspace_id: workspaceId,
                                    sender_id: senderId,
                                    lead_id: lead.id,
                                    content: note.content
                                }
                            }, { headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': workspaceId } }).catch(console.error);
                        }
                    }
                }
            }

            // We'll try to update first
            try {
                await axios.post(
                    `${API_BASE_URL}/data/leads`,
                    { 
                        action: 'update', 
                        data: dataToPush,
                        filters: [{ column: 'id', operator: 'eq', value: lead.id }]
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'x-workspace-id': workspaceId
                        }
                    }
                );
            } catch (err: any) {
                // If update fails (maybe it doesn't exist), try insert
                if (err.response?.status === 404 || err.response?.status === 400 || err.response?.status === 500) {
                     await axios.post(
                        `${API_BASE_URL}/data/leads`,
                        { 
                            action: 'insert', 
                            data: dataToPush
                        },
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'x-workspace-id': workspaceId
                            }
                        }
                    );
                } else {
                    throw err;
                }
            }

        } catch (error) {
            console.error('Push failed:', error);
            throw error;
        }
    },

    async deleteLeadFromBackend(id: string): Promise<void> {
        const token = auth.getToken();
        const workspaceId = auth.getWorkspaceId();
        
        if (!token || !workspaceId) return;

        try {
            await axios.post(
                `${API_BASE_URL}/data/leads`,
                { 
                    action: 'delete', 
                    filters: [{ column: 'id', operator: 'eq', value: id }]
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'x-workspace-id': workspaceId
                    }
                }
            );
        } catch (error) {
            console.error('Delete failed:', error);
        }
    }
};
