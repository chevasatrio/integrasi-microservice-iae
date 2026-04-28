import { useState, useEffect } from 'react';
import { getProducts, createProduct, deleteProduct } from '../services/productService';

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading]   = useState(false);
    const [message, setMessage]   = useState({ text: '', type: '' });
    const [showForm, setShowForm] = useState(false);
    const [form, setForm]         = useState({ name: '', description: '', price: '', stock: '', category: '' });

    const loadProducts = async () => {
        setLoading(true);
        try {
            const res = await getProducts();
            setProducts(res.data);
        } catch {
            showMsg('Gagal memuat produk. Pastikan ProductService berjalan.', 'error');
        }
        setLoading(false);
    };

    useEffect(() => { loadProducts(); }, []);

    const showMsg = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3500);
    };

    const handleCreate = async () => {
        if (!form.name || !form.price || !form.stock)
            return showMsg('Nama, Harga, dan Stok wajib diisi!', 'error');
        try {
            await createProduct(form);
            setForm({ name: '', description: '', price: '', stock: '', category: '' });
            setShowForm(false);
            showMsg('Produk berhasil ditambahkan!');
            loadProducts();
        } catch (err) {
            showMsg('Gagal: ' + (err.response?.data?.message || err.message), 'error');
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Hapus produk "${name}"?`)) return;
        await deleteProduct(id);
        showMsg('Produk dihapus.');
        loadProducts();
    };

    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
    const totalStock = products.reduce((s, p) => s + (Number(p.stock) || 0), 0);
    const totalValue = products.reduce((s, p) => s + (Number(p.price) * Number(p.stock) || 0), 0);

    return (
        <div style={styles.page}>
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <div style={styles.pageTag}>ProductService — Port 8002</div>
                    <h2 style={styles.title}>Product Management</h2>
                    <p style={styles.subtitle}>Kelola katalog produk & inventaris</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} style={styles.btnAdd}>
                    <span>{showForm ? '✕' : '+'}</span>
                    <span>{showForm ? 'Tutup' : 'Tambah Produk'}</span>
                </button>
            </div>

            {/* Stats Row */}
            <div style={styles.statsRow}>
                {[
                    { label: 'Total Produk', value: products.length, icon: '📦', color: '#10b981' },
                    { label: 'Total Stok', value: totalStock.toLocaleString('id-ID'), icon: '📊', color: '#4f8ef7' },
                    { label: 'Nilai Inventaris', value: 'Rp ' + totalValue.toLocaleString('id-ID'), icon: '💰', color: '#f59e0b' },
                    { label: 'Kategori', value: categories.length, icon: '🏷️', color: '#a855f7' },
                ].map(s => (
                    <div key={s.label} style={styles.statCard}>
                        <div style={{ ...styles.statIcon, backgroundColor: `${s.color}18` }}>
                            <span>{s.icon}</span>
                        </div>
                        <div>
                            <div style={{ ...styles.statValue, color: s.color }}>{s.value}</div>
                            <div style={styles.statLabel}>{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Toast */}
            {message.text && (
                <div style={{ ...styles.toast, ...(message.type === 'error' ? styles.toastError : styles.toastSuccess) }}>
                    <span>{message.type === 'error' ? '⚠️' : '✅'}</span>
                    <span>{message.text}</span>
                </div>
            )}

            {/* Form */}
            {showForm && (
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>
                        <span>📦</span> Tambah Produk Baru
                    </h3>
                    <div style={styles.formGrid}>
                        <div style={{ ...styles.fieldGroup, gridColumn: '1 / -1' }}>
                            <label style={styles.label}>Nama Produk *</label>
                            <input placeholder="Contoh: Laptop ASUS VivoBook" value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                style={styles.input}
                                onFocus={e => e.target.style.borderColor = '#10b981'}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                            />
                        </div>
                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Harga (Rp) *</label>
                            <input type="number" placeholder="8500000" value={form.price}
                                onChange={e => setForm({ ...form, price: e.target.value })}
                                style={styles.input}
                                onFocus={e => e.target.style.borderColor = '#10b981'}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                            />
                        </div>
                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Stok *</label>
                            <input type="number" placeholder="10" value={form.stock}
                                onChange={e => setForm({ ...form, stock: e.target.value })}
                                style={styles.input}
                                onFocus={e => e.target.style.borderColor = '#10b981'}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                            />
                        </div>
                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Kategori</label>
                            <input placeholder="Elektronik, Fashion, dll" value={form.category}
                                onChange={e => setForm({ ...form, category: e.target.value })}
                                style={styles.input}
                                onFocus={e => e.target.style.borderColor = '#10b981'}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                            />
                        </div>
                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Deskripsi</label>
                            <input placeholder="Deskripsi produk" value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                style={styles.input}
                                onFocus={e => e.target.style.borderColor = '#10b981'}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                            />
                        </div>
                    </div>
                    <div style={styles.formActions}>
                        <button onClick={handleCreate} style={styles.btnGreen}>+ Simpan Produk</button>
                        <button onClick={() => setShowForm(false)} style={styles.btnGhost}>Batal</button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div style={styles.card}>
                <h3 style={styles.cardTitle}>
                    <span>📋</span>
                    Katalog Produk
                    <span style={styles.badge}>{products.length}</span>
                </h3>
                {loading ? (
                    <div style={styles.loadingState}>
                        <div style={styles.spinner} />
                        <span>Memuat data...</span>
                    </div>
                ) : products.length === 0 ? (
                    <div style={styles.emptyState}>
                        <span style={{ fontSize: '40px' }}>📦</span>
                        <p>Belum ada produk. Tambahkan yang pertama!</p>
                    </div>
                ) : (
                    <div style={styles.tableWrap}>
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nama Produk</th>
                                    <th>Kategori</th>
                                    <th>Harga</th>
                                    <th>Stok</th>
                                    <th style={{ textAlign: 'right' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(p => (
                                    <tr key={p.id}>
                                        <td><span style={styles.idBadge}>#{p.id}</span></td>
                                        <td>
                                            <div style={{ fontWeight: '600', color: '#f1f5f9' }}>{p.name}</div>
                                            {p.description && (
                                                <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                                                    {p.description.length > 50 ? p.description.slice(0, 50) + '…' : p.description}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {p.category ? (
                                                <span style={styles.categoryBadge}>{p.category}</span>
                                            ) : <span style={{ color: '#475569' }}>—</span>}
                                        </td>
                                        <td style={{ fontWeight: '700', color: '#10b981', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}>
                                            Rp {Number(p.price).toLocaleString('id-ID')}
                                        </td>
                                        <td>
                                            <StockBadge stock={Number(p.stock)} />
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button onClick={() => handleDelete(p.id, p.name)} style={styles.btnDanger}>
                                                🗑️ Hapus
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function StockBadge({ stock }) {
    const color = stock === 0 ? '#ef4444' : stock < 5 ? '#f59e0b' : '#10b981';
    const bg = stock === 0 ? 'rgba(239,68,68,0.12)' : stock < 5 ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)';
    const label = stock === 0 ? 'Habis' : stock < 5 ? `${stock} (Sedikit)` : stock;
    return (
        <span style={{ backgroundColor: bg, color, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
            {label}
        </span>
    );
}

const styles = {
    page: { padding: '32px 24px', maxWidth: '1200px', margin: '0 auto', animation: 'fadeInUp 0.35s ease' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
    pageTag: { fontSize: '11px', fontWeight: '700', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' },
    title: { fontSize: '26px', fontWeight: '800', color: '#f1f5f9', letterSpacing: '-0.5px', margin: 0 },
    subtitle: { fontSize: '14px', color: '#64748b', marginTop: '4px' },

    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' },
    statCard: { backgroundColor: '#161d2f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' },
    statIcon: { width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 },
    statValue: { fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px', lineHeight: 1.2 },
    statLabel: { fontSize: '11px', color: '#475569', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '2px' },

    card: { backgroundColor: '#161d2f', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '20px', overflow: 'hidden' },
    cardTitle: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700', color: '#f1f5f9', padding: '18px 20px 16px', margin: 0 },
    badge: { backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' },
    categoryBadge: { backgroundColor: 'rgba(168,85,247,0.12)', color: '#a855f7', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
    idBadge: { backgroundColor: 'rgba(255,255,255,0.06)', color: '#94a3b8', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace' },

    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', padding: '0 20px' },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' },
    input: { width: '100%', padding: '11px 14px', backgroundColor: '#1e2638', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#f1f5f9', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s ease', fontFamily: 'Plus Jakarta Sans, sans-serif' },
    formActions: { display: 'flex', gap: '10px', padding: '18px 20px' },

    tableWrap: { overflowX: 'auto' },

    toast: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '14px', fontWeight: '500' },
    toastSuccess: { backgroundColor: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' },
    toastError: { backgroundColor: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' },

    loadingState: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '48px', color: '#64748b' },
    spinner: { width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
    emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '48px', color: '#475569' },

    btnAdd: { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#10b981', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', boxShadow: '0 0 20px rgba(16,185,129,0.25)' },
    btnGreen: { backgroundColor: '#10b981', color: 'white', border: 'none', padding: '11px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '700' },
    btnDanger: { backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '6px 12px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
    btnGhost: { backgroundColor: 'transparent', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
};
