const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to Supabase DB. Cleaning forced variants from products table...");

    // Reset variants column to empty jsonb array for all products
    const res = await client.query(`UPDATE products SET variants = '[]'::jsonb;`);
    console.log(`Updated ${res.rowCount} products. All variants set to []`);

    // Reload schema for PostgREST
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log("✅ Successfully cleared forced variants in Supabase DB!");

    const check = await client.query(`SELECT id, name, variants FROM products ORDER BY name;`);
    console.log(JSON.stringify(check.rows, null, 2));

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();
