const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testStorage() {
  console.log("Testing upload to vehicle-images...");
  
  const buffer = Buffer.from("Hello World", "utf-8");

  const { data, error } = await supabase.storage
    .from('vehicle-images')
    .upload('test/hello.txt', buffer, {
        upsert: true,
        contentType: 'text/plain'
    });

  if (error) {
    console.error("Storage Upload Error:", error);
  } else {
    console.log("Storage Upload Success!", data);
  }
}

testStorage();
