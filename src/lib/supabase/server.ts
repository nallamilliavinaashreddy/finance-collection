import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://rioyhvzjmotxlkkiosxz.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpb3lodnpqbW90eGxra2lvc3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0Nzk4NDAsImV4cCI6MjEwMTA1NTg0MH0.-vRqiEABSZW12gzxTjdDfQG8TpmO_DQuPM18h2mCrMI';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Handled in middleware when called from Server Component
        }
      },
    },
  });
}
