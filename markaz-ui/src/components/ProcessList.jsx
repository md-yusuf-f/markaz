import { useState, useEffect } from 'react'

export default function ProcessList() {
  const [procs, setProcs] = useState([])
  const [error, setError] = useState(null)

  const fetchProcs = async () => {
    try {
      const res = await fetch('/api/glances/api/4/processlist')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const top = data
        .filter(p => p.cpu_percent > 0 || p.memory_percent > 0)
        .sort((a, b) => b.cpu_percent - a.cpu_percent)
        .slice(0, 10)
        .map((p, i) => ({
          idx: String(i + 1).padStart(2, '0'),
          pid: p.pid,
          name: p.name.substring(0, 16),
          cpu: p.cpu_percent.toFixed(1),
          mem: p.memory_percent.toFixed(1),
          status: p.status,
          user: p.username?.substring(0, 8) ?? '—',
        }))
      setProcs(top)
      setError(null)
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    fetchProcs()
    const t = setInterval(fetchProcs, 10000)
    return () => clearInterval(t)
  }, [])

  const statusColor = (s) => ({
    'R': 'var(--accent-green)',
    'S': 'var(--text-dim)',
    'D': 'var(--accent-yellow)',
    'Z': 'var(--accent-red)',
    'T': 'var(--accent-yellow)',
  }[s] || 'var(--text-dim)')

  if (error) return (
    <div style={{ color: 'var(--accent-red)', fontSize: '0.68rem' }}>
      Glances error: {error}
    </div>
  )

  return (
    <div style={{ width: '100%' }}>
      {/* Header row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '20px 1fr 36px 36px',
        gap: '0.3rem',
        padding: '0 0 0.3rem 0',
        borderBottom: '1px solid var(--border)',
        fontSize: '0.6rem',
        color: 'var(--text-dim)',
        letterSpacing: '0.05em',
      }}>
        <span>#</span>
        <span>NAME</span>
        <span style={{ textAlign: 'right' }}>CPU</span>
        <span style={{ textAlign: 'right' }}>MEM</span>
      </div>

      {procs.map(p => (
        <div key={p.pid} style={{
          display: 'grid',
          gridTemplateColumns: '20px 1fr 36px 36px',
          gap: '0.3rem',
          padding: '0.25rem 0',
          borderBottom: '1px solid rgba(30,45,74,0.5)',
          fontSize: '0.68rem',
          lineHeight: 1.4,
        }}>
          <span style={{ color: 'var(--text-dim)', fontSize: '0.6rem' }}>{p.idx}</span>
          <div style={{ overflow: 'hidden' }}>
            <div style={{
              color: statusColor(p.status),
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {p.name}
            </div>
            <div style={{ fontSize: '0.58rem', color: 'var(--text-dim)' }}>
              {p.user} · pid {p.pid}
            </div>
          </div>
          <span style={{
            textAlign: 'right',
            color: parseFloat(p.cpu) > 50
              ? 'var(--accent-red)'
              : parseFloat(p.cpu) > 20
              ? 'var(--accent-yellow)'
              : 'var(--accent-green)',
            fontSize: '0.66rem',
          }}>
            {p.cpu}%
          </span>
          <span style={{
            textAlign: 'right',
            color: parseFloat(p.mem) > 10
              ? 'var(--accent-yellow)'
              : 'var(--text-dim)',
            fontSize: '0.66rem',
          }}>
            {p.mem}%
          </span>
        </div>
      ))}
    </div>
  )
}
