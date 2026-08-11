const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
});

async function checkColumns() {
  try {
    await client.connect();
    const res = await client.query(`SELECT * FROM products LIMIT 1;`);
    console.log("Product table columns:", Object.keys(res.rows[0]));

    // Update variants
    await client.query(`UPDATE products SET variants = '["30ml", "50ml"]'::jsonb WHERE name ILIKE '%Serum%';`);
    await client.query(`UPDATE products SET variants = '["100g", "200g"]'::jsonb WHERE name ILIKE '%Bar Soap%' OR name ILIKE '%Tumeric Soap%';`);
    await client.query(`UPDATE products SET variants = '["1L", "5L"]'::jsonb WHERE name ILIKE '%Bleach%' OR name ILIKE '%Multipurpose%';`);
    await client.query(`UPDATE products SET variants = '["400ml", "1L"]'::jsonb WHERE name ILIKE '%Shampoo%' OR name ILIKE '%Conditioner%';`);
    await client.query(`UPDATE products SET variants = '["250g", "500g", "1kg"]'::jsonb WHERE name ILIKE '%Lotion%' OR name ILIKE '%Body Butter%' OR name ILIKE '%Shea%';`);

    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log("✅ Successfully updated product variants in Supabase DB!");

    const finalState = await client.query(`SELECT id, name, variants FROM products ORDER BY name;`);
    console.log(JSON.stringify(finalState.rows, null, 2));

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

checkColumns();
