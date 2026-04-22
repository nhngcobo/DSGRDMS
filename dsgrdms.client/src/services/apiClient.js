export function getAuthHeader() {
    const token = sessionStorage.getItem('_auth_token');
    if (!token) {
        return {};
    }
    return {
        'Authorization': `Bearer ${token}`
    };
}

export async function apiFetch(url, options = {}) {
    const headers = {
        ...getAuthHeader(),
        ...(options.headers || {})
    };

    const response = await fetch(url, {
        ...options,
        headers
    });

    return response;
}
