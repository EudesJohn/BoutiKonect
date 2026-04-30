-- =============================================================
-- BoutiKonect - Fix Promotions & RLS Products
-- Date: 2026-04-30
-- =============================================================

BEGIN;

-- 1. S'assurer que les politiques RLS pour les produits sont correctes
DROP POLICY IF EXISTS products_update_seller ON products;
CREATE POLICY products_update_seller 
  ON products FOR UPDATE TO authenticated
  USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS products_update_admin ON products;
CREATE POLICY products_update_admin
  ON products FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- 2. Créer une fonction RPC pour l'activation sécurisée des promotions
-- Cela permet de bypasser d'éventuels problèmes de droits côté client
-- tout en vérifiant l'identité à l'intérieur de la fonction.

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
  -- 1. Récupérer l'ID de l'appelant
  v_caller_id := auth.uid();
  
  -- 2. Vérifier si le produit existe
  SELECT seller_id INTO v_seller_id FROM products WHERE id = p_product_id;
  
  IF NOT FOUND THEN
    RETURN 'ERROR: Product not found (' || p_product_id || ')';
  END IF;

  -- 3. Vérifier si l'appelant est admin
  SELECT is_admin INTO v_is_admin FROM profiles WHERE id = v_caller_id;

  -- 4. VÉRIFICATION DE SÉCURITÉ :
  -- L'utilisateur doit être le propriétaire OU un admin
  IF (v_caller_id = v_seller_id) OR (COALESCE(v_is_admin, false) = true) THEN
    UPDATE products 
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

-- Accorder l'accès
GRANT EXECUTE ON FUNCTION activate_product_promotion(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION activate_product_promotion(UUID, INTEGER) TO anon;

COMMIT;
