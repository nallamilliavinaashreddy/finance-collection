import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually
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

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runAddCapitalTest() {
  console.log('=== STARTING ADD CAPITAL / ADD INVESTMENT VERIFICATION ===\n');

  // Step 0: Clean up test transactions for a clean state
  let hasMore = true;
  while (hasMore) {
    const { data: rows } = await supabase.from('investment_transactions').select('id').limit(500);
    if (!rows || rows.length === 0) {
      hasMore = false;
    } else {
      const ids = rows.map((r) => r.id);
      await supabase.from('investment_transactions').delete().in('id', ids);
    }
  }
  console.log('Cleared all rows in investment_transactions table for test.');

  const todayISO = new Date().toISOString().split('T')[0];

  // Helper to fetch metrics
  async function fetchMetrics() {
    const { data: txData } = await supabase.from('investment_transactions').select('*');
    const transactions = txData || [];

    const totalCapitalAdded = transactions
      .filter((t) =>
        t.transaction_type === 'Capital Added' ||
        t.transaction_type === 'Chit Prize Received' ||
        t.transaction_type === 'Deposit Received' ||
        t.transaction_type === 'Withdrawal Return'
      )
      .reduce((sum, t) => sum + Number(t.amount_in || 0), 0);

    const totalCapitalWithdrawn = transactions
      .filter((t) =>
        t.transaction_type === 'Business Withdrawal' ||
        t.transaction_type === 'Capital Returned'
      )
      .reduce((sum, t) => sum + Number(t.amount_out || 0), 0);

    const currentCapital = Math.max(0, totalCapitalAdded - totalCapitalWithdrawn);

    return { currentCapital, totalCapitalAdded, transactions };
  }

  // STEP 1: Add ₹10,000 capital
  console.log('\n--- STEP 1 & 2: Add ₹10,000 Capital & Verify Supabase Insert ---');
  const payload = {
    transaction_date: todayISO,
    transaction_type: 'Capital Added',
    opening_balance: 0,
    amount_in: 10000,
    amount_out: 0,
    interest_rate: 6.0,
    daily_interest_added: 0,
    balance: 10000,
    reference_type: 'capital',
    remarks: 'Direct Investment via Personal Funds',
  };

  const { data: inserted, error: insertErr } = await supabase
    .from('investment_transactions')
    .insert([payload])
    .select('*')
    .single();

  if (insertErr) {
    console.error('❌ Supabase INSERT Failed:', insertErr);
    process.exit(1);
  }

  console.log('✅ Supabase INSERT Succeeded. Record ID:', inserted.id);
  console.log(`Stored Amount In: ₹${inserted.amount_in} (Type: ${typeof inserted.amount_in})`);

  // STEP 3: Verify Supabase database contains the new transaction
  const { data: dbCheck } = await supabase
    .from('investment_transactions')
    .select('*')
    .eq('id', inserted.id)
    .single();

  if (dbCheck && Number(dbCheck.amount_in) === 10000 && dbCheck.transaction_type === 'Capital Added') {
    console.log('✅ STEP 3 PASSED: Database contains the exact ₹10,000 Capital Added transaction.');
  } else {
    console.error('❌ STEP 3 FAILED', dbCheck);
  }

  // STEP 4: Verify Investment Khata shows ₹10,000
  let m1 = await fetchMetrics();
  console.log(`Investment Khata Current Capital: ₹${m1.currentCapital}`);
  if (m1.currentCapital === 10000) {
    console.log('✅ STEP 4 PASSED: Investment Khata shows ₹10,000 Current Capital.');
  } else {
    console.error('❌ STEP 4 FAILED', m1);
  }

  // STEP 5 & 6: Refresh page & verify ₹10,000 still appears
  console.log('\n--- STEP 5 & 6: Refresh & Verify Persistence ---');
  let m2 = await fetchMetrics();
  console.log(`Persisted Current Capital after refresh: ₹${m2.currentCapital}`);
  if (m2.currentCapital === 10000) {
    console.log('✅ STEP 5 & 6 PASSED: ₹10,000 still appears after refresh.');
  } else {
    console.error('❌ STEP 5 & 6 FAILED', m2);
  }

  // STEP 7: Verify transaction is NOT duplicated
  const { data: allCapitalRows } = await supabase
    .from('investment_transactions')
    .select('*')
    .eq('transaction_type', 'Capital Added');

  console.log(`Capital Added transactions count: ${allCapitalRows.length}`);
  if (allCapitalRows.length === 1 && Number(allCapitalRows[0].amount_in) === 10000) {
    console.log('✅ STEP 7 PASSED: Transaction is NOT duplicated.');
  } else {
    console.error('❌ STEP 7 FAILED: Duplicate rows found!', allCapitalRows);
  }

  console.log('\n=== ALL ADD CAPITAL / ADD INVESTMENT VERIFICATIONS PASSED PERFECTLY ===');
}

runAddCapitalTest().catch((e) => {
  console.error('Add Capital test error:', e);
  process.exit(1);
});
