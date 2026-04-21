import { useState, useEffect } from 'react';
import { getUsers, createUser, deleteUser, getUserOrders } from '../services/userService';

export default function UsersPage() {
    const [users, setUsers]       = useState([]);
    const [orders, setOrders]     = useState(null);
    const [loading, setLoading]   = useState(false);
    const [form, setForm]         = useState({ name: '', email: '', phone: '', address: '' });
    const [message, setMessage]   = useState('');

    const loadUsers = async () => {
        const res = await getUsers();
        setUsers(res.data);
    };

    useEffect(() => { loadUsers(); }, []);

    const handleCreate = async () => {
        if (!form.name || !form.email) {
            return setMessage('❌ Nama dan Email wajib diisi!');
        }
        try {
            await createUser(form);
            setForm({ name: '', email: '', phone: '', address: '' });
            setMessage('✅ User berhasil ditambahkan!');
            loadUsers();
        } catch (err) {
            setMessage('❌ Gagal: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus user ini?')) return;
        await deleteUser(id);
        setMessage('✅ User dihapus');
        loadUsers();
    };

    const handleViewOrders = async (id) => {
        setLoading(true);
        try {
            const res = await getUserOrders(id);
            setOrders(res.data);
        } catch {
            setOrders({ error: 'OrderService tidak tersedia' });
        }
        setLoading(false);
    };

    return (
        <div style={styles.container}>
            <h2>👤 User Management</h2>

            {/* Form Tambah User */}
            <div style={styles.card}>
                <h3>Tambah User Baru</h3>
                {['name', 'email', 'phone', 'address'].map(field => (
                    <input key={field} placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                        value={form[field]}
                        onChange={e => setForm({...form, [field]: e.target.value})}
                        style={styles.input}
                    />
                ))}
                <button onClick={handleCreate} style={styles.btnPrimary}>+ Tambah User</button>
                {message && <p style={styles.message}>{message}</p>}
            </div>

            {/* Daftar User */}
            <div style={styles.card}>
                <h3>Daftar User ({users.length})</h3>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.thead}>
                            <th>ID</th><th>Nama</th><th>Email</th>
                            <th>Phone</th><th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} style={styles.tr}>
                                <td>{u.id}</td>
                                <td>{u.name}</td>
                                <td>{u.email}</td>
                                <td>{u.phone || '-'}</td>
                                <td>
                                    <button onClick={() => handleViewOrders(u.id)} style={styles.btnInfo}>
                                        🔍 Histori Order
                                    </button>
                                    <button onClick={() => handleDelete(u.id)} style={styles.btnDanger}>
                                        🗑️ Hapus
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Histori Order (Consumer dari OrderService) */}
            {orders && (
                <div style={styles.card}>
                    <h3>📋 Histori Order (data dari OrderService)</h3>
                    {loading ? <p>Loading...</p> : (
                        orders.error ? <p style={{color:'red'}}>{orders.error}</p> : (
                            <pre style={styles.pre}>{JSON.stringify(orders, null, 2)}</pre>
                        )
                    )}
                </div>
            )}
        </div>
    );
}

const styles = {
    container: { padding: '24px', maxWidth: '1000px', margin: '0 auto' },
    card:    { backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
    input:   { display: 'block', width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' },
    table:   { width: '100%', borderCollapse: 'collapse' },
    thead:   { backgroundColor: '#1a1a2e', color: 'white' },
    tr:      { borderBottom: '1px solid #ddd' },
    pre:     { backgroundColor: '#eee', padding: '12px', borderRadius: '6px', overflowX: 'auto' },
    message: { marginTop: '8px', fontWeight: 'bold' },
    btnPrimary: { backgroundColor: '#1a1a2e', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' },
    btnInfo:    { backgroundColor: '#0984e3', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', marginRight: '6px' },
    btnDanger:  { backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' },
};