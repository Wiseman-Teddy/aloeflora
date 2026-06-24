const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DIRECT_URL,
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database.');
    const sql = `
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

DROP POLICY IF EXISTS "Admins full access CMS" ON cms_posts;
DROP POLICY IF EXISTS "Admins full access Tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins full access Events" ON events;
DROP POLICY IF EXISTS "Admins full access Campaigns" ON campaigns;
DROP POLICY IF EXISTS "Admins full access Products" ON products;
DROP POLICY IF EXISTS "Admins full access Orders" ON orders;
DROP POLICY IF EXISTS "Admins full access Store Settings" ON store_settings;
DROP POLICY IF EXISTS "Admins full access Profiles" ON profiles;

CREATE POLICY "Admins full access CMS" ON cms_posts FOR ALL USING ((auth.jwt() ->> 'role') = 'admin' OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admins full access Tickets" ON support_tickets FOR ALL USING ((auth.jwt() ->> 'role') = 'admin' OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admins full access Events" ON events FOR ALL USING ((auth.jwt() ->> 'role') = 'admin' OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admins full access Campaigns" ON campaigns FOR ALL USING ((auth.jwt() ->> 'role') = 'admin' OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admins full access Products" ON products FOR ALL USING ((auth.jwt() ->> 'role') = 'admin' OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admins full access Orders" ON orders FOR ALL USING ((auth.jwt() ->> 'role') = 'admin' OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admins full access Store Settings" ON store_settings FOR ALL USING ((auth.jwt() ->> 'role') = 'admin' OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admins full access Profiles" ON profiles FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Owner or Admin Update Delete" ON storage.objects;
DROP POLICY IF EXISTS "Owner or Admin Delete" ON storage.objects;

CREATE POLICY "Owner or Admin Update Delete" ON storage.objects FOR UPDATE USING ( 
    bucket_id = 'images' AND (auth.uid() = owner OR (auth.jwt() ->> 'role') = 'admin' OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')) 
);
CREATE POLICY "Owner or Admin Delete" ON storage.objects FOR DELETE USING ( 
    bucket_id = 'images' AND (auth.uid() = owner OR (auth.jwt() ->> 'role') = 'admin' OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')) 
);
    `;
    await client.query(sql);
    console.log('Policies updated successfully.');
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

run();
