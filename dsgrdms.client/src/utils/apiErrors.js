const STATUS_MESSAGES = {
    400: null,   // pass-through — server already provides a meaningful validation message
    401: 'You are not authorised. Please log in again.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: null,   // pass-through — conflict message is already user-friendly
    413: 'The file is too large. Please upload a smaller file.',
    500: 'An unexpected server error occurred. Please try again.',
    502: 'The server is temporarily unavailable. Please try again shortly.',
    503: 'The service is currently unavailable. Please try again later.',
    504: 'The server took too long to respond. Please try again.',
};

/**
 * Converts a raw API error into a user-friendly message.
 * @param {Error|unknown} err
 * @returns {string}
 */
export function friendlyError(err) {
    if (!err?.message) return 'An unexpected error occurred. Please try again.';

    const msg = err.message;

    // Match "Request failed (NNN)" — thrown by our API service layer
    const match = msg.match(/Request failed \((\d+)\)/);
    if (match) {
        const code = parseInt(match[1], 10);
        const mapped = STATUS_MESSAGES[code];
        if (mapped) return mapped;
        if (mapped === null) return msg; // intentional pass-through
        return `An unexpected error occurred (${code}). Please try again.`;
    }

    // Network / fetch errors
    if (msg === 'Failed to fetch' || msg.toLowerCase().includes('network')) {
        return 'Unable to connect to the server. Please check your connection and try again.';
    }

    // Already a user-friendly message (e.g. validation, duplicate grower, etc.)
    return msg;
}
