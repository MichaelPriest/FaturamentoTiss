import { supabase, TABLES, isSupabaseAvailable } from '../lib/supabaseClient';

// Helper para usar localStorage como fallback
const localStorageFallback = {
  get: (key) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  },
  set: (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

// Serviço de Convênios
export const conveniosService = {
  async listar() {
    if (!isSupabaseAvailable()) {
      return localStorageFallback.get(TABLES.CONVENIOS);
    }
    try {
      const { data, error } = await supabase
        .from(TABLES.CONVENIOS)
        .select('*')
        .order('razao_social', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erro ao listar convênios:', err);
      return localStorageFallback.get(TABLES.CONVENIOS);
    }
  },

  async criar(convenio) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.CONVENIOS);
      const newItem = { ...convenio, id: Date.now() };
      localStorageFallback.set(TABLES.CONVENIOS, [...data, newItem]);
      return newItem;
    }
    try {
      const { data, error } = await supabase
        .from(TABLES.CONVENIOS)
        .insert([convenio])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao criar convênio:', err);
      const data = localStorageFallback.get(TABLES.CONVENIOS);
      const newItem = { ...convenio, id: Date.now() };
      localStorageFallback.set(TABLES.CONVENIOS, [...data, newItem]);
      return newItem;
    }
  },

  async atualizar(id, convenio) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.CONVENIOS);
      const index = data.findIndex(item => item.id === id);
      if (index !== -1) {
        data[index] = { ...convenio, id };
        localStorageFallback.set(TABLES.CONVENIOS, data);
      }
      return { ...convenio, id };
    }
    try {
      const { data, error } = await supabase
        .from(TABLES.CONVENIOS)
        .update(convenio)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao atualizar convênio:', err);
      return { ...convenio, id };
    }
  },

  async deletar(id) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.CONVENIOS);
      const filtered = data.filter(item => item.id !== id);
      localStorageFallback.set(TABLES.CONVENIOS, filtered);
      return true;
    }
    try {
      const { error } = await supabase
        .from(TABLES.CONVENIOS)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Erro ao deletar convênio:', err);
      const data = localStorageFallback.get(TABLES.CONVENIOS);
      const filtered = data.filter(item => item.id !== id);
      localStorageFallback.set(TABLES.CONVENIOS, filtered);
      return true;
    }
  }
};

// Serviço de Pacientes
export const pacientesService = {
  async listar() {
    if (!isSupabaseAvailable()) {
      return localStorageFallback.get(TABLES.PACIENTES);
    }
    try {
      const { data, error } = await supabase
        .from(TABLES.PACIENTES)
        .select('*')
        .order('nome', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erro ao listar pacientes:', err);
      return localStorageFallback.get(TABLES.PACIENTES);
    }
  },

  async buscar(id) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.PACIENTES);
      return data.find(item => item.id === id);
    }
    try {
      const { data, error } = await supabase
        .from(TABLES.PACIENTES)
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao buscar paciente:', err);
      return null;
    }
  },

  async criar(paciente) {
    console.log('Chamando pacientesService.criar:', paciente);
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.PACIENTES);
      const newItem = { ...paciente, id: Date.now(), created_at: new Date().toISOString() };
      localStorageFallback.set(TABLES.PACIENTES, [...data, newItem]);
      return newItem;
    }
    try {
      const { data, error } = await supabase
        .from(TABLES.PACIENTES)
        .insert([paciente])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao criar paciente no Supabase:', err);
      // Fallback para localStorage
      const data = localStorageFallback.get(TABLES.PACIENTES);
      const newItem = { ...paciente, id: Date.now(), created_at: new Date().toISOString() };
      localStorageFallback.set(TABLES.PACIENTES, [...data, newItem]);
      return newItem;
    }
  },

  async atualizar(id, paciente) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.PACIENTES);
      const index = data.findIndex(item => item.id === id);
      if (index !== -1) {
        data[index] = { ...paciente, id, updated_at: new Date().toISOString() };
        localStorageFallback.set(TABLES.PACIENTES, data);
      }
      return { ...paciente, id };
    }
    try {
      const { data, error } = await supabase
        .from(TABLES.PACIENTES)
        .update(paciente)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao atualizar paciente:', err);
      return { ...paciente, id };
    }
  },

  async deletar(id) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.PACIENTES);
      const filtered = data.filter(item => item.id !== id);
      localStorageFallback.set(TABLES.PACIENTES, filtered);
      return true;
    }
    try {
      const { error } = await supabase
        .from(TABLES.PACIENTES)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Erro ao deletar paciente:', err);
      const data = localStorageFallback.get(TABLES.PACIENTES);
      const filtered = data.filter(item => item.id !== id);
      localStorageFallback.set(TABLES.PACIENTES, filtered);
      return true;
    }
  }
};

// Serviço de Atendimentos
export const atendimentosService = {
  async listar(filtros = {}) {
    if (!isSupabaseAvailable()) {
      let data = localStorageFallback.get(TABLES.ATENDIMENTOS);
      if (filtros.status) {
        data = data.filter(a => a.status === filtros.status);
      }
      return data;
    }
    try {
      let query = supabase
        .from(TABLES.ATENDIMENTOS)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (filtros.status) {
        query = query.eq('status', filtros.status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erro ao listar atendimentos:', err);
      return [];
    }
  },

  async getEstatisticas() {
    const data = await this.listar();
    const total = data.length;
    const pendentes = data.filter(a => a.status === 'pendente').length;
    const faturados = data.filter(a => a.status === 'faturado').length;
    const valorTotal = data.reduce((sum, a) => sum + (a.valor_total || 0), 0);
    const valorPendente = data.filter(a => a.status === 'pendente').reduce((sum, a) => sum + (a.valor_total || 0), 0);
    return { total, pendentes, faturados, valorTotal, valorPendente };
  }
};
