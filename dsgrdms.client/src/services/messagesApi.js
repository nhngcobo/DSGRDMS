const BASE = '/api/messages';
import { apiFetch } from './apiClient.js';

async function handleResponse(res) {
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return res.json();
}

export async function fetchMessages() {
    const res = await apiFetch(BASE);
    return handleResponse(res);
}

export async function fetchUnreadCount() {
    const res = await apiFetch(`${BASE}/unread-count`);
    return handleResponse(res);
}

export async function sendMessage(growerId, subject, body) {
    const res = await apiFetch(BASE, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ growerId, subject, body }),
    });
    return handleResponse(res);
}

export async function sendQuery(queryType, subject, body) {
    const res = await apiFetch(`${BASE}/query`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ queryType, subject, body }),
    });
    return handleResponse(res);
}

export async function markMessageRead(id) {
    const res = await apiFetch(`${BASE}/${id}/read`, { method: 'PUT' });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
}

export async function fetchFieldOfficers() {
    const res = await apiFetch(`${BASE}/field-officers`);
    return handleResponse(res);
}

export async function assignQuery(messageId, officerUserId) {
    const res = await apiFetch(`${BASE}/${messageId}/assign`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ officerUserId }),
    });
    return handleResponse(res);
}

export async function replyToMessage(messageId, replyStatus) {
    const res = await apiFetch(`${BASE}/${messageId}/reply`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ replyStatus }),
    });
    return handleResponse(res);
}
