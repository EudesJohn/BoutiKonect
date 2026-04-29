-- Supabase Schema for BoutiKonect

-- 1. Profiles (linked to auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  avatar TEXT,
  city TEXT,
  neighborhood TEXT,
  phone TEXT,
  whatsapp TEXT,
  is_seller BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'user',
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  devices TEXT[] DEFAULT '{}',
  password_updated_at TIMESTAMP WITH TIME ZONE,
  must_update_all_devices BOOLEAN DEFAULT FALSE
);

-- Enable RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY profiles_select_owner_or_admin ON profiles FOR SELECT USING (
  auth.uid() = id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY profiles_update_owner ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Products (Includes Services)
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC DEFAULT 0,
  price_type TEXT, -- For services: Fixe, Devis, /Heure, etc.
  category TEXT,
  condition TEXT, -- For products: Neuf, Bon état, etc.
  stock INTEGER DEFAULT 1,
  images TEXT[] DEFAULT '{}', -- Base64 strings or URLs
  type TEXT DEFAULT 'product', -- 'product' or 'service'
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  seller_name TEXT,
  seller_city TEXT,
  seller_neighborhood TEXT,
  seller_avatar TEXT,
  whatsapp TEXT,
  is_promoted BOOLEAN DEFAULT FALSE,
  promotion_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Products Policies
CREATE POLICY products_select_public   ON products FOR SELECT USING (true);
CREATE POLICY products_insert_seller   ON products FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY products_update_seller   ON products FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY products_delete_seller   ON products FOR DELETE USING (auth.uid() = seller_id);
CREATE POLICY products_delete_admin    ON products FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY products_update_admin    ON products FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Index sur les clés étrangères de products
CREATE INDEX IF NOT EXISTS idx_products_seller_id   ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_is_promoted ON products(is_promoted) WHERE is_promoted = true;
CREATE INDEX IF NOT EXISTS idx_products_category    ON products(category);

-- 3. Reviews
CREATE TABLE reviews (
  id TEXT PRIMARY KEY, -- deterministic ID: userId_productId
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reviewer_name TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Reviews Policies
CREATE POLICY reviews_select_public     ON reviews FOR SELECT USING (true);
CREATE POLICY reviews_insert_auth       ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY reviews_delete_owner      ON reviews FOR DELETE USING (auth.uid() = reviewer_id);

-- Index reviews
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);

-- 4. Orders
CREATE TABLE orders (
  id              UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id      UUID    REFERENCES products(id) ON DELETE SET NULL,
  product_title   TEXT,
  product_image   TEXT,
  price           NUMERIC,
  quantity        INTEGER DEFAULT 1,
  seller_id       UUID    REFERENCES profiles(id) ON DELETE CASCADE,
  seller_name     TEXT,
  buyer_id        UUID    REFERENCES profiles(id) ON DELETE CASCADE, -- NULL = commande invité
  buyer_name      TEXT,
  buyer_phone     TEXT,
  buyer_address   TEXT,
  status          TEXT    DEFAULT 'pending',
  payment_id      TEXT,                                    -- ID transaction FedaPay
  payment_status  TEXT    DEFAULT 'pending'                -- Valeurs: pending | paid | failed
                  CONSTRAINT orders_payment_status_check
                  CHECK (payment_status IN ('pending', 'paid', 'failed') OR payment_status IS NULL),
  payment_method  TEXT,                                    -- fedapay | cash | etc.
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index sur clés étrangères et colonnes de filtrage fréquentes
CREATE INDEX IF NOT EXISTS idx_orders_seller_id  ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id   ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Enable RLS for orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Orders Policies (noms snake_case, sans apostrophes)
DROP POLICY IF EXISTS orders_select_admin   ON orders;
DROP POLICY IF EXISTS orders_select_buyer   ON orders;
DROP POLICY IF EXISTS orders_select_seller  ON orders;
DROP POLICY IF EXISTS orders_insert_public  ON orders;
DROP POLICY IF EXISTS orders_update_seller  ON orders;
DROP POLICY IF EXISTS orders_update_admin   ON orders;

CREATE POLICY orders_select_admin
  ON orders FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY orders_select_buyer
  ON orders FOR SELECT TO public
  USING (auth.uid() = buyer_id OR buyer_id IS NULL);

CREATE POLICY orders_select_seller
  ON orders FOR SELECT TO authenticated
  USING (auth.uid() = seller_id);

CREATE POLICY orders_insert_public
  ON orders FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY orders_update_seller
  ON orders FOR UPDATE TO authenticated
  USING (auth.uid() = seller_id);

CREATE POLICY orders_update_admin
  ON orders FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- 5. Admin Notifications
CREATE TABLE admin_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for admin_notifications
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Admin Notifications Policies (snake_case)
CREATE POLICY admin_notif_select_admin
  ON admin_notifications FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY admin_notif_update_admin
  ON admin_notifications FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Tout utilisateur authentifié peut insérer: signalements + confirmations de paiement
CREATE POLICY admin_notif_insert_authenticated
  ON admin_notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- Index notifications
CREATE INDEX IF NOT EXISTS idx_admin_notif_type ON admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_admin_notif_read ON admin_notifications(read) WHERE read = false;

-- 6. Trigger for profile creation on signup
-- Note: This requires a Supabase function and trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    avatar, 
    is_seller, 
    role, 
    is_admin,
    city,
    neighborhood,
    phone,
    whatsapp
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'Utilisateur'),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE((NEW.raw_user_meta_data->>'is_seller')::boolean, false),
    'user',
    false,
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'neighborhood',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'whatsapp'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Trigger for profile update on email change
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_update();

-- 8. User History (for recommendations)
CREATE TABLE user_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT,
  action_type TEXT DEFAULT 'view', -- 'view', 'order', 'click'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for user_history
ALTER TABLE user_history ENABLE ROW LEVEL SECURITY;

-- User History Policies
DROP POLICY IF EXISTS "Users can insert their own history." ON user_history;
CREATE POLICY "Users can insert their own history." ON user_history FOR INSERT TO public WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR (user_id IS NULL)
);

DROP POLICY IF EXISTS "Users can see their own history." ON user_history;
CREATE POLICY "Users can see their own history." ON user_history FOR SELECT TO authenticated USING (
  auth.uid() = user_id
);

DROP POLICY IF EXISTS "Admins can see all history for analytics." ON user_history;
CREATE POLICY "Admins can see all history for analytics." ON user_history FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- 9. Enable Realtime Sync
-- Diffuse les événements (INSERT, UPDATE, DELETE) en temps réel
DO $$
BEGIN
  -- Tables déjà incluses par défaut dans Supabase: products, profiles, orders, reviews
  -- On s'assure que admin_notifications et user_history le sont aussi
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'admin_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'user_history'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_history;
  END IF;
END $$;
-- Pour une installation fraîche (sans DO block):
-- ALTER PUBLICATION supabase_realtime ADD TABLE products, profiles, orders, reviews, admin_notifications, user_history;
