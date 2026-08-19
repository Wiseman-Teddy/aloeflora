const { Client } = require('pg');
const connectionString = "postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";

async function checkAndConfigureRoles() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("=== CHECKING & UPDATING USER ROLES ===");

    const res = await client.query(`
      SELECT id, email, full_name, role 
      FROM profiles 
      WHERE email IN ('aganyawiseman@gmail.com', 'aganyateddy57@gmail.com', 'admin@aloeflora.com', 'info@aloefloraproducts.com');
    `);
    console.log("Current profiles:", res.rows);

    // 1. Ensure aganyawiseman@gmail.com is set to 'admin'
    await client.query(`
      UPDATE profiles 
      SET role = 'admin' 
      WHERE email = 'aganyawiseman@gmail.com';
    `);

    // 2. Ensure aganyateddy57@gmail.com is set to 'customer'
    await client.query(`
      UPDATE profiles 
      SET role = 'customer' 
      WHERE email = 'aganyateddy57@gmail.com';
    `);

    // Also update auth.users raw_user_meta_data if users exist in auth.users
    await client.query(`
      UPDATE auth.users 
      SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb 
      WHERE email = 'aganyawiseman@gmail.com';
    `);

    await client.query(`
      UPDATE auth.users 
      SET raw_user_meta_data = raw_user_meta_data || '{"role": "customer"}'::jsonb 
      WHERE email = 'aganyateddy57@gmail.com';
    `);

    const updatedRes = await client.query(`
      SELECT p.id, p.email, p.full_name, p.role as profile_role, u.raw_user_meta_data->>'role' as metadata_role
      FROM profiles p
      LEFT JOIN auth.users u ON p.id = u.id
      WHERE p.email IN ('aganyawiseman@gmail.com', 'aganyateddy57@gmail.com');
    `);
    console.log("Updated roles:", updatedRes.rows);

  } catch (err) {
    console.error("Error configuring roles:", err);
  } finally {
    await client.end();
  }
}

checkAndConfigureRoles();
