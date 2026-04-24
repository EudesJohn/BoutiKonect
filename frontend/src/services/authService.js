/**
 * Service d'authentification avancé avec Supabase
 * Gère: vérification email, nouvel appareil, synchronisation mot de passe
 */

import { supabase } from '../supabase/client'

// Track connected devices
const DEVICES_KEY = 'BoutiKonect_connected_devices'

export const getDeviceId = () => {
  const STORAGE_KEY = 'BoutiKonect_device_id'
  let deviceId = localStorage.getItem(STORAGE_KEY)

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
    const random = Math.random().toString(36).substring(2, 10)
    deviceId = `${fingerprint}_${random}_${Date.now()}`
    localStorage.setItem(STORAGE_KEY, deviceId)
  }

  return deviceId
}

/**
 * Inscription avec Supabase Auth
 */
export const registerUser = async (userData) => {
  const { email, password, name } = userData

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + '/login',
        data: {
          name,
          full_name: name,
          phone: userData.phone || '',
          city: userData.city || '',
          neighborhood: userData.neighborhood || '',
          whatsapp: userData.whatsapp || '',
          is_seller: userData.isSeller || false
        }
      }
    })

    if (error) throw error

    return { success: true, user: data.user }
  } catch (error) {
    console.error("Erreur registerUser:", error)
    return { success: false, error: getErrorMessage(error.message) }
  }
}

/**
 * Login avec Supabase
 */
export const loginUser = async (email, password, rememberMe = true) => {
  try {
    console.log(`🔑 Tentative de connexion pour: ${email}`)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    // Récupérer le profil complet
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) throw profileError

    return { success: true, user: profile }
  } catch (error) {
    console.error("Erreur loginUser:", error)
    return { success: false, error: getErrorMessage(error.message) }
  }
}

/**
 * Déconnecte l'utilisateur
 */
let isLoggingOut = false
export const logoutUser = async () => {
  if (isLoggingOut) return
  isLoggingOut = true
  try {
    console.log('🚪 Déconnexion demandée...')
    const { error } = await supabase.auth.signOut()
    if (error) console.error('❌ Erreur lors de la déconnexion:', error)
  } finally {
    isLoggingOut = false
  }
}

/**
 * Envoi de l'email de réinitialisation
 */
export const sendPasswordResetEmail = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
    return { success: true, message: 'Un lien de réinitialisation a été envoyé à votre adresse e-mail.' }
  } catch (error) {
    return { success: false, error: getErrorMessage(error.message) }
  }
}

/**
 * Changement de mot de passe (nécessite d'être connecté)
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    // 1. Vérifier l'ancien mot de passe en re-signant l'utilisateur
    const { data: sessionData } = await supabase.auth.getSession();
    const email = sessionData?.session?.user?.email;
    if (!email) throw new Error('Session expirée. Veuillez vous reconnecter.');

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword
    });
    if (verifyError) throw new Error('Le mot de passe actuel est incorrect.');

    // 2. Mettre à jour le mot de passe
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Erreur changement mot de passe:', error)
    return { success: false, error: getErrorMessage(error.message) }
  }
}

/**
 * Met à jour l'email
 */
export const updateEmailWithVerification = async (newEmail) => {
  try {
    const { error } = await supabase.auth.updateUser(
      { email: newEmail },
      { emailRedirectTo: window.location.origin + '/profile' }
    )
    if (error) throw error
    return {
      success: true,
      message: "Un lien de validation a été envoyé à votre nouvelle adresse."
    }
  } catch (error) {
    console.error("Erreur mise à jour email:", error)
    return { success: false, error: getErrorMessage(error.message) }
  }
}

/**
 * Écoute les changements d'état
 */
export const onAuthChange = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null)
  })
  return () => subscription.unsubscribe()
}

/**
 * Renvoyer l'email de vérification
 */
export const resendVerificationEmail = async (email) => {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    })
    if (error) throw error
    return { success: true, message: 'Email de vérification renvoyé!' }
  } catch (error) {
    return { success: false, error: getErrorMessage(error.message) }
  }
}

/**
 * Transforme les messages techniques Supabase en messages clairs pour les utilisateurs
 */
const getErrorMessage = (message) => {
  if (!message) return 'Une erreur inattendue est survenue'
  
  const msg = message.toLowerCase()

  if (msg.includes('invalid login credentials')) return 'E-mail ou mot de passe incorrect.'
  if (msg.includes('email not confirmed')) return 'Veuillez confirmer votre e-mail avant de vous connecter.'
  if (msg.includes('user already registered')) return 'Cette adresse e-mail est déjà utilisée par un autre compte.'
  if (msg.includes('too many requests') || msg.includes('rate limit exceeded')) return 'Trop de tentatives ! Veuillez patienter un moment (environ 1 heure) avant de réessayer.'
  if (msg.includes('lock') && msg.includes('released')) return 'Une action est déjà en cours. Veuillez patienter une seconde.'
  if (msg.includes('refresh_token_not_found')) return 'Votre session a expiré. Veuillez vous reconnecter.'
  if (msg.includes('network error')) return 'Problème de connexion internet. Vérifiez votre réseau.'
  if (msg.includes('password should be different')) return 'Désolé, vous ne pouvez pas utiliser le même mot de passe que l\'ancien. Veuillez en choisir un différent !'
  if (msg.includes('invalid format')) return 'Le format de l\'e-mail n\'est pas valide.'
  if (msg.includes('database error')) return 'Problème technique côté serveur. Nos équipes travaillent dessus.'

  return 'Mince ! Il y a eu un souci : ' + message
}

export default {
  logoutUser,
  registerUser,
  loginUser,
  sendPasswordResetEmail,
  changePassword,
  updateEmailWithVerification,
  onAuthChange,
  getDeviceId,
  resendVerificationEmail
}
