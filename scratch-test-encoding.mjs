import { createClient } from '@supabase/supabase-js';

const url = 'https://rioyhvzjmotxlkkiosxz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpb3lodnpqbW90eGxra2lvc3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0Nzk4NDAsImV4cCI6MjEwMTA1NTg0MH0.-vRqiEABSZW12gzxTjdDfQG8TpmO_DQuPM18h2mCrMI';

const supabase = createClient(url, key);

export function decodeLoanType(workingDaysRaw, storedType) {
  if (storedType && storedType !== 'daily') return storedType;
  const w = Number(workingDaysRaw || 100);
  if (w >= 7000 && w < 8000) return 'weekly';
  if (w >= 8000 && w < 9000) return 'monthly';
  if (w >= 9000) return 'adjustment';
  return 'daily';
}

export function encodeWorkingDays(loanType, workingDays, totalWeeks, totalMonths) {
  if (loanType === 'weekly') return 7000 + (Number(totalWeeks) || 10);
  if (loanType === 'monthly') return 8000 + (Number(totalMonths) || 6);
  if (loanType === 'adjustment') return 9001;
  return Number(workingDays) || 100;
}

async function testEncoding() {
  console.log('Testing encoding & decoding logic...');

  console.log('Daily (100 days):', decodeLoanType(100)); // daily
  console.log('Weekly (10 weeks):', decodeLoanType(7010)); // weekly
  console.log('Monthly (6 months):', decodeLoanType(8006)); // monthly
  console.log('Adjustment:', decodeLoanType(9001)); // adjustment
}

testEncoding();
