import { supabase, TABLES } from '../lib/supabaseClient';

// Serviço de Convênios
export const conveniosService = {
  async listar() {
    const { data, error } = await supabase
      .from(TABLES.CONVENIOS)
      .select('*')
      .order('razao_social');
    if (error) throw error;
    return data;
  },

  async buscar(id) {
    const { data, error } = await supabase
      .from(TABLES.CONVENIOS)
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async criar(convenio) {
    const { data, error } = await supabase
      .from(TABLES.CONVENIOS)
      .insert([convenio])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async atualizar(id, convenio) {
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
    const { error } = await supabase
      .from(TABLES.CONVENIOS)
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
};

// Serviço de Pacientes
export const pacientesService = {
  async listar() {
    const { data, error } = await supabase
      .from(TABLES.PACIENTES)
      .select('*, convenios(razao_social)')
      .order('nome');
    if (error) throw error;
    return data;
  },

  async buscar(id) {
    const { data, error } = await supabase
      .from(TABLES.PACIENTES)
      .select('*, convenios(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async criar(paciente) {
    const { data, error } = await supabase
      .from(TABLES.PACIENTES)
      .insert([paciente])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async atualizar(id, paciente) {
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
    const { error } = await supabase
      .from(TABLES.PACIENTES)
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
};

// Serviço de Prestadores
export const prestadoresService = {
  async listar() {
    const { data, error } = await supabase
      .from(TABLES.PRESTADORES)
      .select('*')
      .order('nome');
    if (error) throw error;
    return data;
  },

  async buscar(id) {
    const { data, error } = await supabase
      .from(TABLES.PRESTADORES)
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async criar(prestador) {
    const { data, error } = await supabase
      .from(TABLES.PRESTADORES)
      .insert([prestador])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async atualizar(id, prestador) {
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
    const { error } = await supabase
      .from(TABLES.PRESTADORES)
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
};

// Serviço de Procedimentos
export const procedimentosService = {
  async listar(convenioId = null) {
    let query = supabase.from(TABLES.PROCEDIMENTOS).select('*');
    if (convenioId) {
      query = query.or(`convenio_id.eq.${convenioId},convenio_id.is.null`);
    }
    const { data, error } = await query.order('codigo_tuss');
    if (error) throw error;
    return data;
  },

  async criar(procedimento) {
    const { data, error } = await supabase
      .from(TABLES.PROCEDIMENTOS)
      .insert([procedimento])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async atualizar(id, procedimento) {
    const { data, error } = await supabase
      .from(TABLES.PROCEDIMENTOS)
      .update(procedimento)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deletar(id) {
    const { error } = await supabase
      .from(TABLES.PROCEDIMENTOS)
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
};

// Serviço de Atendimentos
export const atendimentosService = {
  async listar(filtros = {}) {
    let query = supabase
      .from(TABLES.ATENDIMENTOS)
      .select('*, pacientes(nome, numero_carteira), prestadores(nome), convenios(razao_social)')
      .order('created_at', { ascending: false });
    
    if (filtros.status) {
      query = query.eq('status', filtros.status);
    }
    if (filtros.convenioId) {
      query = query.eq('paciente_convenio_id', filtros.convenioId);
    }
    if (filtros.dataInicio) {
      query = query.gte('data_atendimento', filtros.dataInicio);
    }
    if (filtros.dataFim) {
      query = query.lte('data_atendimento', filtros.dataFim);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async criar(atendimento) {
    const { data, error } = await supabase
      .from(TABLES.ATENDIMENTOS)
      .insert([atendimento])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async atualizar(id, atendimento) {
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
    const { error } = await supabase
      .from(TABLES.ATENDIMENTOS)
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  async getEstatisticas() {
    const { data, error } = await supabase
      .from(TABLES.ATENDIMENTOS)
      .select('status, valor_total');
    if (error) throw error;
    
    const total = data.length;
    const pendentes = data.filter(a => a.status === 'pendente').length;
    const faturados = data.filter(a => a.status === 'faturado').length;
    const valorTotal = data.reduce((sum, a) => sum + (a.valor_total || 0), 0);
    const valorPendente = data.filter(a => a.status === 'pendente').reduce((sum, a) => sum + (a.valor_total || 0), 0);
    
    return { total, pendentes, faturados, valorTotal, valorPendente };
  }
};
