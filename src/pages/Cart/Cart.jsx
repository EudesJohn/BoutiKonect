import { useContext, useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppContext } from '../../context/AppContext'
import { formatPrice } from '../../services/paymentService'
import { ShoppingCart, Trash2, Minus, Plus, ArrowLeft, MapPin, AlertTriangle, Loader } from 'lucide-react'
import { validateName, validatePhone, validateAddress } from '../../utils/validation'
import OrderInvoice from '../../components/OrderInvoice/OrderInvoice'
import './Cart.css'

export default function Cart() {
  const navigate = useNavigate()
  const { cart, removeFromCart, updateCartQuantity, clearCart, getCartTotal, user, seller, createOrder, products } = useContext(AppContext)
  const currentUser = user || seller

  // Pré-remplir le formulaire avec les données de l'utilisateur connecté
  const [orderForm, setOrderForm] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    address: ''
  })
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [lastOrder, setLastOrder] = useState(null)

  // Validate order form
  const validateOrderForm = () => {
    const newErrors = {}
    
    const nameValidation = validateName(orderForm.name)
    if (!nameValidation.isValid) {
      newErrors.name = nameValidation.error
    }
    
    const phoneValidation = validatePhone(orderForm.phone)
    if (!phoneValidation) {
      newErrors.phone = 'Veuillez entrer un numéro de téléphone valide'
    }
    
    const addressValidation = validateAddress(orderForm.address)
    if (!addressValidation.isValid) {
      newErrors.address = addressValidation.error
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Vérifier le stock disponible pour tous les articles — valeur dérivée pure
  const stockErrors = useMemo(() => {
    const errors = []
    cart.forEach(item => {
      const product = products.find(p => p.id === item.id)
      const availableStock = product?.stock || 0

      if (availableStock < item.quantity) {
        errors.push({
          productId: item.id,
          productTitle: item.title,
          requested: item.quantity,
          available: availableStock
        })
      }
    })
    return errors
  }, [cart, products])

  const handleOrder = async (e) => {
    e.preventDefault()

    // Éviter les doubles soumissions
    if (isSubmitting) return

    // Validate form data
    if (!validateOrderForm()) {
      return
    }

    // Check stock availability
    if (stockErrors.length > 0) {
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const orderedItems = cart.map(item => ({ ...item }))
      const orderTimestamp = new Date().toISOString()

      // Appliquer le prix promotionnel s'il existe et créer les commandes
      const orderPromises = cart.map((item, idx) => {
        // Chercher le prix promo dans les données actuelles du produit
        const product = products.find(p => p.id === item.id)
        const effectivePrice = (product?.promotionPrice != null && product?.promotionPrice !== '')
          ? Number(product.promotionPrice)
          : Number(item.price) || 0

        // Mettre à jour le snapshot avec le prix effectif pour la facture
        if (orderedItems[idx]) {
          orderedItems[idx].price = effectivePrice
          orderedItems[idx].originalPrice = item.price
        }

        const order = {
          productId: item.id,
          productTitle: item.title,
          productImage: item.images?.[0],
          sellerId: item.sellerId,
          sellerName: item.sellerName,
          sellerCity: item.sellerCity,
          sellerNeighborhood: item.sellerNeighborhood,
          buyerId: currentUser?.id,
          buyerName: orderForm.name.trim(),
          buyerPhone: orderForm.phone.trim(),
          buyerAddress: orderForm.address.trim(),
          quantity: item.quantity,
          price: effectivePrice,
          total: effectivePrice * item.quantity
        }
        return createOrder(order)
      })

      await Promise.all(orderPromises)

      // Calculer le total depuis le snapshot mis à jour (pas depuis le panier qui peut changer pendant l'async)
      const orderTotal = orderedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

      // Store order data for invoice display
      setLastOrder({
        items: orderedItems,
        buyerName: orderForm.name.trim(),
        buyerPhone: orderForm.phone.trim(),
        buyerAddress: orderForm.address.trim(),
        total: orderTotal,
        date: orderTimestamp,
        paymentMethod: 'Paiement à la livraison',
        paymentStatus: 'pending'
      })

      setOrderPlaced(true)
      clearCart()
    } catch (err) {
      console.error('Erreur lors de la commande:', err)
      setSubmitError('Une erreur est survenue lors de la création de la commande. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (orderPlaced) {
    return (
      <div className="cart-page">
        <div className="container">
          <OrderInvoice
            items={lastOrder?.items || cart}
            buyerName={lastOrder?.buyerName || orderForm.name}
            buyerPhone={lastOrder?.buyerPhone || orderForm.phone}
            buyerAddress={lastOrder?.buyerAddress || orderForm.address}
            total={lastOrder?.total ?? getCartTotal()}
            orderDate={lastOrder?.date || new Date()}
            paymentMethod={lastOrder?.paymentMethod || 'Paiement à la livraison'}
            paymentStatus={lastOrder?.paymentStatus || 'pending'}
          />
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <motion.div 
            className="cart-empty"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="empty-icon">
              <ShoppingCart size={60} />
            </div>
            <h2>Votre panier est vide</h2>
            <p>Parcourez nos produits et ajoutez-les à votre panier</p>
            <div className="empty-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/products" className="btn btn-primary btn-large">
                Découvrir les Produits
              </Link>
              <Link to="/services" className="btn btn-primary btn-large">
                Découvrir les Services
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <div className="container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          Retour
        </button>

        <div className="cart-layout">
          {/* Cart Items */}
          <div className="cart-items">
            <h1>Mon Panier ({cart.length})</h1>
            
            <div className="cart-list">
              {cart.map(item => (
                <motion.div 
                  key={item.id}
                  className="cart-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Link to={`/product/${item.id}`} className="item-image">
                    <img src={item.images[0] || 'https://via.placeholder.com/100'} alt={item.title} />
                  </Link>
                  
                  <div className="item-details">
                    <Link to={`/product/${item.id}`} className="item-title">
                      {item.title}
                    </Link>
                    <div className="item-location">
                      <MapPin size={14} />
                      {item.sellerCity}, {item.sellerNeighborhood}
                    </div>
                    <div className="item-price">{formatPrice(item.price)}</div>
                  </div>

                  <div className="item-quantity">
                    <button 
                      className="qty-btn"
                      onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus size={16} />
                    </button>
                    <span>{item.quantity}</span>
                    <button 
                      className="qty-btn"
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className="item-total">
                    {formatPrice(item.price * item.quantity)}
                  </div>

                  <button 
                    className="remove-btn"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </motion.div>
              ))}
            </div>

            <div className="cart-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-md)' }}>
              <button className="clear-cart" onClick={clearCart}>
                Vider le panier
              </button>
              <Link to="/services" className="btn btn-outline" style={{ borderStyle: 'dashed' }}>
                <Plus size={18} /> Ajouter des services
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <aside className="order-summary">
            <h2>Résumé de la commande</h2>
            
            <div className="summary-items">
              {cart.map(item => (
                <div key={item.id} className="summary-item">
                  <span>{item.title} x{item.quantity}</span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="summary-subtotal">
              <span>Sous-total</span>
              <span>{formatPrice(getCartTotal())}</span>
            </div>

            <div className="summary-total">
              <span>Total</span>
              <span>{formatPrice(getCartTotal())}</span>
            </div>

            <form className="order-form" onSubmit={handleOrder}>
              <h3>Informations de livraison</h3>

              {/* Submit Error */}
              {submitError && (
                <motion.div
                  className="error-alert"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AlertTriangle size={20} />
                  <span>{submitError}</span>
                </motion.div>
              )}

              {/* Stock Errors */}
              {stockErrors.length > 0 && (
                <motion.div 
                  className="error-alert"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AlertTriangle size={20} />
                  <div>
                    <strong>Stock insuffisant:</strong>
                    <ul>
                      {stockErrors.map((error, index) => (
                        <li key={index}>
                          {error.productTitle}: demandé {error.requested}, disponible {error.available}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
              
              <div className="form-group">
                <label className="form-label">Nom complet</label>
                <input 
                  type="text" 
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  placeholder="Votre nom"
                  value={orderForm.name}
                  onChange={(e) => setOrderForm({...orderForm, name: e.target.value})}
                  required
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Téléphone</label>
                <input 
                  type="tel" 
                  className={`form-input ${errors.phone ? 'error' : ''}`}
                  placeholder="Ex: +2290140571373, +22940571373, 0140571373"
                  value={orderForm.phone}
                  onChange={(e) => setOrderForm({...orderForm, phone: e.target.value})}
                  required
                />
                {errors.phone && <span className="error-text">{errors.phone}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Adresse de livraison</label>
                <textarea 
                  className={`form-input ${errors.address ? 'error' : ''}`}
                  placeholder="Votre adresse complète"
                  rows="2"
                  value={orderForm.address}
                  onChange={(e) => setOrderForm({...orderForm, address: e.target.value})}
                  required
                />
                {errors.address && <span className="error-text">{errors.address}</span>}
              </div>

              <button type="submit" className="btn btn-primary btn-large" disabled={stockErrors.length > 0 || isSubmitting}>
                {isSubmitting ? (
                  <><Loader size={20} className="spin" /> Commande en cours...</>
                ) : stockErrors.length > 0 ? (
                  'Stock insuffisant'
                ) : (
                  'Passer la commande'
                )}
              </button>
            </form>
          </aside>
        </div>
      </div>
    </div>
  )
}
