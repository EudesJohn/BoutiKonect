import { useState, useContext, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppContext } from '../../context/AppContext'
import { cities } from '../../context/constants'
import { MapPin, User, Phone, Lock, Store, ArrowRight, CheckCircle, Mail, ArrowLeft, Info } from 'lucide-react'
import './Register.css'

export default function Register() {
  const { registerUser } = useContext(AppContext)
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    city: '',
    neighborhood: '',
    customNeighborhood: '',
    whatsapp: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const selectedCity = cities.find(c => c.name === formData.city)

  const validateStep1 = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis'
    if (!formData.email.trim()) newErrors.email = 'L\'email est requis'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email invalide'
if (!formData.password.trim()) newErrors.password = 'Le mot de passe est requis'
    else if (formData.password.length < 8) newErrors.password = 'Min 8 caractères'
    if (!formData.confirmPassword.trim()) newErrors.confirmPassword = 'Confirmez le mot de passe'
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors = {}
    if (!formData.city) newErrors.city = 'La commune est requise'
    if (!formData.neighborhood) newErrors.neighborhood = 'Le quartier est requis'
    if (formData.neighborhood === 'AUTRE' && !formData.customNeighborhood.trim()) {
      newErrors.customNeighborhood = 'Veuillez préciser votre quartier'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep3 = () => {
    const newErrors = {}
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setErrors({})
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setErrors({})
      setStep(3)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateStep3()) return
    
    setLoading(true)
    setErrors({})
    
    try {
      const formatPhone = (phone) => {
        if (!phone) return ''
        let cleaned = phone.replace(/^\+?229/, '')
        return '+229' + cleaned
      }
      
      const finalData = {
        ...formData,
        neighborhood: formData.neighborhood === 'AUTRE' ? formData.customNeighborhood : formData.neighborhood,
        phone: formatPhone(formData.phone),
        whatsapp: formatPhone(formData.whatsapp)
      }
      
      const result = await registerUser(finalData)
      
      if (result.success) {
        setSuccessMessage(result.message)
      } else {
        setErrors({ general: result.error })
      }
    } catch (error) {
      console.error('Registration error:', error)
      setErrors({ general: 'Une erreur inattendue est survenue. Veuillez réessayer.' })
    } finally {
      setLoading(false)
    }
  }

  if (successMessage) {
    return (
      <div className="register-page">
        <div className="register-bg">
          <div className="register-glow"></div>
        </div>
        <div className="container">
          <motion.div 
            className="register-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ maxWidth: '500px', textAlign: 'center' }}
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
            
            <h2 style={{ marginBottom: '15px' }}>Vérifiez votre email !</h2>
            
            <p style={{ marginBottom: '20px', color: '#666' }}>
              {successMessage}
            </p>
            
            <p style={{ fontSize: '14px', color: '#888', marginBottom: '20px' }}>
              Une fois votre email vérifié, vous pourrez vous connecter.
            </p>
            
            <Link to="/login" className="btn btn-primary">
              Aller à la page de connexion
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="register-page">
      <div className="register-bg">
        <div className="register-glow"></div>
      </div>
      <div className="container">
        <motion.div 
          className="register-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="register-header">
            <div className="register-logo">
              <Store size={32} />
            </div>
            <h1>Créer un compte</h1>
            <p>Rejoignez BoutiKonect.bj - Achetez et vendez facilement!</p>
          </div>

          {/* Steps indicator */}
          <div className="register-steps">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>
              <span className="step-number">1</span>
              <span className="step-label">Infos</span>
            </div>
            <div className="step-line"></div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-label">Ville</span>
            </div>
            <div className="step-line"></div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>
              <span className="step-number">3</span>
              <span className="step-label">WhatsApp</span>
            </div>
          </div>

          {errors.general && (
            <motion.div 
              className="error-alert"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {errors.general}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="register-form">
            {/* STEP 1: Basic Info */}
            {step === 1 && (
              <motion.div className="form-step">
                <div className="form-group">
                  <label className="form-label">
                    <User size={18} />
                    Nom complet
                  </label>
                  <input 
                    type="text" 
                    className={`form-input ${errors.name ? 'error' : ''}`}
                    placeholder="Votre nom"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Phone size={18} />
                    Téléphone
                  </label>
                  <input 
                    type="tel" 
                    className={`form-input ${errors.phone ? 'error' : ''}`}
                    placeholder="Format: +229XXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                  {errors.phone && <span className="error-text">{errors.phone}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Mail size={18} />
                    Email
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

                <div className="form-group">
                  <label className="form-label">
                    <Lock size={18} />
                    Mot de passe
                  </label>
                  <input 
                    type="password" 
                    className={`form-input ${errors.password ? 'error' : ''}`}
placeholder="Min 6 caractères"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                  {errors.password && <span className="error-text">{errors.password}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Lock size={18} />
                    Confirmer mot de passe
                  </label>
                  <input 
                    type="password" 
                    className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                    placeholder="Confirmez"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  />
                  {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                </div>

                <button 
                  type="button" 
                  className="btn btn-primary btn-large"
                  onClick={handleNextStep}
                  style={{ width: '100%' }}
                >
                  Suivant <ArrowRight size={20} />
                </button>
              </motion.div>
            )}

            {/* STEP 2: Location */}
            {step === 2 && (
              <motion.div className="form-step">
                <div className="form-group">
                  <label className="form-label">
                    <MapPin size={18} />
                    Commune/Ville
                  </label>
                  <select 
                    className={`form-select ${errors.city ? 'error' : ''}`}
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value, neighborhood: '', customNeighborhood: ''})}
                  >
                    <option value="">Sélectionner une commune</option>
                    {cities.map(city => (
                      <option key={city.id} value={city.name}>{city.name}</option>
                    ))}
                  </select>
                  {errors.city && <span className="error-text">{errors.city}</span>}
                </div>

                {formData.city && selectedCity && (
                  <div className="form-group">
                    <label className="form-label">
                      <MapPin size={18} />
                      Quartier/Village
                    </label>
                    <select 
                      className={`form-select ${errors.neighborhood ? 'error' : ''}`}
                      value={formData.neighborhood}
                      onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
                    >
                      <option value="">Sélectionner un quartier</option>
                      {selectedCity.neighborhoods.map(nh => (
                        <option key={nh} value={nh}>{nh}</option>
                      ))}
                      <option value="AUTRE">+ Autre quartier</option>
                    </select>
                    {errors.neighborhood && <span className="error-text">{errors.neighborhood}</span>}
                  </div>
                )}

                {formData.neighborhood === 'AUTRE' && (
                  <div className="form-group">
                    <label className="form-label">
                      <MapPin size={18} />
                      Précisez votre quartier
                    </label>
                    <input 
                      type="text" 
                      className={`form-input ${errors.customNeighborhood ? 'error' : ''}`}
                      placeholder="Nom du quartier"
                      value={formData.customNeighborhood}
                      onChange={(e) => setFormData({...formData, customNeighborhood: e.target.value})}
                    />
                    {errors.customNeighborhood && <span className="error-text">{errors.customNeighborhood}</span>}
                  </div>
                )}

                <div className="form-nav">
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
                    <ArrowLeft size={18} /> Retour
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handleNextStep}
                  >
                    Suivant <ArrowRight size={20} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: WhatsApp */}
            {step === 3 && (
              <motion.div className="form-step">
                <div className="form-group">
                  <label className="form-label">
                    <Phone size={18} />
                    WhatsApp
                  </label>
                  <input 
                    type="tel" 
                    className={`form-input ${errors.whatsapp ? 'error' : ''}`}
                    placeholder="Format: +229XXXXXXXX"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                  />
                  {errors.whatsapp && <span className="error-text">{errors.whatsapp}</span>}
                  <span className="form-hint">Les clients vous contacteront via WhatsApp</span>
                </div>

                <div className="form-nav">
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>
                    <ArrowLeft size={18} /> Retour
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-large"
                    disabled={loading}
                  >
                    {loading ? 'Création...' : 'Créer mon compte'}
                  </button>
                </div>
              </motion.div>
            )}
          </form>

          <div className="register-footer">
            <p>Déjà inscrit? <Link to="/login">Se connecter</Link></p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
