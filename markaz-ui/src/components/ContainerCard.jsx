export default function ContainerCard({ container, onClick }) {
  const isRunning = container.state === 'running'
  const isHealthy = container.status.includes('healthy')
  const dotColor = isRunning
    ? isHealthy ? 'var(--accent-green)' : 'var(--accent)'
    : 'var(--accent-red)'

  return (
    <div
      onClick={() => onClick(container)}
      style={{
        padding: '0.3rem 0.4rem',
        border: '1px solid var(--border)',
        borderRadius: '3px',
        background: 'var(--bg)',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--accent)'
        e.currentTarget.style.background = 'rgba(10,255,157,0.03)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.background = 'var(--bg)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '2px' }}>
        <div style={{
          width: '5px', height: '5px', borderRadius: '50%',
          background: dotColor,
          boxShadow: isRunning ? `0 0 5px ${dotColor}` : 'none',
          flexShrink: 0,
        }} />
        <span style={{
          fontSize: '0.68rem',
          color: 'var(--text)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {container.name}
        </span>
      </div>
      <div style={{ fontSize: '0.58rem', color: 'var(--text-dim)', paddingLeft: '0.9rem' }}>
        {container.image.split('/').pop().substring(0, 22)}
      </div>
      <div style={{ fontSize: '0.56rem', color: 'var(--text-dim)', paddingLeft: '0.9rem', marginTop: '1px' }}>
        {container.status.substring(0, 24)}
      </div>
    </div>
  )
}
