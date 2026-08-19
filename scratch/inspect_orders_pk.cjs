const { Client } = require('pg');
const connectionString = "postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";

async function inspectOrdersPrimaryKey() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT c.column_name, tc.constraint_type, tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name)
      JOIN information_schema.columns AS c ON c.table_schema = tc.constraint_schema
        AND tc.table_name = c.table_name AND ccu.column_name = c.column_name
      WHERE tc.table_name = 'orders';
    `);
    console.log("Orders Constraints:", res.rows);

    const indexes = await client.query(`
      SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'orders';
    `);
    console.log("Orders Indexes:", indexes.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

inspectOrdersPrimaryKey();
