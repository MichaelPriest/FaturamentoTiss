import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { publicEnv } from '@/lib/validation/env';

export async function createSupabaseServerClient() {
  const store = await cookies();
  const env = publicEnv();
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) => store.set(name, value, {
            ...options, httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production'
          }));
        } catch {
          // Server Components cannot write cookies; middleware refreshes them.
        }
      }
    }
  });
}
