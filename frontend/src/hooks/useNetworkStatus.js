import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const POLL_MS = 10_000

const RTT_GREEN = 200
const RTT_YELLOW = 800

function getStatus(rtt) {
  if (rtt < RTT_GREEN)  return 'green'
  if (rtt < RTT_YELLOW) return 'yellow'
  return 'red'
}

export function useNetworkStatus() {
  const [status,  setStatus]  = useState(() => navigator.onLine ? 'green' : 'offline')
  const [latency, setLatency] = useState(null)

  useEffect(() => {
    let active = true

    async function measure() {
      if (!navigator.onLine) { setStatus('offline'); setLatency(null); return }
      const t0 = performance.now()
      try {
        await fetch('/ping.txt?t=' + Date.now(), { cache: 'no-store' })
        if (!active) return
        const rtt = Math.round(performance.now() - t0)
        setStatus(getStatus(rtt))
        setLatency(rtt)
      } catch {
        if (!active) return
        setStatus('red')
        setLatency(null)
      }
    }

    function onOnline() { toast.success('Terhubung ke Internet'); measure() }
    function onOffline() { toast.error('Internet Terputus'); setStatus('offline'); setLatency(null) }
    function onVisible() { if (document.visibilityState === 'visible') measure() }

    const init = setTimeout(measure, 1500)
    const interval = setInterval(measure, POLL_MS)

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      active = false
      clearTimeout(init)
      clearInterval(interval)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return { status, latency }
}
