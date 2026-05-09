import { Link } from 'react-router-dom';

export default function Navbar() {
    return (
        <nav style={styles.nav}>
            <span style={styles.brand}>🔗 Microservice IAE</span>
            <div style={styles.links}>
                <Link to="/users"    style={styles.link}>👤 Users</Link>
                <Link to="/products" style={styles.link}>📦 Products</Link>
                <Link to="/orders"   style={styles.link}>🛒 Orders</Link>
            </div>
        </nav>
    );
}

const styles = {
    nav: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#1a1a2e', padding: '14px 28px',
    },
    brand: { color: '#e94560', fontSize: '20px', fontWeight: 'bold' },
    links: { display: 'flex', gap: '24px' },
    link:  { color: '#ffffff', textDecoration: 'none', fontWeight: '500', fontSize: '15px' },
};