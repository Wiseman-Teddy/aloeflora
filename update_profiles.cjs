const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to Supabase. Ensuring profiles columns exist...");
    
    await client.query(`
      DO $$ 
      BEGIN 
          BEGIN
              ALTER TABLE profiles ADD COLUMN wishlist JSONB DEFAULT '[]'::jsonb;
          EXCEPTION WHEN duplicate_column THEN END;
          
          BEGIN
              ALTER TABLE profiles ADD COLUMN cart JSONB DEFAULT '[]'::jsonb;
          EXCEPTION WHEN duplicate_column THEN END;
          
          BEGIN
              ALTER TABLE profiles ADD COLUMN loyalty_points INTEGER DEFAULT 0;
          EXCEPTION WHEN duplicate_column THEN END;
      END $$;
    `);

    // We also need to reload PostgREST schema cache
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log("Successfully verified schema and reloaded API cache!");

  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
run();
