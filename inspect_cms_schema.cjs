const { Client } = require('pg');
const connectionString = "postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const client = new Client({ connectionString });

async function inspectSchema() {
  await client.connect();
  const { rows } = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'cms_posts';
  `);
  console.log("cms_posts columns:");
  console.table(rows);
  await client.end();
}
inspectSchema();
