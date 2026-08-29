import axios from 'axios';

// Ensure this matches your local backend during development
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        email: string;
        role?: string;
    };
    workspaces: Array<{
        id: string;
        name: string;
    }>;
}

export const auth = {
    async login(email: string, password: string): Promise<AuthResponse> {
        try {
            // Note: Update this endpoint if wbdemo login path is slightly different.
            const response = await axios.post(`${API_BASE_URL}/auth/login`, {
                email,
                password
            });
            
            // wbdemo returns { data: { access_token, user: { ... } } }
            // axios wraps it in response.data, so it's response.data.data
            const authData = response.data.data;
            
            if (!authData || !authData.access_token) {
                throw new Error("Invalid credentials");
            }
            
            // Save token
            localStorage.setItem('jwt', authData.access_token);
            
            // Fetch the user's workspaces so we can set a workspace_id for future API calls
            try {
                const workspacesResponse = await axios.post(`${API_BASE_URL}/data/workspaces`, 
                    { action: 'select' },
                    {
                        headers: {
                            'Authorization': `Bearer ${authData.access_token}`
                        }
                    }
                );
                
                const workspacesList = workspacesResponse.data?.data || workspacesResponse.data || [];
                if (Array.isArray(workspacesList) && workspacesList.length > 0) {
                    localStorage.setItem('workspace_id', workspacesList[0].id);
                    localStorage.setItem('workspaces', JSON.stringify(workspacesList));
                }
            } catch (workspaceError) {
                console.warn('Could not fetch workspaces:', workspaceError);
            }
            
            // Set onboarding flag so root wrapper knows we are logged in
            localStorage.setItem('crm_onboarded', 'true');

            return {
                token: authData.access_token,
                user: authData.user,
                workspaces: []
            };
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    logout() {
        localStorage.removeItem('jwt');
        localStorage.removeItem('workspace_id');
        localStorage.removeItem('crm_onboarded');
        window.location.href = '/login';
    },

    getToken(): string | null {
        return localStorage.getItem('jwt');
    },
    
    getWorkspaceId(): string | null {
        return localStorage.getItem('workspace_id');
    },

    isAuthenticated(): boolean {
        return !!this.getToken();
    }
};
