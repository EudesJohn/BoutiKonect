import { useState, useEffect, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../supabase/client'
import { AppContext } from '../../context/AppContextInstance'
import { motion } from 'framer-motion'
import { Lock, CircleCheck as CheckCircle, CircleAlert as AlertCircle, RefreshCw, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import './ResetPassword.css'

import authService from '../../services/authService'

export default function ResetPassword() {
  const navigate = useNavigate()
  const { user, seller, authLoading } = useContext(AppContext)
  
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const currentUser = user || seller

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        setError('Session invalide ou expirée. Veuillez faire une nouvelle demande.')
      }
      setLoading(false)
    }
  }, [authLoading, currentUser])

  const handleResetPassword = async (e) => {
    e.preventDefault()
    
    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setSubmitting(true)
    setError('')

    // TACTICAL DELAY: Attendre que toutes les opérations de session de fond 
    // (localStorage lock) soient stabilisées avant de lancer l'update.
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setSuccess(true)
    } catch (err) {
      console.error("Erreur reset password:", err)
      setError(authService.getErrorMessage(err.message))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="reset-password-page">
        <div className="reset-glow"></div>
        <div className="container">
          <div className="loading-state">
            <RefreshCw className="spin" size={48} />
            <p style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Vérification de la session en cours...</p>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="reset-password-page">
        <div className="reset-glow"></div>
        <div className="container">
          <motion.div 
            className="reset-card success"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          >
            <div className="status-icon success">
              <CheckCircle size={48} />
            </div>
            <h1 style={{ background: 'linear-gradient(to bottom, #fff, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '2.2rem', marginBottom: '15px' }}>Terminé !</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', lineHeight: '1.6' }}>Votre mot de passe a été modifié avec succès. Votre sécurité est notre priorité.</p>
            <Link to="/login" className="btn btn-primary btn-large" style={{ width: '100%', display: 'block' }}>
              Retour à la connexion
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="reset-password-page">
      <div className="reset-glow"></div>
      <div className="container">
        <motion.div 
          className="reset-card"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="reset-header">
            <div className="reset-icon">
              <Lock size={32} />
            </div>
            <h1>Sécurisez votre compte</h1>
            {currentUser?.email ? (
              <p>Définissez un nouveau mot de passe pour <strong>{currentUser.email}</strong></p>
            ) : (
              <p>Veuillez choisir un mot de passe robuste et unique.</p>
            )}
          </div>

          {error && (
            <motion.div 
              className="error-alert"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <AlertCircle size={20} />
              <span>{error}</span>
            </motion.div>
          )}

          {(error && (error.includes('expiré') || error.includes('invalide'))) ? (
            <div className="invalid-flow">
              <Link to="/forgot-password" className="btn btn-outline btn-large" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <ArrowLeft size={18} /> Recommencer la demande
              </Link>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="reset-form">
              <div className="form-group">
                <label className="form-label">Nouveau mot de passe</label>
                <div className="input-wrapper">
                  <input 
                    type={showPassword ? "text" : "password"}
                    className="form-input"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirmer le mot de passe</label>
                <input 
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-large" 
                disabled={submitting}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
              >
                {submitting ? (
                  <>
                    <RefreshCw size={20} className="spin" />
                    Mise à jour...
                  </>
                ) : (
                  'Mettre à jour le mot de passe'
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  )
}
