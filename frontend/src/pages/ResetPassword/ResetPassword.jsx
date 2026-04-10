import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../supabase/client'
import { motion } from 'framer-motion'
import { Lock, CheckCircle, AlertCircle, RefreshCw, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import './ResetPassword.css'

export default function ResetPassword() {
  const navigate = useNavigate()
  
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Supabase gère la session automatiquement après le clic sur le lien de récupération.
    // On vérifie juste si on a une session ou si on vient d'un flux de récupération.
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Session invalide ou expirée. Veuillez faire une nouvelle demande.')
      } else {
        setEmail(session.user.email)
      }
      setLoading(false)
    }
    checkSession()
  }, [])

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

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setSuccess(true)
    } catch (err) {
      console.error("Erreur reset password:", err)
      setError(err.message || 'Une erreur est survenue lors du changement de mot de passe.')
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
            {email && <p>Réinitialisation pour : <strong>{email}</strong></p>}
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
