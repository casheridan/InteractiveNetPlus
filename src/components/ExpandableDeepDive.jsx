import { useId, useState } from "react";
import { FrameDiagram } from "./primitives";

function renderBody(body) {
  if (Array.isArray(body)) {
    return (
      <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "#94a3b8", fontSize: 12, lineHeight: 1.65 }}>
        {body.map((line, i) => (
          <li key={i} style={{ marginBottom: 4 }}>
            {line}
          </li>
        ))}
      </ul>
    );
  }
  const paras = String(body)
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return paras.map((p, i) => (
    <p key={i} style={{ margin: i === 0 ? "8px 0 0" : "10px 0 0", color: "#94a3b8", fontSize: 12, lineHeight: 1.7 }}>
      {p}
    </p>
  ));
}

export function AsciiBlock({ lines, color = "#64748b" }) {
  const text = Array.isArray(lines) ? lines.join("\n") : lines;
  return (
    <pre
      style={{
        margin: "10px 0 0",
        padding: "12px 14px",
        borderRadius: 8,
        background: "rgba(0,0,0,0.35)",
        border: `1px solid ${color}33`,
        color: "#cbd5e1",
        fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace",
        lineHeight: 1.45,
        overflowX: "auto",
      }}
    >
      {text}
    </pre>
  );
}

export function ExternalLinks({ resources, color = "#38bdf8" }) {
  if (!resources?.length) return null;
  return (
    <div style={{ marginTop: 14 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#64748b",
          marginBottom: 8,
          fontFamily: "'JetBrains Mono', monospace",
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        External resources
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, listStyle: "disc" }}>
        {resources.map((r, i) => (
          <li key={i} style={{ marginBottom: 6, fontSize: 12 }}>
            <a href={r.href} target="_blank" rel="noopener noreferrer" style={{ color, textDecoration: "none" }}>
              {r.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Renders a deepDive object: { sections?, diagram?, resources? } */
export function DeepDiveContent({ deepDive, accentColor = "#00e5ff" }) {
  if (!deepDive) return null;
  const { sections, diagram, resources } = deepDive;

  return (
    <div style={{ marginTop: 4 }}>
      {sections?.map((sec, i) => (
        <div key={i} style={{ marginTop: i === 0 ? 0 : 14 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: accentColor,
              marginBottom: 4,
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {sec.title}
          </div>
          {renderBody(sec.body)}
        </div>
      ))}

      {diagram?.type === "ascii" && <AsciiBlock lines={diagram.lines} color={accentColor} />}

      {diagram?.type === "frameDiagram" && (
        <div style={{ marginTop: 12 }}>
          <FrameDiagram title={diagram.title} fields={diagram.fields} highlight={diagram.highlight} compact={diagram.compact} />
        </div>
      )}

      <ExternalLinks resources={resources} color={accentColor} />
    </div>
  );
}

export function ExpandableDeepDive({ label = "Deep dive", accentColor = "#00e5ff", defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const panelId = `${id}-panel`;

  return (
    <div style={{ marginTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          padding: "8px 10px",
          borderRadius: 8,
          border: `1px solid ${open ? `${accentColor}55` : "rgba(255,255,255,0.1)"}`,
          background: open ? `${accentColor}12` : "rgba(255,255,255,0.03)",
          color: accentColor,
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
          fontFamily: "'JetBrains Mono', monospace",
          textAlign: "left",
        }}
      >
        <span aria-hidden style={{ fontSize: 10, transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
          ▶
        </span>
        {label}
      </button>
      {open && (
        <div id={panelId} role="region" style={{ marginTop: 10 }}>
          {children}
        </div>
      )}
    </div>
  );
}
