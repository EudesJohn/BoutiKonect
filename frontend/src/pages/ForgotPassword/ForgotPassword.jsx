
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle, Lock, RefreshCw, KeyRound } from 'lucide-react'
import { sendPasswordResetLink } from '../../services/emailService'
import './ForgotPassword.css'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const validateEmail = () => {
    const newErrors = {}
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateNewPassword = () => {
    const newErrors = {}
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'Le nouveau mot de passe est requis'
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Min 6 caractères'
    }
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Envoyer le lien de réinitialisation par email
  const handleSendResetLink = async (e) => {
    e.preventDefault()
    
    if (!validateEmail()) return
    
    setLoading(true)
    setErrors({})
    setMessage('')
    
    try {
      const result = await sendPasswordResetLink(formData.email)
      
      if (result.success) {
        setMessage('✅ Lien de réinitialisation envoyé à votre email!')
        setStep(2)
      } else {
        setErrors({ email: result.error })
      }
    } catch (error) {
      setErrors({ email: 'Une erreur est survenue' })
    } finally {
      setLoading(false)
    }
  }

  // Alternative: Contact admin via WhatsApp
  const handleWhatsAppContact = () => {
    const adminPhone = '2290140571373'
    const messageText = `Bonjour, je n'arrive pas à réinitialiser mon mot de passe sur BoutiKonect.bj. Aidez-moi svp.`
    window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(messageText)}`, '_blank')
  }

  if (success) {
    return (
      <div className="forgot-page">
        <div className="forgot-bg">
          <div className="forgot-glow"></div>
        </div>
        <div className="container">
          <motion.div 
            className="forgot-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center' }}
          >
            <div className="success-icon" style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <CheckCircle size={40} color="white" />
            </div>
            
            <h2 style={{ marginBottom: '15px' }}>Email envoyé!</h2>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              Consultez votre boîte email et cliquez sur le lien de réinitialisation.
            </p>
            <Link to="/login" className="btn btn-primary">
              Retour à la connexion
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="forgot-page">
      <div className="forgot-bg">
        <div className="forgot-glow"></div>
      </div>
      <div className="container">
        <motion.div 
          className="forgot-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="forgot-header">
            <div className="forgot-icon">
              <KeyRound size={28} />
            </div>
            <h1>Mot de passe oublié?</h1>
            <p>
              {step === 1 
                ? 'Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.'
                : 'Vérifiez votre email et cliquez sur le lien de réinitialisation.'}
            </p>
          </div>

          {message && (
            <motion.div 
              className="info-alert"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ 
                background: '#E3F2FD', 
                border: '1px solid #2196F3',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px',
                color: '#1565C0',
                fontSize: '14px'
              }}
            >
              {message}
            </motion.div>
          )}

          {errors.email && (
            <motion.div 
              className="error-alert"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {errors.email}
            </motion.div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendResetLink} className="forgot-form">
              <div className="form-group">
                <label className="form-label">
                  <Mail size={18} />
                  Email de votre compte
                </label>
                <input 
                  type="email" 
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-large" 
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Mail size={18} />
                    Envoyer le lien
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="reset-sent-info">
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <Mail size={48} style={{ color: '#4CAF50' }} />
              </div>
              <p style={{ textAlign: 'center', marginBottom: '20px' }}>
                Nous avons envoyé un lien de réinitialisation à:<br/>
                <strong>{formData.email}</strong>
              </p>
              <p style={{ fontSize: '14px', color: '#666', textAlign: 'center', marginBottom: '20px' }}>
                Cliquez sur le lien dans l'email pour créer un nouveau mot de passe.
              </p>
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => setStep(1)}
                style={{ width: '100%' }}
              >
                <ArrowLeft size={18} />
                Utiliser un autre email
              </button>
            </div>
          )}

          <div className="forgot-alternative">
            <p>Vous n'avez pas reçu l'email?</p>
            <button 
              type="button" 
              className="btn btn-whatsapp"
              onClick={handleWhatsAppContact}
            >
              Contacter le support WhatsApp
            </button>
          </div>

          <div className="forgot-footer">
            <Link to="/login" className="back-link">
              <ArrowLeft size={18} />
              Retour à la connexion
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

