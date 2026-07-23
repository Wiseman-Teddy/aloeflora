const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

async function run() {
  const client = new Client({ connectionString });
  await client.connect();
  
  await client.query(`
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."events";
    DROP POLICY IF EXISTS "Enable update for authenticated users only" ON "public"."events";
    DROP POLICY IF EXISTS "Enable all for authenticated users only" ON "public"."events";
    DROP POLICY IF EXISTS "Enable all for all users" ON "public"."events";
    
    CREATE POLICY "Enable all for all users" ON "public"."events" FOR ALL USING (true) WITH CHECK (true);
    
    ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;
  `);
  
  await client.query(`
    ALTER TABLE "public"."event_registrations" ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
    ALTER TABLE "public"."event_registrations" ADD COLUMN IF NOT EXISTS total_cost NUMERIC DEFAULT 0;
  `);
  
  console.log('SQL operations completed successfully.');
  await client.end();
}
run().catch(console.error);
