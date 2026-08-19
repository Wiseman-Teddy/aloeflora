const { Client } = require('pg');
const connectionString = "postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";

async function inspectProductsCols() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND table_schema = 'public' 
      ORDER BY ordinal_position;
    `);
    console.log("Products columns:", res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

inspectProductsCols();
