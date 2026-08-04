const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to Supabase. Updating hero CMS posts...");

    const titleText = "Naturally Better Living Starts Here";
    const subtitleText = "Discover high-quality, affordable products crafted with care for your home and everyday wellness. From Home Care, Body Care, and Skin Care to Premium Coffee Products, AloeFloraProducts brings you trusted natural solutions designed to enrich your lifestyle.";

    // Upsert hero-title
    await client.query(`
      INSERT INTO cms_posts (id, title, content, type, status, author)
      VALUES ('hero-title', 'Hero Title', $1, 'hero', 'published', 'Admin')
      ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content;
    `, [titleText]);

    // Upsert hero-subtitle
    await client.query(`
      INSERT INTO cms_posts (id, title, content, type, status, author)
      VALUES ('hero-subtitle', 'Hero Subtitle', $1, 'hero', 'published', 'Admin')
      ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content;
    `, [subtitleText]);

    console.log("Successfully updated Hero title and subtitle in Supabase database!");
  } catch (e) {
    console.error("Error updating Supabase hero CMS:", e);
  } finally {
    await client.end();
  }
}

run();
