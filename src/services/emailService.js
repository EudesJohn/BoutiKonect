/**
 * Service d'authentification par Email
 * Gère: vérification email, mot de passe oublié, changement de mot de passe
 * Utilise Firebase Auth pour l'envoi des emails
 */

import { auth } from '../firebase/config'
import {
  sendEmailVerification,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendPasswordResetEmail,
  verifyBeforeUpdateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut
} from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import authService from './authService'

// URL de l'application (pour les liens d'email)
// CORRECTION : On s'assure que l'URL est propre et on gère mieux le fallback pour le mobile
const getAppUrl = () => {
  const url = import.meta.env.VITE_APP_URL || window.location.origin;
  return url.replace(/\/$/, '') || 'https://BoutiKonect229.com'; // Fallback mis à jour
};

// Clé pour stocker l'email pendant la vérification
const EMAIL_SIGNIN_KEY = 'BoutiKonect_email_for_signin'
const LAST_EMAIL_SENT_KEY = 'BoutiKonect_last_email_sent'

/**
 * Envoie un lien de vérification d'email lors de l'inscription
 */
export const sendVerificationEmail = async (user) => {
  try {
    if (!auth || !user) {
      console.warn('Firebase Auth non initialisé ou utilisateur manquant')
      return { success: false, error: 'Service non disponible' }
    }

    // Prévention du spam/rate-limit sur mobile
    const lastSent = localStorage.getItem(LAST_EMAIL_SENT_KEY)
    const now = Date.now()
    if (lastSent && (now - parseInt(lastSent)) < 60000) { // 1 minute de délai
      return { success: true, message: 'Un email a déjà été envoyé récemment.' }
    }

    const APP_URL = getAppUrl();
    const actionCodeSettings = {
      url: `${APP_URL}/login?emailVerified=true`,
      handleCodeInApp: false,
    }

    try {
      console.log("📧 Tentative d'envoi d'email avec paramètres...");
      await sendEmailVerification(user, actionCodeSettings);
      console.log("✅ Email envoyé avec succès (avec paramètres).");
    } catch (e) {
      console.warn("⚠️ Échec avec paramètres, tentative de secours... Erreur:", e.message);
      try {
        await sendEmailVerification(user);
        console.log("✅ Email de secours envoyé avec succès (sans paramètres).");
      } catch (fallbackError) {
        console.error("❌ L'envoi de secours a aussi échoué:", fallbackError);
        // On remonte l'erreur pour qu'elle soit traitée par le catch externe.
        throw fallbackError;
      }
    }

    localStorage.setItem(LAST_EMAIL_SENT_KEY, now.toString())
    console.log('📧 Lien de vérification envoyé à:', user.email)
    return { success: true, message: 'Lien de vérification envoyé à votre email!' }
  } catch (error) {
    console.error('❌ Erreur envoi email:', error)
    return { success: false, error: formatAuthError(error.code) }
  }
}

/**
 * Vérifie si le lien est un lien de vérification d'email
 */
export const isEmailVerificationLink = (url) => {
  return url?.includes('verify-email') || isSignInWithEmailLink(auth, url || window.location.href)
}

/**
 * Complete l'inscription avec le lien d'email
 */
export const completeEmailVerification = async (email) => {
  try {
    if (!auth) {
      return { success: false, error: 'Service non disponible' }
    }

    // Récupérer l'email stocké
    const storedEmail = localStorage.getItem(EMAIL_SIGNIN_KEY) || email

    // Vérifier si c'est un lien de connexion par email
    if (isSignInWithEmailLink(auth, window.location.href)) {
      const result = await signInWithEmailLink(auth, storedEmail, window.location.href)

      // Nettoyer
      localStorage.removeItem(EMAIL_SIGNIN_KEY)

      console.log('✅ Email vérifié:', result.user.email)
      return {
        success: true,
        user: {
          uid: result.user.uid,
          email: result.user.email,
          emailVerified: result.user.emailVerified
        }
      }
    }

    return { success: false, error: 'Lien de vérification invalide' }
  } catch (error) {
    console.error('❌ Erreur vérification:', error)
    return { success: false, error: formatAuthError(error.code) }
  }
}

