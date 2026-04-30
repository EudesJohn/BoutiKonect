-- =============================================================
-- BoutiKonect - Script de mise à jour consolidé (V2 Final)
-- Ce script regroupe toutes les modifications effectuées sur 
-- la base de données (Tables, Policies RLS, et Fonctions RPC)
-- Date: 2026-04-30
-- =============================================================

BEGIN;

-- ============================================================
-- 1. MODIFICATIONS DE LA TABLE orders
-- ============================================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_id     TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_method TEXT;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('pending', 'paid', 'failed') OR payment_status IS NULL);

-- ============================================================
-- 2. CRÉATION DES INDEX (Performance)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_orders_seller_id    ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id     ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_id   ON public.orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status       ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at   ON public.orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_seller_id  ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_is_promoted ON public.products(is_promoted) WHERE is_promoted = true;

CREATE INDEX IF NOT EXISTS idx_user_history_user_id ON public.user_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_history_product_id ON public.user_history(product_id);

CREATE INDEX IF NOT EXISTS idx_admin_notif_type    ON public.admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_admin_notif_read    ON public.admin_notifications(read) WHERE read = false;

-- ============================================================
-- 3. POLICIES RLS (Orders, User History, Products, Notifications)
-- ============================================================

-- ORDERS RLS
DROP POLICY IF EXISTS "Admins can view all orders." ON public.orders;
DROP POLICY IF EXISTS "Buyers can view their own orders." ON public.orders;
DROP POLICY IF EXISTS "Sellers can view orders for their products." ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert an order (guest support)." ON public.orders;
DROP POLICY IF EXISTS "Sellers can update their orders." ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders." ON public.orders;
DROP POLICY IF EXISTS orders_select_admin ON public.orders;
DROP POLICY IF EXISTS orders_select_buyer ON public.orders;
DROP POLICY IF EXISTS orders_select_seller ON public.orders;
DROP POLICY IF EXISTS orders_insert_public ON public.orders;
DROP POLICY IF EXISTS orders_update_seller ON public.orders;
DROP POLICY IF EXISTS orders_update_admin ON public.orders;

CREATE POLICY orders_select_admin ON public.orders FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY orders_select_buyer ON public.orders FOR SELECT TO public
  USING (auth.uid() = buyer_id OR buyer_id IS NULL);
CREATE POLICY orders_select_seller ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = seller_id);
CREATE POLICY orders_insert_public ON public.orders FOR INSERT TO public
  WITH CHECK (true);
CREATE POLICY orders_update_seller ON public.orders FOR UPDATE TO authenticated
  USING (auth.uid() = seller_id);
CREATE POLICY orders_update_admin ON public.orders FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- USER HISTORY RLS
DROP POLICY IF EXISTS "Users can insert their own history." ON public.user_history;
CREATE POLICY "Users can insert their own history."
  ON public.user_history FOR INSERT TO public
  WITH CHECK (true);

-- PRODUCTS RLS
DROP POLICY IF EXISTS products_update_seller ON public.products;
CREATE POLICY products_update_seller 
  ON public.products FOR UPDATE TO authenticated
  USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS products_update_admin ON public.products;
CREATE POLICY products_update_admin
  ON public.products FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- ADMIN NOTIFICATIONS RLS
DROP POLICY IF EXISTS "Only admins can view notifications." ON public.admin_notifications;
DROP POLICY IF EXISTS "Only admins can update notifications." ON public.admin_notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications." ON public.admin_notifications;
DROP POLICY IF EXISTS "Anyone can insert a notification." ON public.admin_notifications;
DROP POLICY IF EXISTS "Users can insert notifications." ON public.admin_notifications;
DROP POLICY IF EXISTS admin_notif_select_admin ON public.admin_notifications;
DROP POLICY IF EXISTS admin_notif_insert_authenticated ON public.admin_notifications;
DROP POLICY IF EXISTS admin_notif_update_admin ON public.admin_notifications;

CREATE POLICY admin_notif_select_admin ON public.admin_notifications FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY admin_notif_insert_authenticated ON public.admin_notifications FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY admin_notif_update_admin ON public.admin_notifications FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- ============================================================
-- 4. FONCTIONS RPC (Stock & Promotions)
-- ============================================================

-- Fonction pour décrémenter le stock
CREATE OR REPLACE FUNCTION decrement_product_stock(p_product_id UUID, p_amount INT DEFAULT 1)
RETURNS BOOLEAN AS $$
DECLARE
    current_stock INT;
BEGIN
    SELECT stock INTO current_stock FROM public.products WHERE id = p_product_id FOR UPDATE;
    IF current_stock >= p_amount THEN
        UPDATE public.products SET stock = stock - p_amount WHERE id = p_product_id;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour activer les promotions de manière sécurisée (bypasse les contraintes client)
DROP FUNCTION IF EXISTS activate_product_promotion(UUID, INTEGER);
CREATE OR REPLACE FUNCTION activate_product_promotion(p_product_id UUID, p_days INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seller_id UUID;
  v_caller_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  v_caller_id := auth.uid();
  
  SELECT seller_id INTO v_seller_id FROM public.products WHERE id = p_product_id;
  IF NOT FOUND THEN
    RETURN 'ERROR: Product not found (' || p_product_id || ')';
  END IF;

  SELECT is_admin INTO v_is_admin FROM public.profiles WHERE id = v_caller_id;

  IF (v_caller_id = v_seller_id) OR (COALESCE(v_is_admin, false) = true) THEN
    UPDATE public.products 
    SET 
      is_promoted = true,
      promotion_end_date = NOW() + (p_days || ' days')::INTERVAL,
      updated_at = NOW()
    WHERE id = p_product_id;
    
    RETURN 'SUCCESS';
  ELSE
    RETURN 'ERROR: Permission denied. Caller: ' || COALESCE(v_caller_id::text, 'NULL') || ' / Owner: ' || COALESCE(v_seller_id::text, 'NULL');
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION activate_product_promotion(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION activate_product_promotion(UUID, INTEGER) TO anon;

-- ============================================================
-- 5. ABONNEMENTS REALTIME
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'user_history'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_history;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'admin_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
  END IF;
END $$;

COMMIT;
