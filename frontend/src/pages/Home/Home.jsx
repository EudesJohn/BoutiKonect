import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppContext } from '../../context/AppContext'
import { categories, serviceCategories } from '../../context/constants'
import { ArrowRight, Sparkles, Shield, MapPin, MessageCircle, ShoppingBag, Zap, Briefcase, Store, HelpCircle } from 'lucide-react'
import ProductCard from '../../components/ProductCard/ProductCard'
import { Skeleton, ProductSkeletonGrid } from '../../components/Skeleton/Skeleton'
import './Home.css'
import electronicsImg from '../../assets/stickers/electronics.png'
import clothingImg from '../../assets/stickers/clothing.png'
import foodImg from '../../assets/stickers/food.png'
import homeImg from '../../assets/stickers/home.png'
import beautyImg from '../../assets/stickers/beauty.png'
import sportsImg from '../../assets/stickers/sports.png'
import gamesImg from '../../assets/stickers/games.png'
import vehiclesImg from '../../assets/stickers/vehicles.png'
import repairImg from '../../assets/stickers/repair.png'
import cleaningImg from '../../assets/stickers/cleaning.png'
import scissorsImg from '../../assets/stickers/scissors.png'
import laptopImg from '../../assets/stickers/laptop.png'
import bookImg from '../../assets/stickers/book.png'
import truckImg from '../../assets/stickers/truck.png'
import musicImg from '../../assets/stickers/music.png'
import otherProductImg from '../../assets/stickers/other_product.png'
import otherServiceImg from '../../assets/stickers/other_service.png'


