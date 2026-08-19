const { Client } = require('pg');
const connectionString = "postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";

async function testOrderCreationValidation() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("========================================================");
    console.log("  ALOEFLORA ORDER CREATION & LINKING VALIDATION TEST    ");
    console.log("========================================================\n");

    const testOrderId = `TEST-ORD-${Date.now().toString().slice(-6)}`;
    const testItems = [
      { productId: "prod-aloe-gel-01", productName: "Organic Aloe Vera Gel", quantity: 2, price: 1200, selectedVariant: "250ml" },
      { productId: "prod-soap-02", productName: "Natural Aloe Facial Cleanser", quantity: 1, price: 850, selectedVariant: "Standard" }
    ];
    const subtotal = 3250;
    const deliveryFee = 300;
    const totalAmount = 3550;

    console.log(`1. Testing Pre-Payment Order Insertion for ID: ${testOrderId}...`);
    const insertRes = await client.query(`
      INSERT INTO orders (
        id, customer_name, phone, email, county, sub_county, estate, 
        items, subtotal, delivery_fee, total_amount, payment_method, 
        payment_status, delivery_status, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      ) RETURNING id, status, payment_status, total_amount, items;
    `, [
      testOrderId,
      "Amani Wanjiku",
      "254712345678",
      "amani@example.com",
      "Nairobi",
      "Westlands",
      "Parklands Avenue",
      JSON.stringify(testItems),
      subtotal,
      deliveryFee,
      totalAmount,
      "mpesa_stk",
      "pending",
      "pending",
      "pending"
    ]);

    const createdOrder = insertRes.rows[0];
    console.log("  ✓ Order created successfully before STK push dispatch");
    console.log("  ✓ Assigned unique ID:", createdOrder.id);
    console.log("  ✓ Initial Payment Status:", createdOrder.payment_status);
    console.log("  ✓ Initial Delivery Status:", createdOrder.status);
    console.log("  ✓ Exact Total Stored: KES", createdOrder.total_amount);

    if (createdOrder.payment_status !== "pending") throw new Error("Expected initial payment_status to be pending");
    if (Number(createdOrder.total_amount) !== totalAmount) throw new Error("Total amount mismatch");
    if (createdOrder.items.length !== 2) throw new Error("Items array length mismatch");

    // 2. Duplicate Prevention Test
    console.log("\n2. Testing Primary Key Duplicate Order Prevention...");
    let duplicateRejected = false;
    try {
      await client.query(`
        INSERT INTO orders (
          id, customer_name, phone, email, county, sub_county, estate, 
          items, subtotal, delivery_fee, total_amount, payment_method, 
          payment_status, delivery_status, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        );
      `, [
        testOrderId,
        "Duplicate Order Attempt",
        "254712345678",
        "duplicate@example.com",
        "Nairobi",
        "Westlands",
        "Parklands Avenue",
        JSON.stringify(testItems),
        subtotal,
        deliveryFee,
        totalAmount,
        "mpesa_stk",
        "pending",
        "pending",
        "pending"
      ]);
    } catch (dupErr) {
      if (dupErr.code === '23505') {
        duplicateRejected = true;
        console.log(`  ✓ Database engine strictly rejected duplicate order ID: ${dupErr.message} (Code: 23505)`);
      }
    }
    if (!duplicateRejected) throw new Error("Duplicate order ID was not rejected!");

    // Clean up test order
    await client.query("DELETE FROM orders WHERE id = $1;", [testOrderId]);
    console.log("  ✓ Test order cleaned up successfully");

    console.log("\n========================================================");
    console.log("  ALL ORDER CREATION VALIDATION CHECKS PASSED (100%)    ");
    console.log("========================================================");

  } catch (err) {
    console.error("❌ Order Creation Test Error:", err);
  } finally {
    await client.end();
  }
}

testOrderCreationValidation();
