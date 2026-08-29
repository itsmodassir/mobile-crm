import axios from 'axios';

async function test() {
    // Just using a fake workspace ID to see the error or success
    const API_BASE_URL = 'https://api.aerostic.com';
    const workspaceId = 'd5f1a561-12c8-47ad-959c-dcbe9e71ec60'; // example
    const token = 'fake_token'; // we might get a 401, but we'll see if the endpoint exists

    try {
        const res = await axios.post(`${API_BASE_URL}/data/messages`, {
            action: 'select',
            filters: [{ column: 'workspace_id', operator: 'eq', value: workspaceId }]
        }, {
            headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': workspaceId }
        });
        console.log("Success:", res.data);
    } catch (e) {
        console.log("Error:", e.response ? e.response.data : e.message);
    }
}
test();
