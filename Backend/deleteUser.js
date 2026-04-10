require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erreur: Variables manquantes (URL ou SERVICE_ROLE_KEY).');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Script pour supprimer un utilisateur au niveau Auth
 * (Ce qui déclenche la cascade sur tout le reste)
 */
async function deleteUserAuth(userId) {
  if (!userId) {
    console.error('Veuillez fournir un userId.');
    return;
  }

  console.log(`--- Suppression définitive de l'utilisateur : ${userId} ---`);

  try {
    // 1. Suppression au niveau Auth (nécessite la clé service_role)
    const { data, error } = await supabase.auth.admin.deleteUser(userId);

    if (error) throw error;

    console.log(`[Succès] L'utilisateur ${userId} a été supprimé de Supabase Auth.`);
    console.log('Toutes ses données (produits, commandes, avis) ont été nettoyées par cascade SQL.');

  } catch (err) {
    console.error('[Erreur]:', err.message);
  }
}

// Utilisation via ligne de commande: node deleteUser.js [userId]
const targetId = process.argv[2];
if (targetId) {
  deleteUserAuth(targetId);
} else {
  console.log('Utilisation: node deleteUser.js ID_UTILISATEUR');
}

module.exports = { deleteUserAuth };
