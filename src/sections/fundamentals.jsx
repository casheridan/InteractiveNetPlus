import { useState } from "react";
import { APPLIANCES, OSI_LAYERS } from "../data/fundamentalsData";
import { Badge, Card, InfoRow, Pill, SectionHeader } from "../components/primitives";

export function OSISection() {
  const [sel, setSel] = useState(null);
  const layer = sel !== null ? OSI_LAYERS[sel] : null;
  return (
    <div>
      <SectionHeader icon="⬡" title="OSI Model" subtitle="Click any layer to explore protocols, devices, and how data is processed at each level." />
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 340px", minWidth: 300 }}>
          {OSI_LAYERS.map((l, i) => (
            <div
              key={i}
              onClick={() => setSel(i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                cursor: "pointer",
                background: sel === i ? `${l.color}18` : "transparent",
                borderLeft: `4px solid ${l.color}`,
                borderRadius: "0 8px 8px 0",
                marginBottom: 2,
                transition: "all 0.2s",
                border: sel === i ? `1px solid ${l.color}44` : "1px solid transparent",
                borderLeftWidth: 4,
                borderLeftColor: l.color,
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 8, background: l.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, color: "#fff", fontFamily: "'Space Mono', monospace", flexShrink: 0 }}>{l.num}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#e2e8f0" }}>{l.name}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>PDU: {l.pdu}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ flex: "1 1 400px", minWidth: 300 }}>
          {layer ? (
            <Card color={layer.color} title={`Layer ${layer.num}: ${layer.name}`}>
              <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7, margin: "0 0 14px" }}>{layer.detail}</p>
              <InfoRow label="PDU" value={layer.pdu} />
              <div style={{ marginTop: 12 }}>
                <div style={{ color: "#64748b", fontSize: 11, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Protocols</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{layer.protocols.map((p) => <Badge key={p} color={layer.color}>{p}</Badge>)}</div>
              </div>
              {layer.devices.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ color: "#64748b", fontSize: 11, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Devices at this layer</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{layer.devices.map((d) => <Badge key={d} color="#00e5ff">{d}</Badge>)}</div>
                </div>
              )}
              <div style={{ marginTop: 14, padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8, fontSize: 12, color: "#cbd5e1", lineHeight: 1.6 }}>
                <strong style={{ color: layer.color }}>Data flow:</strong> When sending, data moves DOWN from L7→L1. Each layer adds its header (encapsulation). At Layer {layer.num}, the {layer.pdu.toLowerCase()} is created. When receiving, data moves UP from L1→L7 (de-encapsulation).
              </div>
            </Card>
          ) : (
            <div style={{ padding: 40, textAlign: "center", color: "#475569", fontSize: 14 }}>← Click a layer to see details</div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AppliancesSection() {
  const [sel, setSel] = useState(null);
  const dev = sel !== null ? APPLIANCES[sel] : null;
  return (
    <div>
      <SectionHeader icon="🔲" title="Network Appliances" subtitle="Click a device to see how it processes data, which layers it operates at, and its key features." />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {APPLIANCES.map((a, i) => (
          <Pill key={i} active={sel === i} onClick={() => setSel(i)} color="#00e5ff">
            {a.icon} {a.name}
          </Pill>
        ))}
      </div>
      {dev && (
        <Card color="#00e5ff" title={`${dev.icon} ${dev.name}`}>
          <Badge color="#00e5ff">Layer {dev.layer}</Badge>
          <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7, margin: "10px 0" }}>{dev.desc}</p>
          <div style={{ color: "#64748b", fontSize: 11, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Key Features</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {dev.features.map((f) => (
              <Badge key={f} color="#38bdf8">
                {f}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
