/**
 * Service d'analytique simplifié avec Supabase
 */
import { supabase } from '../supabase/client'

export const trackView = async (productId) => {
  // Optionnel: incrémenter un compteur de vues dans Supabase
  // await supabase.rpc('increment_view', { x: 1, row_id: productId })
}

export const trackSearch = async (query) => {
  // Logique de tracking de recherche si nécessaire
}

/**
 * Génère des données analytiques fictives pour les tests
 */
export const generateMockAnalytics = () => {
  return {
    views: Math.floor(Math.random() * 500) + 100,
    conversions: Math.floor(Math.random() * 50) + 10,
    revenue: Math.floor(Math.random() * 200000) + 50000
  }
}

export default {
  trackView,
  trackSearch,
  generateMockAnalytics
}
