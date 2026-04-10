import { useContext, useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppContext } from '../../context/AppContext'
import { Briefcase, Trash2, ArrowLeft, Eye, Plus, Zap } from 'lucide-react'
import PromoteModal from '../Publish/PromoteModal'
import '../MyProducts/MyProducts.css'

export default function MyServices() {
  const { seller, user, services, deleteService, parseDate, formatPrice, checkIsAdmin } = useContext(AppContext)
  const navigate = useNavigate()
  
  // État pour le modal de promotion
  const [showPromoteModal, setShowPromoteModal] = useState(false)
  const [serviceToPromote, setServiceToPromote] = useState(null)

  useEffect(() => {
    if (!seller && !user) {
      navigate('/login')
    }
  }, [seller, user, navigate])

  const isAdmin = checkIsAdmin(seller) || checkIsAdmin(user)
  const sellerServices = services.filter(s => s.sellerId === (seller?.id || user?.id))


  const isLoggedIn = seller || user

  const handlePromoteClick = (service) => {
    setServiceToPromote(service)
    setShowPromoteModal(true)
  }

  if (!isLoggedIn) {
    return null
  }

  return (
    <div className="my-products-page">
      <div className="container">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
          Retour
        </button>

        <motion.div 
          className="my-products-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="my-products-header">
            <div className="header-info">
              <Briefcase size={32} />
              <h1>Mes Services</h1>
              <span className="product-count">({sellerServices.length})</span>
            </div>
            {(seller || user) && (
              <Link to="/publish?type=service" className="btn btn-primary">
                <Plus size={20} />
                Publier un service
              </Link>
            )}
          </div>

          {sellerServices.length > 0 ? (
            <div className="products-table-wrapper">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Titre</th>
                    <th>Prix</th>
                    <th>Catégorie</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sellerServices.map(service => (
                    <tr key={service.id} className="product-row">
                      <td className="product-image-cell">
                        <img 
                          src={service.images && service.images[0] ? service.images[0] : 'https://via.placeholder.com/100'} 
                          alt={service.title}
                        />
                      </td>
                      <td className="product-title-cell">
                        <span className="product-title">{service.title}</span>
                      </td>
                      <td className="product-price-cell">
                        <span className="product-price">
                          {service.priceType === 'Devis' ? 'Sur Devis' : formatPrice(service.price)}
                        </span>
                      </td>
                      <td className="product-category-cell">
                        <span className="product-category">{service.category}</span>
                      </td>
                      <td className="product-actions-cell">
                        <div className="action-buttons">
                          <Link to={`/services?search=${encodeURIComponent(service.title)}`} className="btn btn-outline btn-small">
                            <Eye size={16} />
                            Voir
                          </Link>

                          {service.isPromoted && service.promotionEndDate && parseDate(service.promotionEndDate) > new Date() ? (
                            <div className="promotion-badge-active" style={{ 
                              background: 'rgba(255, 215, 0, 0.1)', 
                              border: '1px solid #FFD700', 
                              borderRadius: '4px', 
                              padding: '4px 8px', 
                              fontSize: '11px', 
                              display: 'flex', 
                              flexDirection: 'column', 
                              alignItems: 'center',
                              minWidth: '80px'
                            }}>
                              <span style={{ color: '#FFD700', fontWeight: 'bold' }}>En Vedette</span>
                              <span style={{ color: '#aaa' }}>
                                {(() => {
                                  const diff = parseDate(service.promotionEndDate) - new Date();
                                  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                  return `Expire dans ${days}j ${hours}h`;
                                })()}
                              </span>
                            </div>
                          ) : (
                            <button 
                              className="btn btn-highlight btn-small"
                              onClick={() => handlePromoteClick(service)}
                              title="Promouvoir ce service"
                            >
                              <Zap size={16} />
                                Promouvoir
                            </button>
                          )}
                          
                          <button 
                            className="btn btn-danger btn-small"
                            onClick={() => {
                              if (window.confirm('Voulez-vous supprimer ce service?')) {
                                deleteService(service.id)
                              }
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-products">
              <Briefcase size={64} />
              <h3>Vous n'avez pas encore de services</h3>
              <p>Commencez à proposer vos compétences en publiant votre premier service!</p>
              <Link to="/publish?type=service" className="btn btn-primary">
                <Plus size={20} />
                Publier un service
              </Link>
            </div>
          )}
        </motion.div>
        
        {/* Modal de promotion de service */}
        {showPromoteModal && serviceToPromote && (
          <PromoteModal
            product={serviceToPromote} // PromoteModal reuses "product" prop
            onClose={() => {
              setShowPromoteModal(false)
              setServiceToPromote(null)
            }}
          />
        )}
      </div>
    </div>
  )
}
