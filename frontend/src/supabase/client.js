import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.error('❌ VITE_SUPABASE_URL is missing. Please set it in environment variables.')
}

if (!supabaseAnonKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY is missing. Please set it in environment variables.')
}

console.log('🚀 Initializing Supabase with URL from environment variables.')

let supabase;
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
  // Export a placeholder that will cause clear failure if used without config
  supabase = null;
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'boutikonect-auth-token',
      storage: window.localStorage
    }
  })
}

// Connection check (only if supabase is initialized)
if (supabase) {
  supabase.from('products').select('*', { count: 'exact', head: true })
    .then(({ error, count }) => {
      if (error) console.error('❌ Supabase Connection Error:', error.message);
      else console.log('✅ Supabase Connected. Product count:', count);
    })
}

export { supabase };
