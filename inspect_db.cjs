const { Client } = require('pg');
const connectionString = "postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const prods = await client.query('SELECT id, name, category, image_url, media_urls FROM products;');
    console.log("=== PRODUCTS ===");
    console.log(JSON.stringify(prods.rows, null, 2));

    const cms = await client.query('SELECT id, title, type, image_url FROM cms_posts WHERE type = \'hero\';');
    console.log("=== HERO CMS POSTS ===");
    console.log(JSON.stringify(cms.rows, null, 2));
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await client.end();
  }
}
run();
