-- ============================================================
-- SCRIPT DE VÉRIFICATION ET NETTOYAGE DES ADMINISTRATEURS
-- À exécuter dans Supabase -> SQL Editor
-- ============================================================

-- 1. Lister TOUS les utilisateurs ayant les privilèges Administrateur
-- Cela vous permettra d'identifier le(s) compte(s) créé(s) par le hacker.
SELECT 
    id, 
    email, 
    name, 
    is_admin, 
    role, 
    created_at
FROM public.profiles
WHERE is_admin = true OR role = 'admin'
ORDER BY created_at DESC;

-- ============================================================
-- INSTRUCTIONS DE NETTOYAGE MANUEL
-- ============================================================
-- 1. Regardez les résultats de la requête ci-dessus.
-- 2. Identifiez les emails qui NE SONT PAS le vôtre (eudesjohn650@gmail.com ou maboutiquebj229@gmail.com).
-- 3. Copiez leur "id".
-- 4. Allez dans Supabase -> Authentication -> Users.
-- 5. Recherchez cet utilisateur par son adresse e-mail ou son ID.
-- 6. Cliquez sur les 3 petits points à droite et sélectionnez "Delete user".
-- 
-- ⚠️ N'utilisez pas de requête SQL directe pour supprimer l'utilisateur,
-- car la suppression via l'interface "Authentication" s'assure que 
-- TOUTES les données liées au hacker (produits frauduleux, commandes spam, etc.)
-- seront automatiquement supprimées (effacement en cascade).
-- ============================================================
