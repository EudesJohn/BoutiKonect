import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Guard explicite : échouer tôt plutôt que silencieusement
if (!supabaseUrl || !supabaseAnonKey) {
  const msg = '❌ Configuration Supabase manquante (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). ' +
              'Vérifiez votre fichier .env.local et redémarrez le serveur de développement.'
  // En production, afficher un message visible plutôt qu'un écran blanc
  if (typeof document !== 'undefined') {
    document.body.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                  height:100vh;font-family:sans-serif;text-align:center;padding:2rem;background:#0f0f1a;color:#fff">
        <div style="font-size:3rem;margin-bottom:1rem">⚠️</div>
        <h1 style="margin:0 0 .5rem;font-size:1.5rem">Service temporairement indisponible</h1>
        <p style="color:#aaa;max-width:400px">
          La connexion à la base de données est mal configurée.<br>
          Veuillez contacter le support si ce problème persiste.
        </p>
      </div>`
  }
  // Lever une erreur pour stopper l'initialisation du module
  throw new Error(msg)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'bk-auth-token'
  }
})

export { supabase }
