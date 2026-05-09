// src/services/autorizacoesService.js
import { supabase } from '../lib/supabaseClient';

export const autorizacoesService = {
  // Listar todas as autorizações (buscar da tabela atendimentos)
  async listar(filtros = {}) {
    let query = supabase
      .from('atendimentos')
      .select(`
        id,
        numero_guia_prestador,
        numero_guia_operadora,
        data_autorizacao,
        data_validade_senha,
        senha_autorizacao,
        observacao,
        status,
        valor_total,
        itens_autorizados,
        paciente_id,
        paciente_nome,
        numero_carteira,
        paciente_convenio_id,
        paciente_convenio_nome,
        convenio_registro_ans,
        convenio_codigo_prestador,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (filtros.status && filtros.status !== 'todos') {
      query = query.eq('status', filtros.status);
    }
    if (filtros.paciente_id) {
      query = query.eq('paciente_id', filtros.paciente_id);
    }
    if (filtros.convenio_id) {
      query = query.eq('paciente_convenio_id', filtros.convenio_id);
    }
    if (filtros.numero_guia) {
      query = query.eq('numero_guia_prestador', filtros.numero_guia);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    // Transformar os dados para o formato esperado
    return data.map(item => ({
      ...item,
      convenio: {
        id: item.paciente_convenio_id,
        razao_social: item.paciente_convenio_nome,
        registro_ans: item.convenio_registro_ans,
        codigo_prestador: item.convenio_codigo_prestador
      },
      paciente: {
        id: item.paciente_id,
        nome: item.paciente_nome,
        numero_carteira: item.numero_carteira
      },
      itens: item.itens_autorizados || []
    }));
  },

  // Buscar autorização por ID
  async buscarPorId(id) {
    const { data, error } = await supabase
      .from('atendimentos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    
    return {
      ...data,
      itens: data.itens_autorizados || []
    };
  },

  // Buscar atendimento por número de guia
  async buscarPorNumeroGuia(numeroGuia) {
    const { data, error } = await supabase
      .from('atendimentos')
      .select('*')
      .eq('numero_guia_prestador', numeroGuia)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Adicionar autorização a um atendimento existente
  async adicionarAutorizacao(atendimentoId, autorizacao) {
    // Primeiro buscar o atendimento existente
    const { data: atendimento, error: fetchError } = await supabase
      .from('atendimentos')
      .select('itens_autorizados, status')
      .eq('id', atendimentoId)
      .single();

    if (fetchError) throw fetchError;

    // Mesclar itens autorizados existentes com os novos
    const itensExistentes = atendimento.itens_autorizados || [];
    const novosItens = autorizacao.itens || [];
    
    // Verificar se algum item já existe (pelo código)
    const itensMesclados = [...itensExistentes];
    for (const novoItem of novosItens) {
      const existe = itensMesclados.some(item => item.codigo === novoItem.codigo);
      if (!existe) {
        itensMesclados.push(novoItem);
      }
    }

    // Calcular novo status baseado nos itens autorizados
    let novoStatus = 'pendente';
    if (itensMesclados.length > 0) {
      const todosAutorizados = itensMesclados.every(item => !item.pendente_autorizacao);
      const algumAutorizado = itensMesclados.some(item => !item.pendente_autorizacao);
      
      if (todosAutorizados && itensMesclados.length > 0) {
        novoStatus = 'autorizado';
      } else if (algumAutorizado && !todosAutorizados) {
        novoStatus = 'parcial';
      } else {
        novoStatus = 'pendente';
      }
    }

    // Atualizar o atendimento com os novos itens autorizados
    const { data, error } = await supabase
      .from('atendimentos')
      .update({
        itens_autorizados: itensMesclados,
        status: novoStatus,
        data_autorizacao: autorizacao.data_autorizacao || new Date().toISOString().split('T')[0],
        data_validade_senha: autorizacao.data_validade_senha,
        senha_autorizacao: autorizacao.senha_autorizacao,
        observacao: autorizacao.observacao,
        updated_at: new Date().toISOString()
      })
      .eq('id', atendimentoId)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Atualizar status da autorização
  async atualizarStatus(atendimentoId, novoStatus) {
    const { data, error } = await supabase
      .from('atendimentos')
      .update({
        status: novoStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', atendimentoId)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Atualizar itens autorizados
  async atualizarItensAutorizados(atendimentoId, itensAutorizados) {
    // Calcular status baseado nos itens
    let novoStatus = 'pendente';
    if (itensAutorizados.length > 0) {
      const todosAutorizados = itensAutorizados.every(item => !item.pendente_autorizacao);
      const algumAutorizado = itensAutorizados.some(item => !item.pendente_autorizacao);
      
      if (todosAutorizados && itensAutorizados.length > 0) {
        novoStatus = 'autorizado';
      } else if (algumAutorizado && !todosAutorizados) {
        novoStatus = 'parcial';
      }
    }

    const { data, error } = await supabase
      .from('atendimentos')
      .update({
        itens_autorizados: itensAutorizados,
        status: novoStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', atendimentoId)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Estatísticas de autorizações
  async getEstatisticas() {
    const { data, error } = await supabase
      .from('atendimentos')
      .select('status, valor_total');

    if (error) throw error;

    const pendentes = data.filter(a => a.status === 'pendente').length;
    const autorizados = data.filter(a => a.status === 'autorizado').length;
    const parciais = data.filter(a => a.status === 'parcial').length;
    const faturados = data.filter(a => a.status === 'faturado').length;
    const finalizados = data.filter(a => a.status === 'finalizado').length;
    const valorTotal = data.reduce((sum, a) => sum + (a.valor_total || 0), 0);

    return { pendentes, autorizados, parciais, faturados, finalizados, valorTotal, total: data.length };
  }
};
