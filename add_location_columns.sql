-- Ajout des colonnes de géolocalisation à la table products
ALTER TABLE products ADD COLUMN IF NOT EXISTS latitude FLOAT8;
ALTER TABLE products ADD COLUMN IF NOT EXISTS longitude FLOAT8;

-- Mise à jour du cache du schéma (optionnel mais recommandé dans certains environnements PostgREST)
NOTIFY pgrst, 'reload schema';
