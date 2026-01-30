
import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function PermissionsPage() {
    const [permissions, setPermissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newPermission, setNewPermission] = useState({ name: '', guard_name: '' });

    const fetchPermissions = () => {
        setLoading(true);
        api.getPermissions().then(setPermissions).finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchPermissions();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPermission.name) return;
        try {
            await api.createPermission(newPermission);
            setNewPermission({ name: '', guard_name: '' });
            fetchPermissions();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDelete = async (name: string) => {
        if (!confirm(`Delete permission ${name}?`)) return;
        await api.deletePermission(name);
        fetchPermissions();
    }

    return (
        <div className="container mt-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl">Permissions</h1>
            </div>

            <div className="card mb-4">
                <h2 className="text-md font-bold mb-2">Create New Permission</h2>
                <form onSubmit={handleCreate} className="flex gap-4 items-center">
                    <input
                        placeholder="Permission Name"
                        value={newPermission.name}
                        onChange={e => setNewPermission({ ...newPermission, name: e.target.value })}
                    />
                    <input
                        placeholder="Guard Name (Optional)"
                        value={newPermission.guard_name}
                        onChange={e => setNewPermission({ ...newPermission, guard_name: e.target.value })}
                    />
                    <button type="submit" className="btn btn-primary">Create</button>
                </form>
            </div>

            <div className="card">
                {loading ? <p>Loading...</p> : (
                    permissions.length === 0 ? <p className="text-muted">No permissions found.</p> :
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Guard</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {permissions.map(perm => (
                                    <tr key={perm.name}>
                                        <td style={{ fontWeight: 500 }}>{perm.name}</td>
                                        <td className="text-muted">{perm.guard_name || 'default'}</td>
                                        <td>
                                            <button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(perm.name)}>Delete</button>
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
