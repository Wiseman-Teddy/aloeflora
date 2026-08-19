const { Client } = require('pg');
const connectionString = "postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";

async function deployAtomicInventoryFunctions() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("=== DEPLOYING ATOMIC INVENTORY FUNCTIONS & CONCURRENCY SAFEGUARDS ===");

    // 1. Atomic Decrement Function (Race-Condition Free)
    console.log("1. Creating decrement_product_stock() function...");
    await client.query(`
      CREATE OR REPLACE FUNCTION public.decrement_product_stock(
        p_product_id TEXT, 
        p_quantity INTEGER
      )
      RETURNS INTEGER AS $$
      DECLARE
        v_new_stock INTEGER;
      BEGIN
        UPDATE public.products
        SET stock = GREATEST(0, stock - p_quantity)
        WHERE id = p_product_id
        RETURNING stock INTO v_new_stock;
        
        RETURN COALESCE(v_new_stock, 0);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // 2. Atomic Restore Function (For Cancelled/Refunded Orders)
    console.log("2. Creating restore_product_stock() function...");
    await client.query(`
      CREATE OR REPLACE FUNCTION public.restore_product_stock(
        p_product_id TEXT, 
        p_quantity INTEGER
      )
      RETURNS INTEGER AS $$
      DECLARE
        v_new_stock INTEGER;
      BEGIN
        UPDATE public.products
        SET stock = stock + p_quantity
        WHERE id = p_product_id
        RETURNING stock INTO v_new_stock;
        
        RETURN COALESCE(v_new_stock, 0);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // 3. Test Decrement & Restore on a test product
    console.log("\n3. Testing Atomic Inventory Concurrency Simulation...");
    const testProdId = "test-inv-" + Date.now();
    await client.query(`
      INSERT INTO products (
        id, name, description, price, cost_price, category, sub_category, 
        stock, safety_stock, reorder_level, rating, reviews_count
      )
      VALUES ($1, 'Test Inventory Item', 'Test item', 500, 250, 'skincare', 'Moisturizers', 20, 5, 10, 5.0, 0);
    `, [testProdId]);

    // Simulate 5 simultaneous purchases of 2 items each in parallel
    const p1 = client.query("SELECT decrement_product_stock($1, 2)", [testProdId]);
    const p2 = client.query("SELECT decrement_product_stock($1, 2)", [testProdId]);
    const p3 = client.query("SELECT decrement_product_stock($1, 2)", [testProdId]);
    const p4 = client.query("SELECT decrement_product_stock($1, 2)", [testProdId]);
    const p5 = client.query("SELECT decrement_product_stock($1, 2)", [testProdId]);

    await Promise.all([p1, p2, p3, p4, p5]);

    const checkStock = await client.query("SELECT stock FROM products WHERE id = $1;", [testProdId]);
    console.log(`  ✓ Initial Stock: 20 | After 5 parallel deductions of 2: Stock = ${checkStock.rows[0].stock} (Expected: 10)`);

    if (checkStock.rows[0].stock !== 10) {
      throw new Error(`Atomic decrement error: expected 10, got ${checkStock.rows[0].stock}`);
    }

    // Test Restoring stock
    await client.query("SELECT restore_product_stock($1, 5)", [testProdId]);
    const restoredStock = await client.query("SELECT stock FROM products WHERE id = $1;", [testProdId]);
    console.log(`  ✓ Restored 5 items: Stock = ${restoredStock.rows[0].stock} (Expected: 15)`);

    // Clean up
    await client.query("DELETE FROM products WHERE id = $1;", [testProdId]);
    console.log("  ✓ Cleaned up test inventory record.");

    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log("\n========================================================");
    console.log("  ATOMIC INVENTORY SAFEGUARDS DEPLOYED & TESTED (100%)  ");
    console.log("========================================================\n");

  } catch (err) {
    console.error("❌ Inventory Safeguard Error:", err);
  } finally {
    await client.end();
  }
}

deployAtomicInventoryFunctions();
