import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase - substitua pelos seus valores reais
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Verificar se as variáveis estão configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Variáveis de ambiente do Supabase não configuradas. ' +
    'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.local'
  );
}

// Criar cliente Supabase apenas se as credenciais existirem
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

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

// Função para verificar se Supabase está disponível
export const isSupabaseAvailable = () => {
  return supabase !== null;
};

// Função para migrar dados do localStorage para Supabase
export async function migrateFromLocalStorage() {
  if (!isSupabaseAvailable()) {
    console.warn('Supabase não disponível para migração');
    return false;
  }

  const tables = [
    { name: 'convenios', key: 'convenios' },
    { name: 'pacientes', key: 'pacientes' },
    { name: 'prestadores', key: 'prestadores' },
    { name: 'procedimentos', key: 'procedimentos' },
    { name: 'atendimentos', key: 'atendimentos' },
  ];

  for (const table of tables) {
    const localData = localStorage.getItem(table.key);
    if (localData) {
      const data = JSON.parse(localData);
      if (data.length > 0) {
        const { error } = await supabase
          .from(table.name)
          .upsert(data, { onConflict: 'id' });
        
        if (error) {
          console.error(`Erro ao migrar ${table.name}:`, error);
        } else {
          console.log(`✅ Migrados ${data.length} registros para ${table.name}`);
        }
      }
    }
  }
  return true;
}
