import { useContext, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppContext } from '../../context/AppContext'
import { Package, ShoppingCart, DollarSign, CheckCircle } from 'lucide-react'
import './SellerDashboard.css'

export default function SellerDashboard() {
  const { seller, products, orders, authLoading } = useContext(AppContext)
  const navigate = useNavigate()
  
  const sellerOrders = useMemo(() => seller ? orders.filter(o => o.sellerId === seller.id) : [], [orders, seller])
  const sellerProducts = useMemo(() => seller ? products.filter(p => p.sellerId === seller.id) : [], [products, seller])
  
  const stats = useMemo(() => {
    // Inclure les commandes payées (FedaPay) ET les commandes confirmées/terminées (Manuelles)
    const paidOrders = sellerOrders.filter(o => 
      o.paymentStatus === 'paid' || 
      o.status === 'confirmed' || 
      o.status === 'completed'
    )
    
    const totalRevenue = paidOrders.reduce((sum, o) => {
      const price = parseFloat(o.price) || 0;
      const quantity = parseInt(o.quantity) || 1;
      const total = parseFloat(o.total) || (price * quantity);
      return sum + total;
    }, 0)
    
    return { 
      totalRevenue, 
      totalOrders: sellerOrders.length, 
      totalProducts: sellerProducts.length,
      pendingOrders: sellerOrders.filter(o => o.status === 'pending').length,
      completedOrders: sellerOrders.filter(o => o.status === 'completed').length
    }
  }, [sellerOrders, sellerProducts])
  
  // Auto-redirect to login if not authenticated and loading is done
  useEffect(() => {
    if (!authLoading && !seller) {
      navigate('/login')
    }
  }, [seller, authLoading, navigate])

  // Redirect if not logged in
  if (!seller) {
    return (
      <div className="seller-dashboard">
        <div className="container">
          <div className="not-logged-in">
            <h2>Vous n'êtes pas connecté</h2>
            <p>Connectez-vous pour accéder à votre tableau de bord</p>
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-primary">Se connecter</Link>
              <Link to="/register" className="btn btn-outline">Créer un compte</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  const formatPrice = (p) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(p)
  
  return (
    <div className="seller-dashboard">
      <div className="container">
        <motion.div 
          className="dashboard-content"
          initial={{opacity:0}} 
          animate={{opacity:1}}
        >
          <h1>Tableau de bord - {seller.name}</h1>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-inner">
                <div className="stat-icon revenue"><DollarSign/></div>
                <div className="stat-content">
                  <span>Revenus</span>
                  <span>{formatPrice(stats.totalRevenue)}</span>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-inner">
                <div className="stat-icon orders"><ShoppingCart/></div>
                <div className="stat-content">
                  <span>Commandes</span>
                  <span>{stats.totalOrders}</span>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-inner">
                <div className="stat-icon products"><Package/></div>
                <div className="stat-content">
                  <span>Produits</span>
                  <span>{stats.totalProducts}</span>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-inner">
                <div className="stat-icon pending"><Package/></div>
                <div className="stat-content">
                  <span>En attente</span>
                  <span>{stats.pendingOrders}</span>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-inner">
                <div className="stat-icon completed"><CheckCircle size={20} /></div>
                <div className="stat-content">
                  <span>Terminées</span>
                  <span>{stats.completedOrders}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="dashboard-actions">
            <Link to="/publish" className="btn btn-primary">Nouveau produit</Link>
            <Link to="/my-products" className="btn btn-outline">Gérer mes produits</Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
