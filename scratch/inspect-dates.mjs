import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach((line) => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectRows() {
  const { data, error } = await supabase
    .from('investment_transactions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching rows:', error);
    return;
  }

  console.log(`Total rows in database: ${data.length}`);
  data.forEach((r) => {
    console.log(`ID: ${r.id} | Type: ${r.transaction_type} | Date: ${r.transaction_date} | In: ${r.amount_in} | Out: ${r.amount_out} | Interest: ${r.daily_interest_added} | Ref: ${r.reference_type}/${r.reference_id} | CreatedAt: ${r.created_at}`);
  });
}

inspectRows();
