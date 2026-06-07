import React, { useState, useEffect } from 'react'
import { X, AlertTriangle } from 'lucide-react'

export default function AlertBar() {
  const [alerts, setAlerts] = useState([])
  const [dismissed, setDismissed] = useState(new Set())

  async function fetchAlerts() {
    try {
      const res = await fetch('/api/alerts/api/v2/alerts')
      if (!res.ok) return
      const data = await res.json()
      setAlerts(Array.isArray(data) ? data : [])
    } catch {}
  }

  useEffect(() => {
    fetchAlerts()
    const t = setInterval(fetchAlerts, 30000)
    return () => clearInterval(t)
  }, [])

  const visible = alerts.filter(a => {
    const key = a.fingerprint || JSON.stringify(a.labels)
    return !dismissed.has(key)
  })

  if (visible.length === 0) return null

  function dismiss(a) {
    const key = a.fingerprint || JSON.stringify(a.labels)
    setDismissed(prev => new Set([...prev, key]))
  }

  return (
    <div style={{
      background: 'rgba(255, 68, 102, 0.12)',
      borderBottom: '1px solid var(--accent-red)',
      padding: '6px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      {visible.map(a => {
        const name = a.labels?.alertname || 'Alert'
        const severity = a.labels?.severity || ''
        const summary = a.annotations?.summary || ''
        const key = a.fingerprint || JSON.stringify(a.labels)

        return (
          <div key={key} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <AlertTriangle size={13} color="var(--accent-red)" />
            <span style={{ color: 'var(--accent-red)', fontWeight: 600, fontSize: 11 }}>
              {name}
            </span>
            {severity && (
              <span style={{
                background: 'rgba(255,68,102,0.2)',
                border: '1px solid var(--accent-red)',
                color: 'var(--accent-red)',
                fontSize: 9,
                padding: '1px 5px',
                borderRadius: 3,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>
                {severity}
              </span>
            )}
            {summary && (
              <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>{summary}</span>
            )}
            <button
              onClick={() => dismiss(a)}
              style={{
                marginLeft: 'auto',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dim)',
                padding: 2,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={12} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
