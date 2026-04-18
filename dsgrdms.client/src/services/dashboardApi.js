const BASE = '/api/dashboard';

async function handleResponse(res) {
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return res.json();
}

export async function fetchDashboardSummary() {
    const res = await fetch(`${BASE}/summary`);
    return handleResponse(res);
}
