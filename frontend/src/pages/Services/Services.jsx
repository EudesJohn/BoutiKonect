import { useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppContext } from '../../context/AppContext'
import { cities, serviceCategories } from '../../context/constants'
import { Filter, X, ChevronLeft, ChevronRight, Star, MapPin } from 'lucide-react'
import ProductCard from '../../components/ProductCard/ProductCard'
import { ProductSkeletonGrid } from '../../components/Skeleton/Skeleton'
import './Services.css'

const ITEMS_PER_PAGE = 12

export default function ServicesPage() {
  const { services, filters, setFilters, getFilteredServices, dataLoading, getCurrentLocation, userLocation, parseDate } = useContext(AppContext)
  const [searchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  
  const filteredServices = useMemo(() => {
    return getFilteredServices()
  }, [filters, services, getFilteredServices])
  
  const totalPages = Math.ceil(filteredServices.length / ITEMS_PER_PAGE)
  const paginatedServices = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredServices.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredServices, currentPage])
  
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
    } else if (filters.category && !serviceCategories.find(c => c.name === filters.category)) {
      // Clear category if it's not a service category (e.g. was set on products page)
      setFilters(prev => ({ ...prev, category: '' }))
    }
  }, [searchParams, setFilters])

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
      nearMe: false
    })
  }

  const selectedCity = cities.find(c => c.name === filters.city)
  const now = new Date()
  const promotedCount = services.filter(s => {
    const isPromoted = s.isPromoted === true || s.isPromoted === 'true';
    const promoEnd = s.promotionEndDate ? parseDate(s.promotionEndDate) : null;
    return isPromoted && promoEnd && promoEnd > now;
  }).length

  const hasActiveFilters = Object.values(filters).some(v => v && v !== false)

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="services-page products-page"> {/* Reusing products-page styles for layout */}
      <div className="container">
        <div className="products-header">
          <div>
            <h1>Tous les Services</h1>
            <p>{filteredServices.length} prestataire(s) trouvé(s) - Page {currentPage}/{totalPages}</p>
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
              <label className="filter-label">Catégorie de service</label>
              <select 
                className="filter-select"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="">Tous les services</option>
                {serviceCategories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Ville */}
            <div className="filter-group">
              <label className="filter-label">Ville d'intervention</label>
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

            {/* Services vedettes */}
            <div className="filter-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.promoted}
                  onChange={(e) => handleFilterChange('promoted', e.target.checked)}
                />
                <span className="checkbox-custom"></span>
                <Star size={16} className="star-icon" />
                <span>Prestataires en vedette</span>
                {promotedCount > 0 && <span className="count-badge">{promotedCount}</span>}
              </label>
            </div>

            {/* Près de moi */}
            <div className="filter-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.nearMe}
                  onChange={async (e) => {
                    const checked = e.target.checked;
                    if (checked && !userLocation) {
                      await getCurrentLocation();
                    }
                    handleFilterChange('nearMe', checked);
                  }}
                />
                <span className="checkbox-custom"></span>
                <MapPin size={16} className="star-icon" />
                <span>Près de moi (50km)</span>
              </label>
            </div>

            <button className="btn-apply-filters" onClick={() => setShowFilters(false)}>
              Appliquer
            </button>
          </aside>

          <div className="products-content">
            {dataLoading.services ? (
              <ProductSkeletonGrid count={8} />
            ) : paginatedServices.length > 0 ? (
              <motion.div 
                className="products-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {paginatedServices.map((service, index) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ProductCard product={service} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="no-products">
                <div className="no-products-icon">🛠️</div>
                <h3>Aucun service trouvé</h3>
                <p>Essayez de modifier vos critères de recherche</p>
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
