import { useEffect, useState } from 'react'

// Edit these to match your own nodes
// kumaName: null means always shown as up (no Kuma check)
// offline: true means permanently shown as OFFLINE
const NODES = [
  { id: 'node-1',   label: 'Node-1',   kumaName: null,        role: 'Primary · ARM64' },
  { id: 'node-2',   label: 'Node-2',   kumaName: 'Node-2',    role: 'Monitor · x86' },
  { id: 'node-3',   label: 'Node-3',   kumaName: null,        role: 'Standby · AMD64', offline: true },
]

// Uptime Kuma status page slug — must match your status page URL slug
const KUMA_SLUG = 'my-homelab'

export default function NodeBar() {
  const [metrics, setMetrics] = useState({ cpu: null, ram: null, disk: null })
  const [kumaData, setKumaData] = useState({})

  const fetchMetrics = async () => {
    try {
      const queries = {
        cpu: '100 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)',
        ram: '(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100',
        disk: '100 - ((node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100)',
      }
      const results = await Promise.all(
        Object.entries(queries).map(async ([key, q]) => {
          const res = await fetch('/api/prometheus/api/v1/query?query=' + encodeURIComponent(q))
          const data = await res.json()
          const val = data?.data?.result?.[0]?.value?.[1]
          return [key, val ? parseFloat(val).toFixed(1) : null]
        })
      )
      setMetrics(Object.fromEntries(results))
    } catch {}
  }

  const fetchKuma = async () => {
    try {
      const [pageRes, beatRes] = await Promise.all([
        fetch(`/api/kuma/api/status-page/${KUMA_SLUG}`),
        fetch(`/api/kuma/api/status-page/heartbeat/${KUMA_SLUG}`),
      ])
      const page = await pageRes.json()
      const beat = await beatRes.json()

      const idToName = {}
      ;(page.publicGroupList || []).forEach(g => {
        ;(g.monitorList || []).forEach(m => {
          idToName[String(m.id)] = m.name
        })
      })

      const result = {}
      Object.entries(beat.heartbeatList || {}).forEach(([id, beats]) => {
        const latest = beats[beats.length - 1]
        const name = idToName[String(id)]
        if (name) {
          result[name] = {
            status: latest?.status === 1 ? 'up' : 'down',
            ping: latest?.ping ?? null,
          }
        }
      })
      setKumaData(result)
    } catch {}
  }

  useEffect(() => {
    fetchMetrics()
    fetchKuma()
    const t1 = setInterval(fetchMetrics, 10000)
    const t2 = setInterval(fetchKuma, 30000)
    return () => { clearInterval(t1); clearInterval(t2) }
  }, [])

  const getStatus = (node) => {
    if (node.offline) return 'offline'
    if (node.kumaName) return kumaData[node.kumaName]?.status ?? 'pending'
    return 'up'
  }

  const dotColor = (status) => ({
    up:      'var(--accent-green)',
    down:    'var(--accent-red)',
    offline: 'var(--text-dim)',
    pending: 'var(--accent-yellow)',
  }[status] || 'var(--text-dim)')

  const statusLabel = (status) => ({
    up:      'ONLINE',
    down:    'DOWN',
    offline: 'OFFLINE',
    pending: '...',
  }[status] || '—')

  return (
    <div style={{
      display: 'flex',
      alignItems: 'stretch',
      gap: '4px',
      width: '100%',
      height: '100%',
    }}>
      {NODES.map(node => {
        const status = getStatus(node)
        const color = dotColor(status)
        const ping = node.kumaName ? kumaData[node.kumaName]?.ping : null

        return (
          <div key={node.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.3rem 0.75rem',
            border: '1px solid var(--border)',
            borderRadius: '3px',
            background: 'var(--bg-panel)',
            flex: 1,
            minWidth: 0,
          }}>
            <div style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: color,
              boxShadow: status !== 'offline' ? `0 0 8px ${color}` : 'none',
              flexShrink: 0,
            }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text)', fontWeight: 600 }}>
                  {node.label}
                </span>
                <span style={{ fontSize: '0.62rem', color, letterSpacing: '0.05em' }}>
                  {statusLabel(status)}
                </span>
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', marginTop: '2px', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {node.id === 'node-1' && (
                  <>
                    {metrics.cpu !== null && <span>CPU <span style={{ color: 'var(--accent)' }}>{metrics.cpu}%</span></span>}
                    {metrics.ram !== null && <span>RAM <span style={{ color: parseFloat(metrics.ram) > 85 ? 'var(--accent-red)' : parseFloat(metrics.ram) > 70 ? 'var(--accent-yellow)' : 'var(--accent)' }}>{metrics.ram}%</span></span>}
                    {metrics.disk !== null && <span>Disk <span style={{ color: parseFloat(metrics.disk) > 85 ? 'var(--accent-red)' : parseFloat(metrics.disk) > 70 ? 'var(--accent-yellow)' : 'var(--accent)' }}>{metrics.disk}%</span></span>}
                  </>
                )}
                {node.id === 'node-2' && (
                  <span>
                    {node.role}
                    {kumaData[node.kumaName]?.status === 'up'
                      ? <span style={{ color: 'var(--accent)', marginLeft: '0.4rem' }}>TCP ✓</span>
                      : ''}
                  </span>
                )}
                {node.id === 'node-3' && (
                  <span>{node.role}</span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
