-- Missing ALOEFLORA Tables for Real-Time Sync

CREATE TABLE IF NOT EXISTS cms_posts (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    author VARCHAR(255) NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    seo_title VARCHAR(255),
    seo_desc TEXT,
    seo_keywords TEXT
);

CREATE TABLE IF NOT EXISTS support_tickets (
    id VARCHAR(50) PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    replies JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    date VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    capacity INTEGER NOT NULL,
    registrant_count INTEGER DEFAULT 0,
    registrants JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaigns (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    platform VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    budget DECIMAL(12,2) NOT NULL,
    spent DECIMAL(12,2) NOT NULL,
    impressions INTEGER NOT NULL,
    clicks INTEGER NOT NULL,
    conversions INTEGER NOT NULL,
    roi_percent INTEGER NOT NULL,
    start_date VARCHAR(50) NOT NULL,
    end_date VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add store_settings table
CREATE TABLE IF NOT EXISTS store_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'global',
    admin_name VARCHAR(255) DEFAULT 'Master Admin',
    admin_email VARCHAR(255) DEFAULT 'aganyawiseman@gmail.com',
    seo_title VARCHAR(255) DEFAULT 'ALOEFLORA PRODUCTS | Natural Care',
    seo_desc TEXT DEFAULT 'Premium organic formulations from Nairobi. Pure hydration for hair and skin.',
    seo_keywords TEXT DEFAULT 'aloe vera, natural hair care, organic skin care, nairobi',
    seo_robots TEXT DEFAULT 'User-agent: *
Allow: /',
    sitemap_generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- NEW: User profiles table to synchronize with Supabase Auth
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'customer',
    account_status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    total_spending DECIMAL(12,2) DEFAULT 0.00,
    order_count INTEGER DEFAULT 0,
    address VARCHAR(255),
    hair_type VARCHAR(100),
    skin_type VARCHAR(100),
    avatar_url TEXT,
    wishlist JSONB DEFAULT '[]'::jsonb,
    cart JSONB DEFAULT '[]'::jsonb,
    loyalty_points INTEGER DEFAULT 0
);

-- Function to handle new user inserts automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, COALESCE(new.raw_user_meta_data->>'role', 'customer'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- Enable RLS
ALTER TABLE cms_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing permissive policies if they exist (good practice)
DROP POLICY IF EXISTS "Public can view CMS posts" ON cms_posts;
DROP POLICY IF EXISTS "Public can view published CMS posts" ON cms_posts;
DROP POLICY IF EXISTS "Public can view Events" ON events;
DROP POLICY IF EXISTS "Public can view Products" ON products;
DROP POLICY IF EXISTS "Public can view Store Settings" ON store_settings;
DROP POLICY IF EXISTS "Customers can view their orders" ON orders;
DROP POLICY IF EXISTS "Customers can create orders" ON orders;
DROP POLICY IF EXISTS "Customers can view their tickets" ON support_tickets;
DROP POLICY IF EXISTS "Customers can create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins full access CMS" ON cms_posts;
DROP POLICY IF EXISTS "Admins full access Tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins full access Events" ON events;
DROP POLICY IF EXISTS "Admins full access Campaigns" ON campaigns;
DROP POLICY IF EXISTS "Admins full access Products" ON products;
DROP POLICY IF EXISTS "Admins full access Orders" ON orders;
DROP POLICY IF EXISTS "Admins full access Store Settings" ON store_settings;
DROP POLICY IF EXISTS "Public can view Profiles" ON profiles;
DROP POLICY IF EXISTS "Admins full access Profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Public access policies (Reads only)
CREATE POLICY "Public can view published CMS posts" ON cms_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Public can view Events" ON events FOR SELECT USING (true);
CREATE POLICY "Public can view Products" ON products FOR SELECT USING (true);
CREATE POLICY "Public can view Store Settings" ON store_settings FOR SELECT USING (true);

-- Customer access policies
CREATE POLICY "Customers can view their orders" ON orders FOR SELECT USING (
    email = (auth.jwt() ->> 'email') OR (auth.jwt() ->> 'role') = 'admin'
);
CREATE POLICY "Customers can create orders" ON orders FOR INSERT WITH CHECK (
    email = (auth.jwt() ->> 'email') OR auth.uid() IS NULL -- Allow anon for demo
);
CREATE POLICY "Customers can view their tickets" ON support_tickets FOR SELECT USING (
    email = (auth.jwt() ->> 'email') OR (auth.jwt() ->> 'role') = 'admin'
);
CREATE POLICY "Customers can create tickets" ON support_tickets FOR INSERT WITH CHECK (
    email = (auth.jwt() ->> 'email') OR (auth.jwt() ->> 'email') IS NULL -- Allow anon for demo
);

-- Profiles access policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Admin access policies (Full access for roles with 'admin' in JWT or profiles table)
CREATE POLICY "Admins full access CMS" ON cms_posts FOR ALL USING ((auth.jwt() ->> 'role') = 'admin' OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admins full access Tickets" ON support_tickets FOR ALL USING ((auth.jwt() ->> 'role') = 'admin' OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admins full access Events" ON events FOR ALL USING ((auth.jwt() ->> 'role') = 'admin' OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admins full access Campaigns" ON campaigns FOR ALL USING ((auth.jwt() ->> 'role') = 'admin' OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admins full access Products" ON products FOR ALL USING ((auth.jwt() ->> 'role') = 'admin' OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admins full access Orders" ON orders FOR ALL USING ((auth.jwt() ->> 'role') = 'admin' OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admins full access Store Settings" ON store_settings FOR ALL USING ((auth.jwt() ->> 'role') = 'admin' OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admins full access Profiles" ON profiles FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');

-- ==========================================
-- STORAGE POLICIES
-- ==========================================

-- Enable RLS for the storage.objects table
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Auth Insert Images" ON storage.objects;
DROP POLICY IF EXISTS "Owner or Admin Update Delete" ON storage.objects;
DROP POLICY IF EXISTS "Owner or Admin Delete" ON storage.objects;
DROP POLICY IF EXISTS "Public Avatar Access" ON storage.objects;
DROP POLICY IF EXISTS "Auth Insert Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Owner Update Delete Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete Avatars" ON storage.objects;

-- Images Bucket Policies
-- 1. Public can read images
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'images' );
-- 2. Authenticated users can insert images
CREATE POLICY "Auth Insert Images" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'images' AND auth.role() = 'authenticated' );
-- 3. Users can update/delete their own images OR admins can do anything
CREATE POLICY "Owner or Admin Update Delete" ON storage.objects FOR UPDATE USING ( 
    bucket_id = 'images' AND (auth.uid() = owner OR (auth.jwt() ->> 'role') = 'admin' OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')) 
);
CREATE POLICY "Owner or Admin Delete" ON storage.objects FOR DELETE USING ( 
    bucket_id = 'images' AND (auth.uid() = owner OR (auth.jwt() ->> 'role') = 'admin' OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')) 
);

-- Avatars Bucket Policies
-- 1. Public can read avatars
CREATE POLICY "Public Avatar Access" ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );
-- 2. Authenticated users can insert their own avatar
CREATE POLICY "Auth Insert Avatars" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );
-- 3. Users can update/delete their own avatars
CREATE POLICY "Owner Update Delete Avatars" ON storage.objects FOR UPDATE USING ( 
    bucket_id = 'avatars' AND auth.uid() = owner 
);

-- IMPORTANT: Ensure buckets are set to public!
UPDATE storage.buckets SET public = true WHERE id IN ('images', 'avatars');
CREATE POLICY "Owner Delete Avatars" ON storage.objects FOR DELETE USING ( 
    bucket_id = 'avatars' AND auth.uid() = owner 
);

-- Promos Table
CREATE TABLE IF NOT EXISTS promos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ADD NEW COLUMNS TO EXISTING PROFILES
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE profiles ADD COLUMN address VARCHAR(255);
    EXCEPTION WHEN duplicate_column THEN END;
    
    BEGIN
        ALTER TABLE profiles ADD COLUMN hair_type VARCHAR(100);
    EXCEPTION WHEN duplicate_column THEN END;
    
    BEGIN
        ALTER TABLE profiles ADD COLUMN skin_type VARCHAR(100);
    EXCEPTION WHEN duplicate_column THEN END;
    
    BEGIN
        ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
    EXCEPTION WHEN duplicate_column THEN END;
    
    BEGIN
        ALTER TABLE profiles ADD COLUMN wishlist JSONB DEFAULT '[]'::jsonb;
    EXCEPTION WHEN duplicate_column THEN END;
    
    BEGIN
        ALTER TABLE profiles ADD COLUMN cart JSONB DEFAULT '[]'::jsonb;
    EXCEPTION WHEN duplicate_column THEN END;
    
    BEGIN
        ALTER TABLE profiles ADD COLUMN loyalty_points INTEGER DEFAULT 0;
    EXCEPTION WHEN duplicate_column THEN END;
END $$;
