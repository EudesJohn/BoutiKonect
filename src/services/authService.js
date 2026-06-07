/**
 * Service d'authentification avancé
 * Gère: vérification email, nouvel appareil, synchronisation mot de passe
 */

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  onAuthStateChanged,
  updatePassword,
  signOut,
  fetchSignInMethodsForEmail,
  verifyBeforeUpdateEmail,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  deleteUser,
  getMultiFactorResolver
} from 'firebase/auth'
import { getFirestore, doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore'

// Track connected devices
const DEVICES_KEY = 'BoutiKonect_connected_devices'

export const getDeviceId = () => {
  const STORAGE_KEY = 'BoutiKonect_device_id'
  let deviceId = localStorage.getItem(STORAGE_KEY)

  // Générer un "fingerprint" plus robuste (cores, plateforme, résolution)
  // FIX: encodeURIComponent évite le crash btoa() sur les caractères accentués/emojis
  const fingerprintStr = encodeURIComponent([
    navigator.userAgent,
    navigator.language,
    navigator.hardwareConcurrency || 'unknown',
    navigator.platform,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset()
  ].join('|'))
  const fingerprint = btoa(fingerprintStr).substring(0, 16)

  if (!deviceId || !deviceId.startsWith(fingerprint)) {
    // Si pas d'ID ou si l'ID ne correspond plus au fingerprint de l'appareil
    // on en génère un nouveau combiné au fingerprint
    const random = Math.random().toString(36).substring(2, 10)
    deviceId = `${fingerprint}_${random}_${Date.now()}`
    localStorage.setItem(STORAGE_KEY, deviceId)
  }

  return deviceId
}

/**
 * Inscrit un nouvel utilisateur avec vérification email
 * Utilise Firebase Auth pour l'envoi de l'email de vérification
 */
export const registerWithEmailVerification = async (email, password, userData) => {
  const auth = getAuth()
  const db = getFirestore()
  let firebaseUser = null

  try {
    // Vérifier si l'email existe déjà
    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, email)
      if (signInMethods && signInMethods.length > 0) {
        return { success: false, error: 'Cet email est déjà utilisé par un autre compte.', emailExists: true }
      }
    } catch (e) { /* non-bloquant */ }

    // Créer l'utilisateur Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    firebaseUser = userCredential.user

    await sendEmailVerification(firebaseUser)

    const userId = firebaseUser.uid
    const newUserData = {
      ...userData, email, id: userId, uid: userId,
      isEmailVerified: false,
      isSeller: userData.isSeller !== undefined ? userData.isSeller : false,
      createdAt: serverTimestamp(),
      devices: [getDeviceId()],
      lastLogin: new Date().toISOString(),
      role: 'user',
      isAdmin: false
    }
    delete newUserData.password

    // ANTI-GHOST: si Firestore échoue, on supprime l'utilisateur Auth créé
    try {
      await setDoc(doc(db, 'users', userId), newUserData)
    } catch (firestoreError) {
      console.error('Firestore failed, rolling back Auth user:', firestoreError)
      await deleteUser(firebaseUser)
      return { success: false, error: 'Erreur de création du profil. Veuillez réessayer.' }
    }

    await signOut(auth)

    return {
      success: true,
      message: 'Un email de vérification a été envoyé. Veuillez vérifier votre boîte email.',
      needsVerification: true, email
    }

  } catch (error) {
    // Si Auth a été créé mais qu'une autre erreur s'est produite, on nettoie
    if (firebaseUser) {
      try { await deleteUser(firebaseUser) } catch (e) { /* best effort */ }
    }
    console.error('Registration error:', error)
    return { success: false, error: getErrorMessage(error.code) }
  }
}

/**
 * Login simple et sécurisé (Remplacement de authSystem.js)
 */


/**
 * Met à jour l'email avec vérification préalable
 */
export const updateEmailWithVerification = async (newEmail) => {
  const auth = getAuth()
  const user = auth.currentUser
  if (!user) return { success: false, error: "Utilisateur non authentifié." }

  // 1. Bloquer si l'utilisateur est connecté via Google
  const isGoogleAccount = user.providerData.some(provider => provider.providerId === 'google.com')
  if (isGoogleAccount) {
    return {
      success: false,
      error: "Vous êtes connecté avec Google. Vous ne pouvez pas modifier cette adresse e-mail directement depuis l'application."
    }
  }

  if (!newEmail || !/^\S+@\S+\.\S+$/.test(newEmail)) {
    return { success: false, error: "L'adresse e-mail fournie est invalide." }
  }

  // 2. Vérifier si c'est la même adresse
  if (newEmail.toLowerCase() === user.email.toLowerCase()) {
    return { success: false, error: "Veuillez saisir une adresse e-mail différente de votre adresse actuelle." }
  }

  try {
    // En appelant la fonction SANS actionCodeSettings, Firebase va utiliser 
    // son modèle par défaut et sa propre page de traitement sécurisée.
    await verifyBeforeUpdateEmail(user, newEmail)
    return {
      success: true,
      message: "Pour des raisons de sécurité, un lien de validation a été envoyé à votre NOUVELLE adresse. Firebase a également envoyé une notification à votre ANCIENNE adresse pour vous alerter."
    }
  } catch (error) {
    console.error("Erreur mise à jour email:", error)
    return { success: false, error: getErrorMessage(error.code) }
  }
}

