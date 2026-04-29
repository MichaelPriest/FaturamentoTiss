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
    // Se Supabase não está disponível, usar localStorage
    if (!isSupabaseAvailable()) {
      console.log('📦 Usando localStorage para convênios');
      return localStorageFallback.get(TABLES.CONVENIOS);
    }
    
    try {
      const { data, error } = await supabase
        .from(TABLES.CONVENIOS)
        .select('*')
        .order('razao_social', { ascending: true });
      
      if (error) {
        console.error('Erro Supabase:', error);
        return localStorageFallback.get(TABLES.CONVENIOS);
      }
      
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
      const data = localStorageFallback.get(TABLES.CONVENIOS);
      const index = data.findIndex(item => item.id === id);
      if (index !== -1) {
        data[index] = { ...convenio, id };
        localStorageFallback.set(TABLES.CONVENIOS, data);
      }
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

// Serviço de Notificações
export const notificacoesService = {
  async listar() {
    if (!isSupabaseAvailable()) {
      return localStorageFallback.get(TABLES.NOTIFICACOES) || [];
    }
    
    try {
      const { data, error } = await supabase
        .from(TABLES.NOTIFICACOES)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erro ao listar notificações:', err);
      return localStorageFallback.get(TABLES.NOTIFICACOES) || [];
    }
  },

  async criar(notificacao) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.NOTIFICACOES) || [];
      const newItem = { ...notificacao, id: Date.now(), created_at: new Date().toISOString(), lido: false };
      localStorageFallback.set(TABLES.NOTIFICACOES, [newItem, ...data]);
      return newItem;
    }
    
    try {
      const { data, error } = await supabase
        .from(TABLES.NOTIFICACOES)
        .insert([notificacao])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao criar notificação:', err);
      return null;
    }
  },

  async marcarLido(id) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.NOTIFICACOES) || [];
      const updated = data.map(n => n.id === id ? { ...n, lido: true } : n);
      localStorageFallback.set(TABLES.NOTIFICACOES, updated);
      return true;
    }
    
    try {
      const { error } = await supabase
        .from(TABLES.NOTIFICACOES)
        .update({ lido: true })
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Erro ao marcar notificação como lida:', err);
      return false;
    }
  }
};

// Exportar outros serviços...
export const pacientesService = {
  async listar() {
    if (!isSupabaseAvailable()) {
      return localStorageFallback.get(TABLES.PACIENTES) || [];
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
      return localStorageFallback.get(TABLES.PACIENTES) || [];
    }
  }
};

export const atendimentosService = {
  async listar() {
    if (!isSupabaseAvailable()) {
      return localStorageFallback.get(TABLES.ATENDIMENTOS) || [];
    }
    try {
      const { data, error } = await supabase
        .from(TABLES.ATENDIMENTOS)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erro ao listar atendimentos:', err);
      return localStorageFallback.get(TABLES.ATENDIMENTOS) || [];
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
