const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to Supabase. Creating commissions and settlements tables...");
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS commissions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          mpesa_receipt VARCHAR(255) NOT NULL,
          gross_amount DECIMAL(10,2) NOT NULL,
          business_percentage DECIMAL(5,2) DEFAULT 70.00,
          platform_percentage DECIMAL(5,2) DEFAULT 30.00,
          business_amount DECIMAL(10,2) NOT NULL,
          platform_amount DECIMAL(10,2) NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS settlements (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          commission_id UUID REFERENCES commissions(id) ON DELETE CASCADE,
          destination VARCHAR(255) NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          transaction_id VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          settled_at TIMESTAMP WITH TIME ZONE
      );
    `);

    // Reload PostgREST schema cache
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log("Successfully created tables and reloaded API cache!");

  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
run();
