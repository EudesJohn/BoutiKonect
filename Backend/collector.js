require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
// Note: On utilise les variables préfixes VITE_ du frontend si copiées telles quelles
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erreur: Variables SUPABASE_URL ou SUPABASE_KEY manquantes.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Script Collecteur Immo (BoutiKonect)
 * Version Supabase
 */
async function collectImmoData() {
  console.log('--- Démarrage du Collecteur Immo ---');
  
  // Exemple de données à collecter (Simulation)
  const sampleProperties = [
    {
      title: 'Villa Moderne à Fidjrossè',
      description: 'Superbe villa avec 4 chambres, piscine et jardin.',
      price: 45000000,
      category: 'Immobilier',
      type: 'service', // ou 'product' selon votre logique
      seller_city: 'Cotonou',
      seller_neighborhood: 'Fidjrossè',
      price_type: 'Fixe',
      images: ['https://images.unsplash.com/photo-1580587767513-39982dc50ac5?w=500']
    },
    {
      title: 'Appartement Meublé Calavi',
      description: 'Appartement tout confort près de l\'Université d\'Abomey-Calavi.',
      price: 250000,
      category: 'Immobilier',
      type: 'service',
      seller_city: 'Abomey-Calavi',
      seller_neighborhood: 'Zogbadjè',
      price_type: '/Mois',
      images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500']
    }
  ];

  console.log(`Traitement de ${sampleProperties.length} annonces...`);

  for (const property of sampleProperties) {
    try {
      // Vérification si l'annonce existe déjà par titre (exigence simplifiée)
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('title', property.title)
        .single();

      if (existing) {
        console.log(`[Skip] "${property.title}" existe déjà.`);
        continue;
      }

      const { data, error } = await supabase
        .from('products')
        .insert([property])
        .select();

      if (error) throw error;
      console.log(`[Success] "${property.title}" ajouté avec succès.`);
    } catch (err) {
      console.error(`[Erreur] Impossible d'ajouter "${property.title}":`, err.message);
    }
  }

  console.log('--- Fin de la collecte ---');
}

// Lancement direct si exécuté via node
if (require.main === module) {
  collectImmoData();
}

module.exports = { collectImmoData };
