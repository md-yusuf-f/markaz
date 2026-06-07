import React, { useState, useEffect } from 'react'
import {
  Shield, ShieldOff, BarChart2, Activity, Layers, Zap, Lock,
  Heart, GitBranch, Code2, DollarSign, Monitor
} from 'lucide-react'

// Edit these to match your own services and domain
const SERVICES = [
  { name: 'Traefik',      url: 'https://traefik.yourdomain.com',    icon: Shield,      kumaName: 'Traefik Dashboard' },
  { name: 'Grafana',      url: 'https://grafana.yourdomain.com',    icon: BarChart2,   kumaName: 'Grafana' },
  { name: 'Prometheus',   url: 'https://prometheus.yourdomain.com', icon: Activity,    kumaName: 'Prometheus' },
  { name: 'Portainer',    url: 'https://portainer.yourdomain.com',  icon: Layers,      kumaName: 'Portainer' },
  { name: 'n8n',          url: 'https://n8n.yourdomain.com',        icon: Zap,         kumaName: 'n8n' },
  { name: 'Vaultwarden',  url: 'https://vault.yourdomain.com',      icon: Lock,        kumaName: 'Vaultwarden' },
  { name: 'AdGuard',      url: 'https://dns.yourdomain.com',        icon: ShieldOff,   kumaName: 'AdGuard' },
  { name: 'Uptime Kuma',  url: 'https://status.yourdomain.com',     icon: Heart,       kumaName: 'Uptime Kuma' },
  { name: 'Gitea',        url: 'https://gitea.yourdomain.com',      icon: GitBranch,   kumaName: 'Gitea' },
  { name: 'Code-Server',  url: 'https://code.yourdomain.com',       icon: Code2,       kumaName: 'Code-Server' },
  { name: 'Budget',       url: 'https://budget.yourdomain.com',     icon: DollarSign,  kumaName: 'Budget' },
  { name: 'Glances',      url: 'https://glances.yourdomain.com',    icon: Monitor,     kumaName: 'Glances' },
]

// Uptime Kuma status page slug — must match your status page URL slug
const KUMA_SLUG = 'my-homelab'

export default function ServiceTiles() {
  const [statusMap, setStatusMap] = useState({})

  const fetchStatus = async () => {
    try {
      const [pageRes, beatRes] = await Promise.all([
        fetch(`/api/kuma/api/status-page/${KUMA_SLUG}`),
        fetch(`/api/kuma/api/status-page/heartbeat/${KUMA_SLUG}`),
      ])
      const page = await pageRes.json()
      const beat = await beatRes.json()

      const nameMap = {}
      ;(page.publicGroupList || []).forEach(group => {
        ;(group.monitorList || []).forEach(m => {
          nameMap[m.id] = m.name
        })
      })

      const nameToStatus = {}
      Object.entries(beat.heartbeatList || {}).forEach(([id, beats]) => {
        const latest = beats[beats.length - 1]
        const name = nameMap[id]
        if (name) nameToStatus[name] = latest?.status === 1 ? 'up' : 'down'
      })

      setStatusMap(nameToStatus)
    } catch {}
  }

  useEffect(() => {
    fetchStatus()
    const t = setInterval(fetchStatus, 30000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '3px',
    }}>
      {SERVICES.map(svc => {
        const status = svc.kumaName ? statusMap[svc.kumaName] : null
        const dotColor = status === 'up'
          ? 'var(--accent-green)'
          : status === 'down'
          ? 'var(--accent-red)'
          : 'var(--text-dim)'

        return (
          <a
            key={svc.name}
            href={svc.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              padding: '0.4rem 0.2rem',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              background: 'var(--bg)',
              color: 'var(--text-dim)',
              textDecoration: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent)'
              e.currentTarget.style.color = 'var(--accent)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.color = 'var(--text-dim)'
            }}
          >
            {svc.kumaName && (
              <div style={{
                position: 'absolute',
                top: '4px', right: '4px',
                width: '5px', height: '5px',
                borderRadius: '50%',
                background: dotColor,
                boxShadow: status ? `0 0 5px ${dotColor}` : 'none',
              }} />
            )}
            <svc.icon size={14} />
            <span style={{
              fontSize: '0.58rem',
              textAlign: 'center',
              lineHeight: 1.2,
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {svc.name}
            </span>
          </a>
        )
      })}
    </div>
  )
}
