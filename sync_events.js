import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncEvents() {
  console.log("Fetching promotions from cms_posts...");
  const { data: posts, error: postsErr } = await supabase.from('cms_posts').select('*').eq('type', 'promotion');
  if (postsErr) {
      console.error("Error fetching posts:", postsErr);
      return;
  }
  
  console.log(`Found ${posts.length} promotions. Syncing to events table...`);
  
  for (const post of posts) {
      const { data: existing, error: checkErr } = await supabase.from('events').select('id').eq('id', post.id).single();
      
      if (!existing) {
          console.log(`Event ${post.id} not found in events table. Inserting...`);
          const newEvt = {
            id: post.id,
            title: post.title,
            date: post.seo_title || "TBA",
            location: post.seo_desc || "TBA",
            description: post.content,
            image_url: post.image_url || null,
            capacity: parseInt(post.seo_keywords || "50") || 50,
            price: 0,
            vendor_enabled: true,
            vendor_price: 2000,
            vendor_capacity: 10,
            attendee_enabled: true,
            attendee_price: 0,
            status: 'upcoming'
         };
         
         const { error: insErr } = await supabase.from('events').insert(newEvt);
         if (insErr) {
             console.error(`Failed to insert event ${post.id}:`, insErr);
         } else {
             console.log(`Successfully synced event ${post.id}`);
         }
      } else {
          console.log(`Event ${post.id} already exists in events table. Skipping.`);
      }
  }
  
  console.log("Sync complete.");
}

syncEvents();
