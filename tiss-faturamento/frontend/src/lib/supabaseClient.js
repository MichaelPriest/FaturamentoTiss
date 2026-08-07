// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log para debug
console.log('🔧 Inicializando Supabase Client...');
console.log('📡 URL:', supabaseUrl);
console.log('🔑 Key:', supabaseAnonKey ? '✅ Configurada' : '❌ Não configurada');

// Verificar se as variáveis estão configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas!');
}

// Criar o cliente com configurações explícitas de autenticação
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: localStorage,
        storageKey: 'supabase.auth.token'
      }
    })
  : null;

// Verificar e logar o estado da autenticação
export const logAuthState = async () => {
  if (!supabase) {
    console.log('❌ Supabase não disponível');
    return;
  }
  
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('❌ Erro ao obter sessão:', error.message);
    return;
  }
  
  if (session) {
    console.log('✅ Usuário autenticado');
  } else {
    console.log('❌ Usuário NÃO autenticado - Nenhuma sessão encontrada');
  }
};

// Função para fazer login manualmente (para teste)
export const fazerLogin = async (email, password) => {
  if (!supabase) {
    throw new Error('Supabase não configurado');
  }
  
  console.log('🔐 Tentando login');
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    console.error('❌ Erro no login:', error.message);
    throw error;
  }
  
  console.log('✅ Login realizado com sucesso!');
  
  await logAuthState();
  return data;
};

// Função para fazer logout
export const fazerLogout = async () => {
  if (!supabase) return;
  
  console.log('🚪 Fazendo logout...');
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('❌ Erro no logout:', error.message);
    throw error;
  }
  
  console.log('✅ Logout realizado com sucesso!');
  await logAuthState();
};

export const TABLES = {
  CONVENIOS: 'convenios',
  PACIENTES: 'pacientes',
  PRESTADORES: 'prestadores',
  PROCEDIMENTOS: 'procedimentos',
  ATENDIMENTOS: 'atendimentos',
  GUIAS_GERADAS: 'guias_geradas',
  NOTIFICACOES: 'notificacoes',
  UNIDADES: 'unidades',
  USUARIOS: 'usuarios',
  CONFIG_SISTEMA: 'config_sistema',
  CONFIGURACOES: 'configuracoes',
  LOGS_FATURAMENTO: 'logs_faturamento',
  LOTES_FATURAMENTO: 'lotes_faturamento'
};

export const isSupabaseAvailable = () => {
  return supabase !== null;
};

export async function checkSupabaseConnection() {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from(TABLES.CONVENIOS).select('count', { count: 'exact', head: true });
    if (error) {
      console.error('❌ Erro de conexão Supabase:', error);
      return false;
    }
    console.log('✅ Supabase conectado com sucesso!');
    return true;
  } catch (err) {
    console.error('❌ Erro ao conectar Supabase:', err);
    return false;
  }
}

// Exportar cliente como default também
export default supabase;
