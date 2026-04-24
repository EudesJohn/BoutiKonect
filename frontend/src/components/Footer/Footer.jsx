import { Link } from 'react-router-dom'
import { Store, Phone, Mail, MapPin, Facebook, Instagram, Twitter } from 'lucide-react'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* About */}
          <div className="footer-section">
            <Link to="/" className="footer-logo">
              <div className="footer-logo-icon">
                <Store size={24} />
              </div>
              <span className="footer-logo-text">
                <span className="logo-primary">Bouti</span>
                <span className="logo-number">Konect</span>
                <span className="logo-domain">.bj</span>
              </span>
            </Link>
            <p className="footer-desc">
              Votre marketplace locale de confiance. Achetez et vendez facilement avec des vendeurs de votre quartier.
            </p>
            <div className="footer-social">
              <a href="https://www.facebook.com/profile.php?id=61586253654189" target="_blank" rel="noopener noreferrer" className="social-link"><Facebook size={20} /></a>
              <a href="https://www.instagram.com/BoutiKonect229" target="_blank" rel="noopener noreferrer" className="social-link"><Instagram size={20} /></a>
              <a href="https://x.com/BoutiKonect229" target="_blank" rel="noopener noreferrer" className="social-link"><Twitter size={20} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h4 className="footer-title">Liens Rapides</h4>
            <ul className="footer-links">
              <li><Link to="/">Accueil</Link></li>
              <li><Link to="/products">Produits</Link></li>
              <li><Link to="/services">Services</Link></li>
              <li><Link to="/register">Devenir Vendeur</Link></li>
              <li><Link to="/cart">Panier</Link></li>
              <li><Link to="/publish?type=service">Proposer un Service</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div className="footer-section">
            <h4 className="footer-title">Catégories</h4>
            <ul className="footer-links">
              <li><Link to="/products?category=Electronique">Electronique</Link></li>
              <li><Link to="/products?category=Vêtements">Vêtements</Link></li>
              <li><Link to="/services?category=Dépannage">Dépannage</Link></li>
              <li><Link to="/services?category=Ménage">Ménage</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-section">
            <h4 className="footer-title">Contact</h4>
            <ul className="footer-contact">
              <li>
                <Phone size={16} />
                <span>+229 01 40 57 13 73</span>
              </li>
              <li>
                <Mail size={16} />
                <span>BoutiKonectbj229@gmail.com</span>
              </li>
              <li>
                <MapPin size={16} />
                <span>Cotonou, Bénin</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} BoutiKonect.bj. Tous droits réservés.</p>
          <div className="footer-bottom-links">
            <Link to="/terms">Conditions d'utilisation</Link>
            <Link to="/privacy">Politique de confidentialité</Link>
            <span style={{ opacity: 0.4, fontSize: '0.8rem', marginLeft: '10px' }}>v2.8 DeepForce</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
