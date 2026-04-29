-- =============================================================
-- BoutiKonect - Script de correction des 4 problèmes critiques
-- Date: 2026-04-29
-- =============================================================

-- ============================================================
-- PROBLÈME 1 : PROMOTIONS - Insertion dans admin_notifications
-- Les utilisateurs normaux (vendeurs) ne peuvent pas insérer
-- dans admin_notifications après un paiement FedaPay réussi.
-- ============================================================

-- Supprimer les anciennes policies d'insertion si elles existent
DROP POLICY IF EXISTS "Anyone can insert a notification." ON admin_notifications;
DROP POLICY IF EXISTS "Users can insert notifications." ON admin_notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications." ON admin_notifications;

-- Créer une policy d'insertion permettant à TOUT utilisateur authentifié
-- d'insérer des notifications (signalements + confirmation de paiement promotion)
CREATE POLICY "Authenticated users can insert notifications." 
ON admin_notifications 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- ============================================================
-- PROBLÈME 2 : COMMANDES - Colonnes manquantes dans orders
-- Les colonnes payment_id, payment_status, payment_method
-- n'existent pas dans la table orders mais sont envoyées
-- par mapOrderToDB() côté frontend.
-- ============================================================

-- Ajouter les colonnes manquantes à la table orders
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS payment_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- S'assurer que la policy d'insertion pour les invités est bien en place
DROP POLICY IF EXISTS "Anyone can insert an order (guest support)." ON orders;

CREATE POLICY "Anyone can insert an order (guest support)." 
ON orders 
FOR INSERT 
TO public 
WITH CHECK (true);

-- S'assurer que les vendeurs peuvent mettre à jour le statut de leurs commandes
DROP POLICY IF EXISTS "Sellers can update their orders." ON orders;

CREATE POLICY "Sellers can update their orders." 
ON orders 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = seller_id);

-- Admins peuvent mettre à jour toutes les commandes
DROP POLICY IF EXISTS "Admins can update all orders." ON orders;

CREATE POLICY "Admins can update all orders." 
ON orders 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- ============================================================
-- PROBLÈME 3 : VISIBILITÉ VENDEUR - Realtime pour orders
-- On s'assure que user_history et admin_notifications sont dans la publication
-- ============================================================

DO $$
BEGIN
    -- Ajout de user_history si pas déjà présent
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'user_history'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE user_history;
    END IF;

    -- Ajout de admin_notifications si pas déjà présent
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'admin_notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications;
    END IF;
END $$;

-- =============================================================
-- RÉSUMÉ DES CORRECTIONS APPLIQUÉES:
-- 1. ✅ admin_notifications: Policy INSERT pour utilisateurs authentifiés
-- 2. ✅ orders: Colonnes payment_id, payment_status, payment_method ajoutées
-- 3. ✅ orders: Policy INSERT pour public (invités + membres)
-- 4. ✅ orders: Policy UPDATE pour vendeurs et admins
-- 5. ✅ user_history: Ajouté à la publication supabase_realtime
-- 6. ✅ admin_notifications: Ajouté à la publication supabase_realtime
-- =============================================================
