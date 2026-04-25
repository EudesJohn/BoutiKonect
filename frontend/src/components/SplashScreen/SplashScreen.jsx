import React from 'react'
import { motion } from 'framer-motion'
import { Store } from 'lucide-react'
import './SplashScreen.css'

export default function SplashScreen({ dataLoading = {}, errors = {} }) {
  const [showBypass, setShowBypass] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => setShowBypass(true), 6000)
    return () => clearTimeout(timer)
  }, [])

  const handleReset = async () => {
    try {
      // Nettoyer le cache applicatif
      cacheService.clearAll();
      
      // Désenregistrer tous les Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.unregister();
        }
      }
      
      // Recharger la page
      window.location.reload(true);
    } catch (e) {
      window.location.reload();
    }
  }

  return (
    <div className="splash-screen">
      <div className="splash-content">
        <motion.div 
          className="splash-logo"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="logo-icon-wrapper">
            <Store size={64} className="logo-icon" />
          </div>
          <h1>BoutiKonect<span>.bj</span></h1>
        </motion.div>
        
        <div className="splash-loading-container">
          <motion.div 
            className="splash-loader-bar"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 3, ease: "easeInOut" }}
          />
        </div>
        
        <motion.p 
          className="splash-status"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Connexion sécurisée en cours...
        </motion.p>

        {dataLoading.products && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: 'rgba(255, 23, 68, 0.1)',
            border: '1px solid rgba(255, 23, 68, 0.2)',
            borderRadius: '12px',
            fontSize: '0.8rem',
            color: '#ff80ab',
            maxWidth: '300px'
          }}>
            <p style={{ margin: '0 0 10px 0' }}>🔍 Diagnostic de connexion :</p>
            <p style={{ margin: '0', opacity: 0.8 }}>
              {errors.products ? `Erreur: ${errors.products}` : "Tentative de connexion en cours..."}
            </p>
            {errors.products?.includes('fetch') && (
              <p style={{ marginTop: '10px', fontSize: '0.75rem', color: '#fff' }}>
                Note: Une erreur 'fetch' indique souvent un blocage réseau par votre opérateur ou un problème de DNS.
              </p>
            )}
          </div>
        )}

        {showBypass && (
          <motion.div 
            className="splash-actions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              className="splash-bypass-btn"
              onClick={() => window.location.reload()}
            >
              Réessayer
            </button>
            <button
              className="splash-reset-btn"
              onClick={handleReset}
              title="Supprime les fichiers temporaires et redémarre"
            >
              Réinitialiser tout
            </button>
          </motion.div>
        )}
      </div>
      
      <div className="splash-footer">
        <p>© 2026 BoutiKonect - Le Marché de Référence du Bénin</p>
      </div>
    </div>
  )
}
