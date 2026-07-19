const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to Supabase. Dropping old event tables...");
    
    await client.query(`DROP TABLE IF EXISTS event_registrations CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS events CASCADE;`);
    
    console.log("Recreating events table...");
    await client.query(`
      CREATE TABLE events (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        date VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        image_url TEXT,
        capacity INTEGER NOT NULL DEFAULT 50,
        price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        status VARCHAR(50) NOT NULL DEFAULT 'upcoming',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Recreating event_registrations table...");
    // We use a generated UUID for registration ID using uuid_generate_v4() or just gen_random_uuid()
    await client.query(`
      CREATE TABLE event_registrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id VARCHAR(50) REFERENCES events(id) ON DELETE CASCADE,
        user_id UUID,
        role VARCHAR(50) NOT NULL, -- 'attendee', 'vendor'
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        payment_status VARCHAR(50) NOT NULL DEFAULT 'free', -- 'free', 'pending', 'paid', 'failed'
        amount_paid DECIMAL(10,2) DEFAULT 0.00,
        ticket_number VARCHAR(100),
        mpesa_receipt VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log("Configuring RLS policies...");
    
    // Enable RLS
    await client.query(`ALTER TABLE events ENABLE ROW LEVEL SECURITY;`);
    await client.query(`ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;`);
    
    // Events: Public read, Admin write
    await client.query(`
      DROP POLICY IF EXISTS "Public read access for events" ON events;
      CREATE POLICY "Public read access for events" ON events FOR SELECT USING (true);
      
      DROP POLICY IF EXISTS "Admin write access for events" ON events;
      CREATE POLICY "Admin write access for events" ON events FOR ALL USING (
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
      );
    `);
    
    // Event Registrations: Public insert, Admin read/write
    await client.query(`
      DROP POLICY IF EXISTS "Public insert access for event_registrations" ON event_registrations;
      CREATE POLICY "Public insert access for event_registrations" ON event_registrations FOR INSERT WITH CHECK (true);
      
      DROP POLICY IF EXISTS "Admin read access for event_registrations" ON event_registrations;
      CREATE POLICY "Admin read access for event_registrations" ON event_registrations FOR SELECT USING (
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
      );
      
      DROP POLICY IF EXISTS "Admin update access for event_registrations" ON event_registrations;
      CREATE POLICY "Admin update access for event_registrations" ON event_registrations FOR UPDATE USING (
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
      );
    `);

    // Reload PostgREST schema cache
    await client.query('NOTIFY pgrst, \'reload schema\';');
    console.log("Successfully rebuilt schema and reloaded API cache!");

  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
run();
