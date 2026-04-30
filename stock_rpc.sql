-- Function to atomically decrement product stock
-- Returns TRUE if stock was sufficient and decremented, FALSE otherwise.
CREATE OR REPLACE FUNCTION decrement_product_stock(p_product_id UUID, p_amount INT DEFAULT 1)
RETURNS BOOLEAN AS $$
DECLARE
    current_stock INT;
BEGIN
    -- Select for update to lock the row
    SELECT stock INTO current_stock FROM products WHERE id = p_product_id FOR UPDATE;
    
    IF current_stock >= p_amount THEN
        UPDATE products SET stock = stock - p_amount WHERE id = p_product_id;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
