/**
 * apply_user_management_fix.cjs
 * Applies the complete User Management RLS + schema fix directly
 * to the production Supabase PostgreSQL database using DIRECT_URL.
 * Run: node apply_user_management_fix.cjs
 */

const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL (direct connection).\n');

    // ── STEP 1: is_admin() security-definer function ─────────────────────────
    console.log('🔧 Step 1/4: Creating is_admin() SECURITY DEFINER function...');
    await client.query(`
      CREATE OR REPLACE FUNCTION public.is_admin()
      RETURNS boolean
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = public
      STABLE
      AS $$
        SELECT EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'admin'
        );
      $$;
    `);
    await client.query(`GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;`);
    console.log('   ✓ is_admin() function created/updated.\n');

    // ── STEP 2: Drop old broken profile RLS policies ─────────────────────────
    console.log('🔧 Step 2/4: Dropping old RLS policies on profiles...');
    await client.query(`
      DROP POLICY IF EXISTS "Admins full access Profiles" ON profiles;
      DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
      DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
      DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
      DROP POLICY IF EXISTS "Service can insert profiles" ON profiles;
    `);
    console.log('   ✓ Old policies dropped.\n');

    // ── STEP 3: Create correct RLS policies for profiles ─────────────────────
    console.log('🔧 Step 3/4: Creating new profiles RLS policies...');
    await client.query(`
      -- Admins can do everything on all profiles
      CREATE POLICY "Admins full access Profiles"
        ON profiles FOR ALL
        USING (public.is_admin())
        WITH CHECK (public.is_admin());

      -- Regular users can read their own profile
      CREATE POLICY "Users can view their own profile"
        ON profiles FOR SELECT
        USING (auth.uid() = id OR public.is_admin());

      -- Regular users can update their own profile
      CREATE POLICY "Users can update their own profile"
        ON profiles FOR UPDATE
        USING (auth.uid() = id OR public.is_admin())
        WITH CHECK (auth.uid() = id OR public.is_admin());

      -- Allow the on_auth_user_created trigger to insert new profile rows
      CREATE POLICY "Service can insert profiles"
        ON profiles FOR INSERT
        WITH CHECK (true);
    `);
    console.log('   ✓ New RLS policies created.\n');

    // ── STEP 4: Ensure profiles table has all required columns ───────────────
    console.log('🔧 Step 4/4: Ensuring profiles table has all required columns...');
    const columnChecks = [
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address VARCHAR(255);`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hair_type VARCHAR(100);`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skin_type VARCHAR(100);`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wishlist JSONB DEFAULT '[]'::jsonb;`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cart JSONB DEFAULT '[]'::jsonb;`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_spending DECIMAL(12,2) DEFAULT 0.00;`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS order_count INTEGER DEFAULT 0;`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_status VARCHAR(50) DEFAULT 'active';`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'customer';`,
    ];
    for (const sql of columnChecks) {
      await client.query(sql);
    }
    console.log('   ✓ All required columns present.\n');

    // ── STEP 5: Sync total_spending + order_count from orders ────────────────
    console.log('🔧 Bonus Step: Syncing spending stats from orders into profiles...');
    await client.query(`
      UPDATE profiles p
      SET 
        total_spending = COALESCE(o.total, 0),
        order_count    = COALESCE(o.cnt, 0)
      FROM (
        SELECT 
          email,
          SUM(total_amount) AS total,
          COUNT(*) AS cnt
        FROM orders
        WHERE payment_status = 'paid'
        GROUP BY email
      ) o
      WHERE LOWER(p.email) = LOWER(o.email);
    `);
    console.log('   ✓ Spending stats synced from orders.\n');

    // ── STEP 6: Ensure the handle_new_user trigger is correct ────────────────
    console.log('🔧 Updating handle_new_user trigger function...');
    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.profiles (id, full_name, email, role, account_status)
        VALUES (
          new.id,
          COALESCE(new.raw_user_meta_data->>'full_name', ''),
          new.email,
          COALESCE(new.raw_user_meta_data->>'role', 'customer'),
          'active'
        )
        ON CONFLICT (id) DO NOTHING;
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    `);
    console.log('   ✓ handle_new_user trigger updated.\n');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 ALL CHANGES APPLIED SUCCESSFULLY!');
    console.log('');
    console.log('Summary:');
    console.log('  ✓ is_admin() SECURITY DEFINER function — prevents RLS recursion');
    console.log('  ✓ Profiles RLS policies — admins see all users, users see own row');
    console.log('  ✓ All profile columns verified (avatar_url, spending, etc.)');
    console.log('  ✓ Spending stats synced from paid orders into profiles');
    console.log('  ✓ handle_new_user trigger updated with ON CONFLICT DO NOTHING');
    console.log('═══════════════════════════════════════════════════════════');

  } catch (err) {
    console.error('\n❌ Error applying changes:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
