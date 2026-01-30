
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
    const location = useLocation();

    const isActive = (path: string) => location.pathname.startsWith(path);

    return (
        <nav style={{
            height: 'var(--header-height)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 1.5rem',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(8px)',
            position: 'sticky',
            top: 0,
            zIndex: 10
        }}>
            <div className="container flex items-center justify-between" style={{ height: '100%', width: '100%' }}>
                <div className="flex items-center gap-4">
                    <Link to="/" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                        Authzkit
                    </Link>
                    <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--color-border)', margin: '0 1rem' }}></div>
                    <div className="flex gap-2">
                        <NavLink to="/roles" active={isActive('/roles')}>Roles</NavLink>
                        <NavLink to="/permissions" active={isActive('/permissions')}>Permissions</NavLink>
                        <NavLink to="/users" active={isActive('/users')}>Users</NavLink>
                    </div>
                </div>
            </div>
        </nav>
    );
}

function NavLink({ to, children, active }: { to: string; children: React.ReactNode; active: boolean }) {
    return (
        <Link to={to} style={{
            padding: '0.4rem 0.8rem',
            borderRadius: 'var(--radius)',
            fontSize: '0.9rem',
            fontWeight: 500,
            color: active ? 'white' : 'var(--color-text-muted)',
            backgroundColor: active ? 'var(--color-surface)' : 'transparent',
            transition: 'all 0.15s ease'
        }}>
            {children}
        </Link>
    );
}
