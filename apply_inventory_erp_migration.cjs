const pg = require('pg');
const { Client } = pg;

const connectionString = "postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";

async function runMigration() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected to PostgreSQL database...");

    // 1. Add SKU, batch_number, barcode, expiry_date to products
    await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS sku VARCHAR(100),
      ADD COLUMN IF NOT EXISTS barcode VARCHAR(100),
      ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100),
      ADD COLUMN IF NOT EXISTS expiry_date DATE;
    `);
    console.log("✅ Added SKU, barcode, batch_number, expiry_date columns to products table.");

    // 2. Backfill existing products with standard SKUs and default batch numbers
    await client.query(`
      UPDATE products
      SET 
        sku = COALESCE(sku, 'AF-' || UPPER(SUBSTRING(category, 1, 3)) || '-' || UPPER(SUBSTRING(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '', 'g'), 1, 6)) || '-' || UPPER(COALESCE(SUBSTRING(REGEXP_REPLACE(unit_size, '[^a-zA-Z0-9]', '', 'g'), 1, 5), 'STD'))),
        batch_number = COALESCE(batch_number, 'LOT-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-01')
      WHERE sku IS NULL OR batch_number IS NULL;
    `);
    console.log("✅ Backfilled existing products with initial SKUs and Batch/Lot numbers.");

    // 3. Create stock_movements ledger table
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id VARCHAR(50) REFERENCES products(id) ON DELETE CASCADE,
        sku VARCHAR(100),
        movement_type VARCHAR(30) NOT NULL, -- 'restock', 'order_sale', 'return', 'adjustment'
        quantity_delta INTEGER NOT NULL,
        stock_before INTEGER,
        stock_after INTEGER,
        batch_number VARCHAR(100),
        reference_id VARCHAR(100), -- Order ID or Restock PO / Note
        notes TEXT,
        performed_by VARCHAR(100) DEFAULT 'system',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_stock_movements_prod ON stock_movements(product_id);
      CREATE INDEX IF NOT EXISTS idx_stock_movements_sku ON stock_movements(sku);
      CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON stock_movements(created_at DESC);
    `);
    console.log("✅ Created stock_movements table and indexes.");

    // 4. Enable RLS and permissions on stock_movements
    await client.query(`
      ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Public can view stock movements" ON stock_movements;
      CREATE POLICY "Public can view stock movements" ON stock_movements
        FOR SELECT USING (true);

      DROP POLICY IF EXISTS "Anyone can insert stock movements" ON stock_movements;
      CREATE POLICY "Anyone can insert stock movements" ON stock_movements
        FOR INSERT WITH CHECK (true);
    `);
    console.log("✅ Configured RLS policies for stock_movements.");

    // 5. Create or Replace Atomic Postgres Functions (RPCs)
    await client.query(`
      -- Function 1: Decrement Stock on Order
      CREATE OR REPLACE FUNCTION decrement_product_stock(
        p_product_id VARCHAR(50),
        p_quantity INTEGER,
        p_reference VARCHAR(100) DEFAULT NULL,
        p_notes TEXT DEFAULT NULL
      ) RETURNS INTEGER AS $$
      DECLARE
        v_current_stock INTEGER;
        v_new_stock INTEGER;
        v_sku VARCHAR(100);
        v_batch VARCHAR(100);
      BEGIN
        SELECT stock, sku, batch_number INTO v_current_stock, v_sku, v_batch
        FROM products
        WHERE id = p_product_id
        FOR UPDATE;

        IF NOT FOUND THEN
          RETURN -1;
        END IF;

        v_new_stock := GREATEST(0, v_current_stock - p_quantity);

        UPDATE products
        SET stock = v_new_stock
        WHERE id = p_product_id;

        -- Record movement
        INSERT INTO stock_movements (
          product_id, sku, movement_type, quantity_delta, stock_before, stock_after, batch_number, reference_id, notes, performed_by
        ) VALUES (
          p_product_id, v_sku, 'order_sale', -p_quantity, v_current_stock, v_new_stock, v_batch, p_reference, p_notes, 'customer_checkout'
        );

        RETURN v_new_stock;
      END;
      $$ LANGUAGE plpgsql;

      -- Function 2: Process Inventory Restock
      CREATE OR REPLACE FUNCTION process_inventory_restock(
        p_product_id VARCHAR(50),
        p_quantity INTEGER,
        p_batch VARCHAR(100) DEFAULT NULL,
        p_reference VARCHAR(100) DEFAULT NULL,
        p_notes TEXT DEFAULT NULL,
        p_admin VARCHAR(100) DEFAULT 'admin'
      ) RETURNS INTEGER AS $$
      DECLARE
        v_current_stock INTEGER;
        v_new_stock INTEGER;
        v_sku VARCHAR(100);
        v_active_batch VARCHAR(100);
      BEGIN
        SELECT stock, sku, batch_number INTO v_current_stock, v_sku, v_active_batch
        FROM products
        WHERE id = p_product_id
        FOR UPDATE;

        IF NOT FOUND THEN
          RETURN -1;
        END IF;

        v_new_stock := v_current_stock + p_quantity;
        IF p_batch IS NOT NULL AND TRIM(p_batch) != '' THEN
          v_active_batch := p_batch;
        END IF;

        UPDATE products
        SET stock = v_new_stock,
            batch_number = v_active_batch
        WHERE id = p_product_id;

        -- Record movement
        INSERT INTO stock_movements (
          product_id, sku, movement_type, quantity_delta, stock_before, stock_after, batch_number, reference_id, notes, performed_by
        ) VALUES (
          p_product_id, v_sku, 'restock', p_quantity, v_current_stock, v_new_stock, v_active_batch, p_reference, p_notes, p_admin
        );

        RETURN v_new_stock;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log("✅ Created PostgreSQL stored procedures decrement_product_stock and process_inventory_restock.");

  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
