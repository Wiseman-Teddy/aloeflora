const { Client } = require('pg');
const connectionString = "postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";

async function stressTestDatabaseConcurrency() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("=== PHASE 12: CONCURRENT DATABASE STRESS TEST ===");

    const concurrentRequests = 20;
    console.log(`Simulating ${concurrentRequests} concurrent status and receipt lookups...`);

    const startTime = Date.now();
    const promises = [];

    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        client.query(`
          SELECT id, payment_status, mpesa_receipt, total_amount 
          FROM orders 
          ORDER BY created_at DESC 
          LIMIT 10;
        `)
      );
    }

    const results = await Promise.all(promises);
    const totalDuration = Date.now() - startTime;
    const avgLatency = (totalDuration / concurrentRequests).toFixed(2);

    console.log(`\n✓ Concurrency Test Completed: ${results.length}/${concurrentRequests} queries succeeded`);
    console.log(` - Total Duration for 20 parallel queries: ${totalDuration}ms`);
    console.log(` - Average Query Latency: ${avgLatency}ms per request`);
    console.log(` - Throughput: ${(concurrentRequests / (totalDuration / 1000)).toFixed(1)} reqs/sec`);

  } catch (err) {
    console.error("Stress Test Error:", err);
  } finally {
    await client.end();
  }
}

stressTestDatabaseConcurrency();
