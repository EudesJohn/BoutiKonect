const { createClient } = require('@supabase/supabase-js');

// Config Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

module.exports = async (req, res) => {
  // 1. Sécurité (Token secret ou Cron auto)
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  const isCron = req.headers['x-vercel-cron'] === '1';

  // Si on a un CRON_SECRET défini, on vérifie l'autorisation
  if (cronSecret && !isCron && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Configuration Supabase manquante' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('--- Démarrage de la collecte API (Root) ---');
    
    // Logic remains identical to frontend version to ensure feature parity
    const sampleProperties = [
      {
        title: 'Villa Moderne à Fidjrossè (Root API)',
        description: 'Superbe villa avec 4 chambres, piscine et jardin.',
        price: 45000000,
        category: 'Immobilier',
        type: 'service',
        seller_city: 'Cotonou',
        seller_neighborhood: 'Fidjrossè',
        price_type: 'Fixe',
        images: ['https://images.unsplash.com/photo-1580587767513-39982dc50ac5?w=500']
      }
    ];

    let addedCount = 0;
    let skippedCount = 0;

    for (const property of sampleProperties) {
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('title', property.title)
        .single();

      if (existing) {
        skippedCount++;
        continue;
      }

      const { error } = await supabase.from('products').insert([property]);
      if (error) throw error;
      addedCount++;
    }

    return res.status(200).json({ 
      success: true, 
      added: addedCount, 
      skipped: skippedCount,
      message: 'Collecte terminée avec succès (Root)'
    });

  } catch (error) {
    console.error('Erreur Collecte Root:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
