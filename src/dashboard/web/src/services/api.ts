const API_URL = 'api';

let jwtToken: string | null = null;
let tokenPromise: Promise<string> | null = null;

const fetchToken = async (): Promise<string> => {
  if (jwtToken) return jwtToken;
  if (tokenPromise) return tokenPromise;

  tokenPromise = fetch(`${API_URL}/auth/token`, { method: 'POST' })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to obtain API token');
      }
      const data = await res.json();
      jwtToken = data.token;
      return jwtToken as string;
    })
    .finally(() => {
      tokenPromise = null;
    });

  return tokenPromise;
};

const apiFetch = async (path: string, options: RequestInit = {}) => {
  const token = await fetchToken();
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (res.status !== 401) return res;

  jwtToken = null;
  const refreshedToken = await fetchToken();
  const retryHeaders = new Headers(options.headers || {});
  retryHeaders.set('Authorization', `Bearer ${refreshedToken}`);
  if (options.body && !retryHeaders.has('Content-Type')) {
    retryHeaders.set('Content-Type', 'application/json');
  }
  return fetch(`${API_URL}${path}`, { ...options, headers: retryHeaders });
};

export const api = {
  getRoles: () => apiFetch('/roles').then((res) => res.json()),
  createRole: (data: { name: string; permissions?: string[]; guard_name?: string }) =>
    apiFetch('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(async (res) => {
      if (!res.ok) throw new Error('Failed to create role');
      return res.json();
    }),
  deleteRole: (name: string) => apiFetch(`/roles/${name}`, { method: 'DELETE' }),
  addRolePermission: (name: string, permissionName: string) =>
    apiFetch(`/roles/${name}/permissions`, {
      method: 'POST',
      body: JSON.stringify({ permissionName }),
    }).then(async (res) => {
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || 'Failed to add permission to role');
      }
      return res.json();
    }),
  removeRolePermission: (name: string, permissionName: string) =>
    apiFetch(`/roles/${name}/permissions/${permissionName}`, { method: 'DELETE' }).then((res) =>
      res.json()
    ),

  getPermissions: () => apiFetch('/permissions').then((res) => res.json()),
  createPermission: (data: { name: string; guard_name?: string }) =>
    apiFetch('/permissions', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then((res) => {
      if (!res.ok) throw new Error('Failed to create permission');
      return res.json();
    }),
  deletePermission: (name: string) => apiFetch(`/permissions/${name}`, { method: 'DELETE' }),

  getUserRoles: (userId: string) => apiFetch(`/users/${userId}/roles`).then((res) => res.json()),
  assignRole: (userId: string, roleName: string) =>
    apiFetch(`/users/${userId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ roleName }),
    }).then(async (res) => {
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || 'Failed to assign role');
      }
    }),
  revokeRole: (userId: string, roleName: string) =>
    apiFetch(`/users/${userId}/roles/${roleName}`, { method: 'DELETE' }),

  getUserPermissions: (userId: string) =>
    apiFetch(`/users/${userId}/permissions`).then((res) => res.json()),
  assignPermission: (userId: string, permissionName: string) =>
    apiFetch(`/users/${userId}/permissions`, {
      method: 'POST',
      body: JSON.stringify({ permissionName }),
    }).then(async (res) => {
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || 'Failed to assign permission');
      }
    }),
  revokePermission: (userId: string, permissionName: string) =>
    apiFetch(`/users/${userId}/permissions/${permissionName}`, { method: 'DELETE' }),
};
