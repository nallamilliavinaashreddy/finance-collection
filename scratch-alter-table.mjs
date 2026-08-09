import { createClient } from '@supabase/supabase-js';

const url = 'https://rioyhvzjmotxlkkiosxz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpb3lodnpqbW90eGxra2lvc3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0Nzk4NDAsImV4cCI6MjEwMTA1NTg0MH0.-vRqiEABSZW12gzxTjdDfQG8TpmO_DQuPM18h2mCrMI';

const supabase = createClient(url, key);

async function testAlter() {
  console.log('Testing RPC or SQL execution on Supabase...');
  // Check if rpc executes
  const { data, error } = await supabase.rpc('exec_sql', { sql: 'ALTER TABLE loans ADD COLUMN IF NOT EXISTS loan_type TEXT;' });
  console.log('RPC result:', data, error);
}

testAlter();
