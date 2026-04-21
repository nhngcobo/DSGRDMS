const BASE = '/api/dashboard';
import { apiFetch } from './apiClient.js';

async function handleResponse(res) {
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return res.json();
}

export async function fetchDashboardSummary() {
    const res = await apiFetch(`${BASE}/summary`);
    return handleResponse(res);
}
