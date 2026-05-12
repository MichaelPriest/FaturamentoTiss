import { supabase, TABLES, isSupabaseAvailable } from '../lib/supabaseClient';

export const UNIDADE_STORAGE_KEY = 'unidade_atual_id';
export const TODAS_UNIDADES_ID = 'todas';

const ensureSupabase = () => {
  if (!isSupabaseAvailable()) {
    throw new Error('Supabase não configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  }
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

export const unidadesService = {
  async listar({ somenteAtivas = false } = {}) {
    ensureSupabase();

    let query = supabase.from(TABLES.UNIDADES).select('*').order('nome');
    if (somenteAtivas) query = query.eq('ativo', true);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async criar(unidade) {
    ensureSupabase();

    const payload = {
      ...unidade,
      created_at: unidade.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from(TABLES.UNIDADES)
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async atualizar(id, unidade) {
    ensureSupabase();

    const payload = { ...unidade, updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from(TABLES.UNIDADES)
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async alternarStatus(unidade) {
    return this.atualizar(unidade.id, { ...unidade, ativo: unidade.ativo === false });
  },

  async deletar(id) {
    ensureSupabase();

    const { error } = await supabase.from(TABLES.UNIDADES).delete().eq('id', id);
    if (error) throw error;
    return true;
  }
};

export const insertWithUnidadeFallback = async (table, payload, unidadeId = getStoredUnidadeId()) => {
  ensureSupabase();

  const scopedPayload = applyUnidadeToPayload(payload, unidadeId);
  return supabase.from(table).insert([scopedPayload]).select().single();
};

export const updateWithUnidadeFallback = async (table, id, payload) => {
  ensureSupabase();

  return supabase.from(table).update(payload).eq('id', id).select().single();
};
