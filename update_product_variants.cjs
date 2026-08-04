const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to Supabase DB. Updating product size variants...");

    // p1: Toilet Cleaner (500ml, 1L, 5L)
    await client.query(`
      UPDATE products 
      SET variants = $1::jsonb 
      WHERE id = 'p1';
    `, [JSON.stringify(["500ml", "1L", "5L"])]);

    // p2: Shower Gel (250ml, 500ml, 1L)
    await client.query(`
      UPDATE products 
      SET variants = $1::jsonb 
      WHERE id = 'p2';
    `, [JSON.stringify(["250ml", "500ml", "1L"])]);

    // p3: Hair Gel (150g, 250g, 500g)
    await client.query(`
      UPDATE products 
      SET variants = $1::jsonb 
      WHERE id = 'p3';
    `, [JSON.stringify(["150g", "250g", "500g"])]);

    // Reload schema cache
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log("Successfully updated product size variants (ml, L, grams) in Supabase!");

  } catch(e) {
    console.error("Error updating Supabase variants:", e);
  } finally {
    await client.end();
  }
}

run();
