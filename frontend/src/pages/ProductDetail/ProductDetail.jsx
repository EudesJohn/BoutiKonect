
import { useContext, useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AppContext } from '../../context/AppContext'
import { getItemReviews, getItemRating, addReview } from '../../services/reviewsService'
import { trackView } from '../../services/analyticsService'
import { MapPin, ShoppingCart, MessageCircle, ArrowLeft, Share2, Heart, ChevronLeft, ChevronRight, X, Flag, Star, Send, Facebook, Copy } from 'lucide-react'
import './ProductDetail.css'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getProductById, fetchSingleProduct, dataLoading, addToCart, toggleFavorite, isFavorite, createOrder, user, seller, reportProduct, reviews: allReviews, decrementProductStock, formatPrice, parseDate } = useContext(AppContext)
  const [localProduct, setLocalProduct] = useState(null)
  const [loadingLocalProduct, setLoadingLocalProduct] = useState(true)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showGallery, setShowGallery] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [now, setNow] = useState(new Date())
  const [reportReason, setReportReason] = useState('')
  const [addedToCart, setAddedToCart] = useState(false)
  const [orderForm, setOrderForm] = useState({
    name: '',
    phone: '',
    address: ''
  })
  const [reviewLimit, setReviewLimit] = useState(5)
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: ''
  })
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState(false)
  
  const reportReasons = [
    "Contenu inapproprié ou offensant",
    "Produit mensonger ou frauduleux",
    "Prix ne correspondant pas à la réalité",
    "Contrefaçon ou violation de propriété",
    "Autre"
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Tracking de la vue
  useEffect(() => {
    if (product?.id) {
      trackView(product.id, user?.id || seller?.id, product.category, product.sellerId)
    }
  }, [product?.id, user?.id, seller?.id, product?.sellerId])

  
  const productFromState = useMemo(() => getProductById(id), [id, getProductById])
  const product = localProduct || productFromState

  useEffect(() => {
    const loadProduct = async () => {
      if (productFromState) {
        setLoadingLocalProduct(false)
        return
      }

      setLoadingLocalProduct(true)
      const fetched = await fetchSingleProduct(id)
      if (fetched) {
        setLocalProduct(fetched)
      }
      setLoadingLocalProduct(false)
    }
    
    loadProduct()
  }, [id, productFromState, fetchSingleProduct])

  // Filtrer les avis pour ce produit
  const itemReviews = useMemo(() => 
    allReviews.filter(r => r.productId === id), 
  [allReviews, id])

  // Calculer la note moyenne
  const itemRating = useMemo(() => {
    if (itemReviews.length === 0) return { average: 0, count: 0 }
    const total = itemReviews.reduce((sum, r) => sum + r.rating, 0)
    return { 
      average: Math.round((total / itemReviews.length) * 10) / 10, 
      count: itemReviews.length 
    }
  }, [itemReviews])

  // Navigation functions for gallery
  const nextImage = (e) => {
    e?.stopPropagation()
    setCurrentImageIndex(prev => (prev + 1) % product.images.length)
  }

  const prevImage = (e) => {
    e?.stopPropagation()
    setCurrentImageIndex(prev => (prev - 1 + product.images.length) % product.images.length)
  }

  const selectImage = (index) => {
    setCurrentImageIndex(index)
  }

  if (loadingLocalProduct || (dataLoading.products && !product)) {
    return (
      <div className="product-loading-container" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '60vh', 
        background: 'transparent',
        gap: '20px' 
      }}>
        <div className="loader-spinner-pro"></div>
        <p style={{ color: 'var(--text-light)', fontWeight: '500', fontSize: '1rem', letterSpacing: '0.5px' }}>Préparation de votre produit...</p>
        <style>{`
          .loader-spinner-pro {
            width: 60px;
            height: 60px;
            border: 3px solid rgba(255, 106, 0, 0.05);
            border-top: 3px solid #FF6A00;
            border-right: 3px solid #FF6A00;
            border-radius: 50%;
            animation: spinPro 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
          }
          @keyframes spinPro { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="product-not-found">
        <div className="not-found-content">
          <X size={48} color="var(--danger)" />
          <h2>Produit non trouvé</h2>
          <p>Désolé, ce produit n'existe plus ou le lien est invalide.</p>
          <Link to="/products" className="btn btn-primary">
            Retour aux produits
          </Link>
        </div>
      </div>
    )
  }


  const handleAddToCart = () => {
    addToCart(product)
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  const handleOrder = async (e) => {
    e.preventDefault()
    
    if (!user && !seller) {
      alert("Vous devez être connecté pour passer une commande.")
      return
    }
    
    if (product.stock !== undefined && product.stock < 1) {
      alert("Désolé, ce produit est actuellement en rupture de stock.")
      return
    }

    const currentUser = user || seller
    const orderResult = await createOrder({
      productId: product.id,
      productTitle: product.title,
      productImage: product.images[0],
      price: product.price,
      quantity: 1,
      sellerId: product.sellerId,
      sellerName: product.sellerName,
      buyerId: currentUser?.id || 'anonymous_guest',
      buyerName: orderForm.name,
      buyerPhone: orderForm.phone,
      buyerAddress: orderForm.address
    })
    
    if (orderResult && orderResult.success) {
      // Décrémenter le stock si c'est un produit physique
      if (product.stock !== undefined) {
        decrementProductStock(product.id, 1)
      }

      alert(`Commande confirmée!\n\nProduit: ${product.title}\nPrix: ${formatPrice(product.price)}\nClient: ${orderForm.name}\nTéléphone: ${orderForm.phone}\nAdresse: ${orderForm.address}\n\nLe vendeur a été notifié et traitera votre commande.`)
      setShowOrderModal(false)
      setOrderForm({ name: '', phone: '', address: '' })
      navigate('/')
    } else {
      alert("Désolé, une erreur est survenue lors de la création de votre commande. Veuillez réessayer.")
    }
  }

  const whatsappMessage = `Bonjour, je suis intéressé(e) par le produit "${product.title}" au prix de ${formatPrice(product.price)}. Est-il encore disponible?`
  
  // Use fallback: whatsapp → sellerPhone → phone (same as ProductCard)
  const vendorPhone = product.whatsapp || product.sellerPhone || product.phone || ''
  
  // URL WhatsApp - use the vendor's number
  const whatsappUrl = vendorPhone 
    ? `https://wa.me/${vendorPhone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`

  const handleShare = () => {
    // Essayer d'abord le partage natif (Web Share API)
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: `Découvrez ce produit: ${product.title} à ${formatPrice(product.price)}`,
        url: window.location.href
      })
      .then(() => console.log('Partagé avec succès'))
      .catch((err) => {
        // Si l'utilisateur ferme la fenêtre sans partager, ne rien faire
        if (err.name !== 'AbortError') {
          console.log('Erreur de partage:', err)
        }
      })
    } else {
      // Si l'API n'est pas disponible, afficher le menu personnalisé
      setShowShareMenu(!showShareMenu)
    }
  }

  const shareToFacebook = () => {
    const url = encodeURIComponent(window.location.href)
    const title = encodeURIComponent(product.title)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${title}`, '_blank')
    setShowShareMenu(false)
  }

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`Découvrez ce produit: ${product.title} à ${formatPrice(product.price)}\n${window.location.href}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
    setShowShareMenu(false)
  }

  const shareToTelegram = () => {
    const text = encodeURIComponent(`${product.title} - ${formatPrice(product.price)}\n${window.location.href}`)
    window.open(`https://t.me/share/url?url=${window.location.href}&text=${text}`, '_blank')
    setShowShareMenu(false)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      alert('Lien copié dans le presse-papiers!')
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = window.location.href
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert('Lien copié dans le presse-papiers!')
    }
    setShowShareMenu(false)
  }

  // Soumettre un avis
  const handleSubmitReview = async (e) => {
    e.preventDefault()
    
    if (!newReview.comment.trim()) {
      setReviewError('Veuillez écrire un commentaire')
      return
    }

    const currentUser = user || seller
    const result = await addReview(
      product.id,
      currentUser?.name || 'Anonyme',
      newReview.rating,
      newReview.comment,
      currentUser?.id || null
    )

    if (result.success) {
      setReviewSuccess(true)
      
      setTimeout(() => {
        setShowReviewModal(false)
        setNewReview({ rating: 5, comment: '' })
        setReviewSuccess(false)
        setReviewError('')
      }, 1500)
    } else {
      setReviewError(result.error)
    }
  }

  // Afficher les etoiles
  const renderStars = (ratingValue, interactive = false, onChange = null) => {
    return (
      <div className="stars-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star-btn ${star <= ratingValue ? 'active' : ''}`}
            onClick={() => interactive && onChange && onChange(star)}
            disabled={!interactive}
          >
            <Star size={interactive ? 24 : 16} fill={star <= ratingValue ? '#FFD700' : 'none'} />
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="product-detail">
      <div className="container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          Retour
        </button>

        <div className="product-layout">
          {/* Images */}
          <motion.div 
            className="product-images"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div 
              className="main-image" 
              onClick={() => product.images.length > 1 && setShowGallery(true)}
              style={{ cursor: product.images.length > 1 ? 'pointer' : 'default' }}
            >
              <img src={product.images[currentImageIndex] || 'https://via.placeholder.com/500'} alt={product.title} />
              {product.images.length > 1 && (
                <>
                  <button className="image-nav prev" onClick={prevImage}>
                    <ChevronLeft size={24} />
                  </button>
                  <button className="image-nav next" onClick={nextImage}>
                    <ChevronRight size={24} />
                  </button>
                  <div className="image-counter">{currentImageIndex + 1} / {product.images.length}</div>
                </>
              )}
            </div>
            <div className="image-thumbnails">
              {product.images.map((img, index) => (
                <button 
                  key={index} 
                  className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                  onClick={() => selectImage(index)}
                >
                  <img src={img} alt={`${product.title} ${index + 1}`} />
                </button>
              ))}
            </div>
          </motion.div>

          {/* Fullscreen Gallery Modal */}
          <AnimatePresence>
            {showGallery && (
              <motion.div 
                className="gallery-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowGallery(false)}
              >
                <button className="gallery-close" onClick={() => setShowGallery(false)}>
                  <X size={32} />
                </button>
                <button className="gallery-nav prev" onClick={prevImage}>
                  <ChevronLeft size={40} />
                </button>
                <div className="gallery-main" onClick={(e) => e.stopPropagation()}>
                  <motion.img 
                    key={currentImageIndex}
                    src={product.images[currentImageIndex]}
                    alt={product.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                  />
                </div>
                <button className="gallery-nav next" onClick={nextImage}>
                  <ChevronRight size={40} />
                </button>
                <div className="gallery-thumbnails">
                  {product.images.map((img, index) => (
                    <button 
                      key={index}
                      className={`gallery-thumb ${index === currentImageIndex ? 'active' : ''}`}
                      onClick={() => selectImage(index)}
                    >
                      <img src={img} alt={`${product.title} ${index + 1}`} />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info */}
          <motion.div 
            className="product-info"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="product-category">{product.category}</div>
            {(() => {
              const promoEnd = product.promotionEndDate ? parseDate(product.promotionEndDate) : null;
              const isActive = product.isPromoted && promoEnd && promoEnd > now;
              
              if (!isActive) return null;

              const diff = promoEnd - now;
              const days = Math.floor(diff / (1000 * 60 * 60 * 24));
              const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span className="badge badge-promoted" style={{ padding: '6px 15px', fontSize: '0.85rem' }}>
                    <Star size={16} fill="currentColor" /> Vedette
                  </span>
                  {(product.sellerId === user?.id || product.sellerId === seller?.id) && (
                    <span className="promotion-timer" style={{ 
                      fontSize: '0.85rem', 
                      background: 'rgba(255, 215, 0, 0.1)', 
                      color: '#FFD700', 
                      padding: '4px 12px', 
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      border: '1px solid rgba(255, 215, 0, 0.3)'
                    }}>
                      Expire dans : {days}j {hours}h
                    </span>
                  )}
                </div>
              );
            })()}
            <h1 className="product-title">{product.title}</h1>
            
            {/* Rating Display */}
            <div className="product-rating">
              {renderStars(Math.round(itemRating.average))}
              <span className="rating-text">
                {itemRating.average > 0 ? `${itemRating.average}/5` : 'Pas encore noté'}
                {itemRating.count > 0 && ` (${itemRating.count} avis)`}
              </span>
              <button 
                className="add-review-btn"
                onClick={() => setShowReviewModal(true)}
              >
                <Star size={14} /> Donner mon avis
              </button>
            </div>
            
            <div className="product-location">
              <MapPin size={18} />
              <span>{product.sellerCity}, {product.sellerNeighborhood}</span>
            </div>

            <div className="product-price">{formatPrice(product.price)}</div>

            {product.type !== 'service' && product.condition && (
              <div className="product-condition-info" style={{ marginBottom: '15px' }}>
                <span style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>État : </span>
                <span className="condition-tag" style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.9rem', color: '#fff' }}>
                  {product.condition}
                </span>
              </div>
            )}

            <p className="product-description">{product.description}</p>

            <div className="seller-info" onClick={() => navigate(`/seller/${product.sellerId}`)} style={{cursor: 'pointer'}}>
              <div className="seller-avatar">
                {product.sellerAvatar ? (
                  <img src={product.sellerAvatar} alt={product.sellerName} />
                ) : (
                  product.sellerName.charAt(0)
                )}
              </div>
              <div className="seller-details">
                <span className="seller-name">{product.sellerName}</span>
                <span className="seller-location">
                  <MapPin size={14} />
                  {product.sellerCity}, {product.sellerNeighborhood}
                </span>
                <span className="seller-products-link">Voir les {product.type === 'service' ? 'services' : 'produits'} du vendeur</span>
              </div>
            </div>

            {product.type === 'service' && (
              <div className="service-details">
                {product.duration && (
                  <div className="service-meta-item">
                    <span className="meta-label">Durée :</span>
                    <span className="meta-value">{product.duration}</span>
                  </div>
                )}
                {product.experience && (
                  <div className="service-meta-item">
                    <span className="meta-label">Expérience :</span>
                    <span className="meta-value">{product.experience}</span>
                  </div>
                )}
              </div>
            )}

            <div className="product-actions">
              <button 
                className="btn btn-primary btn-large"
                onClick={handleAddToCart}
                disabled={addedToCart || (product.type !== 'service' && product.stock <= 0)}
              >
                <ShoppingCart size={20} />
                {product.type === 'service' 
                  ? (addedToCart ? 'Réservé !' : 'Réserver ce service') 
                  : (product.stock !== undefined && product.stock < 1 ? 'Rupture de stock' : (addedToCart ? 'Ajouté !' : 'Ajouter au panier'))
                }
              </button>
              
              <button 
                className="btn btn-outline btn-large buy-now-btn"
                onClick={() => setShowOrderModal(true)}
                disabled={product.type !== 'service' && product.stock <= 0}
              >
                {product.type === 'service' ? 'Réserver maintenant' : 'Acheter maintenant'}
              </button>

              <a 
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-large whatsapp-btn"
              >
                <MessageCircle size={20} />
                Contacter le vendeur
              </a>
            </div>

            <div className="product-meta">
              <button
                className={`meta-btn ${isFavorite(product.id) ? 'active' : ''}`}
                onClick={() => toggleFavorite(product.id)}
              >
                <Heart size={18} fill={isFavorite(product.id) ? '#FF1744' : 'none'} />
                {isFavorite(product.id) ? 'Retirer des favoris' : 'Favoris'}
              </button>
              
              <div className="share-menu">
                <button 
                  className="meta-btn"
                  onClick={handleShare}
                >
                  <Share2 size={18} />
                  Partager
                </button>
                {showShareMenu && (
                  <div className="share-menu-dropdown">
                    <button className="share-option facebook" onClick={shareToFacebook}>
                      <Facebook size={18} />
                      Facebook
                    </button>
                    <button className="share-option whatsapp" onClick={shareToWhatsApp}>
                      <MessageCircle size={18} />
                      WhatsApp
                    </button>
                    <button className="share-option telegram" onClick={shareToTelegram}>
                      <Share2 size={18} />
                      Telegram
                    </button>
                    <button className="share-option copy" onClick={copyToClipboard}>
                      <Copy size={18} />
                      Copier le lien
                    </button>
                  </div>
                )}
              </div>
              
              <button
                className="meta-btn report-btn-premium"
                onClick={() => setShowReportModal(true)}
                title="Signaler"
              >
                <Flag size={18} />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        {itemReviews.length > 0 && (
          <div className="reviews-section">
            <h3>Avis sur ce produit ({itemRating.count})</h3>
            <div className="reviews-list">
              {itemReviews.slice(0, reviewLimit).map((review) => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <div className="reviewer-avatar">{review.reviewerName.charAt(0)}</div>
                      <div>
                        <span className="reviewer-name">{review.reviewerName}</span>
                        <span className="review-date">
                          {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString('fr-FR') : (review.createdAt ? new Date(review.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue')}
                        </span>
                      </div>
                    </div>
                    <div className="review-rating">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  <p className="review-comment">{review.comment}</p>
                </div>
              ))}
            </div>
            {itemReviews.length > reviewLimit && (
              <button className="see-more-reviews" onClick={() => setReviewLimit(prev => prev + 10)}>
                Voir les {itemReviews.length - reviewLimit} autres avis
              </button>
            )}
          </div>
        )}

        {/* Order Modal */}
        {showOrderModal && (
          <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
            <motion.div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h2>Confirmer la commande</h2>
              <div className="modal-product">
                <img src={product.images[0]} alt={product.title} />
                <div>
                  <h3>{product.title}</h3>
                  <p className="modal-price">{formatPrice(product.price)}</p>
                </div>
              </div>
              <form onSubmit={handleOrder}>
                <div className="form-group">
                  <label className="form-label">Nom complet</label>
                  <input
                    type="text"
                    className="form-input"
                    value={orderForm.name}
                    onChange={(e) => setOrderForm({...orderForm, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Téléphone</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="Format: +229XXXXXXXX (Optionnel)"
                    value={orderForm.phone}
                    onChange={(e) => setOrderForm({...orderForm, phone: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Adresse de livraison</label>
                  <textarea
                    className="form-input"
                    value={orderForm.address}
                    onChange={(e) => setOrderForm({...orderForm, address: e.target.value})}
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowOrderModal(false)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Confirmer la commande
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Report Modal */}
        {showReportModal && (
          <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
            <motion.div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h2>Signaler ce produit</h2>
              <p className="modal-description">
                Aidez-nous à maintenir une plateforme sûre en signalant les produits suspects.
              </p>

              <div className="modal-product">
                <img src={product.images[0]} alt={product.title} />
                <div>
                  <h3>{product.title}</h3>
                  <p className="modal-price">{formatPrice(product.price)}</p>
                </div>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault()
                if (reportReason) {
                  const currentUser = user || seller
                  reportProduct(product.id, reportReason, currentUser?.id || 'anonymous')
                  alert('Signalement envoyé! Merci pour votre contribution à la sécurité de la plateforme.')
                  setShowReportModal(false)
                  setReportReason('')
                }
              }}>
                <div className="form-group">
                  <label className="form-label">Motif du signalement</label>
                  <select
                    className="form-input"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    required
                  >
                    <option value="">Sélectionnez un motif</option>
                    {reportReasons.map((reason, index) => (
                      <option key={index} value={reason}>{reason}</option>
                    ))}
                  </select>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowReportModal(false)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-danger">
                    <Flag size={18} />
                    Signaler le produit
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && (
          <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
            <motion.div
              className="modal review-modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="modal-header">
                <h2>Donner mon avis</h2>
                <button className="close-btn" onClick={() => setShowReviewModal(false)}>
                  <X size={24} />
                </button>
              </div>
              
              {reviewSuccess ? (
                <motion.div 
                  className="review-success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="success-icon">✓</div>
                  <h3>Merci pour votre avis!</h3>
                  <p>Votre avis aide les autres acheteurs.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmitReview}>
                  <div className="review-product-summary">
                    <img src={product.images[0]} alt={product.title} />
                    <div>
                      <h4>{product.title}</h4>
                      <p>{formatPrice(product.price)}</p>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Votre note</label>
                    <div className="rating-selection">
                      {renderStars(newReview.rating, true, (star) => {
                        setNewReview({ ...newReview, rating: star })
                      })}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Votre avis</label>
                    <textarea
                      className="form-input"
                      placeholder="Décrivez votre expérience avec ce produit..."
                      value={newReview.comment}
                      onChange={(e) => {
                        setNewReview({ ...newReview, comment: e.target.value })
                        setReviewError('')
                      }}
                      rows={4}
                      required
                    />
                  </div>

                  {reviewError && <div className="error-text">{reviewError}</div>}

                  <div className="modal-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => setShowReviewModal(false)}>
                      Annuler
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <Send size={18} />
                      Publier mon avis
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
