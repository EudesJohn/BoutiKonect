import { createClient } from '@supabase/supabase-js'

// Backup hardcoded credentials in case environment variables fail on Vercel
const FALLBACK_URL = 'https://lunlteriqnostbxzfiel.supabase.co'
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1bmx0ZXJpcW5vc3RieHpmaWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2Njg0NDEsImV4cCI6MjA5MTI0NDQ0MX0.Mazo0hb8EqQ5mcPL1qJbneIkdPW4z9IXp9KYuK7Cwis'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY

if (!import.meta.env.VITE_SUPABASE_URL) {
  console.warn('⚠️ VITE_SUPABASE_URL is missing. Using fallback URL.');
}

console.log('🚀 Initializing Supabase with URL:', supabaseUrl.substring(0, 20) + '...');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'boutikonect-auth-token',
    storage: window.localStorage
  }
})

// Connection check
supabase.from('products').select('*', { count: 'exact', head: true })
  .then(({ error, count }) => {
    if (error) console.error('❌ Supabase Connection Error:', error.message);
    else console.log('✅ Supabase Connected. Product count:', count);
  });

