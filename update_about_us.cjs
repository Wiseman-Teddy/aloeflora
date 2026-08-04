const { Client } = require('pg');
require('dotenv').config();

async function updateAboutUs() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  await client.connect();

  const content = `Mission Statement:
At Aloe Flora Product Limited, we are committed to manufacturing high-quality, eco-friendly cleaning detergents and hair care as well as body care products that enhance everyday hygiene and well-being. We aim to combine innovation with nature’s finest ingredients to deliver safe, effective, and sustainable solutions for homes and businesses.

Vision Statement:
To be a leading manufacturer of premium, nature-inspired hygiene and personal care products, setting the standard for quality, sustainability, and customer satisfaction across the industry.

Our Story:
Growing up in a large family in Kenya, our founder Doris Obondo experienced firsthand how poverty can make personal hygiene difficult, with simple necessities like soap often being inaccessible. Instead of allowing these early challenges to discourage her, they became the foundation and inspiration for Aloe Flora Products.

Driven by a strong desire to create affordable, high-quality products that could help families maintain proper hygiene and skincare, Doris established Aloe Flora Products to transform everyday local resources into products that improve people's lives.

We specialize in crafting bath, beauty, and wellness products out of locally sourced botanicals like aloe vera, honey, and turmeric. Recognizing that Kenya is globally known for its high-quality coffee, we proudly integrate coffee value-addition into our formulations, moving beyond raw exports. Our unique line of coffee-based products—including soaps, scrubs, shower gels, and even candles—leverages the antioxidant and exfoliating properties of coffee. 

From nourishing hair and body care essentials to home care formulations, our mission is to make wellness and hygiene accessible to all, while creating economic value and empowering local women and youth through skills transfer and manufacturing.`;

  try {
    const res = await client.query(`SELECT id FROM cms_posts WHERE type = 'about' AND status = 'published' LIMIT 1`);
    
    if (res.rows.length > 0) {
      console.log("Updating existing about us post ID:", res.rows[0].id);
      await client.query(`UPDATE cms_posts SET title = $1, content = $2 WHERE id = $3`, [
        'Our Story: Aloe Flora Products',
        content,
        res.rows[0].id
      ]);
      console.log("Updated successfully!");
    } else {
      console.log("No existing about us post found. Inserting a new one...");
      await client.query(
        `INSERT INTO cms_posts (id, title, content, type, status, image_url, author) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          'cms-about-' + Date.now(),
          'Our Story: Aloe Flora Products',
          content,
          'about',
          'published',
          'https://images.unsplash.com/photo-1611078732168-9cd5932ea4ce',
          'System Admin'
        ]
      );
      console.log("Inserted successfully!");
    }
  } catch (err) {
    console.error("Database error:", err);
  } finally {
    await client.end();
  }
}

updateAboutUs();
