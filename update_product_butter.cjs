const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
});

async function run() {
  try {
    await client.connect();

    const bodyButterImage = 'https://apnmunmhlrpcbmjmywyh.supabase.co/storage/v1/object/public/images/product_fscsf9o1nk_1786355189795.jpeg';

    await client.query(`
      UPDATE products 
      SET image_url = $1, media_urls = $2 
      WHERE name ILIKE '%Body Butter%';
    `, [bodyButterImage, JSON.stringify([bodyButterImage])]);

    console.log("Successfully updated Aloeflora Body Butter image URL to exact product catalog image!");
  } catch (e) {
    console.error("Error updating database:", e);
  } finally {
    await client.end();
  }
}

run();
