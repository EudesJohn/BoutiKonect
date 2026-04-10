import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    // Auto-apply the update immediately instead of asking
    updateSW(true)
  },
  onOfflineReady() {
    console.log("L'application est prête à être utilisée hors-ligne.")
  },
  // Check for updates every 60 seconds
  onRegisteredSW(swUrl, r) {
    r && setInterval(async () => {
      if (!(!r.installing && navigator)) return
      if (('connection' in navigator) && !navigator.onLine) return
      const resp = await fetch(swUrl, {
        cache: 'no-store',
        headers: { 'cache': 'no-store', 'cache-control': 'no-cache' },
      })
      if (resp?.status === 200) await r.update()
    }, 60000)
  }
})