// MFA et OTP personnalisés obsolètes - Suppression pour passage au natif Firebase

/**
 * Envoi de l'email de réinitialisation du mot de passe
 */
export const sendPasswordResetEmail = async (email) => {
  const auth = getAuth()
  try {
    await firebaseSendPasswordResetEmail(auth, email)
    return { success: true, message: 'Un lien de réinitialisation a été envoyé à votre adresse e-mail.' }
  } catch (error) {
    return { success: false, error: getErrorMessage(error.code) }
  }
}

/**
 * Login avec support Custom Email MFA
 */
export const loginUser = async (email, password, rememberMe = true) => {
  const auth = getAuth()
  const db = getFirestore()
  try {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence)
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user

    // 🛡️ SÉCURITÉ: Bloquer la connexion si l'e-mail n'a jamais été validé (Fermeture du bypass)
    if (!firebaseUser.emailVerified) {
      await signOut(auth)
      return { success: false, error: 'Veuillez vérifier votre adresse e-mail en cliquant sur le lien reçu avant de vous connecter.' }
    }

    const userDocSnap = await getDoc(doc(db, 'users', firebaseUser.uid))
    if (!userDocSnap.exists()) return { success: false, error: "Profil introuvable." }

    const userData = { id: userDocSnap.id, ...userDocSnap.data() }
    delete userData.password

    // MFA ignoré pour le moment (Spark plan / Spark limits)
    return { success: true, user: userData }
  } catch (error) {
    if (error.code === 'auth/multi-factor-auth-required') {
      return {
        success: false,
        mfaRequired: true,
        mfaType: 'native',
        resolver: getMultiFactorResolver(auth, error),
        hints: error.customData?._mfa?.hints || []
      }
    }
    console.error("Erreur loginUser:", error)
    return { success: false, error: getErrorMessage(error.code) }
  }
}

// Custom OTP Logic supprimée

/**
 * Inscription simple et sécurisée (Remplacement de authSystem.js)
 */
export const registerUser = async (userData) => {
  const { email, password, name } = userData
  const auth = getAuth()
  const db = getFirestore()
  let firebaseUser = null

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    firebaseUser = userCredential.user

    const newProfile = {
      ...userData,
      email,
      uid: firebaseUser.uid,
      id: firebaseUser.uid,
      isEmailVerified: false,
      createdAt: serverTimestamp(),
      isSeller: userData.isSeller !== undefined ? userData.isSeller : false,
      role: 'user',
      isAdmin: false,
      devices: [getDeviceId()],
      lastLogin: new Date().toISOString()
    }
    delete newProfile.password // NE PAS STOCKER LE MOT DE PASSE

    // ANTI-GHOST: si Firestore échoue, on supprime l'utilisateur Auth créé
    try {
      await setDoc(doc(db, 'users', firebaseUser.uid), newProfile)
    } catch (firestoreError) {
      console.error('Firestore failed, rolling back Auth user:', firestoreError)
      await deleteUser(firebaseUser)
      return { success: false, error: 'Erreur de création du profil. Veuillez réessayer.' }
    }

    // Envoyer l'email de vérification sans bloquer
    sendEmailVerification(firebaseUser).catch(e => console.error("Erreur envoi email verification:", e))

    // 🛡️ FIX : Déconnecter immédiatement l'utilisateur fraîchement créé pour l'obliger à valider son email
    await signOut(auth)

    return { success: true, user: newProfile }
  } catch (error) {
    // Si Auth a été créé mais qu'une autre erreur s'est produite, on nettoie
    if (firebaseUser) {
      try { await deleteUser(firebaseUser) } catch (e) { /* best effort */ }
    }
    console.error("Erreur registerUser:", error)
    return { success: false, error: getErrorMessage(error.code) }
  }
}

/**
 * Met à jour le mot de passe et synchronise avec toutes les bases de données
 */
