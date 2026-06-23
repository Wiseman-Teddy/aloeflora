const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
});
async function run() {
  try {
    await client.connect();
    const res = await client.query('SELECT * FROM products LIMIT 5;');
    console.log(res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
run();
