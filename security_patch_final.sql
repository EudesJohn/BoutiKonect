-- ============================================================
-- BoutiKonect — PATCH DE SÉCURITÉ FINAL
-- À exécuter APRÈS SECURITY_FIX_URGENT.sql
-- Date: 2026-05-06
-- ============================================================

BEGIN;

-- ============================================================
-- 1. RÉVOQUER TOUTES LES SESSIONS ACTIVES
-- (Déconnecte tout le monde — y compris l'attaquant)
-- ============================================================
DELETE FROM auth.sessions;
DELETE FROM auth.refresh_tokens;

-- ============================================================
-- 2. VÉRIFIER LES COMPTES ADMIN SUSPECTS
-- Listez les résultats et supprimez tout admin non reconnu
-- ============================================================
SELECT id, email, name, is_admin, role, created_at
FROM public.profiles
WHERE is_admin = true OR role = 'admin'
ORDER BY created_at DESC;

-- ============================================================
-- 3. CORRIGER LA POLITIQUE RLS DE orders_insert_public
-- (La faille #1 — commandes publiques sans auth)
-- ============================================================
DROP POLICY IF EXISTS orders_insert_public ON public.orders;
DROP POLICY IF EXISTS orders_insert_auth_only_secure ON public.orders;

CREATE POLICY orders_insert_auth_only_secure
  ON public.orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

-- ============================================================
-- 4. AJOUTER LES POLITIQUES MANQUANTES POUR ai_chat_cache
-- (La faille #13 — cache poisoning)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'ai_chat_cache' AND table_schema = 'public'
  ) THEN
    -- Supprimer les anciennes policies
    EXECUTE 'DROP POLICY IF EXISTS ai_cache_select_public_secure ON public.ai_chat_cache';
    EXECUTE 'DROP POLICY IF EXISTS ai_cache_insert_service ON public.ai_chat_cache';
    EXECUTE 'DROP POLICY IF EXISTS ai_cache_update_service ON public.ai_chat_cache';
    EXECUTE 'DROP POLICY IF EXISTS ai_cache_no_insert ON public.ai_chat_cache';
    EXECUTE 'DROP POLICY IF EXISTS ai_cache_no_update ON public.ai_chat_cache';

    -- Lecture : tout le monde bénéficie du cache
    EXECUTE 'CREATE POLICY ai_cache_select_public_secure
      ON public.ai_chat_cache FOR SELECT TO public USING (true)';

    -- Insertion : BLOQUÉ pour les utilisateurs normaux (seulement via service role)
    -- Les utilisateurs ne peuvent PAS empoisonner le cache
    EXECUTE 'CREATE POLICY ai_cache_no_insert
      ON public.ai_chat_cache FOR INSERT TO authenticated
      WITH CHECK (false)';

    -- Mise à jour : BLOQUÉ pour les utilisateurs normaux
    EXECUTE 'CREATE POLICY ai_cache_no_update
      ON public.ai_chat_cache FOR UPDATE TO authenticated
      USING (false)';

    RAISE NOTICE 'ai_chat_cache: Politiques RLS mises à jour avec succès';
  ELSE
    RAISE NOTICE 'ai_chat_cache: Table inexistante, aucune action nécessaire';
  END IF;
END $$;

-- ============================================================
-- 5. AJOUTER LA POLITIQUE DE SUPPRESSION MANQUANTE SUR profiles
-- (Empêche un admin de supprimer d'autres admins via client)
-- ============================================================
DROP POLICY IF EXISTS profiles_delete_admin ON public.profiles;
-- Aucun utilisateur ne peut supprimer un profil directement
-- La suppression passe par auth.admin.deleteUser (backend uniquement)
-- Pas de policy DELETE = bloqué par RLS (comportement correct)

-- ============================================================
-- 6. PROTÉGER profiles contre INSERT direct non-autorisé
-- (Seul le trigger handle_new_user peut créer des profils)
-- ============================================================
DROP POLICY IF EXISTS profiles_insert_trigger_only ON public.profiles;
-- Aucune policy INSERT = seul le SECURITY DEFINER trigger peut insérer

-- ============================================================
-- 7. VÉRIFICATION FINALE — Afficher toutes les politiques actives
-- ============================================================
SELECT
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

COMMIT;

-- ============================================================
-- APRÈS CE SCRIPT :
-- 1. Aller dans Supabase → Settings → API
-- 2. Cliquer "Regenerate" sur SERVICE ROLE KEY
-- 3. Mettre à jour la clé dans Vercel → Environment Variables
-- 4. NE JAMAIS mettre SUPABASE_SERVICE_ROLE_KEY dans frontend/.env
-- 5. Supprimer VITE_ADMIN_PASSWORD de tous les fichiers .env
-- ============================================================
