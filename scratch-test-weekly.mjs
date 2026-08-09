import { createClient } from '@supabase/supabase-js';

const url = 'https://rioyhvzjmotxlkkiosxz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpb3lodnpqbW90eGxra2lvc3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0Nzk4NDAsImV4cCI6MjEwMTA1NTg0MH0.-vRqiEABSZW12gzxTjdDfQG8TpmO_DQuPM18h2mCrMI';

const supabase = createClient(url, key);

const loanCandidates = [
  'city',
  'place',
  'location',
  'loan_type',
  'frequency',
  'total_weeks',
  'working_weeks',
  'weeks',
  'weekly_amount',
  'amount_per_week'
];

async function checkWeeklyCols() {
  console.log('Testing weekly candidate columns on loans table...');
  const valid = [];
  for (const col of loanCandidates) {
    const { error } = await supabase.from('loans').select(col).limit(1);
    if (!error) valid.push(col);
  }
  console.log('Valid weekly columns on loans:', valid);
}

checkWeeklyCols();
