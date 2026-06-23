const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DIRECT_URL,
});

async function run() {
  try {
    await client.connect();
    const res = await client.query("SELECT image_url FROM cms_posts WHERE type = 'hero'");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

run();
