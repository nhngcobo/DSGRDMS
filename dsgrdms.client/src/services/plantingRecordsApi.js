import { apiFetch } from './apiClient.js';

const API_BASE = '/api/planting-records';

async function handleResponse(res) {
  const text = await res.text();
  
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    throw new Error(`Server error (${res.status}): Invalid response format`);
  }
  
  if (!res.ok) {
    const errorMsg = data.message || data.Message || "API Error";
    throw new Error(errorMsg);
  }
  
  return data.data || data;
}

export async function getByGrowerId(growerId) {
  const res = await apiFetch(`${API_BASE}/grower/${growerId}`);
  return handleResponse(res);
}

export async function getById(recordId) {
  const res = await apiFetch(`${API_BASE}/${recordId}`);
  return handleResponse(res);
}

export async function getPendingReview() {
  const res = await apiFetch(`${API_BASE}/pending-review`);
  return handleResponse(res);
}

export async function createRecord(record) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(record),
  });
  return handleResponse(res);
}

export async function updateRecord(recordId, record) {
  const res = await apiFetch(`${API_BASE}/${recordId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(record),
  });
  return handleResponse(res);
}

export async function reviewRecord(recordId, review) {
  const res = await apiFetch(`${API_BASE}/${recordId}/review`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(review),
  });
  return handleResponse(res);
}

export async function deleteRecord(recordId) {
  const res = await apiFetch(`${API_BASE}/${recordId}`, {
    method: 'DELETE',
  });
  return handleResponse(res);
}

export async function uploadImages(growerId, files) {
  const formData = new FormData();
  formData.append('growerId', growerId);
  files.forEach(file => {
    formData.append('images', file);
  });

  const token = sessionStorage.getItem('_auth_token');
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

  const res = await fetch(`${API_BASE}/upload-images`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    throw new Error(`Server error (${res.status}): Invalid response format`);
  }

  if (!res.ok) {
    const errorMsg = data.message || "Upload failed";
    throw new Error(errorMsg);
  }

  return data.data || [];
}
