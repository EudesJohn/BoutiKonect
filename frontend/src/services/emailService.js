/**
 * Service d'authentification par Email avec Supabase
 */

import { supabase } from '../supabase/client'
import authService from './authService'

const getAppUrl = () => {
  const url = import.meta.env.VITE_APP_URL || window.location.origin;
  return url.replace(/\/$/, '') || 'https://bouti-konect.vercel.app'; 
};

/**
 * Envoie un lien de vérification d'email
 */
export const sendVerificationEmail = async (email) => {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${getAppUrl()}/login?emailVerified=true`
      }
    })
    if (error) throw error
    return { success: true, message: 'Lien de vérification envoyé à votre email!' }
  } catch (error) {
    console.error('❌ Erreur envoi email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Connexion avec Google via Supabase
 */
export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAppUrl()
      }
    })

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('❌ Erreur Google:', error)
    return { success: false, error: 'Une erreur est survenue lors de la connexion avec Google.' }
  }
}

/**
 * Déconnexion
 */
export const logout = async () => {
  try {
    await supabase.auth.signOut()
    return { success: true }
  } catch (error) {
    console.error('❌ Erreur déconnexion:', error)
    return { success: false, error: 'Erreur lors de la déconnexion' }
  }
}

/**
 * Envoie un lien de réinitialisation de mot de passe
 */
export const sendPasswordResetLink = async (email) => {
  return authService.sendPasswordResetEmail(email)
}

/**
 * Envoie un lien de vérification pour changement d'email
 */
export const sendEmailChangeVerification = async (newEmail) => {
  return authService.updateEmailWithVerification(newEmail)
}

export default {
  sendVerificationEmail,
  signInWithGoogle,
  logout,
  sendPasswordResetLink,
  sendEmailChangeVerification
}
