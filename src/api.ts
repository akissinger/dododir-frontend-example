async function request<T>(
    method: string,
    path: string,
    body?: unknown,
): Promise<T> {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api${path}`, {
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
            request<{ token: string; user: DUser }>('POST', '/auth/register', { username, password, displayName, captchaToken }),
        login: (username: string, password: string) =>
            request<{ token: string; user: DUser }>('POST', '/auth/login', { username, password }),
        me: () => request<{ user: DUser }>('GET', '/auth/me'),
    },
    projects: {
        list: () => request<{ projects: DProject[] }>('GET', '/projects'),
        get: (id: string) => request<{ project: DProject }>('GET', `/projects/${id}`),
        getBySlug: (username: string, projectname: string) =>
            request<{ project: DProject }>('GET', `/projects/by/${encodeURIComponent(username)}/${encodeURIComponent(projectname)}`),
        create: (name: string, description?: string) =>
            request<{ project: DProject }>('POST', '/projects', { name, description }),
        update: (id: string, data: Partial<Pick<DProject, 'name' | 'description' | 'isPublic'>>) =>
            request<{ project: DProject }>('PUT', `/projects/${id}`, data),
        delete: (id: string) => request<void>('DELETE', `/projects/${id}`),
    },
    files: {
        list: (projectId: string, since?: number) =>
            request<{ files: DFile[]; serverTime: number }>(
                'GET',
                `/projects/${projectId}/files${since ? `?since=${since}` : ''}`,
            ),
        create: (projectId: string, data: { path: string; content?: string | null; isDirectory: boolean }) =>
            request<{ file: DFile }>('POST', `/projects/${projectId}/files`, data),
        update: (projectId: string, fileId: string, data: { content?: string | null; path?: string }) =>
            request<{ file: DFile }>('PUT', `/projects/${projectId}/files/${fileId}`, data),
        delete: (projectId: string, fileId: string) =>
            request<void>('DELETE', `/projects/${projectId}/files/${fileId}`),
    },
};

// ---- Shared API types ----

export interface DUser {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
}

export interface DProject {
    id: string;
    userId: string;
    name: string;
    description: string;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface DFile {
    id: string;
    projectId: string;
    path: string;
    content: string | null;
    isDirectory: boolean;
    createdAt: string;
    updatedAt: string;
}
