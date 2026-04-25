import React from 'react'
import { motion } from 'framer-motion'
import { Store } from 'lucide-react'
import './SplashScreen.css'

export default function SplashScreen() {
  const [showBypass, setShowBypass] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => setShowBypass(true), 6000)
    return () => clearTimeout(timer)
  }, [])

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

        {showBypass && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="splash-bypass-btn"
            onClick={() => window.location.reload()}
          >
            Problème de connexion ? Réessayer
          </motion.button>
        )}
      </div>
      
      <div className="splash-footer">
        <p>© 2026 BoutiKonect - Le Marché de Référence du Bénin</p>
      </div>
    </div>
  )
}
