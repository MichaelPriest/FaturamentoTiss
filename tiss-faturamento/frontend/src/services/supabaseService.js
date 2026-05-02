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
      const { versao_tiss, ...dadosLimpos } = convenio;
      const newItem = { ...dadosLimpos, id: Date.now() };
      localStorageFallback.set(TABLES.CONVENIOS, [...data, newItem]);
      return newItem;
    }
    try {
      // Remover o campo versao_tiss dos dados a serem inseridos (não existe na tabela)
      const { versao_tiss, ...dadosParaInserir } = convenio;
      
      console.log('Inserindo convênio:', dadosParaInserir);
      
      const { data, error } = await supabase
        .from(TABLES.CONVENIOS)
        .insert([dadosParaInserir])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao criar convênio:', err);
      const data = localStorageFallback.get(TABLES.CONVENIOS);
      const { versao_tiss, ...dadosLimpos } = convenio;
      const newItem = { ...dadosLimpos, id: Date.now() };
      localStorageFallback.set(TABLES.CONVENIOS, [...data, newItem]);
      return newItem;
    }
  },

  async atualizar(id, convenio) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.CONVENIOS);
      const index = data.findIndex(item => item.id === id);
      if (index !== -1) {
        const { versao_tiss, ...dadosLimpos } = convenio;
        data[index] = { ...dadosLimpos, id };
        localStorageFallback.set(TABLES.CONVENIOS, data);
      }
      return { ...convenio, id };
    }
    try {
      // Remover o campo versao_tiss dos dados a serem atualizados
      const { versao_tiss, ...dadosParaAtualizar } = convenio;
      
      const { data, error } = await supabase
        .from(TABLES.CONVENIOS)
        .update(dadosParaAtualizar)
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
// SERVIÇO DE PRESTADORES
// ============================================
export const prestadoresService = {
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
      const { data: prestadores, error: errorPrestadores } = await supabase
        .from('prestadores')
        .select('*')
        .order('nome', { ascending: true });
      
      if (errorPrestadores) throw errorPrestadores;
      if (!prestadores || prestadores.length === 0) return [];
      
      const { data: relacoes, error: errorRelacoes } = await supabase
        .from('prestador_especialidade')
        .select('*');
      
      if (errorRelacoes) throw errorRelacoes;
      
      const { data: especialidades, error: errorEspecialidades } = await supabase
        .from('especialidades')
        .select('*');
      
      if (errorEspecialidades) throw errorEspecialidades;
      
      const mapaEspecialidades = new Map();
      especialidades?.forEach(esp => {
        mapaEspecialidades.set(esp.id, {
          id: esp.id,
          nome: esp.nome,
          cbos: esp.cbos,
          codigo_ans: esp.codigo_ans
        });
      });
      
      const mapaRelacoes = new Map();
      relacoes?.forEach(rel => {
        if (!mapaRelacoes.has(rel.prestador_id)) {
          mapaRelacoes.set(rel.prestador_id, []);
        }
        
        const especialidade = mapaEspecialidades.get(rel.especialidade_id);
        if (especialidade) {
          mapaRelacoes.get(rel.prestador_id).push({
            id: rel.id,
            prestador_id: rel.prestador_id,
            especialidade_id: rel.especialidade_id,
            principal: rel.principal,
            especialidade: especialidade
          });
        }
      });
      
      const resultado = prestadores.map(prestador => ({
        ...prestador,
        especialidades: mapaRelacoes.get(prestador.id) || []
      }));
      
      return resultado;
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
      const { data: prestador, error: prestadorError } = await supabase
        .from(TABLES.PRESTADORES)
        .select('*')
        .eq('id', id)
        .single();
      
      if (prestadorError) throw prestadorError;
      
      const { data: especialidadesRel, error: relError } = await supabase
        .from('prestador_especialidade')
        .select(`
          id,
          principal,
          especialidade_id,
          especialidades:especialidade_id (
            id,
            nome,
            cbos,
            codigo_ans
          )
        `)
        .eq('prestador_id', id);
      
      if (relError) {
        console.error('Erro ao buscar especialidades:', relError);
        return prestador;
      }
      
      return {
        ...prestador,
        especialidades: especialidadesRel || []
      };
    } catch (err) {
      console.error('Erro ao buscar prestador:', err);
      return null;
    }
  },

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

  async criarComEspecialidades(prestadorData) {
    const { especialidades, ...dadosPrestador } = prestadorData;
    
    if (!isSupabaseAvailable()) {
      const prestadores = localStorageFallback.get(TABLES.PRESTADORES);
      const newPrestador = { ...dadosPrestador, id: Date.now(), created_at: new Date().toISOString() };
      localStorageFallback.set(TABLES.PRESTADORES, [...prestadores, newPrestador]);
      
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
      const { data: prestador, error: prestadorError } = await supabase
        .from(TABLES.PRESTADORES)
        .insert([dadosPrestador])
        .select()
        .single();
      
      if (prestadorError) throw prestadorError;
      
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

  async atualizarComEspecialidades(id, prestadorData) {
    const { especialidades, ...dadosPrestador } = prestadorData;
    
    if (!isSupabaseAvailable()) {
      const prestadores = localStorageFallback.get(TABLES.PRESTADORES);
      const index = prestadores.findIndex(item => item.id === id);
      if (index !== -1) {
        prestadores[index] = { ...dadosPrestador, id, updated_at: new Date().toISOString() };
        localStorageFallback.set(TABLES.PRESTADORES, prestadores);
      }
      
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
      const { error: prestadorError } = await supabase
        .from(TABLES.PRESTADORES)
        .update(dadosPrestador)
        .eq('id', id);
      
      if (prestadorError) throw prestadorError;
      
      const { error: deleteError } = await supabase
        .from('prestador_especialidade')
        .delete()
        .eq('prestador_id', id);
      
      if (deleteError) throw deleteError;
      
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
      let relacoes = localStorageFallback.get('prestador_especialidade') || [];
      relacoes = relacoes.filter(rel => rel.prestador_id !== id);
      localStorageFallback.set('prestador_especialidade', relacoes);
      
      const data = localStorageFallback.get(TABLES.PRESTADORES);
      const filtered = data.filter(item => item.id !== id);
      localStorageFallback.set(TABLES.PRESTADORES, filtered);
      return true;
    }
    try {
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

  async seed() {
    const especialidadesList = [
      { nome: 'Clínica Médica', cbos: '225125', codigo_ans: '06' },
      { nome: 'Cardiologia', cbos: '225135', codigo_ans: '06' },
      { nome: 'Pediatria', cbos: '225140', codigo_ans: '06' },
      { nome: 'Ginecologia', cbos: '225145', codigo_ans: '06' },
      { nome: 'Obstetrícia', cbos: '225150', codigo_ans: '06' },
      { nome: 'Ortopedia', cbos: '225155', codigo_ans: '06' },
      { nome: 'Neurologia', cbos: '225170', codigo_ans: '06' },
      { nome: 'Psiquiatria', cbos: '225175', codigo_ans: '06' },
      { nome: 'Fisioterapia', cbos: '223605', codigo_ans: '03' },
      { nome: 'Fonoaudiologia', cbos: '223610', codigo_ans: '03' },
      { nome: 'Terapia Ocupacional', cbos: '223615', codigo_ans: '03' },
      { nome: 'Psicomotricidade', cbos: '223605', codigo_ans: '03' },
      { nome: 'Musicoterapia', cbos: '223610', codigo_ans: '03' },
      { nome: 'Gerontologia', cbos: '223615', codigo_ans: '03' },
      { nome: 'Nutrição', cbos: '223405', codigo_ans: '10' },
      { nome: 'Psicologia', cbos: '251510', codigo_ans: '08' },
      { nome: 'Neuropsicologia', cbos: '251510', codigo_ans: '08' },
      { nome: 'Psicopedagogia', cbos: '251510', codigo_ans: '08' },
      { nome: 'Farmácia', cbos: '223205', codigo_ans: '05' },
      { nome: 'Biomedicina', cbos: '223305', codigo_ans: '09' },
      { nome: 'Enfermagem', cbos: '223505', codigo_ans: '04' },
      { nome: 'Odontologia Clínica', cbos: '223105', codigo_ans: '07' },
      { nome: 'Odontopediatria', cbos: '223110', codigo_ans: '07' },
      { nome: 'Ortodontia', cbos: '223115', codigo_ans: '07' },
      { nome: 'Pedagogia', cbos: null, codigo_ans: null },
      { nome: 'Educação Física', cbos: '224105', codigo_ans: '11' }
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
      // Preparar dados para inserção
      const { dados_adicionais, ...dadosBase } = procedimento;
      
      const dadosParaInserir = {
        codigo_tuss: dadosBase.codigo_tuss,
        nome: dadosBase.nome,
        tipo: dadosBase.tipo || 'PROCEDIMENTO',
        grupo: dadosBase.grupo || '',
        valor_sugerido: dadosBase.valor_sugerido || 0,
        tabela: dadosBase.tabela || 'TUSS',
        convenio_id: dadosBase.convenio_id || null,
        dados_adicionais: dados_adicionais || {},
        ativo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Inserindo procedimento:', dadosParaInserir);
      
      const { data, error } = await supabase
        .from(TABLES.PROCEDIMENTOS)
        .insert([dadosParaInserir])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao criar procedimento:', err);
      // Fallback para localStorage
      const data = localStorageFallback.get(TABLES.PROCEDIMENTOS);
      const newItem = { ...procedimento, id: Date.now() };
      localStorageFallback.set(TABLES.PROCEDIMENTOS, [...data, newItem]);
      return newItem;
    }
  },

  async atualizar(id, procedimento) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.PROCEDIMENTOS);
      const index = data.findIndex(item => item.id === id);
      if (index !== -1) {
        data[index] = { ...procedimento, id, updated_at: new Date().toISOString() };
        localStorageFallback.set(TABLES.PROCEDIMENTOS, data);
      }
      return { ...procedimento, id };
    }
    try {
      const { dados_adicionais, ...dadosBase } = procedimento;
      
      const dadosParaAtualizar = {
        codigo_tuss: dadosBase.codigo_tuss,
        nome: dadosBase.nome,
        tipo: dadosBase.tipo,
        grupo: dadosBase.grupo,
        valor_sugerido: dadosBase.valor_sugerido,
        valor_convenio: dadosBase.valor_convenio,
        tabela: dadosBase.tabela,
        convenio_id: dadosBase.convenio_id || null,
        dados_adicionais: dados_adicionais || {},
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from(TABLES.PROCEDIMENTOS)
        .update(dadosParaAtualizar)
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

// Serviço de Logs de Faturamento
export const logsFaturamentoService = {
  async listar(limite = 50) {
    if (!isSupabaseAvailable()) {
      return localStorageFallback.get(TABLES.LOGS_FATURAMENTO) || [];
    }
    try {
      const { data, error } = await supabase
        .from(TABLES.LOGS_FATURAMENTO)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limite);
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erro ao listar logs:', err);
      return localStorageFallback.get(TABLES.LOGS_FATURAMENTO) || [];
    }
  },

  async criar(log) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.LOGS_FATURAMENTO) || [];
      const newItem = { ...log, id: Date.now(), created_at: new Date().toISOString() };
      localStorageFallback.set(TABLES.LOGS_FATURAMENTO, [newItem, ...data]);
      return newItem;
    }
    try {
      const { data, error } = await supabase
        .from(TABLES.LOGS_FATURAMENTO)
        .insert([log])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao criar log:', err);
      return null;
    }
  }
};

// Serviço de Lotes de Faturamento
export const lotesFaturamentoService = {
  async listar() {
    if (!isSupabaseAvailable()) {
      return localStorageFallback.get(TABLES.LOTES_FATURAMENTO) || [];
    }
    try {
      const { data, error } = await supabase
        .from(TABLES.LOTES_FATURAMENTO)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erro ao listar lotes:', err);
      return localStorageFallback.get(TABLES.LOTES_FATURAMENTO) || [];
    }
  },

  async buscarPorNumeroLote(numeroLote) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.LOTES_FATURAMENTO) || [];
      return data.find(l => l.numero_lote === numeroLote);
    }
    try {
      const { data, error } = await supabase
        .from(TABLES.LOTES_FATURAMENTO)
        .select('*')
        .eq('numero_lote', numeroLote)
        .maybeSingle();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao buscar lote:', err);
      return null;
    }
  },

  async criar(lote) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.LOTES_FATURAMENTO) || [];
      const newItem = { ...lote, id: Date.now() };
      localStorageFallback.set(TABLES.LOTES_FATURAMENTO, [...data, newItem]);
      return newItem;
    }
    try {
      const { data, error } = await supabase
        .from(TABLES.LOTES_FATURAMENTO)
        .insert([lote])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao criar lote:', err);
      return null;
    }
  },

  async deletar(id) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.LOTES_FATURAMENTO) || [];
      const filtered = data.filter(item => item.id !== id);
      localStorageFallback.set(TABLES.LOTES_FATURAMENTO, filtered);
      return true;
    }
    try {
      const { error } = await supabase
        .from(TABLES.LOTES_FATURAMENTO)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Erro ao deletar lote:', err);
      return false;
    }
  }
};

