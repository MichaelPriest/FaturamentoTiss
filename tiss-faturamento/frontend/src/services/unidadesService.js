// services/unidadesService.js
import { supabase, TABLES, isSupabaseAvailable, logAuthState } from '../lib/supabaseClient';

export const UNIDADE_STORAGE_KEY = 'unidade_atual_id';
export const TODAS_UNIDADES_ID = 'todas';

// Função para garantir que o Supabase está disponível
const ensureSupabase = () => {
  if (!isSupabaseAvailable()) {
    throw new Error('Supabase não configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  }
};

// Função para verificar autenticação e obter sessão
const ensureAuth = async () => {
  ensureSupabase();
  
  console.log('🔍 [unidadesService] Verificando autenticação...');
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ [unidadesService] Erro ao verificar sessão:', error);
      throw new Error(`Erro de autenticação: ${error.message}`);
    }
    
    if (!session) {
      console.error('❌ [unidadesService] Nenhuma sessão encontrada!');
      
      throw new Error('Usuário não autenticado. Faça login novamente.');
    }
    
    return session;
  } catch (error) {
    console.error('❌ [unidadesService] Erro crítico na autenticação:', error);
    throw error;
  }
};

// Função para validar os dados da unidade antes de enviar
const validarUnidade = (unidade, isUpdate = false) => {
  const errors = [];
  
  if (!isUpdate && !unidade.nome?.trim()) {
    errors.push('Nome da unidade é obrigatório');
  }
  
  if (unidade.cnpj && unidade.cnpj.trim()) {
    const cnpjLimpo = unidade.cnpj.replace(/[^\d]/g, '');
    if (cnpjLimpo.length !== 11 && cnpjLimpo.length !== 14) {
      errors.push('CNPJ/CPF inválido');
    }
  }
  
  if (unidade.email && unidade.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(unidade.email)) {
      errors.push('E-mail inválido');
    }
  }
  
  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }
  
  return true;
};

export const getStoredUnidadeId = () => {
  return localStorage.getItem(UNIDADE_STORAGE_KEY) || TODAS_UNIDADES_ID;
};

export const setStoredUnidadeId = (unidadeId) => {
  localStorage.setItem(UNIDADE_STORAGE_KEY, unidadeId || TODAS_UNIDADES_ID);
  console.log('📌 [unidadesService] Unidade selecionada:', unidadeId || TODAS_UNIDADES_ID);
};

export const isTodasUnidades = (unidadeId = getStoredUnidadeId()) => {
  return !unidadeId || unidadeId === TODAS_UNIDADES_ID;
};

export const filterByUnidade = (items = [], unidadeId = getStoredUnidadeId()) => {
  if (isTodasUnidades(unidadeId)) return items;
  return items.filter((item) => !Object.prototype.hasOwnProperty.call(item, 'unidade_id') || item.unidade_id === unidadeId);
};


export const scopeQueryByUnidade = (query, unidadeId = getStoredUnidadeId(), { includeNull = true } = {}) => {
  if (isTodasUnidades(unidadeId)) return query;
  return includeNull
    ? query.or(`unidade_id.eq.${unidadeId},unidade_id.is.null`)
    : query.eq('unidade_id', unidadeId);
};

export const applyUnidadeToPayload = (payload = {}, unidadeId = getStoredUnidadeId()) => {
  if (isTodasUnidades(unidadeId) || payload.unidade_id) return payload;
  return { ...payload, unidade_id: unidadeId };
};

