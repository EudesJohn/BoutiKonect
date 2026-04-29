-- SQL to reset RLS policy for orders

-- Disable RLS temporarily
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Verify existing policies before change
SELECT schemaname, tablename, policyname, cmdsubtype, permissive, check_mode
FROM pg_policies
WHERE tablename = 'orders';

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Anyone can insert an order (guest support)." ON orders;

-- Re‑create INSERT policy to allow all inserts
CREATE POLICY "Anyone can insert an order (guest support)."
  ON orders
  FOR INSERT
  WITH CHECK (true);

-- Re‑enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Optional: test insert (replace placeholders with real UUIDs)
-- INSERT INTO orders (product_id, buyer_id, quantity, price) VALUES ('<product_uuid>', '<buyer_uuid>', 2, 19.99);