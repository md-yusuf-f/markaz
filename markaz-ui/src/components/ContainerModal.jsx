import { useState } from 'react'

export default function ContainerModal({ container, onClose, onRefetch }) {
  const [restarting, setRestarting] = useState(false)
  const [message, setMessage] = useState(null)

  if (!container) return null

  const isRunning = container.state === 'running'

  const handleRestart = async () => {
    if (!confirm(`Restart ${container.name}?`)) return
    setRestarting(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/docker/containers/${container.id}/restart`, {
        method: 'POST',
      })
      if (res.ok) {
        setMessage({ type: 'success', text: `${container.name} restarting...` })
        setTimeout(() => { onRefetch(); onClose() }, 2000)
      } else {
        setMessage({ type: 'error', text: `Failed: HTTP ${res.status}` })
      }
    } catch (e) {
      setMessage({ type: 'error', text: e.message })
    } finally {
      setRestarting(false)
    }
  }

  const formatDate = (unix) => new Date(unix * 1000).toLocaleString('en-GB')

  const formatPorts = (ports) => {
    if (!ports.length) return '—'
    return ports
      .filter(p => p.PublicPort)
      .map(p => `${p.PublicPort}→${p.PrivatePort}/${p.Type}`)
      .join(', ') || '—'
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          boxShadow: '0 0 30px rgba(10,255,157,0.1)',
          borderRadius: '4px',
          padding: '1.25rem',
          width: '480px',
          maxWidth: '90vw',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 600 }}>
              {container.name}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              {container.shortId}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              fontSize: '0.65rem',
              padding: '0.15rem 0.5rem',
              borderRadius: '999px',
              background: isRunning ? 'rgba(10,255,157,0.1)' : 'rgba(255,60,60,0.1)',
              border: `1px solid ${isRunning ? 'var(--accent-green)' : 'var(--accent-red)'}`,
              color: isRunning ? 'var(--accent-green)' : 'var(--accent-red)',
            }}>
              {container.state.toUpperCase()}
            </span>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none',
                color: 'var(--text-dim)', cursor: 'pointer',
                fontSize: '1rem', padding: '0',
              }}
            >✕</button>
          </div>
        </div>

        {/* Details */}
        {[
          ['Image', container.image],
          ['Status', container.status],
          ['Created', formatDate(container.created)],
          ['Ports', formatPorts(container.ports)],
          ['Networks', container.networks.join(', ') || '—'],
        ].map(([label, value]) => (
          <div key={label} style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0.35rem 0',
            borderBottom: '1px solid var(--border)',
            fontSize: '0.72rem',
            gap: '1rem',
          }}>
            <span style={{ color: 'var(--text-dim)', flexShrink: 0 }}>{label}</span>
            <span style={{ color: 'var(--text)', textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
          </div>
        ))}

        {/* Message */}
        {message && (
          <div style={{
            marginTop: '0.75rem',
            fontSize: '0.7rem',
            color: message.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)',
          }}>
            {message.text}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <button
            onClick={handleRestart}
            disabled={restarting}
            style={{
              padding: '0.4rem 1rem',
              background: 'transparent',
              border: '1px solid var(--accent)',
              color: 'var(--accent)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              cursor: restarting ? 'not-allowed' : 'pointer',
              borderRadius: '3px',
              opacity: restarting ? 0.5 : 1,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(10,255,157,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {restarting ? 'Restarting...' : '↺ Restart'}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '0.4rem 1rem',
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-dim)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              cursor: 'pointer',
              borderRadius: '3px',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