/**
 * Envoie un lien de réinitialisation de mot de passe
 */
export const sendPasswordResetLink = async (email) => {
  // Délégation au service d'authentification principal
  return await authService.sendPasswordResetEmail(email)
}

/**
 * Envoie un lien pour changer l'email (avant changement)
 */
export const sendEmailChangeVerification = async (email, newEmail) => {
  // Délégation au service d'authentification (inclut les vérifications de sécurité et blocage Google)
  return await authService.updateEmailWithVerification(newEmail)
}

/**
 * Connexion avec Google
 */
export const signInWithGoogle = async () => {
  try {
    if (!auth) {
      return { success: false, error: 'Service non disponible' }
    }

    const provider = new GoogleAuthProvider()

    const result = await signInWithPopup(auth, provider)

    // 🛡️ FIX : Créer le profil Firestore pour les nouveaux utilisateurs Google
    const db = getFirestore()
    const userDocRef = doc(db, 'users', result.user.uid)
    const userDocSnap = await getDoc(userDocRef)

    if (!userDocSnap.exists()) {
      await setDoc(userDocRef, {
        uid: result.user.uid,
        id: result.user.uid,
        name: result.user.displayName || 'Utilisateur Google',
        email: result.user.email,
        isSeller: false,
        role: 'user',
        isAdmin: false,
        createdAt: serverTimestamp(),
        avatar: result.user.photoURL,
        devices: [authService.getDeviceId()],
        lastLogin: new Date().toISOString()
      })
    }

    console.log('✅ Connexion Google:', result.user.email)

    return {
      success: true,
      user: {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        emailVerified: result.user.emailVerified,
        isGoogle: true
      }
    }
  } catch (error) {
    console.error('❌ Erreur Google:', error)

    if (error.code === 'auth/popup-closed-by-user') {
      return { success: false, error: 'Connexion annulée' }
    }

    return { success: false, error: formatAuthError(error.code) }
  }
}

/**
 * Déconnexion
 */
export const logout = async () => {
  try {
    if (auth) {
      await firebaseSignOut(auth)
    }

    // Nettoyer le localStorage
    localStorage.removeItem(EMAIL_SIGNIN_KEY)

    return { success: true }
  } catch (error) {
    console.error('❌ Erreur déconnexion:', error)
    return { success: false, error: 'Erreur lors de la déconnexion' }
  }
}

/**
 * Formate les erreurs Firebase Auth en messages français
 */
const formatAuthError = (errorCode) => {
  const errors = {
    'auth/email-already-in-use': 'Cet email est déjà utilisé',
    'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères',
    'auth/invalid-email': 'Adresse email invalide',
    'auth/user-not-found': 'Aucun compte trouvé avec cet email',
    'auth/wrong-password': 'Mot de passe incorrect',
    'auth/user-disabled': 'Ce compte a été désactivé',
    'auth/too-many-requests': 'Trop de tentatives. Veuillez réessayer plus tard',
    'auth/network-request-failed': 'Erreur de connexion. Vérifiez votre internet',
    'auth/popup-closed-by-user': 'Connexion annulée',
    'auth/account-exists-with-different-credential': 'Un compte existe déjà avec cet email. Utilisez une autre méthode de connexion',
    'auth/requires-recent-login': 'Veuillez vous reconnecter pour effectuer cette action',
    'auth/invalid-action-code': 'Le lien a expiré ou est invalide',
    'auth/expired-action-code': 'Le lien a expiré. Veuillez faire une nouvelle demande'
  }

  return errors[errorCode] || 'Une erreur est survenue. Veuillez réessayer.'
}

export default {
  sendVerificationEmail,
  isEmailVerificationLink,
  completeEmailVerification,
  sendPasswordResetLink,
  sendEmailChangeVerification,
  signInWithGoogle,
  logout
}
