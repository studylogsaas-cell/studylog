const API_BASE = '/api';

async function request(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('accessToken');
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${url}`, { ...options, headers });

    if (res.status === 401) {
        // Try refresh
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });
            if (refreshRes.ok) {
                const data = await refreshRes.json();
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                headers['Authorization'] = `Bearer ${data.accessToken}`;
                const retry = await fetch(`${API_BASE}${url}`, { ...options, headers });
                if (!retry.ok) throw new Error(await retry.text());
                return retry.json();
            }
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        throw new Error('Session expired');
    }

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || errorData.errors?.[0]?.msg || 'Request failed');
    }

    return res.json();
}

export const api = {
    // Auth
    login: (email: string, password: string) =>
        request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (name: string, email: string, password: string) =>
        request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
    getMe: () => request('/auth/me'),

    // Dashboard
    getDashboard: () => request('/dashboard'),

    // Study Entries
    getEntries: (params?: Record<string, string>) => {
        const qs = params ? '?' + new URLSearchParams(params).toString() : '';
        return request(`/study-entries${qs}`);
    },
    getCalendarEntries: (params?: Record<string, string>) => {
        const qs = params ? '?' + new URLSearchParams(params).toString() : '';
        return request(`/study-entries/calendar${qs}`);
    },
    getEntry: (id: string) => request(`/study-entries/${id}`),
    createEntry: (data: any) =>
        request('/study-entries', { method: 'POST', body: JSON.stringify(data) }),
    updateEntry: (id: string, data: any) =>
        request(`/study-entries/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteEntry: (id: string) =>
        request(`/study-entries/${id}`, { method: 'DELETE' }),
    duplicateEntry: (id: string) =>
        request(`/study-entries/${id}/duplicate`, { method: 'POST' }),

    // Mind Maps
    getMindMaps: (entryId: string) => request(`/mind-maps/entry/${entryId}`),
    createMindMap: (entryId: string, data: any) =>
        request(`/mind-maps/entry/${entryId}`, { method: 'POST', body: JSON.stringify(data) }),
    updateMindMap: (id: string, data: any) =>
        request(`/mind-maps/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteMindMap: (id: string) =>
        request(`/mind-maps/${id}`, { method: 'DELETE' }),

    // Exams & Subjects
    getExams: () => request('/exams'),
    createExam: (name: string) =>
        request('/exams', { method: 'POST', body: JSON.stringify({ name }) }),
    getSubjects: () => request('/subjects'),
    createSubject: (name: string) =>
        request('/subjects', { method: 'POST', body: JSON.stringify({ name }) }),
};
