// src/services/autorizacoesService.js
import { supabase } from '../lib/supabaseClient';

export const autorizacoesService = {
  // Listar todas as autorizações
  async listar(filtros = {}) {
    let query = supabase
      .from('autorizacoes')
      .select(`
        *,
        paciente:paciente_id(id, nome, numero_carteira, cpf),
        convenio:convenio_id(id, razao_social, registro_ans, codigo_prestador)
      `)
      .order('created_at', { ascending: false });

    if (filtros.status) query = query.eq('status', filtros.status);
    if (filtros.paciente_id) query = query.eq('paciente_id', filtros.paciente_id);
    if (filtros.convenio_id) query = query.eq('convenio_id', filtros.convenio_id);
    if (filtros.data_inicio) query = query.gte('data_autorizacao', filtros.data_inicio);
    if (filtros.data_fim) query = query.lte('data_autorizacao', filtros.data_fim);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Buscar autorização por ID
  async buscarPorId(id) {
    const { data, error } = await supabase
      .from('autorizacoes')
      .select(`
        *,
        paciente:paciente_id(id, nome, numero_carteira, cpf, data_nascimento),
        convenio:convenio_id(id, razao_social, registro_ans, codigo_prestador),
        itens_autorizados:itens_autorizacao(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Buscar autorização por número da guia
  async buscarPorNumeroGuia(numeroGuia) {
    const { data, error } = await supabase
      .from('autorizacoes')
      .select('*')
      .eq('numero_guia_operadora', numeroGuia)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Criar nova autorização
  async criar(autorizacao) {
    const { data, error } = await supabase
      .from('autorizacoes')
      .insert([{
        ...autorizacao,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'ativa'
      }])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Atualizar autorização
  async atualizar(id, autorizacao) {
    const { data, error } = await supabase
      .from('autorizacoes')
      .update({
        ...autorizacao,
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
      .from('autorizacoes')
      .update({
        status: 'cancelada',
        motivo_cancelamento: motivo,
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
      .from('autorizacoes')
      .update({
        data_validade_senha: novaDataValidade,
        senha_autorizacao: novaSenha,
        status: 'ativa',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Adicionar item à autorização
  async adicionarItem(autorizacaoId, item) {
    const { data, error } = await supabase
      .from('itens_autorizacao')
      .insert([{
        autorizacao_id: autorizacaoId,
        ...item,
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Atualizar item da autorização
  async atualizarItem(itemId, item) {
    const { data, error } = await supabase
      .from('itens_autorizacao')
      .update({
        ...item,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Remover item da autorização
  async removerItem(itemId) {
    const { error } = await supabase
      .from('itens_autorizacao')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
    return true;
  },

  // Listar itens de uma autorização
  async listarItens(autorizacaoId) {
    const { data, error } = await supabase
      .from('itens_autorizacao')
      .select('*')
      .eq('autorizacao_id', autorizacaoId)
      .order('created_at');

    if (error) throw error;
    return data;
  },

  // Verificar saldo disponível de um item
  async verificarSaldo(autorizacaoId, itemCodigo) {
    const { data, error } = await supabase
      .from('itens_autorizacao')
      .select('quantidade_autorizada, quantidade_utilizada')
      .eq('autorizacao_id', autorizacaoId)
      .eq('codigo', itemCodigo)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    if (!data) return 0;
    return (data.quantidade_autorizada || 0) - (data.quantidade_utilizada || 0);
  },

  // Consumir saldo (usar um item autorizado)
  async consumirSaldo(autorizacaoId, itemCodigo, quantidade) {
    const item = await this.verificarSaldo(autorizacaoId, itemCodigo);
    if (item < quantidade) {
      throw new Error('Saldo insuficiente para este procedimento');
    }

    const { data, error } = await supabase
      .from('itens_autorizacao')
      .update({
        quantidade_utilizada: supabase.raw('quantidade_utilizada + ?', [quantidade]),
        updated_at: new Date().toISOString()
      })
      .eq('autorizacao_id', autorizacaoId)
      .eq('codigo', itemCodigo)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Estatísticas de autorizações
  async getEstatisticas() {
    const { data, error } = await supabase
      .from('autorizacoes')
      .select('status, valor_total, data_autorizacao');

    if (error) throw error;

    const ativas = data.filter(a => a.status === 'ativa').length;
    const expiradas = data.filter(a => a.status === 'expirada').length;
    const canceladas = data.filter(a => a.status === 'cancelada').length;
    const valorTotal = data.reduce((sum, a) => sum + (a.valor_total || 0), 0);

    return { ativas, expiradas, canceladas, valorTotal, total: data.length };
  },

  // Buscar autorizações próximas ao vencimento
  async getProximasVencer(dias = 7) {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + dias);

    const { data, error } = await supabase
      .from('autorizacoes')
      .select(`
        *,
        paciente:paciente_id(id, nome, numero_carteira)
      `)
      .eq('status', 'ativa')
      .lte('data_validade_senha', dataLimite.toISOString().split('T')[0])
      .gte('data_validade_senha', new Date().toISOString().split('T')[0])
      .order('data_validade_senha', { ascending: true });

    if (error) throw error;
    return data;
  }
};
