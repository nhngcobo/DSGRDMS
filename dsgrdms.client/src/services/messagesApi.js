const BASE = '/api/messages';

function authHeader(token) {
    return { Authorization: `Bearer ${token}` };
}

async function handleResponse(res) {
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return res.json();
}

export async function fetchMessages(token) {
    const res = await fetch(BASE, { headers: authHeader(token) });
    return handleResponse(res);
}

export async function fetchUnreadCount(token) {
    const res = await fetch(`${BASE}/unread-count`, { headers: authHeader(token) });
    return handleResponse(res);
}

export async function sendMessage(growerId, subject, body, token) {
    const res = await fetch(BASE, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader(token) },
        body:    JSON.stringify({ growerId, subject, body }),
    });
    return handleResponse(res);
}

export async function markMessageRead(id, token) {
    const res = await fetch(`${BASE}/${id}/read`, {
        method:  'PUT',
        headers: authHeader(token),
    });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
}
