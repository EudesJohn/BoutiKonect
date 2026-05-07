/**
 * Service d'authentification administrative avec Supabase
 */
import { supabase } from '../supabase/client'

// ⛔ SÉCURITÉ : Les emails admin ne sont plus codés en dur dans le bundle JS.
// La vérification admin repose UNIQUEMENT sur le champ `is_admin = true` dans la BDD.
// Cela évite d'exposer les cibles aux hackers dans le code source public.

/**
 * Vérifie si un utilisateur est admin — basé sur la BDD uniquement
 */
export const isAdminConfigured = (user = null) => {
  if (!user) {
    // ⛔ SÉCURITÉ : Ne plus exposer d'email admin via variable VITE_ (visible dans le bundle)
    // La vérification admin repose UNIQUEMENT sur le champ `is_admin = true` dans la BDD.
    return true; // L'admin est toujours configuré via la BDD
  }
  // La vérification se base UNIQUEMENT sur le flag de la BDD
  return user.is_admin === true || user.role === 'admin'
}

/**
 * @deprecated — Ne plus utiliser. Utiliser isAdminConfigured(user) à la place.
 * Conservé pour compatibilité transitoire.
 */
export const isAdminEmail = (_email) => false

/**
 * Login admin
 */
export const loginAdmin = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, name, is_admin, role')
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

/**
 * @deprecated — Supprimé pour des raisons de sécurité.
 * Ne jamais exposer les informations admin via le bundle JS public.
 * Utiliser la BDD (is_admin) pour toutes les vérifications.
 */
export const getAdminInfo = () => {
  return {} // Ne retourne rien — ne pas exposer d'emails admin
}

// Exporter ADMIN_EMAILS comme tableau vide pour compatibilité sans casser les imports existants
export const ADMIN_EMAILS = []
