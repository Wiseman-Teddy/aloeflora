const { Client } = require('pg');
const connectionString = "postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";

async function checkAllTables() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected to Supabase. Inspecting all tables...");

    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log("Existing Public Tables:", tablesRes.rows.map(r => r.table_name));

    for (const row of tablesRes.rows) {
      const colRes = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [row.table_name]);
      console.log(`\n--- Table: ${row.table_name} (${colRes.rows.length} columns) ---`);
      console.log(colRes.rows.map(c => `${c.column_name} (${c.data_type})`).join(', '));
    }
  } catch (err) {
    console.error("DB Inspect Error:", err);
  } finally {
    await client.end();
  }
}

checkAllTables();