export const unidadesService = {
  /**
   * Listar todas as unidades
   * @param {Object} options - Opções de filtro
   * @param {boolean} options.somenteAtivas - Se true, retorna apenas unidades ativas
   * @returns {Promise<Array>} Lista de unidades
   */
  async listar({ somenteAtivas = false } = {}) {
    console.log('📋 [unidadesService] Iniciando listagem de unidades...');
    ensureSupabase();
    
    try {
      await ensureAuth();
      
      let query = supabase
        .from(TABLES.UNIDADES)
        .select('*')
        .order('nome');
      
      if (somenteAtivas) {
        query = query.eq('ativo', true);
        console.log('🔍 [unidadesService] Filtrando apenas unidades ativas');
      }
      
      console.log('🔄 [unidadesService] Executando consulta...');
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ [unidadesService] Erro na consulta:', error);
        
        // Verificar se é erro de autenticação
        if (error.message?.includes('JWT') || error.message?.includes('auth') || error.status === 401) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        
        throw error;
      }
      
      console.log(`✅ [unidadesService] ${data?.length || 0} unidades carregadas com sucesso`);
      return data || [];
    } catch (error) {
      console.error('❌ [unidadesService] Erro ao listar unidades:', error);
      throw error;
    }
  },
  
  /**
   * Buscar uma unidade por ID
   * @param {string} id - ID da unidade
   * @returns {Promise<Object>} Dados da unidade
   */
  async buscarPorId(id) {
    console.log(`🔍 [unidadesService] Buscando unidade por ID: ${id}`);
    ensureSupabase();
    
    try {
      await ensureAuth();
      
      const { data, error } = await supabase
        .from(TABLES.UNIDADES)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('❌ [unidadesService] Erro ao buscar unidade:', error);
        
        if (error.message?.includes('JWT') || error.status === 401) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        
        throw error;
      }
      
      console.log(`✅ [unidadesService] Unidade encontrada: ${data?.nome || 'N/A'}`);
      return data;
    } catch (error) {
      console.error('❌ [unidadesService] Erro ao buscar unidade por ID:', error);
      throw error;
    }
  },
  
  /**
   * Criar uma nova unidade
   * @param {Object} unidade - Dados da unidade
   * @returns {Promise<Object>} Unidade criada
   */
  async criar(unidade) {
    console.log('➕ [unidadesService] Criando nova unidade:', unidade.nome);
    ensureSupabase();
    
    try {
      await ensureAuth();
      
      // Validar dados
      validarUnidade(unidade, false);
      
      const payload = {
        ...unidade,
        created_at: unidade.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('🔄 [unidadesService] Enviando dados para o Supabase...');
      const { data, error } = await supabase
        .from(TABLES.UNIDADES)
        .insert([payload])
        .select()
        .single();
      
      if (error) {
        console.error('❌ [unidadesService] Erro ao criar unidade:', error);
        
        if (error.message?.includes('JWT') || error.status === 401) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        
        throw error;
      }
      
      console.log(`✅ [unidadesService] Unidade criada com sucesso! ID: ${data.id}`);
      return data;
    } catch (error) {
      console.error('❌ [unidadesService] Erro ao criar unidade:', error);
      throw error;
    }
  },
  
  /**
   * Atualizar uma unidade existente
   * @param {string} id - ID da unidade
   * @param {Object} unidade - Dados atualizados
   * @returns {Promise<Object>} Unidade atualizada
   */
  async atualizar(id, unidade) {
    console.log(`✏️ [unidadesService] Atualizando unidade ${id}:`, unidade.nome);
    ensureSupabase();
    
    try {
      await ensureAuth();
      
      // Validar dados
      validarUnidade(unidade, true);
      
      const payload = {
        ...unidade,
        updated_at: new Date().toISOString()
      };
      
      console.log('🔄 [unidadesService] Enviando atualização para o Supabase...');
      const { data, error } = await supabase
        .from(TABLES.UNIDADES)
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ [unidadesService] Erro ao atualizar unidade:', error);
        
        if (error.message?.includes('JWT') || error.status === 401) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        
        throw error;
      }
      
      console.log(`✅ [unidadesService] Unidade atualizada com sucesso!`);
      return data;
    } catch (error) {
      console.error('❌ [unidadesService] Erro ao atualizar unidade:', error);
      throw error;
    }
  },
  
  /**
   * Alternar status da unidade (ativo/inativo)
   * @param {Object} unidade - Unidade com dados atuais
   * @returns {Promise<Object>} Unidade com status alterado
   */
  async alternarStatus(unidade) {
    console.log(`🔄 [unidadesService] Alternando status da unidade ${unidade.id}: ${unidade.ativo !== false ? 'Ativo -> Inativo' : 'Inativo -> Ativo'}`);
    
    const novoStatus = unidade.ativo === false;
    return this.atualizar(unidade.id, { ...unidade, ativo: novoStatus });
  },
  
  /**
   * Excluir uma unidade
   * @param {string} id - ID da unidade
   * @returns {Promise<boolean>} True se excluído com sucesso
   */
  async deletar(id) {
    console.log(`🗑️ [unidadesService] Excluindo unidade ${id}`);
    ensureSupabase();
    
    try {
      await ensureAuth();
      
      console.log('🔄 [unidadesService] Enviando exclusão para o Supabase...');
      const { error } = await supabase
        .from(TABLES.UNIDADES)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ [unidadesService] Erro ao excluir unidade:', error);
        
        if (error.message?.includes('JWT') || error.status === 401) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        
        if (error.message?.includes('foreign key')) {
          throw new Error('Não é possível excluir esta unidade pois existem registros vinculados a ela.');
        }
        
        throw error;
      }
      
      console.log(`✅ [unidadesService] Unidade excluída com sucesso!`);
      return true;
    } catch (error) {
      console.error('❌ [unidadesService] Erro ao excluir unidade:', error);
      throw error;
    }
  },
  
  /**
   * Verificar se o usuário tem permissão para acessar unidades
   * @returns {Promise<boolean>} True se autenticado
   */
  async verificarPermissao() {
    console.log('🔐 [unidadesService] Verificando permissão...');
    
    try {
      const session = await ensureAuth();
      console.log('✅ [unidadesService] Usuário autenticado:', session.user.email);
      return true;
    } catch (error) {
      console.error('❌ [unidadesService] Usuário não autenticado:', error.message);
      return false;
    }
  },
  
  /**
   * Recarregar a sessão atual
   * @returns {Promise<Object>} Sessão atualizada
   */
  async recarregarSessao() {
    console.log('🔄 [unidadesService] Recarregando sessão...');
    ensureSupabase();
    
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ [unidadesService] Erro ao recarregar sessão:', error);
        throw error;
      }
      
      console.log('✅ [unidadesService] Sessão recarregada com sucesso!');
      return session;
    } catch (error) {
      console.error('❌ [unidadesService] Erro ao recarregar sessão:', error);
      throw error;
    }
  }
};

/**
 * Inserir registro com fallback de unidade
 * @param {string} table - Nome da tabela
 * @param {Object} payload - Dados a serem inseridos
 * @param {string} unidadeId - ID da unidade (opcional)
 * @returns {Promise<Object>} Registro inserido
 */
export const insertWithUnidadeFallback = async (table, payload, unidadeId = getStoredUnidadeId()) => {
  console.log(`📝 [unidadesService] Inserindo em ${table} com fallback de unidade`);
  ensureSupabase();
  await ensureAuth();

  const scopedPayload = applyUnidadeToPayload(payload, unidadeId);
  const { data, error } = await supabase
    .from(table)
    .insert([scopedPayload])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Atualizar registro com fallback de unidade
 * @param {string} table - Nome da tabela
 * @param {string} id - ID do registro
 * @param {Object} payload - Dados atualizados
 * @returns {Promise<Object>} Registro atualizado
 */
export const updateWithUnidadeFallback = async (table, id, payload) => {
  console.log(`✏️ [unidadesService] Atualizando em ${table} com fallback de unidade`);
  ensureSupabase();
  await ensureAuth();

  const { data, error } = await supabase
    .from(table)
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Log inicial para debug
console.log('✅ [unidadesService] Módulo carregado com sucesso!');
