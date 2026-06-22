const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const vehicleId = "af03fd72-6057-497f-9c86-0af8a93caa09"; // Toyota CHR
  console.log("Testing insert to vehicle_images...");
  
  const { data, error } = await supabase
    .from('vehicle_images')
    .insert({
        vehicle_id: vehicleId,
        image_url: "https://example.com/test.jpg",
        display_order: 0,
    });

  if (error) {
    console.error("Insert Error:", error);
  } else {
    console.log("Insert Success!", data);
  }
}

testInsert();
