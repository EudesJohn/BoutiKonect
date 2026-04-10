import { useState, useContext, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, Heart, MessageCircle, Eye, Star, Briefcase, Zap } from 'lucide-react'
import { AppContext } from '../../context/AppContext'
import { getItemRating } from '../../services/reviewsService'
import './ServiceCard.css'

export default function ServiceCard({ service }) {
  const { isFavorite, toggleFavorite, formatPrice, addToCart, parseDate, user, seller } = useContext(AppContext)
  const [rating, setRating] = useState({ average: 0, count: 0 })
  const favorite = isFavorite(service.id)

  useEffect(() => {
    const fetchRating = async () => {
      const result = await getItemRating(service.id)
      setRating(result)
    }
    fetchRating()
  }, [service.id])

  const handleFavoriteClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(service.id)
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Get first image or fallback
  const displayImage = service.images && service.images.length > 0 
    ? service.images[0] 
    : 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500'

  // WhatsApp logic
  const whatsappMessage = `Bonjour, je suis intéressé(e) par votre service "${service.title}". Pourriez-vous me donner plus de détails?`
  const vendorPhone = service.whatsapp || ''
  const whatsappUrl = vendorPhone 
    ? `https://wa.me/${vendorPhone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`

  return (
    <div className={`service-card ${service.isPromoted ? 'promoted' : ''}`}>
      <div className="service-image">
        <Link to={`/service/${service.id}`}>
          <img 
            src={displayImage} 
            alt={service.title}
          />
        </Link>
        <div className="service-badges">
          <span className="badge badge-service">Service</span>
          {(service.isPromoted && service.promotionEndDate && parseDate(service.promotionEndDate) > new Date()) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span className="badge badge-promoted">
                <Star size={12} fill="currentColor" />
                Vedette
              </span>
              {(service.sellerId === user?.id || service.sellerId === seller?.id) && (
                <span className="promotion-timer" style={{ 
                  fontSize: '9px', 
                  background: 'rgba(0,0,0,0.6)', 
                  color: '#FFD700', 
                  padding: '2px 6px', 
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  backdropFilter: 'blur(4px)'
                }}>
                  {(() => {
                    const diff = parseDate(service.promotionEndDate) - new Date();
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    return `${days}j ${hours}h`;
                  })()}
                </span>
              )}
            </div>
          )}
          {(() => {
            const createdDate = parseDate(service.createdAt);
            const now = new Date();
            const diffInDays = (now - createdDate) / (1000 * 60 * 60 * 24);
            if (diffInDays <= 3) {
              return <span className="badge badge-primary">Nouveau</span>
            }
            return null;
          })()}
        </div>
        <button 
          className={`wishlist-btn ${favorite ? 'active' : ''}`}
          onClick={handleFavoriteClick}
        >
          <Heart size={18} fill={favorite ? '#FF1744' : 'none'} />
        </button>
      </div>
      
      <div className="service-content">
        <div className="service-category">{service.category}</div>
        <Link to={`/service/${service.id}`} className="service-title">
          {service.title}
        </Link>
        
        {rating.count > 0 && (
          <div className="service-rating-display">
            <Star size={12} fill="#FFD700" color="#FFD700" />
            <span>{rating.average} ({rating.count})</span>
          </div>
        )}

        <p className="service-description">
          {service.description ? service.description.substring(0, 60) + '...' : 'Aucune description disponible'}
        </p>
        
        <div className="service-location">
          <MapPin size={14} />
          <span>{service.sellerCity}{service.sellerNeighborhood ? `, ${service.sellerNeighborhood}` : ''}</span>
        </div>
        
        <div className="service-price">
          {service.priceType === 'Devis' ? (
            <span className="price-devis">Sur Devis</span>
          ) : (
            <>
              <span className="price-amount">{formatPrice(service.price)}</span>
              {service.priceType && <span className="price-unit">/{service.priceType}</span>}
            </>
          )}
        </div>
        
        <div className="service-actions">
          <button 
            className="btn btn-primary btn-small"
            onClick={() => {
              addToCart(service)
              scrollToTop()
            }}
          >
            <Zap size={16} />
            Réserver
          </button>
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
  )
}
