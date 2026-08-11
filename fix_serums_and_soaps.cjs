const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
});

async function fixProducts() {
  try {
    await client.connect();
    console.log("Connected to Supabase DB. Updating Face Serums & Bar Soap variants...");

    // 1. Aloeflora Alpha Arbutin Face Serum (p1786353426419)
    await client.query(`
      UPDATE products 
      SET variants = $1::jsonb 
      WHERE id = 'p1786353426419' OR name ILIKE '%Alpha Arbutin%';
    `, [JSON.stringify(["30ml", "50ml"])]);

    // 2. Aloeflora Vitamin C Face Serum (p1786353317794)
    await client.query(`
      UPDATE products 
      SET variants = $1::jsonb 
      WHERE id = 'p1786353317794' OR name ILIKE '%Vitamin C Face Serum%';
    `, [JSON.stringify(["30ml", "50ml"])]);

    // 3. Aloeflora Bar Soap (p1786355172147)
    await client.query(`
      UPDATE products 
      SET variants = $1::jsonb 
      WHERE id = 'p1786355172147' OR name ILIKE '%Bar Soap%';
    `, [JSON.stringify(["100g", "200g"])]);

    // Reload PostgREST schema cache
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log("✅ Successfully updated variants in Supabase DB!");

    // Verify
    const check = await client.query(`
      SELECT id, name, price, variants 
      FROM products 
      WHERE name ILIKE '%Serum%' OR name ILIKE '%Soap%';
    `);
    console.log("Updated records:");
    console.log(JSON.stringify(check.rows, null, 2));

  } catch (err) {
    console.error("Error updating DB products:", err);
  } finally {
    await client.end();
  }
}

fixProducts();
