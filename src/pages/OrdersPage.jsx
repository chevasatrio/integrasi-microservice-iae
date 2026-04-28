import { useState, useEffect } from "react";
import {
  getOrders,
  createOrder,
  updateStatus,
  deleteOrder,
} from "../services/orderService";
import { getUsers } from "../services/userService";
import { getProducts } from "../services/productService";

const STATUS_FLOW = ["pending", "processing", "completed", "cancelled"];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    user_id: "",
    product_id: "",
    quantity: 1,
  });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [o, u, p] = await Promise.all([
        getOrders(),
        getUsers(),
        getProducts(),
      ]);
      setOrders(o.data);
      setUsers(u.data);
      setProducts(p.data);
    } catch {
      showMsg("Gagal memuat data. Pastikan semua service berjalan.", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const showMsg = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  // ✅ FIX 1: Saat produk berganti, reset quantity ke 1
  const handleProductChange = (e) => {
    setForm({ ...form, product_id: e.target.value, quantity: 1 });
  };

  // ✅ FIX 2: Validasi stok di sisi UI sebelum kirim ke OrderService
  const handleCreate = async () => {
    if (!form.user_id || !form.product_id || !form.quantity)
      return showMsg("Semua field wajib diisi!", "error");

    // Cek stok di UI sebelum hit API
    const selectedProduct = products.find(
      (p) => p.id === Number(form.product_id),
    );
    if (selectedProduct && Number(form.quantity) > selectedProduct.stock) {
      return showMsg(
        `Stok tidak mencukupi! Stok tersedia: ${selectedProduct.stock}, kamu meminta: ${form.quantity}`,
        "error",
      );
    }
    if (selectedProduct && selectedProduct.stock === 0) {
      return showMsg("Produk ini sudah habis stoknya!", "error");
    }

    try {
      const res = await createOrder(form);
      showMsg(
        `✅ Order berhasil! ${res.data.user_name} — ${res.data.product_name} (${res.data.quantity}x)`,
      );
      setForm({ user_id: "", product_id: "", quantity: 1 });
      setShowForm(false);
      // loadAll agar stok produk ikut terupdate di dropdown
      loadAll();
    } catch (err) {
      showMsg(
        "Gagal: " + (err.response?.data?.message || err.message),
        "error",
      );
    }
  };

  const handleNextStatus = async (id, currentStatus) => {
    const idx = STATUS_FLOW.indexOf(currentStatus);
    if (idx === -1 || idx >= 2) return;
    const next = STATUS_FLOW[idx + 1];
    await updateStatus(id, next);
    showMsg(`Status diubah → ${next}`);
    loadAll();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus order ini?")) return;
    await deleteOrder(id);
    showMsg("Order dihapus.");
    loadAll();
  };

  const getUserName = (id) =>
    users.find((u) => u.id === id)?.name || `User #${id}`;
  const getProductName = (id) =>
    products.find((p) => p.id === id)?.name || `Produk #${id}`;

  const filteredOrders =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    completed: orders.filter((o) => o.status === "completed").length,
    revenue: orders
      .filter((o) => o.status === "completed")
      .reduce((s, o) => s + Number(o.total_price), 0),
  };

  // ✅ FIX 3: selectedProduct dipakai untuk validasi stok & batas qty input
  const selectedProduct = products.find(
    (p) => p.id === Number(form.product_id),
  );
  const estimatedTotal = selectedProduct
    ? Number(selectedProduct.price) * Number(form.quantity)
    : 0;
  const isStockEmpty = selectedProduct?.stock === 0;
  const isOverStock =
    selectedProduct && Number(form.quantity) > selectedProduct.stock;

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.pageTag}>OrderService — Port 8003</div>
          <h2 style={styles.title}>Order Management</h2>
          <p style={styles.subtitle}>
            Buat & kelola transaksi — terintegrasi dengan UserService &
            ProductService
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={styles.btnAdd}>
          <span>{showForm ? "✕" : "+"}</span>
          <span>{showForm ? "Tutup" : "Buat Order"}</span>
        </button>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        {[
          {
            label: "Total Order",
            value: stats.total,
            icon: "🛒",
            color: "#4f8ef7",
          },
          {
            label: "Pending",
            value: stats.pending,
            icon: "⏳",
            color: "#f59e0b",
            clickFilter: "pending",
          },
          {
            label: "Diproses",
            value: stats.processing,
            icon: "⟳",
            color: "#4f8ef7",
            clickFilter: "processing",
          },
          {
            label: "Selesai",
            value: stats.completed,
            icon: "✓",
            color: "#10b981",
            clickFilter: "completed",
          },
          {
            label: "Pendapatan",
            value: "Rp " + stats.revenue.toLocaleString("id-ID"),
            icon: "💰",
            color: "#a855f7",
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              ...styles.statCard,
              cursor: s.clickFilter ? "pointer" : "default",
              borderColor:
                filter === s.clickFilter
                  ? `${s.color}40`
                  : "rgba(255,255,255,0.06)",
            }}
            onClick={() =>
              s.clickFilter &&
              setFilter(filter === s.clickFilter ? "all" : s.clickFilter)
            }
          >
            <div
              style={{ ...styles.statIcon, backgroundColor: `${s.color}18` }}
            >
              {s.icon}
            </div>
            <div>
              <div style={{ ...styles.statValue, color: s.color }}>
                {s.value}
              </div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toast */}
      {message.text && (
        <div
          style={{
            ...styles.toast,
            ...(message.type === "error"
              ? styles.toastError
              : styles.toastSuccess),
          }}
        >
          <span>{message.type === "error" ? "⚠️" : "✅"}</span>
          <span>{message.text}</span>
        </div>
      )}

      {/* Form Buat Order */}
      {showForm && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            <span>🛒</span> Buat Order Baru
            <span style={styles.infoBadge}>
              ⚡ OrderService otomatis tarik data dari UserService &
              ProductService
            </span>
          </h3>
          <div style={styles.formGrid}>
            {/* Pilih User */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Pilih User (dari UserService)</label>
              <select
                value={form.user_id}
                onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                style={styles.select}
              >
                <option value="">— Pilih User —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.email}
                  </option>
                ))}
              </select>
            </div>

            {/* ✅ FIX: Pilih Produk — stok 0 disabled */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                Pilih Produk (dari ProductService)
              </label>
              <select
                value={form.product_id}
                onChange={handleProductChange}
                style={styles.select}
              >
                <option value="">— Pilih Produk —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.stock === 0}>
                    {p.stock === 0
                      ? `[HABIS] ${p.name} — Rp ${Number(p.price).toLocaleString("id-ID")}`
                      : `${p.name} — Rp ${Number(p.price).toLocaleString("id-ID")} (Stok: ${p.stock})`}
                  </option>
                ))}
              </select>
              {/* Info stok produk yang dipilih */}
              {selectedProduct && (
                <span
                  style={{
                    ...styles.stockInfo,
                    color: isStockEmpty
                      ? "#ef4444"
                      : isOverStock
                        ? "#f59e0b"
                        : "#10b981",
                  }}
                >
                  {isStockEmpty
                    ? "❌ Stok habis"
                    : `📦 Stok tersedia: ${selectedProduct.stock}`}
                </span>
              )}
            </div>

            {/* ✅ FIX: Input qty dengan max = stok & border merah kalau over */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Jumlah</label>
              <input
                type="number"
                min="1"
                max={selectedProduct ? selectedProduct.stock : undefined}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                style={{
                  ...styles.input,
                  borderColor: isOverStock
                    ? "#ef4444"
                    : "rgba(255,255,255,0.08)",
                }}
                onFocus={(e) => {
                  if (!isOverStock) e.target.style.borderColor = "#f59e0b";
                }}
                onBlur={(e) => {
                  if (!isOverStock)
                    e.target.style.borderColor = "rgba(255,255,255,0.08)";
                }}
                disabled={isStockEmpty}
              />
              {/* ✅ Peringatan langsung kalau qty melebihi stok */}
              {isOverStock && (
                <span style={{ ...styles.stockInfo, color: "#ef4444" }}>
                  ⚠️ Melebihi stok! Maks: {selectedProduct.stock}
                </span>
              )}
            </div>

            {/* Preview total — hanya tampil kalau tidak over stok */}
            {estimatedTotal > 0 && !isOverStock && !isStockEmpty && (
              <div style={styles.totalPreview}>
                <span style={styles.totalLabel}>Estimasi Total</span>
                <span style={styles.totalValue}>
                  Rp {estimatedTotal.toLocaleString("id-ID")}
                </span>
              </div>
            )}
          </div>

          <div style={styles.formActions}>
            {/* ✅ Tombol disabled kalau stok habis atau qty melebihi stok */}
            <button
              onClick={handleCreate}
              style={{
                ...styles.btnYellow,
                opacity: isStockEmpty || isOverStock ? 0.4 : 1,
                cursor: isStockEmpty || isOverStock ? "not-allowed" : "pointer",
              }}
              disabled={isStockEmpty || isOverStock}
            >
              🛒 Konfirmasi Order
            </button>
            <button onClick={() => setShowForm(false)} style={styles.btnGhost}>
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Filter bar */}
      {orders.length > 0 && (
        <div style={styles.filterBar}>
          {["all", "pending", "processing", "completed", "cancelled"].map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  ...styles.filterBtn,
                  ...(filter === f ? styles.filterBtnActive : {}),
                }}
              >
                {f === "all" ? "Semua" : f.charAt(0).toUpperCase() + f.slice(1)}
                <span style={styles.filterCount}>
                  {f === "all"
                    ? orders.length
                    : orders.filter((o) => o.status === f).length}
                </span>
              </button>
            ),
          )}
        </div>
      )}

      {/* Orders Table */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>
          <span>📋</span>
          Daftar Order
          <span style={styles.badge}>{filteredOrders.length}</span>
        </h3>
        {loading ? (
          <div style={styles.loadingState}>
            <div style={styles.spinner} />
            <span>Memuat data dari semua service...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={{ fontSize: "40px" }}>🛒</span>
            <p>
              {orders.length === 0
                ? "Belum ada order. Buat yang pertama!"
                : "Tidak ada order dengan filter ini."}
            </p>
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Produk</th>
                  <th>Qty</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <span style={styles.idBadge}>#{o.id}</span>
                    </td>
                    <td style={{ fontWeight: "600", color: "#f1f5f9" }}>
                      {getUserName(o.user_id)}
                    </td>
                    <td style={{ color: "#94a3b8" }}>
                      {getProductName(o.product_id)}
                    </td>
                    <td
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        color: "#94a3b8",
                      }}
                    >
                      ×{o.quantity}
                    </td>
                    <td
                      style={{
                        fontWeight: "700",
                        color: "#f59e0b",
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: "13px",
                      }}
                    >
                      Rp {Number(o.total_price).toLocaleString("id-ID")}
                    </td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                    <td>
                      <div style={styles.actionGroup}>
                        {o.status !== "completed" &&
                          o.status !== "cancelled" && (
                            <button
                              onClick={() => handleNextStatus(o.id, o.status)}
                              style={styles.btnAdvance}
                            >
                              ▶ Lanjut
                            </button>
                          )}
                        <button
                          onClick={() => handleDelete(o.id)}
                          style={styles.btnDanger}
                        >
                          🗑️
                        </button>
                      </div>
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

function StatusBadge({ status }) {
  const map = {
    completed: {
      bg: "rgba(16,185,129,0.12)",
      color: "#10b981",
      border: "rgba(16,185,129,0.25)",
      label: "✓ Selesai",
    },
    processing: {
      bg: "rgba(79,142,247,0.12)",
      color: "#4f8ef7",
      border: "rgba(79,142,247,0.25)",
      label: "⟳ Proses",
    },
    cancelled: {
      bg: "rgba(239,68,68,0.12)",
      color: "#ef4444",
      border: "rgba(239,68,68,0.25)",
      label: "✕ Batal",
    },
    pending: {
      bg: "rgba(245,158,11,0.12)",
      color: "#f59e0b",
      border: "rgba(245,158,11,0.25)",
      label: "⏳ Pending",
    },
  };
  const s = map[status] || map.pending;
  return (
    <span
      style={{
        backgroundColor: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        padding: "4px 10px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "700",
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}

const styles = {
  page: {
    padding: "32px 24px",
    maxWidth: "1200px",
    margin: "0 auto",
    animation: "fadeInUp 0.35s ease",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
  },
  pageTag: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#f59e0b",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: "6px",
  },
  title: {
    fontSize: "26px",
    fontWeight: "800",
    color: "#f1f5f9",
    letterSpacing: "-0.5px",
    margin: 0,
  },
  subtitle: {
    fontSize: "13px",
    color: "#64748b",
    marginTop: "4px",
    maxWidth: "500px",
  },

  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "12px",
    marginBottom: "24px",
  },
  statCard: {
    backgroundColor: "#161d2f",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "12px",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    transition: "border-color 0.2s ease",
  },
  statIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "9px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    flexShrink: 0,
  },
  statValue: {
    fontSize: "16px",
    fontWeight: "800",
    letterSpacing: "-0.4px",
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: "10px",
    color: "#475569",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginTop: "2px",
  },

  card: {
    backgroundColor: "#161d2f",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.06)",
    marginBottom: "20px",
    overflow: "hidden",
  },
  cardTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: "700",
    color: "#f1f5f9",
    padding: "18px 20px 16px",
    margin: 0,
    flexWrap: "wrap",
  },
  badge: {
    backgroundColor: "rgba(245,158,11,0.15)",
    color: "#f59e0b",
    padding: "2px 8px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700",
  },
  infoBadge: {
    backgroundColor: "rgba(79,142,247,0.1)",
    color: "#4f8ef7",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600",
    marginLeft: "4px",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 200px",
    gap: "14px",
    padding: "0 20px",
    alignItems: "end",
  },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    backgroundColor: "#1e2638",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px",
    color: "#f1f5f9",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s ease",
    fontFamily: "Plus Jakarta Sans, sans-serif",
  },
  select: {
    width: "100%",
    padding: "11px 14px",
    backgroundColor: "#1e2638",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px",
    color: "#f1f5f9",
    fontSize: "14px",
    outline: "none",
    fontFamily: "Plus Jakarta Sans, sans-serif",
  },
  formActions: { display: "flex", gap: "10px", padding: "18px 20px" },

  // ✅ Style baru untuk info stok
  stockInfo: { fontSize: "11px", fontWeight: "600", marginTop: "2px" },

  totalPreview: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    justifyContent: "flex-end",
    paddingBottom: "2px",
  },
  totalLabel: {
    fontSize: "10px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  totalValue: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#f59e0b",
    fontFamily: "JetBrains Mono, monospace",
    letterSpacing: "-0.5px",
  },

  filterBar: {
    display: "flex",
    gap: "6px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  filterBtn: {
    backgroundColor: "rgba(255,255,255,0.04)",
    color: "#64748b",
    border: "1px solid rgba(255,255,255,0.06)",
    padding: "6px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s ease",
  },
  filterBtnActive: {
    backgroundColor: "rgba(245,158,11,0.12)",
    color: "#f59e0b",
    borderColor: "rgba(245,158,11,0.3)",
  },
  filterCount: {
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: "1px 6px",
    borderRadius: "10px",
    fontSize: "11px",
  },

  tableWrap: { overflowX: "auto" },
  idBadge: {
    backgroundColor: "rgba(255,255,255,0.06)",
    color: "#94a3b8",
    padding: "3px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontFamily: "JetBrains Mono, monospace",
  },
  actionGroup: { display: "flex", gap: "6px", justifyContent: "flex-end" },

  toast: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 16px",
    borderRadius: "10px",
    marginBottom: "16px",
    fontSize: "14px",
    fontWeight: "500",
  },
  toastSuccess: {
    backgroundColor: "rgba(16,185,129,0.12)",
    border: "1px solid rgba(16,185,129,0.25)",
    color: "#10b981",
  },
  toastError: {
    backgroundColor: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.25)",
    color: "#ef4444",
  },

  loadingState: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "48px",
    color: "#64748b",
  },
  spinner: {
    width: "20px",
    height: "20px",
    border: "2px solid rgba(255,255,255,0.1)",
    borderTopColor: "#f59e0b",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    padding: "48px",
    color: "#475569",
  },

  btnAdd: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#f59e0b",
    color: "#0a0e1a",
    border: "none",
    padding: "10px 18px",
    borderRadius: "9px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "800",
    boxShadow: "0 0 20px rgba(245,158,11,0.25)",
    flexShrink: 0,
  },
  btnYellow: {
    backgroundColor: "#f59e0b",
    color: "#0a0e1a",
    border: "none",
    padding: "11px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "800",
  },
  btnAdvance: {
    backgroundColor: "rgba(79,142,247,0.12)",
    color: "#4f8ef7",
    border: "1px solid rgba(79,142,247,0.25)",
    padding: "6px 12px",
    borderRadius: "7px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },
  btnDanger: {
    backgroundColor: "rgba(239,68,68,0.1)",
    color: "#ef4444",
    border: "1px solid rgba(239,68,68,0.2)",
    padding: "6px 10px",
    borderRadius: "7px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },
  btnGhost: {
    backgroundColor: "transparent",
    color: "#64748b",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "8px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
  },
};
