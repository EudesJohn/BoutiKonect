/**
 * Service de gestion des avis et notations produits
 * Utilise Firebase Firestore pour la persistance
 */
import { db } from '../firebase/config'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  orderBy,
  serverTimestamp,
  setDoc
} from 'firebase/firestore'

/**
 * Obtenir tous les avis depuis Firestore
 */
const getAllReviews = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'reviews'))
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Erreur lecture avis:', error)
    return []
  }
}

export const getItemReviews = async (itemId) => {
  try {
    const reviewsRef = collection(db, 'reviews')
    const q = query(reviewsRef, where('productId', '==', itemId), orderBy('createdAt', 'desc'))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error(`Erreur lecture avis pour ${itemId}:`, error)
    return []
  }
}

export const getItemRating = async (itemId) => {
  const reviews = await getItemReviews(itemId)
  if (reviews.length === 0) return { average: 0, count: 0 }
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
  const average = totalRating / reviews.length
  return { average: Math.round(average * 10) / 10, count: reviews.length }
}

export const addReview = async (itemId, reviewerName, rating, comment, reviewerId = null) => {
  if (!itemId) return { success: false, error: 'ID requis' }
  if (!reviewerName || !reviewerName.trim()) return { success: false, error: 'Nom requis' }
  if (!rating || rating < 1 || rating > 5) return { success: false, error: 'Note invalide' }
  if (!comment || !comment.trim()) return { success: false, error: 'Commentaire requis' }
  if (!reviewerId) return { success: false, error: 'Vous devez être connecté pour laisser un avis.' }

  const hasReviewed = await hasUserReviewed(itemId, reviewerId)
  if (hasReviewed) return { success: false, error: 'Vous avez déjà noté cet élément' }

  const newReview = {
    productId: itemId, // On garde 'productId' en DB pour la compatibilité existante
    reviewerName: reviewerName.trim(),
    reviewerId,
    rating: parseInt(rating),
    comment: comment.trim(),
    createdAt: serverTimestamp()
  }

  try {
    // 🛡️ SÉCURITÉ : Utiliser un ID détermiste (userId_productId) 
    // pour que Firestore rejette automatiquement les doublons si configuré.
    const reviewId = `${reviewerId}_${itemId}`;
    const docRef = doc(db, 'reviews', reviewId);
    await setDoc(docRef, newReview);
    return { success: true, review: { id: reviewId, ...newReview } }
  } catch (error) {
    console.error('Erreur sauvegarde avis:', error)
    return { success: false, error: 'Erreur sauvegarde (vous avez peut-être déjà noté ce produit)' }
  }
}

export const hasUserReviewed = async (itemId, userId) => {
  if (!userId) return false
  try {
    const reviewsRef = collection(db, 'reviews')
    const q = query(reviewsRef, where('productId', '==', itemId), where('reviewerId', '==', userId))
    const querySnapshot = await getDocs(q)
    return !querySnapshot.empty
  } catch (error) {
    return false
  }
}

export default {
  getItemReviews,
  getItemRating,
  addReview,
  hasUserReviewed,
  deleteReview: async (id) => { try { await deleteDoc(doc(db, 'reviews', id)); return { success: true } } catch (e) { return { success: false } } }
}
