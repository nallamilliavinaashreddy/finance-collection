import { createClient } from '@supabase/supabase-js';

const url = 'https://rioyhvzjmotxlkkiosxz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpb3lodnpqbW90eGxra2lvc3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0Nzk4NDAsImV4cCI6MjEwMTA1NTg0MH0.-vRqiEABSZW12gzxTjdDfQG8TpmO_DQuPM18h2mCrMI';

const supabase = createClient(url, key);

async function inspectColumns() {
  const { data, error } = await supabase.from('loans').select('*').limit(1);
  if (error) {
    console.error('Inspect error:', error);
  } else {
    console.log('Sample row from loans table:', data);
    if (data && data.length > 0) {
      console.log('Available columns in loans:', Object.keys(data[0]));
    }
  }
}

inspectColumns();
