import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const newEvt = {
      id: "test-event-1234",
      title: "Test Event",
      date: "TBA",
      location: "TBA",
      description: "Test Description",
      image_url: null,
      capacity: 50,
      price: 0,
      vendor_enabled: true,
      vendor_price: 2000,
      vendor_capacity: 10,
      attendee_enabled: true,
      attendee_price: 0,
      status: 'upcoming'
  };
  
  const { data, error } = await supabase.from('events').insert(newEvt);
  console.log("Error:", error);
  console.log("Data:", data);
}

testInsert();
