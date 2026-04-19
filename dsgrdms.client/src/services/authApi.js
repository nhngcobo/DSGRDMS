const BASE = '/api/auth';

export async function login(email, password) {
    const res = await fetch(`${BASE}/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
    });
    if (res.status === 401) throw new Error('Invalid email or password.');
    if (!res.ok)            throw new Error(`Login failed (${res.status})`);
    return res.json(); // { token, role, name, growerId }
}

export async function linkGrower(growerId, token) {
    const res = await fetch(`${BASE}/link-grower/${encodeURIComponent(growerId)}`, {
        method:  'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Failed to link grower account (${res.status})`);
    return res.json(); // refreshed { token, role, name, growerId }
}
