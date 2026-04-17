import { useContext, useState, useEffect } from 'react'
import { AppContext } from '../../context/AppContext'
import { isAdminEmail, isAdminConfigured } from '../../services/adminAuth'
import { motion } from 'framer-motion'
import { Users, Package, AlertTriangle, Trash2, Check, ShoppingBag, MessageCircle, Phone, MapPin, Lock, Calendar, Mail, ShoppingCart, RefreshCw, Settings, DollarSign, Save, Edit2, X, Briefcase } from 'lucide-react'
import './Admin.css'

// Default promotion prices
const DEFAULT_PROMOTION_PRICES = {
  threeDays: { name: '3 jours', price: 1000, days: 3 },
  week: { name: '1 semaine', price: 2500, days: 7 },
  month: { name: '1 mois', price: 9000, days: 30 }
}

export default function Admin() {
  const { seller, user, getAllUsers, getAllProducts, services, getAllOrders, getReportedProducts, deleteUser, deleteProduct, deleteService, resolveReport, getAllReports, messages, allUsers, formatPrice } = useContext(AppContext)
  const [activeTab, setActiveTab] = useState('users')
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [promotionPrices, setPromotionPrices] = useState(() => {
    const saved = localStorage.getItem('admin_promotion_prices')
    return saved ? JSON.parse(saved) : DEFAULT_PROMOTION_PRICES
  })
  const [editingPrice, setEditingPrice] = useState(null)
  const [priceForm, setPriceForm] = useState({ name: '', price: 0, days: 0 })
  const [priceSaveSuccess, setPriceSaveSuccess] = useState(false)

  // Check if admin is configured
  const adminIsConfigured = isAdminConfigured()

  // Attendre que les utilisateurs soient chargés
  useEffect(() => {
    if (allUsers !== null) {
      setIsLoading(false)
    }
  }, [allUsers])

  // Check if user is admin
  const isAdminUser = isAdminConfigured(user) || isAdminConfigured(seller)

  if (isLoading) {
    return (
      <div className="admin-page">
        <div className="container">
          <div className="loading-state" style={{ textAlign: 'center', padding: '50px' }}>
            <div className="spinner" style={{ 
              width: '50px', 
              height: '50px', 
              border: '4px solid #f3f3f3', 
              borderTop: '4px solid #FF6A00', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <p>Chargement des données...</p>
            <p style={{ fontSize: '12px', color: '#666' }}>Veuillez patienter</p>
          </div>
        </div>
      </div>
    )
  }

  if (!adminIsConfigured) {
    return (
      <div className="admin-page">
        <div className="container">
          <div className="access-denied">
            <Settings size={64} />
            <h2>Admin non configuré</h2>
            <p>Configurez le fichier .env avec les identifiants admin</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdminUser) {
    return (
      <div className="admin-page">
        <div className="container">
          <div className="access-denied">
            <AlertTriangle size={64} />
            <h2>Accès refusé</h2>
            <p>Vous n'avez pas accès à cette page.</p>
          </div>
        </div>
      </div>
    )
  }

  let users = getAllUsers()
  
  if (users.length === 0) {
    return (
      <div className="admin-page">
        <div className="container">
          <div className="access-denied">
            <AlertTriangle size={64} />
            <h2>Aucun utilisateur trouvé</h2>
            <p>La base de données semble vide.</p>
          </div>
        </div>
      </div>
    )
  }
  
  const allProducts = getAllProducts()
  const allOrders = getAllOrders()
  const reportedProducts = getReportedProducts()
  const reports = getAllReports()

  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    users = users.filter(u => 
      u.name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.city?.toLowerCase().includes(query) ||
      u.neighborhood?.toLowerCase().includes(query) ||
      u.phone?.includes(query)
    )
  }

  const ordersBySeller = allOrders.reduce((acc, order) => {
    const sellerId = order.sellerId || 'unknown'
    if (!acc[sellerId]) {
      acc[sellerId] = []
    }
    acc[sellerId].push(order)
    return acc
  }, {})

  const getSellerName = (order) => {
    if (order.sellerName) return order.sellerName
    const sellerUser = users.find(u => u.id === order.sellerId)
    return sellerUser?.name || 'Vendeur inconnu'
  }

  const stats = {
    totalUsers: getAllUsers().length,
    totalProducts: allProducts.filter(p => !p.type || p.type === 'product').length,
    totalServices: services.length,
    totalOrders: allOrders.length,
    totalMessages: messages.length,
    reportedProducts: reportedProducts.length,
    totalSellers: Object.keys(ordersBySeller).length
  }

  const confirmDelete = (itemName, itemType = 'élément') => {
    return new Promise((resolve) => {
      const confirmed = window.confirm(
        `CONFIRMATION REQUISE\n\n` +
        `Êtes-vous sûr de vouloir supprimer ${itemType} "${itemName}"?\n\n` +
        `Cette action est IRRÉVERSIBLE.`
      )
      resolve(confirmed)
    })
  }

  const handleDeleteUser = async (userId) => {
    const userToDelete = users.find(u => u.id === userId)
    const confirmed = await confirmDelete(userToDelete?.name || userId, 'l\'utilisateur')
    
    if (confirmed) {
      const nameInput = prompt(`Tapez le nom de l'utilisateur: "${userToDelete?.name || userId}"`)
      if (nameInput === userToDelete?.name || nameInput === userId) {
        deleteUser(userId)
        setSelectedUser(null)
        alert('Utilisateur supprimé.')
      }
    }
  }

  const handleDeleteProduct = async (productId) => {
    const productToDelete = allProducts.find(p => p.id === productId)
    const confirmed = await confirmDelete(productToDelete?.title || productId, 'le produit')
    
    if (confirmed) {
      const result = await deleteProduct(productId)
      if (result.success) {
        setSelectedProduct(null)
        alert('Produit supprimé avec succès.')
      } else {
        alert(`Erreur lors de la suppression: ${result.error}`)
      }
    }
  }

  const handleDeleteService = async (serviceId) => {
    const serviceToDelete = services.find(s => s.id === serviceId)
    const confirmed = await confirmDelete(serviceToDelete?.title || serviceId, 'le service')
    
    if (confirmed) {
      const result = await deleteService(serviceId)
      if (result.success) {
        alert('Service supprimé avec succès.')
      } else {
        alert(`Erreur lors de la suppression: ${result.error}`)
      }
    }
  }

  const handleResolveReport = (reportId) => {
    resolveReport(reportId)
  }




  // Handle price editing
  const handleEditPrice = (key) => {
    setEditingPrice(key)
    setPriceForm({ ...promotionPrices[key] })
  }

  const handleSavePrice = () => {
    if (priceForm.price < 100) {
      alert('Le prix minimum est de 100 XOF')
      return
    }
    
    const newPrices = {
      ...promotionPrices,
      [editingPrice]: {
        name: priceForm.name,
        price: parseInt(priceForm.price),
        days: parseInt(priceForm.days)
      }
    }
    
    setPromotionPrices(newPrices)
    localStorage.setItem('admin_promotion_prices', JSON.stringify(newPrices))
    setEditingPrice(null)
    setPriceSaveSuccess(true)
    setTimeout(() => setPriceSaveSuccess(false), 3000)
  }

  const handleCancelEdit = () => {
    setEditingPrice(null)
    setPriceForm({ name: '', price: 0, days: 0 })
  }

  return (
    <div className="admin-page">
      <div className="container">
        <motion.div 
          className="admin-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>Tableau de bord Admin</h1>
          <p>Gérez la plateforme BoutiKonect.bj</p>
        </motion.div>

        {/* Statistiques */}
        <div className="admin-stats">
          <div className="stat-card stat-primary">
            <Users size={24} />
            <div className="stat-info">
              <span className="stat-value">{stats.totalUsers}</span>
              <span className="stat-label">Utilisateurs</span>
            </div>
          </div>
          <div className="stat-card">
            <Package size={24} />
            <div className="stat-info">
              <span className="stat-value">{stats.totalProducts}</span>
              <span className="stat-label">Produits</span>
            </div>
          </div>
          <div className="stat-card">
            <Briefcase size={24} />
            <div className="stat-info">
              <span className="stat-value">{stats.totalServices}</span>
              <span className="stat-label">Services</span>
            </div>
          </div>
          <div className="stat-card">
            <ShoppingBag size={24} />
            <div className="stat-info">
              <span className="stat-value">{stats.totalOrders}</span>
              <span className="stat-label">Commandes</span>
            </div>
          </div>
          <div className="stat-card">
            <MessageCircle size={24} />
            <div className="stat-info">
              <span className="stat-value">{stats.totalMessages}</span>
              <span className="stat-label">Messages</span>
            </div>
          </div>
          <div className="stat-card stat-warning">
            <AlertTriangle size={24} />
            <div className="stat-info">
              <span className="stat-value">{stats.reportedProducts}</span>
              <span className="stat-label">Signalements</span>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="admin-tabs">
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={18} />
            Utilisateurs ({stats.totalUsers})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <Package size={18} />
            Produits ({stats.totalProducts})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            <Briefcase size={18} />
            Services ({stats.totalServices})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <ShoppingCart size={18} />
            Commandes ({stats.totalOrders})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <AlertTriangle size={18} />
            Signalements ({reportedProducts.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'promotions' ? 'active' : ''}`}
            onClick={() => setActiveTab('promotions')}
          >
            <DollarSign size={18} />
            Tarifs Promotions
          </button>
        </div>

        {/* Contenu des onglets */}
        <div className="admin-content">
          {activeTab === 'users' && (
            <motion.div 
              className="users-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="users-grid">
                {users.map(targetUser => (
                  <motion.div 
                    key={targetUser.id}
                    className="user-card"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="user-card-header">
                      <div className="user-avatar-large">
                        {targetUser.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="user-basic-info">
                        <h3>{targetUser.name || 'Non spécifié'}</h3>
                        <span className="user-id">ID: {targetUser.id}</span>
                      </div>
                    </div>
                    
                    <div className="user-details">
                      <div className="detail-row">
                        <Mail size={14} />
                        <span>{targetUser.email || 'Non spécifié'}</span>
                      </div>
                      <div className="detail-row">
                        <Phone size={14} />
                        <span>{targetUser.phone || 'Non spécifié'}</span>
                      </div>
                      <div className="detail-row">
                        <MapPin size={14} />
                        <span>{targetUser.city || 'Non spécifié'}{targetUser.neighborhood ? `, ${targetUser.neighborhood}` : ''}</span>
                      </div>
                      <div className="detail-row">
                        <Calendar size={14} />
                        <span>Inscrit: {targetUser.createdAt ? new Date(targetUser.createdAt).toLocaleString('fr-FR') : 'Non spécifié'}</span>
                      </div>
                    </div>

                    <div className="user-card-actions">
                      <button 
                        className="btn-delete"
                        onClick={() => handleDeleteUser(targetUser.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {users.length === 0 && (
                <div className="empty-state">
                  <Users size={48} />
                  <p>Aucun utilisateur trouvé</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'products' && (
            <motion.div 
              className="admin-table-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Produit</th>
                    <th>Prix</th>
                    <th>Vendeur</th>
                    <th>Catégorie</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allProducts.filter(p => p.type === 'product' || !p.type).map(product => (
                    <tr key={product.id}>
                      <td data-label="ID">#{product.id.slice(-6)}</td>
                      <td data-label="Produit">
                        <div className="product-cell">
                          <img src={product.images?.[0] || 'https://via.placeholder.com/50'} alt={product.title} />
                          <span>{product.title?.substring(0, 30)}...</span>
                        </div>
                      </td>
                      <td data-label="Prix">{formatPrice(product.price)}</td>
                      <td data-label="Vendeur">{product.sellerName || 'Inconnu'}</td>
                      <td data-label="Catégorie"><span className="category-badge">{product.category || 'N/A'}</span></td>
                      <td data-label="Actions">
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {allProducts.length === 0 && (
                <div className="empty-state">
                  <Package size={48} />
                  <p>Aucun produit</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'services' && (
            <motion.div 
              className="admin-table-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Service</th>
                    <th>Prix</th>
                    <th>Vendeur</th>
                    <th>Catégorie</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map(service => (
                    <tr key={service.id}>
                      <td data-label="ID">#{service.id.slice(-6)}</td>
                      <td data-label="Service">
                        <div className="product-cell">
                          <img src={service.images?.[0] || 'https://via.placeholder.com/50'} alt={service.title} />
                          <span>{service.title?.substring(0, 30)}...</span>
                        </div>
                      </td>
                      <td data-label="Prix">{service.priceType === 'Devis' ? 'Sur Devis' : formatPrice(service.price)}</td>
                      <td data-label="Vendeur">{service.sellerName || 'Inconnu'}</td>
                      <td data-label="Catégorie"><span className="category-badge" style={{background: 'rgba(156, 39, 176, 0.1)', color: '#9C27B0'}}>{service.category || 'N/A'}</span></td>
                      <td data-label="Actions">
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteService(service.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {services.length === 0 && (
                <div className="empty-state">
                  <Briefcase size={48} />
                  <p>Aucun service</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div 
              className="orders-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {Object.keys(ordersBySeller).length > 0 ? (
                Object.entries(ordersBySeller).map(([sellerId, orders]) => (
                  <div key={sellerId} className="seller-orders-group">
                    <div className="seller-orders-header">
                      <h3>
                        <Package size={20} />
                        {getSellerName(orders[0])} 
                        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '12px', fontWeight: 'normal', color: '#8fa3bf', marginTop: '4px' }}>
                            <span>Ville: {orders[0].sellerCity}</span>
                            <span>Quartier: {orders[0].sellerNeighborhood}</span>
                        </div>
                        <span className="order-count">({orders.length} commande{orders.length !== 1 ? 's' : ''})</span>
                      </h3>
                    </div>
                    <div className="admin-table-container">
                        <table className="orders-table">
                          <thead>
                            <tr>
                              <th>Détails Commande</th>
                              <th>Prix/Total</th>
                              <th>Infos Client</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.map(order => (
                              <tr key={order.id}>
                                <td data-label="Produit">
                                    <div style={{ color: order.type === 'service' ? '#FF6A00' : '#FFD700', fontWeight: '700' }}>
                                      {order.type === 'service' ? 'Service: ' : 'Produit: '}
                                      {order.serviceTitle || order.productTitle}
                                    </div>
                                    <div style={{ fontSize: '12px' }}>Qté: {order.quantity} | ID: #{order.id.slice(-6)}</div>
                                </td>
                                <td data-label="Prix/Total">
                                    <div>P.U: {order.type === 'service' && order.priceType === 'Devis' ? 'Devis' : formatPrice(order.price)}</div>
                                    <div style={{ color: '#FF6A00', fontWeight: '700' }}>Total: {order.type === 'service' && order.priceType === 'Devis' ? 'Sur Devis' : formatPrice(order.total || order.price * order.quantity)}</div>
                                </td>
                                <td data-label="Client">
                                    <div style={{ fontWeight: '700' }}>{order.buyerName}</div>
                                    <div style={{ fontSize: '12px' }}><Phone size={10} /> {order.buyerPhone}</div>
                                    {order.type === 'service' ? (
                                      <div style={{ fontSize: '11px', color: '#8fa3bf', marginTop: '4px', padding: '4px', background: 'rgba(255,106,0,0.05)', borderRadius: '4px' }}>
                                        <div>📍 {order.location}</div>
                                        <div style={{ whiteSpace: 'pre-wrap' }}>📝 {order.details}</div>
                                      </div>
                                    ) : (
                                      <div style={{ fontSize: '11px', color: '#8fa3bf' }}>🏠 {order.buyerAddress}</div>
                                    )}
                                </td>
                                <td data-label="Date">
                                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('fr-FR') : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <ShoppingCart size={48} />
                  <p>Aucune commande</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div 
              className="reports-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {reportedProducts.length > 0 ? (
                reportedProducts.map(product => {
                  const productReports = reports.filter(r => r.productId === product.id)
                  return (
                    <div key={product.id} className="report-card">
                      <div className="report-product">
                        <img src={product.images?.[0] || 'https://via.placeholder.com/100'} alt={product.title} />
                        <div className="report-info">
                          <h3>{product.title}</h3>
                          <p>{product.description?.substring(0, 100)}...</p>
                          <span className="seller-info">Vendeur: {product.sellerName}</span>
                        </div>
                      </div>
                      <div className="report-reasons">
                        <h4>Motifs ({productReports.length}):</h4>
                        {productReports.map(report => (
                          <div key={report.id} className="report-item">
                            <p>{report.reason}</p>
                            <span className="report-date">
                              {report.createdAt ? new Date(report.createdAt).toLocaleDateString('fr-FR') : ''}
                            </span>
                            {report.status === 'pending' && (
                              <button 
                                className="btn-resolve"
                                onClick={() => handleResolveReport(report.id)}
                              >
                                <Check size={16} /> Résolu
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="report-actions">
                        <button 
                          className="btn-delete-product"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 size={16} /> Supprimer
                        </button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="empty-state">
                  <AlertTriangle size={48} />
                  <p>Aucun produit signalé</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'promotions' && (
            <motion.div 
              className="promotions-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {priceSaveSuccess && (
                <div style={{ 
                  background: '#4CAF50', 
                  color: 'white', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  ✅ Tarifs enregistrés avec succès!
                </div>
              )}

              <div style={{ 
                background: '#f5f5f5', 
                padding: '20px', 
                borderRadius: '12px',
                marginBottom: '20px'
              }}>
                <h3 style={{ marginBottom: '10px' }}>Modifier les tarifs de promotion</h3>
                <p style={{ fontSize: '14px', color: '#666' }}>
                  Ces tarifs seront utilisés par les vendeurs lorsqu'ils promoivent leurs produits.
                  Les modifications sont sauvegardées automatiquement.
                </p>
              </div>

              <div className="pricing-cards">
                {Object.entries(promotionPrices).map(([key, value]) => (
                  <div key={key} className="pricing-card" style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    marginBottom: '15px'
                  }}>
                    {editingPrice === key ? (
                      <div className="price-edit-form">
                        <h4 style={{ marginBottom: '15px' }}>Modifier: {value.name}</h4>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: '120px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Nom</label>
                            <input 
                              type="text" 
                              value={priceForm.name}
                              onChange={(e) => setPriceForm({...priceForm, name: e.target.value})}
                              style={{ 
                                width: '100%', 
                                padding: '8px', 
                                border: '1px solid #ddd', 
                                borderRadius: '6px' 
                              }}
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: '120px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Prix (XOF)</label>
                            <input 
                              type="number" 
                              value={priceForm.price}
                              onChange={(e) => setPriceForm({...priceForm, price: e.target.value})}
                              style={{ 
                                width: '100%', 
                                padding: '8px', 
                                border: '1px solid #ddd', 
                                borderRadius: '6px' 
                              }}
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: '120px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Jours</label>
                            <input 
                              type="number" 
                              value={priceForm.days}
                              onChange={(e) => setPriceForm({...priceForm, days: e.target.value})}
                              style={{ 
                                width: '100%', 
                                padding: '8px', 
                                border: '1px solid #ddd', 
                                borderRadius: '6px' 
                              }}
                            />
                          </div>
                        </div>
                        <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                          <button 
                            onClick={handleSavePrice}
                            style={{
                              background: '#4CAF50',
                              color: 'white',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            <Save size={16} /> Enregistrer
                          </button>
                          <button 
                            onClick={handleCancelEdit}
                            style={{
                              background: '#666',
                              color: 'white',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            <X size={16} /> Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '18px' }}>{value.name}</h4>
                          <p style={{ margin: '5px 0 0', color: '#666', fontSize: '14px' }}>
                            {value.days} jour{value.days !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF6A00' }}>
                            {formatPrice(value.price)}
                          </div>
                          <button 
                            onClick={() => handleEditPrice(key)}
                            style={{
                              background: '#FF6A00',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              marginTop: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '12px'
                            }}
                          >
                            <Edit2 size={14} /> Modifier
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

