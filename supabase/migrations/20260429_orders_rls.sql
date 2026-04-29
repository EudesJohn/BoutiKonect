-- Reset RLS policy for orders
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert an order (guest support)." ON orders;
CREATE POLICY "Anyone can insert an order (guest support)."
  ON orders FOR INSERT WITH CHECK (true);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;