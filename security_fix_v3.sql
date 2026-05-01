-- =============================================================
-- BoutiKonect - Script de Sécurisation et Correctifs RLS (V3)
-- Date: 2026-05-01
-- =============================================================

BEGIN;

-- 1. POLITIQUES POUR LA TABLE products
-- Autoriser les utilisateurs authentifiés à insérer leurs propres produits
DROP POLICY IF EXISTS products_insert_authenticated ON public.products;
CREATE POLICY products_insert_authenticated 
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = seller_id);

-- Autoriser la suppression par le propriétaire
DROP POLICY IF EXISTS products_delete_seller ON public.products;
CREATE POLICY products_delete_seller
  ON public.products FOR DELETE TO authenticated
  USING (auth.uid() = seller_id);

-- Autoriser la suppression par les administrateurs
DROP POLICY IF EXISTS products_delete_admin ON public.products;
CREATE POLICY products_delete_admin
  ON public.products FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));


-- 2. POLITIQUES POUR LA TABLE reviews
-- S'assurer que le RLS est activé
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les avis
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT TO public USING (true);

-- Les utilisateurs authentifiés peuvent ajouter des avis
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON public.reviews;
CREATE POLICY "Authenticated users can insert reviews" 
  ON public.reviews FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = reviewer_id);

-- Les utilisateurs peuvent modifier leurs propres avis
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE TO authenticated
  USING (auth.uid() = reviewer_id);

-- Seuls les admins peuvent supprimer des avis
DROP POLICY IF EXISTS "Admins can delete reviews" ON public.reviews;
CREATE POLICY "Admins can delete reviews" 
  ON public.reviews FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));


-- 3. POLITIQUES POUR LA TABLE profiles
-- S'assurer que le RLS est activé
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les profils (pour afficher noms/vendeurs)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT TO public USING (true);

-- Les utilisateurs peuvent modifier leur propre profil
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Les admins peuvent voir et modifier tous les profils
-- Note: La politique SELECT est déjà couverte par "viewable by everyone"


-- 4. MISE À JOUR DES DROITS ADMIN
-- Forcer le statut admin pour les emails configurés
UPDATE public.profiles 
SET is_admin = true 
WHERE email IN (
  'eudesjohn650@gmail.com',
  'BoutiKonectbj229@gmail.com',
  'maboutiquebj@gmail.com'
);

COMMIT;
