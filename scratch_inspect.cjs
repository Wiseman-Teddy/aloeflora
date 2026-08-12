const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
});

async function inspect() {
  try {
    await client.connect();
    const res = await client.query(`SELECT id, name, category, price, variants, stock, safety_stock FROM products ORDER BY name;`);
    console.log(`Found ${res.rows.length} products in database:`);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error("Error inspecting products:", err);
  } finally {
    await client.end();
  }
}

inspect();
