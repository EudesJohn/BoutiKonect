import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.error('❌ Supabase URL is missing! Check your VITE_SUPABASE_URL environment variable.');
}

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: 'boutikonect-auth-token',
        storage: window.localStorage
      }
    })
  : { 
      // Fallback object to prevent crashes on method calls
      from: () => ({ select: () => ({ order: () => ({ limit: () => Promise.resolve({ data: [], error: new Error('Supabase not initialized') }) }) }) }),
      auth: { onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }), getSession: () => Promise.resolve({ data: { session: null } }) },
      channel: () => ({ on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }), subscribe: () => ({ unsubscribe: () => {} }) }),
      removeChannel: () => {}
    };

