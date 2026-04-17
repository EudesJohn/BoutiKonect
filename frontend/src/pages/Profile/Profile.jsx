import { useContext, useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppContext } from '../../context/AppContext'
import { cities } from '../../context/constants'
import { changePassword as authChangePassword } from '../../services/authService'
import { User, Mail, Phone, MapPin, Package, Heart, LogOut, ShoppingBag, Trash2, Plus, Bell, CheckCircle, XCircle, Clock, Camera, Save, X, Edit2, Lock, Store, TrendingUp, DollarSign, ShoppingCart, Briefcase, ShieldCheck } from 'lucide-react'
import './Profile.css'

export default function Profile() {
  const { user, seller, logoutUser, products, services, getFavoriteProducts, getFavoriteServices, toggleFavorite, isFavorite, getSellerOrders, updateOrderStatus, updateProfile, upgradeToSeller, orders, formatPrice, updateEmailWithVerification, resetPassword, showToast } = useContext(AppContext)
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('favorites')
  const [isEditing, setIsEditing] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [editForm, setEditForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    city: '', 
    neighborhood: '', 
    customNeighborhood: '', // Nouveau champ pour le quartier libre
    avatar: '', 
    whatsapp: '', 
    newPassword: '' 
  })
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [isMfaLoading, setIsMfaLoading] = useState(false)
  const fileInputRef = useRef(null)
  const { search } = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(search)
    const tab = params.get('tab')
    if (tab) {
      setActiveTab(tab)
    }
  }, [search])

  const favoriteProducts = getFavoriteProducts()
  const userProducts = seller ? products.filter(p => p.sellerId === seller.id && (p.type === 'product' || !p.type)) : []
  const userServices = seller ? services.filter(s => s.sellerId === seller.id) : []
  const sellerOrders = seller ? getSellerOrders(seller.id) : []
  const userPurchases = user ? orders.filter(o => o.buyerId === user.id) : []
  const sellerPurchases = seller ? orders.filter(o => o.buyerId === seller.id) : []
  const allPurchases = [...userPurchases, ...sellerPurchases]

  const sellerStats = seller ? {
    totalRevenue: sellerOrders.filter(o => 
      o.paymentStatus === 'paid' || 
      o.status === 'completed' || 
      o.status === 'confirmed'
    ).reduce((sum, o) => {
      const price = parseFloat(o.price) || 0;
      const quantity = parseInt(o.quantity) || 1;
      const total = parseFloat(o.total) || (price * quantity);
      return sum + total;
    }, 0),
    pendingOrders: sellerOrders.filter(o => o.status === 'pending').length,
    completedOrders: sellerOrders.filter(o => o.status === 'completed').length,
    cancelledOrders: sellerOrders.filter(o => o.status === 'cancelled').length,
    totalOrders: sellerOrders.length,
    productsCount: userProducts.length,
    servicesCount: userServices.length
  } : null

  const buyerStats = {
    totalPurchases: allPurchases.length,
    totalSpent: allPurchases.reduce((sum, o) => sum + (o.total || o.price * o.quantity), 0),
    pendingPurchases: allPurchases.filter(o => o.status === 'pending').length,
    completedPurchases: allPurchases.filter(o => o.status === 'completed').length
  }

  const getOrdersByDay = () => {
    if (!seller) return []
    const days = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' })
      const dayOrders = sellerOrders.filter(o => o.createdAt && new Date(o.createdAt).toDateString() === date.toDateString())
      const revenue = dayOrders.filter(o => 
        o.paymentStatus === 'paid' || 
        o.status === 'completed' || 
        o.status === 'confirmed'
      ).reduce((sum, o) => {
        const price = parseFloat(o.price) || 0;
        const quantity = parseInt(o.quantity) || 1;
        const total = parseFloat(o.total) || (price * quantity);
        return sum + total;
      }, 0)
      days.push({ day: dayName, orders: dayOrders.length, revenue })
    }
    return days
  }

  const getPurchasesByDay = () => {
    const days = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' })
      const dayPurchases = allPurchases.filter(o => o.createdAt && new Date(o.createdAt).toDateString() === date.toDateString())
      const spent = dayPurchases.reduce((sum, o) => sum + (o.total || o.price * o.quantity), 0)
      days.push({ day: dayName, purchases: dayPurchases.length, spent })
    }
    return days
  }

  const ordersByDay = getOrdersByDay()
  const purchasesByDay = getPurchasesByDay()
  const maxRevenue = Math.max(...ordersByDay.map(d => d.revenue), 1)
  const maxSpent = Math.max(...purchasesByDay.map(d => d.spent), 1)

  const handleLogout = () => { logoutUser(); navigate('/') }

  const handleEditClick = () => {
    const currentUser = user || seller
    
    // Déterminer si le quartier actuel est dans la liste prédéfinie
    const currentCityData = cities.find(c => c.name === currentUser?.city)
    const isStandardNeighborhood = currentCityData?.neighborhoods.includes(currentUser?.neighborhood)
    
    setEditForm({ 
      name: currentUser?.name || '', 
      email: currentUser?.email || '', 
      phone: currentUser?.phone || '', 
      city: currentUser?.city || '', 
      neighborhood: isStandardNeighborhood ? (currentUser?.neighborhood || '') : (currentUser?.neighborhood ? 'AUTRE' : ''), 
      customNeighborhood: isStandardNeighborhood ? '' : (currentUser?.neighborhood || ''),
      avatar: currentUser?.avatar || '', 
      whatsapp: currentUser?.whatsapp || '',
      newPassword: '' 
    })
    setIsEditing(true)
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => { setEditForm({ ...editForm, avatar: reader.result }) }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = async () => {
    setShowConfirmModal(true)
  }

  // Flux OTP supprimé

  const confirmSaveProfile = async () => {
    const currentUser = user || seller;
    setIsMfaLoading(true);
    
    try {
      // Préparer le quartier final (gérer l'option 'AUTRE')
      const finalNeighborhood = editForm.neighborhood === 'AUTRE' 
        ? editForm.customNeighborhood 
        : editForm.neighborhood;

      // Update fields in profiles table
      const result = await updateProfile(currentUser.id, {
        name: editForm.name,
        phone: editForm.phone,
        city: editForm.city,
        neighborhood: finalNeighborhood,
        avatar: editForm.avatar,
        whatsapp: editForm.whatsapp
      });

      if (!result.success) {
        throw new Error(result.error || "Échec de la mise à jour");
      }

      // Handle Email update via Supabase Auth if it changed
      if (editForm.email !== currentUser.email && !currentUser.isGoogle) {
        const result = await updateEmailWithVerification(editForm.email);
        if (result.success) {
          showToast("IMPORTANT : Vous devez valider le lien envoyé sur votre ANCIENNE email ET sur la NOUVELLE (" + editForm.email + ") pour confirmer le changement.", 'info', 10000);
        } else {
          showToast(result.error || "Erreur lors du changement d'email.", 'error');
        }
      }

      setIsEditing(false);
      setShowConfirmModal(false);
      showToast('Profil mis à jour avec succès !', 'success');
    } catch (err) {
      console.error("Profile update error:", err);
      showToast(err.message || "Erreur lors de la mise à jour du profil.", 'error');
    } finally {
      setIsMfaLoading(false);
    }
  }

  const handleResetPassword = async () => {
    const currentUser = user || seller
    if (!currentUser?.email) return
    
    if (window.confirm("Un email de réinitialisation de mot de passe sera envoyé à " + currentUser.email + ". Voulez-vous continuer ?")) {
      setIsMfaLoading(true)
      try {
        const result = await resetPassword(currentUser.email)
        if (result.success) {
          alert("E-mail de réinitialisation envoyé avec succès !")
          setShowPasswordChange(false)
        } else {
          alert(result.error || "Erreur lors de l'envoi de l'email.")
        }
      } catch (error) {
        console.error("Reset error:", error);
        alert("Une erreur technique est survenue lors de l'envoi.")
      } finally {
        setIsMfaLoading(false)
      }
    }
  }

  // MFA handlers supprimés


  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return <span className="order-status pending"><Clock size={14} /> En attente</span>
      case 'confirmed': return <span className="order-status confirmed"><CheckCircle size={14} /> Confirmee</span>
      case 'cancelled': return <span className="order-status cancelled"><XCircle size={14} /> Annulee</span>
      case 'completed': return <span className="order-status completed"><CheckCircle size={14} /> Terminee</span>
      default: return <span className="order-status">{status}</span>
    }
  }

  if (!user && !seller) {
    return (
      <div className="profile-page">
        <div className="container">
          <div className="not-logged-in">
            <User size={64} />
            <h2>Vous n etes pas connecte</h2>
            <p>Connectez-vous pour voir votre profil</p>
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-primary">Se connecter</Link>
              <Link to="/register" className="btn btn-outline">Creer un compte</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentUser = user || seller
  const isGoogleUser = currentUser?.isGoogle

  return (
    <div className="profile-page">
      <div className="container">
        <motion.div className="profile-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="profile-avatar-wrapper">
            {isEditing ? (
              <div className="avatar-edit-mode">
                {editForm.avatar ? <img src={editForm.avatar} alt="Avatar" /> : <div className="avatar-placeholder"><User size={48} /></div>}
                <button className="avatar-edit-btn" onClick={() => fileInputRef.current?.click()}><Camera size={20} /></button>
                <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" style={{ display: 'none' }} />
              </div>
            ) : (
              <div className="profile-avatar">
                {currentUser?.avatar ? <img src={currentUser.avatar} alt={currentUser.name} /> : <div className="avatar-placeholder"><User size={48} /></div>}
              </div>
            )}
          </div>
          
          {isEditing ? (
            <div className="profile-edit-form">
              <div className="edit-form-group"><label>Nom</label><input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="edit-input" /></div>
              <div className="edit-form-group"><label>Email</label><input type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} className="edit-input" disabled={isGoogleUser} /></div>
              <div className="edit-form-group"><label>Téléphone</label><input type="tel" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} className="edit-input" /></div>
              <div className="edit-form-group"><label>WhatsApp</label><input type="tel" value={editForm.whatsapp} onChange={(e) => setEditForm({...editForm, whatsapp: e.target.value})} className="edit-input" placeholder="+229XXXXXXXX" /></div>
              <div className="edit-form-group">
                <label>Commune / Ville</label>
                <select 
                  className="edit-input edit-select"
                  value={editForm.city}
                  onChange={(e) => setEditForm({...editForm, city: e.target.value, neighborhood: '', customNeighborhood: ''})}
                >
                  <option value="">Sélectionner une ville</option>
                  {cities.map(city => (
                    <option key={city.id} value={city.name}>{city.name}</option>
                  ))}
                </select>
              </div>

              {editForm.city && (
                <div className="edit-form-group">
                  <label>Quartier / Village</label>
                  <select 
                    className="edit-input edit-select"
                    value={editForm.neighborhood}
                    onChange={(e) => setEditForm({...editForm, neighborhood: e.target.value})}
                  >
                    <option value="">Sélectionner un quartier</option>
                    {cities.find(c => c.name === editForm.city)?.neighborhoods.map(nh => (
                      <option key={nh} value={nh}>{nh}</option>
                    ))}
                    <option value="AUTRE">+ Autre quartier</option>
                  </select>
                </div>
              )}

              {editForm.neighborhood === 'AUTRE' && (
                <div className="edit-form-group">
                  <label>Précisez votre quartier</label>
                  <input 
                    type="text" 
                    className="edit-input" 
                    placeholder="Nom du quartier"
                    value={editForm.customNeighborhood}
                    onChange={(e) => setEditForm({...editForm, customNeighborhood: e.target.value})} 
                  />
                </div>
              )}
              <div className="edit-form-actions">
                <button className="btn btn-primary btn-small" onClick={handleSaveProfile}><Save size={16} /> Enregistrer</button>
                <button className="btn btn-outline btn-small" onClick={() => setIsEditing(false)}><X size={16} /> Annuler</button>
              </div>
            </div>
          ) : (
            <div className="profile-info">
              <h1>{currentUser?.name}</h1>
              {currentUser?.email && <p className="profile-email"><Mail size={16} />{currentUser.email}</p>}
              {currentUser?.phone && <p className="profile-phone"><Phone size={16} />{currentUser.phone}</p>}
              {currentUser?.whatsapp && <p className="profile-phone" style={{color: '#25D366'}}><Phone size={16} />WhatsApp: {currentUser.whatsapp}</p>}
              {(currentUser?.city || currentUser?.neighborhood) && <p className="profile-location"><MapPin size={16} />{currentUser.neighborhood}, {currentUser.city}</p>}
              {isGoogleUser && <span className="google-badge"><img src="https://www.google.com/favicon.ico" alt="Google" />Connecte avec Google</span>}
            </div>
          )}
          
          <div className="profile-actions">
            {!isEditing && (
              <>
                {!seller && <button className="btn btn-primary" onClick={() => upgradeToSeller(currentUser.id, {})}><Store size={18} />Devenir vendeur</button>}
                <button className="btn btn-outline" onClick={handleEditClick}><Edit2 size={18} />Modifier</button>
                {!isGoogleUser && <button className="btn btn-outline" onClick={() => setShowPasswordChange(true)}><Lock size={18} />MDP</button>}
              </>
            )}
            <button className="btn btn-danger" onClick={handleLogout}><LogOut size={18} />Deconnexion</button>
          </div>
        </motion.div>

        {showConfirmModal && (
          <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
            <motion.div className="password-modal" onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="modal-header">
                <h2>Confirmer les modifications</h2>
                <button className="close-btn" onClick={() => setShowConfirmModal(false)}><X size={24} /></button>
              </div>
              <div className="modal-body">
                <p>Êtes-vous sûr de vouloir enregistrer ces modifications sur votre profil ?</p>
                {(editForm.email !== currentUser.email) && (
                  <p style={{ marginTop: '10px', color: 'var(--primary)', fontSize: '0.9rem' }}>
                    <strong>Note :</strong> Un email de vérification sera envoyé à la nouvelle adresse.
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowConfirmModal(false)}>Annuler</button>
                <button className="btn btn-primary" onClick={confirmSaveProfile} disabled={isMfaLoading}>
                  {isMfaLoading ? 'Enregistrement...' : <><CheckCircle size={18} /> Confirmer</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showPasswordChange && (
          <div className="modal-overlay" onClick={() => setShowPasswordChange(false)}>
            <motion.div className="password-modal" onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="modal-header"><h2>Réinitialiser le mot de passe</h2><button className="close-btn" onClick={() => setShowPasswordChange(false)}><X size={24} /></button></div>
              <div className="modal-body">
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <Lock size={48} color="var(--primary)" style={{ marginBottom: '15px' }} />
                  <p>Pour des raisons de sécurité, nous allons vous envoyer un lien de réinitialisation sur votre adresse email :</p>
                  <p style={{ fontWeight: 'bold', marginTop: '10px' }}>{currentUser?.email}</p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowPasswordChange(false)}>Annuler</button>
                <button className="btn btn-primary" onClick={handleResetPassword} disabled={isMfaLoading}>
                  {isMfaLoading ? 'Envoi...' : <><Save size={18} /> Envoyer l'email</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        <div className="profile-content">
          <motion.div className="profile-stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="stat-card" onClick={() => setActiveTab('favorites')} style={{cursor: 'pointer'}}>
              <Heart size={24} />
              <span className="stat-number">{favoriteProducts.length}</span>
              <span className="stat-label">Favoris</span>
            </div>
            
            {seller && (
              <div className="stat-card" onClick={() => setActiveTab('products')} style={{cursor: 'pointer'}}>
                <Package size={24} />
                <span className="stat-number">{userProducts.length}</span>
                <span className="stat-label">Produits</span>
              </div>
            )}
            
            {seller && (
              <div className="stat-card" onClick={() => setActiveTab('services')} style={{cursor: 'pointer'}}>
                <Briefcase size={24} />
                <span className="stat-number">{userServices.length}</span>
                <span className="stat-label">Services</span>
              </div>
            )}
            
            <div className="stat-card" onClick={() => setActiveTab('analytics')} style={{cursor: 'pointer'}}>
              <TrendingUp size={24} />
              <span className="stat-number">{seller ? formatPrice(sellerStats?.totalRevenue || 0) : formatPrice(buyerStats?.totalSpent || 0)}</span>
              <span className="stat-label">{seller ? 'Revenus' : 'Depenses'}</span>
            </div>
            
            {seller && (
              <div className="stat-card" onClick={() => setActiveTab('orders')} style={{cursor: 'pointer'}}>
                <Bell size={24} />
                <span className="stat-number">{sellerOrders.filter(o => o.status === 'pending').length}</span>
                <span className="stat-label">Commandes</span>
              </div>
            )}
            
            {!seller && (
              <div className="stat-card">
                <ShoppingBag size={24} />
                <span className="stat-number">{buyerStats?.totalPurchases || 0}</span>
                <span className="stat-label">Achats</span>
              </div>
            )}
          </motion.div>

          <div className="profile-tabs">
            <button className={`tab ${activeTab === 'favorites' ? 'active' : ''}`} onClick={() => setActiveTab('favorites')}><Heart size={18} />Favoris</button>
            {seller && <button className={`tab ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}><Package size={18} />Produits</button>}
            {seller && <button className={`tab ${activeTab === 'services' ? 'active' : ''}`} onClick={() => setActiveTab('services')}><Briefcase size={18} />Services</button>}
            {seller && <button className={`tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}><Bell size={18} />Commandes{sellerOrders.filter(o => o.status === 'pending').length > 0 && <span className="tab-badge">{sellerOrders.filter(o => o.status === 'pending').length}</span>}</button>}
            <button className={`tab ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}><TrendingUp size={18} />Statistiques</button>
          </div>

          {activeTab === 'favorites' && (
            <motion.div className="favorites-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <div className="tab-section-header">
                <h3>Produits Favoris ({favoriteProducts.length})</h3>
              </div>
              {favoriteProducts.length > 0 ? (
                <div className="products-grid">
                  {favoriteProducts.map(product => (
                    <div key={product.id} className="product-card">
                      <Link to={`/product/${product.id}`} className="product-image"><img src={product.images[0]} alt={product.title} /></Link>
                      <div className="product-details">
                        <h3 className="product-title">{product.title}</h3>
                        <p className="product-price">{formatPrice(product.price)}</p>
                        <button className="remove-favorite" onClick={() => { if (window.confirm('Retirer des favoris ?')) toggleFavorite(product.id) }}><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state"><Heart size={48} /><p>Aucun produit en favori.</p></div>
              )}

              <div className="tab-section-header" style={{ marginTop: '40px' }}>
                <h3>Services Favoris ({getFavoriteServices().length})</h3>
              </div>
              {getFavoriteServices().length > 0 ? (
                <div className="products-grid">
                  {getFavoriteServices().map(service => (
                    <div key={service.id} className="product-card service-favorite-card">
                      <Link to={`/service/${service.id}`} className="product-image"><img src={service.images[0]} alt={service.title} /></Link>
                      <div className="product-details">
                        <h3 className="product-title">{service.title}</h3>
                        <p className="product-price">{formatPrice(service.price)} {service.priceType !== 'Fixe' && service.priceType !== 'Devis' ? `/ ${service.priceType}` : ''}</p>
                        <button className="remove-favorite" onClick={() => { if (window.confirm('Retirer des favoris ?')) toggleFavorite(service.id) }}><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state"><Briefcase size={48} /><p>Aucun service en favori.</p></div>
              )}
            </motion.div>
          )}

          {activeTab === 'products' && seller && (
            <motion.div className="products-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              {userProducts.length > 0 ? (
                <div className="products-grid">
                  {userProducts.map(product => (
                    <div key={product.id} className="product-card">
                      <Link to={`/product/${product.id}`} className="product-image"><img src={product.images[0]} alt={product.title} /></Link>
                      <div className="product-details">
                        <h3>{product.title}</h3>
                        <p className="product-price">{formatPrice(product.price)}</p>
                        <span className="product-stock">Stock: {product.stock || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state"><Package size={48} /><h3>Pas de produits</h3><Link to="/publish" className="btn btn-primary"><Plus size={18} />Publier</Link></div>
              )}
            </motion.div>
          )}

          {activeTab === 'services' && seller && (
            <motion.div className="products-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              {userServices.length > 0 ? (
                <div className="products-grid">
                  {userServices.map(service => (
                    <div key={service.id} className="product-card">
                      <Link to={`/service/${service.id}`} className="product-image"><img src={service.images[0]} alt={service.title} /></Link>
                      <div className="product-details">
                        <h3>{service.title}</h3>
                        <p className="product-price">{service.priceType === 'Devis' ? 'Devis' : formatPrice(service.price)}</p>
                        <span className="product-stock">{service.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state"><Briefcase size={48} /><h3>Pas de services</h3><Link to="/publish?type=service" className="btn btn-primary"><Plus size={18} />Publier un service</Link></div>
              )}
            </motion.div>
          )}

          {activeTab === 'orders' && seller && (
            <motion.div className="orders-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              {sellerOrders.length > 0 ? (
                <div className="orders-list">
                  {sellerOrders.map(order => (
                    <div key={order.id} className="order-card">
                      <div className="order-info">
                        <h4>Commande #{order.id.slice(-6)}</h4>
                        {order.type === 'service' ? (
                          <>
                            <p className="order-product" style={{ color: 'var(--primary)', fontWeight: '700' }}>Service: {order.serviceTitle || order.productTitle}</p>
                            <p className="order-price">Prix: {order.priceType === 'Devis' ? 'Sur Devis' : formatPrice(order.price)}</p>
                            <p className="order-buyer">Client: {order.buyerName}</p>
                            <p className="order-buyer-phone">Tel: {order.buyerPhone}</p>
                            <div className="order-extra-info" style={{ marginTop: '10px', padding: '10px', background: 'rgba(255,106,0,0.05)', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
                              <p style={{ fontSize: '0.9rem', marginBottom: '4px' }}><strong>📍 Lieu:</strong> {order.location}</p>
                              <p style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}><strong>📝 Besoin:</strong> {order.details}</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="order-product" style={{ color: 'var(--secondary)', fontWeight: '700' }}>Produit: {order.productTitle}</p>
                            <p className="order-price">Prix: {formatPrice(order.price)}</p>
                            <p className="order-quantite">Qte: {order.quantity}</p>
                            <p className="order-buyer">Acheteur: {order.buyerName}</p>
                            <p className="order-buyer-phone">Tel: {order.buyerPhone}</p>
                            {order.buyerAddress && (
                              <p className="order-address" style={{ fontSize: '0.9rem', marginTop: '5px' }}><strong>🏠 Adresse:</strong> {order.buyerAddress}</p>
                            )}
                          </>
                        )}
                      </div>
                      <div className="order-actions">
                        {getStatusBadge(order.status)}
                        {order.status === 'pending' && (
                          <div className="order-buttons">
                            <button className="btn btn-success btn-small" onClick={() => updateOrderStatus(order.id, 'confirmed')}><CheckCircle size={16} />Confirmer</button>
                            <button className="btn btn-danger btn-small" onClick={() => { if (window.confirm('Annuler?')) updateOrderStatus(order.id, 'cancelled') }}><XCircle size={16} />Annuler</button>
                          </div>
                        )}
                        {order.status === 'confirmed' && <button className="btn btn-primary btn-small" onClick={() => updateOrderStatus(order.id, 'completed')}><CheckCircle size={16} />Livree</button>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state"><Bell size={48} /><h3>Aucune commande</h3></div>
              )}
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div className="analytics-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                {seller ? (
                  <>
                    <div className="stat-card" style={{ background: 'linear-gradient(135deg, #4CAF50, #2E7D32)', color: 'white' }}>
                      <DollarSign size={24} />
                      <span className="stat-number">{formatPrice(sellerStats?.totalRevenue || 0)}</span>
                      <span className="stat-label">Revenus Total</span>
                    </div>
                    <div className="stat-card" style={{ background: 'linear-gradient(135deg, #2196F3, #1565C0)', color: 'white' }}>
                      <ShoppingCart size={24} />
                      <span className="stat-number" style={{ fontSize: '1.3rem' }}>{sellerStats?.totalOrders || 0}</span>
                      <span className="stat-label">Commandes Total</span>
                    </div>
                    <div className="stat-card" style={{ background: 'linear-gradient(135deg, #FF9800, #E65100)', color: 'white' }}>
                      <Clock size={24} />
                      <span className="stat-number" style={{ fontSize: '1.3rem' }}>{sellerStats?.pendingOrders || 0}</span>
                      <span className="stat-label">En Attente</span>
                    </div>
                    <div className="stat-card" style={{ background: 'linear-gradient(135deg, #9C27B0, #6A1B9A)', color: 'white' }}>
                      <CheckCircle size={24} />
                      <span className="stat-number" style={{ fontSize: '1.3rem' }}>{sellerStats?.completedOrders || 0}</span>
                      <span className="stat-label">Terminees</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f44336, #c62828)', color: 'white' }}>
                      <DollarSign size={24} />
                      <span className="stat-number" style={{ fontSize: '1.3rem' }}>{formatPrice(buyerStats?.totalSpent || 0)}</span>
                      <span className="stat-label">Total Depense</span>
                    </div>
                    <div className="stat-card" style={{ background: 'linear-gradient(135deg, #2196F3, #1565C0)', color: 'white' }}>
                      <ShoppingBag size={24} />
                      <span className="stat-number" style={{ fontSize: '1.3rem' }}>{buyerStats?.totalPurchases || 0}</span>
                      <span className="stat-label">Achats Total</span>
                    </div>
                    <div className="stat-card" style={{ background: 'linear-gradient(135deg, #FF9800, #E65100)', color: 'white' }}>
                      <Clock size={24} />
                      <span className="stat-number" style={{ fontSize: '1.3rem' }}>{buyerStats?.pendingPurchases || 0}</span>
                      <span className="stat-label">En Attente</span>
                    </div>
                    <div className="stat-card" style={{ background: 'linear-gradient(135deg, #4CAF50, #2E7D32)', color: 'white' }}>
                      <CheckCircle size={24} />
                      <span className="stat-number" style={{ fontSize: '1.3rem' }}>{buyerStats?.completedPurchases || 0}</span>
                      <span className="stat-label">Recus</span>
                    </div>
                  </>
                )}
              </div>

              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {seller ? <><TrendingUp size={24} color="#4CAF50" />Revenus 7 derniers jours</> : <><ShoppingBag size={24} color="#f44336" />Depenses 7 derniers jours</>}
                </h3>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '180px', padding: '20px 0', borderBottom: '2px solid #eee' }}>
                  {seller ? ordersByDay.map((day, index) => (
                    <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <div style={{ position: 'relative', height: '130px', width: '35px', display: 'flex', alignItems: 'flex-end' }}>
                        <motion.div initial={{ height: 0 }} animate={{ height: `${(day.revenue / maxRevenue) * 120}px` }} transition={{ duration: 0.5, delay: index * 0.1 }} style={{ width: '100%', background: day.revenue > 0 ? 'linear-gradient(to top, #4CAF50, #81C784)' : '#e0e0e0', borderRadius: '4px 4px 0 0', minHeight: day.revenue > 0 ? '10px' : '0' }} title={formatPrice(day.revenue)} />
                      </div>
                      <span style={{ marginTop: '10px', fontSize: '11px', color: '#666' }}>{day.day}</span>
                      <span style={{ fontSize: '10px', color: '#999' }}>{day.orders} cmd</span>
                    </div>
                  )) : purchasesByDay.map((day, index) => (
                    <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <div style={{ position: 'relative', height: '130px', width: '35px', display: 'flex', alignItems: 'flex-end' }}>
                        <motion.div initial={{ height: 0 }} animate={{ height: `${(day.spent / maxSpent) * 120}px` }} transition={{ duration: 0.5, delay: index * 0.1 }} style={{ width: '100%', background: day.spent > 0 ? 'linear-gradient(to top, #f44336, #ef5350)' : '#e0e0e0', borderRadius: '4px 4px 0 0', minHeight: day.spent > 0 ? '10px' : '0' }} title={formatPrice(day.spent)} />
                      </div>
                      <span style={{ marginTop: '10px', fontSize: '11px', color: '#666' }}>{day.day}</span>
                      <span style={{ fontSize: '10px', color: '#999' }}>{day.purchases} ach</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '15px', padding: '10px', background: '#f5f5f5', borderRadius: '8px', fontSize: '14px' }}>
                  <strong>Total semaine:</strong> {seller ? formatPrice(ordersByDay.reduce((sum, d) => sum + d.revenue, 0)) : formatPrice(purchasesByDay.reduce((sum, d) => sum + d.spent, 0))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Section Sécurité/MFA supprimée */}
        </div>
      </div>
    </div>
  )
}
