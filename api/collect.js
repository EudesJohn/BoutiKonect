const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const Joi = require('joi');
const { rateLimiter } = require('../utils/rateLimit');
const { validateCollect } = require('../utils/validation');
const { withLogging } = require('../utils/withLogging');

// Config Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const cronSecret = process.env.CRON_SECRET;

// Helper for timing-safe comparison
function safeCompare(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

module.exports = async (req, res) => {
  return withLogging(async (req, res) => {
    // Rate limiting for collect endpoint
    if (!rateLimiter(req, res)) return; // response handled inside
    // Validate request (currently empty schema)
    const { error } = validateCollect(req.body || {});
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    // Existing logic follows

  // 1. Sécurité (Token secret ou Cron auto)
  const authHeader = req.headers.authorization;
  const isCron = req.headers['x-vercel-cron'] === '1';

  // Si on a un CRON_SECRET défini, on vérifie l'autorisation
  if (cronSecret && !isCron) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Non autorisé' });
    }
    const token = authHeader.slice(7); // Remove 'Bearer ' prefix
    if (!safeCompare(token, cronSecret)) {
      return res.status(401).json({ error: 'Non autorisé' });
    }
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
    // Log error internally (avoid leaking details to client)
    console.error('Erreur Collecte Root:', error);
    return res.status(500).json({ success: false, error: 'Erreur interne du serveur' });
  }
};
