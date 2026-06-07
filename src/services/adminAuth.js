/**
 * Service d'authentification Admin.
 * Un admin est un utilisateur avec la propriété `isAdmin: true` dans son profil Firestore.
 */

import { auth, db } from '../firebase/config'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

/**
 * @deprecated Cette fonction est conservée pour la compatibilité avec les anciens composants.
 * La véritable source de vérité pour le statut d'administrateur est le drapeau `isAdmin`
 * dans le document de l'utilisateur sur Firestore.
 */
export const isAdminEmail = (email) => {
  // Cette fonction est déconseillée. Utilisez isUserAdmin(user)
  return false;
};

/**
 * Vérifie si l'admin est configuré
 * (La logique est maintenant basée sur les utilisateurs dans la DB)
 */
export const isAdminConfigured = () => {
  return true // Firebase est configuré
}

/**
 * Tente de connecter un utilisateur et vérifie s'il a les droits admin.
 */
export const verifyAdminCredentials = async (email, password) => {
  try {
    // 1. Authentifier l'utilisateur avec Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const authUser = userCredential.user

    // 2. Récupérer le profil depuis Firestore pour vérifier le rôle
    const userDocRef = doc(db, 'users', authUser.uid)
    const userDoc = await getDoc(userDocRef)

    // 3. Vérifier si l'utilisateur est bien un admin
    if (!userDoc.exists() || userDoc.data().isAdmin !== true) {
      await signOut(auth) // Déconnexion de sécurité
      return { success: false, error: "Ce compte n'a pas les privilèges administrateur." }
    }

    console.log('✅ Admin connecté avec succès!')
    const adminData = { id: userDoc.id, ...userDoc.data() }

    return { success: true, admin: adminData }
  } catch (error) {
    console.error('❌ Erreur connexion admin:', error.message)
    
    if (['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'].includes(error.code)) {
      return { success: false, error: 'Email ou mot de passe incorrect.' }
    }
    
    return { success: false, error: 'Email ou mot de passe incorrect' }
  }
}

/**
 * Vérifie si l'utilisateur actuel est admin
 */
export const isUserAdmin = (user) => {
  return user && user.isAdmin === true
}

/**
 * Obtient les informations admin (sans données sensibles)
 */
export const getAdminInfo = () => {
  // Cette fonction est maintenant générique car il n'y a plus un seul admin
  return {
    email: 'N/A',
    phone: 'N/A',
    name: 'Administrateur',
    configured: true
  }
}

/**
 * Masque une adresse email pour l'affichage
 */
const maskEmail = (email) => {
  if (!email) return null
  const [local, domain] = email.split('@')
  const maskedLocal = local.length > 2 
    ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
    : local
  return `${maskedLocal}@${domain}`
}

/**
 * Masque un numéro de téléphone pour l'affichage
 */
const maskPhone = (phone) => {
  if (!phone) return null
  if (phone.length <= 4) return '*'.repeat(phone.length)
  return '*'.repeat(phone.length - 4) + phone.slice(-4)
}

/**
 * Déconnexion admin
 */
export const adminLogout = async () => {
  try {
    if (auth) {
      await signOut(auth)
    }
    return { success: true }
  } catch (error) {
    console.error('❌ Erreur déconnexion:', error)
    return { success: false, error: error.message }
  }
}
