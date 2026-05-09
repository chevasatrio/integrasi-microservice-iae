import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

export default function Navbar() {
  const location = useLocation();
  const [hovered, setHovered] = useState(null);

  const links = [
    { to: "/users", label: "Users", icon: "👤", color: "#4f8ef7" },
    { to: "/products", label: "Products", icon: "📦", color: "#10b981" },
    { to: "/orders", label: "Orders", icon: "🛒", color: "#f59e0b" },
  ];

  return (
    <nav style={S.nav}>
      <div style={S.inner}>
        {/* Brand */}
        <div style={S.brand}>
          <div style={S.brandIcon}>
            <span
              style={{
                fontSize: "16px",
                display: "block",
                animation: "float 3s ease-in-out infinite",
              }}
            >
              ⚡
            </span>
          </div>
          <div>
            <div style={S.brandName}>Microservice</div>
            <div className="nav-brand-sub">IAE Dashboard</div>
          </div>
        </div>

        {/* Links */}
        <div style={S.links}>
          {links.map(({ to, label, icon, color }) => {
            const active = location.pathname === to;
            const isHov = hovered === to;
            return (
              <Link
                key={to}
                to={to}
                className="nav-link-anim"
                onMouseEnter={() => setHovered(to)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "7px 16px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: "600",
                  border: "1px solid transparent",
                  position: "relative",
                  letterSpacing: ".01em",
                  backgroundColor: active
                    ? `${color}18`
                    : isHov
                      ? `${color}10`
                      : "transparent",
                  color: active
                    ? color
                    : isHov
                      ? `${color}cc`
                      : "rgba(255,255,255,.55)",
                  borderColor: active
                    ? `${color}40`
                    : isHov
                      ? `${color}25`
                      : "transparent",
                  boxShadow:
                    isHov && !active ? `0 4px 12px ${color}18` : "none",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    fontSize: "15px",
                    transition: "transform .2s ease",
                    transform: isHov ? "scale(1.25)" : "scale(1)",
                  }}
                >
                  {icon}
                </span>
                <span className="nav-link-label">{label}</span>
                {active && (
                  <span
                    style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      backgroundColor: color,
                      animation: "pulse-dot 2s ease infinite",
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Status */}
        <div
          className="nav-status-wrap"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: "#10b981",
              boxShadow: "0 0 8px rgba(16,185,129,.6)",
              animation: "pulse-dot 2s ease infinite",
              flexShrink: 0,
            }}
          />
          <span className="nav-status-txt">3 Services Live</span>
        </div>
      </div>
    </nav>
  );
}

const S = {
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    backgroundColor: "rgba(10,14,26,.88)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255,255,255,.06)",
  },
  inner: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 24px",
    height: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
  },
  brand: { display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 },
  brandIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "linear-gradient(135deg,#4f8ef7,#7c3aed)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 16px rgba(79,142,247,.35)",
    flexShrink: 0,
  },
  brandName: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#f1f5f9",
    letterSpacing: "-.3px",
    lineHeight: 1.2,
  },
  links: { display: "flex", gap: "4px", flex: 1, justifyContent: "center" },
};
