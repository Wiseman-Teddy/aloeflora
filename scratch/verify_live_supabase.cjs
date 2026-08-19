const { Client } = require('pg');
const connectionString = "postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";

async function verifyAllAppliedChanges() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("=== VERIFYING LIVE SUPABASE CONFIGURATION ===");

    // 1. Check indexes on orders
    const indexes = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'orders'
      ORDER BY indexname;
    `);
    console.log("\n1. Orders Table Indexes:");
    indexes.rows.forEach(r => console.log(` - ${r.indexname}: ${r.indexdef}`));

    // 2. Check Storage Buckets
    const buckets = await client.query(`SELECT id, name, public FROM storage.buckets;`);
    console.log("\n2. Storage Buckets:");
    buckets.rows.forEach(b => console.log(` - Bucket '${b.name}': public = ${b.public}`));

    // 3. Check Auth Trigger
    const triggers = await client.query(`
      SELECT trigger_name, event_manipulation, event_object_table, action_statement
      FROM information_schema.triggers
      WHERE trigger_name = 'on_auth_user_created';
    `);
    console.log("\n3. Auth Triggers:");
    triggers.rows.forEach(t => console.log(` - Trigger '${t.trigger_name}' on ${t.event_object_table}`));

    // 4. Check RLS status on core tables
    const rls = await client.query(`
      SELECT relname, relrowsecurity 
      FROM pg_class 
      WHERE relnamespace = 'public'::regnamespace AND relkind = 'r'
      ORDER BY relname;
    `);
    console.log("\n4. Row Level Security (RLS) Status on Tables:");
    rls.rows.forEach(r => console.log(` - Table '${r.relname}': RLS Enabled = ${r.relrowsecurity}`));

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

verifyAllAppliedChanges();
