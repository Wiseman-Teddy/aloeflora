import pg from 'pg';
import fs from 'fs';

const { Client } = pg;
const connectionString = "postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const sql = fs.readFileSync('supabase_setup.sql', 'utf8');
    await client.query(sql);
    console.log("Supabase setup successfully executed.");
  } catch (err) {
    console.error("Error executing SQL:", err);
  } finally {
    await client.end();
  }
}
run();
