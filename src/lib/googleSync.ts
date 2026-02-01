import axios from 'axios';
import { Lead } from '../types';
import { storage } from './storage';

// Placeholder - User will replace this.
// If you are reading this code: Get your ID from https://console.cloud.google.com/apis/credentials
export const GOOGLE_CLIENT_ID = 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com';

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
const SPREADSHEET_TITLE = 'CRM_Leads';

export const googleSync = {
    // 1. Verify if we have a valid token (simple check)
    isAuthenticated() {
        const token = localStorage.getItem('google_access_token');
        const expiry = localStorage.getItem('google_token_expiry');
        if (!token || !expiry) return false;
        return Date.now() < parseInt(expiry);
    },

    // 2. Save Token after successful login
    setSession(accessToken: string, expiresInSeconds: number) {
        localStorage.setItem('google_access_token', accessToken);
        // Expire 5 mins early to be safe
        const expiryTime = Date.now() + (expiresInSeconds - 300) * 1000;
        localStorage.setItem('google_token_expiry', expiryTime.toString());
    },

    logout() {
        localStorage.removeItem('google_access_token');
        localStorage.removeItem('google_token_expiry');
        localStorage.removeItem('google_spreadsheet_id');
    },

    // 3. Find or Create Spreadsheet
    async initSpreadsheet(): Promise<string> {
        const token = localStorage.getItem('google_access_token');
        if (!token) throw new Error('Not authenticated');

        // Check if we already have the ID
        const existingId = localStorage.getItem('google_spreadsheet_id');
        if (existingId) return existingId;

        try {
            // Search for file
            // Note: Drive API is complex, simplified by just trying to create if not known
            // Ideally we'd list files `q name = '${SPREADSHEET_TITLE}'` but that needs Drive scope.
            // For simplicity/privacy, we will just create a new one on first connect 
            // OR we can rely on storing the ID. If lost, we create a new one. 
            // Users can merge manually if needed.

            // Allow user to manually enter ID if they want to reconnect? 
            // For now, let's create a NEW one if we don't have it locally.

            const createRes = await axios.post(
                'https://sheets.googleapis.com/v4/spreadsheets',
                {
                    properties: { title: SPREADSHEET_TITLE },
                    sheets: [{ properties: { title: 'Leads' } }]
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const spreadsheetId = createRes.data.spreadsheetId;

            // Add Headers
            await axios.post(
                `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Leads!A1:Z1:append`,
                {
                    values: [['ID', 'Name', 'Phone', 'Status', 'Category', 'Note Count', 'Updated At', 'JSON_DATA']]
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { valueInputOption: 'USER_ENTERED' }
                }
            );

            localStorage.setItem('google_spreadsheet_id', spreadsheetId);
            return spreadsheetId;
        } catch (error) {
            console.error('Error creating sheet:', error);
            throw error;
        }
    },

    // 4. Sync: Pull
    async pullFromSheet(): Promise<Lead[]> {
        const token = localStorage.getItem('google_access_token');
        const sheetId = localStorage.getItem('google_spreadsheet_id');
        if (!token || !sheetId) return [];

        try {
            const res = await axios.get(
                `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Leads!A2:H?majorDimension=ROWS`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const rows = res.data.values;
            if (!rows || rows.length === 0) return [];

            const parsedLeads: Lead[] = rows.map((row: any[]) => {
                // We rely on the JSON column (index 7, H) for full fidelity
                // But if it's missing (manual entry), we construct from columns
                try {
                    if (row[7]) return JSON.parse(row[7]);
                } catch (e) { /* ignore */ }

                return {
                    id: row[0] || 'uuid-placeholder',
                    title: row[1] || 'Unknown',
                    phone: row[2] || '',
                    status: row[3] || 'Fresh',
                    categoryName: row[4] || 'Other',
                    notes: [],
                    updatedAt: parseInt(row[6]) || Date.now(),
                    createdAt: Date.now()
                } as Lead;
            });

            return parsedLeads;
        } catch (error) {
            console.error('Pull failed:', error);
            return [];
        }
    },

    // 5. Sync: Push All (Overwrite Sheet or Append?)
    // Strategy: Simple Append is messy. 
    // Best for "Sync" is: Clear Sheet -> Write All current leads. 
    // This ensures deletions are synced and no duplicates.
    // It's inefficient for 10k leads, but fine for <1k.
    async pushToSheet(leads: Lead[]) {
        const token = localStorage.getItem('google_access_token');
        const sheetId = localStorage.getItem('google_spreadsheet_id');
        if (!token || !sheetId) throw new Error('Not connected');

        // Prepare Rows
        const rows = leads.map(l => [
            l.id,
            l.title,
            l.phone,
            l.status,
            l.categoryName || 'Other',
            l.notes.length,
            l.updatedAt,
            JSON.stringify(l)
        ]);

        try {
            // Clear existing data (keep headers)
            await axios.post(
                `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Leads!A2:H:clear`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Write new data
            if (rows.length > 0) {
                await axios.post(
                    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Leads!A2:append`,
                    { values: rows },
                    {
                        headers: { Authorization: `Bearer ${token}` },
                        params: { valueInputOption: 'USER_ENTERED' }
                    }
                );
            }
        } catch (error) {
            console.error('Push failed:', error);
            throw error;
        }
    }
};
