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
-- La table orders doit être incluse dans la publication
-- supabase_realtime avec la table user_history.
-- ============================================================

-- Ajouter user_history à la publication Realtime (si pas déjà fait)
-- Note: orders, products, profiles, reviews sont déjà dans la publication
-- selon le schéma initial. On s'assure que user_history est aussi inclus.
ALTER PUBLICATION supabase_realtime ADD TABLE user_history;

-- Vérification : lister les tables dans la publication
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- ============================================================
-- PROBLÈME 4 : SIGNALEMENTS ADMIN - Policy d'insertion
-- (identique au problème 1, déjà corrigé ci-dessus)
-- Mais on s'assure aussi que les admins peuvent voir et gérer
-- toutes les notifications en temps réel.
-- ============================================================

-- Vérifier que la policy SELECT pour admins existe bien
DROP POLICY IF EXISTS "Only admins can view notifications." ON admin_notifications;

CREATE POLICY "Only admins can view notifications." 
ON admin_notifications 
FOR SELECT 
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Vérifier que la policy UPDATE pour admins existe bien
DROP POLICY IF EXISTS "Only admins can update notifications." ON admin_notifications;

CREATE POLICY "Only admins can update notifications." 
ON admin_notifications 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Ajouter admin_notifications à la publication Realtime pour que
-- les admins voient les signalements en temps réel
ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications;

-- =============================================================
-- RÉSUMÉ DES CORRECTIONS APPLIQUÉES:
-- 1. ✅ admin_notifications: Policy INSERT pour utilisateurs authentifiés
-- 2. ✅ orders: Colonnes payment_id, payment_status, payment_method ajoutées
-- 3. ✅ orders: Policy INSERT pour public (invités + membres)
-- 4. ✅ orders: Policy UPDATE pour vendeurs et admins
-- 5. ✅ user_history: Ajouté à la publication supabase_realtime
-- 6. ✅ admin_notifications: Ajouté à la publication supabase_realtime
-- =============================================================
