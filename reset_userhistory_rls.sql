-- Reset RLS policy for user_history

-- 1. Disable RLS temporarily
ALTER TABLE public.user_history DISABLE ROW LEVEL SECURITY;

-- 2. (Optional) View current policies
-- SELECT * FROM pg_policies WHERE tablename = 'user_history';

-- 3. Drop existing INSERT policy if present
DROP POLICY IF EXISTS "Users can insert their own history." ON public.user_history;

-- 4. Create a new INSERT policy that allows all inserts (for testing)
CREATE POLICY "Users can insert their own history."
  ON public.user_history
  FOR INSERT
  WITH CHECK (true);

-- 5. Re‑enable RLS
ALTER TABLE public.user_history ENABLE ROW LEVEL SECURITY;

-- (Optional test insert – replace placeholders with real UUIDs)
-- INSERT INTO public.user_history (user_id, product_id, seller_id, category, action_type)
-- VALUES ('<user_uuid>', '<product_uuid>', '<seller_uuid>', 'view', 'view');