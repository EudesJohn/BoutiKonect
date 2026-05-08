-- =====================================================================
-- BoutiKonect — CORRECTIF DE SÉCURITÉ URGENT
-- Date: 2026-05-06
-- Auteur: Audit de sécurité automatique
-- INSTRUCTIONS: Copier-coller CE SCRIPT ENTIER dans Supabase → SQL Editor → Run
-- =====================================================================

BEGIN;

-- =====================================================================
-- ÉTAPE -2 : DÉSACTIVER TEMPORAIREMENT LE RLS POUR ÉVITER LA RÉCURSION
-- =====================================================================
-- On désactive la sécurité ligne par ligne pour cette session afin de 
-- pouvoir nettoyer les politiques sans que la boucle infinie ne bloque le script.
SET LOCAL row_security = off;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- =====================================================================
-- ÉTAPE 0 : SUPPRIMER TOUTES LES ANCIENNES POLICIES (Cleanup)
-- =====================================================================
-- ÉTAPE 0.1 : SUPPRIMER LES POLITIQUES "SECURE" (pour permettre les exécutions multiples)
-- =====================================================================
DROP POLICY IF EXISTS profiles_select_secure               ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own_secure           ON public.profiles;

DROP POLICY IF EXISTS products_select_public_secure        ON public.products;
DROP POLICY IF EXISTS products_insert_own_secure           ON public.products;
DROP POLICY IF EXISTS products_update_own_or_admin_secure  ON public.products;
DROP POLICY IF EXISTS products_delete_own_or_admin_secure  ON public.products;

DROP POLICY IF EXISTS orders_select_admin_secure           ON public.orders;
DROP POLICY IF EXISTS orders_select_buyer_secure           ON public.orders;
DROP POLICY IF EXISTS orders_select_seller_secure          ON public.orders;
DROP POLICY IF EXISTS orders_insert_auth_only_secure       ON public.orders;
DROP POLICY IF EXISTS orders_update_seller_secure          ON public.orders;
DROP POLICY IF EXISTS orders_update_admin_secure           ON public.orders;

DROP POLICY IF EXISTS reviews_select_public_secure         ON public.reviews;
DROP POLICY IF EXISTS reviews_insert_own_secure            ON public.reviews;
DROP POLICY IF EXISTS reviews_delete_own_or_admin_secure   ON public.reviews;

DROP POLICY IF EXISTS admin_notif_select_admin_secure      ON public.admin_notifications;
DROP POLICY IF EXISTS admin_notif_insert_auth_secure       ON public.admin_notifications;
DROP POLICY IF EXISTS admin_notif_update_admin_secure      ON public.admin_notifications;
DROP POLICY IF EXISTS admin_notif_delete_admin_secure      ON public.admin_notifications;

DROP POLICY IF EXISTS user_history_insert_own_secure       ON public.user_history;
DROP POLICY IF EXISTS user_history_select_own_secure       ON public.user_history;
DROP POLICY IF EXISTS user_history_select_admin_secure     ON public.user_history;

-- =====================================================================
-- ÉTAPE 0.2 : SUPPRIMER L'ANCIENNE FONCTION (Dépendances maintenant supprimées)
-- =====================================================================
DROP FUNCTION IF EXISTS public.is_admin();

-- =====================================================================
-- ÉTAPE -1 : SYNCHRONISATION DES DROITS ADMIN DANS LE JWT (SÉCURITÉ MAXIMALE)
-- =====================================================================
CREATE SCHEMA IF NOT EXISTS internal;
-- Cette méthode évite la récursion infinie en stockant le statut admin 
-- dans les app_metadata de l'utilisateur.

CREATE OR REPLACE FUNCTION internal.sync_static_admin_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = 
    jsonb_set(
      COALESCE(raw_app_meta_data, '{}'::jsonb),
      '{is_admin}',
      to_jsonb(NEW.is_admin)
    )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = auth, public;

-- Trigger pour maintenir la synchro
DROP TRIGGER IF EXISTS trigger_sync_admin_status ON public.profiles;
CREATE TRIGGER trigger_sync_admin_status
AFTER INSERT OR UPDATE OF is_admin ON public.profiles
FOR EACH ROW EXECUTE FUNCTION internal.sync_static_admin_status();

-- Initialisation : Mettre à jour les utilisateurs existants
UPDATE auth.users
SET raw_app_meta_data = 
  jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{is_admin}',
    'true'::jsonb
  )
WHERE id IN (SELECT id FROM public.profiles WHERE is_admin = true);

