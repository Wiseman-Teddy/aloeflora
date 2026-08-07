const { Client } = require('pg');

const connectionString = "postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

const client = new Client({ connectionString });

async function syncHeroPostsToSupabase() {
  try {
    console.log("Connecting to Supabase PostgreSQL database via connection string...");
    await client.connect();

    // Define Hero Slide Entries matching our 3 background images
    const heroSlides = [
      {
        id: "hero-banner-1",
        title: "Naturally Better Living Starts Here",
        content: "Discover high-quality, affordable products crafted with care for your home and everyday wellness. From Home Care, Body Care, and Skin Care to Premium Coffee Products.",
        type: "hero",
        status: "published",
        author: "ALOEFLORA Admin",
        image_url: "/banner hero images flater/Hero Banner 1..jpeg"
      },
      {
        id: "hero-banner-2",
        title: "Nourish Your Body With Botanical Care",
        content: "Experience deep hydration and skin radiance with our hand-crafted Body Butters, Shower Gels, and Organic Face Serums. Formulated with fresh aloe vera and natural essential oils.",
        type: "hero",
        status: "published",
        author: "ALOEFLORA Admin",
        image_url: "/banner hero images flater/Hero Banner 2..jpeg"
      },
      {
        id: "hero-banner-3",
        title: "Sparkling Clean Home Safe For Your Family",
        content: "Keep your living spaces pristine and hygienic with our high-efficacy Toilet Cleaner, Bleach for White Surfaces, and Antiseptic Handwash.",
        type: "hero",
        status: "published",
        author: "ALOEFLORA Admin",
        image_url: "/banner hero images flater/Hero Banner 3..jpeg"
      }
    ];

    for (const slide of heroSlides) {
      await client.query(`
        INSERT INTO cms_posts (id, title, content, type, status, author, image_url, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (id) 
        DO UPDATE SET 
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          type = EXCLUDED.type,
          status = EXCLUDED.status,
          author = EXCLUDED.author,
          image_url = EXCLUDED.image_url;
      `, [slide.id, slide.title, slide.content, slide.type, slide.status, slide.author, slide.image_url]);
      console.log(`Synced Hero Slide: "${slide.title}" to Supabase.`);
    }

    const { rows } = await client.query("SELECT id, title, type, status, image_url FROM cms_posts WHERE type = 'hero';");
    console.log("\nActive Hero Slides in Supabase cms_posts table:");
    console.table(rows);

    console.log("\nSupabase updated successfully via connection string!");

  } catch (err) {
    console.error("Error updating Supabase:", err);
  } finally {
    await client.end();
  }
}

syncHeroPostsToSupabase();
