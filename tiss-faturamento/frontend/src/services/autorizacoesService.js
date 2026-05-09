// src/services/autorizacoesService.js
import { supabase } from '../lib/supabaseClient';

export const autorizacoesService = {
  // Listar todas as autorizações (buscar da tabela atendimentos onde itens_autorizados não está vazio)
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
      .not('itens_autorizados', 'is', null)
      .order('created_at', { ascending: false });

    if (filtros.status) query = query.eq('status', filtros.status);
    if (filtros.paciente_id) query = query.eq('paciente_id', filtros.paciente_id);
    if (filtros.convenio_id) query = query.eq('paciente_convenio_id', filtros.convenio_id);

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
      itens: item.itens_autorizados || [],
      status: item.status === 'finalizado' ? 'expirada' : 
              item.status === 'faturado' ? 'expirada' :
              item.status === 'cancelado' ? 'cancelada' :
              item.status === 'pendente' ? 'ativa' : 'ativa'
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
      itens: data.itens_autorizados || [],
      status: data.status === 'finalizado' ? 'expirada' : 
              data.status === 'faturado' ? 'expirada' :
              data.status === 'cancelado' ? 'cancelada' : 'ativa'
    };
  },

  // Criar nova autorização (como um atendimento)
  async criar(autorizacao) {
    const autorizacaoData = {
      numero_guia_operadora: autorizacao.numero_guia_operadora,
      data_autorizacao: autorizacao.data_autorizacao,
      data_validade_senha: autorizacao.data_validade_senha,
      senha_autorizacao: autorizacao.senha_autorizacao,
      observacao: autorizacao.observacao,
      itens_autorizados: autorizacao.itens,
      valor_total: autorizacao.valor_total,
      paciente_id: autorizacao.paciente_id,
      paciente_nome: autorizacao.paciente_nome,
      numero_carteira: autorizacao.numero_carteira,
      paciente_convenio_id: autorizacao.convenio_id,
      paciente_convenio_nome: autorizacao.convenio_nome,
      convenio_registro_ans: autorizacao.convenio_registro_ans,
      convenio_codigo_prestador: autorizacao.convenio_codigo_prestador,
      status: 'pendente',
      data_solicitacao: autorizacao.data_autorizacao,
      carater_atendimento: '1',
      tipo_atendimento: '04',
      regime_atendimento: '01',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('atendimentos')
      .insert([autorizacaoData])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Atualizar autorização
  async atualizar(id, autorizacao) {
    const { data, error } = await supabase
      .from('atendimentos')
      .update({
        numero_guia_operadora: autorizacao.numero_guia_operadora,
        data_autorizacao: autorizacao.data_autorizacao,
        data_validade_senha: autorizacao.data_validade_senha,
        senha_autorizacao: autorizacao.senha_autorizacao,
        observacao: autorizacao.observacao,
        itens_autorizados: autorizacao.itens,
        valor_total: autorizacao.valor_total,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Cancelar autorização
  async cancelar(id, motivo) {
    const { data, error } = await supabase
      .from('atendimentos')
      .update({
        status: 'cancelado',
        observacao: `Cancelado: ${motivo}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Renovar autorização
  async renovar(id, novaDataValidade, novaSenha) {
    const { data, error } = await supabase
      .from('atendimentos')
      .update({
        data_validade_senha: novaDataValidade,
        senha_autorizacao: novaSenha,
        status: 'pendente',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Estatísticas de autorizações
  async getEstatisticas() {
    const { data, error } = await supabase
      .from('atendimentos')
      .select('status, valor_total, data_validade_senha, itens_autorizados')
      .not('itens_autorizados', 'is', null);

    if (error) throw error;

    const hoje = new Date();
    const ativas = data.filter(a => a.status === 'pendente' || a.status === 'parcial').length;
    const expiradas = data.filter(a => {
      if (a.status === 'finalizado' || a.status === 'faturado') return true;
      if (a.data_validade_senha && new Date(a.data_validade_senha) < hoje) return true;
      return false;
    }).length;
    const canceladas = data.filter(a => a.status === 'cancelado').length;
    const valorTotal = data.reduce((sum, a) => sum + (a.valor_total || 0), 0);
    
    const proximasVencer = data.filter(a => {
      if (a.status !== 'pendente' && a.status !== 'parcial') return false;
      if (!a.data_validade_senha) return false;
      const diasRestantes = Math.ceil((new Date(a.data_validade_senha) - hoje) / (1000 * 60 * 60 * 24));
      return diasRestantes >= 0 && diasRestantes <= 7;
    }).length;

    return { ativas, expiradas, canceladas, valorTotal, proximasVencer, total: data.length };
  }
};
