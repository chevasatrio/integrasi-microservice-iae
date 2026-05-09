import { useState, useEffect } from "react";
import {
  getUsers,
  createUser,
  deleteUser,
  getUserOrders,
} from "../services/userService";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (e) {
      showMsg("Gagal memuat users. Pastikan UserService berjalan.", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const showMsg = (text, type = "success") => {
    setMessage({ text: "", type: "" }); // reset dulu biar re-animate
    setTimeout(() => setMessage({ text, type }), 10);
    setTimeout(() => setMessage({ text: "", type: "" }), 3500);
  };

  const handleCreate = async () => {
    if (!form.name || !form.email)
      return showMsg("Nama dan Email wajib diisi!", "error");
    setSubmitting(true);
    try {
      await createUser(form);
      setForm({ name: "", email: "", phone: "", address: "" });
      setShowForm(false);
      showMsg("User berhasil ditambahkan!");
      loadUsers();
    } catch (err) {
      showMsg(
        "Gagal: " + (err.response?.data?.message || err.message),
        "error",
      );
    }
    setSubmitting(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Hapus user "${name}"?`)) return;
    await deleteUser(id);
    showMsg("User dihapus.");
    if (selectedUser === id) {
      setOrders(null);
      setSelectedUser(null);
    }
    loadUsers();
  };

  const handleViewOrders = async (id, name) => {
    if (selectedUser === id) {
      setOrders(null);
      setSelectedUser(null);
      return;
    }
    setSelectedUser(id);
    setLoadingOrders(true);
    setOrders(null);
    try {
      const res = await getUserOrders(id);
      setOrders({ ...res.data, _userName: name });
    } catch {
      setOrders({ error: "OrderService tidak tersedia", _userName: name });
    }
    setLoadingOrders(false);
  };

  const fields = [
    { key: "name", placeholder: "Nama lengkap", type: "text" },
    { key: "email", placeholder: "Email address", type: "email" },
    { key: "phone", placeholder: "No. telepon (opsional)", type: "text" },
    { key: "address", placeholder: "Alamat (opsional)", type: "text" },
  ];

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.pageTag}>UserService — Port 8001</div>
          <h2 style={styles.title}>User Management</h2>
          <p style={styles.subtitle}>Kelola data pengguna sistem</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary-anim"
          style={{
            ...styles.btnAdd,
            backgroundColor: showForm ? "#374151" : "#4f8ef7",
            boxShadow: showForm ? "none" : "0 0 20px rgba(79,142,247,0.25)",
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
          <span>{showForm ? "Tutup" : "Tambah User"}</span>
        </button>
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

      {/* Form — scaleIn animation when shown */}
      {showForm && (
        <div className="form-animate" style={styles.card}>
          <h3 style={styles.cardTitle}>
            <span style={styles.cardIcon}>👤</span> Tambah User Baru
          </h3>
          <div style={styles.formGrid}>
            {fields.map((f, i) => (
              <div
                key={f.key}
                style={{ ...styles.fieldGroup, animationDelay: `${i * 0.05}s` }}
              >
                <label style={styles.label}>{f.placeholder}</label>
                <input
                  type={f.type}
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={(e) =>
                    setForm({ ...form, [f.key]: e.target.value })
                  }
                  className="input-anim"
                  style={styles.input}
                  onFocus={(e) => (e.target.style.borderColor = "#4f8ef7")}
                  onBlur={(e) =>
                    (e.target.style.borderColor = "rgba(255,255,255,0.08)")
                  }
                />
              </div>
            ))}
          </div>
          <div style={styles.formActions}>
            <button
              onClick={handleCreate}
              className="btn btn-primary-anim"
              style={{ ...styles.btnPrimary, opacity: submitting ? 0.7 : 1 }}
              disabled={submitting}
            >
              {submitting ? (
                <span
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span style={styles.spinnerInline} /> Menyimpan...
                </span>
              ) : (
                "+ Simpan User"
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

      {/* User Table */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>
            <span style={styles.cardIcon}>👥</span>
            Daftar User
            <span className="badge-anim" style={styles.badge}>
              {users.length}
            </span>
          </h3>
        </div>

        {loading ? (
          <LoadingRows cols={5} />
        ) : users.length === 0 ? (
          <div style={styles.emptyState}>
            <span
              className="empty-float"
              style={{ fontSize: "40px", display: "block" }}
            >
              👤
            </span>
            <p>Belum ada user. Tambahkan yang pertama!</p>
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Telepon</th>
                  <th style={{ textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr
                    key={u.id}
                    style={{
                      ...(selectedUser === u.id ? styles.trSelected : {}),
                      animation: `fadeInUp 0.3s ease ${i * 0.04}s both`,
                    }}
                  >
                    <td>
                      <span style={styles.idBadge}>#{u.id}</span>
                    </td>
                    <td style={{ fontWeight: "600", color: "#f1f5f9" }}>
                      {u.name}
                    </td>
                    <td
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: "13px",
                      }}
                    >
                      {u.email}
                    </td>
                    <td>
                      {u.phone || <span style={{ color: "#475569" }}>—</span>}
                    </td>
                    <td>
                      <div style={styles.actionGroup}>
                        <button
                          onClick={() => handleViewOrders(u.id, u.name)}
                          className="btn-advance-anim"
                          style={
                            selectedUser === u.id
                              ? styles.btnInfoActive
                              : styles.btnInfo
                          }
                        >
                          {selectedUser === u.id ? "✕ Tutup" : "🔍 Histori"}
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, u.name)}
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

      {/* Order History Panel */}
      {(orders || loadingOrders) && (
        <div className="form-animate" style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>
              <span style={styles.cardIcon}>📋</span>
              Histori Order — {orders?._userName}
              <span
                style={{
                  ...styles.badge,
                  backgroundColor: "rgba(245, 158, 11, 0.15)",
                  color: "#f59e0b",
                }}
              >
                via OrderService
              </span>
            </h3>
            <button
              onClick={() => {
                setOrders(null);
                setSelectedUser(null);
              }}
              className="btn-ghost-anim"
              style={styles.btnGhost}
            >
              Tutup ✕
            </button>
          </div>

          {loadingOrders ? (
            <div style={styles.loadingState}>
              <div style={styles.spinner} />
              <span>Memuat dari OrderService...</span>
            </div>
          ) : orders?.error ? (
            <div style={styles.errorState}>
              <span>⚠️</span>
              <span>{orders.error}</span>
            </div>
          ) : (
            <div>
              <div style={styles.infoRow}>
                {[
                  { label: "Nama", value: orders?.user?.name },
                  { label: "Email", value: orders?.user?.email },
                  {
                    label: "Total Order",
                    value: orders?.orders?.length ?? 0,
                    color: "#f59e0b",
                  },
                ].map((item) => (
                  <div key={item.label} style={styles.infoItem}>
                    <span style={styles.infoLabel}>{item.label}</span>
                    <span
                      style={{
                        ...styles.infoValue,
                        ...(item.color ? { color: item.color } : {}),
                      }}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {orders?.orders?.length > 0 ? (
                <div style={styles.tableWrap}>
                  <table>
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Product ID</th>
                        <th>Qty</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.orders.map((o, i) => (
                        <tr
                          key={o.id}
                          style={{
                            animation: `fadeInUp 0.25s ease ${i * 0.05}s both`,
                          }}
                        >
                          <td>
                            <span style={styles.idBadge}>#{o.id}</span>
                          </td>
                          <td>Product #{o.product_id}</td>
                          <td>{o.quantity}</td>
                          <td style={{ fontWeight: "600", color: "#f1f5f9" }}>
                            Rp {Number(o.total_price).toLocaleString("id-ID")}
                          </td>
                          <td>
                            <StatusBadge status={o.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={styles.emptyState}>
                  <span
                    className="empty-float"
                    style={{ fontSize: "32px", display: "block" }}
                  >
                    📭
                  </span>
                  <p>User ini belum punya order.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Loading shimmer rows ── */
function LoadingRows({ cols = 5 }) {
  return (
    <div style={{ padding: "8px 0" }}>
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: "12px",
            padding: "14px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            animationDelay: `${i * 0.1}s`,
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
      bg: "rgba(16,185,129,0.15)",
      color: "#10b981",
      label: "✓ Selesai",
    },
    processing: {
      bg: "rgba(79,142,247,0.15)",
      color: "#4f8ef7",
      label: "⟳ Proses",
    },
    cancelled: {
      bg: "rgba(239,68,68,0.15)",
      color: "#ef4444",
      label: "✕ Batal",
    },
    pending: {
      bg: "rgba(245,158,11,0.15)",
      color: "#f59e0b",
      label: "⏳ Pending",
    },
  };
  const s = map[status] || map.pending;
  return (
    <span
      style={{
        backgroundColor: s.bg,
        color: s.color,
        padding: "4px 10px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "700",
      }}
    >
      {s.label}
    </span>
  );
}

const styles = {
  page: {
    padding: "32px 24px",
    maxWidth: "1100px",
    margin: "0 auto",
    animation: "fadeInUp 0.35s ease",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "28px",
  },
  pageTag: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#4f8ef7",
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
  subtitle: { fontSize: "14px", color: "#64748b", marginTop: "4px" },

  card: {
    backgroundColor: "#161d2f",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.06)",
    marginBottom: "20px",
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 20px 0",
  },
  cardTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: "700",
    color: "#f1f5f9",
    marginBottom: "0",
    padding: "18px 20px 16px",
  },
  cardIcon: { fontSize: "16px" },

  badge: {
    backgroundColor: "rgba(79,142,247,0.15)",
    color: "#4f8ef7",
    padding: "2px 8px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
    padding: "0 20px",
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
  },
  formActions: { display: "flex", gap: "10px", padding: "18px 20px" },

  tableWrap: { overflowX: "auto" },
  trSelected: { backgroundColor: "rgba(79,142,247,0.06)" },
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
    borderTopColor: "#4f8ef7",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    flexShrink: 0,
  },
  spinnerInline: {
    width: "14px",
    height: "14px",
    border: "2px solid rgba(255,255,255,0.2)",
    borderTopColor: "white",
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
  errorState: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "16px 20px",
    color: "#ef4444",
    fontSize: "14px",
  },

  infoRow: {
    display: "flex",
    gap: "24px",
    padding: "16px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  infoItem: { display: "flex", flexDirection: "column", gap: "2px" },
  infoLabel: {
    fontSize: "11px",
    color: "#475569",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  infoValue: { fontSize: "14px", color: "#f1f5f9", fontWeight: "600" },

  btnAdd: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "white",
    border: "none",
    padding: "10px 18px",
    borderRadius: "9px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "700",
  },
  btnPrimary: {
    backgroundColor: "#4f8ef7",
    color: "white",
    border: "none",
    padding: "11px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
  },
  btnInfo: {
    backgroundColor: "rgba(79,142,247,0.1)",
    color: "#4f8ef7",
    border: "1px solid rgba(79,142,247,0.2)",
    padding: "6px 12px",
    borderRadius: "7px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },
  btnInfoActive: {
    backgroundColor: "rgba(79,142,247,0.2)",
    color: "#4f8ef7",
    border: "1px solid rgba(79,142,247,0.4)",
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
