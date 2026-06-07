import React, { useState, useEffect } from 'react'

const QUERIES = {
  cpu: '100 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)',
  ramPct: '(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100',
  ramUsedGB: '(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / 1073741824',
  ramTotalGB: 'node_memory_MemTotal_bytes / 1073741824',
  diskPct: '100 - ((node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100)',
  load1: 'node_load1',
  uptime: 'node_time_seconds - node_boot_time_seconds',
}

async function queryProm(expr) {
  try {
    const res = await fetch(`/api/prometheus/api/v1/query?query=${encodeURIComponent(expr)}`)
    const json = await res.json()
    if (json.status === 'success' && json.data.result.length > 0) {
      return parseFloat(json.data.result[0].value[1])
    }
  } catch {}
  return null
}

function CircleProgress({ value, max = 100, color = 'var(--accent)' }) {
  const pct = Math.min(100, Math.max(0, ((value ?? 0) / max) * 100))
  const r = 20
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  return (
    <div style={{ position: 'relative', width: 52, height: 52 }}>
      <svg width="52" height="52" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="26" cy="26" r={r} fill="none" stroke="var(--border)" strokeWidth="3" />
        <circle
          cx="26" cy="26" r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 3px ${color})`, transition: 'stroke-dasharray 0.5s ease' }}
        />
      </svg>
      <span style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.7rem',
        fontWeight: 700,
        color,
      }}>
        {value != null ? `${Math.round(pct)}%` : '—'}
      </span>
    </div>
  )
}

function BarStat({ value, label, color = 'var(--accent-yellow)', labelColor = 'var(--text-dim)' }) {
  const pct = Math.min(100, Math.max(0, value ?? 0))
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ color: labelColor, fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {label}
        </span>
        <span style={{ color, fontSize: '0.68rem', fontWeight: 700 }}>
          {value != null ? `${pct.toFixed(1)}%` : '—'}
        </span>
      </div>
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: 2,
          boxShadow: `0 0 6px ${color}`,
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  )
}

function formatUptime(seconds) {
  if (seconds == null) return '—'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export default function SystemStats() {
  const [stats, setStats] = useState({})
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  async function fetchStats() {
    const [cpu, ramPct, ramUsedGB, ramTotalGB, diskPct, load1, uptime] = await Promise.all([
      queryProm(QUERIES.cpu),
      queryProm(QUERIES.ramPct),
      queryProm(QUERIES.ramUsedGB),
      queryProm(QUERIES.ramTotalGB),
      queryProm(QUERIES.diskPct),
      queryProm(QUERIES.load1),
      queryProm(QUERIES.uptime),
    ])
    setStats({ cpu, ramPct, ramUsedGB, ramTotalGB, diskPct, load1, uptime })
  }

  useEffect(() => {
    fetchStats()
    const t = setInterval(fetchStats, 10000)
    return () => clearInterval(t)
  }, [])

  const ramUsed = stats.ramUsedGB ?? 0
  const ramTotal = stats.ramTotalGB ?? 0

  const diskPct = stats.diskPct ?? 0
  const diskColor = diskPct > 85
    ? 'var(--accent-red)'
    : diskPct > 70
    ? 'var(--accent-yellow)'
    : 'var(--accent-green)'

  return (
    <div>
      {/* Clock */}
      <div style={{
        textAlign: 'center',
        marginBottom: '0.75rem',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '0.5rem',
      }}>
        <div style={{ fontSize: '1.4rem', color: 'var(--accent)', letterSpacing: '0.1em' }}>
          {time.toLocaleTimeString('en-GB')}
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '2px' }}>
          {time.toLocaleDateString('en-GB', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* CPU and RAM side by side */}
      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '0.75rem' }}>
        <div style={{ textAlign: 'center' }}>
          <CircleProgress value={stats.cpu} color="var(--accent)" />
          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '4px' }}>CPU</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <CircleProgress value={stats.ramPct} color="var(--accent-green)" />
          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            {stats.ramUsedGB != null ? `${ramUsed.toFixed(1)} / ${ramTotal.toFixed(1)} GB` : 'RAM'}
          </div>
        </div>
      </div>

      <BarStat value={diskPct} label="Disk /" color={diskColor} labelColor={diskPct > 85 ? diskColor : 'var(--text-dim)'} />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
        <div>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
            Load 1m
          </div>
          <div style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 700 }}>
            {stats.load1 != null ? stats.load1.toFixed(2) : '—'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
            Uptime
          </div>
          <div style={{ color: 'var(--accent-green)', fontSize: '0.8rem', fontWeight: 700 }}>
            {formatUptime(stats.uptime)}
          </div>
        </div>
      </div>
    </div>
  )
}
