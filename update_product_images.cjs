const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
});

async function run() {
  try {
    await client.connect();

    const images = [
      '/Iimg_af/WhatsApp%20Image%202026-06-14%20at%2014.00.54.jpeg',
      '/Iimg_af/WhatsApp%20Image%202026-06-17%20at%2021.21.35.jpeg',
      '/Iimg_af/WhatsApp%20Image%202026-06-17%20at%2022.12.06.jpeg'
    ];

    // Update product 1
    await client.query(`
      UPDATE products 
      SET image_url = $1, media_urls = $2 
      WHERE id = 'p1';
    `, [images[0], JSON.stringify([images[0]])]);

    // Update product 2
    await client.query(`
      UPDATE products 
      SET image_url = $1, media_urls = $2 
      WHERE id = 'p2';
    `, [images[1], JSON.stringify([images[1]])]);

    // Update product 3
    await client.query(`
      UPDATE products 
      SET image_url = $1, media_urls = $2 
      WHERE id = 'p3';
    `, [images[2], JSON.stringify([images[2]])]);

    console.log("Product images successfully updated in Supabase to point to local /Iimg_af/ assets!");

  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

run();
