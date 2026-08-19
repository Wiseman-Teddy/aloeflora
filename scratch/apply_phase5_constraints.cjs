const { Client } = require('pg');
const connectionString = "postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";

async function applyDatabaseIntegrityConstraints() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("=== APPLYING PHASE 5 DATABASE INTEGRITY CONSTRAINTS ===");

    // 1. Partial Unique Index on mpesa_receipt (Prevents duplicate receipts across orders)
    console.log("1. Creating unique index on mpesa_receipt...");
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_unique_mpesa_receipt 
      ON orders (mpesa_receipt) 
      WHERE mpesa_receipt IS NOT NULL AND mpesa_receipt != '';
    `);

    // 2. Index on checkout_request_id for sub-millisecond callback matching
    console.log("2. Creating index on checkout_request_id...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_checkout_request_id 
      ON orders (checkout_request_id)
      WHERE checkout_request_id IS NOT NULL;
    `);

    // 3. Index on payment_status and created_at
    console.log("3. Creating index on payment_status...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_payment_status_created 
      ON orders (payment_status, created_at DESC);
    `);

    // 4. Index on event_registrations
    console.log("4. Creating indexes on event_registrations...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_event_reg_ticket 
      ON event_registrations (ticket_number);

      CREATE INDEX IF NOT EXISTS idx_event_reg_receipt 
      ON event_registrations (mpesa_receipt)
      WHERE mpesa_receipt IS NOT NULL;
    `);

    // 5. Reload PostgREST API schema cache
    console.log("5. Reloading PostgREST cache...");
    await client.query("NOTIFY pgrst, 'reload schema';");

    console.log("=== PHASE 5 CONSTRAINTS & INDEXES APPLIED SUCCESSFULLY! ===");
  } catch (err) {
    console.error("Database constraint error:", err);
  } finally {
    await client.end();
  }
}

applyDatabaseIntegrityConstraints();