// Serviço de Configurações
export const configuracoesService = {
  async buscar(chave) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.CONFIGURACOES) || [];
      return data.find(c => c.chave === chave);
    }
    try {
      const { data, error } = await supabase
        .from(TABLES.CONFIGURACOES)
        .select('*')
        .eq('chave', chave)
        .maybeSingle();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao buscar configuração:', err);
      return null;
    }
  },

  async salvar(chave, valor, descricao = '') {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.CONFIGURACOES) || [];
      const existingIndex = data.findIndex(c => c.chave === chave);
      const configItem = { chave, valor, descricao, updated_at: new Date().toISOString() };
      
      if (existingIndex !== -1) {
        data[existingIndex] = configItem;
      } else {
        data.push(configItem);
      }
      localStorageFallback.set(TABLES.CONFIGURACOES, data);
      return configItem;
    }
    try {
      const { data, error } = await supabase
        .from(TABLES.CONFIGURACOES)
        .upsert([{ chave, valor, descricao, updated_at: new Date().toISOString() }], { onConflict: 'chave' })
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao salvar configuração:', err);
      return null;
    }
  },

  async buscarMultiplas(chaves) {
    if (!isSupabaseAvailable()) {
      const data = localStorageFallback.get(TABLES.CONFIGURACOES) || [];
      return data.filter(c => chaves.includes(c.chave));
    }
    try {
      const { data, error } = await supabase
        .from(TABLES.CONFIGURACOES)
        .select('*')
        .in('chave', chaves);
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erro ao buscar configurações:', err);
      return [];
    }
  }
};

// Função para inicializar dados padrão
export const inicializarDadosPadrao = async () => {
  try {
    await especialidadesService.seed();
    
    const versaoExists = await configuracoesService.buscar('versao_tiss');
    if (!versaoExists) {
      await configuracoesService.salvar('versao_tiss', '4.03.00', 'Versão padrão do TISS');
    }
    
    const sequencialExists = await configuracoesService.buscar('sequencial_faturamento');
    if (!sequencialExists) {
      await configuracoesService.salvar('sequencial_faturamento', '1', 'Sequencial para faturamento TISS');
    }
    
    const bloqueadosExists = await configuracoesService.buscar('guias_bloqueadas');
    if (!bloqueadosExists) {
      await configuracoesService.salvar('guias_bloqueadas', '[]', 'Lista de guias bloqueadas para faturamento');
    }
    
    console.log('Dados padrão inicializados com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar dados padrão:', error);
  }
};
