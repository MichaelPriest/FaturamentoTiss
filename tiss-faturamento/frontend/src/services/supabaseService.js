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

// Serviço de Convênios com fallback
export const conveniosService = {
  async listar() {
    if (!isSupabaseAvailable()) {
      return localStorageFallback.get(TABLES.CONVENIOS);
    }
    const { data, error } = await supabase
      .from(TABLES.CONVENIOS)
      .select('*')
      .order('razao_social');
    if (error) throw error;
    return data;
  },

  async buscar(id) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.CONVENIOS);
      return data.find(item => item.id === id);
    }
    const { data, error } = await supabase
      .from(TABLES.CONVENIOS)
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async criar(convenio) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.CONVENIOS);
      const newItem = { ...convenio, id: Date.now() };
      localStorageFallback.set(TABLES.CONVENIOS, [...data, newItem]);
      return newItem;
    }
    const { data, error } = await supabase
      .from(TABLES.CONVENIOS)
      .insert([convenio])
      .select()
      .single();
    if (error) throw error;
    return data;
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
    const { data, error } = await supabase
      .from(TABLES.CONVENIOS)
      .update(convenio)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deletar(id) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.CONVENIOS);
      const filtered = data.filter(item => item.id !== id);
      localStorageFallback.set(TABLES.CONVENIOS, filtered);
      return true;
    }
    const { error } = await supabase
      .from(TABLES.CONVENIOS)
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
};

// Serviço de Pacientes com fallback
export const pacientesService = {
  async listar() {
    if (!isSupabaseAvailable()) {
      return localStorageFallback.get(TABLES.PACIENTES);
    }
    const { data, error } = await supabase
      .from(TABLES.PACIENTES)
      .select('*, convenios(razao_social)')
      .order('nome');
    if (error) throw error;
    return data;
  },

  async buscar(id) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.PACIENTES);
      return data.find(item => item.id === id);
    }
    const { data, error } = await supabase
      .from(TABLES.PACIENTES)
      .select('*, convenios(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async criar(paciente) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.PACIENTES);
      const newItem = { ...paciente, id: Date.now() };
      localStorageFallback.set(TABLES.PACIENTES, [...data, newItem]);
      return newItem;
    }
    const { data, error } = await supabase
      .from(TABLES.PACIENTES)
      .insert([paciente])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async atualizar(id, paciente) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.PACIENTES);
      const index = data.findIndex(item => item.id === id);
      if (index !== -1) {
        data[index] = { ...paciente, id };
        localStorageFallback.set(TABLES.PACIENTES, data);
      }
      return { ...paciente, id };
    }
    const { data, error } = await supabase
      .from(TABLES.PACIENTES)
      .update(paciente)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deletar(id) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.PACIENTES);
      const filtered = data.filter(item => item.id !== id);
      localStorageFallback.set(TABLES.PACIENTES, filtered);
      return true;
    }
    const { error } = await supabase
      .from(TABLES.PACIENTES)
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
};

// Serviço de Prestadores com fallback
export const prestadoresService = {
  async listar() {
    if (!isSupabaseAvailable()) {
      return localStorageFallback.get(TABLES.PRESTADORES);
    }
    const { data, error } = await supabase
      .from(TABLES.PRESTADORES)
      .select('*')
      .order('nome');
    if (error) throw error;
    return data;
  },

  async criar(prestador) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.PRESTADORES);
      const newItem = { ...prestador, id: Date.now() };
      localStorageFallback.set(TABLES.PRESTADORES, [...data, newItem]);
      return newItem;
    }
    const { data, error } = await supabase
      .from(TABLES.PRESTADORES)
      .insert([prestador])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async atualizar(id, prestador) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.PRESTADORES);
      const index = data.findIndex(item => item.id === id);
      if (index !== -1) {
        data[index] = { ...prestador, id };
        localStorageFallback.set(TABLES.PRESTADORES, data);
      }
      return { ...prestador, id };
    }
    const { data, error } = await supabase
      .from(TABLES.PRESTADORES)
      .update(prestador)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deletar(id) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.PRESTADORES);
      const filtered = data.filter(item => item.id !== id);
      localStorageFallback.set(TABLES.PRESTADORES, filtered);
      return true;
    }
    const { error } = await supabase
      .from(TABLES.PRESTADORES)
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
};

// Serviço de Atendimentos com fallback
export const atendimentosService = {
  async listar(filtros = {}) {
    if (!isSupabaseAvailable()) {
      let data = localStorageFallback.get(TABLES.ATENDIMENTOS);
      if (filtros.status) {
        data = data.filter(a => a.status === filtros.status);
      }
      return data;
    }
    let query = supabase
      .from(TABLES.ATENDIMENTOS)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (filtros.status) {
      query = query.eq('status', filtros.status);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async criar(atendimento) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.ATENDIMENTOS);
      const newItem = { ...atendimento, id: Date.now() };
      localStorageFallback.set(TABLES.ATENDIMENTOS, [...data, newItem]);
      return newItem;
    }
    const { data, error } = await supabase
      .from(TABLES.ATENDIMENTOS)
      .insert([atendimento])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async atualizar(id, atendimento) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.ATENDIMENTOS);
      const index = data.findIndex(item => item.id === id);
      if (index !== -1) {
        data[index] = { ...atendimento, id };
        localStorageFallback.set(TABLES.ATENDIMENTOS, data);
      }
      return { ...atendimento, id };
    }
    const { data, error } = await supabase
      .from(TABLES.ATENDIMENTOS)
      .update(atendimento)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deletar(id) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.ATENDIMENTOS);
      const filtered = data.filter(item => item.id !== id);
      localStorageFallback.set(TABLES.ATENDIMENTOS, filtered);
      return true;
    }
    const { error } = await supabase
      .from(TABLES.ATENDIMENTOS)
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
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
