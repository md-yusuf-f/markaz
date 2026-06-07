import { useState, useEffect } from 'react'

export function useContainers(intervalMs = 15000) {
  const [containers, setContainers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetch = async () => {
    try {
      const res = await window.fetch('/api/docker/containers/json?all=true')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const parsed = data.map(c => ({
        id: c.Id,
        shortId: c.Id.substring(0, 12),
        name: c.Names[0].replace('/', ''),
        image: c.Image,
        state: c.State,
        status: c.Status,
        created: c.Created,
        ports: c.Ports || [],
        networks: Object.keys(c.NetworkSettings?.Networks || {}),
      }))
      parsed.sort((a, b) => {
        if (a.state === 'running' && b.state !== 'running') return -1
        if (a.state !== 'running' && b.state === 'running') return 1
        return a.name.localeCompare(b.name)
      })
      setContainers(parsed)
      setLastUpdated(new Date())
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch()
    const t = setInterval(fetch, intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])

  return { containers, loading, error, lastUpdated, refetch: fetch }
}
