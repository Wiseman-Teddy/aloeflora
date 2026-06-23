const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
});

async function run() {
  try {
    await client.connect();
    
    const query = `
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles';
    `;
    
    const res = await client.query(query);
    console.log("Profiles columns:");
    console.table(res.rows);
    
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

run();
