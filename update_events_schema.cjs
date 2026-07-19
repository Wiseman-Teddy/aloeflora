const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to Supabase. Updating events table schema...");
    
    // Add columns if they don't exist
    await client.query(`
      ALTER TABLE events
      ADD COLUMN IF NOT EXISTS vendor_enabled BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS vendor_price DECIMAL(10,2) DEFAULT 2000.00,
      ADD COLUMN IF NOT EXISTS vendor_capacity INTEGER DEFAULT 10,
      ADD COLUMN IF NOT EXISTS attendee_enabled BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS attendee_price DECIMAL(10,2) DEFAULT 0.00;
    `);

    // Reload PostgREST schema cache
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log("Successfully updated schema and reloaded API cache!");

  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
run();
