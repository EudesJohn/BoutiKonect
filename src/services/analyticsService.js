/**
 * Service d'analytique pour les vendeurs
 * Stockage dans Firestore pour persistance cross-device
 */
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore'

const db = () => getFirestore()

/**
 * Enregistre une vue produit dans Firestore
 * La clé Firestore est: analytics/{sellerId}/productViews/{productId}
 */
export const trackProductView = async (productId, sellerId) => {
  if (!productId || !sellerId) return
  try {
    const ref = doc(db(), 'analytics', sellerId, 'productViews', productId)
    await setDoc(ref, { views: increment(1), lastUpdated: serverTimestamp() }, { merge: true })
  } catch (e) {
    console.warn('Analytics trackProductView error:', e)
  }
}

/**
 * Enregistre une visite de boutique dans Firestore
 */
export const trackStoreVisit = async (sellerId) => {
  if (!sellerId) return
  try {
    const ref = doc(db(), 'analytics', sellerId)
    await setDoc(ref, { storeVisits: increment(1), lastUpdated: serverTimestamp() }, { merge: true })
  } catch (e) {
    console.warn('Analytics trackStoreVisit error:', e)
  }
}

/**
 * Enregistre une commande dans les stats quotidiennes Firestore
 */
export const trackOrder = async (sellerId, amount) => {
  if (!sellerId) return
  try {
    const today = new Date().toISOString().split('T')[0]
    const ref = doc(db(), 'analytics', sellerId, 'dailyStats', today)
    await setDoc(ref, {
      orders: increment(1),
      revenue: increment(amount || 0),
      date: today
    }, { merge: true })
  } catch (e) {
    console.warn('Analytics trackOrder error:', e)
  }
}

/**
 * Obtient les stats d'un vendeur depuis Firestore
 */
export const getSellerAnalytics = async (sellerId) => {
  if (!sellerId) return getEmptyStats()
  try {
    const mainRef = doc(db(), 'analytics', sellerId)
    const mainDoc = await getDoc(mainRef)
    const mainData = mainDoc.exists() ? mainDoc.data() : {}

    // Stats 7 derniers jours (Optimisé : 1 seule requête query au lieu de 7 docs individuels)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const statsRef = collection(db(), 'analytics', sellerId, 'dailyStats');
    const q = query(statsRef, where('date', '>=', sevenDaysAgoStr));
    const querySnapshot = await getDocs(q);
    
    const statsMap = {};
    querySnapshot.forEach(doc => {
      statsMap[doc.id] = doc.data();
    });

    const weekStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = statsMap[dateStr] || {};
      
      weekStats.push({
        date: dateStr,
        day: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
        orders: dayData.orders || 0,
        revenue: dayData.revenue || 0
      });
    }
    const totalRevenue = weekStats.reduce((sum, day) => sum + day.revenue, 0)

    return {
      totalProductViews: mainData.totalProductViews || 0,
      storeVisits: mainData.storeVisits || 0,
      totalRevenue,
      weekStats
    }
  } catch (e) {
    console.warn('Analytics getSellerAnalytics error:', e)
    return getEmptyStats()
  }
}

const getEmptyStats = () => ({
  totalProductViews: 0,
  storeVisits: 0,
  totalRevenue: 0,
  weekStats: Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return { date: d.toISOString().split('T')[0], day: d.toLocaleDateString('fr-FR', { weekday: 'short' }), orders: 0, revenue: 0 }
  })
})

/**
 * Obtient les stats d'un produit
 */
export const getProductAnalytics = async (productId, sellerId) => {
  if (!productId || !sellerId) return { views: 0 }
  try {
    const ref = doc(db(), 'analytics', sellerId, 'productViews', productId)
    const snap = await getDoc(ref)
    return snap.exists() ? snap.data() : { views: 0 }
  } catch (e) { return { views: 0 } }
}

// Backward compatibility - garde les stats en cache mémoire pour la session
export const getAnalytics = () => ({})
export const initAnalytics = () => ({})
export const generateMockAnalytics = (sellerId, products) => getEmptyStats()

export default {
  initAnalytics,
  getAnalytics,
  trackProductView,
  trackStoreVisit,
  trackOrder,
  getSellerAnalytics,
  getProductAnalytics,
  generateMockAnalytics
}
