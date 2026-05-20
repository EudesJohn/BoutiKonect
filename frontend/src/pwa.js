import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    // Si besoin, forcer la mise à jour (évite l'erreur de référence TDZ)
    if (typeof updateSW === 'function') {
      updateSW(true)
    } else {
      window.location.reload()
    }
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

// Détection de la mise à jour du Service Worker pour recharger automatiquement la page
if ('serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    console.log("🔄 Nouvelle version détectée, rechargement automatique de la page...");
    window.location.reload();
  });
}

