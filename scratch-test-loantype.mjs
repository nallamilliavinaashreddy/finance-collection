import { createClient } from '@supabase/supabase-js';

const url = 'https://rioyhvzjmotxlkkiosxz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpb3lodnpqbW90eGxra2lvc3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0Nzk4NDAsImV4cCI6MjEwMTA1NTg0MH0.-vRqiEABSZW12gzxTjdDfQG8TpmO_DQuPM18h2mCrMI';

const supabase = createClient(url, key);

async function inspectLoanTypes() {
  const { data, error } = await supabase.from('loans').select('id, customer_id, loan_type, city, created_at');
  if (error) {
    console.error('Error fetching loan_type:', error);
  } else {
    console.log('Live loans in Supabase:', data);
  }
}

inspectLoanTypes();
