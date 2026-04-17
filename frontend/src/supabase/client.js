import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key missing in environment variables.')
}

console.log('Initializing Supabase client with URL:', supabaseUrl)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Désactivé pour éviter les conflits de rafraîchissement
    storageKey: 'boutikonect-auth-token',
    storage: window.localStorage
  }
})
console.log('Supabase client initialized.')
