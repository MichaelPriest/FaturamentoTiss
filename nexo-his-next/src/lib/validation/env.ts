import { z } from 'zod';
const publicSchema=z.object({NEXT_PUBLIC_SUPABASE_URL:z.string().url(),NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:z.string().min(20),NEXT_PUBLIC_APP_ENV:z.enum(['development','preview','production']).default('development')});
export function publicEnv(){return publicSchema.parse({NEXT_PUBLIC_SUPABASE_URL:process.env.NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,NEXT_PUBLIC_APP_ENV:process.env.NEXT_PUBLIC_APP_ENV});}
