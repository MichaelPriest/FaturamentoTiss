import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Verificar se as variáveis estão configuradas
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const TABLES = {
  CONVENIOS: 'convenios',
  PACIENTES: 'pacientes',
  PRESTADORES: 'prestadores',
  PROCEDIMENTOS: 'procedimentos',
  ATENDIMENTOS: 'atendimentos',
  GUIAS_GERADAS: 'guias_geradas',
  GLOSAS: 'glosas',
  NOTIFICACOES: 'notificacoes',
  CONFIG_SISTEMA: 'config_sistema'
};

export const isSupabaseAvailable = () => {
  return supabase !== null;
};

// Função para verificar conexão
export async function checkSupabaseConnection() {
  if (!isSupabaseAvailable()) return false;
  try {
    const { error } = await supabase.from(TABLES.CONVENIOS).select('count', { count: 'exact', head: true });
    return !error;
  } catch {
    return false;
  }
}
