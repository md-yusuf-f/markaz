import { useState, useEffect } from 'react'
import { useContainers } from '../hooks/useContainers'

export default function InfraStatus() {
  const { containers } = useContainers(30000)
  const [alerts, setAlerts] = useState([])

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts/api/v2/alerts')
      if (!res.ok) return
      const data = await res.json()
      setAlerts(data.filter(a => a.status?.state === 'active'))
    } catch {}
  }

  useEffect(() => {
    fetchAlerts()
    const t = setInterval(fetchAlerts, 30000)
    return () => clearInterval(t)
  }, [])

  const restartedContainers = containers
    .filter(c => {
      const match = c.status.match(/\((\d+) restart/i)
      return match && parseInt(match[1]) > 0
    })
    .map(c => {
      const match = c.status.match(/\((\d+) restart/i)
      return { ...c, restartCount: parseInt(match[1]) }
    })
    .sort((a, b) => b.restartCount - a.restartCount)
    .slice(0, 5)

  const hasAlerts = alerts.length > 0
  const hasRestarts = restartedContainers.length > 0

  return (
    <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>

      {/* Alerts section */}
      <div style={{ marginBottom: '0.5rem' }}>
        <div style={{
          fontSize: '0.6rem',
          color: 'var(--text-dim)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: '0.3rem',
        }}>
          Alerts
        </div>
        {!hasAlerts ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 6px var(--accent-green)' }} />
            <span style={{ color: 'var(--text-dim)', fontSize: '0.68rem' }}>No active alerts</span>
          </div>
        ) : (
          alerts.slice(0, 3).map((a, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '0.2rem 0', borderBottom: '1px solid var(--border)',
            }}>
              <span style={{ color: 'var(--accent-red)' }}>
                ⚠ {a.labels?.alertname ?? 'Alert'}
              </span>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.62rem' }}>
                {a.labels?.severity ?? ''}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Restarts section */}
      <div>
        <div style={{
          fontSize: '0.6rem',
          color: 'var(--text-dim)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: '0.3rem',
        }}>
          Restarts
        </div>
        {!hasRestarts ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 6px var(--accent-green)' }} />
            <span style={{ color: 'var(--text-dim)', fontSize: '0.68rem' }}>All containers stable</span>
          </div>
        ) : (
          restartedContainers.map(c => (
            <div key={c.id} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '0.2rem 0', borderBottom: '1px solid var(--border)',
            }}>
              <span style={{ color: 'var(--accent-yellow)' }}>{c.name}</span>
              <span style={{ color: 'var(--accent-red)', fontSize: '0.62rem' }}>
                {c.restartCount}x
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
