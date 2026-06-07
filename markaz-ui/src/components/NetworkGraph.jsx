import React, { useState, useEffect, useRef } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const RX_QUERY = 'irate(node_network_receive_bytes_total{device!="lo"}[1m])'
const TX_QUERY = 'irate(node_network_transmit_bytes_total{device!="lo"}[1m])'

function sumResult(result) {
  if (!result || result.length === 0) return null
  return result.reduce((acc, r) => acc + parseFloat(r.value[1]), 0)
}

async function queryProm(expr) {
  try {
    const res = await fetch(`/api/prometheus/api/v1/query?query=${encodeURIComponent(expr)}`)
    const json = await res.json()
    if (json.status === 'success') return sumResult(json.data.result)
  } catch {}
  return null
}

function formatRate(bps) {
  if (bps == null) return '—'
  if (bps >= 1048576) return `${(bps / 1048576).toFixed(1)} MB/s`
  if (bps >= 1024) return `${(bps / 1024).toFixed(1)} KB/s`
  return `${Math.round(bps)} B/s`
}

const MAX_POINTS = 20

export default function NetworkGraph() {
  const [data, setData] = useState([])
  const [latest, setLatest] = useState({ rx: null, tx: null })

  useEffect(() => {
    async function fetch() {
      const [rx, tx] = await Promise.all([queryProm(RX_QUERY), queryProm(TX_QUERY)])
      setLatest({ rx, tx })
      setData(prev => {
        const next = [...prev, { t: Date.now(), rx: rx ?? 0, tx: tx ?? 0 }]
        return next.slice(-MAX_POINTS)
      })
    }
    fetch()
    const t = setInterval(fetch, 10000)
    return () => clearInterval(t)
  }, [])

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
        <div>
          <span style={{ color: 'var(--text-dim)', fontSize: 10 }}>↓ RX </span>
          <span style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 600 }}>{formatRate(latest.rx)}</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-dim)', fontSize: 10 }}>↑ TX </span>
          <span style={{ color: 'var(--accent-green)', fontSize: 12, fontWeight: 600 }}>{formatRate(latest.tx)}</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={80}>
        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="rxGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="t" hide />
          <YAxis yAxisId="rx" hide domain={[0, 'auto']} />
          <YAxis yAxisId="tx" hide domain={[0, 'auto']} orientation="right" />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
            }}
            formatter={(v, name) => [formatRate(v), name === 'rx' ? '↓ RX' : '↑ TX']}
            labelFormatter={() => ''}
          />
          <Area
            yAxisId="rx"
            type="monotone"
            dataKey="rx"
            stroke="#00d4ff"
            strokeWidth={1.5}
            fill="url(#rxGrad)"
            dot={false}
            isAnimationActive={false}
          />
          <Area
            yAxisId="tx"
            type="monotone"
            dataKey="tx"
            stroke="#00ff88"
            strokeWidth={1.5}
            fill="url(#txGrad)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

