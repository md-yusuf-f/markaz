import { useEffect, useState } from "react";

// Uptime Kuma status page slug — must match your status page URL slug
const KUMA_SLUG = 'my-homelab'

export default function UptimeStrip() {
  const [monitors, setMonitors] = useState([]);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    try {
      const [pageRes, beatRes] = await Promise.all([
        fetch(`/api/kuma/api/status-page/${KUMA_SLUG}`),
        fetch(`/api/kuma/api/status-page/heartbeat/${KUMA_SLUG}`),
      ]);
      const page = await pageRes.json();
      const beat = await beatRes.json();

      const nameMap = {};
      (page.publicGroupList || []).forEach(group => {
        (group.monitorList || []).forEach(m => {
          nameMap[m.id] = m.name;
        });
      });

      const entries = Object.entries(beat.heartbeatList || {}).map(([id, beats]) => {
        const latest = beats[beats.length - 1];
        return {
          id,
          name: nameMap[id] ?? `Monitor ${id}`,
          status: latest?.status === 1 ? "up" : "down",
          ping: latest?.ping ?? null,
        };
      });

      setMonitors(entries);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    fetchStatus();
    const t = setInterval(fetchStatus, 30000);
    return () => clearInterval(t);
  }, []);

  if (error) return (
    <div style={{ color: "var(--accent-red)", fontSize: "0.75rem", padding: "0.5rem" }}>
      Kuma error: {error}
    </div>
  );

  return (
    <div style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono)" }}>
      {monitors.length === 0 && (
        <span style={{ color: "var(--text-dim)" }}>Loading monitors...</span>
      )}
      {monitors.map(m => (
        <div key={m.id} style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.3rem 0",
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: m.status === "up" ? "var(--accent-green)" : "var(--accent-red)",
              boxShadow: m.status === "up"
                ? "0 0 6px var(--accent-green)"
                : "0 0 6px var(--accent-red)",
              flexShrink: 0,
            }} />
            <span style={{
              color: m.status === "up" ? "var(--text)" : "var(--accent-red)",
              maxWidth: "160px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {m.name}
            </span>
          </div>
          <span style={{
            color: m.ping !== null
              ? m.ping > 1000 ? "var(--accent-yellow)" : "var(--text-dim)"
              : "var(--text-dim)",
            fontSize: "0.68rem",
            flexShrink: 0,
          }}>
            {m.ping !== null ? `${m.ping}ms` : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}
