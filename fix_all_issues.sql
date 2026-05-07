-- =====================================================================
-- CORRECTION DES AVERTISSEMENTS DE SÉCURITÉ SUPABASE LINTER
-- Date: 2026-05-07
-- =====================================================================

BEGIN;

-- =====================================================================
-- 1. CORRECTION: Function Search Path Mutable
-- (Sécurise les fonctions pour empêcher l'usurpation de search_path)
-- =====================================================================

ALTER FUNCTION public.prevent_admin_self_promotion() SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';
ALTER FUNCTION public.handle_user_update() SET search_path = '';

-- Note: decrement_product_stock et activate_product_promotion peuvent 
-- nécessiter 'public' dans le search path si elles font beaucoup de requêtes.
-- Mais la meilleure pratique de sécurité est de forcer 'public' ou rien.
ALTER FUNCTION public.decrement_product_stock(uuid, integer) SET search_path = public;
ALTER FUNCTION public.activate_product_promotion(uuid, integer, text, text, numeric) SET search_path = public;


-- =====================================================================
-- 2. CORRECTION: Public/Authenticated Can Execute SECURITY DEFINER
-- (Révoquer l'accès direct via API RPC aux fonctions internes / triggers)
-- =====================================================================

-- Les triggers ne doivent JAMAIS être appelés manuellement via l'API.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_user_update() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_admin_self_promotion() FROM public, anon, authenticated;

-- Pour activate_product_promotion, on ne veut probablement pas que les invités (anon) l'exécutent.
-- On laisse seulement 'authenticated' si elle est appelée depuis le frontend par un utilisateur connecté.
REVOKE EXECUTE ON FUNCTION public.activate_product_promotion(uuid, integer, text, text, numeric) FROM anon;

-- Idem pour decrement_product_stock si elle est exposée via RPC
REVOKE EXECUTE ON FUNCTION public.decrement_product_stock(uuid, integer) FROM anon;


-- =====================================================================
-- 3. CORRECTION: RLS Policy Always True (Permissive INSERT/UPDATE)
-- (Restreindre le WITH CHECK (true) qui est dangereux)
-- =====================================================================

-- Table: admin_notifications
DROP POLICY IF EXISTS "Anyone can insert notifications." ON public.admin_notifications;
DROP POLICY IF EXISTS "admin_notif_insert_auth_secure" ON public.admin_notifications;
-- Remplacement: Seuls les utilisateurs authentifiés peuvent insérer une notification
CREATE POLICY "admin_notif_insert_auth_secure" 
  ON public.admin_notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Table: ai_chat_cache
DROP POLICY IF EXISTS "Server insert access to cache" ON public.ai_chat_cache;
DROP POLICY IF EXISTS "Server update access to cache" ON public.ai_chat_cache;
-- Le cache IA ne doit être écrit QUE par le rôle "service_role" (le serveur backend)
-- Les utilisateurs connectés ou anonymes n'ont pas le droit d'écrire dedans.
-- Il n'y a donc pas de politique à créer pour 'public' ou 'authenticated' sur INSERT/UPDATE.

-- Table: orders
DROP POLICY IF EXISTS "Allow individual insert" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_public" ON public.orders;
-- Remplacement: Seuls les acheteurs connectés insèrent leurs commandes. (Correction déjà traitée dans SECURITY_FIX_URGENT.sql, mais on nettoie ici au cas où l'ancienne persiste)

-- Table: user_history
DROP POLICY IF EXISTS "Anyone can insert history." ON public.user_history;
DROP POLICY IF EXISTS "user_history_insert_own_secure" ON public.user_history;
-- Remplacement: L'utilisateur ne peut insérer que SA propre ligne d'historique
CREATE POLICY "user_history_insert_own_secure" 
  ON public.user_history FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

COMMIT;

-- =====================================================================
-- 4. CORRECTION MANUELLE : Leaked Password Protection
-- =====================================================================
-- Cette option ne se règle pas en SQL.
-- Allez dans Supabase > Authentication > Policies > Password Settings
-- Et activez "Leaked password protection"
-- =====================================================================
