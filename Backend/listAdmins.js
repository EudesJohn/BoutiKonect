require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erreur: Variables manquantes (URL ou KEY).');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAdmins() {
  console.log(`--- Liste des Administrateurs actuels ---`);
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, name, is_admin, role, created_at')
      .eq('is_admin', true);

    if (error) throw error;

    if (profiles.length === 0) {
      console.log('Aucun administrateur trouvé.');
    } else {
      console.table(profiles);
    }
  } catch (err) {
    console.error('[Erreur]:', err.message);
  }
}

listAdmins();
