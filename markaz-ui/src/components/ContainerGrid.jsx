import { useState } from 'react'
import { useContainers } from '../hooks/useContainers'
import ContainerCard from './ContainerCard'
import ContainerModal from './ContainerModal'

export default function ContainerGrid() {
  const { containers, error, refetch } = useContainers(15000)
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState(null)

  const running = containers.filter(c => c.state === 'running').length
  const visible = containers.filter(c =>
    c.name.toLowerCase().includes(filter.toLowerCase())
  )

  if (error) return (
    <div style={{ color: 'var(--accent-red)', fontSize: '0.75rem', padding: '0.5rem' }}>
      Failed to reach Docker socket: {error}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginBottom: '0.4rem' }}>
        {filter
          ? <>{visible.length} of {containers.length} · <span style={{ color: 'var(--accent-green)' }}>{running} running</span></>
          : <>{containers.length} total · <span style={{ color: 'var(--accent-green)' }}>{running} running</span></>
        }
      </div>

      {/* Filter */}
      <div style={{ marginBottom: '0.4rem' }}>
        <input
          type="text"
          placeholder="filter containers..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid var(--border)',
            color: 'var(--accent)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            padding: '0.2rem 0.3rem',
            outline: 'none',
            caretColor: 'var(--accent)',
          }}
        />
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '3px',
        overflowY: 'auto',
        flex: 1,
      }}>
        {visible.map(c => (
          <ContainerCard
            key={c.id}
            container={c}
            onClick={setSelected}
          />
        ))}
      </div>

      {/* Modal */}
      <ContainerModal
        container={selected}
        onClose={() => setSelected(null)}
        onRefetch={refetch}
      />
    </div>
  )
}
