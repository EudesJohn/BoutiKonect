import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Store } from 'lucide-react'
import { cacheService } from '../../services/cacheService'
import './SplashScreen.css'

export default function SplashScreen({ dataLoading = {}, errors = {} }) {
  const [showBypass, setShowBypass] = useState(false)
  const [phaseStart, setPhaseStart] = useState(Date.now())

  // Cacher le loader HTML dès que le SplashScreen React est monté
  useEffect(() => {
    window.hideAppLoader?.()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setShowBypass(true), 12000)
    return () => clearTimeout(timer)
  }, [])

  // Réinitialiser le chrono à chaque changement de phase
  useEffect(() => {
    setPhaseStart(Date.now())
  }, [dataLoading.products])

  const handleReset = async () => {
    try {
      cacheService.clearAll();
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.unregister();
        }
      }
      window.location.reload(true);
    } catch (e) {
      window.location.reload();
    }
  }

  // === ÉTAPES DE CHARGEMENT RÉELLES ===
  const steps = useMemo(() => [
    { key: 'auth',    label: 'Connexion au serveur...',          done: !dataLoading.products },
    { key: 'data',    label: 'Récupération des données...',      done: !dataLoading.products },
    { key: 'final',   label: 'Finalisation...',                  done: true },
  ], [dataLoading.products])

  const currentStep = steps.findIndex(s => !s.done)
  const progress = currentStep > 0
    ? ((currentStep) / steps.length) * 100
    : Math.min(95, (Date.now() - phaseStart) / 10000 * 30 + 5)

  const statusText = currentStep >= 0 && currentStep < steps.length
    ? steps[currentStep].label
    : 'Chargement terminé'

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

        {/* Barre de progression RÉELLE */}
        <div className="splash-loading-container">
          <motion.div
            className="splash-loader-bar"
            animate={{ width: `${Math.min(100, progress)}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>

        {/* Texte de statut dynamique */}
        <motion.p
          className="splash-status"
          key={statusText}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {statusText}
        </motion.p>

        {/* Étapes détaillées */}
        <div className="splash-steps">
          {steps.map((step, i) => {
            const isActive = i === currentStep
            const isDone = step.done || i < currentStep
            return (
              <div
                key={step.key}
                className={`splash-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}
              >
                <span className="splash-step-icon">
                  {isDone ? '✓' : isActive ? '○' : '○'}
                </span>
                <span className="splash-step-label">{step.label}</span>
              </div>
            )
          })}
        </div>

        {/* Erreur */}
        {errors.products && (
          <div className="splash-error">
            <p>⚠️ {errors.products}</p>
          </div>
        )}

        {/* Boutons de contournement après délai */}
        {showBypass && (
          <motion.div
            className="splash-actions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button className="splash-bypass-btn" onClick={() => window.location.reload()}>
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
