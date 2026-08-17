const { Client } = require('pg');
const connectionString = "postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";

async function syncProductionDatabase() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("=== STARTING FULL SUPABASE PRODUCTION SYNC ===");

    // 1. Ensure Columns on products
    console.log("1. Syncing products table...");
    await client.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_size VARCHAR(100);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS sub_category VARCHAR(100);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS safety_stock INTEGER DEFAULT 5;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 10;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS media_urls JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '[]'::jsonb;
    `);

    // 2. Ensure Columns on events & event_registrations
    console.log("2. Syncing events & registrations...");
    await client.query(`
      ALTER TABLE events ADD COLUMN IF NOT EXISTS registrant_count INTEGER DEFAULT 0;
      ALTER TABLE events ADD COLUMN IF NOT EXISTS registrants JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE events ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0.00;
      ALTER TABLE events ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'upcoming';

      ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
      ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) DEFAULT 0.00;
      ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS event_title VARCHAR(255);
    `);

    // 3. Ensure Columns on profiles
    console.log("3. Syncing profiles table...");
    await client.query(`
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address VARCHAR(255);
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hair_type VARCHAR(100);
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skin_type VARCHAR(100);
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wishlist JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cart JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_spending DECIMAL(12,2) DEFAULT 0.00;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS order_count INTEGER DEFAULT 0;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_chat_history JSONB DEFAULT '[]'::jsonb;
    `);

    // 4. Ensure store_settings table & default row
    console.log("4. Syncing store settings...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS store_settings (
          id VARCHAR(50) PRIMARY KEY DEFAULT 'global',
          admin_name VARCHAR(255) DEFAULT 'Master Admin',
          admin_email VARCHAR(255) DEFAULT 'aganyawiseman@gmail.com',
          seo_title VARCHAR(255) DEFAULT 'ALOEFLORA PRODUCTS | Natural Care',
          seo_desc TEXT DEFAULT 'Premium organic formulations from Nairobi. Pure hydration for hair and skin.',
          seo_keywords TEXT DEFAULT 'aloe vera, natural hair care, organic skin care, nairobi',
          seo_robots TEXT DEFAULT 'User-agent: *\nAllow: /',
          sitemap_generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO store_settings (id, admin_name, admin_email, seo_title, seo_desc, seo_keywords)
      VALUES ('global', 'Master Admin', 'aganyawiseman@gmail.com', 'ALOEFLORA PRODUCTS | Natural Care', 'Premium organic formulations from Nairobi. Pure hydration for hair and skin.', 'aloe vera, natural hair care, organic skin care, nairobi')
      ON CONFLICT (id) DO NOTHING;
    `);

    // 5. Ensure promos table
    console.log("5. Syncing promos table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS promos (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR(50) UNIQUE NOT NULL,
          discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO promos (code, discount_percent, is_active)
      VALUES 
        ('ALOE10', 10, true),
        ('WELCOME15', 15, true),
        ('FLASH20', 20, true)
      ON CONFLICT (code) DO NOTHING;
    `);

    // 6. Update handle_new_user trigger
    console.log("6. Updating Auth trigger...");
    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.profiles (id, full_name, email, role)
        VALUES (
          new.id, 
          COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 
          new.email, 
          COALESCE(new.raw_user_meta_data->>'role', 'customer')
        )
        ON CONFLICT (id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          email = EXCLUDED.email;
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    `);

    // 7. Ensure Storage Buckets exist and are public
    console.log("7. Ensuring storage buckets...");
    await client.query(`
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('images', 'images', true)
      ON CONFLICT (id) DO UPDATE SET public = true;

      INSERT INTO storage.buckets (id, name, public)
      VALUES ('avatars', 'avatars', true)
      ON CONFLICT (id) DO UPDATE SET public = true;
    `);

    // 8. Configure Comprehensive Row Level Security (RLS) Policies
    console.log("8. Configuring Row Level Security policies...");
    await client.query(`
      ALTER TABLE products ENABLE ROW LEVEL SECURITY;
      ALTER TABLE cms_posts ENABLE ROW LEVEL SECURITY;
      ALTER TABLE events ENABLE ROW LEVEL SECURITY;
      ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
      ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
      ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
      ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
      ALTER TABLE promos ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies to cleanly recreate
      DROP POLICY IF EXISTS "Public can view products" ON products;
      DROP POLICY IF EXISTS "Admins full access products" ON products;
      CREATE POLICY "Public can view products" ON products FOR SELECT USING (true);
      CREATE POLICY "Admins full access products" ON products FOR ALL USING (
        (auth.jwt() ->> 'role') = 'admin' OR 
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
      );

      DROP POLICY IF EXISTS "Public can view published CMS posts" ON cms_posts;
      DROP POLICY IF EXISTS "Admins full access CMS" ON cms_posts;
      CREATE POLICY "Public can view published CMS posts" ON cms_posts FOR SELECT USING (true);
      CREATE POLICY "Admins full access CMS" ON cms_posts FOR ALL USING (
        (auth.jwt() ->> 'role') = 'admin' OR 
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
      );

      DROP POLICY IF EXISTS "Public can view events" ON events;
      DROP POLICY IF EXISTS "Admins full access events" ON events;
      CREATE POLICY "Public can view events" ON events FOR SELECT USING (true);
      CREATE POLICY "Admins full access events" ON events FOR ALL USING (
        (auth.jwt() ->> 'role') = 'admin' OR 
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
      );

      DROP POLICY IF EXISTS "Anyone can register for events" ON event_registrations;
      DROP POLICY IF EXISTS "Users can view own registrations" ON event_registrations;
      DROP POLICY IF EXISTS "Admins full access registrations" ON event_registrations;
      CREATE POLICY "Anyone can register for events" ON event_registrations FOR INSERT WITH CHECK (true);
      CREATE POLICY "Users can view own registrations" ON event_registrations FOR SELECT USING (
        email = (auth.jwt() ->> 'email') OR 
        auth.uid() = user_id OR 
        (auth.jwt() ->> 'role') = 'admin' OR 
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
      );
      CREATE POLICY "Admins full access registrations" ON event_registrations FOR ALL USING (
        (auth.jwt() ->> 'role') = 'admin' OR 
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
      );

      DROP POLICY IF EXISTS "Public can view store settings" ON store_settings;
      DROP POLICY IF EXISTS "Admins full access store settings" ON store_settings;
      CREATE POLICY "Public can view store settings" ON store_settings FOR SELECT USING (true);
      CREATE POLICY "Admins full access store settings" ON store_settings FOR ALL USING (
        (auth.jwt() ->> 'role') = 'admin' OR 
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
      );

      DROP POLICY IF EXISTS "Public can view promos" ON promos;
      DROP POLICY IF EXISTS "Admins full access promos" ON promos;
      CREATE POLICY "Public can view promos" ON promos FOR SELECT USING (true);
      CREATE POLICY "Admins full access promos" ON promos FOR ALL USING (
        (auth.jwt() ->> 'role') = 'admin' OR 
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
      );

      DROP POLICY IF EXISTS "Customers can create orders" ON orders;
      DROP POLICY IF EXISTS "Customers can view their orders" ON orders;
      DROP POLICY IF EXISTS "Admins full access orders" ON orders;
      CREATE POLICY "Customers can create orders" ON orders FOR INSERT WITH CHECK (true);
      CREATE POLICY "Customers can view their orders" ON orders FOR SELECT USING (
        email = (auth.jwt() ->> 'email') OR 
        (auth.jwt() ->> 'role') = 'admin' OR 
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
      );
      CREATE POLICY "Admins full access orders" ON orders FOR ALL USING (
        (auth.jwt() ->> 'role') = 'admin' OR 
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
      );

      DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
      DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
      DROP POLICY IF EXISTS "Admins full access profiles" ON profiles;
      CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (
        auth.uid() = id OR 
        (auth.jwt() ->> 'role') = 'admin' OR 
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
      );
      CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
      CREATE POLICY "Admins full access profiles" ON profiles FOR ALL USING (
        (auth.jwt() ->> 'role') = 'admin' OR 
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
      );

      DROP POLICY IF EXISTS "Customers can create tickets" ON support_tickets;
      DROP POLICY IF EXISTS "Customers can view own tickets" ON support_tickets;
      DROP POLICY IF EXISTS "Admins full access tickets" ON support_tickets;
      CREATE POLICY "Customers can create tickets" ON support_tickets FOR INSERT WITH CHECK (true);
      CREATE POLICY "Customers can view own tickets" ON support_tickets FOR SELECT USING (
        email = (auth.jwt() ->> 'email') OR 
        (auth.jwt() ->> 'role') = 'admin' OR 
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
      );
      CREATE POLICY "Admins full access tickets" ON support_tickets FOR ALL USING (
        (auth.jwt() ->> 'role') = 'admin' OR 
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
      );

      DROP POLICY IF EXISTS "Admins full access campaigns" ON campaigns;
      CREATE POLICY "Admins full access campaigns" ON campaigns FOR ALL USING (
        (auth.jwt() ->> 'role') = 'admin' OR 
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
      );
    `);

    // 9. Storage policies
    console.log("9. Configuring Storage RLS policies...");
    await client.query(`
      DROP POLICY IF EXISTS "Public Storage Select Images" ON storage.objects;
      DROP POLICY IF EXISTS "Auth Storage Insert Images" ON storage.objects;
      DROP POLICY IF EXISTS "Auth Storage Manage Images" ON storage.objects;
      DROP POLICY IF EXISTS "Public Storage Select Avatars" ON storage.objects;
      DROP POLICY IF EXISTS "Auth Storage Manage Avatars" ON storage.objects;

      CREATE POLICY "Public Storage Select Images" ON storage.objects FOR SELECT USING (bucket_id = 'images');
      CREATE POLICY "Auth Storage Insert Images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images');
      CREATE POLICY "Auth Storage Manage Images" ON storage.objects FOR ALL USING (bucket_id = 'images');

      CREATE POLICY "Public Storage Select Avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
      CREATE POLICY "Auth Storage Manage Avatars" ON storage.objects FOR ALL USING (bucket_id = 'avatars');
    `);

    // 10. Reload PostgREST Schema Cache
    console.log("10. Reloading PostgREST API schema cache...");
    await client.query("NOTIFY pgrst, 'reload schema';");

    console.log("\n=== FULL SUPABASE PRODUCTION SYNC COMPLETED SUCCESSFULLY! ===");
  } catch (err) {
    console.error("Migration Error:", err);
  } finally {
    await client.end();
  }
}

syncProductionDatabase();
