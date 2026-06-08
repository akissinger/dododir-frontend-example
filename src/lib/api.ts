const BASE = '/api';

function getToken(): string | null {
    return localStorage.getItem('token');
}

async function request<T>(
    method: string,
    path: string,
    body?: unknown,
): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw Object.assign(new Error(data.error ?? `HTTP ${res.status}`), { status: res.status });
    }

    if (res.status === 204) return undefined as T;
    return res.json() as T;
}

export const api = {
    auth: {
        register: (username: string, password: string, displayName: string, captchaToken: string) =>
            request<{ token: string; user: ApiUser }>('POST', '/auth/register', { username, password, displayName, captchaToken }),
        login: (username: string, password: string) =>
            request<{ token: string; user: ApiUser }>('POST', '/auth/login', { username, password }),
        me: () => request<{ user: ApiUser }>('GET', '/auth/me'),
    },
    projects: {
        list: () => request<{ projects: ApiProject[] }>('GET', '/projects'),
        get: (id: string) => request<{ project: ApiProject }>('GET', `/projects/${id}`),
        getBySlug: (username: string, projectname: string) =>
            request<{ project: ApiProject }>('GET', `/projects/by/${encodeURIComponent(username)}/${encodeURIComponent(projectname)}`),
        create: (name: string, description?: string) =>
            request<{ project: ApiProject }>('POST', '/projects', { name, description }),
        update: (id: string, data: Partial<Pick<ApiProject, 'name' | 'description' | 'isPublic'>>) =>
            request<{ project: ApiProject }>('PUT', `/projects/${id}`, data),
        delete: (id: string) => request<void>('DELETE', `/projects/${id}`),
    },
    files: {
        list: (projectId: string, since?: number) =>
            request<{ files: ApiFile[]; serverTime: number }>(
                'GET',
                `/projects/${projectId}/files${since ? `?since=${since}` : ''}`,
            ),
        create: (projectId: string, data: { path: string; content?: string | null; isDirectory: boolean }) =>
            request<{ file: ApiFile }>('POST', `/projects/${projectId}/files`, data),
        update: (projectId: string, fileId: string, data: { content?: string | null; path?: string }) =>
            request<{ file: ApiFile }>('PUT', `/projects/${projectId}/files/${fileId}`, data),
        delete: (projectId: string, fileId: string) =>
            request<void>('DELETE', `/projects/${projectId}/files/${fileId}`),
    },
};

// ---- Shared API types ----

export interface ApiUser {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
}

export interface ApiProject {
    id: string;
    userId: string;
    name: string;
    description: string;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ApiFile {
    id: string;
    projectId: string;
    path: string;
    content: string | null;
    isDirectory: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface BatchFile {
    id?: string;
    path: string;
    content?: string | null;
    isDirectory?: boolean;
    updatedAt: number;
    deleted?: boolean;
}
