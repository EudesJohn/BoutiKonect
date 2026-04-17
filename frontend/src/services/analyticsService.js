/**
 * Service d'analytique simplifié avec Supabase
 */
import { supabase } from '../supabase/client'

export const trackView = async (productId, userId, category = 'Divers', sellerId = null) => {
  if (!productId) return;
  
  try {
    // Si l'utilisateur est connecté, on enregistre dans sa table d'historique
    if (userId) {
      const { error } = await supabase.from('user_history').insert([{
        user_id: userId,
        product_id: productId,
        seller_id: sellerId,
        category: category,
        action_type: 'view'
      }]);
      if (error) console.error('Error tracking view for user:', error);
    }
  } catch (err) {
    console.error('trackView Exception:', err);
  }
}

export const trackSearch = async (query, userId) => {
  // Logique de tracking de recherche si nécessaire
  console.log('Tracking search:', query);
}

export const getRecommendedProducts = async (userId, limit = 8) => {
  if (!userId) return [];
  
  try {
    // 1. Récupérer l'historique récent (vues et catégories)
    const { data: history, error: historyError } = await supabase
      .from('user_history')
      .select('category, seller_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (historyError) throw historyError;
    if (!history || history.length === 0) return [];
    
    // 2. Identifier les catégories et vendeurs favoris
    const categoryCounts = {};
    const sellerCounts = {};
    
    history.forEach(item => {
      if (item.category) categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
      if (item.seller_id) sellerCounts[item.seller_id] = (sellerCounts[item.seller_id] || 0) + 1;
    });
    
    const topCategories = Object.keys(categoryCounts).sort((a, b) => categoryCounts[b] - categoryCounts[a]);
    const topSellers = Object.keys(sellerCounts).sort((a, b) => sellerCounts[b] - sellerCounts[a]);
    
    // 3. Récupérer les produits recommandés
    // On priorise les produits des vendeurs aimés ET des catégories aimées
    const { data: recommended, error: recError } = await supabase
      .from('products')
      .select('*')
      .or(`seller_id.in.("${topSellers.slice(0, 3).join('","')}"),category.in.("${topCategories.slice(0, 3).join('","')}")`)
      .limit(limit);
      
    if (recError) throw recError;

    // Trier pour mettre en avant les vendeurs préférés puis les catégories préférées
    return (recommended || []).sort((a, b) => {
      const aIsTopSeller = topSellers.includes(a.seller_id);
      const bIsTopSeller = topSellers.includes(b.seller_id);
      if (aIsTopSeller && !bIsTopSeller) return -1;
      if (!aIsTopSeller && bIsTopSeller) return 1;
      return 0;
    });
  } catch (err) {
    console.error('getRecommendedProducts error:', err);
    return [];
  }
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
  getRecommendedProducts,
  generateMockAnalytics
}
