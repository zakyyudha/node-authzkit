
import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function RolesPage() {
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newRole, setNewRole] = useState({ name: '', guard_name: '' });

    const fetchRoles = () => {
        setLoading(true);
        api.getRoles().then(setRoles).finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRole.name) return;
        try {
            await api.createRole(newRole);
            setNewRole({ name: '', guard_name: '' });
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
                <form onSubmit={handleCreate} className="flex gap-4 items-center">
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
                    <button type="submit" className="btn btn-primary">Create</button>
                </form>
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
                                                    </span>
                                                ))}
                                                {(!role.permissions || role.permissions.length === 0) && <span className="text-muted text-sm">None</span>}
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
