import axios from 'axios';
import type { Lead } from '../types';

// Placeholder - User will replace this.
// If you are reading this code: Get your ID from https://console.cloud.google.com/apis/credentials
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'MISSING_ENV_VAR';
export const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || 'MISSING_ENV_VAR'; // REQUIRED for persistent auth

const SPREADSHEET_TITLE = 'CRM_Leads';
const REDIRECT_URI = window.location.origin; // Dynamically use current origin

interface TokenResponse {
    access_token: string;
    refresh_token?: string; // Only returned on first auth code exchange
    expires_in: number;
    scope: string;
    token_type: string;
}

export const googleSync = {
    // 1. Check Auth (Handle Refresh if needed)
    async checkAndRefreshToken(): Promise<string | null> {
        let accessToken = localStorage.getItem('google_access_token');
        const expiry = localStorage.getItem('google_token_expiry');
        const refreshToken = localStorage.getItem('google_refresh_token');

        // Case A: Valid Token
        if (accessToken && expiry && Date.now() < parseInt(expiry)) {
            return accessToken;
        }

        // Case B: Expired but have Refresh Token
        if (refreshToken) {
            console.log('Token expired. Refreshing...');
            try {
                const newTokens = await this.refreshAccessToken(refreshToken);
                return newTokens.access_token;
            } catch (e) {
                console.error('Refresh Failed:', e);
                this.logout(); // Force re-login
                return null;
            }
        }

        // Case C: No valid auth
        return null;
    },

    isAuthenticated(): boolean {
        // Optimistic check. Real validation happens during sync.
        return !!localStorage.getItem('google_refresh_token') || !!localStorage.getItem('google_access_token');
    },

    // 2. Exchange Authorization Code for Tokens (Backend-less flow)
    async exchangeCodeForToken(code: string): Promise<void> {
        if (GOOGLE_CLIENT_SECRET.includes('YOUR_CLIENT_SECRET')) {
            alert('Setup Error: Please add your GOOGLE_CLIENT_SECRET in src/lib/googleSync.ts to enable persistent login.');
            throw new Error('Missing Client Secret');
        }

        const params = new URLSearchParams();
        params.append('code', code);
        params.append('client_id', GOOGLE_CLIENT_ID);
        params.append('client_secret', GOOGLE_CLIENT_SECRET);
        params.append('redirect_uri', REDIRECT_URI);
        params.append('grant_type', 'authorization_code');

        const res = await axios.post<TokenResponse>('https://oauth2.googleapis.com/token', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        this.saveSession(res.data);
    },

    // 3. Refresh Access Token
    async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
        const params = new URLSearchParams();
        params.append('client_id', GOOGLE_CLIENT_ID);
        params.append('client_secret', GOOGLE_CLIENT_SECRET);
        params.append('refresh_token', refreshToken);
        params.append('grant_type', 'refresh_token');

        const res = await axios.post<TokenResponse>('https://oauth2.googleapis.com/token', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        this.saveSession(res.data);
        return res.data;
    },

    saveSession(data: TokenResponse) {
        localStorage.setItem('google_access_token', data.access_token);
        // Expire 5 mins early to be safe
        const expiryTime = Date.now() + (data.expires_in - 300) * 1000;
        localStorage.setItem('google_token_expiry', expiryTime.toString());

        // Save Refresh Token if present (only on first exchange)
        if (data.refresh_token) {
            localStorage.setItem('google_refresh_token', data.refresh_token);
        }
    },

    logout() {
        localStorage.removeItem('google_access_token');
        localStorage.removeItem('google_token_expiry');
        localStorage.removeItem('google_refresh_token');
        localStorage.removeItem('google_spreadsheet_id');
    },

    // 4. Find or Create Spreadsheet
    async initSpreadsheet(): Promise<string> {
        const token = await this.checkAndRefreshToken();
        if (!token) throw new Error('Not authenticated');

        // Check if we already have the ID
        const existingId = localStorage.getItem('google_spreadsheet_id');
        if (existingId) return existingId;

        try {
            // 1. Search for existing file
            const searchRes = await axios.get(
                'https://www.googleapis.com/drive/v3/files',
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: {
                        q: `name = '${SPREADSHEET_TITLE}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`,
                        fields: 'files(id, name)'
                    }
                }
            );

            if (searchRes.data.files && searchRes.data.files.length > 0) {
                // Found it! Use the first one.
                const foundId = searchRes.data.files[0].id;
                localStorage.setItem('google_spreadsheet_id', foundId);
                return foundId;
            }

            // 2. If not found, create new
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

    // 5. Sync: Pull
    async pullFromSheet(): Promise<Lead[]> {
        const token = await this.checkAndRefreshToken();
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

    // 6. Sync: Push All
    async pushToSheet(leads: Lead[]) {
        const token = await this.checkAndRefreshToken();
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
