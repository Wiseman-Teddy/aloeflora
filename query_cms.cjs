const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
});
async function run() {
  try {
    await client.connect();
    const cms = await client.query('SELECT id, title, image_url FROM cms_posts LIMIT 5;');
    console.log("CMS:", cms.rows);
    const settings = await client.query('SELECT * FROM store_settings;');
    console.log("Settings:", settings.rows);
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
run();
