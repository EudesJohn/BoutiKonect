-- Reset RLS policy for "orders"

-- 1. Disable RLS temporarily
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- 2. (Optional) View current policies – you can run this in the Supabase console
-- SELECT * FROM pg_policies WHERE tablename = 'orders';

-- 3. Drop existing INSERT policy if present
DROP POLICY IF EXISTS "Anyone can insert an order (guest support)." ON orders;

-- 4. Create a new INSERT policy that allows all inserts
CREATE POLICY "Anyone can insert an order (guest support)."
  ON orders
  FOR INSERT
  WITH CHECK (true);

-- 5. Re‑enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- (Optional test insert – replace placeholders with real UUIDs)
-- INSERT INTO orders (product_id, buyer_id, quantity, price)
-- VALUES ('<product_uuid>', '<buyer_uuid>', 2, 19.99);
