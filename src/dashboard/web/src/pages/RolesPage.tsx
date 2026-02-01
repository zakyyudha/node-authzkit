
import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

export default function RolesPage() {
    const [roles, setRoles] = useState<any[]>([]);
    const [permissions, setPermissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newRole, setNewRole] = useState({ name: '', guard_name: '', permissions: [] as string[] });
    const [newRolePermission, setNewRolePermission] = useState('');
    const [rolePermissionInput, setRolePermissionInput] = useState<Record<string, string>>({});

    const fetchRoles = () => {
        setLoading(true);
        api.getRoles().then(setRoles).finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchRoles();
        api.getPermissions().then(setPermissions);
    }, []);

    const permissionNames = useMemo(() => permissions.map((p: any) => p.name), [permissions]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRole.name) return;
        try {
            await api.createRole(newRole);
            setNewRole({ name: '', guard_name: '', permissions: [] });
            setNewRolePermission('');
            fetchRoles();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleAddNewRolePermission = () => {
        if (!newRolePermission.trim()) return;
        if (newRole.permissions.includes(newRolePermission)) return;
        setNewRole({
            ...newRole,
            permissions: [...newRole.permissions, newRolePermission.trim()]
        });
        setNewRolePermission('');
    };

    const handleRemoveNewRolePermission = (perm: string) => {
        setNewRole({
            ...newRole,
            permissions: newRole.permissions.filter(p => p !== perm)
        });
    };

    const handleAssignPermission = async (roleName: string) => {
        const permissionName = (rolePermissionInput[roleName] || '').trim();
        if (!permissionName) return;
        try {
            await api.addRolePermission(roleName, permissionName);
            setRolePermissionInput(prev => ({ ...prev, [roleName]: '' }));
            fetchRoles();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleRevokePermission = async (roleName: string, permissionName: string) => {
        if (!confirm(`Remove permission ${permissionName} from ${roleName}?`)) return;
        try {
            await api.removeRolePermission(roleName, permissionName);
            fetchRoles();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDelete = async (name: string) => {
        if (!confirm(`Delete role ${name}?`)) return;
        await api.deleteRole(name);
        fetchRoles();
    }

    return (
        <div className="container mt-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl">Roles</h1>
            </div>

            <div className="card mb-4">
                <h2 className="text-md font-bold mb-2">Create New Role</h2>
                <form onSubmit={handleCreate} className="flex gap-4 items-center flex-wrap">
                    <input
                        placeholder="Role Name"
                        value={newRole.name}
                        onChange={e => setNewRole({ ...newRole, name: e.target.value })}
                    />
                    <input
                        placeholder="Guard Name (Optional)"
                        value={newRole.guard_name}
                        onChange={e => setNewRole({ ...newRole, guard_name: e.target.value })}
                    />
                    <div className="flex gap-2 items-center">
                        <input
                            list="permission-options"
                            placeholder="Add Permission"
                            value={newRolePermission}
                            onChange={e => setNewRolePermission(e.target.value)}
                        />
                        <button type="button" className="btn btn-ghost" onClick={handleAddNewRolePermission}>
                            Add
                        </button>
                    </div>
                    <button type="submit" className="btn btn-primary">Create</button>
                </form>
                <datalist id="permission-options">
                    {permissionNames.map((perm: string) => (
                        <option key={perm} value={perm} />
                    ))}
                </datalist>
                {newRole.permissions.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-3">
                        {newRole.permissions.map((perm) => (
                            <span key={perm} style={{ fontSize: '0.8em', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                {perm}
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    style={{ padding: '0 4px', marginLeft: '6px' }}
                                    onClick={() => handleRemoveNewRolePermission(perm)}
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="card">
                {loading ? <p>Loading...</p> : (
                    roles.length === 0 ? <p className="text-muted">No roles found.</p> :
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Guard</th>
                                    <th>Permissions</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roles.map(role => (
                                    <tr key={role.name}>
                                        <td style={{ fontWeight: 500 }}>{role.name}</td>
                                        <td className="text-muted">{role.guard_name || 'default'}</td>
                                        <td>
                                            <div className="flex gap-2 flex-wrap">
                                                {role.permissions?.map((p: string) => (
                                                    <span key={p} style={{ fontSize: '0.8em', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                                        {p}
                                                        <button
                                                            className="btn btn-ghost"
                                                            style={{ padding: '0 4px', marginLeft: '6px' }}
                                                            onClick={() => handleRevokePermission(role.name, p)}
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                                {(!role.permissions || role.permissions.length === 0) && <span className="text-muted text-sm">None</span>}
                                            </div>
                                            <div className="flex gap-2 mt-2">
                                                <input
                                                    list="permission-options"
                                                    placeholder="Add permission"
                                                    value={rolePermissionInput[role.name] || ''}
                                                    onChange={e => setRolePermissionInput(prev => ({ ...prev, [role.name]: e.target.value }))}
                                                />
                                                <button className="btn btn-ghost" onClick={() => handleAssignPermission(role.name)}>
                                                    Add
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            <button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(role.name)}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                )}
            </div>
        </div>
    );
}
