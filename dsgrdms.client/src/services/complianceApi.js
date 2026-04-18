const BASE = '/api/compliance';

async function handleResponse(res) {
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Request failed (${res.status})`);
    }
    return res.json();
}

export async function fetchComplianceSummary(growerId) {
    const res = await fetch(`${BASE}/${growerId}`);
    return handleResponse(res);
}

export async function uploadComplianceDocument(growerId, docTypeId, file) {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${BASE}/${growerId}/${docTypeId}/upload`, {
        method: 'POST',
        body: form,
    });
    return handleResponse(res);
}

export async function reviewComplianceDocument(growerId, docTypeId, action, reason) {
    const res = await fetch(`${BASE}/${growerId}/${docTypeId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: reason ?? null }),
    });
    return handleResponse(res);
}
