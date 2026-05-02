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

// ============================================
// SERVIÇO DE PRESTADORES (ATUALIZADO COM ESPECIALIDADES)
// ============================================
export const prestadoresService = {
  // Listar prestadores com suas especialidades
  async listar() {
    if (!isSupabaseAvailable()) {
      return localStorageFallback.get(TABLES.PRESTADORES);
    }
    try {
      const { data, error } = await supabase
        .from(TABLES.PRESTADORES)
        .select('*')
        .order('nome', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erro ao listar prestadores:', err);
      return localStorageFallback.get(TABLES.PRESTADORES);
    }
  },

  // Listar prestadores com especialidades (completo)
  async listarComEspecialidades() {
    if (!isSupabaseAvailable()) {
      const prestadores = localStorageFallback.get(TABLES.PRESTADORES);
      const especialidadesRel = localStorageFallback.get('prestador_especialidade') || [];
      const especialidadesList = localStorageFallback.get('especialidades') || [];
      
      return prestadores.map(p => ({
        ...p,
        especialidades: especialidadesRel
          .filter(rel => rel.prestador_id === p.id)
          .map(rel => ({
            ...rel,
            especialidade: especialidadesList.find(e => e.id === rel.especialidade_id)
          }))
      }));
    }
    try {
      const { data, error } = await supabase
        .from(TABLES.PRESTADORES)
        .select(`
          *,
          especialidades:prestador_especialidade(
            id,
            principal,
            especialidade:especialidades(
              id,
              nome,
              cbos,
              codigoANS
            )
          )
        `)
        .order('nome', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erro ao listar prestadores com especialidades:', err);
      return this.listar();
    }
  },

  async buscar(id) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.PRESTADORES);
      return data.find(item => item.id === id);
    }
    try {
      const { data, error } = await supabase
        .from(TABLES.PRESTADORES)
        .select(`
          *,
          especialidades:prestador_especialidade(
            id,
            principal,
            especialidade:especialidades(
              id,
              nome,
              cbos,
              codigoANS
            )
          )
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao buscar prestador:', err);
      return null;
    }
  },

  // Criar prestador com especialidades
  async criar(prestador) {
    console.log('Chamando prestadoresService.criar:', prestador);
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.PRESTADORES);
      const newItem = { ...prestador, id: Date.now(), created_at: new Date().toISOString() };
      localStorageFallback.set(TABLES.PRESTADORES, [...data, newItem]);
      return newItem;
    }
    try {
      const { data, error } = await supabase
        .from(TABLES.PRESTADORES)
        .insert([prestador])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao criar prestador no Supabase:', err);
      const data = localStorageFallback.get(TABLES.PRESTADORES);
      const newItem = { ...prestador, id: Date.now(), created_at: new Date().toISOString() };
      localStorageFallback.set(TABLES.PRESTADORES, [...data, newItem]);
      return newItem;
    }
  },

  // Criar prestador com especialidades (versão completa)
  async criarComEspecialidades(prestadorData) {
    const { especialidades, ...dadosPrestador } = prestadorData;
    
    if (!isSupabaseAvailable()) {
      // Fallback para localStorage
      const prestadores = localStorageFallback.get(TABLES.PRESTADORES);
      const newPrestador = { ...dadosPrestador, id: Date.now(), created_at: new Date().toISOString() };
      localStorageFallback.set(TABLES.PRESTADORES, [...prestadores, newPrestador]);
      
      // Salvar especialidades
      if (especialidades && especialidades.length > 0) {
        const relacoes = localStorageFallback.get('prestador_especialidade') || [];
        const novasRelacoes = especialidades.map(esp => ({
          id: Date.now() + Math.random(),
          prestador_id: newPrestador.id,
          especialidade_id: esp.especialidade_id,
          principal: esp.principal || false
        }));
        localStorageFallback.set('prestador_especialidade', [...relacoes, ...novasRelacoes]);
      }
      return newPrestador;
    }
    
    try {
      // Inserir prestador
      const { data: prestador, error: prestadorError } = await supabase
        .from(TABLES.PRESTADORES)
        .insert([dadosPrestador])
        .select()
        .single();
      
      if (prestadorError) throw prestadorError;
      
      // Inserir especialidades
      if (especialidades && especialidades.length > 0) {
        const especialidadesInsert = especialidades.map(esp => ({
          prestador_id: prestador.id,
          especialidade_id: esp.especialidade_id,
          principal: esp.principal || false
        }));
        
        const { error: espError } = await supabase
          .from('prestador_especialidade')
          .insert(especialidadesInsert);
        
        if (espError) throw espError;
      }
      
      return prestador;
    } catch (err) {
      console.error('Erro ao criar prestador com especialidades:', err);
      throw err;
    }
  },

  async atualizar(id, prestador) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.PRESTADORES);
      const index = data.findIndex(item => item.id === id);
      if (index !== -1) {
        data[index] = { ...prestador, id, updated_at: new Date().toISOString() };
        localStorageFallback.set(TABLES.PRESTADORES, data);
      }
      return { ...prestador, id };
    }
    try {
      const { data, error } = await supabase
        .from(TABLES.PRESTADORES)
        .update(prestador)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao atualizar prestador:', err);
      return { ...prestador, id };
    }
  },

  // Atualizar prestador com especialidades
  async atualizarComEspecialidades(id, prestadorData) {
    const { especialidades, ...dadosPrestador } = prestadorData;
    
    if (!isSupabaseAvailable()) {
      // Atualizar prestador
      const prestadores = localStorageFallback.get(TABLES.PRESTADORES);
      const index = prestadores.findIndex(item => item.id === id);
      if (index !== -1) {
        prestadores[index] = { ...dadosPrestador, id, updated_at: new Date().toISOString() };
        localStorageFallback.set(TABLES.PRESTADORES, prestadores);
      }
      
      // Atualizar especialidades (remover antigas e adicionar novas)
      let relacoes = localStorageFallback.get('prestador_especialidade') || [];
      relacoes = relacoes.filter(rel => rel.prestador_id !== id);
      
      if (especialidades && especialidades.length > 0) {
        const novasRelacoes = especialidades.map(esp => ({
          id: Date.now() + Math.random(),
          prestador_id: id,
          especialidade_id: esp.especialidade_id,
          principal: esp.principal || false
        }));
        localStorageFallback.set('prestador_especialidade', [...relacoes, ...novasRelacoes]);
      } else {
        localStorageFallback.set('prestador_especialidade', relacoes);
      }
      
      return { id };
    }
    
    try {
      // Atualizar prestador
      const { error: prestadorError } = await supabase
        .from(TABLES.PRESTADORES)
        .update(dadosPrestador)
        .eq('id', id);
      
      if (prestadorError) throw prestadorError;
      
      // Remover especialidades antigas
      const { error: deleteError } = await supabase
        .from('prestador_especialidade')
        .delete()
        .eq('prestador_id', id);
      
      if (deleteError) throw deleteError;
      
      // Inserir novas especialidades
      if (especialidades && especialidades.length > 0) {
        const especialidadesInsert = especialidades.map(esp => ({
          prestador_id: id,
          especialidade_id: esp.especialidade_id,
          principal: esp.principal || false
        }));
        
        const { error: espError } = await supabase
          .from('prestador_especialidade')
          .insert(especialidadesInsert);
        
        if (espError) throw espError;
      }
      
      return { id };
    } catch (err) {
      console.error('Erro ao atualizar prestador com especialidades:', err);
      throw err;
    }
  },

  async deletar(id) {
    if (!isSupabaseAvailable()) {
      // Remover especialidades relacionadas
      let relacoes = localStorageFallback.get('prestador_especialidade') || [];
      relacoes = relacoes.filter(rel => rel.prestador_id !== id);
      localStorageFallback.set('prestador_especialidade', relacoes);
      
      // Remover prestador
      const data = localStorageFallback.get(TABLES.PRESTADORES);
      const filtered = data.filter(item => item.id !== id);
      localStorageFallback.set(TABLES.PRESTADORES, filtered);
      return true;
    }
    try {
      // As especialidades serão removidas automaticamente pelo CASCADE
      const { error } = await supabase
        .from(TABLES.PRESTADORES)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Erro ao deletar prestador:', err);
      return false;
    }
  }
};

// Serviço de Especialidades
export const especialidadesService = {
  async listar() {
    if (!isSupabaseAvailable()) {
      return localStorageFallback.get('especialidades') || [];
    }
    try {
      const { data, error } = await supabase
        .from('especialidades')
        .select('*')
        .order('nome', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erro ao listar especialidades:', err);
      return localStorageFallback.get('especialidades') || [];
    }
  },

  async criar(especialidade) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get('especialidades') || [];
      const newItem = { ...especialidade, id: Date.now() };
      localStorageFallback.set('especialidades', [...data, newItem]);
      return newItem;
    }
    try {
      const { data, error } = await supabase
        .from('especialidades')
        .insert([especialidade])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao criar especialidade:', err);
      return null;
    }
  },

  async atualizar(id, especialidade) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get('especialidades') || [];
      const index = data.findIndex(item => item.id === id);
      if (index !== -1) {
        data[index] = { ...especialidade, id };
        localStorageFallback.set('especialidades', data);
      }
      return { ...especialidade, id };
    }
    try {
      const { data, error } = await supabase
        .from('especialidades')
        .update(especialidade)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao atualizar especialidade:', err);
      return { ...especialidade, id };
    }
  },

  async deletar(id) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get('especialidades') || [];
      const filtered = data.filter(item => item.id !== id);
      localStorageFallback.set('especialidades', filtered);
      return true;
    }
    try {
      const { error } = await supabase
        .from('especialidades')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Erro ao deletar especialidade:', err);
      return false;
    }
  },

  // Seed inicial das especialidades
  async seed() {
    const especialidadesList = [
      { nome: 'Clínica Médica', cbos: '225125', codigoANS: '06' },
      { nome: 'Cardiologia', cbos: '225135', codigoANS: '06' },
      { nome: 'Pediatria', cbos: '225140', codigoANS: '06' },
      { nome: 'Ginecologia', cbos: '225145', codigoANS: '06' },
      { nome: 'Obstetrícia', cbos: '225150', codigoANS: '06' },
      { nome: 'Ortopedia', cbos: '225155', codigoANS: '06' },
      { nome: 'Neurologia', cbos: '225170', codigoANS: '06' },
      { nome: 'Psiquiatria', cbos: '225175', codigoANS: '06' },
      { nome: 'Fisioterapia', cbos: '223605', codigoANS: '03' },
      { nome: 'Fonoaudiologia', cbos: '223610', codigoANS: '03' },
      { nome: 'Terapia Ocupacional', cbos: '223615', codigoANS: '03' },
      { nome: 'Psicomotricidade', cbos: '223605', codigoANS: '03' },
      { nome: 'Musicoterapia', cbos: '223610', codigoANS: '03' },
      { nome: 'Gerontologia', cbos: '223615', codigoANS: '03' },
      { nome: 'Nutrição', cbos: '223405', codigoANS: '10' },
      { nome: 'Psicologia', cbos: '251510', codigoANS: '08' },
      { nome: 'Neuropsicologia', cbos: '251510', codigoANS: '08' },
      { nome: 'Psicopedagogia', cbos: '251510', codigoANS: '08' },
      { nome: 'Farmácia', cbos: '223205', codigoANS: '05' },
      { nome: 'Biomedicina', cbos: '223305', codigoANS: '09' },
      { nome: 'Enfermagem', cbos: '223505', codigoANS: '04' },
      { nome: 'Odontologia Clínica', cbos: '223105', codigoANS: '07' },
      { nome: 'Odontopediatria', cbos: '223110', codigoANS: '07' },
      { nome: 'Ortodontia', cbos: '223115', codigoANS: '07' },
      { nome: 'Pedagogia', cbos: null, codigoANS: null },
      { nome: 'Educação Física', cbos: '224105', codigoANS: '11' }
    ];
    
    for (const esp of especialidadesList) {
      const existente = await this.listar().then(list => list.find(e => e.nome === esp.nome));
      if (!existente) {
        await this.criar(esp);
      }
    }
  }
};

// Serviço de Procedimentos
export const procedimentosService = {
  async listar(convenioId = null) {
    if (!isSupabaseAvailable()) {
      return localStorageFallback.get(TABLES.PROCEDIMENTOS);
    }
    try {
      let query = supabase.from(TABLES.PROCEDIMENTOS).select('*');
      if (convenioId) {
        query = query.or(`convenio_id.eq.${convenioId},convenio_id.is.null`);
      }
      const { data, error } = await query.order('codigo_tuss');
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erro ao listar procedimentos:', err);
      return localStorageFallback.get(TABLES.PROCEDIMENTOS);
    }
  },

  async criar(procedimento) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.PROCEDIMENTOS);
      const newItem = { ...procedimento, id: Date.now() };
      localStorageFallback.set(TABLES.PROCEDIMENTOS, [...data, newItem]);
      return newItem;
    }
    try {
      const { data, error } = await supabase
        .from(TABLES.PROCEDIMENTOS)
        .insert([procedimento])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao criar procedimento:', err);
      return null;
    }
  },

  async atualizar(id, procedimento) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.PROCEDIMENTOS);
      const index = data.findIndex(item => item.id === id);
      if (index !== -1) {
        data[index] = { ...procedimento, id };
        localStorageFallback.set(TABLES.PROCEDIMENTOS, data);
      }
      return { ...procedimento, id };
    }
    try {
      const { data, error } = await supabase
        .from(TABLES.PROCEDIMENTOS)
        .update(procedimento)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao atualizar procedimento:', err);
      return { ...procedimento, id };
    }
  },

  async deletar(id) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.PROCEDIMENTOS);
      const filtered = data.filter(item => item.id !== id);
      localStorageFallback.set(TABLES.PROCEDIMENTOS, filtered);
      return true;
    }
    try {
      const { error } = await supabase
        .from(TABLES.PROCEDIMENTOS)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Erro ao deletar procedimento:', err);
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

  async criar(atendimento) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.ATENDIMENTOS);
      const newItem = { ...atendimento, id: Date.now() };
      localStorageFallback.set(TABLES.ATENDIMENTOS, [...data, newItem]);
      return newItem;
    }
    try {
      const { data, error } = await supabase
        .from(TABLES.ATENDIMENTOS)
        .insert([atendimento])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao criar atendimento:', err);
      return null;
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
