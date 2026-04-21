import { useState, useEffect } from 'react';
import { getOrders, createOrder, updateStatus, deleteOrder } from '../services/orderService';
import { getUsers } from '../services/userService';
import { getProducts } from '../services/productService';

export default function OrdersPage() {
    const [orders, setOrders]   = useState([]);
    const [users, setUsers]     = useState([]);
    const [products, setProducts] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [form, setForm]       = useState({ user_id: '', product_id: '', quantity: 1 });

    const loadAll = async () => {
        const [o, u, p] = await Promise.all([getOrders(), getUsers(), getProducts()]);
        setOrders(o.data);
        setUsers(u.data);
        setProducts(p.data);
    };

    useEffect(() => { loadAll(); }, []);

    const handleCreate = async () => {
        if (!form.user_id || !form.product_id || !form.quantity) {
            return setMessage('❌ Semua field wajib diisi!');
        }
        setLoading(true);
        try {
            const res = await createOrder(form);
            setMessage(`✅ Order berhasil! ${res.data.user_name} membeli ${res.data.product_name} x${form.quantity} = Rp ${Number(res.data.total_price).toLocaleString('id-ID')}`);
            setForm({ user_id: '', product_id: '', quantity: 1 });
            loadAll();
        } catch (err) {
            setMessage('❌ Gagal: ' + (err.response?.data?.message || err.message));
        }
        setLoading(false);
    };

    const handleStatus = async (id) => {
        const status = window.prompt('Status baru (pending/processing/completed/cancelled):');
        if (!status) return;
        await updateStatus(id, status);
        setMessage('✅ Status diperbarui');
        loadAll();
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus order ini?')) return;
        await deleteOrder(id);
        setMessage('✅ Order dihapus');
        loadAll();
    };

    const getUserName    = (id) => users.find(u => u.id === id)?.name || `User #${id}`;
    const getProductName = (id) => products.find(p => p.id === id)?.name || `Product #${id}`;

    return (
        <div style={styles.container}>
            <h2>🛒 Order Management</h2>
            <p style={styles.info}>
                ℹ️ Saat membuat order, OrderService secara otomatis mengambil data dari
                <strong> UserService</strong> dan <strong>ProductService</strong>.
            </p>

            {/* Form Buat Order */}
            <div style={styles.card}>
                <h3>Buat Order Baru</h3>
                <label style={styles.label}>Pilih User (dari UserService)</label>
                <select value={form.user_id}
                    onChange={e => setForm({...form, user_id: e.target.value})}
                    style={styles.select}>
                    <option value="">-- Pilih User --</option>
                    {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                </select>

                <label style={styles.label}>Pilih Produk (dari ProductService)</label>
                <select value={form.product_id}
                    onChange={e => setForm({...form, product_id: e.target.value})}
                    style={styles.select}>
                    <option value="">-- Pilih Produk --</option>
                    {products.map(p => (
                        <option key={p.id} value={p.id}>
                            {p.name} — Rp {Number(p.price).toLocaleString('id-ID')} (Stok: {p.stock})
                        </option>
                    ))}
                </select>

                <label style={styles.label}>Jumlah</label>
                <input type="number" min="1" value={form.quantity}
                    onChange={e => setForm({...form, quantity: e.target.value})}
                    style={styles.input}
                />

                <button onClick={handleCreate} disabled={loading} style={styles.btnPrimary}>
                    {loading ? '⏳ Memproses...' : '🛒 Buat Order'}
                </button>
                {message && <p style={styles.message}>{message}</p>}
            </div>

            {/* Daftar Order */}
            <div style={styles.card}>
                <h3>Daftar Order ({orders.length})</h3>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.thead}>
                            <th>ID</th><th>User</th><th>Produk</th>
                            <th>Qty</th><th>Total</th><th>Status</th><th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(o => (
                            <tr key={o.id} style={styles.tr}>
                                <td>{o.id}</td>
                                <td>{getUserName(o.user_id)}</td>
                                <td>{getProductName(o.product_id)}</td>
                                <td>{o.quantity}</td>
                                <td>Rp {Number(o.total_price).toLocaleString('id-ID')}</td>
                                <td>
                                    <span style={{
                                        ...styles.badge,
                                        backgroundColor:
                                            o.status === 'completed'  ? '#00b894' :
                                            o.status === 'processing' ? '#0984e3' :
                                            o.status === 'cancelled'  ? '#e74c3c' : '#fdcb6e'
                                    }}>
                                        {o.status}
                                    </span>
                                </td>
                                <td>
                                    <button onClick={() => handleStatus(o.id)} style={styles.btnInfo}>✏️</button>
                                    <button onClick={() => handleDelete(o.id)} style={styles.btnDanger}>🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const styles = {
    container: { padding: '24px', maxWidth: '1100px', margin: '0 auto' },
    card:      { backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
    info:      { backgroundColor: '#dfe6e9', padding: '12px', borderRadius: '6px', marginBottom: '16px' },
    label:     { display: 'block', fontWeight: '600', marginBottom: '4px', marginTop: '10px' },
    input:     { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' },
    select:    { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' },
    table:     { width: '100%', borderCollapse: 'collapse' },
    thead:     { backgroundColor: '#e94560', color: 'white' },
    tr:        { borderBottom: '1px solid #ddd' },
    badge:     { color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' },
    message:   { marginTop: '8px', fontWeight: 'bold' },
    btnPrimary:{ backgroundColor: '#e94560', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '6px', cursor: 'pointer', fontSize: '15px', marginTop: '8px' },
    btnInfo:   { backgroundColor: '#0984e3', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '4px' },
    btnDanger: { backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' },
};
