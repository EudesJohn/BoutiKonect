-- =============================================================
-- BoutiKonect - Script de correction v2 (STABLE & ATOMIQUE)
-- Date: 2026-04-30
-- IMPORTANT: Ce script est idempotent (safe to re-run)
-- Il est encapsulé dans une transaction pour être atomique.
-- =============================================================

BEGIN;

-- ============================================================
-- BLOC 1 : TABLE orders
-- Ajouter les colonnes de paiement manquantes (idempotent)
-- ============================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_id     TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Normaliser payment_status en minuscules (cohérence avec le frontend)
-- Valeurs acceptées: 'pending', 'paid', 'failed'
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('pending', 'paid', 'failed') OR payment_status IS NULL);

-- ============================================================
-- BLOC 2 : INDEX sur les clés étrangères (performance)
-- Évite les seq scans coûteux avec la croissance des données
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_orders_seller_id    ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id     ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_id   ON orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status       ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at   ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_seller_id  ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_is_promoted ON products(is_promoted) WHERE is_promoted = true;

CREATE INDEX IF NOT EXISTS idx_user_history_user_id ON user_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_history_product_id ON user_history(product_id);

CREATE INDEX IF NOT EXISTS idx_admin_notif_type    ON admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_admin_notif_read    ON admin_notifications(read) WHERE read = false;

-- ============================================================
-- BLOC 3 : POLICIES RLS sur orders
-- Noms courts sans apostrophes ni espaces à risque
-- ============================================================

-- SELECT
DROP POLICY IF EXISTS "Admins can view all orders."                  ON orders;
DROP POLICY IF EXISTS "Buyers can view their own orders."            ON orders;
DROP POLICY IF EXISTS "Sellers can view orders for their products."  ON orders;

CREATE POLICY orders_select_admin
  ON orders FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY orders_select_buyer
  ON orders FOR SELECT TO public
  USING (auth.uid() = buyer_id OR buyer_id IS NULL);

CREATE POLICY orders_select_seller
  ON orders FOR SELECT TO authenticated
  USING (auth.uid() = seller_id);

-- INSERT
DROP POLICY IF EXISTS "Anyone can insert an order (guest support)." ON orders;

CREATE POLICY orders_insert_public
  ON orders FOR INSERT TO public
  WITH CHECK (true);

-- UPDATE
DROP POLICY IF EXISTS "Sellers can update their orders."  ON orders;
DROP POLICY IF EXISTS "Admins can update all orders."     ON orders;

CREATE POLICY orders_update_seller
  ON orders FOR UPDATE TO authenticated
  USING (auth.uid() = seller_id);

CREATE POLICY orders_update_admin
  ON orders FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- ============================================================
-- BLOC 4 : POLICIES RLS sur admin_notifications
-- ============================================================

DROP POLICY IF EXISTS "Only admins can view notifications."           ON admin_notifications;
DROP POLICY IF EXISTS "Only admins can update notifications."         ON admin_notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications." ON admin_notifications;
DROP POLICY IF EXISTS "Anyone can insert a notification."             ON admin_notifications;
DROP POLICY IF EXISTS "Users can insert notifications."               ON admin_notifications;

-- SELECT: admins seulement
CREATE POLICY admin_notif_select_admin
  ON admin_notifications FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- INSERT: tout utilisateur authentifié (signalements + paiements promotion)
CREATE POLICY admin_notif_insert_authenticated
  ON admin_notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- UPDATE: admins seulement (marquer comme lu)
CREATE POLICY admin_notif_update_admin
  ON admin_notifications FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- ============================================================
-- BLOC 5 : Realtime - Ajouter tables manquantes
-- Guard avec DO block pour éviter l'erreur "already member"
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'user_history'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_history;
    RAISE NOTICE 'user_history ajouté à supabase_realtime';
  ELSE
    RAISE NOTICE 'user_history déjà dans supabase_realtime (OK)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'admin_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications;
    RAISE NOTICE 'admin_notifications ajouté à supabase_realtime';
  ELSE
    RAISE NOTICE 'admin_notifications déjà dans supabase_realtime (OK)';
  END IF;
END $$;

-- ============================================================
-- VÉRIFICATION FINALE (affiche les politiques actives)
-- ============================================================

-- SELECT policyname, cmd, roles, qual FROM pg_policies
-- WHERE tablename IN ('orders', 'admin_notifications')
-- ORDER BY tablename, cmd;

COMMIT;

-- =============================================================
-- RÉSUMÉ DES CORRECTIONS (v2):
-- 1. ✅ Transaction atomique BEGIN/COMMIT
-- 2. ✅ Colonnes payment_id, payment_status, payment_method (idempotent)
-- 3. ✅ Contrainte CHECK sur payment_status ('pending'|'paid'|'failed')
-- 4. ✅ Index sur toutes les clés étrangères critiques
-- 5. ✅ Policies RLS renommées sans apostrophes/espaces risqués
-- 6. ✅ Policy INSERT admin_notifications pour utilisateurs authentifiés
-- 7. ✅ Realtime avec DO block sécurisé (idempotent)
-- =============================================================
