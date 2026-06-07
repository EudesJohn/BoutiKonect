import { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppContext } from '../../context/AppContext'
import { initFedaPay, formatPrice } from '../../services/paymentService'
import { CreditCard, Smartphone, CheckCircle, X, ArrowLeft, Loader, Wallet, Clock } from 'lucide-react'
import OrderInvoice from '../../components/OrderInvoice/OrderInvoice'
import './Payment.css'

export default function Payment() {
  const navigate = useNavigate()
  const { cart, getCartTotal, clearCart, createOrder, user, seller, products } = useContext(AppContext)
  const currentUser = user || seller

  const [paymentMethod, setPaymentMethod] = useState('mobile_money')
  const [loading, setLoading] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentError, setPaymentError] = useState(null)
  const [paymentInstructions, setPaymentInstructions] = useState(null)
  // Pré-remplir le téléphone depuis le profil utilisateur
  const [phone, setPhone] = useState(currentUser?.phone || '')
  const [showConfirmation, setShowConfirmation] = useState(false)
  // Stocke les données de la commande AVANT de vider le panier (évite facture vide)
  const [lastOrder, setLastOrder] = useState(null)

  const total = getCartTotal()

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

    // Validation améliorée du téléphone
    const cleanedPhone = phone.replace(/[\s\-\.]/g, '')
    const phoneRegex = /^(\+229)?[0-9]{8}$/
    if (!phoneRegex.test(cleanedPhone)) {
      setPaymentError("Format de téléphone invalide. Utilisez +229XXXXXXXX ou 01XXXXXXXX.")
      return
    }

    setLoading(true)
    setPaymentError(null)

    try {
      // Vérifier si FedaPay est disponible
      const fedapayAvailable = typeof window.FedaPay !== 'undefined'

      if (fedapayAvailable) {
        // Configuration FedaPay pour le panier
        const customer = {
          email: currentUser?.email || 'client@example.com',
          lastname: currentUser?.name?.split(' ').slice(1).join(' ') || 'Client',
          firstname: currentUser?.name?.split(' ')[0] || '',
          phone_number: {
            number: phone,
            country: 'bj'
          }
        }

        const transaction = {
          amount: total,
          description: `Achat BoutiKonect.bj - ${cart.length} article(s)`
        }

        // Initialiser FedaPay
        const initResult = initFedaPay({
          transaction,
          customer,
          callback_url: window.location.origin + '/payment-callback',
          cancel_url: window.location.href
        });

        if (!initResult.success) {
          // Si FedaPay échoue → fallback confirmation manuelle
          console.warn('FedaPay indisponible, fallback confirmation manuelle:', initResult.error)
          setPaymentInstructions(
            `💳 Paiement Mobile Money\n\n` +
            `Montant : ${formatPrice(total)}\n` +
            `Téléphone : ${phone}\n\n` +
            `Sur votre téléphone, ouvrez votre application Mobile Money (Moov ou MTN)\n` +
            `et effectuez le transfert vers le numéro ci-dessus.\n\n` +
            `📱 Moov : *144*4#\n` +
            `📱 MTN : *156*3#\n\n` +
            `Une fois le paiement effectué, cliquez sur "Confirmer" ci-dessous.`
          )
          setLoading(false)
          setShowConfirmation(true)
          return
        }

        // Stockage temporaire des infos de commande pour le callback
        sessionStorage.setItem('pending_order', JSON.stringify({
          cart: cart.map(item => ({ ...item })),
          phone,
          total,
          buyerId: currentUser?.id,
          buyerName: currentUser?.name
        }))
      } else {
        // FedaPay non chargé → fallback confirmation manuelle
        setPaymentInstructions(
          `💳 Paiement à la livraison\n\n` +
          `Montant : ${formatPrice(total)}\n` +
          `Téléphone : ${phone}\n\n` +
          `Vous pouvez payer à la livraison en espèces ou via Mobile Money.\n\n` +
          `Cliquez sur "Confirmer" pour finaliser votre commande.`
        )
        setLoading(false)
        setShowConfirmation(true)
      }
    } catch (error) {
      setPaymentError(error.message || 'Une erreur est survenue')
      setLoading(false)
    }
  }

  const handleConfirmMobilePayment = async () => {
    setLoading(true)

    await new Promise(resolve => setTimeout(resolve, 2000))

    // 🔴 CRITIQUE : Sauvegarder les articles AVANT de vider le panier
    const orderItems = cart.map(item => ({ ...item }))
    const orderDate = new Date()

    try {
      // Collecter et attendre toutes les promesses createOrder
      const orderPromises = cart.map((item, idx) => {
        // Utiliser le prix promotionnel s'il existe
        const product = products.find(p => p.id === item.id)
        const effectivePrice = product?.promotionPrice || item.price

        // Mettre à jour le snapshot pour la facture
        if (orderItems[idx]) {
          orderItems[idx].price = effectivePrice
          orderItems[idx].originalPrice = item.price
        }

        return createOrder({
          productId: item.id,
          productTitle: item.title,
          productImage: item.images?.[0],
          price: effectivePrice,
          quantity: item.quantity,
          sellerId: item.sellerId,
          buyerId: currentUser?.id,
          buyerName: currentUser?.name,
          buyerPhone: phone || currentUser?.phone,
          paymentId: 'PAY' + Date.now() + Math.random().toString(36).slice(2, 6),
          paymentStatus: 'paid',
          paymentMethod: 'mobile_money'
        })
      })

      await Promise.all(orderPromises)

      // Calculer le total depuis le snapshot mis à jour (prix promo inclus)
      const effectiveTotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

      // Stocker les données de la facture avant de vider le panier
      setLastOrder({
        items: orderItems,
        buyerName: currentUser?.name || 'Client',
        buyerPhone: phone || currentUser?.phone,
        total: effectiveTotal,
        date: orderDate,
        paymentMethod: 'Mobile Money (FedaPay)',
        paymentStatus: 'paid'
      })

      clearCart()
      setPaymentSuccess(true)
      setShowConfirmation(false)
    } catch (err) {
      console.error('Erreur lors de la création de la commande:', err)
      setPaymentError('La commande n\'a pas pu être enregistrée. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  if (paymentSuccess) {
    return (
      <div className="payment-page">
        <div className="container">
          <OrderInvoice
            items={lastOrder?.items || cart}
            buyerName={lastOrder?.buyerName || currentUser?.name || 'Client'}
            buyerPhone={lastOrder?.buyerPhone || phone || currentUser?.phone}
            total={lastOrder?.total || total}
            orderDate={lastOrder?.date || new Date()}
            paymentMethod={lastOrder?.paymentMethod || 'Mobile Money (FedaPay)'}
            paymentStatus={lastOrder?.paymentStatus || 'paid'}
          />
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
            {paymentError && (
              <motion.div className="payment-error" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <X size={20} /><span>{paymentError}</span>
              </motion.div>
            )}
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
              <label className="form-label"><Smartphone size={18} /> Téléphone Mobile Money</label>
              <input type="tel" className="form-input" placeholder="+229 XX XX XX XX" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <p className="help-text">Numéro MTN ou Moov pour recevoir la demande de paiement</p>
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

