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
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

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
CREATE POLICY "Products are viewable by everyone." ON products FOR SELECT USING (true);
CREATE POLICY "Sellers can insert their own products." ON products FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update their own products." ON products FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can delete their own products." ON products FOR DELETE USING (auth.uid() = seller_id);
CREATE POLICY "Admins can delete any product/service." ON products FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins can update any product/service." ON products FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

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
CREATE POLICY "Reviews are viewable by everyone." ON reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert reviews." ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Users can delete their own reviews." ON reviews FOR DELETE USING (auth.uid() = reviewer_id);

-- 4. Orders
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_title TEXT,
  product_image TEXT,
  price NUMERIC,
  quantity INTEGER DEFAULT 1,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  seller_name TEXT,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Can be NULL for guest orders
  buyer_name TEXT,
  buyer_phone TEXT,
  buyer_address TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Orders Policies
CREATE POLICY "Admins can view all orders." ON orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Buyers can view their own orders." ON orders FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Sellers can view orders for their products." ON orders FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Anyone can insert an order (guest support)." ON orders FOR INSERT WITH CHECK (true);

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

-- Admin Notifications Policies
CREATE POLICY "Only admins can view notifications." ON admin_notifications FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Only admins can update notifications." ON admin_notifications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

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
CREATE POLICY "Users can insert their own history." ON user_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can see their own history." ON user_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can see all history for analytics." ON user_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
