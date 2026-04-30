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
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Exécuté avec les privilèges admin
AS $$
DECLARE
  v_seller_id UUID;
BEGIN
  -- Récupérer le seller_id du produit
  SELECT seller_id INTO v_seller_id FROM products WHERE id = p_product_id;
  
  -- Si le produit n'existe pas
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- VÉRIFICATION DE SÉCURITÉ :
  -- L'utilisateur doit être le propriétaire OU un admin
  IF (auth.uid() = v_seller_id) OR (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)) THEN
    UPDATE products 
    SET 
      is_promoted = true,
      promotion_end_date = NOW() + (p_days || ' days')::INTERVAL,
      updated_at = NOW()
    WHERE id = p_product_id;
    
    RETURN TRUE;
  ELSE
    -- Droits insuffisants
    RETURN FALSE;
  END IF;
END;
$$;

-- Accorder l'accès à la fonction aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION activate_product_promotion(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION activate_product_promotion(UUID, INTEGER) TO anon;

COMMIT;
