import { createClient } from '@supabase/supabase-js';

// Substitua pelos seus valores reais
const supabaseUrl = 'https://mxgyimemvgrwyqlevoey.supabase.co';
const supabaseAnonKey = 'sua-chave-anon-aqui'; // COLE SUA CHAVE ANÔNIMA AQUI

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const TABLES = {
  CONVENIOS: 'convenios',
  PACIENTES: 'pacientes',
  PRESTADORES: 'prestadores',
  PROCEDIMENTOS: 'procedimentos',
  ATENDIMENTOS: 'atendimentos',
  GUIAS_GERADAS: 'guias_geradas',
  NOTIFICACOES: 'notificacoes',
  CONFIG_SISTEMA: 'config_sistema'
};

export const isSupabaseAvailable = () => {
  return supabase !== null;
};

export async function checkSupabaseConnection() {
  try {
    const { error } = await supabase.from(TABLES.CONVENIOS).select('count', { count: 'exact', head: true });
    return !error;
  } catch {
    return false;
  }
}
