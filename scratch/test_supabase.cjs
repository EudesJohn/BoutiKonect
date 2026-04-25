const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lunlteriqnostbxzfiel.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1bmx0ZXJpcW5vc3RieHpmaWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2Njg0NDEsImV4cCI6MjA5MTI0NDQ0MX0.Mazo0hb8EqQ5mcPL1qJbneIkdPW4z9IXp9KYuK7Cwis';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('Testing Supabase connection...');
  const { data, error } = await supabase.from('products').select('*').limit(1);
  if (error) {
    console.error('❌ Error fetching products:', error);
  } else {
    console.log('✅ Successfully fetched products:', data);
  }
}

test();