export const updatePasswordAndSync = async (firebaseUser, newPassword) => {
  const auth = getAuth()
  const db = getFirestore()

  try {
    // Update password in Firebase Auth
    await updatePassword(firebaseUser, newPassword)

    // Update in Firestore
    const userDocRef = doc(db, 'users', firebaseUser.uid)
    await updateDoc(userDocRef, {
      passwordUpdatedAt: new Date().toISOString(),
      mustUpdateAllDevices: true
    })

    // Note: Utilisation exclusive de Firestore en production

    // Update in secureStorage (clear old sessions)
    const { secureRemoveItem } = await import('./secureStorage')
    secureRemoveItem('BoutiKonect_user')
    secureRemoveItem('BoutiKonect_seller')
    localStorage.removeItem('BK_userProfile') // Nettoyage de l'ancienne clé en clair

    // Sign out from all devices
    await signOut(auth)

    return {
      success: true,
      message: 'Mot de passe mis à jour. Veuillez vous reconnecter sur tous vos appareils.'
    }

  } catch (error) {
    console.error('Password update error:', error)
    return {
      success: false,
      error: getErrorMessage(error.code)
    }
  }
}

/**
 * Change le mot de passe avec ré-authentification (Sécurisé)
 */
export const changePassword = async (currentPassword, newPassword) => {
  const auth = getAuth()
  const user = auth.currentUser
  if (!user) return { success: false, error: 'Utilisateur non connecté' }

  // Bloquer le changement de mot de passe pour les comptes Google
  const isGoogleAccount = user.providerData.some(provider => provider.providerId === 'google.com')
  if (isGoogleAccount) {
    return { success: false, error: "Vous êtes connecté avec Google. La gestion du mot de passe se fait via votre compte Google." }
  }

  try {
    const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import('firebase/auth')
    const credential = EmailAuthProvider.credential(user.email, currentPassword)

    // Re-authentifier l'utilisateur avant le changement (Standard de sécurité)
    await reauthenticateWithCredential(user, credential)

    // Rafraîchir l'état de l'utilisateur pour vérifier la validation réelle de l'email
    await user.reload()
    const updatedUser = auth.currentUser

    // Vérifier si l'email est validé (Demande utilisateur)
    if (!updatedUser.emailVerified) {
      return { success: false, error: 'Veuillez d\'abord valider votre adresse e-mail pour changer votre mot de passe.' }
    }

    // Mettre à jour dans Firebase Auth
    await updatePassword(user, newPassword)

    return { success: true }
  } catch (error) {
    console.error('Erreur changement mot de passe:', error)
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      throw new Error('Le mot de passe actuel est incorrect.')
    }
    throw error
  }
}

/**
 * Renvoyer l'email de vérification
 */
export const resendVerificationEmail = async (email, password) => {
  const auth = getAuth()

  try {
    // Sign in briefly to get the user
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    await sendEmailVerification(userCredential.user)
    await signOut(auth)

    return {
      success: true,
      message: 'Email de vérification renvoyé!'
    }
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error.code)
    }
  }
}

/**
 * Vérifie si l'email est vérifié
 */
export const checkEmailVerification = async (firebaseUser) => {
  await firebaseUser.reload()
  return firebaseUser.emailVerified
}

/**
 * Écoute les changements d'état d'authentification
 */
export const onAuthChange = (callback) => {
  const auth = getAuth()
  return onAuthStateChanged(auth, callback)
}

/**
 * Obtient le message d'erreur en français
 */
const getErrorMessage = (code) => {
  const errors = {
    'auth/email-already-in-use': 'Cet email existe déjà. Essayez de vous connecter ou utilisez "Mot de passe oublié" pour récupérer votre compte.',
    'auth/invalid-email': 'Email invalide',
    'auth/operation-not-allowed': 'Opération non autorisée',
    'auth/weak-password': 'Le mot de passe est trop faible',
    'auth/user-disabled': 'Ce compte a été désactivé',
    'auth/user-not-found': 'Aucun compte trouvé avec cet email',
    'auth/wrong-password': 'Mot de passe incorrect',
    'auth/invalid-credential': 'Identifiants invalides',
    'auth/too-many-requests': 'Trop de tentatives. Veuillez réessayer plus tard',
    'auth/network-request-failed': 'Erreur de connexion réseau',
    'auth/popup-closed-by-user': 'Connexion annulée',
    'auth/requires-recent-login': 'Pour votre sécurité, veuillez vous déconnecter puis vous reconnecter avant de modifier ces informations.'
  }

  return errors[code] || 'Une erreur est survenue'
}

/**
 * Déconnecte l'utilisateur de Firebase Auth
 */
export const logoutUser = () => {
  const auth = getAuth()
  return signOut(auth)
}

export default {
  logoutUser,
  registerWithEmailVerification,
  updatePasswordAndSync,
  resendVerificationEmail,
  checkEmailVerification,
  onAuthChange,
  getDeviceId,
  changePassword,
  loginUser,
  registerUser,
  updateEmailWithVerification,
  sendPasswordResetEmail
}
