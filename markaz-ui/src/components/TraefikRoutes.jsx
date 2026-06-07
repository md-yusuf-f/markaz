import { useState, useEffect } from 'react'

export default function TraefikRoutes() {
  const [routers, setRouters] = useState([])
  const [error, setError] = useState(null)

  const fetchRouters = async () => {
    try {
      const res = await fetch('/api/traefik/api/http/routers')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const sorted = data
        .filter(r => r.status === 'enabled')
        .sort((a, b) => a.name.localeCompare(b.name))
      setRouters(sorted)
      setError(null)
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    fetchRouters()
    const t = setInterval(fetchRouters, 30000)
    return () => clearInterval(t)
  }, [])

  if (error) return (
    <div style={{ color: 'var(--accent-red)', fontSize: '0.72rem', padding: '0.5rem' }}>
      Traefik API error: {error}
    </div>
  )

  return (
    <div style={{ overflowY: 'auto', flex: 1 }}>
      {routers.length === 0 && (
        <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>Loading routes...</div>
      )}
      {routers.map(r => {
        const domain = r.rule?.match(/`([^`]+)`/)?.[1] ?? r.rule
        const isFile = r.provider === 'file'
        const isSecure = r.tls !== undefined
        return (
          <div key={r.name} style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '0.35rem 0',
            borderBottom: '1px solid var(--border)',
            gap: '2px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                fontSize: '0.7rem',
                color: 'var(--text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '170px',
              }}>
                {domain}
              </span>
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                {isSecure && (
                  <span style={{
                    fontSize: '0.55rem',
                    padding: '1px 5px',
                    borderRadius: '999px',
                    background: 'rgba(10,255,157,0.08)',
                    border: '1px solid var(--accent-green)',
                    color: 'var(--accent-green)',
                  }}>TLS</span>
                )}
                <span style={{
                  fontSize: '0.55rem',
                  padding: '1px 5px',
                  borderRadius: '999px',
                  background: 'rgba(10,255,157,0.05)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-dim)',
                }}>
                  {isFile ? 'file' : 'docker'}
                </span>
              </div>
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>
              → {r.service}
            </div>
          </div>
        )
      })}
    </div>
  )
}
