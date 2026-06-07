// Services Firebase pour la synchronisation en temps réel
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore'
import { db } from './config'

// ==================== PRODUITS ====================

// Écouter les produits en temps réel
export const subscribeToProducts = (callback) => {
  if (!db) {
    console.warn('Firebase non configuré')
    return () => {}
  }
  
  const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'))
  
  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString()
    }))
    callback(products)
  })
}

// Ajouter un produit
export const addProductToFirebase = async (productData) => {
  if (!db) {
    console.warn('Firebase non configuré')
    return null
  }
  
  try {
    const docRef = await addDoc(collection(db, 'products'), {
      ...productData,
      createdAt: serverTimestamp()
    })
    return docRef.id
  } catch (error) {
    console.error('Erreur ajout produit:', error)
    return null
  }
}

// Mettre à jour un produit
export const updateProductInFirebase = async (productId, data) => {
  if (!db) return false
  
  try {
    await updateDoc(doc(db, 'products', productId), data)
    return true
  } catch (error) {
    console.error('Erreur mise à jour produit:', error)
    return false
  }
}

// Supprimer un produit
export const deleteProductFromFirebase = async (productId) => {
  if (!db) return false
  
  try {
    await deleteDoc(doc(db, 'products', productId))
    return true
  } catch (error) {
    console.error('Erreur suppression produit:', error)
    return false
  }
}

// ==================== UTILISATEURS ====================

// Écouter les utilisateurs en temps réel
export const subscribeToUsers = (callback) => {
  if (!db) return () => {}
  
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
  
  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(users)
  })
}

// Ajouter un utilisateur
export const addUserToFirebase = async (userData) => {
  if (!db) return null
  
  try {
    const docRef = await addDoc(collection(db, 'users'), {
      ...userData,
      createdAt: serverTimestamp()
    })
    return docRef.id
  } catch (error) {
    console.error('Erreur ajout utilisateur:', error)
    return null
  }
}

// ==================== NOTIFICATIONS ADMIN ====================

// Écouter les nouvelles notifications admin en temps réel
export const subscribeToAdminNotifications = (callback) => {
  if (!db) return () => {}
  
  const q = query(collection(db, 'adminNotifications'), orderBy('createdAt', 'desc'))
  
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString()
    }))
    callback(notifications)
  })
}

// Créer une notification pour l'admin
export const createAdminNotification = async (type, data) => {
  if (!db) return null
  
  try {
    const docRef = await addDoc(collection(db, 'adminNotifications'), {
      type, // 'new_product', 'new_user', 'new_order'
      data,
      read: false,
      createdAt: serverTimestamp()
    })
    return docRef.id
  } catch (error) {
    console.error('Erreur création notification:', error)
    return null
  }
}

// Marquer notification comme lue
export const markNotificationAsRead = async (notificationId) => {
  if (!db) return false
  
  try {
    await updateDoc(doc(db, 'adminNotifications', notificationId), { read: true })
    return true
  } catch (error) {
    console.error('Erreur mise à jour notification:', error)
    return false
  }
}
