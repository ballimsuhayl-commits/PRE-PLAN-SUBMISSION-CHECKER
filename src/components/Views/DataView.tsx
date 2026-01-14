import React, { useMemo, useState } from "react";

type ApiOk = {
  ok: true;
  input_address: string;
  geocode: { lat: number; lon: number; display_name: string };
  parcel: {
    erf: string;
    area: number;
    address: string;
    attributes: Record<string, any>;
    rings: number[][][];
  };
  zoning: { code: string; raw: any };
  sewer: { count: number; features: any[] };
};

export default function DataView() {
  const [address, setAddress] = useState("716 Musgrave Road, Durban");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<ApiOk | null>(null);

  const areaPretty = useMemo(() => {
    const a = data?.parcel?.area ?? 0;
    return Math.round(a).toLocaleString();
  }, [data]);

  async function generate() {
    setBusy(true);
    setErr(null);
    setData(null);

    try {
      const res = await fetch("/api/process_address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || json?.error || `HTTP ${res.status}`);
      setData(json);
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="h">Paste address → Auto pack</div>

      <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. 27 Gainsborough Drive, Durban"
          style={{
            flex: 1,
            background: "#020617",
            border: "1px solid rgba(148,163,184,.25)",
            borderRadius: 12,
            padding: "12px 14px",
            color: "#f8fafc",
            outline: "none",
          }}
        />
        <button
          onClick={generate}
          disabled={busy}
          style={{
            width: 160,
            background: busy ? "rgba(59,130,246,.35)" : "#2563eb",
            border: "1px solid rgba(59,130,246,.55)",
            borderRadius: 12,
            color: "#fff",
            fontWeight: 800,
            letterSpacing: ".08em",
            cursor: busy ? "default" : "pointer",
          }}
        >
          {busy ? "WORKING..." : "GENERATE"}
        </button>
      </div>

      <div className="p muted" style={{ marginTop: 10 }}>
        Pipeline: geocode → parcel → zoning → sewer. Returns a preview JSON pack (no download yet).
      </div>

      {err && (
        <div
          style={{
            marginTop: 14,
            background: "rgba(127,29,29,.25)",
            border: "1px solid rgba(239,68,68,.35)",
            borderRadius: 12,
            padding: 12,
            color: "#fecaca",
            fontSize: 13,
            whiteSpace: "pre-wrap",
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Request failed</div>
          {err}
        </div>
      )}

      {data && (
        <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
          <div
            style={{
              background: "rgba(2,6,23,.6)",
              border: "1px solid rgba(148,163,184,.16)",
              borderRadius: 14,
              padding: 14,
            }}
          >
            <div className="p muted" style={{ marginTop: 0 }}>Address</div>
            <div style={{ fontSize: 18, fontWeight: 900, marginTop: 4 }}>{data.parcel.address}</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
              <div style={{ background: "rgba(15,23,42,.65)", border: "1px solid rgba(148,163,184,.14)", borderRadius: 12, padding: 12 }}>
                <div className="p muted" style={{ marginTop: 0 }}>ERF</div>
                <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontWeight: 900 }}>{data.parcel.erf}</div>
              </div>
              <div style={{ background: "rgba(15,23,42,.65)", border: "1px solid rgba(148,163,184,.14)", borderRadius: 12, padding: 12 }}>
                <div className="p muted" style={{ marginTop: 0 }}>AREA</div>
                <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontWeight: 900 }}>{areaPretty} m²</div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: "rgba(2,6,23,.6)", border: "1px solid rgba(148,163,184,.16)", borderRadius: 14, padding: 14 }}>
              <div className="p muted" style={{ marginTop: 0 }}>Zoning</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#fde047", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                {data.zoning.code}
              </div>
            </div>

            <div style={{ background: "rgba(2,6,23,.6)", border: "1px solid rgba(148,163,184,.16)", borderRadius: 14, padding: 14 }}>
              <div className="p muted" style={{ marginTop: 0 }}>Sewer</div>
              <div style={{ fontSize: 13, color: "#e2e8f0", marginTop: 6 }}>
                {data.sewer.count > 0 ? `Found ${data.sewer.count} intersecting feature(s).` : "No sewer features returned by this layer."}
              </div>
            </div>
          </div>

          <details style={{ background: "rgba(2,6,23,.6)", border: "1px solid rgba(148,163,184,.16)", borderRadius: 14, padding: 14 }}>
            <summary style={{ cursor: "pointer", fontWeight: 900, color: "#94a3b8" }}>Raw JSON (debug)</summary>
            <pre style={{ marginTop: 10, fontSize: 12, color: "#cbd5e1", overflow: "auto" }}>{JSON.stringify(data, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
}
