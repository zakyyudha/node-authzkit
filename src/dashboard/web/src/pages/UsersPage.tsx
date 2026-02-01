
import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function UsersPage() {
    const [userId, setUserId] = useState('');
    const [loadedUserId, setLoadedUserId] = useState('');
    const [roles, setRoles] = useState<string[]>([]);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [allRoles, setAllRoles] = useState<string[]>([]);
    const [allPermissions, setAllPermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const [assignRoleName, setAssignRoleName] = useState('');
    const [assignPermName, setAssignPermName] = useState('');

    useEffect(() => {
        Promise.all([api.getRoles(), api.getPermissions()])
            .then(([r, p]) => {
                setAllRoles(r.map((role: any) => role.name));
                setAllPermissions(p.map((perm: any) => perm.name));
            })
            .catch(() => {
                setAllRoles([]);
                setAllPermissions([]);
            });
    }, []);

    const loadUser = async () => {
        if (!userId) return;
        setLoading(true);
        setLoadedUserId(userId);
        try {
            const [r, p] = await Promise.all([
                api.getUserRoles(userId),
                api.getUserPermissions(userId)
            ]);
            setRoles(r);
            setPermissions(p);
        } catch (e) {
            console.error(e);
            // alert('Failed to load user data');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignRoleName) return;
        try {
            await api.assignRole(loadedUserId, assignRoleName);
            setAssignRoleName('');
            loadUser();
        } catch (e: any) { alert(e.message); }
    }

    const handleRevokeRole = async (roleName: string) => {
        if (!confirm(`Revoke role ${roleName}?`)) return;
        await api.revokeRole(loadedUserId, roleName);
        loadUser();
    }

    const handleAssignPerm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignPermName) return;
        try {
            await api.assignPermission(loadedUserId, assignPermName);
            setAssignPermName('');
            loadUser();
        } catch (e: any) { alert(e.message); }
    }

    const handleRevokePerm = async (permName: string) => {
        if (!confirm(`Revoke permission ${permName}?`)) return;
        await api.revokePermission(loadedUserId, permName);
        loadUser();
    }

    return (
        <div className="container mt-4">
            <h1 className="text-xl mb-4">User Management</h1>

            <div className="card mb-4 flex gap-4 items-center">
                <input
                    placeholder="Enter User ID"
                    value={userId}
                    onChange={e => setUserId(e.target.value)}
                />
                <button className="btn btn-primary" onClick={loadUser} disabled={loading}>
                    {loading ? 'Loading...' : 'Load User'}
                </button>
            </div>

            {loadedUserId && !loading && (
                <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {/* Roles Section */}
                    <div className="card">
                        <h2 className="text-md font-bold mb-4">Assigned Roles</h2>

                        <form onSubmit={handleAssignRole} className="flex gap-2 mb-4">
                            <input
                                list="role-options"
                                placeholder="Role Name"
                                value={assignRoleName}
                                onChange={e => setAssignRoleName(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <button className="btn btn-primary" type="submit">Assign</button>
                        </form>
                        <datalist id="role-options">
                            {allRoles.map((role) => (
                                <option key={role} value={role} />
                            ))}
                        </datalist>

                        {roles.length === 0 ? <p className="text-muted">No roles assigned.</p> : (
                            <table style={{ border: 'none' }}>
                                <tbody>
                                    {roles.map(r => (
                                        <tr key={r}>
                                            <td style={{ border: 'none', padding: '0.5rem 0' }}>{r}</td>
                                            <td style={{ border: 'none', padding: '0.5rem 0', textAlign: 'right' }}>
                                                <button className="btn btn-ghost" style={{ color: 'var(--color-danger)', padding: '0.25rem 0.5rem' }} onClick={() => handleRevokeRole(r)}>Revoke</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Permissions Section */}
                    <div className="card">
                        <h2 className="text-md font-bold mb-4">Direct Permissions</h2>

                        <form onSubmit={handleAssignPerm} className="flex gap-2 mb-4">
                            <input
                                list="permission-options"
                                placeholder="Permission Name"
                                value={assignPermName}
                                onChange={e => setAssignPermName(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <button className="btn btn-primary" type="submit">Assign</button>
                        </form>
                        <datalist id="permission-options">
                            {allPermissions.map((perm) => (
                                <option key={perm} value={perm} />
                            ))}
                        </datalist>

                        {permissions.length === 0 ? <p className="text-muted">No direct permissions.</p> : (
                            <table style={{ border: 'none' }}>
                                <tbody>
                                    {permissions.map(p => (
                                        <tr key={p}>
                                            <td style={{ border: 'none', padding: '0.5rem 0' }}>{p}</td>
                                            <td style={{ border: 'none', padding: '0.5rem 0', textAlign: 'right' }}>
                                                <button className="btn btn-ghost" style={{ color: 'var(--color-danger)', padding: '0.25rem 0.5rem' }} onClick={() => handleRevokePerm(p)}>Revoke</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
