import pg from 'pg';

const { Client } = pg;
const connectionString = "postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    
    // Create buckets
    const sql = `
      INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true) ON CONFLICT (id) DO NOTHING;
      INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
    `;
    
    await client.query(sql);
    console.log("Buckets created successfully.");
  } catch (err) {
    console.error("Error executing SQL:", err);
  } finally {
    await client.end();
  }
}
run();
