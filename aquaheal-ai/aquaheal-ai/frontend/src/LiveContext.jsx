import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, wsUrl } from './api'
import { ErrorState, Skeleton, useToast } from './components/UI.jsx'

const Ctx = createContext(null)
export const useLive = () => useContext(Ctx)

/** Streams snapshots over WebSocket; falls back to polling if the socket is unavailable. */
export function LiveProvider({ children }) {
  const [snap, setSnap] = useState(null)
  const [status, setStatus] = useState('connecting')
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    try {
      setSnap(await api('/api/snapshot'))
      setError(null)
      setStatus((s) => (s === 'live' ? s : 'polling'))
    } catch (e) {
      setError(e.message)
      setStatus('offline')
    }
  }, [])

  useEffect(() => {
    let ws, poll, retry, stopped = false
    const startPoll = () => {
      if (poll) return
      refresh()
      poll = setInterval(refresh, 2000)
    }
    const connect = () => {
      try { ws = new WebSocket(wsUrl()) } catch { startPoll(); return }
      ws.onopen = () => { clearInterval(poll); poll = null; setStatus('live'); setError(null) }
      ws.onmessage = (e) => setSnap(JSON.parse(e.data))
      ws.onclose = () => { if (stopped) return; startPoll(); retry = setTimeout(connect, 5000) }
    }
    connect()
    return () => { stopped = true; clearInterval(poll); clearTimeout(retry); ws && ws.close() }
  }, [refresh])

  return <Ctx.Provider value={{ snap, status, error, refresh }}>{children}</Ctx.Provider>
}

/** Renders children(snap) once data is available; handles loading and error states. */
export function Ready({ children }) {
  const { snap, error, refresh } = useLive()
  if (snap) return children(snap)
  if (error) return <ErrorState message={error} onRetry={refresh} />
  return <Skeleton rows={4} />
}

/** Runs an API call with toast feedback and a snapshot refresh. Returns the result or undefined. */
export function useAction() {
  const toast = useToast()
  const { refresh } = useLive()
  return useCallback(async (fn, okMsg) => {
    try {
      const r = await fn()
      if (okMsg) toast(okMsg)
      refresh()
      return r ?? true
    } catch (e) {
      toast(e.message, 'error')
    }
  }, [toast, refresh])
}
