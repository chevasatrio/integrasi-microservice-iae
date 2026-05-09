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
  const [submitting, setSubmitting] = useState(false);
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
    setMessage({ text: "", type: "" });
    setTimeout(() => setMessage({ text, type }), 10);
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  // Reset qty ke 1 saat produk berganti
  const handleProductChange = (e) => {
    setForm({ ...form, product_id: e.target.value, quantity: 1 });
  };

  const handleCreate = async () => {
    if (!form.user_id || !form.product_id || !form.quantity)
      return showMsg("Semua field wajib diisi!", "error");

    // Validasi stok di UI sebelum hit API
    const sel = products.find((p) => p.id === Number(form.product_id));
    if (sel?.stock === 0) return showMsg("Stok produk sudah habis!", "error");
    if (sel && Number(form.quantity) > sel.stock)
      return showMsg(`Stok tidak cukup! Tersedia: ${sel.stock}`, "error");

    setSubmitting(true);
    try {
      const res = await createOrder(form);
      showMsg(
        `✅ Order berhasil! ${res.data.user_name} — ${res.data.product_name} (${res.data.quantity}x)`,
      );
      setForm({ user_id: "", product_id: "", quantity: 1 });
      setShowForm(false);
      loadAll();
    } catch (err) {
      showMsg(
        "Gagal: " + (err.response?.data?.message || err.message),
        "error",
      );
    }
    setSubmitting(false);
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

  const selectedProduct = products.find(
    (p) => p.id === Number(form.product_id),
  );
  const estimatedTotal = selectedProduct
    ? Number(selectedProduct.price) * Number(form.quantity)
    : 0;
  const isStockEmpty = selectedProduct?.stock === 0;
  const isOverStock =
    selectedProduct && Number(form.quantity) > selectedProduct.stock;
  const isFormInvalid = isStockEmpty || isOverStock;

  const statItems = [
    { label: "Total Order", value: stats.total, icon: "🛒", color: "#4f8ef7" },
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
  ];

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
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-yellow-anim"
          style={{
            ...styles.btnAdd,
            backgroundColor: showForm ? "#374151" : "#f59e0b",
            boxShadow: showForm ? "none" : "0 0 20px rgba(245,158,11,0.25)",
            color: showForm ? "#f1f5f9" : "#0a0e1a",
          }}
        >
          <span
            style={{
              display: "inline-block",
              transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
              transform: showForm ? "rotate(45deg)" : "rotate(0deg)",
              fontSize: "18px",
              fontWeight: "300",
            }}
          >
            +
          </span>
          <span>{showForm ? "Tutup" : "Buat Order"}</span>
        </button>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        {statItems.map((s, i) => (
          <div
            key={s.label}
            className="stat-card-anim"
            onClick={() =>
              s.clickFilter &&
              setFilter(filter === s.clickFilter ? "all" : s.clickFilter)
            }
            style={{
              ...styles.statCard,
              cursor: s.clickFilter ? "pointer" : "default",
              borderColor:
                filter === s.clickFilter
                  ? `${s.color}40`
                  : "rgba(255,255,255,0.06)",
              animation: `fadeInUp 0.3s ease ${i * 0.07}s both`,
            }}
          >
            <div
              style={{ ...styles.statIcon, backgroundColor: `${s.color}18` }}
            >
              <span
                style={{
                  fontSize: "16px",
                  display: "block",
                  animation: "float 3s ease-in-out infinite",
                }}
              >
                {s.icon}
              </span>
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
          className="toast-animate"
          style={{
            ...styles.toast,
            ...(message.type === "error"
              ? styles.toastError
              : styles.toastSuccess),
          }}
        >
          <span style={{ fontSize: "16px" }}>
            {message.type === "error" ? "⚠️" : "✅"}
          </span>
          <span>{message.text}</span>
        </div>
      )}

      {/* Form Buat Order */}
      {showForm && (
        <div className="form-animate" style={styles.card}>
          <h3 style={styles.cardTitle}>
            <span>🛒</span> Buat Order Baru
            <span style={styles.infoBadge}>
              ⚡ OrderService otomatis tarik data dari UserService &
              ProductService
            </span>
          </h3>
          <div style={styles.formGrid}>
            {/* Pilih User */}
            <div
              style={{
                ...styles.fieldGroup,
                animation: "fadeInUp 0.2s ease 0s both",
              }}
            >
              <label style={styles.label}>Pilih User (dari UserService)</label>
              <select
                value={form.user_id}
                onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                className="input-anim"
                style={styles.select}
                onFocus={(e) => (e.target.style.borderColor = "#f59e0b")}
                onBlur={(e) =>
                  (e.target.style.borderColor = "rgba(255,255,255,0.08)")
                }
              >
                <option value="">— Pilih User —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Pilih Produk — stok 0 disabled */}
            <div
              style={{
                ...styles.fieldGroup,
                animation: "fadeInUp 0.2s ease 0.05s both",
              }}
            >
              <label style={styles.label}>
                Pilih Produk (dari ProductService)
              </label>
              <select
                value={form.product_id}
                onChange={handleProductChange}
                className="input-anim"
                style={styles.select}
                onFocus={(e) => (e.target.style.borderColor = "#f59e0b")}
                onBlur={(e) =>
                  (e.target.style.borderColor = "rgba(255,255,255,0.08)")
                }
              >
                <option value="">— Pilih Produk —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.stock === 0}>
                    {p.stock === 0
                      ? `[HABIS] ${p.name}`
                      : `${p.name} — Rp ${Number(p.price).toLocaleString("id-ID")} (Stok: ${p.stock})`}
                  </option>
                ))}
              </select>
              {/* Info stok produk yang dipilih */}
              {selectedProduct && (
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    marginTop: "2px",
                    color: isStockEmpty
                      ? "#ef4444"
                      : isOverStock
                        ? "#f59e0b"
                        : "#10b981",
                    animation: "fadeInUp 0.2s ease",
                  }}
                >
                  {isStockEmpty
                    ? "❌ Stok habis"
                    : `📦 Stok tersedia: ${selectedProduct.stock}`}
                </span>
              )}
            </div>

            {/* Qty — max = stok */}
            <div
              style={{
                ...styles.fieldGroup,
                animation: "fadeInUp 0.2s ease 0.1s both",
              }}
            >
              <label style={styles.label}>Jumlah</label>
              <input
                type="number"
                min="1"
                max={selectedProduct?.stock || undefined}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="input-anim"
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
              {isOverStock && (
                <span
                  style={{
                    fontSize: "11px",
                    color: "#ef4444",
                    fontWeight: "600",
                    marginTop: "2px",
                    animation: "fadeInUp 0.2s ease",
                  }}
                >
                  ⚠️ Melebihi stok! Maks: {selectedProduct.stock}
                </span>
              )}
            </div>

            {/* Estimasi total — hanya tampil kalau valid */}
            {estimatedTotal > 0 && !isFormInvalid && (
              <div
                style={{
                  ...styles.totalPreview,
                  animation: "scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                }}
              >
                <span style={styles.totalLabel}>Estimasi Total</span>
                <span style={styles.totalValue}>
                  Rp {estimatedTotal.toLocaleString("id-ID")}
                </span>
              </div>
            )}
          </div>

          <div style={styles.formActions}>
            <button
              onClick={handleCreate}
              className={isFormInvalid ? "" : "btn btn-yellow-anim"}
              style={{
                ...styles.btnYellow,
                opacity: isFormInvalid || submitting ? 0.4 : 1,
                cursor: isFormInvalid || submitting ? "not-allowed" : "pointer",
                color: "#0a0e1a",
              }}
              disabled={isFormInvalid || submitting}
            >
              {submitting ? (
                <span
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span style={styles.spinnerInline} /> Memproses...
                </span>
              ) : (
                "🛒 Konfirmasi Order"
              )}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="btn-ghost-anim"
              style={styles.btnGhost}
            >
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
                className="filter-btn-anim"
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
          <span className="badge-anim" style={styles.badge}>
            {filteredOrders.length}
          </span>
        </h3>

        {loading ? (
          <LoadingRows cols={7} />
        ) : filteredOrders.length === 0 ? (
          <div style={styles.emptyState}>
            <span
              className="empty-float"
              style={{ fontSize: "40px", display: "block" }}
            >
              🛒
            </span>
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
                {filteredOrders.map((o, i) => (
                  <tr
                    key={o.id}
                    style={{
                      animation: `fadeInUp 0.3s ease ${i * 0.04}s both`,
                    }}
                  >
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
                              className="btn-advance-anim"
                              style={styles.btnAdvance}
                            >
                              ▶ Lanjut
                            </button>
                          )}
                        <button
                          onClick={() => handleDelete(o.id)}
                          className="btn-danger-anim"
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

/* ── Loading shimmer rows ── */
function LoadingRows({ cols = 7 }) {
  return (
    <div style={{ padding: "8px 0" }}>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: "12px",
            padding: "14px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          {[...Array(cols)].map((_, j) => (
            <div
              key={j}
              className="shimmer"
              style={{
                height: "14px",
                borderRadius: "6px",
                width: j === 0 ? "40px" : j === cols - 1 ? "80px" : "100%",
              }}
            />
          ))}
        </div>
      ))}
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
  },
  statIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "9px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
    fontFamily: "Plus Jakarta Sans, sans-serif",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
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
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  },
  formActions: { display: "flex", gap: "10px", padding: "18px 20px" },

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
    flexShrink: 0,
  },
  spinnerInline: {
    width: "14px",
    height: "14px",
    border: "2px solid rgba(0,0,0,0.15)",
    borderTopColor: "#0a0e1a",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    flexShrink: 0,
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
    border: "none",
    padding: "10px 18px",
    borderRadius: "9px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "800",
    flexShrink: 0,
  },
  btnYellow: {
    backgroundColor: "#f59e0b",
    border: "none",
    padding: "11px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "800",
    display: "flex",
    alignItems: "center",
    gap: "8px",
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
