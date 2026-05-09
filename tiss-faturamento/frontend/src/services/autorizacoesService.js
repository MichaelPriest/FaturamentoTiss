// src/services/autorizacoesService.js
import { supabase } from '../lib/supabaseClient';

export const autorizacoesService = {
  // Listar atendimentos com itens pendentes de autorização
  async listarPendentes(filtros = {}) {
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
        itens,
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

    const { data, error } = await query;
    if (error) throw error;

    // Filtrar atendimentos que têm itens pendentes de autorização
    const pendentes = data.filter(atendimento => {
      const itensExecutados = atendimento.itens || [];
      const itensAutorizados = atendimento.itens_autorizados || [];
      
      // Verificar se há itens executados sem autorização
      const temPendente = itensExecutados.some(itemExecutado => {
        const autorizado = itensAutorizados.find(aut => aut.codigo === itemExecutado.codigo);
        return !autorizado;
      });
      
      return temPendente;
    });

    // Aplicar filtros adicionais
    let resultado = pendentes;
    if (filtros.status && filtros.status !== 'todos') {
      resultado = resultado.filter(a => a.status === filtros.status);
    }
    if (filtros.paciente_id) {
      resultado = resultado.filter(a => a.paciente_id === parseInt(filtros.paciente_id));
    }
    if (filtros.convenio_id) {
      resultado = resultado.filter(a => a.paciente_convenio_id === parseInt(filtros.convenio_id));
    }
    if (filtros.numero_guia) {
      resultado = resultado.filter(a => a.numero_guia_prestador === filtros.numero_guia);
    }

    return resultado.map(item => ({
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
      itens_pendentes: this.getItensPendentes(item.itens, item.itens_autorizados)
    }));
  },

  // Buscar atendimento por ID com itens pendentes
  async buscarPorId(id) {
    const { data, error } = await supabase
      .from('atendimentos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    
    return {
      ...data,
      itens_pendentes: this.getItensPendentes(data.itens, data.itens_autorizados)
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
    
    if (data) {
      return {
        ...data,
        itens_pendentes: this.getItensPendentes(data.itens, data.itens_autorizados)
      };
    }
    return data;
  },

  // Obter itens pendentes de autorização
  getItensPendentes(itensExecutados, itensAutorizados) {
    const executados = itensExecutados || [];
    const autorizados = itensAutorizados || [];
    
    return executados.filter(itemExecutado => {
      const autorizado = autorizados.find(aut => aut.codigo === itemExecutado.codigo);
      // Item está pendente se não tem autorização OU quantidade autorizada insuficiente
      if (!autorizado) return true;
      
      const qtdAutorizada = autorizado.quantidade_autorizada || 0;
      const qtdUtilizada = autorizado.quantidade_utilizada || 0;
      const qtdExecutada = itemExecutado.quantidade || 1;
      
      return qtdAutorizada < qtdExecutada;
    }).map(item => ({
      ...item,
      pendente_autorizacao: true,
      quantidade_autorizada_sugerida: item.quantidade || 1,
      ja_autorizado: false
    }));
  },

  // Autorizar itens específicos
  async autorizarItens(atendimentoId, itensAutorizados) {
    // Buscar atendimento atual
    const { data: atendimento, error: fetchError } = await supabase
      .from('atendimentos')
      .select('itens_autorizados, status, itens')
      .eq('id', atendimentoId)
      .single();

    if (fetchError) throw fetchError;

    const itensExistentes = atendimento.itens_autorizados || [];
    const itensExecutados = atendimento.itens || [];
    
    // Mesclar itens autorizados (atualizar quantidades ou adicionar novos)
    const itensMesclados = [...itensExistentes];
    
    for (const novoItem of itensAutorizados) {
      const indiceExistente = itensMesclados.findIndex(item => item.codigo === novoItem.codigo);
      
      if (indiceExistente >= 0) {
        // Atualizar existente - somar quantidade autorizada
        const qtdAtual = itensMesclados[indiceExistente].quantidade_autorizada || 0;
        itensMesclados[indiceExistente] = {
          ...itensMesclados[indiceExistente],
          quantidade_autorizada: qtdAtual + novoItem.quantidade_autorizada,
          valor_total: (qtdAtual + novoItem.quantidade_autorizada) * novoItem.valor_unitario,
          data_autorizacao: novoItem.data_autorizacao || new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        };
      } else {
        // Adicionar novo
        itensMesclados.push({
          ...novoItem,
          id: Date.now(),
          quantidade_utilizada: 0,
          created_at: new Date().toISOString()
        });
      }
    }

    // Calcular novo status do atendimento
    let todosAutorizados = true;
    for (const itemExecutado of itensExecutados) {
      const autorizado = itensMesclados.find(aut => aut.codigo === itemExecutado.codigo);
      const qtdExecutada = itemExecutado.quantidade || 1;
      const qtdAutorizada = autorizado?.quantidade_autorizada || 0;
      
      if (qtdAutorizada < qtdExecutada) {
        todosAutorizados = false;
        break;
      }
    }
    
    const novoStatus = todosAutorizados ? 'autorizado' : 'parcial';

    // Atualizar o atendimento
    const { data, error } = await supabase
      .from('atendimentos')
      .update({
        itens_autorizados: itensMesclados,
        status: novoStatus,
        data_autorizacao: itensAutorizados[0]?.data_autorizacao || new Date().toISOString().split('T')[0],
        data_validade_senha: itensAutorizados[0]?.data_validade_senha,
        senha_autorizacao: itensAutorizados[0]?.senha_autorizacao,
        updated_at: new Date().toISOString()
      })
      .eq('id', atendimentoId)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Estatísticas de autorizações pendentes
  async getEstatisticas() {
    const { data, error } = await supabase
      .from('atendimentos')
      .select('status, valor_total, itens, itens_autorizados');

    if (error) throw error;

    let pendentes = 0;
    let autorizados = 0;
    let parciais = 0;
    let faturados = 0;
    let finalizados = 0;
    let valorTotalPendente = 0;

    for (const item of data) {
      const itensExecutados = item.itens || [];
      const itensAutorizados = item.itens_autorizados || [];
      
      // Verificar se tem itens pendentes
      const temPendente = itensExecutados.some(executado => {
        const autorizado = itensAutorizados.find(aut => aut.codigo === executado.codigo);
        const qtdExecutada = executado.quantidade || 1;
        const qtdAutorizada = autorizado?.quantidade_autorizada || 0;
        return !autorizado || qtdAutorizada < qtdExecutada;
      });

      if (temPendente) {
        pendentes++;
        valorTotalPendente += item.valor_total || 0;
      } else if (item.status === 'autorizado') {
        autorizados++;
      } else if (item.status === 'parcial') {
        parciais++;
      } else if (item.status === 'faturado') {
        faturados++;
      } else if (item.status === 'finalizado') {
        finalizados++;
      }
    }

    return { pendentes, autorizados, parciais, faturados, finalizados, valorTotalPendente, total: data.length };
  }
};
