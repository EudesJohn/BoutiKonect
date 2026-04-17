import { useContext, useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppContext } from '../../context/AppContext'
import { Package, Trash2, ArrowLeft, Eye, Plus, Zap } from 'lucide-react'
import PromoteModal from '../Publish/PromoteModal'
import './MyProducts.css'

export default function MyProducts() {
  const { seller, user, logoutSeller, products, deleteProduct, formatPrice, checkIsAdmin, parseDate } = useContext(AppContext)
  const navigate = useNavigate()
  
  // État pour le modal de promotion
  const [showPromoteModal, setShowPromoteModal] = useState(false)
  const [productToPromote, setProductToPromote] = useState(null)

  useEffect(() => {
    if (!seller && !user) {
      navigate('/login')
    }
  }, [seller, user, navigate])

  const isAdmin = checkIsAdmin(seller) || checkIsAdmin(user)
  const currentId = seller?.id || user?.id
  const sellerProducts = products.filter(p => p.sellerId === currentId)
    .filter(p => p.type === 'product' || !p.type)


  const isLoggedIn = seller || user

  const handlePromoteClick = (product) => {
    setProductToPromote(product)
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
              <Package size={32} />
              <h1>Mes Produits</h1>
              <span className="product-count">({sellerProducts.length})</span>
            </div>
            {seller && (
              <Link to="/publish" className="btn btn-primary">
                <Plus size={20} />
                Publier un produit
              </Link>
            )}
          </div>

          {sellerProducts.length > 0 ? (
            <div className="products-table-wrapper">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Titre</th>
                    <th>Prix</th>
                    <th>Catégorie</th>
                    <th>Stock</th>
                    {seller && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {sellerProducts.map(product => (
                    <tr key={product.id} className="product-row">
                      <td className="product-image-cell">
                        <img 
                          src={product.images[0] || 'https://via.placeholder.com/100'} 
                          alt={product.title}
                        />
                      </td>
                      <td className="product-title-cell">
                        <span className="product-title">{product.title}</span>
                      </td>
                      <td className="product-price-cell">
                        <span className="product-price">{formatPrice(product.price)}</span>
                      </td>
                      <td className="product-category-cell">
                        <span className="product-category">{product.category}</span>
                      </td>
                      <td className="product-stock-cell">
                        <span className="product-stock">{product.stock || 0}</span>
                      </td>
                      {seller && (
                        <td className="product-actions-cell">
                          <div className="action-buttons">
                            <Link to={`/product/${product.id}`} className="btn btn-outline btn-small">
                              <Eye size={16} />
                              Voir
                            </Link>
                            
                            {product.isPromoted && product.promotionEndDate && parseDate(product.promotionEndDate) > new Date() ? (
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
                                    const diff = parseDate(product.promotionEndDate) - new Date();
                                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                    return `Expire dans ${days}j ${hours}h`;
                                  })()}
                                </span>
                              </div>
                            ) : (
                              <button 
                                className="btn btn-highlight btn-small"
                                onClick={() => handlePromoteClick(product)}
                                title="Promouvoir ce produit"
                              >
                                <Zap size={16} />
                                Promouvoir
                              </button>
                            )}
                            
                            <button 
                              className="btn btn-danger btn-small"
                              onClick={() => {
                                if (window.confirm('Voulez-vous supprimer ce produit?')) {
                                  deleteProduct(product.id)
                                }
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-products">
              <Package size={64} />
              <h3>Vous n'avez pas encore de produits</h3>
              <p>Commencez à vendre en publishant votre premier produit!</p>
              {seller ? (
                <Link to="/publish" className="btn btn-primary">
                  <Plus size={20} />
                  Publier un produit
                </Link>
              ) : (
                <Link to="/register" className="btn btn-primary">
                  Devenir vendeur
                </Link>
              )}
            </div>
          )}
        </motion.div>
        
        {/* Modal de promotion de produit */}
        {showPromoteModal && productToPromote && (
          <PromoteModal
            product={productToPromote}
            onClose={() => {
              setShowPromoteModal(false)
              setProductToPromote(null)
            }}
          />
        )}
      </div>
    </div>
  )
}
