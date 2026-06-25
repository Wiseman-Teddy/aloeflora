const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to Supabase. Creating product_reviews table...");
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Public can view reviews" ON product_reviews;
      CREATE POLICY "Public can view reviews" ON product_reviews FOR SELECT USING (true);
      
      DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON product_reviews;
      CREATE POLICY "Authenticated users can insert reviews" ON product_reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    `);

    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log("Successfully created product_reviews table and reloaded API cache!");

  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
run();
