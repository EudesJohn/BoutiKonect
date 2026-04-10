import { useState, useEffect, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../supabase/client'
import { AppContext } from '../../context/AppContext'
import { motion } from 'framer-motion'
import { Lock, CheckCircle, AlertCircle, RefreshCw, Eye, EyeOff, ArrowLeft } from 'lucide-react'
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
        <div className="container">
          <div className="loading-state">
            <RefreshCw className="spin" size={40} />
            <p>Vérification du lien...</p>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="reset-password-page">
        <div className="container">
          <motion.div 
            className="reset-card success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="status-icon success">
              <CheckCircle size={40} />
            </div>
            <h1>Succès !</h1>
            <p>Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter.</p>
            <Link to="/login" className="btn btn-primary btn-large">
              Se connecter
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="reset-password-page">
      <div className="reset-bg">
        <div className="reset-glow"></div>
      </div>
      <div className="container">
        <motion.div 
          className="reset-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="reset-header">
            <div className="reset-icon">
              <Lock size={28} />
            </div>
            <h1>Nouveau mot de passe</h1>
            {currentUser?.email && <p>Réinitialisation pour : <strong>{currentUser.email}</strong></p>}
          </div>

          {error && (
            <motion.div 
              className="error-alert"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle size={20} />
              <span>{error}</span>
            </motion.div>
          )}

          {(error && error.includes('invalide')) ? (
            <div className="invalid-flow">
              <Link to="/forgot-password" className="btn btn-outline">
                <ArrowLeft size={18} /> Faire une nouvelle demande
              </Link>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="reset-form">
              <div className="form-group">
                <label className="form-label">
                  Nouveau mot de passe
                </label>
                <div className="input-wrapper">
                  <input 
                    type={showPassword ? "text" : "password"}
                    className="form-input"
                    placeholder="Min 6 caractères"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Confirmer le mot de passe
                </label>
                <input 
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="Confirmez votre mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-large" 
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <RefreshCw size={18} className="spin" />
                    Modification...
                  </>
                ) : (
                  'Changer le mot de passe'
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  )
}
