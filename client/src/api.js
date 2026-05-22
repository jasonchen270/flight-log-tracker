// Thin fetch wrapper. We standardize on:
//   - JSON in and out
//   - x-pilot-email header (the only "auth" the app has)
//   - error responses parsed into a thrown Error with .status set

const PILOT_KEY = 'flight-log:pilot-email';

export function currentPilotEmail() {
    return localStorage.getItem(PILOT_KEY) ?? 'demo@aviationclub.test';
}

export function setPilotEmail(email) {
    localStorage.setItem(PILOT_KEY, email);
}

async function request(method, url, body) {
    const res = await fetch(url, {
        method,
        headers: {
            'content-type': 'application/json',
            'x-pilot-email': currentPilotEmail(),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.status === 204) return null;
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
        const err = new Error(data?.error ?? res.statusText);
        err.status = res.status;
        throw err;
    }
    return data;
}

export const api = {
    me: () => request('GET', '/api/me'),
    listFlights: (params = {}) => {
        const qs = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
            if (v !== undefined && v !== null && v !== '') qs.set(k, v);
        }
        const suffix = qs.toString() ? `?${qs.toString()}` : '';
        return request('GET', `/api/flights${suffix}`);
    },
    summary: () => request('GET', '/api/flights/summary'),
    createFlight: (body) => request('POST', '/api/flights', body),
    updateFlight: (id, body) => request('PUT', `/api/flights/${id}`, body),
    deleteFlight: (id) => request('DELETE', `/api/flights/${id}`),
    addEndorsement: (flightId, body) =>
        request('POST', `/api/flights/${flightId}/endorsements`, body),
    removeEndorsement: (flightId, endorsementId) =>
        request('DELETE', `/api/flights/${flightId}/endorsements/${endorsementId}`),
    exportCsvUrl: () => '/api/flights/export.csv',
};
