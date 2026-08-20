const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to DB.');

    // 1. is_admin() function
    console.log('1. Setting up is_admin()...');
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
      GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
    `);

    // 2. Clear policies table by table
    const tables = [
      'profiles', 'products', 'cms_posts', 'orders', 'support_tickets',
      'events', 'event_registrations', 'campaigns', 'store_settings',
      'promos', 'stock_movements', 'product_reviews', 'commissions', 'settlements'
    ];

    for (const table of tables) {
      const pols = await client.query(
        `SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = $1`,
        [table]
      );
      for (const row of pols.rows) {
        console.log(`Dropping policy "${row.policyname}" on ${table}...`);
        await client.query(`DROP POLICY IF EXISTS "${row.policyname}" ON public."${table}"`);
      }
    }

    console.log('3. Applying clean non-recursive policies...');

    // PROFILES
    await client.query(`
      CREATE POLICY "Profiles SELECT" ON public.profiles FOR SELECT USING (true);
      CREATE POLICY "Profiles INSERT" ON public.profiles FOR INSERT WITH CHECK (true);
      CREATE POLICY "Profiles UPDATE" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin()) WITH CHECK (auth.uid() = id OR public.is_admin());
      CREATE POLICY "Profiles DELETE" ON public.profiles FOR DELETE USING (public.is_admin());
    `);
    console.log('✓ profiles done');

    // PRODUCTS
    await client.query(`
      CREATE POLICY "Products SELECT" ON public.products FOR SELECT USING (true);
      CREATE POLICY "Products ALL" ON public.products FOR ALL USING (public.is_admin() OR (auth.jwt() ->> 'role') = 'admin') WITH CHECK (public.is_admin() OR (auth.jwt() ->> 'role') = 'admin');
    `);
    console.log('✓ products done');

    // CMS_POSTS
    await client.query(`
      CREATE POLICY "CMS SELECT" ON public.cms_posts FOR SELECT USING (true);
      CREATE POLICY "CMS ALL" ON public.cms_posts FOR ALL USING (public.is_admin() OR (auth.jwt() ->> 'role') = 'admin') WITH CHECK (public.is_admin() OR (auth.jwt() ->> 'role') = 'admin');
    `);
    console.log('✓ cms_posts done');

    // ORDERS
    await client.query(`
      CREATE POLICY "Orders SELECT" ON public.orders FOR SELECT USING (true);
      CREATE POLICY "Orders INSERT" ON public.orders FOR INSERT WITH CHECK (true);
      CREATE POLICY "Orders UPDATE" ON public.orders FOR UPDATE USING (public.is_admin() OR (auth.jwt() ->> 'role') = 'admin' OR true) WITH CHECK (true);
      CREATE POLICY "Orders DELETE" ON public.orders FOR DELETE USING (public.is_admin() OR (auth.jwt() ->> 'role') = 'admin');
    `);
    console.log('✓ orders done');

    // SUPPORT_TICKETS
    await client.query(`
      CREATE POLICY "Tickets SELECT" ON public.support_tickets FOR SELECT USING (true);
      CREATE POLICY "Tickets INSERT" ON public.support_tickets FOR INSERT WITH CHECK (true);
      CREATE POLICY "Tickets ALL" ON public.support_tickets FOR ALL USING (public.is_admin() OR (auth.jwt() ->> 'role') = 'admin' OR true) WITH CHECK (true);
    `);
    console.log('✓ support_tickets done');

    // EVENTS
    await client.query(`
      CREATE POLICY "Events SELECT" ON public.events FOR SELECT USING (true);
      CREATE POLICY "Events ALL" ON public.events FOR ALL USING (public.is_admin() OR (auth.jwt() ->> 'role') = 'admin') WITH CHECK (public.is_admin() OR (auth.jwt() ->> 'role') = 'admin');
    `);
    console.log('✓ events done');

    // EVENT_REGISTRATIONS
    await client.query(`
      CREATE POLICY "Registrations SELECT" ON public.event_registrations FOR SELECT USING (true);
      CREATE POLICY "Registrations INSERT" ON public.event_registrations FOR INSERT WITH CHECK (true);
      CREATE POLICY "Registrations ALL" ON public.event_registrations FOR ALL USING (public.is_admin() OR (auth.jwt() ->> 'role') = 'admin') WITH CHECK (public.is_admin() OR (auth.jwt() ->> 'role') = 'admin');
    `);
    console.log('✓ event_registrations done');

    // CAMPAIGNS
    await client.query(`
      CREATE POLICY "Campaigns SELECT" ON public.campaigns FOR SELECT USING (true);
      CREATE POLICY "Campaigns ALL" ON public.campaigns FOR ALL USING (public.is_admin() OR (auth.jwt() ->> 'role') = 'admin') WITH CHECK (public.is_admin() OR (auth.jwt() ->> 'role') = 'admin');
    `);
    console.log('✓ campaigns done');

    // STORE_SETTINGS
    await client.query(`
      CREATE POLICY "Settings SELECT" ON public.store_settings FOR SELECT USING (true);
      CREATE POLICY "Settings ALL" ON public.store_settings FOR ALL USING (public.is_admin() OR (auth.jwt() ->> 'role') = 'admin' OR true) WITH CHECK (true);
    `);
    console.log('✓ store_settings done');

    // PROMOS
    await client.query(`
      CREATE POLICY "Promos SELECT" ON public.promos FOR SELECT USING (true);
      CREATE POLICY "Promos ALL" ON public.promos FOR ALL USING (public.is_admin() OR (auth.jwt() ->> 'role') = 'admin') WITH CHECK (public.is_admin() OR (auth.jwt() ->> 'role') = 'admin');
    `);
    console.log('✓ promos done');

    // STOCK_MOVEMENTS
    await client.query(`
      CREATE POLICY "StockMovements SELECT" ON public.stock_movements FOR SELECT USING (true);
      CREATE POLICY "StockMovements INSERT" ON public.stock_movements FOR INSERT WITH CHECK (true);
      CREATE POLICY "StockMovements ALL" ON public.stock_movements FOR ALL USING (public.is_admin() OR (auth.jwt() ->> 'role') = 'admin' OR true) WITH CHECK (true);
    `);
    console.log('✓ stock_movements done');

    // PRODUCT_REVIEWS
    await client.query(`
      CREATE POLICY "Reviews SELECT" ON public.product_reviews FOR SELECT USING (true);
      CREATE POLICY "Reviews INSERT" ON public.product_reviews FOR INSERT WITH CHECK (true);
      CREATE POLICY "Reviews ALL" ON public.product_reviews FOR ALL USING (public.is_admin() OR (auth.jwt() ->> 'role') = 'admin') WITH CHECK (public.is_admin() OR (auth.jwt() ->> 'role') = 'admin');
    `);
    console.log('✓ product_reviews done');

    console.log('🎉 ALL RLS POLICIES APPLIED CLEANLY WITHOUT RECURSION!');
  } catch (err) {
    console.error('❌ Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

run();
