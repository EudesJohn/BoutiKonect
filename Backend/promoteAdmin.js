require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.VITE_ADMIN_EMAIL;

if (!supabaseUrl || !supabaseKey || !adminEmail) {
  console.error('Erreur: Variables manquantes (URL, KEY ou ADMIN_EMAIL).');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function promoteToAdmin() {
  console.log(`--- Promotion de ${adminEmail} au rang d'Administrateur ---`);

  try {
    // 1. Trouver le profil
    const { data: profile, error: findError } = await supabase
      .from('profiles')
      .select('id, email, name')
      .eq('email', adminEmail)
      .single();

    if (findError) {
      if (findError.code === 'PGRST116') {
        console.error(`[Erreur] Aucun profil trouvé pour ${adminEmail}. L'utilisateur doit d'abord s'inscrire sur le site.`);
      } else {
        throw findError;
      }
      return;
    }

    console.log(`Profil trouvé: ${profile.name} (ID: ${profile.id})`);

    // 2. Mettre à jour les privilèges
    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        is_admin: true, 
        role: 'admin' 
      })
      .eq('id', profile.id)
      .select();

    if (updateError) throw updateError;

    console.log(`[Succès] ${adminEmail} est maintenant Administrateur.`);
    console.log('Données mises à jour:', data[0]);

  } catch (err) {
    console.error('[Erreur Fatale]:', err.message);
  }
}

promoteToAdmin();
