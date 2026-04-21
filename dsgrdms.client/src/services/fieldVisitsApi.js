import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5089/api';

const getAuthHeader = () => {
    const token = sessionStorage.getItem('_auth_token');
    if (!token) {
        console.warn('No auth token found in sessionStorage');
        return {};
    }
    return { Authorization: `Bearer ${token}` };
};

export const fieldVisitsApi = {
    getByGrower: async (growerId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/field-visits/grower/${growerId}`, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching visits for grower ${growerId}:`, error.message);
            throw error;
        }
    },

    getUpcoming: async (growerId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/field-visits/grower/${growerId}/upcoming`, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching upcoming visits for grower ${growerId}:`, error.message);
            throw error;
        }
    },

    getPast: async (growerId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/field-visits/grower/${growerId}/past`, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching past visits for grower ${growerId}:`, error.message);
            throw error;
        }
    },

    getById: async (id) => {
        const response = await axios.get(`${API_BASE_URL}/field-visits/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    create: async (data) => {
        const response = await axios.post(`${API_BASE_URL}/field-visits`, data, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    update: async (id, data) => {
        const response = await axios.put(`${API_BASE_URL}/field-visits/${id}`, data, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    scheduleVisit: async (applicationId, data) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/field-visits`, {
                growerId: applicationId,
                visitorType: 'field inspection',
                title: data.purpose || 'Field Visit',
                scheduledDate: data.scheduledDate,
                scheduledTime: data.scheduledTime,
                location: 'TBD',
                priority: 'normal',
                officerId: 'OFFICER_ID', // Will be set from user context if needed
                officerName: 'Field Officer',
                notes: data.purpose
            }, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error(`Error scheduling visit for ${applicationId}:`, error.message);
            throw error;
        }
    },

    logFindings: async (visitId, data) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/field-visits/${visitId}/log-findings`, {
                observations: data.observations,
                activities: data.activities,
                plantationCondition: data.plantationCondition,
                notes: data.notes
            }, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error(`Error logging findings for visit ${visitId}:`, error.message);
            throw error;
        }
    },

    delete: async (id) => {
        await axios.delete(`${API_BASE_URL}/field-visits/${id}`, {
            headers: getAuthHeader()
        });
    }
};
