#!/usr/bin/env node
/**
 * apply_admin_profiles_policy.cjs
 * ─────────────────────────────────
 * Fixes the Supabase RLS policy for the `profiles` table so that admin users
 * (whose role is stored in the profiles table, NOT in JWT claims) can read
 * ALL profiles in the admin dashboard.
 *
 * The original policy used:  (auth.jwt() ->> 'role') = 'admin'
 * This fails because Supabase doesn't automatically set JWT claims from profiles.
 *
 * The new policy uses a subquery on the profiles table itself.
 *
 * Run: node apply_admin_profiles_policy.cjs
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log('🔧 Applying admin profiles RLS policy fix...\n');

  const sql = `
    -- Drop the old JWT-based admin policy that doesn't work with profile-based roles
    DROP POLICY IF EXISTS "Admins full access Profiles" ON profiles;

    -- New policy: Admins (identified by their profile role) get full access to all profiles
    -- Uses SECURITY DEFINER function to avoid infinite recursion in the subquery
    CREATE OR REPLACE FUNCTION public.is_admin()
    RETURNS boolean
    LANGUAGE sql
    SECURITY DEFINER
    STABLE
    AS $$
      SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
      );
    $$;

    -- Grant execute on the function to authenticated users
    GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

    -- Admin full access policy using the security-definer function (avoids RLS recursion)
    CREATE POLICY "Admins full access Profiles"
      ON profiles
      FOR ALL
      USING (
        (auth.jwt() ->> 'role') = 'admin'
        OR public.is_admin()
      );

    -- Also ensure users can always read their own profile (in case it's missing)
    DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
    CREATE POLICY "Users can view their own profile"
      ON profiles
      FOR SELECT
      USING (auth.uid() = id OR public.is_admin());

    -- Users can update their own profile
    DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
    CREATE POLICY "Users can update their own profile"
      ON profiles
      FOR UPDATE
      USING (auth.uid() = id OR public.is_admin());
  `;

  // Supabase JS client doesn't support raw SQL directly — we use the REST API
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
    },
  });

  // Use the postgres extension via supabase-js query approach
  // Since we can't run raw SQL via anon REST, provide SQL to paste in Supabase SQL editor
  console.log('━'.repeat(60));
  console.log('⚠️  ACTION REQUIRED: Run the following SQL in your Supabase SQL Editor');
  console.log('   → https://supabase.com/dashboard/project/apnmunmhlrpcbmjmywyh/sql/new');
  console.log('━'.repeat(60));
  console.log(sql);
  console.log('━'.repeat(60));
  console.log('\n✅ Policy SQL generated. Please paste it in the Supabase SQL editor and run it.');
  console.log('\n📋 What this fixes:');
  console.log('   • Admins can now fetch ALL user profiles in the admin dashboard');
  console.log('   • Uses SECURITY DEFINER function to avoid RLS recursion');
  console.log('   • Preserves individual user access to their own profile');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
