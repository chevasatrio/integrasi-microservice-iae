import { useState, useEffect } from 'react';
import { getProducts, createProduct, deleteProduct } from '../services/productService';

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [message, setMessage]   = useState('');
    const [form, setForm]         = useState({ name: '', description: '', price: '', stock: '', category: '' });

    const loadProducts = async () => {
        const res = await getProducts();
        setProducts(res.data);
    };

    useEffect(() => { loadProducts(); }, []);

    const handleCreate = async () => {
        if (!form.name || !form.price || !form.stock) {
            return setMessage('❌ Nama, harga, dan stok wajib diisi!');
        }
        try {
            await createProduct(form);
            setForm({ name: '', description: '', price: '', stock: '', category: '' });
            setMessage('✅ Produk berhasil ditambahkan!');
            loadProducts();
        } catch (err) {
            setMessage('❌ Gagal: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus produk ini?')) return;
        await deleteProduct(id);
        setMessage('✅ Produk dihapus');
        loadProducts();
    };

    return (
        <div style={styles.container}>
            <h2>📦 Product Management</h2>

            <div style={styles.card}>
                <h3>Tambah Produk Baru</h3>
                {[
                    { key: 'name', label: 'Nama Produk' },
                    { key: 'description', label: 'Deskripsi' },
                    { key: 'price', label: 'Harga', type: 'number' },
                    { key: 'stock', label: 'Stok', type: 'number' },
                    { key: 'category', label: 'Kategori' },
                ].map(f => (
                    <input key={f.key} placeholder={f.label} type={f.type || 'text'}
                        value={form[f.key]}
                        onChange={e => setForm({...form, [f.key]: e.target.value})}
                        style={styles.input}
                    />
                ))}
                <button onClick={handleCreate} style={styles.btnPrimary}>+ Tambah Produk</button>
                {message && <p style={styles.message}>{message}</p>}
            </div>

            <div style={styles.card}>
                <h3>Daftar Produk ({products.length})</h3>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.thead}>
                            <th>ID</th><th>Nama</th><th>Harga</th>
                            <th>Stok</th><th>Kategori</th><th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p.id} style={styles.tr}>
                                <td>{p.id}</td>
                                <td>{p.name}</td>
                                <td>Rp {Number(p.price).toLocaleString('id-ID')}</td>
                                <td>{p.stock}</td>
                                <td>{p.category || '-'}</td>
                                <td>
                                    <button onClick={() => handleDelete(p.id)} style={styles.btnDanger}>
                                        🗑️ Hapus
                                    </button>
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
    container: { padding: '24px', maxWidth: '1000px', margin: '0 auto' },
    card:      { backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
    input:     { display: 'block', width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' },
    table:     { width: '100%', borderCollapse: 'collapse' },
    thead:     { backgroundColor: '#00b894', color: 'white' },
    tr:        { borderBottom: '1px solid #ddd' },
    message:   { marginTop: '8px', fontWeight: 'bold' },
    btnPrimary:{ backgroundColor: '#00b894', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' },
    btnDanger: { backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' },
};