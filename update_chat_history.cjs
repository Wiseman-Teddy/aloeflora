const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to Supabase. Ensuring ai_chat_history column exists...");
    
    await client.query(`
      DO $$ 
      BEGIN 
          BEGIN
              ALTER TABLE profiles ADD COLUMN ai_chat_history JSONB;
          EXCEPTION WHEN duplicate_column THEN END;
      END $$;
    `);

    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log("Successfully verified schema and reloaded API cache!");

  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
run();
