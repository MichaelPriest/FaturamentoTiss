'use server';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { loginSchema } from './schemas';
export type AuthState={error?:string};
export async function signIn(_:AuthState,formData:FormData):Promise<AuthState>{const parsed=loginSchema.safeParse({email:formData.get('email'),password:formData.get('password')});if(!parsed.success)return{error:parsed.error.issues[0]?.message};const supabase=await createSupabaseServerClient();const{error}=await supabase.auth.signInWithPassword(parsed.data);if(error)return{error:'Não foi possível entrar. Verifique as credenciais ou procure o administrador.'};redirect('/dashboard');}
export async function signOut(){const supabase=await createSupabaseServerClient();await supabase.auth.signOut();redirect('/login');}
export async function requestPasswordReset(formData:FormData){const email=String(formData.get('email')||'');const parsed=loginSchema.shape.email.safeParse(email);if(!parsed.success)return;const supabase=await createSupabaseServerClient();await supabase.auth.resetPasswordForEmail(parsed.data,{redirectTo:`${process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000'}/auth/callback?next=/dashboard`});}
