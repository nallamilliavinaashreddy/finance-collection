import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://rioyhvzjmotxlkkiosxz.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpb3lodnpqbW90eGxra2lvc3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0Nzk4NDAsImV4cCI6MjEwMTA1NTg0MH0.-vRqiEABSZW12gzxTjdDfQG8TpmO_DQuPM18h2mCrMI';

// Create a universal Supabase client instance for browser & server execution
let supabaseInstance: any = null;

export function createClient() {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient<any>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: typeof window !== 'undefined',
        autoRefreshToken: typeof window !== 'undefined',
      },
    });
  }
  return supabaseInstance;
}
