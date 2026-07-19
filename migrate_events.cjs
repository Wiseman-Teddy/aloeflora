const { Client } = require('pg');
require('dotenv').config();

async function applySql() {
  const client = new Client({
    connectionString: 'postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL");
    
    // Insert into events table
    const result = await client.query(`
      INSERT INTO events (id, title, description, date, location, image_url, capacity, price, vendor_enabled, vendor_price, vendor_capacity, attendee_enabled, attendee_price, status)
      SELECT 
        id, 
        title, 
        content as description, 
        COALESCE(seo_title, 'TBA') as date, 
        COALESCE(seo_desc, 'TBA') as location, 
        image_url, 
        COALESCE(CAST(NULLIF(seo_keywords, '') AS INTEGER), 50) as capacity, 
        0 as price, 
        true as vendor_enabled, 
        2000.00 as vendor_price, 
        10 as vendor_capacity, 
        true as attendee_enabled, 
        0.00 as attendee_price, 
        'upcoming' as status
      FROM cms_posts
      WHERE type = 'promotion'
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log("Inserted rows:", result.rowCount);
  } catch (error) {
    console.error("Error executing SQL:", error);
  } finally {
    await client.end();
  }
}

applySql();
