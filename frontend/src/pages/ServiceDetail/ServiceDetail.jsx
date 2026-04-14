import { useState, useContext, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AppContext } from '../../context/AppContext'
import { getItemReviews, getItemRating, addReview } from '../../services/reviewsService'
import { 
  MapPin, Clock, ShieldCheck, MessageCircle, Phone, 
  Share2, AlertTriangle, ArrowLeft, Star, ChevronLeft, ChevronRight, X, Heart, Send,
  Flag, Facebook, Copy
} from 'lucide-react'
import './ServiceDetail.css'

export default function ServiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getServiceById, user, seller, toggleFavorite, isFavorite, reviews: allReviews, createOrder, reportProduct, formatPrice } = useContext(AppContext)
  
  const currentUser = user || seller
  const [service, setService] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [now, setNow] = useState(new Date())
  const [reportReason, setReportReason] = useState('')
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' })
  const [orderForm, setOrderForm] = useState({ name: '', phone: '', details: '', location: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [submittingOrder, setSubmittingOrder] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [reviewLimit, setReviewLimit] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const parseDate = (dateValue) => {
    if (!dateValue) return new Date();
    if (typeof dateValue === 'object' && dateValue.toDate) {
      return dateValue.toDate();
    }
    if (dateValue.seconds) {
      return new Date(dateValue.seconds * 1000);
    }
    return new Date(dateValue);
  }

  const reportReasons = [
    "Contenu inapproprié ou offensant",
    "Service mensonger ou frauduleux",
    "Prix ne correspondant pas à la réalité",
    "Contrefaçon ou violation de propriété",
    "Autre"
  ]

  // Filtrer les avis pour ce service
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

  const favorite = isFavorite(id)
  const isOwner = currentUser && service && currentUser.id === service.sellerId

  useEffect(() => {
    window.scrollTo(0, 0)
    const foundService = getServiceById(id)
    if (foundService) {
      setService(foundService)
    }
    setLoading(false)
  }, [id, getServiceById])

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: service.title,
        text: `Découvrez ce service: ${service.title} sur BoutiKonect.bj`,
        url: window.location.href
      })
      .catch((err) => {
        if (err.name !== 'AbortError') console.log('Erreur de partage:', err)
      })
    } else {
      setShowShareMenu(!showShareMenu)
    }
  }

  const shareToFacebook = () => {
    const url = encodeURIComponent(window.location.href)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank')
    setShowShareMenu(false)
  }

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`Découvrez ce service: ${service.title}\n${window.location.href}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
    setShowShareMenu(false)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      alert('Lien copié dans le presse-papiers!')
    } catch {
      alert('Erreur lors de la copie du lien.')
    }
    setShowShareMenu(false)
  }

  const handleToggleFavorite = () => {
    toggleFavorite(id)
  }

  const handleAddReview = async (e) => {
    e.preventDefault()
    if (!currentUser) {
      navigate('/login')
      return
    }
    
    setSubmittingReview(true)
    const result = await addReview(
      id,
      currentUser.name,
      newReview.rating,
      newReview.comment,
      currentUser.id
    )
    
    setSubmittingReview(false)
    if (result.success) {
      setReviewSuccess(true)
      setNewReview({ rating: 5, comment: '' })
      setTimeout(() => {
        setShowReviewModal(false)
        setReviewSuccess(false)
      }, 2000)
    } else {
      alert(result.error || "Erreur lors de l'ajout de l'avis")
    }
  }

  const handleOrderService = async (e) => {
    e.preventDefault()
    setSubmittingOrder(true)
    
    const orderData = {
      type: 'service',
      serviceId: id,
      serviceTitle: service.title,
      price: service.price,
      priceType: service.priceType,
      sellerId: service.sellerId,
      sellerName: service.sellerName,
      buyerId: currentUser?.id || 'guest',
      buyerName: orderForm.name,
      buyerPhone: orderForm.phone,
      details: orderForm.details,
      location: orderForm.location,
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    const result = await createOrder(orderData)
    setSubmittingOrder(false)
    
    if (result && result.success) {
      setOrderSuccess(true)
      
      // WhatsApp Redirect
      if (service.whatsapp) {
        const message = `Bonjour ${service.sellerName}, je viens de confirmer ma prestation pour "${service.title}" sur BoutiKonect.\n\nClient: ${orderForm.name}\nTel: ${orderForm.phone}\nLieu: ${orderForm.location}\nBesoin: ${orderForm.details}`
        const whatsappUrl = `https://wa.me/${service.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
        
        setTimeout(() => {
          window.open(whatsappUrl, '_blank')
        }, 1500)
      }

      setTimeout(() => {
        setShowOrderModal(false)
        setOrderSuccess(false)
        setOrderForm({ name: '', phone: '', details: '', location: '' })
      }, 3000)
    } else {
      alert("Erreur lors de l'envoi de la commande.")
    }
  }

  const displayImages = service?.images && service.images.length > 0
    ? service.images
    : ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80']

  if (loading) return <div className="container service-detail-loading"><div className="loading-spinner"></div></div>
  if (!service) return <div className="container service-not-found"><h2>Service non trouvé</h2><button className="btn btn-primary" onClick={() => navigate('/services')}>Retour aux services</button></div>

  return (
    <div className="service-detail-page">
      <div className="container">
        <div className="detail-top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button className="back-button" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} /> Retour
          </button>
            <div className="detail-top-actions" style={{ display: 'flex', gap: '16px', position: 'relative' }}>
            <button className={`icon-btn favorite-btn-premium ${favorite ? 'active' : ''}`} onClick={handleToggleFavorite}>
              <Heart size={24} fill={favorite ? 'white' : 'none'} color={favorite ? 'white' : 'currentColor'} />
            </button>
            <div style={{ position: 'relative' }}>
              <button className="icon-btn share-btn-premium" onClick={handleShare}>
                <Share2 size={24} />
              </button>
              {showShareMenu && (
                <div className="share-menu-dropdown" style={{ 
                  position: 'absolute', top: '100%', right: 0, background: '#1e2a4a', 
                  borderRadius: '12px', padding: '10px', minWidth: '180px', zIndex: 100, 
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)', marginTop: '10px', border: '1px solid rgba(255,255,255,0.1)' 
                }}>
                  <button onClick={shareToFacebook} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                    <Facebook size={18} /> Facebook
                  </button>
                  <button onClick={shareToWhatsApp} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                    <MessageCircle size={18} /> WhatsApp
                  </button>
                  <button onClick={copyToClipboard} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                    <Copy size={18} /> Copier le lien
                  </button>
                </div>
              )}
            </div>
            <button className="icon-btn report-btn-premium" onClick={() => setShowReportModal(true)}>
              <Flag size={24} />
            </button>
          </div>
        </div>

        <div className="service-detail-grid">
          {/* Photos */}
          <div className="service-gallery">
            <div 
              className="service-main-image"
              onClick={() => displayImages.length > 1 && setShowGallery(true)}
              style={{ cursor: displayImages.length > 1 ? 'pointer' : 'default' }}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  src={displayImages[currentImageIndex]}
                  alt={`${service.title} - ${currentImageIndex + 1}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>
              
              {displayImages.length > 1 && (
                <>
                  <button className="gallery-nav prev" onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1)); }}><ChevronLeft size={24} /></button>
                  <button className="gallery-nav next" onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1)); }}><ChevronRight size={24} /></button>
                  <div className="image-counter" style={{ position: 'absolute', bottom: '15px', right: '15px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>
                    {currentImageIndex + 1} / {displayImages.length}
                  </div>
                </>
              )}
            </div>
            {displayImages.length > 1 && (
              <div className="service-thumbnails" style={{ display: 'flex', gap: '10px', marginTop: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                {displayImages.map((img, index) => (
                  <button 
                    key={index} 
                    onClick={() => setCurrentImageIndex(index)}
                    style={{ 
                      width: '70px', height: '70px', borderRadius: '8px', overflow: 'hidden', border: index === currentImageIndex ? '2px solid var(--primary)' : '2px solid transparent', 
                      padding: 0, flexShrink: 0, cursor: 'pointer', background: 'none'
                    }}
                  >
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fullscreen Gallery Modal */}
          <AnimatePresence>
            {showGallery && (
              <motion.div 
                className="gallery-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowGallery(false)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}
              >
                <button style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'white' }} onClick={() => setShowGallery(false)}><X size={40} /></button>
                <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '80vh' }} onClick={(e) => e.stopPropagation()}>
                  <img src={displayImages[currentImageIndex]} alt="" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px', objectFit: 'contain' }} />
                  <button className="gallery-nav prev" onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1))} style={{ left: '-60px' }}><ChevronLeft size={48} /></button>
                  <button className="gallery-nav next" onClick={() => setCurrentImageIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1))} style={{ right: '-60px' }}><ChevronRight size={48} /></button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Service Info */}
          <div className="service-info-section">
            <div className="service-header-info">
              <span className="service-category">{service.category}</span>
              {(() => {
                const promoEnd = service.promotionEndDate ? parseDate(service.promotionEndDate) : null;
                const isActive = service.isPromoted && promoEnd && promoEnd > now;
                
                if (!isActive) return null;

                const diff = promoEnd - now;
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <span className="badge badge-promoted" style={{ padding: '6px 15px', fontSize: '0.85rem' }}>
                      <Star size={16} fill="currentColor" /> Vedette
                    </span>
                    {isOwner && (
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
              <h1 className="service-title-lg">{service.title}</h1>
              
              <div className="service-rating-summary" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#FFD700' }}>
                <Star fill={itemRating.count > 0 ? "#FFD700" : "none"} size={20} />
                <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>
                  {itemRating.count > 0 ? `${itemRating.average} (${itemRating.count} avis)` : "Aucun avis"}
                </span>
                {!isOwner && (
                  <button className="noter-btn-premium" onClick={() => setShowReviewModal(true)}>
                    <Star size={16} fill="currentColor" /> Noter ce service
                  </button>
                )}
              </div>

              <div className="service-price-lg">
                {service.priceType === 'Devis' ? <span className="price-devis-lg">Sur Devis</span> : <><span className="amount-lg">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(service.price)}</span>{service.priceType && <span className="unit-lg">/ {service.priceType}</span>}</>}
              </div>
            </div>

            <div className="service-essential-details">
              <div className="detail-item"><MapPin size={20} className="detail-icon" /><div><span className="detail-label">Se situe à</span><span className="detail-value">{service.sellerCity}{service.sellerNeighborhood ? `, ${service.sellerNeighborhood}` : ''}</span></div></div>
              {service.experience && <div className="detail-item"><Clock size={20} className="detail-icon" /><div><span className="detail-label">Expérience</span><span className="detail-value">{service.experience}</span></div></div>}
            </div>

            <div className="service-actions">
              {isOwner ? (
                <div className="owner-actions"><p className="owner-badge">Ceci est votre annonce</p><button className="btn btn-outline" onClick={() => navigate('/publish')}>Modifier</button></div>
              ) : (
                <div className="contact-actions">
                  <button className="btn btn-primary btn-large contact-btn" onClick={() => setShowOrderModal(true)}><ShieldCheck size={20} />Confirmer la prestation</button>
                  {service.whatsapp && (
                    <button 
                      className="btn btn-whatsapp btn-large contact-btn" 
                      onClick={() => window.open(`https://wa.me/${service.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${service.sellerName}, je suis intéressé par votre service "${service.title}" vu sur BoutiKonect.`)}`, '_blank')}
                    >
                      <Phone size={20} />WhatsApp
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="seller-mini-profile">
              <h3>À propos du prestataire</h3>
              <div className="seller-mini-content">
                <Link to={`/seller/${service.sellerId}`} className="seller-avatar-large">{service.sellerAvatar ? <img src={service.sellerAvatar} alt={service.sellerName} /> : <span>{service.sellerName?.charAt(0) || '?'}</span>}</Link>
                <div className="seller-mini-info"><Link to={`/seller/${service.sellerId}`} className="seller-mini-name">{service.sellerName}{service.sellerVerified && <ShieldCheck size={16} className="verified-icon" />}</Link></div>
                <Link to={`/seller/${service.sellerId}`} className="btn btn-outline btn-small view-profile-btn">Voir profil</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="service-full-description" style={{ marginTop: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Avis clients ({itemReviews.length})</h2>
            <button className="noter-btn-premium" onClick={() => setShowReviewModal(true)}>
              <Star size={16} fill="currentColor" /> Donner mon avis
            </button>
          </div>
          {itemReviews.length > 0 ? (
            <div className="reviews-list" style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
              {itemReviews.slice(0, reviewLimit).map((rev) => (
                <div key={rev.id} className="review-item" style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {rev.reviewerName?.charAt(0)}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: '700', color: '#FFD700' }}>{rev.reviewerName}</span>
                        <span style={{ fontSize: '0.75rem', color: '#8fa3bf' }}>
                          {rev.createdAt?.toDate ? rev.createdAt.toDate().toLocaleDateString('fr-FR') : (rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue')}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', color: '#FFD700' }}>{[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < rev.rating ? "#FFD700" : "none"} />)}</div>
                  </div>
                  <p style={{ color: '#8fa3bf', fontSize: '0.95rem' }}>{rev.comment}</p>
                </div>
              ))}
              {itemReviews.length > reviewLimit && (
                <button className="btn btn-outline" onClick={() => setReviewLimit(prev => prev + 10)} style={{ marginTop: '10px' }}>Afficher plus d'avis</button>
              )}
            </div>
          ) : (
            <p className="no-reviews" style={{ color: '#8fa3bf', fontStyle: 'italic', marginTop: '10px' }}>Aucun avis pour le moment.</p>
          )}
        </div>

        {/* Order Modal */}
        <AnimatePresence>
          {showOrderModal && (
            <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <motion.div 
                className="modal-content"
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                style={{ background: '#1e2a4a', padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '500px', position: 'relative' }}
              >
                <button className="close-modal" onClick={() => setShowOrderModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#8fa3bf', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
                <h2 style={{ color: 'var(--primary)', marginBottom: '10px' }}>Confirmer la prestation</h2>
                <p style={{ color: '#8fa3bf', marginBottom: '20px', fontSize: '0.9rem' }}>
                  Veuillez remplir ces informations pour confirmer votre demande au prestataire.
                </p>

                {orderSuccess ? (
                  <div style={{ textAlign: 'center', padding: '30px 0' }}>
                    <div style={{ width: '64px', height: '64px', background: 'rgba(0, 200, 83, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                      <ShieldCheck size={40} color="#00C853" />
                    </div>
                    <h3 style={{ color: '#00C853', marginBottom: '10px' }}>Demande confirmée !</h3>
                    <p style={{ color: '#8fa3bf' }}>Votre demande a été envoyée. Vous allez être redirigé vers WhatsApp...</p>
                  </div>
                ) : (
                  <form onSubmit={handleOrderService}>
                    <div className="form-group" style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', color: '#8fa3bf', fontSize: '0.85rem' }}>Votre Nom Complet</label>
                      <input 
                        type="text" 
                        required 
                        value={orderForm.name}
                        onChange={(e) => setOrderForm({...orderForm, name: e.target.value})}
                        placeholder="Ex: Jean Dupont"
                        style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white' }} 
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', color: '#8fa3bf', fontSize: '0.85rem' }}>Téléphone (WhatsApp)</label>
                      <input 
                        type="tel" 
                        required 
                        value={orderForm.phone}
                        onChange={(e) => setOrderForm({...orderForm, phone: e.target.value})}
                        placeholder="Ex: +229 01..."
                        style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white' }} 
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', color: '#8fa3bf', fontSize: '0.85rem' }}>Votre Ville / Quartier</label>
                      <input 
                        type="text" 
                        required 
                        value={orderForm.location}
                        onChange={(e) => setOrderForm({...orderForm, location: e.target.value})}
                        placeholder="Ex: Cotonou, Akpakpa"
                        style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white' }} 
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', color: '#8fa3bf', fontSize: '0.85rem' }}>Détails de votre besoin</label>
                      <textarea 
                        required 
                        value={orderForm.details}
                        onChange={(e) => setOrderForm({...orderForm, details: e.target.value})}
                        placeholder="Décrivez brièvement ce dont vous avez besoin..."
                        style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', minHeight: '80px', resize: 'vertical' }} 
                      />
                    </div>
                    <button type="submit" disabled={submittingOrder} className="btn btn-primary btn-large" style={{ width: '100%' }}>
                      {submittingOrder ? <div className="loading-spinner-small"></div> : "Confirmer et Contacter"}
                    </button>
                  </form>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Review Modal */}
        {showReviewModal && (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="modal-content" style={{ background: '#1e2a4a', padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '500px', position: 'relative' }}>
              <button className="close-modal" onClick={() => setShowReviewModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#8fa3bf', cursor: 'pointer' }}><X size={24} /></button>
              <h2 style={{ color: '#FF6A00', marginBottom: '20px' }}>Noter ce service</h2>
              {reviewSuccess ? (
                <div style={{ textAlign: 'center', padding: '20px' }}><Star size={48} color="#00C853" style={{ marginBottom: '10px' }} /><p style={{ color: '#00C853', fontWeight: '600' }}>Merci pour votre avis !</p></div>
              ) : (
                <form onSubmit={handleAddReview}>
                  <div className="rating-select" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '25px' }}>
                    {[1, 2, 3, 4, 5].map(num => (
                      <button key={num} type="button" onClick={() => setNewReview({ ...newReview, rating: num })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: num <= newReview.rating ? '#FFD700' : '#8fa3bf' }}>
                        <Star size={32} fill={num <= newReview.rating ? '#FFD700' : 'none'} />
                      </button>
                    ))}
                  </div>
                  <textarea value={newReview.comment} onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })} placeholder="Partagez votre expérience..." required style={{ width: '100%', padding: '15px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', minHeight: '120px', marginBottom: '20px' }} />
                  <button type="submit" disabled={submittingReview} className="btn btn-primary btn-large" style={{ width: '100%' }}>
                    {submittingReview ? "Envoi..." : "Envoyer mon avis"}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}

        {/* Report Modal */}
        {showReportModal && (
          <div className="modal-overlay" onClick={() => setShowReportModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div 
              className="modal" 
              onClick={(e) => e.stopPropagation()} 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              style={{ background: '#1a2236', padding: '30px', borderRadius: '24px', width: '100%', maxWidth: '500px', position: 'relative' }}
            >
              <button className="close-modal" onClick={() => setShowReportModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#8fa3bf' }}><X size={24} /></button>
              <h2 style={{ color: '#ff4d4d', marginBottom: '15px' }}><Flag size={24} style={{ marginRight: '10px' }} /> Signaler ce service</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (reportReason) {
                  await reportProduct(service.id, reportReason, currentUser?.id || 'anonymous');
                  alert('Signalement envoyé avec succès.');
                  setShowReportModal(false);
                  setReportReason('');
                }
              }}>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', color: '#8fa3bf' }}>Motif du signalement</label>
                  <select 
                    value={reportReason} 
                    onChange={(e) => setReportReason(e.target.value)} 
                    required 
                    style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', color: 'white', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <option value="">Sélectionnez un motif</option>
                    {reportReasons.map((r, i) => <option key={i} value={r}>{r}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn btn-danger btn-large" style={{ width: '100%' }}>Envoyer le signalement</button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
