import { useContext, useState, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppContext } from '../../context/AppContext'
import { ShoppingCart, Trash2, Minus, Plus, ArrowLeft, MapPin, CheckCircle, AlertTriangle, Package } from 'lucide-react'
import { validateName, validatePhone, validateAddress } from '../../utils/validation'
import './Cart.css'

export default function Cart() {
  const navigate = useNavigate()
  const { cart, removeFromCart, updateCartQuantity, clearCart, getCartTotal, user, seller, createOrder, products } = useContext(AppContext)
  const [orderForm, setOrderForm] = useState({
    name: '',
    phone: '',
    address: ''
  })
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [stockErrors, setStockErrors] = useState([])

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(price)
  }

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

  // Check stock availability for all items
  const checkStockAvailability = useCallback(() => {
    const errors = []
    cart.forEach(item => {
      const product = products.find(p => p.id === item.id)
      // Skip stock verification for services
      if (product?.type === 'service') return;
      
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
    setStockErrors(errors)
    return errors.length === 0
  }, [cart, products])

  const handleOrder = async (e) => {
    e.preventDefault()
    
    // Validate form data
    if (!validateOrderForm()) {
      return
    }
    
    // Check stock availability
    if (!checkStockAvailability()) {
      return
    }
    
    setIsSubmitting(true)
    const currentUser = user || seller
    
    // Bloquer les commandes sans authentification
    if (!currentUser) {
      setErrors({ general: 'Vous devez être connecté pour passer une commande.' })
      setIsSubmitting(false)
      navigate('/login')
      return
    }

    try {
      // Create an order for each product in cart
      const results = []
      for (const item of cart) {
        const order = {
          type: item.type || 'product',
          productId: item.id,
          productTitle: item.title,
          serviceTitle: item.title, // Support both fields
          productImage: item.images[0],
          sellerId: item.sellerId,
          sellerName: item.sellerName,
          sellerCity: item.sellerCity,
          sellerNeighborhood: item.sellerNeighborhood,
          buyerId: currentUser?.id || 'guest',
          buyerName: orderForm.name.trim(),
          buyerPhone: orderForm.phone.trim(),
          buyerAddress: orderForm.address.trim(),
          location: orderForm.address.trim(), // Support service field
          details: 'Commande depuis le panier',
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        }
        const result = await createOrder(order)
        results.push({ item, success: result?.success })
      }
      
      const failures = results.filter(r => !r.success)
      if (failures.length > 0) {
        const failedTitles = failures.map(f => f.item.title).join(', ')
        alert(`Certains articles n'ont pas pu être commandés : ${failedTitles}. Veuillez réessayer pour ces articles.`)
        // Keep failed items in cart? For now, we clear the whole cart only if all succeeded
        // or we can just proceed if at least some succeeded. 
        // Best approach: If any failed, don't clear cart for those.
        if (failures.length === cart.length) {
          setIsSubmitting(false)
          return
        }
      }
      
      // WhatsApp Redirect for the first item's seller
      if (cart.length > 0) {
        const firstItem = cart[0]
        if (firstItem.whatsapp) {
          const message = `Bonjour ${firstItem.sellerName}, je viens de passer une commande sur BoutiKonect pour "${firstItem.title}"${cart.length > 1 ? ` et ${cart.length - 1} autre(s) article(s)` : ''}.\n\nClient: ${orderForm.name}\nTel: ${orderForm.phone}`
          const whatsappUrl = `https://wa.me/${firstItem.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
          
          // Delay redirect slightly to ensure state updates
          setTimeout(() => {
            window.open(whatsappUrl, '_blank')
          }, 1000)
        }
      }

      setOrderPlaced(true)
      clearCart()
    } catch (error) {
      console.error("Erreur commande:", error)
      alert("Une erreur est survenue lors de la validation de votre commande.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (orderPlaced) {
    return (
      <div className="cart-page">
        <div className="container">
          <motion.div 
            className="order-success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="success-icon">
              <CheckCircle size={60} />
            </div>
            <h2>Commande confirmée!</h2>
            <p>Merci pour votre achat. Le vendeur vous contactera bientôt sur WhatsApp.</p>
            <div className="success-actions">
              <Link to="/" className="btn btn-primary">
                Retour à l'accueil
              </Link>
              <Link to="/products" className="btn btn-outline">
                Continuer vos achats
              </Link>
            </div>
          </motion.div>
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

              <button type="submit" className="btn btn-primary btn-large" disabled={stockErrors.length > 0}>
                {stockErrors.length > 0 ? 'Stock insuffisant' : 'Passer la commande'}
              </button>
            </form>
          </aside>
        </div>
      </div>
    </div>
  )
}
