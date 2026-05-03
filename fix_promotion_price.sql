-- 1. Ajouter la colonne de prix à la table products
ALTER TABLE products ADD COLUMN IF NOT EXISTS promotion_plan_price NUMERIC DEFAULT 0;

-- 2. Mettre à jour la fonction d'activation pour inclure le prix
DROP FUNCTION IF EXISTS activate_product_promotion(UUID, INTEGER, TEXT, TEXT);

CREATE OR REPLACE FUNCTION activate_product_promotion(
    p_product_id UUID, 
    p_days INTEGER,
    p_transaction_id TEXT DEFAULT NULL,
    p_plan_name TEXT DEFAULT NULL,
    p_plan_price NUMERIC DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    v_end_date TIMESTAMP;
BEGIN
    v_end_date := NOW() + (p_days || ' days')::INTERVAL;
    
    UPDATE products 
    SET 
        is_promoted = true, 
        promotion_end_date = v_end_date,
        last_transaction_id = p_transaction_id,
        promotion_plan_name = p_plan_name,
        promotion_plan_price = p_plan_price,
        updated_at = NOW()
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Redonner les permissions
GRANT EXECUTE ON FUNCTION activate_product_promotion(UUID, INTEGER, TEXT, TEXT, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION activate_product_promotion(UUID, INTEGER, TEXT, TEXT, NUMERIC) TO anon;
