import { useState, useEffect } from 'react'

export default function FilesystemMounts() {
  const [mounts, setMounts] = useState([])

  const fetchMounts = async () => {
    try {
      const [availRes, sizeRes, totalRes] = await Promise.all([
        fetch('/api/prometheus/api/v1/query?query=' + encodeURIComponent(
          'node_filesystem_avail_bytes{fstype!~"tmpfs|overlay|squashfs|devtmpfs"}'
        )),
        fetch('/api/prometheus/api/v1/query?query=' + encodeURIComponent(
          'node_filesystem_size_bytes{fstype!~"tmpfs|overlay|squashfs|devtmpfs"}'
        )),
        fetch('/api/prometheus/api/v1/query?query=' + encodeURIComponent(
          '(node_filesystem_size_bytes{fstype!~"tmpfs|overlay|squashfs|devtmpfs"} - node_filesystem_free_bytes{fstype!~"tmpfs|overlay|squashfs|devtmpfs"})'
        )),
      ])
      const avail = await availRes.json()
      const size = await sizeRes.json()
      const used = await totalRes.json()

      const sizeMap = {}
      const usedMap = {}
      const availMap = {}

      ;(size.data?.result || []).forEach(r => {
        sizeMap[r.metric.mountpoint] = parseFloat(r.value[1])
      })
      ;(used.data?.result || []).forEach(r => {
        usedMap[r.metric.mountpoint] = parseFloat(r.value[1])
      })
      ;(avail.data?.result || []).forEach(r => {
        availMap[r.metric.mountpoint] = parseFloat(r.value[1])
      })

      const parsed = Object.keys(sizeMap)
        .filter(mp => mp)
        .map(mp => {
          const total = sizeMap[mp]
          const usedBytes = usedMap[mp] || 0
          const availBytes = availMap[mp] || 0
          const pct = total > 0 ? ((usedBytes / total) * 100).toFixed(1) : '0'
          const toGB = b => (b / 1073741824).toFixed(1)
          return {
            mount: mp,
            pct: parseFloat(pct),
            usedGB: toGB(usedBytes),
            totalGB: toGB(total),
            availGB: toGB(availBytes),
          }
        })
        .filter(m => parseFloat(m.totalGB) > 0.1)
        .sort((a, b) => a.mount.localeCompare(b.mount))

      setMounts(parsed)
    } catch {}
  }

  useEffect(() => {
    fetchMounts()
    const t = setInterval(fetchMounts, 30000)
    return () => clearInterval(t)
  }, [])

  const barColor = (pct) =>
    pct > 85 ? 'var(--accent-red)' : pct > 70 ? 'var(--accent-yellow)' : 'var(--accent-green)'

  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'stretch', flexWrap: 'wrap', padding: '0.25rem 0' }}>
      {mounts.map(m => (
        <div key={m.mount} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          minWidth: '130px',
          flex: 1,
          padding: '0.4rem 0.5rem',
          border: '1px solid var(--border)',
          borderRadius: '3px',
          background: 'var(--bg)',
        }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
            {m.mount}
          </div>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
            <div style={{
              height: '100%',
              width: `${m.pct}%`,
              background: barColor(m.pct),
              borderRadius: '2px',
              boxShadow: `0 0 6px ${barColor(m.pct)}`,
              transition: 'width 0.5s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: barColor(m.pct) }}>{m.pct}%</span>
            <span style={{ color: 'var(--text-dim)' }}>{m.usedGB} / {m.totalGB} GB</span>
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>
            {m.availGB} GB free
          </div>
        </div>
      ))}
    </div>
  )
}