-- Fonction de vérification ultra-rapide (sans récursion)
CREATE OR REPLACE FUNCTION internal.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = '';

-- =====================================================================
-- === TABLE: profiles ===
DROP POLICY IF EXISTS "profiles_select_all"               ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_public"            ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS profiles_select_owner_or_admin      ON public.profiles;
DROP POLICY IF EXISTS profiles_update_owner               ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own                 ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- === TABLE: products ===
DROP POLICY IF EXISTS "products_select_all"              ON public.products;
DROP POLICY IF EXISTS "products_select_public"           ON public.products;
DROP POLICY IF EXISTS "Anyone can view products"         ON public.products;
DROP POLICY IF EXISTS "products_insert_all_auth"         ON public.products;
DROP POLICY IF EXISTS "products_insert_authenticated"    ON public.products;
DROP POLICY IF EXISTS products_insert_authenticated_v2   ON public.products;
DROP POLICY IF EXISTS products_insert_seller             ON public.products;
DROP POLICY IF EXISTS "Sellers can insert their own products" ON public.products;
DROP POLICY IF EXISTS "products_update_all_auth"         ON public.products;
DROP POLICY IF EXISTS "products_update_owner_or_admin"   ON public.products;
DROP POLICY IF EXISTS products_update_seller             ON public.products;
DROP POLICY IF EXISTS products_update_admin              ON public.products;
DROP POLICY IF EXISTS "Sellers can update their own products" ON public.products;
DROP POLICY IF EXISTS "products_delete_all_auth"         ON public.products;
DROP POLICY IF EXISTS "products_delete_owner_or_admin"   ON public.products;
DROP POLICY IF EXISTS products_delete_seller             ON public.products;
DROP POLICY IF EXISTS products_delete_admin              ON public.products;
DROP POLICY IF EXISTS "Sellers can delete their own products" ON public.products;
DROP POLICY IF EXISTS "Admins can do everything on products" ON public.products;

-- === TABLE: orders ===
DROP POLICY IF EXISTS orders_select_admin    ON public.orders;
DROP POLICY IF EXISTS orders_select_buyer    ON public.orders;
DROP POLICY IF EXISTS orders_select_seller   ON public.orders;
DROP POLICY IF EXISTS orders_insert_public   ON public.orders;
DROP POLICY IF EXISTS orders_insert_authenticated ON public.orders;
DROP POLICY IF EXISTS orders_update_seller   ON public.orders;
DROP POLICY IF EXISTS orders_update_admin    ON public.orders;

-- === TABLE: reviews ===
DROP POLICY IF EXISTS "reviews_select_all"              ON public.reviews;
DROP POLICY IF EXISTS "reviews_select_public"           ON public.reviews;
DROP POLICY IF EXISTS "Anyone can view reviews"         ON public.reviews;
DROP POLICY IF EXISTS reviews_select_public             ON public.reviews;
DROP POLICY IF EXISTS reviews_insert_auth               ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert_auth"             ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS reviews_delete_owner              ON public.reviews;

-- === TABLE: admin_notifications ===
DROP POLICY IF EXISTS admin_notif_select_admin            ON public.admin_notifications;
DROP POLICY IF EXISTS admin_notif_update_admin            ON public.admin_notifications;
DROP POLICY IF EXISTS admin_notif_insert_authenticated    ON public.admin_notifications;
DROP POLICY IF EXISTS admin_notif_insert_auth             ON public.admin_notifications;

-- === TABLE: user_history ===
DROP POLICY IF EXISTS "Users can insert their own history." ON public.user_history;
DROP POLICY IF EXISTS "Users can see their own history."    ON public.user_history;
DROP POLICY IF EXISTS "Admins can see all history for analytics." ON public.user_history;

-- === TABLE: ai_chat_cache ===
DROP POLICY IF EXISTS ai_cache_select_public   ON public.ai_chat_cache;
DROP POLICY IF EXISTS ai_cache_insert_auth     ON public.ai_chat_cache;
DROP POLICY IF EXISTS ai_cache_update_auth     ON public.ai_chat_cache;

-- =====================================================================
-- ÉTAPE 1 : RÉ-ACTIVER LE RLS SUR TOUTES LES TABLES
-- =====================================================================

ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_history       ENABLE ROW LEVEL SECURITY;

-- Forcer RLS pour la table ai_chat_cache si elle existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_chat_cache' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE public.ai_chat_cache ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- =====================================================================
-- ÉTAPE 2 : TABLE profiles — POLITIQUES SÉCURISÉES
-- =====================================================================

