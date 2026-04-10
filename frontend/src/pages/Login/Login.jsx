import { useState, useContext, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppContext } from '../../context/AppContext'
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import './Login.css'

export default function Login() {
  const { loginUser, rememberMe, setRememberMe } = useContext(AppContext)
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(false)

  // Gérer le paramètre de succès de vérification d'email
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('emailVerified') === 'true') {
      setShowVerificationSuccess(true)
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const validateForm = () => {
    const newErrors = {}
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis'
    } else if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      newErrors.email = 'Email invalide'
    }
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (validateForm()) {
      setLoading(true)
      setErrors({})
      
      try {
        const result = await loginUser(formData.email, formData.password, rememberMe)
        
        if (result.success) {
          setSuccess(true)
          setTimeout(() => navigate('/'), 1000)
        } else {
          setErrors({ general: result.error })
        }
      } catch (error) {
        setErrors({ general: 'Une erreur est survenue. Veuillez réessayer.' })
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-glow"></div>
      </div>
      <div className="container">
        <motion.div 
          className="login-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="login-header">
            <div className="login-icon">
              <Mail size={28} />
            </div>
            <h1>Connexion</h1>
            <p>Connectez-vous à votre compte BoutiKonect.bj</p>
          </div>

          {showVerificationSuccess && (
            <motion.div 
              className="success-alert"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ marginBottom: '20px' }}
            >
              <CheckCircle size={20} />
              Votre adresse e-mail a été vérifiée avec succès ! Vous pouvez maintenant vous connecter.
            </motion.div>
          )}

          {success && (
            <motion.div 
              className="success-alert"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <CheckCircle size={20} />
              Connexion réussie! Redirection...
            </motion.div>
          )}

          {errors.general && (
            <motion.div 
              className="error-alert"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle size={20} />
              {errors.general}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">
                <Mail size={18} />
                Email
              </label>
              <input 
                type="email" 
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="exemple@email.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">
                <Lock size={18} />
                Mot de passe
              </label>
              <div className="password-input-wrapper">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <button 
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Se souvenir de moi</span>
              </label>
              <Link to="/forgot-password" className="forgot-password">
                Mot de passe oublié?
              </Link>
            </div>

            <button type="submit" className="btn btn-primary btn-large" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>

          <div className="login-footer">
            <p>Pas encore de compte? <Link to="/register">Créer un compte</Link></p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
