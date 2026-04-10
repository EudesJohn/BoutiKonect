import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Search, ArrowLeft } from 'lucide-react'
import './NotFound.css'

export default function NotFound() {
  return (
    <div className="not-found-page">
      <div className="container">
        <motion.div 
          className="not-found-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="not-found-number">404</div>
          <h1>Page non trouvée</h1>
          <p>
            Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
          </p>
          
          <div className="not-found-actions">
            <Link to="/" className="btn btn-primary">
              <Home size={20} />
              Retour à l'accueil
            </Link>
            <Link to="/products" className="btn btn-outline">
              <Search size={20} />
              Parcourir les produits
            </Link>
          </div>

          <div className="not-found-suggestions">
            <h3>Suggestions:</h3>
            <ul>
              <li><Link to="/">Accueil</Link></li>
              <li><Link to="/products">Tous les produits</Link></li>
              <li><Link to="/register">Créer un compte</Link></li>
              <li><Link to="/login">Se connecter</Link></li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

