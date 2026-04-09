export const Pill = ({ children, active, onClick, color }) => (
  <button
    onClick={onClick}
    style={{
      padding: "6px 14px",
      borderRadius: 20,
      border: `1.5px solid ${active ? color || "#00e5ff" : "rgba(255,255,255,0.15)"}`,
      background: active ? `${color || "#00e5ff"}22` : "rgba(255,255,255,0.04)",
      color: active ? color || "#00e5ff" : "#94a3b8",
      cursor: "pointer",
      fontSize: 13,
      fontFamily: "'JetBrains Mono', monospace",
      transition: "all 0.2s",
      fontWeight: active ? 600 : 400,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </button>
);

export const Card = ({ children, title, color, onClick, style }) => (
  <div
    onClick={onClick}
    style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12,
      padding: "18px 20px",
      cursor: onClick ? "pointer" : "default",
      transition: "all 0.25s",
      borderLeft: color ? `3px solid ${color}` : undefined,
      ...style,
      ...(onClick ? {} : {}),
    }}
    onMouseEnter={(e) => {
      if (onClick) {
        e.currentTarget.style.background = "rgba(255,255,255,0.06)";
        e.currentTarget.style.borderColor = color || "rgba(255,255,255,0.2)";
      }
    }}
    onMouseLeave={(e) => {
      if (onClick) {
        e.currentTarget.style.background = "rgba(255,255,255,0.03)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
      }
    }}
  >
    {title && (
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: color || "#e2e8f0",
          marginBottom: 8,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {title}
      </div>
    )}
    {children}
  </div>
);

export const Badge = ({ children, color }) => (
  <span
    style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 6,
      background: `${color}22`,
      color,
      fontSize: 11,
      fontWeight: 600,
      fontFamily: "'JetBrains Mono', monospace",
      marginRight: 6,
    }}
  >
    {children}
  </span>
);

export const InfoRow = ({ label, value }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "6px 0",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
      fontSize: 13,
    }}
  >
    <span style={{ color: "#64748b" }}>{label}</span>
    <span style={{ color: "#cbd5e1", textAlign: "right", maxWidth: "60%" }}>
      {value}
    </span>
  </div>
);

export const SectionHeader = ({ icon, title, subtitle }) => (
  <div style={{ marginBottom: 24 }}>
    <div
      style={{
        fontSize: 26,
        fontWeight: 800,
        color: "#f1f5f9",
        fontFamily: "'Space Mono', monospace",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <span style={{ fontSize: 28 }}>{icon}</span> {title}
    </div>
    {subtitle && (
      <div style={{ fontSize: 13, color: "#64748b", marginTop: 6, lineHeight: 1.6 }}>
        {subtitle}
      </div>
    )}
  </div>
);

export function FrameDiagram({ fields, title, highlight, compact }) {
  return (
    <div style={{ marginBottom: compact ? 8 : 14 }}>
      {title && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#94a3b8",
            marginBottom: 6,
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {title}
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 2, fontFamily: "'JetBrains Mono', monospace" }}>
        {fields.map((f, i) => {
          const isHl = highlight === f.key || highlight === "all";
          return (
            <div
              key={i}
              style={{
                padding: compact ? "4px 6px" : "6px 10px",
                background: isHl ? `${f.color}33` : `${f.color}15`,
                border: `1.5px solid ${isHl ? f.color : `${f.color}44`}`,
                borderRadius: 6,
                transition: "all 0.3s",
                flex: f.flex || undefined,
                minWidth: compact ? 60 : 80,
                transform: isHl ? "scale(1.04)" : "scale(1)",
                boxShadow: isHl ? `0 0 12px ${f.color}44` : "none",
              }}
            >
              <div style={{ fontSize: compact ? 8 : 9, color: f.color, opacity: 0.8, marginBottom: 2 }}>{f.label}</div>
              <div style={{ fontSize: compact ? 10 : 11, color: "#e2e8f0", wordBreak: "break-all" }}>{f.value}</div>
              {f.bits && <div style={{ fontSize: 8, color: "#475569", marginTop: 1 }}>{f.bits}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TableView({ title, columns, rows, color, highlightRow }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: color || "#94a3b8", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: 1 }}>
        {title}
      </div>
      <div style={{ overflowX: "auto", borderRadius: 8, border: `1px solid ${color || "#94a3b8"}33` }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={i} style={{ padding: "8px 10px", borderBottom: `2px solid ${color || "#94a3b8"}44`, color: color || "#94a3b8", textAlign: "left", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} style={{ background: highlightRow === ri ? `${color}18` : "transparent", borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "all 0.3s" }}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{ padding: "7px 10px", color: highlightRow === ri ? "#e2e8f0" : "#94a3b8" }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
