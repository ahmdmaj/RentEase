const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBuckets() {
  console.log("Checking storage buckets...");
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error("List Buckets Error:", error);
  } else {
    console.log("Buckets:", data.map(b => b.name));
  }
}

checkBuckets();
