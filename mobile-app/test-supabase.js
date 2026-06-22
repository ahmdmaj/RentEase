const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log("Checking vehicles and images...");
  const { data, error } = await supabase
    .from('vehicles')
    .select('*, profiles(full_name), vehicle_images(image_url)')
    .eq('is_available', true);

  if (error) {
    console.error("Query Error:", error);
  } else {
    console.log("Data:", JSON.stringify(data, null, 2));
  }
}

checkData();
