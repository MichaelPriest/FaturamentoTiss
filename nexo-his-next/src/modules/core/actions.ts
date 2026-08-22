'use server';
import { redirect } from 'next/navigation';import { z } from 'zod';import { createSupabaseServerClient } from '@/lib/supabase/server';
const schema=z.object({nome:z.string().trim().min(3),empresa:z.string().trim().min(3),unidade:z.string().trim().min(3)});
export async function bootstrapFoundation(formData:FormData){const input=schema.safeParse({nome:formData.get('nome'),empresa:formData.get('empresa'),unidade:formData.get('unidade')});if(!input.success)redirect('/dashboard?bootstrap=invalid');const supabase=await createSupabaseServerClient();const{error}=await supabase.rpc('bootstrap_primeiro_admin',{p_nome:input.data.nome,p_empresa:input.data.empresa,p_unidade:input.data.unidade});if(error)redirect('/dashboard?bootstrap=failed');redirect('/dashboard');}
