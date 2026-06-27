const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
});

async function run() {
  try {
    await client.connect();

    const img1 = '/Iimg_af/WhatsApp%20Image%202026-06-14%20at%2014.00.55.jpeg';
    const img2 = '/Iimg_af/WhatsApp%20Image%202026-06-14%20at%2014.00.56.jpeg';
    const img3 = '/Iimg_af/WhatsApp%20Image%202026-06-14%20at%2014.00.57.jpeg';
    const img4 = '/Iimg_af/WhatsApp%20Image%202026-06-14%20at%2014.00.58.jpeg';

    // Update cms post 1
    await client.query(`
      UPDATE cms_posts 
      SET image_url = $1 
      WHERE id = 'our-products';
    `, [[img1, img2, img3].join(',')]);

    // Update cms post 2
    await client.query(`
      UPDATE cms_posts 
      SET image_url = $1 
      WHERE id = 'aloeflora-best-selling-natural-products-';
    `, [[img2, img3, img4].join(',')]);

    // Update cms post 3
    await client.query(`
      UPDATE cms_posts 
      SET image_url = $1 
      WHERE id = 'beauty-product-exhibiton-';
    `, [[img1, img4].join(',')]);

    // Also update events table just in case it has missing images
    await client.query(`
      UPDATE events 
      SET image_url = $1 
      WHERE image_url LIKE '%supabase.co%';
    `, [img1]);

    console.log("CMS posts and events images successfully updated in Supabase to point to local /Iimg_af/ assets!");

  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

run();
