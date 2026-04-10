/**
 * Service de gestion des avis et notations produits avec Supabase
 */
import { supabase } from '../supabase/client'

/**
 * Obtenir tous les avis
 */
export const getAllReviews = async () => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  } catch (error) {
    console.error('Erreur lecture avis:', error)
    return []
  }
}

/**
 * Obtenir les avis pour un produit spécifique
 */
export const getItemReviews = async (itemId) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', itemId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  } catch (error) {
    console.error(`Erreur lecture avis pour ${itemId}:`, error)
    return []
  }
}

/**
 * Obtenir la notation moyenne d'un produit
 */
export const getItemRating = async (itemId) => {
  const reviews = await getItemReviews(itemId)
  if (reviews.length === 0) return { average: 0, count: 0 }
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
  const average = totalRating / reviews.length
  return { average: Math.round(average * 10) / 10, count: reviews.length }
}

/**
 * Ajouter un avis
 */
export const addReview = async (itemId, reviewerName, rating, comment, reviewerId) => {
  if (!itemId || !reviewerId) return { success: false, error: 'ID requis' }
  
  const reviewId = `${reviewerId}_${itemId}`
  const newReview = {
    id: reviewId,
    product_id: itemId,
    reviewer_name: reviewerName.trim(),
    reviewer_id: reviewerId,
    rating: parseInt(rating),
    comment: comment.trim()
  }

  try {
    const { data, error } = await supabase.from('reviews').upsert([newReview]).select()
    if (error) throw error
    return { success: true, review: data[0] }
  } catch (error) {
    console.error('Erreur sauvegarde avis:', error)
    return { success: false, error: 'Erreur sauvegarde (vous avez peut-être déjà noté ce produit)' }
  }
}

/**
 * Vérifier si l'utilisateur a déjà noté
 */
export const hasUserReviewed = async (itemId, userId) => {
  if (!userId) return false
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('id')
      .eq('product_id', itemId)
      .eq('reviewer_id', userId)
      .single()
    return !!data
  } catch (error) {
    return false
  }
}

/**
 * Supprimer un avis
 */
export const deleteReview = async (id) => {
  try {
    const { error } = await supabase.from('reviews').delete().eq('id', id)
    if (error) throw error
    return { success: true }
  } catch (e) {
    return { success: false }
  }
}

export default {
  getItemReviews,
  getItemRating,
  addReview,
  hasUserReviewed,
  deleteReview
}
