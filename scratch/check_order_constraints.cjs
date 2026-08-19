const { Client } = require('pg');
const connectionString = "postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";

async function inspectConstraints() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("=== INSPECTING ORDERS & TRANSACTIONS INDEXES & CONSTRAINTS ===");

    const indexes = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'orders';
    `);
    console.log("Indexes on orders:", indexes.rows);

    const constraints = await client.query(`
      SELECT conname, contype, pg_get_constraintdef(oid) 
      FROM pg_constraint 
      WHERE conrelid = 'orders'::regclass;
    `);
    console.log("Constraints on orders:", constraints.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

inspectConstraints();
