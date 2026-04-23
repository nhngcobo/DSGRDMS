const BASE = '/api/growers';
import { apiFetch } from './apiClient.js';

async function handleResponse(res) {
    if (res.status === 409) {
        const body = await res.json();
        throw new Error(body.message ?? 'Duplicate grower.');
    }
    if (res.status === 400) {
        const body = await res.json();
        const first = body.errors
            ? Object.values(body.errors).flat()[0]
            : body.message ?? 'Validation failed.';
        throw new Error(first);
    }
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return res.json();
}

export async function fetchGrowers() {
    const res = await apiFetch(BASE);
    return handleResponse(res);
}

export async function fetchGrowerById(growerId) {
    const res = await apiFetch(`${BASE}/${encodeURIComponent(growerId)}`);
    return handleResponse(res);
}

export async function registerGrower(formData) {
    const res = await apiFetch(BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            firstName:         formData.firstName,
            lastName:          formData.lastName,
            idNumber:          formData.idNumber,
            phone:             formData.phone,
            email:             formData.email || null,
            businessName:      formData.businessName || null,
            businessRegNumber: formData.businessRegNumber || null,
            landTenure:        formData.landTenure || null,
            treeSpecies:       formData.treeSpecies || null,
            plantationSize:    formData.plantationSize ? parseFloat(formData.plantationSize) : null,
            gpsLat:            formData.gpsLat ? parseFloat(formData.gpsLat) : null,
            gpsLng:            formData.gpsLng ? parseFloat(formData.gpsLng) : null,
            draft:             formData.draft ?? false,
        }),
    });
    return handleResponse(res);
}

export async function updateGrower(growerId, formData) {
    const res = await apiFetch(`${BASE}/${encodeURIComponent(growerId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            phone:             formData.phone || null,
            email:             formData.email || null,
            businessName:      formData.businessName || null,
            businessRegNumber: formData.businessRegNumber || null,
            landTenure:        formData.landTenure || null,
            treeSpecies:       formData.treeSpecies || null,
            plantationSize:    formData.plantationSize ? parseFloat(formData.plantationSize) : null,
            gpsLat:            formData.gpsLat ? parseFloat(formData.gpsLat) : null,
            gpsLng:            formData.gpsLng ? parseFloat(formData.gpsLng) : null,
            status:            formData.status || null,
        }),
    });
    const result = await handleResponse(res);
    // Unwrap the new API response format if it exists
    return result?.data || result;
}

export async function updateFurthestStep(growerId, step) {
    const res = await apiFetch(`${BASE}/${encodeURIComponent(growerId)}/furthest-step`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step }),
    });
    const result = await handleResponse(res);
    return result?.data || result;
}
