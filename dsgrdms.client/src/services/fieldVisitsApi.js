import { apiFetch } from './apiClient.js';

const BASE = '/api/field-visits';

async function handleResponse(res) {
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Request failed (${res.status})`);
    }
    return res.json();
}

export const fieldVisitsApi = {
    getAll: async () => {
        try {
            const res = await apiFetch(BASE);
            return handleResponse(res);
        } catch (error) {
            console.error('Error fetching all visits:', error.message);
            throw error;
        }
    },

    getByGrower: async (growerId) => {
        try {
            const res = await apiFetch(`${BASE}/grower/${growerId}`);
            return handleResponse(res);
        } catch (error) {
            console.error(`Error fetching visits for grower ${growerId}:`, error.message);
            throw error;
        }
    },

    getUpcoming: async (growerId) => {
        try {
            const res = await apiFetch(`${BASE}/grower/${growerId}/upcoming`);
            return handleResponse(res);
        } catch (error) {
            console.error(`Error fetching upcoming visits for grower ${growerId}:`, error.message);
            throw error;
        }
    },

    getPast: async (growerId) => {
        try {
            const res = await apiFetch(`${BASE}/grower/${growerId}/past`);
            return handleResponse(res);
        } catch (error) {
            console.error(`Error fetching past visits for grower ${growerId}:`, error.message);
            throw error;
        }
    },

    getById: async (id) => {
        const res = await apiFetch(`${BASE}/${id}`);
        return handleResponse(res);
    },

    create: async (data) => {
        const res = await apiFetch(BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },

    update: async (id, data) => {
        const res = await apiFetch(`${BASE}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },

    scheduleVisit: async (growerId, data) => {
        try {
            const scheduledDate = data.scheduledDate instanceof Date 
                ? data.scheduledDate.toISOString().split('T')[0]
                : data.scheduledDate;
            
            const payload = {
                growerId,
                scheduledDate: `${scheduledDate}T00:00:00`,
                scheduledTime: data.scheduledTime || '09:00',
                purpose: data.purpose || 'Field Visit',
                notes: data.notes || null
            };
            
            const res = await apiFetch(`${BASE}/schedule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            return handleResponse(res);
        } catch (error) {
            console.error(`Error scheduling visit for ${growerId}:`, error.message);
            throw error;
        }
    },

    logFindings: async (visitId, data) => {
        try {
            // Use FormData to send files and other data
            const formData = new FormData();
            formData.append('observations', data.observations);
            formData.append('activities', data.activities);
            formData.append('plantationCondition', data.plantationCondition);
            formData.append('notes', data.notes || '');
            
            // Add photos if any
            if (data.photos && data.photos.length > 0) {
                data.photos.forEach((photo) => {
                    formData.append('photos', photo.file);
                });
            }
            
            // Get token for Authorization
            const token = sessionStorage.getItem('_auth_token');
            
            console.log('DEBUG logFindings: Sending request with', {
                visitId,
                hasToken: !!token,
                photoCount: data.photos ? data.photos.length : 0,
            });
            
            // Build fetch options - keep it minimal
            const options = {
                method: 'POST',
                body: formData,
            };
            
            // Only add headers if we have a token
            if (token) {
                options.headers = {
                    'Authorization': `Bearer ${token}`
                };
            }
            
            const res = await fetch(`/api/field-visits/${visitId}/log-findings`, options);
            
            console.log('DEBUG logFindings: Response status', res.status, 'Content-Type:', res.headers.get('content-type'));
            
            if (!res.ok) {
                const errorBody = await res.text();
                console.error('DEBUG logFindings error response:', errorBody);
            }
            
            return handleResponse(res);
        } catch (error) {
            console.error(`Error logging findings for visit ${visitId}:`, error);
            throw error;
        }
    },

    delete: async (id) => {
        const res = await apiFetch(`${BASE}/${id}`, {
            method: 'DELETE',
        });
        return handleResponse(res);
    },

    getPhotos: async (visitId) => {
        try {
            const res = await apiFetch(`${BASE}/${visitId}/photos`);
            return handleResponse(res);
        } catch (error) {
            console.error(`Error fetching photos for visit ${visitId}:`, error.message);
            return { photos: [] };
        }
    }
};