-- Lecture : Un utilisateur voit SEULEMENT son propre profil OU si c'est un admin
CREATE POLICY profiles_select_secure
  ON public.profiles FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR internal.is_admin()
  );

-- Mise à jour : Un utilisateur ne peut modifier QUE son propre profil
-- et NE PEUT PAS modifier is_admin ou role (protection contre l'escalade de privilèges)
CREATE POLICY profiles_update_own_secure
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Insertion : Uniquement via le trigger handle_new_user (SECURITY DEFINER)
-- Les utilisateurs normaux ne peuvent pas créer de profils arbitraires

-- =====================================================================
-- ÉTAPE 3 : TABLE products — POLITIQUES SÉCURISÉES
-- =====================================================================

-- Lecture : Tout le monde peut voir les produits (marketplace publique)
CREATE POLICY products_select_public_secure
  ON public.products FOR SELECT TO public
  USING (true);

-- Insertion : Seulement le propriétaire légitime (seller_id doit correspondre à l'uid)
CREATE POLICY products_insert_own_secure
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = seller_id);

-- Mise à jour : Propriétaire OU admin
CREATE POLICY products_update_own_or_admin_secure
  ON public.products FOR UPDATE TO authenticated
  USING (
    auth.uid() = seller_id
    OR internal.is_admin()
  )
  WITH CHECK (
    auth.uid() = seller_id
    OR internal.is_admin()
  );

-- Suppression : Propriétaire OU admin
CREATE POLICY products_delete_own_or_admin_secure
  ON public.products FOR DELETE TO authenticated
  USING (
    auth.uid() = seller_id
    OR internal.is_admin()
  );

-- =====================================================================
-- ÉTAPE 4 : TABLE orders — POLITIQUES SÉCURISÉES
-- =====================================================================

-- Lecture admin : L'admin voit tout
CREATE POLICY orders_select_admin_secure
  ON public.orders FOR SELECT TO authenticated
  USING (internal.is_admin());

-- Lecture acheteur : Un acheteur voit ses propres commandes
CREATE POLICY orders_select_buyer_secure
  ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = buyer_id);

-- Lecture vendeur : Un vendeur voit les commandes pour ses produits
CREATE POLICY orders_select_seller_secure
  ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = seller_id);

-- Insertion : Seulement les utilisateurs connectés peuvent créer une commande
-- (plus d'accès public/anonymous)
CREATE POLICY orders_insert_auth_only_secure
  ON public.orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

-- Mise à jour : Vendeur peut changer le statut de SES commandes
CREATE POLICY orders_update_seller_secure
  ON public.orders FOR UPDATE TO authenticated
  USING (auth.uid() = seller_id);

-- Mise à jour admin
CREATE POLICY orders_update_admin_secure
  ON public.orders FOR UPDATE TO authenticated
  USING (internal.is_admin());

-- =====================================================================
-- ÉTAPE 5 : TABLE reviews — POLITIQUES SÉCURISÉES
-- =====================================================================

-- Lecture : Tout le monde (avis publics)
CREATE POLICY reviews_select_public_secure
  ON public.reviews FOR SELECT TO public
  USING (true);

-- Insertion : Seulement connecté et reviewer_id = son uid
CREATE POLICY reviews_insert_own_secure
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reviewer_id);

-- Suppression : Propriétaire ou admin
CREATE POLICY reviews_delete_own_or_admin_secure
  ON public.reviews FOR DELETE TO authenticated
  USING (
    auth.uid() = reviewer_id
    OR internal.is_admin()
  );

-- =====================================================================
-- ÉTAPE 6 : TABLE admin_notifications — POLITIQUES SÉCURISÉES
-- =====================================================================

-- Lecture : Admin seulement
CREATE POLICY admin_notif_select_admin_secure
  ON public.admin_notifications FOR SELECT TO authenticated
  USING (internal.is_admin());

-- Insertion : Utilisateurs connectés peuvent signaler (reports, paiements)
CREATE POLICY admin_notif_insert_auth_secure
  ON public.admin_notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Mise à jour : Admin seulement (marquer comme lu)
CREATE POLICY admin_notif_update_admin_secure
  ON public.admin_notifications FOR UPDATE TO authenticated
  USING (internal.is_admin());

-- Suppression : Admin seulement
CREATE POLICY admin_notif_delete_admin_secure
  ON public.admin_notifications FOR DELETE TO authenticated
  USING (internal.is_admin());

