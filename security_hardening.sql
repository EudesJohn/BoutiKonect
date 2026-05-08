-- =====================================================================
-- BoutiKonect — DURCISSEMENT DE LA SÉCURITÉ DES FONCTIONS
-- Date: 2026-05-08
-- =====================================================================

BEGIN;

-- 1. CRÉATION DU SCHÉMA INTERNE (si non existant)
CREATE SCHEMA IF NOT EXISTS internal;
REVOKE ALL ON SCHEMA internal FROM PUBLIC;
GRANT USAGE ON SCHEMA internal TO authenticated;
GRANT USAGE ON SCHEMA internal TO service_role;

-- 2. SÉCURISATION DE activate_product_promotion
-- Nous devons nous assurer que seul le propriétaire ou un admin peut l'appeler
CREATE OR REPLACE FUNCTION public.activate_product_promotion(
    p_product_id UUID, 
    p_days INTEGER,
    p_transaction_id TEXT DEFAULT NULL,
    p_plan_name TEXT DEFAULT NULL,
    p_plan_price NUMERIC DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    v_end_date TIMESTAMP;
    v_seller_id UUID;
    v_caller_id UUID;
BEGIN
    v_caller_id := auth.uid();
    
    -- 1. Vérifier l'existence du produit et récupérer le seller_id
    SELECT seller_id INTO v_seller_id FROM public.products WHERE id = p_product_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Product not found');
    END IF;

    -- 2. VÉRIFICATION DE SÉCURITÉ : Propriétaire OU Admin
    IF (v_caller_id <> v_seller_id) AND NOT (internal.is_admin()) THEN
        RAISE EXCEPTION 'Permission denied: You are not the owner of this product';
    END IF;

    -- 3. Mise à jour
    v_end_date := CURRENT_TIMESTAMP + (p_days || ' days')::INTERVAL;
    
    UPDATE public.products 
    SET 
        is_promoted = true, 
        promotion_end_date = v_end_date,
        last_transaction_id = p_transaction_id,
        promotion_plan_name = p_plan_name,
        promotion_plan_price = p_plan_price,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_product_id;

    RETURN json_build_object(
        'success', true, 
        'end_date', v_end_date,
        'transaction_id', p_transaction_id,
        'price', p_plan_price
    );
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Révoquer l'accès public et restreindre aux utilisateurs connectés
REVOKE EXECUTE ON FUNCTION public.activate_product_promotion(UUID, INTEGER, TEXT, TEXT, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_product_promotion(UUID, INTEGER, TEXT, TEXT, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_product_promotion(UUID, INTEGER, TEXT, TEXT, NUMERIC) TO service_role;

COMMIT;
