-- =====================================================================
-- BoutiKonect — CORRECTIF DE RÉCURSION INFINIE (FINAL)
-- Date: 2026-05-08
-- Description: Ce script nettoie TOUTES les politiques sur 'profiles'
--              et installe une version garantie sans boucle infinie.
-- =====================================================================

BEGIN;

-- 1. DÉSACTIVER RLS POUR CETTE SESSION
SET LOCAL row_security = off;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. NETTOYAGE RADICAL DES ANCIENNES POLITIQUES
-- On utilise un bloc DO pour supprimer absolument TOUTES les politiques sur profiles
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

-- 3. GARANTIR LE SCHÉMA INTERNE
CREATE SCHEMA IF NOT EXISTS internal;

-- 4. FONCTION IS_ADMIN ULTRA-SÉCURISÉE (Via JWT - Pas de SELECT table)
CREATE OR REPLACE FUNCTION internal.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- On vérifie le JWT. Si pas de JWT ou pas admin, retourne false.
  RETURN (COALESCE(auth.jwt() -> 'app_metadata' ->> 'is_admin', 'false'))::boolean;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = '';

-- 5. FONCTION DE VÉRIFICATION ADMIN (Via Table - Bypasse RLS)
-- Cette fonction est SECURITY DEFINER, elle peut lire la table même si RLS est actif
-- sans déclencher de boucle infinie car elle ne passe pas par les politiques SELECT de l'utilisateur.
CREATE OR REPLACE FUNCTION internal.check_is_admin_bypass_rls(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    SELECT is_admin INTO v_is_admin FROM public.profiles WHERE id = p_user_id;
    RETURN COALESCE(v_is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- 6. RÉINSTALLATION DU TRIGGER DE SÉCURITÉ (Utilise le bypass)
CREATE OR REPLACE FUNCTION public.prevent_admin_self_promotion()
RETURNS TRIGGER AS $$
BEGIN
  -- Si l'utilisateur essaie de modifier is_admin ou role
  IF (NEW.is_admin IS DISTINCT FROM OLD.is_admin) OR (NEW.role IS DISTINCT FROM OLD.role) THEN
    -- On utilise la fonction de bypass pour vérifier si l'appelant est DEJA admin
    IF NOT internal.check_is_admin_bypass_rls(auth.uid()) THEN
      RAISE EXCEPTION 'Modification des droits admin non autorisée (Appelant: %)', auth.uid();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS prevent_admin_escalation ON public.profiles;
CREATE TRIGGER prevent_admin_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_admin_self_promotion();

-- 7. RÉINSTALLATION DES POLITIQUES PROPRES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Lecture : Soi-même OU Admin (via JWT)
CREATE POLICY profiles_select_final ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id 
    OR internal.is_admin()
  );

-- Mise à jour : Soi-même (Le trigger s'occupe de bloquer l'escalade)
CREATE POLICY profiles_update_final ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 8. SYNCHRONISATION INITIALE
-- S'assurer que tous les admins actuels ont le flag dans auth.users
UPDATE auth.users
SET raw_app_meta_data = 
  jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{is_admin}',
    'true'::jsonb
  )
WHERE id IN (SELECT id FROM public.profiles WHERE is_admin = true);

COMMIT;

-- VÉRIFICATION
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'profiles';
