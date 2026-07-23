const { Client } = require('pg');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const dbUrlMatch = env.match(/DATABASE_URL="(.*)"/);
if (!dbUrlMatch) throw new Error("No db url");
const client = new Client({ connectionString: dbUrlMatch[1] });
client.connect().then(async () => {
  const data = [
    { category: 'Getting Started', question: 'What is Aloe Flora Products?', answer: 'Aloe Flora Products is a Kenyan organic brand dedicated to transforming locally sourced botanicals like aloe vera, honey, and Kenyan coffee into premium wellness and beauty products.' },
    { category: 'Getting Started', question: 'How does it work?', answer: 'You can browse our catalog, select products that suit your skin or hair type, and place an order. We manufacture in small batches for freshness and deliver nationwide.' },
    { category: 'Getting Started', question: 'Is an account required?', answer: 'No, you can check out as a guest. However, creating an account lets you track your orders, manage returns, and earn loyalty points.' },
    { category: 'Products', question: 'Are your products 100% organic?', answer: 'Yes! We strictly use certified organic ingredients sourced from local Kenyan farmers. We never use harsh synthetic chemicals.' },
    { category: 'Products', question: 'How do I know my skin/hair type?', answer: 'We offer an AI-powered personalized consultation. Click on the \'Consult AI\' button in the dashboard to get recommendations tailored to you.' },
    { category: 'Products', question: 'What if an item is out of stock?', answer: 'Because we manufacture in small batches, items can sell out quickly. You can sign up for restock notifications on the product page.' },
    { category: 'Products', question: 'Are the products safe for sensitive skin?', answer: 'Yes, our formulations emphasize natural soothing ingredients like Aloe Vera and honey, making them ideal for sensitive skin. However, always patch-test new products.' },
    { category: 'Orders', question: 'How do I place an order?', answer: 'Simply add items to your cart and proceed to checkout. You will need to provide your delivery details and choose a payment method (M-Pesa).' },
    { category: 'Orders', question: 'Can I modify my order?', answer: 'If your order has not been dispatched yet, you can modify it by contacting support immediately. Once dispatched, modifications cannot be made.' },
    { category: 'Orders', question: 'Can I cancel my order?', answer: 'Yes, you can cancel your order within 12 hours of placing it via your User Dashboard. After 12 hours, the order enters production and cannot be cancelled.' },
    { category: 'Orders', question: 'How do I check my order status?', answer: 'Log into your account and navigate to the \'Dashboard\'. Under the \'My Orders\' section, you can see real-time updates and track your delivery timeline.' },
    { category: 'Payments', question: 'Which payment methods are accepted?', answer: 'We currently accept M-Pesa (via STK Push or Paybill). Your payment is securely processed through Daraja API.' },
    { category: 'Payments', question: 'Is my payment secure?', answer: 'Absolutely. We do not store your financial details. All M-Pesa transactions are encrypted and processed directly by Safaricom.' },
    { category: 'Payments', question: 'When will I be charged?', answer: 'You will be charged immediately upon confirming your order during checkout via the M-Pesa prompt.' },
    { category: 'Shipping & Delivery', question: 'Where do you deliver?', answer: 'We deliver nationwide across Kenya via reliable courier partners. We also offer local delivery in Nairobi.' },
    { category: 'Shipping & Delivery', question: 'How long does shipping take?', answer: 'Standard delivery typically takes 1-2 business days within Nairobi and 2-4 business days for the rest of Kenya.' },
    { category: 'Shipping & Delivery', question: 'How much does shipping cost?', answer: 'Shipping is a flat rate of KES 300 nationwide. Orders above KES 3,000 qualify for free standard delivery!' },
    { category: 'Shipping & Delivery', question: 'Can I track my order?', answer: 'Yes! Once dispatched, you can view your order timeline in the User Dashboard to see its exact status.' },
    { category: 'Returns & Refunds', question: 'What is your return policy?', answer: 'We accept returns for damaged or incorrect items within 7 days of delivery. The products must be unused and in their original packaging.' },
    { category: 'Returns & Refunds', question: 'How do I request a return?', answer: 'Log into your Dashboard, locate the order under \'My Orders\', and click \'Request Return\'. You will need to provide a reason and upload a photo.' },
    { category: 'Returns & Refunds', question: 'When will I receive my refund?', answer: 'Once we receive and inspect the returned item, approved refunds are processed back to your M-Pesa number within 3-5 business days.' },
    { category: 'Discounts & Promotions', question: 'How do promo codes work?', answer: 'Enter your promo code at checkout in the \'Promo Code\' field and click \'Apply\'. The discount will be reflected in your final total.' },
    { category: 'Discounts & Promotions', question: 'Can I combine discounts?', answer: 'Generally, only one promo code can be used per order unless specified otherwise during a special promotion.' },
    { category: 'Discounts & Promotions', question: 'Do promotions expire?', answer: 'Yes, all our promo codes have an expiration date. Please check the terms of the specific promotion you are trying to use.' }
  ];
  await client.query("DELETE FROM cms_posts WHERE type = 'faq'");
  for (let d of data) {
    await client.query("INSERT INTO cms_posts (id, title, content, type, status, author, seo_title, created_at) VALUES (gen_random_uuid(), $1, $2, 'faq', 'published', 'System Admin', $3, NOW())", [d.question, d.answer, d.category]);
  }
  console.log('Successfully seeded FAQs');
  client.end();
}).catch(console.error);
