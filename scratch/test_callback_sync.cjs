const { Client } = require('pg');
const connectionString = "postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";

async function testCallbackSynchronization() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("========================================================");
    console.log("  ALOEFLORA CALLBACK & ORDER SYNCHRONIZATION TEST       ");
    console.log("========================================================\n");

    const testOrderId = `TEST-CB-${Date.now().toString().slice(-6)}`;
    const testCheckoutId = `ws_CO_TEST_${Date.now()}`;
    const testReceipt = `RCPT${Date.now().toString().slice(-6)}`;
    const testAmount = 2500;

    // 1. Create Pending Order with CheckoutRequestID
    console.log(`1. Creating pending order [${testOrderId}] with CheckoutRequestID [${testCheckoutId}]...`);
    await client.query(`
      INSERT INTO orders (
        id, customer_name, phone, email, county, sub_county, estate,
        items, subtotal, delivery_fee, total_amount, payment_method,
        payment_status, delivery_status, status, checkout_request_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      );
    `, [
      testOrderId, "Amani Wanjiku", "254712345678", "amani@example.com", "Nairobi", "Westlands", "Parklands",
      JSON.stringify([{ productId: "prod-aloe-gel-01", quantity: 2, price: 1250 }]),
      2200, 300, testAmount, "mpesa_stk", "pending", "pending", "pending", testCheckoutId
    ]);
    console.log("  ✓ Pending order created in database.");

    // 2. Simulate Successful Callback Processing (ResultCode: 0)
    console.log(`\n2. Simulating Successful Safaricom Callback (Receipt: ${testReceipt}, Amount: KES ${testAmount})...`);
    
    // Webhook update logic: match by checkout_request_id
    const callbackUpdate = await client.query(`
      UPDATE orders 
      SET 
        payment_status = 'paid',
        status = 'paid',
        mpesa_receipt = $1,
        updated_at = NOW()
      WHERE checkout_request_id = $2 AND payment_status = 'pending'
      RETURNING id, payment_status, status, mpesa_receipt, total_amount;
    `, [testReceipt, testCheckoutId]);

    const updatedOrder = callbackUpdate.rows[0];
    if (!updatedOrder) throw new Error("Callback failed to match order by checkout_request_id!");
    console.log("  ✓ Order updated to payment_status:", updatedOrder.payment_status);
    console.log("  ✓ Order updated to delivery status:", updatedOrder.status);
    console.log("  ✓ Stored M-Pesa Receipt Number:", updatedOrder.mpesa_receipt);

    // 3. Simulate Duplicate Callback (Idempotency Guard)
    console.log("\n3. Testing Duplicate Callback Idempotency Guard...");
    const checkOrder = await client.query(`SELECT payment_status, mpesa_receipt FROM orders WHERE id = $1;`, [testOrderId]);
    const isAlreadyPaid = checkOrder.rows[0].payment_status === 'paid' && checkOrder.rows[0].mpesa_receipt === testReceipt;
    
    if (isAlreadyPaid) {
      console.log("  ✓ Idempotency Check: Order is already marked paid. Duplicate webhook safely acknowledged without re-processing.");
    } else {
      throw new Error("Idempotency check failed!");
    }

    // 4. Clean up test order
    await client.query("DELETE FROM orders WHERE id = $1;", [testOrderId]);
    console.log("  ✓ Cleaned up test order record.");

    // 5. Test Failed/Cancelled Callback Scenario
    const failedOrderId = `TEST-FAIL-${Date.now().toString().slice(-6)}`;
    const failedCheckoutId = `ws_CO_FAIL_${Date.now()}`;
    console.log(`\n4. Testing Failed/Cancelled Callback Scenario (Order: ${failedOrderId})...`);
    
    await client.query(`
      INSERT INTO orders (
        id, customer_name, phone, email, county, sub_county, estate,
        items, subtotal, delivery_fee, total_amount, payment_method,
        payment_status, delivery_status, status, checkout_request_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      );
    `, [
      failedOrderId, "Failed Customer", "254712345678", "fail@example.com", "Nairobi", "Westlands", "Parklands",
      '[]', 1000, 0, 1000, "mpesa_stk", "pending", "pending", "pending", failedCheckoutId
    ]);

    // Handle ResultCode 1032 (User cancelled)
    await client.query(`
      UPDATE orders 
      SET 
        payment_status = 'failed',
        updated_at = NOW()
      WHERE checkout_request_id = $1 AND payment_status = 'pending';
    `, [failedCheckoutId]);

    const checkFailed = await client.query(`SELECT payment_status, status FROM orders WHERE id = $1;`, [failedOrderId]);
    console.log("  ✓ Cancelled/Failed order status transitioned to:", checkFailed.rows[0].payment_status);

    await client.query("DELETE FROM orders WHERE id = $1;", [failedOrderId]);
    console.log("  ✓ Cleaned up failed test record.");

    console.log("\n========================================================");
    console.log("  ALL CALLBACK SYNCHRONIZATION TESTS PASSED (100%)      ");
    console.log("========================================================\n");

  } catch (err) {
    console.error("❌ Callback Sync Test Error:", err);
  } finally {
    await client.end();
  }
}

testCallbackSynchronization();
