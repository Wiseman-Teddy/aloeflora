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

-- Enable RLS
ALTER TABLE cms_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop any existing permissive policies if they exist (good practice)
DROP POLICY IF EXISTS "Public can view CMS posts" ON cms_posts;
DROP POLICY IF EXISTS "Public can view Events" ON events;
DROP POLICY IF EXISTS "Admins full access CMS" ON cms_posts;
DROP POLICY IF EXISTS "Admins full access Tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins full access Events" ON events;
DROP POLICY IF EXISTS "Admins full access Campaigns" ON campaigns;

-- Public access policies (Reads only)
CREATE POLICY "Public can view published CMS posts" ON cms_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Public can view Events" ON events FOR SELECT USING (true);
CREATE POLICY "Public can view Products" ON products FOR SELECT USING (true);
CREATE POLICY "Public can view Store Settings" ON store_settings FOR SELECT USING (true);

-- Customer access policies
-- Assuming orders and support_tickets have email fields we can match, or user_id. 
-- In our mock, auth doesn't link exactly to user_id yet, but we can match auth.jwt()->>'email'.
CREATE POLICY "Customers can view their orders" ON orders FOR SELECT USING (
    customer_id = auth.uid() OR (auth.jwt() ->> 'email') = 'aganyawiseman@gmail.com'
);
CREATE POLICY "Customers can create orders" ON orders FOR INSERT WITH CHECK (
    customer_id = auth.uid() OR auth.uid() IS NULL -- Allow anon for demo
);
CREATE POLICY "Customers can view their tickets" ON support_tickets FOR SELECT USING (
    email = (auth.jwt() ->> 'email') OR (auth.jwt() ->> 'email') = 'aganyawiseman@gmail.com'
);
CREATE POLICY "Customers can create tickets" ON support_tickets FOR INSERT WITH CHECK (
    email = (auth.jwt() ->> 'email') OR (auth.jwt() ->> 'email') IS NULL -- Allow anon for demo
);

-- Admin access policies (Full access for aganyawiseman@gmail.com)
CREATE POLICY "Admins full access CMS" ON cms_posts FOR ALL USING ((auth.jwt() ->> 'email') = 'aganyawiseman@gmail.com');
CREATE POLICY "Admins full access Tickets" ON support_tickets FOR ALL USING ((auth.jwt() ->> 'email') = 'aganyawiseman@gmail.com');
CREATE POLICY "Admins full access Events" ON events FOR ALL USING ((auth.jwt() ->> 'email') = 'aganyawiseman@gmail.com');
CREATE POLICY "Admins full access Campaigns" ON campaigns FOR ALL USING ((auth.jwt() ->> 'email') = 'aganyawiseman@gmail.com');
CREATE POLICY "Admins full access Products" ON products FOR ALL USING ((auth.jwt() ->> 'email') = 'aganyawiseman@gmail.com');
CREATE POLICY "Admins full access Orders" ON orders FOR ALL USING ((auth.jwt() ->> 'email') = 'aganyawiseman@gmail.com');
CREATE POLICY "Admins full access Store Settings" ON store_settings FOR ALL USING ((auth.jwt() ->> 'email') = 'aganyawiseman@gmail.com');
