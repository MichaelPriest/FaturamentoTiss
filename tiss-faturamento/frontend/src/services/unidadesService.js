import { supabase, TABLES, isSupabaseAvailable } from '../lib/supabaseClient';

export const UNIDADE_STORAGE_KEY = 'unidade_atual_id';
export const TODAS_UNIDADES_ID = 'todas';

const unidadeMatriz = {
  id: 'matriz',
  nome: 'Unidade Matriz',
  codigo: 'MATRIZ',
  cnpj: null,
  cnes: null,
  responsavel: null,
  telefone: null,
  email: null,
  endereco: null,
  cidade: null,
  uf: 'SP',
  observacao: 'Unidade padrão criada automaticamente para registros sem unidade.',
  ativo: true,
  created_at: new Date().toISOString()
};

const getFallback = () => {
  const stored = localStorage.getItem(TABLES.UNIDADES);
  const unidades = stored ? JSON.parse(stored) : [];

  if (unidades.length === 0) {
    localStorage.setItem(TABLES.UNIDADES, JSON.stringify([unidadeMatriz]));
    return [unidadeMatriz];
  }

  return unidades;
};

const setFallback = (unidades) => {
  localStorage.setItem(TABLES.UNIDADES, JSON.stringify(unidades));
};

export const getStoredUnidadeId = () => localStorage.getItem(UNIDADE_STORAGE_KEY) || TODAS_UNIDADES_ID;

export const setStoredUnidadeId = (unidadeId) => {
  localStorage.setItem(UNIDADE_STORAGE_KEY, unidadeId || TODAS_UNIDADES_ID);
};

export const isTodasUnidades = (unidadeId = getStoredUnidadeId()) => !unidadeId || unidadeId === TODAS_UNIDADES_ID;

export const filterByUnidade = (items = [], unidadeId = getStoredUnidadeId()) => {
  if (isTodasUnidades(unidadeId)) return items;
  return items.filter((item) => !Object.prototype.hasOwnProperty.call(item, 'unidade_id') || item.unidade_id === unidadeId);
};

export const applyUnidadeToPayload = (payload = {}, unidadeId = getStoredUnidadeId()) => {
  if (isTodasUnidades(unidadeId) || payload.unidade_id) return payload;
  return { ...payload, unidade_id: unidadeId };
};

const isMissingUnidadeColumnError = (error) => {
  const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
  return message.includes('unidade_id') && (message.includes('column') || message.includes('schema cache'));
};

export const unidadesService = {
  async listar({ somenteAtivas = false } = {}) {
    if (!isSupabaseAvailable()) {
      const unidades = getFallback();
      return somenteAtivas ? unidades.filter((unidade) => unidade.ativo !== false) : unidades;
    }

    try {
      let query = supabase.from(TABLES.UNIDADES).select('*').order('nome');
      if (somenteAtivas) query = query.eq('ativo', true);

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) return getFallback();
      return data;
    } catch (error) {
      console.error('Erro ao listar unidades:', error);
      const unidades = getFallback();
      return somenteAtivas ? unidades.filter((unidade) => unidade.ativo !== false) : unidades;
    }
  },

  async criar(unidade) {
    const payload = {
      ...unidade,
      created_at: unidade.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (!isSupabaseAvailable()) {
      const unidades = getFallback();
      const novaUnidade = { ...payload, id: Date.now().toString() };
      setFallback([...unidades, novaUnidade]);
      return novaUnidade;
    }

    try {
      const { data, error } = await supabase
        .from(TABLES.UNIDADES)
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar unidade:', error);
      const unidades = getFallback();
      const novaUnidade = { ...payload, id: Date.now().toString() };
      setFallback([...unidades, novaUnidade]);
      return novaUnidade;
    }
  },

  async atualizar(id, unidade) {
    const payload = { ...unidade, updated_at: new Date().toISOString() };

    if (!isSupabaseAvailable()) {
      const unidades = getFallback().map((item) => item.id === id ? { ...item, ...payload, id } : item);
      setFallback(unidades);
      return unidades.find((item) => item.id === id) || { ...payload, id };
    }

    try {
      const { data, error } = await supabase
        .from(TABLES.UNIDADES)
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar unidade:', error);
      const unidades = getFallback().map((item) => item.id === id ? { ...item, ...payload, id } : item);
      setFallback(unidades);
      return unidades.find((item) => item.id === id) || { ...payload, id };
    }
  },

  async alternarStatus(unidade) {
    return this.atualizar(unidade.id, { ...unidade, ativo: unidade.ativo === false });
  },

  async deletar(id) {
    if (!isSupabaseAvailable()) {
      setFallback(getFallback().filter((unidade) => unidade.id !== id));
      return true;
    }

    try {
      const { error } = await supabase.from(TABLES.UNIDADES).delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao excluir unidade:', error);
      setFallback(getFallback().filter((unidade) => unidade.id !== id));
      return true;
    }
  }
};

export const insertWithUnidadeFallback = async (table, payload, unidadeId = getStoredUnidadeId()) => {
  const scopedPayload = applyUnidadeToPayload(payload, unidadeId);
  let response = await supabase.from(table).insert([scopedPayload]).select().single();

  if (response.error && isMissingUnidadeColumnError(response.error)) {
    const { unidade_id, ...payloadSemUnidade } = scopedPayload;
    response = await supabase.from(table).insert([payloadSemUnidade]).select().single();
  }

  return response;
};

export const updateWithUnidadeFallback = async (table, id, payload) => {
  let response = await supabase.from(table).update(payload).eq('id', id).select().single();

  if (response.error && isMissingUnidadeColumnError(response.error)) {
    const { unidade_id, ...payloadSemUnidade } = payload;
    response = await supabase.from(table).update(payloadSemUnidade).eq('id', id).select().single();
  }

  return response;
};
