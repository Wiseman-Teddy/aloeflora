const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to Supabase. Dropping old tables...");
    
    // Drop the tables if they exist
    await client.query(`DROP TABLE IF EXISTS products CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS orders CASCADE;`);
    
    console.log("Recreating products table...");
    await client.query(`
      CREATE TABLE products (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        cost_price DECIMAL(10,2) NOT NULL,
        category VARCHAR(50) NOT NULL,
        sub_category VARCHAR(50) NOT NULL,
        image_url TEXT,
        stock INTEGER NOT NULL,
        safety_stock INTEGER NOT NULL,
        reorder_level INTEGER NOT NULL,
        rating DECIMAL(3,2) NOT NULL,
        reviews_count INTEGER NOT NULL,
        variants JSONB DEFAULT '[]'::jsonb,
        features JSONB DEFAULT '[]'::jsonb,
        media_urls JSONB DEFAULT '[]'::jsonb,
        specifications JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Recreating orders table...");
    await client.query(`
      CREATE TABLE orders (
        id VARCHAR(50) PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        county VARCHAR(100) NOT NULL,
        sub_county VARCHAR(100) NOT NULL,
        estate VARCHAR(100) NOT NULL,
        building VARCHAR(100),
        house_number VARCHAR(50),
        delivery_notes TEXT,
        items JSONB NOT NULL DEFAULT '[]'::jsonb,
        subtotal DECIMAL(10,2) NOT NULL,
        delivery_fee DECIMAL(10,2) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        delivery_status VARCHAR(50) NOT NULL DEFAULT 'pending',
        mpesa_receipt VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Configure RLS policies for products and orders
    console.log("Configuring RLS policies...");
    
    // Enable RLS
    await client.query(`ALTER TABLE products ENABLE ROW LEVEL SECURITY;`);
    await client.query(`ALTER TABLE orders ENABLE ROW LEVEL SECURITY;`);
    
    // Products: Public read, Admin write
    await client.query(`
      DROP POLICY IF EXISTS "Public read access for products" ON products;
      CREATE POLICY "Public read access for products" ON products FOR SELECT USING (true);
      
      DROP POLICY IF EXISTS "Admin write access for products" ON products;
      CREATE POLICY "Admin write access for products" ON products FOR ALL USING (
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
      );
    `);
    
    // Orders: Insert from anyone (customers ordering), Select/Update by admin
    await client.query(`
      DROP POLICY IF EXISTS "Public insert access for orders" ON orders;
      CREATE POLICY "Public insert access for orders" ON orders FOR INSERT WITH CHECK (true);
      
      DROP POLICY IF EXISTS "Admin read access for orders" ON orders;
      CREATE POLICY "Admin read access for orders" ON orders FOR SELECT USING (
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
      );
      
      DROP POLICY IF EXISTS "Admin update access for orders" ON orders;
      CREATE POLICY "Admin update access for orders" ON orders FOR UPDATE USING (
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
      );
    `);

    // We also need to reload PostgREST schema cache
    await client.query('NOTIFY pgrst, \'reload schema\';');
    console.log("Successfully rebuilt schema and reloaded API cache!");

  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
run();
