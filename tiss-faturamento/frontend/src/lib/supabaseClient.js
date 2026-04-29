import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase (substitua pelos seus valores)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mxgyimemvgrwyqlevoey.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_C0XXa8IdaCM7OWiSL4RfDQ_38obh_u3';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tabelas do sistema
export const TABLES = {
  CONVENIOS: 'convenios',
  PACIENTES: 'pacientes',
  PRESTADORES: 'prestadores',
  PROCEDIMENTOS: 'procedimentos',
  ATENDIMENTOS: 'atendimentos',
  GUIAS_GERADAS: 'guias_geradas',
  GLOSAS: 'glosas',
  CONFIG_SISTEMA: 'config_sistema'
};

// Funções auxiliares
export async function createTables() {
  // SQL para criar as tabelas no Supabase (execute no SQL Editor do Supabase)
  console.log('As tabelas devem ser criadas manualmente no Supabase SQL Editor');
}
