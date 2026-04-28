import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
    const location = useLocation();

    const links = [
        { to: '/users',    label: 'Users',    icon: '👤', color: '#4f8ef7' },
        { to: '/products', label: 'Products', icon: '📦', color: '#10b981' },
        { to: '/orders',   label: 'Orders',   icon: '🛒', color: '#f59e0b' },
    ];

    return (
        <nav style={styles.nav}>
            <div style={styles.inner}>
                {/* Brand */}
                <div style={styles.brand}>
                    <div style={styles.brandIcon}>
                        <span style={{ fontSize: '16px' }}>⚡</span>
                    </div>
                    <div>
                        <div style={styles.brandName}>Microservice</div>
                        <div style={styles.brandSub}>IAE Dashboard</div>
                    </div>
                </div>

                {/* Links */}
                <div style={styles.links}>
                    {links.map(({ to, label, icon, color }) => {
                        const active = location.pathname === to;
                        return (
                            <Link key={to} to={to} style={{
                                ...styles.link,
                                backgroundColor: active ? `${color}18` : 'transparent',
                                color: active ? color : 'rgba(255,255,255,0.55)',
                                borderColor: active ? `${color}40` : 'transparent',
                            }}>
                                <span style={{ fontSize: '15px' }}>{icon}</span>
                                <span>{label}</span>
                                {active && <span style={{ ...styles.activeDot, backgroundColor: color }} />}
                            </Link>
                        );
                    })}
                </div>

                {/* Status indicator */}
                <div style={styles.status}>
                    <span style={styles.statusDot} />
                    <span style={styles.statusText}>3 Services Live</span>
                </div>
            </div>
        </nav>
    );
}

const styles = {
    nav: {
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(10, 14, 26, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
    },
    inner: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
    },
    brand: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexShrink: 0,
    },
    brandIcon: {
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        background: 'linear-gradient(135deg, #4f8ef7, #7c3aed)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 16px rgba(79, 142, 247, 0.35)',
    },
    brandName: {
        fontSize: '14px',
        fontWeight: '800',
        color: '#f1f5f9',
        letterSpacing: '-0.3px',
        lineHeight: 1.2,
    },
    brandSub: {
        fontSize: '11px',
        color: 'rgba(255,255,255,0.35)',
        letterSpacing: '0.05em',
    },
    links: {
        display: 'flex',
        gap: '4px',
        flex: 1,
        justifyContent: 'center',
    },
    link: {
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        padding: '7px 16px',
        borderRadius: '8px',
        textDecoration: 'none',
        fontSize: '13px',
        fontWeight: '600',
        transition: 'all 0.2s ease',
        border: '1px solid transparent',
        position: 'relative',
        letterSpacing: '0.01em',
    },
    activeDot: {
        width: '5px',
        height: '5px',
        borderRadius: '50%',
        animation: 'pulse-dot 2s ease infinite',
    },
    status: {
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        flexShrink: 0,
    },
    statusDot: {
        width: '7px',
        height: '7px',
        borderRadius: '50%',
        backgroundColor: '#10b981',
        boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
        animation: 'pulse-dot 2s ease infinite',
    },
    statusText: {
        fontSize: '12px',
        color: 'rgba(255,255,255,0.35)',
        fontWeight: '500',
    },
};
