import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, X, Smartphone, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react'
import { getAuth } from 'firebase/auth'
import './MFAModal.css'

export default function MFAModal({ isOpen, onClose, onVerify, resolver, hints, mfaType = 'native', uid, email }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // On suppose ici qu'on utilise le premier facteur disponible (Phone) pour le mode natif
  const selectedHint = hints && hints.length > 0 ? hints[0] : null

  const handleVerify = async (e) => {
    e.preventDefault()
    if (code.length < 6) {
      setError('Le code doit comporter 6 chiffres')
      return
    }

    setLoading(true)
    setError('')
    try {
      if (mfaType === 'email') {
        const { verifyEmailLoginMFA } = await import('../../services/authService')
        const result = await verifyEmailLoginMFA(uid, code)
        if (result.success) {
          onVerify(result.user)
        } else {
          setError(result.error)
        }
      } else {
        // Mode natif (Phone)
        await onVerify(null, code) // Le verificationId sera géré par l'appelant ou via state interne
      }
    } catch (err) {
      console.error("MFA Verification Error:", err)
      setError('Code invalide ou expiré. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="mfa-modal-overlay">
      <motion.div 
        className="mfa-modal-content"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <button className="mfa-modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="mfa-modal-header">
          <div className="mfa-icon-wrapper">
            <ShieldCheck size={32} />
          </div>
          <h2>Double Authentification</h2>
          <p>
            {mfaType === 'email' 
              ? `Un code de vérification a été envoyé à votre e-mail : ${email}`
              : `Un code de vérification a été envoyé à votre téléphone se terminant par ${selectedHint?.phoneNumber?.slice(-4) || '...'}`
            }
          </p>
        </div>

        {error && (
          <div className="mfa-error-alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="mfa-form">
          <div className="mfa-input-group">
            <label>Code de vérification (6 chiffres)</label>
            <div className="mfa-input-wrapper">
              <input 
                type="text" 
                maxLength="6"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                autoFocus
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-large mfa-submit" disabled={loading || code.length < 6}>
            {loading ? <RefreshCw size={20} className="spinner" /> : 'Vérifier le code'}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <div className="mfa-modal-footer">
          <p>Vous n'avez pas reçu de code ?</p>
          <button 
            className="btn-link" 
            onClick={() => window.location.reload()} // Simple refresh pour ré-init le login et renvoyer le code
          >
            Renvoyer le code (recommencer)
          </button>
        </div>
      </motion.div>
    </div>
  )
}
