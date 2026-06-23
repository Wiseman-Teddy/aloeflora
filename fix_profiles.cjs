const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to database. Fixing profiles table...");

    // Drop the trigger first
    await client.query('DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;');
    await client.query('DROP FUNCTION IF EXISTS public.handle_new_user();');

    // Drop the conflicting profiles table
    await client.query('DROP TABLE IF EXISTS public.profiles CASCADE;');

    // Recreate profiles table with correct schema
    const createProfilesQuery = `
      CREATE TABLE profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          full_name VARCHAR(255),
          email VARCHAR(255) UNIQUE NOT NULL,
          phone VARCHAR(50),
          role VARCHAR(50) DEFAULT 'customer',
          account_status VARCHAR(50) DEFAULT 'active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP WITH TIME ZONE,
          total_spending DECIMAL(12,2) DEFAULT 0.00,
          order_count INTEGER DEFAULT 0
      );
    `;
    await client.query(createProfilesQuery);

    // Recreate the function
    const createFunctionQuery = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.profiles (id, full_name, email, role)
        VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, COALESCE(new.raw_user_meta_data->>'role', 'customer'));
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    await client.query(createFunctionQuery);

    // Recreate the trigger
    const createTriggerQuery = `
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    `;
    await client.query(createTriggerQuery);

    // Apply RLS to the new profiles table
    await client.query('ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;');
    await client.query('CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);');
    await client.query('CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);');
    await client.query('CREATE POLICY "Admins full access Profiles" ON profiles FOR ALL USING ((auth.jwt() ->> \'role\') = \'admin\');');

    // Notify PostgREST to reload schema cache
    await client.query("NOTIFY pgrst, 'reload schema';");

    console.log("✅ Profiles table and trigger fixed successfully!");
  } catch (err) {
    console.error("❌ Postgres Error:", err.message);
  } finally {
    await client.end();
  }
}

run();
