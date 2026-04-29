import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log para debug
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseAnonKey ? 'Configurada ✓' : 'Não configurada ✗');

// Verificar se as variáveis estão configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas!');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

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
  if (!supabase) return false;
  try {
    const { error } = await supabase.from(TABLES.CONVENIOS).select('count', { count: 'exact', head: true });
    if (error) {
      console.error('Erro de conexão Supabase:', error);
      return false;
    }
    console.log('✅ Supabase conectado com sucesso!');
    return true;
  } catch (err) {
    console.error('Erro ao conectar Supabase:', err);
    return false;
  }
}