export default function Home() {
  const { user, seller, products, services, dataLoading, parseDate, recommendations } = useContext(AppContext)

  const now = new Date()

  // ----------- PRODUCTS -----------
  // Get truly featured products (isPromoted and not expired)
  const allFeaturedProducts = products
    .filter(p => {
      const isPromoted = p.isPromoted === true || p.isPromoted === 'true';
      const promoEnd = p.promotionEndDate ? parseDate(p.promotionEndDate) : null;
      return (p.type === 'product' || !p.type) && isPromoted && promoEnd && promoEnd > now;
    })
    .sort((a, b) => parseDate(b.promotionEndDate) - parseDate(a.promotionEndDate))

  // Fallback if no promoted products: show recent products
  const featuredProducts = allFeaturedProducts.length > 0 
    ? allFeaturedProducts.slice(0, 8) 
    : products.filter(p => p.type === 'product' || !p.type).slice(0, 8)

  // Get recent products
  const recentProducts = [...products]
    .filter(p => p.type === 'product' || !p.type)
    .sort((a, b) => parseDate(b.createdAt) - parseDate(a.createdAt))
    .slice(0, 4)

  // ----------- SERVICES -----------
  // Get truly featured services
  const featuredServices = services
    .filter(s => {
      const isPromoted = s.isPromoted === true || s.isPromoted === 'true';
      const promoEnd = s.promotionEndDate ? parseDate(s.promotionEndDate) : null;
      return isPromoted && promoEnd && promoEnd > now;
    })
    .sort((a, b) => parseDate(b.promotionEndDate) - parseDate(a.promotionEndDate))
    .slice(0, 4)

  // Fallback to recent if no promoted services
  const displayServices = featuredServices.length > 0 
    ? featuredServices 
    : services.slice(0, 4)

  // Get recent services
  const recentServices = [...services].sort((a, b) => 
    parseDate(b.createdAt) - parseDate(a.createdAt)
  ).slice(0, 4)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-glow"></div>
          <div className="hero-pattern"></div>
        </div>
        <div className="hero-container">
          <motion.div 
            className="hero-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="hero-badge">
              <Zap size={16} />
              <span>Marketplace N°1 au Bénin</span>
            </div>
            <h1 className="hero-title">
              Achetez et Vendez <span className="highlight">Facilement</span>
              <br />près de chez vous
            </h1>
            <p className="hero-desc">
              Des milliers de produits et services locaux à votre portée. 
              Trouvez ce que vous cherchez près de chez vous ou mettez en avant votre expertise.
            </p>
            <div className="hero-actions">
              <Link to="/products" className="btn btn-primary btn-large hero-btn">
                <ShoppingBag size={20} />
                Découvrir les produits
              </Link>
              <Link to="/services" className="btn btn-primary btn-large hero-btn">
                <Briefcase size={20} />
                Découvrir les services
              </Link>
              <Link to="/publish?type=service" className="btn btn-primary btn-large hero-btn">
                <Briefcase size={20} />
                Commencer des prestations de service
              </Link>
              <Link to="/publish" className="btn btn-primary btn-large hero-btn">
                <Store size={20} />
                Commencer par vendre
              </Link>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">10K+</span>
                <span className="stat-label">Produits</span>
              </div>
              <div className="stat">
                <span className="stat-number">10K+</span>
                <span className="stat-label">Services</span>
              </div>
              <div className="stat">
                <span className="stat-number">5K+</span>
                <span className="stat-label">Prestataires</span>
              </div>
              <div className="stat">
                <span className="stat-number">5K+</span>
                <span className="stat-label">Vendeurs</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="hero-visual"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="hero-card card-floating">
              <div className="hero-card-image">
                <img src="https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400" alt="Shopping" />
              </div>
              <div className="hero-card-content">
                <span className="hero-card-title">Nouveau</span>
                <span className="hero-card-desc">Collection 2026</span>
              </div>
            </div>
            <div className="hero-card card-floating-delayed">
              <div className="floating-icon">
                <Sparkles size={24} />
              </div>
              <span>Prix réduits</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <motion.div 
            className="features-grid"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            <motion.div className="feature-card" variants={itemVariants}>
              <div className="feature-icon">
                <MapPin size={24} />
              </div>
              <h3>Proximité</h3>
              <p>Trouvez des vendeurs près de chez vous pour des achats rapides et pratiques</p>
            </motion.div>
            <motion.div className="feature-card" variants={itemVariants}>
              <div className="feature-icon">
                <Shield size={24} />
              </div>
              <h3>Sécurisé</h3>
              <p>Transactions sécurisées et protection des acheteurs et vendeurs</p>
            </motion.div>
            <motion.div className="feature-card" variants={itemVariants}>
              <div className="feature-icon">
                <ShoppingBag size={24} />
              </div>
              <h3>Sans Compte</h3>
              <p>Achetez sans créer de compte, simple et rapide</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories">
        <div className="container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
          >
            <h2>Catégories Populaires</h2>
<p>Parcourez nos catégories pour trouver ce que vous recherchez</p>
          </motion.div>

          <motion.div 
            className="categories-grid"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                variants={itemVariants}
                whileHover={{ scale: 1.03 }}
              >
                <Link 
                  to={`/products?category=${category.name}`} 
                  className="category-card"
                  style={{ '--category-color': category.color }}
                >
                  <div className="category-icon">
                    {getCategoryIcon(category.icon)}
                  </div>
                  <span className="category-name">{category.name}</span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories Section - Services */}
      <section className="categories">
        <div className="container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
          >
            <h2>Catégories des services populaires</h2>
            <p>Découvrez les services les plus demandés près de chez vous</p>
          </motion.div>

          <motion.div 
            className="categories-grid"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            {serviceCategories.map((category, index) => (
              <motion.div
                key={category.id}
                variants={itemVariants}
                whileHover={{ scale: 1.03 }}
              >
                <Link 
                  to={`/services?category=${category.name}`} 
                  className="category-card"
                  style={{ '--category-color': category.color }}
                >
                  <div className="category-icon">
                    {getCategoryIcon(category.icon)}
                  </div>
                  <span className="category-name">{category.name}</span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-products">
        <div className="container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
          >
            <div>
              <h2>Produits en Vedette</h2>
              <p>Les meilleures offres selectionnées pour vous</p>
            </div>
            <Link to="/products" className="see-all">
              Voir tout <ArrowRight size={18} />
            </Link>
          </motion.div>

          {dataLoading.products ? (
            <ProductSkeletonGrid count={4} />
          ) : (
            <motion.div 
              className="products-grid"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
            >
              {featuredProducts.length > 0 ? (
                featuredProducts.map((product, index) => (
                  <motion.div key={product.id} variants={itemVariants}>
                    <ProductCard product={product} />
                  </motion.div>
                ))
              ) : (
                <div style={{ 
                  gridColumn: '1 / -1', 
                  textAlign: 'center', 
                  padding: '3rem 1rem',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '12px',
                  border: '1px dashed rgba(255,255,255,0.1)'
                }}>
                  <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>
                    Aucun produit trouvé. Cela peut être dû à un problème de connexion.
                  </p>
                  <button 
                    onClick={() => {
                      cacheService.clearAll();
                      window.location.reload();
                    }}
                    className="btn btn-outline"
                    style={{ padding: '0.5rem 1.5rem' }}
                  >
                    Actualiser la page
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* Personalized Recommendations */}
      {recommendations.length > 0 && (
        <section className="featured-products recommendations-section" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="container">
            <motion.div 
              className="section-header"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
            >
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Sparkles size={24} color="#FFD700" />
                  Sélection pour vous
                </h2>
                <p>Basé sur vos préférences et votre historique</p>
              </div>
            </motion.div>

            <motion.div 
              className="products-grid"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
            >
              {recommendations.map((product) => (
                <motion.div key={`rec-${product.id}`} variants={itemVariants}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Featured Services */}
      {/* Featured Services */}
      <section className="featured-services" style={{ padding: 'var(--space-3xl) 0', background: 'linear-gradient(135deg, #0d1b2a 0%, #1b263b 100%)' }}>
        <div className="container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
          >
            <div>
              <h2>Services en Vedette</h2>
              <p>Trouvez les meilleurs professionnels près de chez vous</p>
            </div>
            <Link to="/services" className="see-all">
              Voir tout <ArrowRight size={18} />
            </Link>
          </motion.div>

          {dataLoading.services ? (
            <ProductSkeletonGrid count={4} />
          ) : (
            <motion.div 
              className="products-grid"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
            >
              {displayServices.length > 0 ? (
                displayServices.map((service) => (
                  <motion.div key={service.id} variants={itemVariants}>
                    <ProductCard product={service} />
                  </motion.div>
                ))
              ) : (
                <div style={{ color: 'var(--text-light)', width: '100%', textAlign: 'center', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <HelpCircle size={40} opacity={0.3} />
                  <p>Aucun service en vedette pour le moment.</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* CTA Section - Hidden if logged in */}
      {!(user || seller) && (
        <section className="cta">
          <div className="container">
            <motion.div 
              className="cta-content"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.1 }}
            >
              <div className="cta-glow"></div>
              <h2>Commencez à Vendre ou Proposer vos Services</h2>
              <p>
                Rejoignez des milliers de vendeurs et professionnels sur BoutiKonect.bj. 
                Publiez vos annonces et atteignez des milliers de clients près de chez vous.
              </p>
              <Link to="/register" className="btn btn-primary btn-large">
                Créer mon compte
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* Recent Products */}
      <section className="recent-products">
        <div className="container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
          >
            <div>
              <h2>Nouveautés</h2>
              <p>Les derniers produits ajoutés par nos vendeurs</p>
            </div>
            <Link to="/products" className="see-all">
              Voir tout <ArrowRight size={18} />
            </Link>
          </motion.div>

          {dataLoading.products ? (
            <div className="recent-grid">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} type="card" />)}
            </div>
          ) : (
            <div className="recent-grid">
              {recentProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recent Services */}
      <section className="recent-products" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
          >
            <div>
              <h2>Nouveaux Services</h2>
              <p>Les derniers services proposés par nos prestataires</p>
            </div>
            <Link to="/services" className="see-all">
              Voir tout <ArrowRight size={18} />
            </Link>
          </motion.div>

          <div className="recent-grid">
            {recentServices.map(service => (
              <ProductCard key={service.id} product={service} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function getCategoryIcon(iconName) {
  const icons = {
    smartphone: electronicsImg,
    shirt: clothingImg,
    apple: foodImg,
    home: homeImg,
    sparkle: beautyImg,
    sparkles: cleaningImg, // Ménage
    scissors: scissorsImg,
    wrench: repairImg,
    laptop: laptopImg,
    book: bookImg,
    dumbbell: sportsImg,
    gamepad2: gamesImg,
    car: vehiclesImg,
    truck: truckImg,
    music: musicImg,
    briefcase: otherServiceImg, // Autres Services
    package: otherProductImg // Autres Produits
  }
  
  const iconSrc = icons[iconName] || otherProductImg;
  return <img src={iconSrc} alt={iconName} className="category-sticker" />;
}

