import React, { useState, useEffect } from 'react'
import SystemStats from './components/SystemStats.jsx'
import ContainerGrid from './components/ContainerGrid.jsx'
import ServiceTiles from './components/ServiceTiles.jsx'
import AlertBar from './components/AlertBar.jsx'
import NetworkGraph from './components/NetworkGraph.jsx'
import ProcessList from './components/ProcessList.jsx'
import FilesystemMounts from './components/FilesystemMounts.jsx'
import NodeBar from './components/NodeBar'
import TraefikRoutes from './components/TraefikRoutes'
import InfraStatus from './components/InfraStatus'

function Clock() {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString('en-US', { hour12: false }))
  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString('en-US', { hour12: false })), 1000)
    return () => clearInterval(t)
  }, [])
  return <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem', letterSpacing: '0.1em' }}>{time}</span>
}

export default function App() {
  const [rightTab, setRightTab] = useState('network')

  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: '32px 48px 1fr',
      gridTemplateColumns: '280px 1fr 280px',
      height: '100vh',
      width: '100vw',
      gap: '4px',
      padding: '4px',
      background: 'var(--bg)',
      overflow: 'hidden',
    }}>
      {/* ── Top bar ── */}
      <header style={{
        gridColumn: '1 / -1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 10px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-panel)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            color: 'var(--accent)',
            fontWeight: 700,
            fontSize: '0.85rem',
            letterSpacing: '0.2em',
            textShadow: '0 0 16px var(--accent)',
          }}>
            MARKAZ
          </span>
          <span style={{ color: 'var(--text-dim)', fontSize: '0.65rem', letterSpacing: '0.08em' }}>
            OPS DASHBOARD
          </span>
        </div>
        <Clock />
      </header>

      {/* ── Node Bar ── */}
      <div style={{
        gridColumn: '1 / -1',
        display: 'flex',
        alignItems: 'stretch',
        gap: '4px',
        padding: '0 4px',
        overflow: 'hidden',
        height: '100%',
      }}>
        <NodeBar />
      </div>

      {/* ── Left panel ── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        height: '100%',
        overflowY: 'auto',
        paddingRight: '2px',
      }}>
        <div className="panel" style={{ flexShrink: 0 }}>
          <div className="panel-title">System</div>
          <SystemStats />
        </div>

        <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="panel-title">Processes</div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <ProcessList />
          </div>
        </div>
      </div>

      {/* ── Center panel ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', height: '100%', overflow: 'hidden' }}>

        <div className="panel" style={{ flex: '0 0 50%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="panel-title">Containers</div>
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <ContainerGrid />
          </div>
        </div>

        <div className="panel" style={{ flex: '0 0 28%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="panel-title">Services</div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <ServiceTiles />
          </div>
        </div>

        <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="panel-title">Filesystem</div>
          <FilesystemMounts />
        </div>

      </div>

      {/* ── Right panel ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden', height: '100%' }}>
        <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Tab header */}
          <div style={{ display: 'flex', gap: '0', marginBottom: '0.6rem', borderBottom: '1px solid var(--border)' }}>
            {['network', 'routes'].map(tab => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: rightTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                  color: rightTab === tab ? 'var(--accent)' : 'var(--text-dim)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '0 0.75rem 0.4rem',
                  cursor: 'pointer',
                  marginBottom: '-1px',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {rightTab === 'network' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflow: 'hidden' }}>
              <div style={{ flexShrink: 0 }}>
                <NetworkGraph />
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', flex: 1, overflowY: 'auto' }}>
                <div style={{
                  fontSize: '0.6rem',
                  color: 'var(--accent)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '0.4rem',
                }}>
                  Infra Status
                </div>
                <InfraStatus />
              </div>
            </div>
          )}
          {rightTab === 'routes' && <TraefikRoutes />}

        </div>
      </div>
    </div>
  )
}
