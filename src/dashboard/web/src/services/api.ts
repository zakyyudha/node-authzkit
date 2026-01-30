const API_URL = 'api';

export const api = {
  getRoles: () => fetch(`${API_URL}/roles`).then((res) => res.json()),
  createRole: (data: { name: string; permissions?: string[]; guard_name?: string }) =>
    fetch(`${API_URL}/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((res) => {
      if (!res.ok) throw new Error('Failed to create role');
      return res.json();
    }),
  deleteRole: (name: string) => fetch(`${API_URL}/roles/${name}`, { method: 'DELETE' }),

  getPermissions: () => fetch(`${API_URL}/permissions`).then((res) => res.json()),
  createPermission: (data: { name: string; guard_name?: string }) =>
    fetch(`${API_URL}/permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((res) => {
      if (!res.ok) throw new Error('Failed to create permission');
      return res.json();
    }),
  deletePermission: (name: string) => fetch(`${API_URL}/permissions/${name}`, { method: 'DELETE' }),

  getUserRoles: (userId: string) =>
    fetch(`${API_URL}/users/${userId}/roles`).then((res) => res.json()),
  assignRole: (userId: string, roleName: string) =>
    fetch(`${API_URL}/users/${userId}/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleName }),
    }).then(async (res) => {
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || 'Failed to assign role');
      }
    }),
  revokeRole: (userId: string, roleName: string) =>
    fetch(`${API_URL}/users/${userId}/roles/${roleName}`, { method: 'DELETE' }),

  getUserPermissions: (userId: string) =>
    fetch(`${API_URL}/users/${userId}/permissions`).then((res) => res.json()),
  assignPermission: (userId: string, permissionName: string) =>
    fetch(`${API_URL}/users/${userId}/permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissionName }),
    }).then(async (res) => {
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || 'Failed to assign permission');
      }
    }),
  revokePermission: (userId: string, permissionName: string) =>
    fetch(`${API_URL}/users/${userId}/permissions/${permissionName}`, { method: 'DELETE' }),
};
