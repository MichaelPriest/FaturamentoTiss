import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase (substitua pelos seus valores)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://seu-projeto.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sua-chave-anon';

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
