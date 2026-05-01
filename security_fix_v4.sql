-- =============================================================
-- BoutiKonect - Script de Sécurisation et Correctifs RLS (V4 - ULTRA)
-- Date: 2026-05-01
-- Objectif: Forcer l'accès et supprimer tout conflit de politiques
-- =============================================================

BEGIN;

-- 1. NETTOYAGE TOTAL DES POLITIQUES products
-- On supprime tout pour repartir sur une base propre
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Sellers can insert their own products" ON public.products;
DROP POLICY IF EXISTS "Sellers can update their own products" ON public.products;
DROP POLICY IF EXISTS "Sellers can delete their own products" ON public.products;
DROP POLICY IF EXISTS "Admins can do everything on products" ON public.products;
DROP POLICY IF EXISTS products_insert_authenticated ON public.products;
DROP POLICY IF EXISTS products_insert_authenticated_v2 ON public.products;
DROP POLICY IF EXISTS products_delete_seller ON public.products;
DROP POLICY IF EXISTS products_delete_admin ON public.products;
DROP POLICY IF EXISTS "products_select_public" ON public.products;
DROP POLICY IF EXISTS "products_update_owner_or_admin" ON public.products;
DROP POLICY IF EXISTS "products_delete_owner_or_admin" ON public.products;

-- Ré-activer le RLS au cas où
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 2. NOUVELLES POLITIQUES ROBUSTES
-- Lecture : Tout le monde
CREATE POLICY "products_select_all" ON public.products FOR SELECT TO public USING (true);

-- Insertion : Tout utilisateur connecté (Plus permissif pour débloquer)
CREATE POLICY "products_insert_all_auth" ON public.products FOR INSERT TO authenticated WITH CHECK (true);

-- Modification : Propriétaire ou Admin
CREATE POLICY "products_update_all_auth" ON public.products FOR UPDATE TO authenticated 
USING (
  auth.uid() = seller_id OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Suppression : Propriétaire ou Admin
CREATE POLICY "products_delete_all_auth" ON public.products FOR DELETE TO authenticated 
USING (
  auth.uid() = seller_id OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);


-- 3. POLITIQUES POUR LA TABLE reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON public.reviews;
CREATE POLICY "reviews_select_all" ON public.reviews FOR SELECT TO public USING (true);
CREATE POLICY "reviews_insert_auth" ON public.reviews FOR INSERT TO authenticated WITH CHECK (true);


-- 4. POLITIQUES POUR LA TABLE profiles (Crucial pour Admin)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT TO public USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);


-- 5. FORCER LES DROITS ADMIN (Vérification finale)
UPDATE public.profiles 
SET is_admin = true 
WHERE email IN (
  'eudesjohn650@gmail.com',
  'BoutiKonectbj229@gmail.com',
  'maboutiquebj@gmail.com'
);

COMMIT;
