import { Link, useLocation } from 'react-router-dom';

export default function Breadcrumbs() {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    if (pathnames.length === 0) return null;

    return (
        <nav aria-label="breadcrumb" style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
            <ol style={{ listStyle: 'none', padding: 0, display: 'flex', gap: '0.5rem', margin: 0 }}>
                <li>
                    <Link to="/" style={{ color: 'var(--verde-oscuro)', textDecoration: 'none' }}>Inicio</Link>
                </li>
                {pathnames.map((value, index) => {
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const isLast = index === pathnames.length - 1;
                    const name = value.charAt(0).toUpperCase() + value.slice(1).replace('-', ' ');

                    return (
                        <li key={to} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span style={{ color: '#ccc' }}>/</span>
                            {isLast ? (
                                <span style={{ color: '#333', fontWeight: '500' }}>{name}</span>
                            ) : (
                                <Link to={to} style={{ color: 'var(--verde-oscuro)', textDecoration: 'none' }}>{name}</Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
