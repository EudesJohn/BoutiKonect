import { Link } from 'react-router-dom'
import { MapPin, Phone } from 'lucide-react'
import './ServiceCard.css'

export default function ServiceCard({ service }) {

  const formatPrice = (price) => {
    if (!price) return "Sur devis";
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(price)
  }

  const whatsappLink = service.whatsapp ? `https://wa.me/${String(service.whatsapp).replace(/\D/g, '')}` : '#';

  return (
    <div className="service-card">
      <div className="service-card-image">
        <img src={service.images?.[0] || 'https://via.placeholder.com/300x200?text=Afritana'} alt={service.title} />
        <span className="service-card-category">{service.category}</span>
      </div>
      <div className="service-card-content">
        <h3 className="service-card-title">{service.title}</h3>
        <div className="service-card-meta">
          <span className="service-card-price">{formatPrice(service.price)}</span>
          <span className="service-card-location">
            <MapPin size={14} /> {service.sellerCity || 'Non spécifié'}
          </span>
        </div>
        <div className="service-card-provider">
          <div className="provider-avatar">
            {service.sellerAvatar ? (
              <img src={service.sellerAvatar} alt={service.sellerName} />
            ) : (
              <span>{service.sellerName?.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <span className="provider-name">{service.sellerName}</span>
        </div>
      </div>
      <div className="service-card-actions">
        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-small">
          <Phone size={16} /> Contacter
        </a>
      </div>
    </div>
  )
}