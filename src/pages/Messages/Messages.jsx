import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppContext } from '../../context/AppContext'
import { MessageCircle, ArrowRight, ShoppingBag } from 'lucide-react'
import './Messages.css'

export default function Messages() {
  const { products } = useContext(AppContext)

  // Get recent products that have WhatsApp
  const productsWithWhatsApp = products.filter(p => p.whatsapp).slice(0, 6)

  return (
    <div className="messages-page">
      <div className="container">
        <motion.div 
          className="whatsapp-contact-page"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="whatsapp-header">
            <div className="whatsapp-icon">
              <MessageCircle size={60} />
            </div>
            <h1>Contactez les Vendeurs</h1>
            <p>Pour contacter un vendeur, rendez-vous sur la page du produit et utilisez le bouton WhatsApp</p>
          </div>

          <div className="products-quick-contact">
            <h2>Produits récents</h2>
            <div className="products-grid-quick">
              {productsWithWhatsApp.map(product => (
                <div key={product.id} className="quick-product-card">
                  <div className="quick-product-image">
                    <img src={product.images[0]} alt={product.title} />
                  </div>
                  <div className="quick-product-info">
                    <h3>{product.title}</h3>
                    <p className="quick-price">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'XOF',
                        minimumFractionDigits: 0
                      }).format(product.price)}
                    </p>
                    <p className="quick-seller">{product.sellerName}</p>
                    <a 
                      href={`https://wa.me/${product.whatsapp}?text=Bonjour, je suis intéressé par votre produit: ${product.title}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="whatsapp-btn-quick"
                    >
                      <MessageCircle size={18} />
                      Contacter sur WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="contact-instructions">
            <h3>Comment contacter un vendeur?</h3>
            <ol>
              <li>
                <span className="step-number">1</span>
                <span>Naviguez vers la page <Link to="/products">Produits</Link></span>
              </li>
              <li>
                <span className="step-number">2</span>
                <span>Cliquez sur un produit qui vous interesse</span>
              </li>
              <li>
                <span className="step-number">3</span>
                <span>Cliquez sur le bouton "WhatsApp" pour contacter le vendeur</span>
              </li>
            </ol>
            
            <Link to="/products" className="btn btn-primary btn-large">
              <ShoppingBag size={20} />
              Voir les produits
              <ArrowRight size={20} />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
