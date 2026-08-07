const { Client } = require('pg');
const connectionString = "postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const client = new Client({ connectionString });

async function cleanHeroPosts() {
  await client.connect();
  // Delete hero posts with null image_url so only complete slider items remain
  await client.query("DELETE FROM cms_posts WHERE type = 'hero' AND (image_url IS NULL OR image_url = '');");
  const { rows } = await client.query("SELECT id, title, type, status, image_url FROM cms_posts WHERE type = 'hero';");
  console.log("Cleaned Hero Posts in Supabase cms_posts:");
  console.table(rows);
  await client.end();
}

cleanHeroPosts();
