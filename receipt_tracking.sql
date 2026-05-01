-- Ajout des colonnes pour le suivi des quittances dans la table products
ALTER TABLE products ADD COLUMN IF NOT EXISTS last_transaction_id TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS promotion_plan_name TEXT;

-- Mise à jour de la fonction d'activation pour enregistrer les infos de transaction
DROP FUNCTION IF EXISTS activate_product_promotion(UUID, INTEGER);
DROP FUNCTION IF EXISTS activate_product_promotion(UUID, INTEGER, TEXT, TEXT);

CREATE OR REPLACE FUNCTION activate_product_promotion(
    p_product_id UUID, 
    p_days INTEGER,
    p_transaction_id TEXT DEFAULT NULL,
    p_plan_name TEXT DEFAULT NULL
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
        updated_at = NOW()
    WHERE id = p_product_id;

    RETURN json_build_object(
        'success', true, 
        'end_date', v_end_date,
        'transaction_id', p_transaction_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Redonner les permissions
GRANT EXECUTE ON FUNCTION activate_product_promotion(UUID, INTEGER, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION activate_product_promotion(UUID, INTEGER, TEXT, TEXT) TO anon;
