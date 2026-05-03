import { useContext } from 'react'
import { motion } from 'framer-motion'
import { AppContext } from '../context/AppContextInstance'
import { QuoteLeft, User, Star } from 'lucide-react'

export default function Testimonials() {
  const { testimonials = [] } = useContext(AppContext)

  // Default mock testimonials if none provided via context
  const mockTestimonials = [
    {
      id: 1,
      name: 'Awa K.',
      location: 'Cotonou',
      role: 'Vendeuse de tissus',
      rating: 5,
      text: 'BoutiKonect a transformé mon petit commerce. Je vends maintenant partout au Bénin et même au Togo grâce à la visibilité que la plateforme me donne.',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&q=80&fit=crop&facearea=1'
    },
    {
      id: 2,
      name: 'Koffi M.',
      location: 'Parakou',
      role: 'Artisan menuisier',
      rating: 4,
      text: 'Je reçois des commandes chaque semaine via la plateforme. Le système de paiement mobile money est sécurisé et mes clients l\'adorent.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&q=80&fit=crop&facearea=1'
    },
    {
      id: 3,
      name: 'Zara B.',
      location: 'Abomey-Calavi',
      role: 'Acheteuse régulière',
      rating: 5,
      text: 'Trouver des produits locaux de qualité n\'a jamais été aussi facile. Je recommande BoutiKonect à tous mes amis et famille.',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80&fit=crop&facearea=1'
    }
  ]

  const data = testimonials.length > 0 ? testimonials : mockTestimonials

  return (
    <section className="testimonials" style={{ background: 'var(--bg-secondary)', padding: 'var(--space-3xl) 0' }}>
      <div className="container">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          className="section-title"
        >
          <QuoteLeft size={24} className="mr-2" />
          Ce que nos utilisateurs disent
        </motion.h2>
        <p className="section-subtitle text-center mb-8">
          Des centaines de vendeurs et acheteurs satisfaits au Bénin et dans la région
        </p>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          className="testimonials-grid"
        >
          {data.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: t.id * 0.1 }}
              className="testimonial-card"
            >
              <div className="testimonial-header">
                <img src={t.avatar} alt={t.name} className="testimonial-avatar" />
                <div>
                  <h3 className="testimonial-name">{t.name}</h3>
                  <div className="testimonial-meta">
                    <span className="testimonial-location">📍 {t.location}</span>
                    <span className="testimonial-role">{t.role}</span>
                  </div>
                </div>
              </div>
              <div className="testimonial-rating">
                {[1,2,3,4,5].map(star => (
                  <Star key={star} size={16} color={star <= t.rating ? '#FF9F1C' : '#E0E0E0'} />
                ))}
                <span className="testimonial-rating-number">{t.rating}/5</span>
              </div>
              <p className="testimonial-text">"{t.text}"</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}