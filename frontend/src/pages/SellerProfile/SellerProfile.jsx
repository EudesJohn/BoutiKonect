
import { useContext, useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppContext } from '../../context/AppContext'
import { MapPin, Package, MessageCircle, ArrowLeft, Store, Eye, Users, DollarSign, TrendingUp, ShoppingCart, Briefcase } from 'lucide-react'
import ProductCard from '../../components/ProductCard/ProductCard'
import ServiceCard from '../../components/ServiceCard/ServiceCard'
import { generateMockAnalytics } from '../../services/analyticsService'
import './SellerProfile.css'

export default function SellerProfile() {
  const { sellerId } = useParams()
  const navigate = useNavigate()
  const { products, services, allUsers, user, seller, orders } = useContext(AppContext)
  const [analytics, setAnalytics] = useState(null)
  const [activeTab, setActiveTab] = useState('products')

  // Get seller info
  let sellerInfo = allUsers.find(u => u.id === sellerId)
  
  if (!sellerInfo && sellerId) {
    sellerInfo = allUsers.find(u => u.name && u.name.toLowerCase() === sellerId.toLowerCase().replace(/-/g, ' '))
  }

  // Get seller's products
  let sellerProducts = []
  if (sellerInfo) {
    sellerProducts = products.filter(p => 
      (p.sellerId === sellerId || 
      (p.sellerName && p.sellerName.toLowerCase() === sellerInfo.name?.toLowerCase())) &&
      (p.type === 'product' || !p.type)
    )
  }

  if (sellerProducts.length === 0 && sellerId) {
    const decodedName = decodeURIComponent(sellerId).replace(/-/g, ' ')
    sellerProducts = products.filter(p => 
      p.sellerName && p.sellerName.toLowerCase().includes(decodedName.toLowerCase())
    )
  }

  // Get seller's services
  const sellerServices = services.filter(s => 
    s.sellerId === sellerId || 
    (s.sellerName && s.sellerName.toLowerCase() === sellerInfo?.name?.toLowerCase())
  )

  const currentUser = user || seller
  const isOwner = currentUser && (currentUser.id === sellerId || currentUser.email === sellerInfo?.email)

  // Create placeholder sellerInfo if not found
  if (!sellerInfo && sellerProducts.length > 0) {
    sellerInfo = {
      name: sellerProducts[0].sellerName || 'Vendeur',
      city: sellerProducts[0].sellerCity || '',
      neighborhood: sellerProducts[0].sellerNeighborhood || '',
      phone: sellerProducts[0].whatsapp || ''
    }
  }

  // Charger les analytiques si propriétaire
  useEffect(() => {
    if (isOwner && sellerId) {
      const sellerProductsFiltered = products.filter(p => p.sellerId === sellerId)
      const mockAnalytics = generateMockAnalytics(sellerId, sellerProductsFiltered)
      setAnalytics(mockAnalytics)
    }
  }, [isOwner, sellerId, products])

  // Calculer les revenus et statistiques depuis les commandes réelles
  const sellerOrders = orders.filter(o => o.sellerId === sellerId)
  const totalRevenue = sellerOrders
    .filter(o => 
      o.paymentStatus === 'paid' || 
      o.status === 'completed' || 
      o.status === 'confirmed'
    )
    .reduce((sum, o) => {
      const price = parseFloat(o.price) || 0;
      const quantity = parseInt(o.quantity) || 1;
      const total = parseFloat(o.total) || (price * quantity);
      return sum + total;
    }, 0)
  const totalOrders = sellerOrders.length
  const pendingOrders = sellerOrders.filter(o => o.status === 'pending').length
  const completedOrders = sellerOrders.filter(o => o.status === 'completed').length
  
  // Calculer les vues réelles des produits
  const totalProductViews = sellerProducts.reduce((sum, p) => sum + (p.views || 0), 0)
  
  // Calculer les revenus par jour pour les 7 derniers jours
  const getLast7DaysRevenue = () => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dayOrders = sellerOrders.filter(o => 
        o.createdAt && o.createdAt.startsWith(dateStr) && (
          o.paymentStatus === 'paid' || 
          o.status === 'completed' || 
          o.status === 'confirmed'
        )
      )
      const dayRevenue = dayOrders.reduce((sum, o) => {
        const price = parseFloat(o.price) || 0;
        const quantity = parseInt(o.quantity) || 1;
        const total = parseFloat(o.total) || (price * quantity);
        return sum + total;
      }, 0)
      days.push({ date: dateStr, revenue: dayRevenue })
    }
    return days
  }
  
  const weekStats = getLast7DaysRevenue()

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(price)
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  // Graphe des revenus réels pour les 7 derniers jours
  const renderChart = () => {
    if (!weekStats || weekStats.length === 0) return null
    
    const maxRevenue = Math.max(...weekStats.map(s => s.revenue), 1)
    
    return (
      <div className="analytics-chart">
        {weekStats.map((day, index) => (
          <div key={index} className="chart-bar-container">
            <div className="chart-bar" style={{ height: `${(day.revenue / maxRevenue) * 100}%` }}>
              <span className="chart-tooltip">{formatPrice(day.revenue)}</span>
            </div>
            <span className="chart-label">{formatDate(day.date)}</span>
          </div>
        ))}
      </div>
    )
  }

  if (!sellerInfo && sellerProducts.length === 0) {
    return (
      <div className="seller-profile-page">
        <div className="container">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
            Retour
          </button>
          <div className="seller-not-found">
            <Store size={64} />
            <h2>Vendeur non trouvé</h2>
            <p>Le vendeur que vous recherchez n'existe pas.</p>
            <Link to="/products" className="btn btn-primary">
              Retour aux produits
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const whatsappMessage = `Bonjour, je suis intéressé par vos produits sur BoutiKonect.bj`
  const whatsappUrl = sellerInfo?.whatsapp 
    ? `https://wa.me/${sellerInfo.whatsapp.replace('+229', '229')}?text=${encodeURIComponent(whatsappMessage)}`
    : null

  return (
    <div className="seller-profile-page">
      <div className="container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          Retour
        </button>

        <motion.div 
          className="seller-profile-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="seller-profile-avatar">
            {sellerInfo?.avatar ? (
              <img src={sellerInfo.avatar} alt={sellerInfo.name} />
            ) : (
              <span>{sellerInfo?.name?.charAt(0) || 'V'}</span>
            )}
          </div>
          
          <div className="seller-profile-info">
            <h1>{sellerInfo?.name}</h1>
            {(sellerInfo?.city || sellerInfo?.neighborhood) && (
              <p className="seller-location">
                <MapPin size={16} />
                {sellerInfo?.neighborhood}, {sellerInfo?.city}
              </p>
            )}
            {sellerInfo?.phone && (
              <p className="seller-phone">{sellerInfo.phone}</p>
            )}
            <div className="seller-stats">
              <div className="stat">
                <Package size={20} />
                <span>{sellerProducts.length} produit{sellerProducts.length !== 1 ? 's' : ''}</span>
              </div>
              {sellerServices.length > 0 && (
                <div className="stat">
                  <Briefcase size={20} color="#00C853" />
                  <span>{sellerServices.length} service{sellerServices.length !== 1 ? 's' : ''}</span>
                </div>
              )}
              {totalProductViews > 0 && (
                <>
                  <div className="stat">
                    <Eye size={20} />
                    <span>{totalProductViews} vues</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {whatsappUrl && currentUser && currentUser.id !== sellerId && (
            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp"
            >
              <MessageCircle size={20} />
              Contacter
            </a>
          )}
        </motion.div>

        {/* Analytics Dashboard - Only for owner (with real data) */}
        {isOwner && (
          <motion.div 
            className="seller-analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2><TrendingUp size={24} /> Tableau de bord</h2>
            
            {/* Stats Cards */}
            <div className="analytics-stats">
              <div className="analytics-stat-card">
                <div className="stat-icon revenue">
                  <DollarSign size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{formatPrice(totalRevenue)}</span>
                  <span className="stat-label">Chiffre d'affaires</span>
                </div>
              </div>
              
              <div className="analytics-stat-card">
                <div className="stat-icon orders">
                  <ShoppingCart size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{totalOrders}</span>
                  <span className="stat-label">Commandes</span>
                </div>
              </div>
              
              <div className="analytics-stat-card">
                <div className="stat-icon pending">
                  <Package size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{pendingOrders}</span>
                  <span className="stat-label">En attente</span>
                </div>
              </div>
              
              <div className="analytics-stat-card">
                <div className="stat-icon completed">
                  <Users size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{completedOrders}</span>
                  <span className="stat-label">Terminées</span>
                </div>
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="analytics-section">
              <h3>Revenus (7 derniers jours)</h3>
              {renderChart()}
            </div>

            {/* Orders Table */}
            <div className="analytics-section">
              <h3>Dernières commandes</h3>
              {sellerOrders.length > 0 ? (
                <div className="orders-table-wrapper">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Produit</th>
                        <th>Client</th>
                        <th>Prix</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sellerOrders.slice(0, 10).map(order => (
                        <tr key={order.id}>
                          <td>{order.productTitle}</td>
                          <td>{order.buyerName}</td>
                        <td>{formatPrice(parseFloat(order.total) || (parseFloat(order.price) * (parseInt(order.quantity) || 1)))}</td>
                          <td>
                            <span className={`status-badge ${order.status}`}>
                              {order.status === 'pending' ? 'En attente' : 
                               order.status === 'completed' ? 'Terminée' : 
                               order.status === 'cancelled' ? 'Annulée' : order.status}
                            </span>
                          </td>
                          <td>{formatDate(order.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-orders">Aucune commande pour le moment</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Products or Analytics Tabs for owner */}
        {isOwner ? (
          <div className="seller-tabs">
            <button 
              className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              <Package size={18} />
              Produits
            </button>
            <button 
              className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <TrendingUp size={18} />
              Statistiques
            </button>
          </div>
        ) : null}

        {/* Combined Products and Services Sections */}
        <motion.div 
          className="seller-offerings-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ marginTop: '40px' }}
        >
          {/* Produits section */}
          <div className="offering-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
            <Package size={24} color="#FF6A00" />
            <h2 style={{ margin: 0 }}>Produits de {sellerInfo?.name} ({sellerProducts.length})</h2>
          </div>

          {sellerProducts.length > 0 ? (
            <div className="products-grid" style={{ marginBottom: '50px' }}>
              {sellerProducts.map(product => (
                <ProductCard key={product.id} product={product} showViews={isOwner} />
              ))}
            </div>
          ) : (
            <div className="no-products" style={{ marginBottom: '50px', textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.03)', borderRadius: '15px' }}>
              <Package size={48} color="var(--text-light)" />
              <p style={{ color: 'var(--text-light)', marginTop: '10px' }}>Ce vendeur n'a pas encore de produits</p>
            </div>
          )}

          {/* Services section */}
          <div className="offering-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginTop: '40px' }}>
            <Briefcase size={24} color="#00C853" />
            <h2 style={{ margin: 0 }}>Services de {sellerInfo?.name} ({sellerServices.length})</h2>
          </div>

          {sellerServices.length > 0 ? (
            <div className="products-grid">
              {sellerServices.map(service => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <div className="no-products" style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.03)', borderRadius: '15px' }}>
              <Briefcase size={48} color="var(--text-light)" />
              <p style={{ color: 'var(--text-light)', marginTop: '10px' }}>Ce vendeur n'a pas encore de services</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

