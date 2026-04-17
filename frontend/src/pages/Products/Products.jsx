import { useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppContext } from '../../context/AppContext'
import { cities, categories } from '../../context/constants'
import { Filter, X, ChevronLeft, ChevronRight, Star, MapPin, Loader2 } from 'lucide-react'
import ProductCard from '../../components/ProductCard/ProductCard'
import { Skeleton, ProductSkeletonGrid } from '../../components/Skeleton/Skeleton'
import './Products.css'

const ITEMS_PER_PAGE = 12

export default function Products() {
  const { products, filters, setFilters, getFilteredProducts, dataLoading, getCurrentLocation, userLocation, parseDate } = useContext(AppContext)
  const [searchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLocating, setIsLocating] = useState(false)
  
  const filteredProducts = useMemo(() => {
    return getFilteredProducts()
  }, [filters, products, getFilteredProducts])
  
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredProducts, currentPage])
  
  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [totalPages])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const category = searchParams.get('category')
    if (category) {
      setFilters(prevFilters => ({ ...prevFilters, category }))
    } else if (filters.category && !categories.find(c => c.name === filters.category)) {
      // Clear category if it's not a product category (e.g. was set on services page)
      setFilters(prev => ({ ...prev, category: '' }))
    }
  }, [searchParams, setFilters, categories])

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(price)
  }

  const clearFilters = () => {
    setFilters({
      city: '',
      neighborhood: '',
      category: '',
      priceMin: '',
      priceMax: '',
      search: '',
      promoted: false,
      nearMe: false,
      type: 'all'
    })
  }

  const selectedCity = cities.find(c => c.name === filters.city)
  const now = new Date()
  const promotedCount = products.filter(p => {
    const isPromoted = p.isPromoted === true || p.isPromoted === 'true';
    const promoEnd = p.promotionEndDate ? parseDate(p.promotionEndDate) : null;
    return isPromoted && promoEnd && promoEnd > now;
  }).length

  const hasActiveFilters = Object.values(filters).some(v => v && v !== false)

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="products-page">
      <div className="container">
        <div className="products-header">
          <div>
            <h1>{filters.type === 'service' ? 'Tous les Services' : filters.type === 'product' ? 'Tous les Produits' : 'Tout le Catalogue'}</h1>
            <p>{filteredProducts.length} {filters.type === 'service' ? 'service(s)' : filters.type === 'product' ? 'produit(s)' : 'annonce(s)'} - Page {currentPage}/{totalPages}</p>
          </div>
          
          <div className="type-filter-tabs">
            <button 
              className={`type-tab ${filters.type === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterChange('type', 'all')}
            >
              Tout
            </button>
            <button 
              className={`type-tab ${filters.type === 'product' ? 'active' : ''}`}
              onClick={() => handleFilterChange('type', 'product')}
            >
              Produits
            </button>
            <button 
              className={`type-tab ${filters.type === 'service' ? 'active' : ''}`}
              onClick={() => handleFilterChange('type', 'service')}
            >
              Services
            </button>
          </div>

          <button 
            className={`filter-toggle ${isMobile ? 'visible' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} />
            Filtres
            {hasActiveFilters && (
              <span className="filter-count">
                {Object.values(filters).filter(v => v && v !== false).length}
              </span>
            )}
          </button>
        </div>

        {hasActiveFilters && (
          <div className="active-filters">
            {filters.category && (
              <span className="filter-tag">
                {filters.category}
                <button onClick={() => handleFilterChange('category', '')}><X size={14} /></button>
              </span>
            )}
            {filters.city && (
              <span className="filter-tag">
                {filters.city}
                <button onClick={() => handleFilterChange('city', '')}><X size={14} /></button>
              </span>
            )}
            {filters.neighborhood && (
              <span className="filter-tag">
                {filters.neighborhood}
                <button onClick={() => handleFilterChange('neighborhood', '')}><X size={14} /></button>
              </span>
            )}
            {(filters.priceMin || filters.priceMax) && (
              <span className="filter-tag">
                {filters.priceMin ? formatPrice(filters.priceMin) : '0'} - {filters.priceMax ? formatPrice(filters.priceMax) : '+'}
                <button onClick={() => handleFilterChange('priceMin', '')}><X size={14} /></button>
              </span>
            )}
            {filters.promoted && (
              <span className="filter-tag promoted-tag">
                <Star size={14} />
                Vedette
                <button onClick={() => handleFilterChange('promoted', false)}><X size={14} /></button>
              </span>
            )}
            <button className="clear-all" onClick={clearFilters}>Tout effacer</button>
          </div>
        )}

        {isMobile && showFilters && (
          <div className="filter-overlay" onClick={() => setShowFilters(false)} />
        )}

        <div className="products-layout">
          <aside className={`filters-sidebar ${showFilters ? 'show' : ''}`}>
            <div className="filters-header">
              <h3>Filtres</h3>
              <button className="close-filters" onClick={() => setShowFilters(false)}><X size={20} /></button>
            </div>

            {/* Catégorie */}
            <div className="filter-group">
              <label className="filter-label">Catégorie</label>
              <select 
                className="filter-select"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="">Toutes les catégories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Ville */}
            <div className="filter-group">
              <label className="filter-label">Ville</label>
              <select 
                className="filter-select"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
              >
                <option value="">Toutes les villes</option>
                {cities.map(city => (
                  <option key={city.id} value={city.name}>{city.name}</option>
                ))}
              </select>
            </div>

            {/* Zone */}
            {filters.city && selectedCity && (
              <div className="filter-group">
                <label className="filter-label">Zone</label>
                <select 
                  className="filter-select"
                  value={filters.neighborhood}
                  onChange={(e) => handleFilterChange('neighborhood', e.target.value)}
                >
                  <option value="">Toutes les zones</option>
                  {selectedCity.neighborhoods.map(nh => (
                    <option key={nh} value={nh}>{nh}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Prix */}
            <div className="filter-group">
              <label className="filter-label">Prix</label>
              <div className="price-range">
                <input
                  type="number"
                  className="filter-input"
                  placeholder="Min"
                  value={filters.priceMin}
                  onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                />
                <span className="price-separator">-</span>
                <input
                  type="number"
                  className="filter-input"
                  placeholder="Max"
                  value={filters.priceMax}
                  onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                />
              </div>
            </div>

            {/* Produits vedettes */}
            <div className="filter-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.promoted}
                  onChange={(e) => handleFilterChange('promoted', e.target.checked)}
                />
                <span className="checkbox-custom"></span>
                <Star size={16} className="star-icon" />
                <span>Produits en vedette</span>
                {promotedCount > 0 && <span className="count-badge">{promotedCount}</span>}
              </label>
            </div>

            {/* Près de moi */}
            <div className="filter-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.nearMe}
                  disabled={isLocating}
                  onChange={async (e) => {
                    const checked = e.target.checked;
                    if (checked && !userLocation) {
                      setIsLocating(true)
                      try {
                        await getCurrentLocation();
                      } catch (err) {
                        console.error("Loc error", err)
                      } finally {
                        setIsLocating(false)
                      }
                    }
                    handleFilterChange('nearMe', checked);
                  }}
                />
                <span className="checkbox-custom"></span>
                {isLocating ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} className="star-icon" />}
                <span>Près de moi (50km)</span>
              </label>
            </div>

            <button className="btn-apply-filters" onClick={() => setShowFilters(false)}>
              Appliquer
            </button>
          </aside>

          <div className="products-content">
            {dataLoading.products ? (
              <ProductSkeletonGrid count={8} />
            ) : paginatedProducts.length > 0 ? (
              <motion.div 
                className="products-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {paginatedProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="no-products">
                <div className="no-products-icon">🔍</div>
                <h3>Aucun produit trouvé</h3>
                <p>Essayez de modifier vos filtres</p>
                <button className="btn-clear-filters" onClick={clearFilters}>Effacer les filtres</button>
              </div>
            )}
            
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="pagination-btn"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={20} />
                  Précédent
                </button>
                
                <div className="pagination-pages">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`pagination-page ${page === currentPage ? 'active' : ''}`}
                      onClick={() => goToPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button 
                  className="pagination-btn"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

