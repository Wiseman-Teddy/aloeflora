const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DIRECT_URL,
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database.');
    const sql = fs.readFileSync('supabase_setup.sql', 'utf8');
    await client.query(sql);
    console.log('SQL script executed successfully.');
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

run();
