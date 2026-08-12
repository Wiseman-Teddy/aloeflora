const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
});

async function run() {
  try {
    await client.connect();

    await client.query(`
      UPDATE products 
      SET image_url = '/main hero/body_butter.png' 
      WHERE name ILIKE '%Body Butter%';
    `);

    await client.query(`
      UPDATE products 
      SET image_url = '/main hero/tumeric_soap.jpg' 
      WHERE name ILIKE '%Multipurpose soap%';
    `);

    console.log("Successfully updated Body Butter and Multipurpose soap image URLs in Supabase database!");
  } catch (e) {
    console.error("Error updating database:", e);
  } finally {
    await client.end();
  }
}

run();
