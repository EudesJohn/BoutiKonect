import { useState, useContext, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'
import { Search, ShoppingCart, User, Plus, LogOut, Store, Menu, X, Package, Briefcase } from 'lucide-react'
import './Navbar.css'

export default function Navbar() {
  const { seller, user, cart, filters, setFilters, logoutSeller, logoutUser, checkIsAdmin } = useContext(AppContext)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  const isAdmin = checkIsAdmin(seller) || checkIsAdmin(user)

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    setFilters({ ...filters, search: searchQuery })
    navigate('/products')
    setMobileMenuOpen(false)
  }

  const handleLogout = async () => {
    await logoutUser()
    navigate('/')
    setMobileMenuOpen(false)
    setDropdownOpen(false)
  }

  const closeDropdown = () => {
    setDropdownOpen(false)
    setMobileMenuOpen(false)
  }

  const cartCount = Array.isArray(cart) ? cart.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">
            <Store size={28} />
          </div>
          <span className="logo-text">
            <span className="logo-primary">Bouti</span>
            <span className="logo-number">Konect</span>
            <span className="logo-domain">.bj</span>
          </span>
        </Link>

        {/* Search Bar - Desktop */}
        <form className="navbar-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Rechercher un produit ou un service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn">
            <Search size={20} />
          </button>
        </form>

        {/* Navigation Links - Desktop */}
        <div className="navbar-nav">
          <Link to="/products" className="nav-link">
            <span>Produits</span>
          </Link>
          <Link to="/services" className="nav-link">
            <span>Services</span>
          </Link>
          {(seller || user) && (
            <Link to="/profile?tab=orders" className="nav-link">
              <span>Commandes</span>
            </Link>
          )}

          {seller || user ? (
            <Link to="/publish" className="nav-link sell-link">
              <Plus size={20} />
              <span>Vendre</span>
            </Link>
          ) : (
            <Link to="/register" className="nav-link sell-link">
              <Plus size={20} />
              <span>Vendre</span>
            </Link>
          )}
        </div>

        {/* Actions - Desktop */}
        <div className="navbar-actions">
          {/* Cart */}
          <Link to="/cart" className="nav-icon-btn cart-btn">
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="cart-badge">{cartCount}</span>
            )}
          </Link>

          {/* User/Seller Menu — Click-based */}
          {seller || user ? (
            <div className="user-menu" ref={dropdownRef}>
              <button
                className="user-avatar"
                onClick={() => setDropdownOpen(prev => !prev)}
                aria-label="Menu profil"
              >
                {seller?.avatar || user?.avatar ? (
                  <img src={seller?.avatar || user?.avatar} alt="Profil" />
                ) : (
                  (seller?.name || user?.name || 'U').charAt(0).toUpperCase()
                )}
              </button>

              {/* Dropdown — visible uniquement si dropdownOpen */}
              <div className={`user-dropdown ${dropdownOpen ? 'open' : ''}`}>
                <div className="user-info">
                  <span className="user-name">{seller?.name || user?.name}</span>
                  <span className="user-location">
                    {seller?.city || user?.city || ''}{seller?.neighborhood || user?.neighborhood ? `, ${seller?.neighborhood || user?.neighborhood}` : ''}
                  </span>
                </div>
                <Link to="/profile" className="dropdown-item" onClick={closeDropdown}>
                  <User size={16} /> Mon Profil
                </Link>
                <Link to="/my-products" className="dropdown-item" onClick={closeDropdown}>
                  <Package size={16} /> Mes produits
                </Link>
                <Link to="/profile?tab=orders" className="dropdown-item" onClick={closeDropdown}>
                  <Package size={16} /> Mes commandes
                </Link>
                <Link to="/my-services" className="dropdown-item" onClick={closeDropdown}>
                  <Briefcase size={16} /> Mes services
                </Link>
                <Link to="/publish" className="dropdown-item" onClick={closeDropdown}>
                  <Plus size={16} /> Publier un produit
                </Link>
                <Link to="/publish?type=service" className="dropdown-item" onClick={closeDropdown}>
                  <Briefcase size={16} /> Publier un service
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="dropdown-item" onClick={closeDropdown}>
                    <span>⚙️</span> Administration
                  </Link>
                )}
                <button className="dropdown-item logout" onClick={handleLogout}>
                  <LogOut size={16} /> Déconnexion
                </button>
              </div>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="nav-link login-link">
                <User size={20} />
                <span>Connexion</span>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <form className="mobile-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Rechercher un produit ou un service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn">
            <Search size={20} />
          </button>
        </form>

        <div className="mobile-links">
          <Link to="/" onClick={closeDropdown}>Accueil</Link>
          <Link to="/products" onClick={closeDropdown}>Produits</Link>
          <Link to="/services" onClick={closeDropdown}>Services</Link>
          {(seller || user) && <Link to="/profile?tab=orders" onClick={closeDropdown}>Mes Commandes</Link>}
          <Link to="/cart" onClick={closeDropdown}>Panier ({cartCount})</Link>
          <Link to="/profile" onClick={closeDropdown}>Mon Profil</Link>
          {seller || user ? (
            <>
              <Link to="/publish" onClick={closeDropdown}>Publier un produit</Link>
              <Link to="/publish?type=service" onClick={closeDropdown}>Publier un service</Link>
              <Link to="/my-products" onClick={closeDropdown}>Mes produits</Link>
              <Link to="/my-services" onClick={closeDropdown}>Mes services</Link>
              {isAdmin && <Link to="/admin" onClick={closeDropdown}>Administration</Link>}
              <div className="mobile-user-info">
                <span>{seller?.name || user?.name}</span>
                <span>{seller?.city || user?.city}{seller?.neighborhood || user?.neighborhood ? `, ${seller?.neighborhood || user?.neighborhood}` : ''}</span>
              </div>
              <button className="mobile-logout" onClick={handleLogout}>
                <LogOut size={18} /> Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={closeDropdown}>Connexion</Link>
              <Link to="/register" onClick={closeDropdown}>Devenir vendeur</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
