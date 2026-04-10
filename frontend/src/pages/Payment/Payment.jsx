import { useState, useContext, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppContext } from '../../context/AppContext'
import { openFedaPayOverlay, formatPrice } from '../../services/paymentService'
import { CreditCard, Smartphone, CheckCircle, X, ArrowLeft, Loader, Wallet, Clock } from 'lucide-react'
import './Payment.css'

export default function Payment() {
  const navigate = useNavigate()
  const { cart, getCartTotal, clearCart, createOrder, user, seller } = useContext(AppContext)
  
  const [paymentMethod, setPaymentMethod] = useState('fedapay')
  const [loading, setLoading] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentError, setPaymentError] = useState(null)
  const [phone, setPhone] = useState('')

  const total = getCartTotal()
  const currentUser = user || seller

  useEffect(() => {
    if (cart.length === 0 && !paymentSuccess) {
      navigate('/cart')
    }
  }, [cart, navigate, paymentSuccess])

  const handlePayment = async () => {
    if (!phone) {
      setPaymentError("Veuillez saisir un numéro de téléphone valide.")
      return
    }

    setLoading(true)
    setPaymentError(null)

    try {
      // Configuration FedaPay pour le panier
      const customer = {
        email: currentUser?.email || 'client@example.com',
        name: currentUser?.name || 'Client',
        phone: phone
      }

      // 1. Ouvrir l'overlay de paiement
      const paymentResult = await openFedaPayOverlay({
        amount: total,
        description: `Achat BoutiKonect.bj - ${cart.length} article(s)`,
        customer
      });

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || "Paiement annulé")
      }

      // 2. Si le paiement est réussi, créer les commandes dans Supabase
      const orderPromises = cart.map(item => 
        createOrder({
          productId: item.id,
          productTitle: item.title,
          productImage: item.images[0],
          price: item.price,
          quantity: item.quantity,
          sellerId: item.sellerId,
          buyerId: currentUser?.id,
          buyerName: currentUser?.name,
          buyerPhone: phone || currentUser?.phone,
          paymentId: paymentResult.transactionId || ('PAY' + Date.now()),
          paymentStatus: 'paid',
          paymentMethod: 'fedapay'
        })
      )

      await Promise.all(orderPromises)

      // 3. Vider le panier et afficher le succès
      clearCart()
      setPaymentSuccess(true)
    } catch (error) {
      setPaymentError(error.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  if (paymentSuccess) {
    return (
      <div className="payment-page">
        <div className="container">
          <motion.div 
            className="payment-success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="success-icon">
              <CheckCircle size={64} />
            </div>
            <h1>Paiement reussi!</h1>
            <p>Merci pour votre achat.</p>
            <div className="success-actions">
              <Link to="/" className="btn btn-primary">Retour a l'accueil</Link>
              <Link to="/products" className="btn btn-outline">Continuer vos achats</Link>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  if (showConfirmation) {
    return (
      <div className="payment-page">
        <div className="container">
          <motion.div 
            className="payment-confirmation"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button className="back-btn" onClick={() => setShowConfirmation(false)}>
              <ArrowLeft size={20} /> Retour
            </button>
            <div className="confirmation-header">
              <Smartphone size={48} />
              <h2>Confirmation du paiement</h2>
              <p className="amount">{formatPrice(total)}</p>
            </div>
            <div className="payment-instructions">
              <h3>Instructions Mobile Money</h3>
              <pre>{paymentInstructions}</pre>
            </div>
            <div className="confirmation-actions">
              <button 
                className="btn btn-primary btn-large"
                onClick={handleConfirmMobilePayment}
                disabled={loading}
              >
                {loading ? <><Loader size={20} className="spin" /> Confirmation...</> : <><CheckCircle size={20} /> Confirmer</>}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="payment-page">
      <div className="container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} /> Retour
        </button>
        <div className="payment-layout">
          <div className="payment-summary">
            <h2>Resume de la commande</h2>
            <div className="cart-items">
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <img src={item.images[0] || 'https://via.placeholder.com/60'} alt={item.title} />
                  <div className="item-info">
                    <h4>{item.title}</h4>
                    <p>Qty: {item.quantity}</p>
                  </div>
                  <div className="item-price">{formatPrice(item.price * item.quantity)}</div>
                </div>
              ))}
            </div>
            <div className="summary-totals">
              <div className="total">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          <div className="payment-methods">
            <h2>Mode de paiement</h2>
            {paymentError && (
              <div className="payment-error"><X size={20} /><span>{paymentError}</span></div>
            )}
            <div className="payment-options">
              <label className={`payment-option ${paymentMethod === 'fedapay' ? 'selected' : ''}`}>
                <input type="radio" name="paymentMethod" value="fedapay" checked={paymentMethod === 'fedapay'} onChange={(e) => setPaymentMethod(e.target.value)} />
                <div className="option-content">
                  <CreditCard size={24} />
                  <div><h4>Paiement Sécurisé</h4><p>Mobile Money ou Carte via FedaPay</p></div>
                </div>
              </label>
            </div>
            <div className="phone-input">
              <label className="form-label"><Smartphone size={18} /> Telephone</label>
              <input type="tel" className="form-input" placeholder="+229 01 40 57 13 73" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-large pay-btn" onClick={handlePayment} disabled={loading || !phone}>
              {loading ? <><Loader size={20} className="spin" /> Traitement...</> : <><Wallet size={20} /> Payer {formatPrice(total)}</>}
            </button>
            <div className="security-note">
              <CheckCircle size={16} /><span>Paiement securise</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

