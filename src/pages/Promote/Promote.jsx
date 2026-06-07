import { useState, useContext, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppContext } from '../../context/AppContext'
import { getPromotionPrices } from '../../services/paymentService'
import { Sparkles, Clock, AlertCircle, Phone, CreditCard } from 'lucide-react'

export default function Promote() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getProductById, promoteProduct, seller } = useContext(AppContext)
  
  const [selectedDuration, setSelectedDuration] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('mobile')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [promotionPrices, setPromotionPrices] = useState(getPromotionPrices())
  
  const product = getProductById(id)
  
  // Refresh prices when component mounts (in case admin changed them)
  useEffect(() => {
    setPromotionPrices(getPromotionPrices())
  }, [])
  
  if (!product) {
    return (
      <div className="promote-page">
        <div className="container">
          <div className="error-state">
            <AlertCircle size={64} />
            <h2>Produit non trouvé</h2>
            <Link to="/products" className="btn btn-primary">Voir les produits</Link>
          </div>
        </div>
      </div>
    )
  }
  
  if (!seller) {
    return (
      <div className="promote-page">
        <div className="container">
          <div className="error-state">
            <AlertCircle size={64} />
            <h2>Vous devez être connecté</h2>
            <Link to="/login" className="btn btn-primary">Se connecter</Link>
          </div>
        </div>
      </div>
    )
  }
  
  if (product.sellerId !== seller.id) {
    return (
      <div className="promote-page">
        <div className="container">
          <div className="error-state">
            <AlertCircle size={64} />
            <h2>Vous ne pouvez pas promouvoir ce produit</h2>
          </div>
        </div>
      </div>
    )
  }

  const handlePromote = async () => {
    if (!selectedDuration) {
      setError('Sélectionnez une durée')
      return
    }
    
    if (paymentMethod === 'mobile' && !phoneNumber) {
      setError('Entrez votre numéro de téléphone')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      await promoteProduct(product.id, selectedDuration)
      setSuccess(true)
    } catch (err) {
      setError('Erreur lors de la promotion')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(price)
  }

  if (success) {
    return (
      <div className="promote-page">
        <div className="container">
          <motion.div className="success-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="success-icon"><Sparkles size={48} /></div>
            <h2>Produit mis en vedette!</h2>
            <p>Votre produit "{product.title}" est maintenant en promotion.</p>
            <div className="success-details">
              <p><strong>Durée:</strong> {promotionPrices[selectedDuration]?.name}</p>
              <p><strong>Prix payé:</strong> {formatPrice(promotionPrices[selectedDuration]?.price)}</p>
            </div>
            <div className="success-actions">
              <Link to="/my-products" className="btn btn-primary">Voir mes produits</Link>
              <Link to="/" className="btn btn-outline">Accueil</Link>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="promote-page">
      <div className="container">
        <button className="back-btn" onClick={() => navigate(-1)}>Retour</button>
        
        <motion.div className="promote-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="promote-header">
            <Sparkles size={32} className="promote-icon" />
            <h1>Mettre en vedette</h1>
            <p>Augmentez la visibilité de votre produit!</p>
          </div>

          <div className="product-preview">
            <img src={product.images?.[0] || 'https://via.placeholder.com/100'} alt={product.title} />
            <div>
              <h3>{product.title}</h3>
              <p className="price">{formatPrice(product.price)}</p>
            </div>
          </div>

          <div className="duration-section">
            <h3>Choisissez la durée</h3>
            <div className="duration-options">
              <button className={`duration-option ${selectedDuration === 'threeDays' ? 'selected' : ''}`} onClick={() => setSelectedDuration('threeDays')}>
                <Clock size={24} />
                <span className="duration-name">{promotionPrices.threeDays?.name || '3 jours'}</span>
                <span className="duration-price">{formatPrice(promotionPrices.threeDays?.price || 1000)}</span>
              </button>
              <button className={`duration-option ${selectedDuration === 'week' ? 'selected' : ''}`} onClick={() => setSelectedDuration('week')}>
                <Clock size={24} />
                <span className="duration-name">{promotionPrices.week?.name || '1 semaine'}</span>
                <span className="duration-price">{formatPrice(promotionPrices.week?.price || 2500)}</span>
              </button>
              <button className={`duration-option ${selectedDuration === 'month' ? 'selected' : ''}`} onClick={() => setSelectedDuration('month')}>
                <Sparkles size={24} />
                <span className="duration-name">{promotionPrices.month?.name || '1 mois'}</span>
                <span className="duration-price">{formatPrice(promotionPrices.month?.price || 9000)}</span>
              </button>
            </div>
          </div>

          <div className="payment-section">
            <h3>Méthode de paiement</h3>
            <div className="payment-methods">
              <button className={`payment-method ${paymentMethod === 'mobile' ? 'selected' : ''}`} onClick={() => setPaymentMethod('mobile')}>
                <Phone size={24} />
                <span>Mobile Money</span>
              </button>
              <button className={`payment-method ${paymentMethod === 'card' ? 'selected' : ''}`} onClick={() => setPaymentMethod('card')}>
                <CreditCard size={24} />
                <span>Carte Bancaire</span>
              </button>
            </div>
            {paymentMethod === 'mobile' && (
              <div className="phone-input">
                <label>Numéro Mobile Money (Moov/MTN)</label>
                <input type="tel" placeholder="+229 01 40 57 13 73" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                <p className="payment-hint">Vous recevrez un code de confirmation par SMS</p>
              </div>
            )}
          </div>

          {selectedDuration && (
            <div className="payment-summary">
              <div className="summary-row"><span>Durée</span><span>{promotionPrices[selectedDuration]?.name}</span></div>
              <div className="summary-row total"><span>Total à payer</span><span>{formatPrice(promotionPrices[selectedDuration]?.price)}</span></div>
            </div>
          )}

          {error && <div className="error-alert"><AlertCircle size={20} />{error}</div>}

          <button className="btn btn-primary btn-large pay-btn" onClick={handlePromote} disabled={loading || !selectedDuration}>
            {loading ? ' Traitement...' : `Payer ${selectedDuration ? formatPrice(promotionPrices[selectedDuration]?.price) : ''}`}
          </button>
        </motion.div>
      </div>
    </div>
  )
}

