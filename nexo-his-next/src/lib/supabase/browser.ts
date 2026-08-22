'use client';
import { createBrowserClient } from '@supabase/ssr';
import { publicEnv } from '@/lib/validation/env';
let client:ReturnType<typeof createBrowserClient>|undefined;
export function createSupabaseBrowserClient(){const env=publicEnv();client??=createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL,env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);return client;}
