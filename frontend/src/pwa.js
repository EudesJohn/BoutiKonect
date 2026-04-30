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
    if (!r) return;
    const interval = setInterval(async () => {
      try {
        if (!navigator.onLine) return;
        // Check if registration is still valid
        if (r.active || r.waiting || r.installing) {
          const resp = await fetch(swUrl, {
            cache: 'no-store',
            headers: { 'cache': 'no-store', 'cache-control': 'no-cache' },
          });
          if (resp?.status === 200) await r.update();
        } else {
          clearInterval(interval);
        }
      } catch (err) {
        // Ignorer silencieusement l'erreur DOMException qui se produit 
        // si l'enregistrement a été désinscrit ou mis à jour.
        if (err.name !== 'DOMException' && err.name !== 'InvalidStateError') {
          console.warn('SW Update check failed (non-critical):', err);
        }
      }
    }, 60000);
  }
})
