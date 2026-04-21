
import { Link } from 'react-router-dom'
import { useContext, useState } from 'react'
import { motion } from 'framer-motion'
import { AppContext } from '../../context/AppContext'
import { MapPin, Heart, ShoppingCart, MessageCircle, Eye, Star, X, Zap } from 'lucide-react'
import './ProductCard.css'

import { useEffect } from 'react'

export default function ProductCard({ product, showViews }) {
  const { addToCart, toggleFavorite, isFavorite, formatPrice, parseDate, user, seller } = useContext(AppContext)
  const [now, setNow] = useState(new Date())
  const favorite = isFavorite(product.id)

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date())
    }, 60000) // Update every minute
    return () => clearInterval(timer)
  }, [])


  const handleFavoriteClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(product.id)
  }

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  // Generate WhatsApp message URL (same logic as ProductDetail)
  const whatsappMessage = `Bonjour, je suis intéressé(e) par le produit "${product.title}" au prix de ${formatPrice(product.price)}. Est-il encore disponible?`
  
  // Use fallback: whatsapp → sellerPhone → phone (same as ProductDetail)
  const vendorPhone = product.whatsapp || product.sellerPhone || product.phone || ''
  
  // URL WhatsApp - use the vendor's number
  const whatsappUrl = vendorPhone 
    ? `https://wa.me/${vendorPhone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`

  const [isZoomed, setIsZoomed] = useState(false)

  // Get view count from analytics (stored in product for simplicity)
  const viewCount = product.views || 0

  return (
    <>
      <div className="product-card">
        <div className="product-image">
          <div onClick={() => setIsZoomed(true)} style={{ cursor: 'zoom-in' }}>
            <img 
              src={product.images[0] || 'https://via.placeholder.com/300'} 
              alt={product.title}
            />
          </div>
            <div className="product-badges">
              {product.type === 'service' && <span className="badge badge-service">Service</span>}
              
              {(() => {
                const promoEnd = product.promotion_end_date ? parseDate(product.promotion_end_date) : null;
                const isPromoted = product.is_promoted === true || product.is_promoted === 'true';
                const isActive = isPromoted && promoEnd && promoEnd > now;
                
                if (!isActive) return null;

                const diff = (promoEnd - now);
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 5 }}>
                    <span className="badge badge-promoted">
                      <Star size={12} fill="currentColor" />
                      Vedette
                    </span>
                    {(product.seller_id === user?.id || product.seller_id === seller?.id) && (
                      <span className="promotion-timer" style={{ 
                        fontSize: '9px', 
                        background: 'rgba(0,0,0,0.7)', 
                        color: '#FFD700', 
                        padding: '2px 6px', 
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        backdropFilter: 'blur(4px)',
                        textAlign: 'center'
                      }}>
                        {days}j {hours}h
                      </span>
                    )}
                  </div>
                );
              })()}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {(() => {
                  const createdDate = parseDate(product.created_at);
                  const diffInDays = (now - createdDate) / (1000 * 60 * 60 * 24);
                  if (diffInDays <= 3) {
                    return <span className="badge badge-primary">Nouveau</span>
                  }
                  return null;
                })()}
                
                {product.type !== 'service' && product.stock <= 0 && (
                  <span className="badge badge-danger">Rupture</span>
                )}
              </div>
            </div>
          <button 
            className={`wishlist-btn ${favorite ? 'active' : ''}`}
            onClick={handleFavoriteClick}
          >
            <Heart size={18} fill={favorite ? '#FF1744' : 'none'} />
          </button>
          
          <div className="image-zoom-hint" onClick={() => setIsZoomed(true)}>
            <Eye size={14} />
            <span>Zoom</span>
          </div>

          {showViews && viewCount > 0 && (
            <div className="product-views">
              <Eye size={14} />
              <span>{viewCount}</span>
            </div>
          )}
        </div>
        
        <div className="product-content">
          <div className="product-category">{product.category}</div>
          <Link to={product.type === 'service' ? `/service/${product.id}` : `/product/${product.id}`} className="product-title">
            {product.title}
          </Link>
          
          {product.type === 'service' && (product.experience || product.duration) && (
            <div className="service-extra-info" style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: '#10b981', marginBottom: '8px', fontWeight: '600' }}>
              {product.experience && <span>Experience: {product.experience}</span>}
              {product.duration && <span>Durée: {product.duration}</span>}
            </div>
          )}

          <p className="product-description">
            {product.description ? product.description.substring(0, 60) + '...' : 'Aucune description disponible'}
          </p>
          
          <div className="product-location">
            <MapPin size={14} />
            <span>{product.sellerCity}, {product.sellerNeighborhood}</span>
          </div>
          
          <div className="product-price">
            {product.type === 'service' ? (
              product.priceType === 'Devis' || !product.price ? (
                <span className="price-devis" style={{ color: '#00A2E8' }}>Sur Devis</span>
              ) : (
                <>
                  <span className="price-label">À partir de </span>
                  <span className="price-amount">{formatPrice(product.price)}</span>
                  {product.priceType && product.priceType !== 'Fixe' && (
                    <span className="price-unit" style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginLeft: '2px' }}>
                      {product.priceType.startsWith('/') ? product.priceType : `/${product.priceType}`}
                    </span>
                  )}
                </>
              )
            ) : (
              formatPrice(product.price)
            )}
          </div>
          
          <div className="product-actions">
            {product.type === 'service' ? (
              <Link 
                to={`/service/${product.id}`}
                className="btn btn-primary btn-small"
                onClick={scrollToTop}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
              >
                <Zap size={16} /> Réserver
              </Link>
            ) : (
              <button 
                className="btn btn-primary btn-small"
                onClick={() => {
                  addToCart(product)
                  scrollToTop()
                }}
                disabled={product.stock <= 0}
              >
                <ShoppingCart size={16} />
                {product.stock > 0 ? 'Ajouter' : 'Indisponible'}
              </button>
            )}
            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-small"
            >
              <MessageCircle size={16} />
              Message
            </a>
          </div>
        </div>
      </div>

      {/* Lightbox / Zoom Modal */}
      {isZoomed && (
        <div 
          className="product-zoom-overlay"
          onClick={() => setIsZoomed(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.9)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%' }}
          >
            <img 
              src={product.images[0] || 'https://via.placeholder.com/300'} 
              alt={product.title} 
              style={{ width: 'auto', height: 'auto', maxWidth: '90vw', maxHeight: '90vh', borderRadius: '8px', boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}
            />
            <button 
              onClick={() => setIsZoomed(false)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} color="#000" />
            </button>
          </motion.div>
        </div>
      )}
    </>
  )
}

