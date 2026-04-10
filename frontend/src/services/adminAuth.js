/**
 * Service d'authentification administrative avec Supabase
 */
import { supabase } from '../supabase/client'

const ADMIN_EMAILS = [
  'eudesjohn650@gmail.com',
  'BoutiKonectbj229@gmail.com',
  'maboutiquebj@gmail.com'
]

/**
 * Vérifie si un email est dans la liste des administrateurs
 */
export const isAdminEmail = (email) => {
  if (!email) return false
  const adminFromEnv = import.meta.env.VITE_ADMIN_EMAIL
  return ADMIN_EMAILS.includes(email.toLowerCase()) || 
         (adminFromEnv && email.toLowerCase() === adminFromEnv.toLowerCase())
}

/**
 * Vérifie si l'administration est configurée dans le système
 * Si un utilisateur est passé, vérifie s'il a les privilèges admin.
 * Sinon, vérifie simplement si un email admin est défini dans le .env.
 */
export const isAdminConfigured = (user = null) => {
  const adminEmailFromEnv = import.meta.env.VITE_ADMIN_EMAIL
  
  if (!user) {
    return !!adminEmailFromEnv
  }

  return user.is_admin === true || 
         user.role === 'admin' || 
         isAdminEmail(user.email)
}

/**
 * Login admin
 */
export const loginAdmin = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) throw profileError

    if (!isAdminConfigured(profile)) {
      await supabase.auth.signOut()
      return { success: false, error: "Vous n'avez pas les droits d'administration." }
    }

    return { success: true, user: profile }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const getAdminInfo = () => {
  return {
    email: import.meta.env.VITE_ADMIN_EMAIL,
    phone: import.meta.env.VITE_ADMIN_PHONE
  }
}