-- =====================================================================
-- ÉTAPE 7 : TABLE user_history — POLITIQUES SÉCURISÉES
-- =====================================================================

-- Insertion : Connecté et user_id = son uid
CREATE POLICY user_history_insert_own_secure
  ON public.user_history FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Lecture : Ses propres données
CREATE POLICY user_history_select_own_secure
  ON public.user_history FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Lecture admin : Pour les analytics
CREATE POLICY user_history_select_admin_secure
  ON public.user_history FOR SELECT TO authenticated
  USING (internal.is_admin());

-- =====================================================================
-- ÉTAPE 8 : TABLE ai_chat_cache — POLITIQUES SÉCURISÉES
-- =====================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_chat_cache' AND table_schema = 'public') THEN
    -- Lecture : Tout le monde peut bénéficier du cache
    EXECUTE 'DROP POLICY IF EXISTS ai_cache_select_public_secure ON public.ai_chat_cache';
    EXECUTE 'CREATE POLICY ai_cache_select_public_secure ON public.ai_chat_cache FOR SELECT TO public USING (true)';
    -- Insertion/Mise à jour : Seulement via service role (le backend)
    -- Les utilisateurs normaux ne peuvent pas écrire dans le cache
  END IF;
END $$;

-- =====================================================================
-- ÉTAPE 9 : SÉCURISER LA FONCTION handle_new_user
-- Empêcher l'injection via raw_user_meta_data
-- =====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_name TEXT;
  v_avatar TEXT;
  v_city TEXT;
  v_neighborhood TEXT;
  v_phone TEXT;
  v_whatsapp TEXT;
  v_is_seller BOOLEAN;
BEGIN
  -- Extraire et nettoyer les métadonnées (éviter l'injection SQL)
  v_name       := LEFT(COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'Utilisateur'), 100);
  v_avatar     := LEFT(COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''), 500);
  v_city       := LEFT(COALESCE(NEW.raw_user_meta_data->>'city', ''), 100);
  v_neighborhood := LEFT(COALESCE(NEW.raw_user_meta_data->>'neighborhood', ''), 100);
  v_phone      := LEFT(COALESCE(NEW.raw_user_meta_data->>'phone', ''), 20);
  v_whatsapp   := LEFT(COALESCE(NEW.raw_user_meta_data->>'whatsapp', ''), 20);
  v_is_seller  := COALESCE((NEW.raw_user_meta_data->>'is_seller')::boolean, false);

  INSERT INTO public.profiles (id, email, name, avatar, is_seller, role, is_admin, city, neighborhood, phone, whatsapp)
  VALUES (
    NEW.id,
    NEW.email,
    v_name,
    v_avatar,
    v_is_seller,
    'user',    -- role toujours 'user' à la création
    false,     -- is_admin toujours false à la création
    v_city,
    v_neighborhood,
    v_phone,
    v_whatsapp
  )
  ON CONFLICT (id) DO NOTHING; -- Éviter les doublons

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- =====================================================================
-- ÉTAPE 10 : PROTÉGER LA COLONNE is_admin CONTRE LA MODIFICATION DIRECTE
-- (Un utilisateur normal ne peut jamais se promouvoir admin via UPDATE)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.prevent_admin_self_promotion()
RETURNS TRIGGER AS $$
BEGIN
  -- Si l'utilisateur essaie de modifier is_admin ou role
  IF (NEW.is_admin IS DISTINCT FROM OLD.is_admin) OR (NEW.role IS DISTINCT FROM OLD.role) THEN
    -- Vérifier que l'appelant est admin dans la base de données
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    ) THEN
      RAISE EXCEPTION 'Modification des droits admin non autorisée';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Supprimer si déjà existant puis recréer
DROP TRIGGER IF EXISTS prevent_admin_escalation ON public.profiles;
CREATE TRIGGER prevent_admin_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_admin_self_promotion();

-- =====================================================================
-- ÉTAPE 11 : VÉRIFICATION — Afficher les politiques actives
-- =====================================================================

SELECT tablename, policyname, cmd, roles, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

COMMIT;

-- =====================================================================
-- APRÈS CE SCRIPT :
-- 1. Aller dans Supabase → Settings → API → Régénérer la Service Role Key
-- 2. Mettre à jour uniquement les variables Vercel côté serveur
-- 3. NE JAMAIS remettre SUPABASE_SERVICE_ROLE_KEY dans frontend/.env
-- =====================================================================
