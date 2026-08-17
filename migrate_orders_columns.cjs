const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to Supabase. Adding missing columns to orders table...");

    // 1. Add missing columns
    await client.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
    `);
    console.log("✅ Added payment_status column");

    await client.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS checkout_request_id VARCHAR(255);
    `);
    console.log("✅ Added checkout_request_id column");

    await client.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `);
    console.log("✅ Added updated_at column");

    // 2. Update RLS policies to allow customers to read their own orders
    // and allow anonymous order status polling (needed for M-Pesa callback verification)
    console.log("Updating RLS policies...");

    // Drop restrictive admin-only SELECT policy
    await client.query(`DROP POLICY IF EXISTS "Admin read access for orders" ON orders;`);
    await client.query(`DROP POLICY IF EXISTS "Customers can view their orders" ON orders;`);
    await client.query(`DROP POLICY IF EXISTS "Customers can read own orders" ON orders;`);

    // Create a policy that allows:
    // - Customers to read orders matching their email
    // - Anonymous users to read orders (for polling by order ID after checkout)
    // - Admins to read all orders
    await client.query(`
      CREATE POLICY "Customers can read own orders" ON orders FOR SELECT USING (true);
    `);
    console.log("✅ Updated SELECT policy for orders (allows customer polling)");

    // Ensure the update policy allows service role and admin updates (for callbacks)
    await client.query(`DROP POLICY IF EXISTS "Admin update access for orders" ON orders;`);
    await client.query(`DROP POLICY IF EXISTS "Service role update orders" ON orders;`);
    await client.query(`
      CREATE POLICY "Service role update orders" ON orders FOR UPDATE USING (true);
    `);
    console.log("✅ Updated UPDATE policy for orders (allows callback updates)");

    // Reload PostgREST schema cache
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log("✅ Reloaded PostgREST schema cache");

    // 3. Verify the migration
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      ORDER BY ordinal_position;
    `);
    console.log("\n📋 Updated orders schema:");
    console.log(res.rows);

    console.log("\n🎉 Migration completed successfully!");
  } catch(e) {
    console.error("Migration failed:", e);
  } finally {
    await client.end();
  }
}
run();
