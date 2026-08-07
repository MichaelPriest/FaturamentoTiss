// src/pages/Autorizacoes.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusIcon, PencilIcon, MagnifyingGlassIcon, 
  CheckIcon, XMarkIcon, EyeIcon, DocumentPlusIcon,
  CurrencyDollarIcon, CalendarIcon,
  ClockIcon, ExclamationTriangleIcon, 
  ArrowPathIcon, BuildingOfficeIcon,
  ChevronUpIcon, ChevronDownIcon, TrashIcon,
  KeyIcon, ShieldCheckIcon, UserCircleIcon,
  IdentificationIcon, CreditCardIcon,
  CalendarDaysIcon, CubeIcon, ListBulletIcon,
  CheckBadgeIcon, XCircleIcon, CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { supabase } from '../lib/supabaseClient';
import { useUnidade } from '../contexts/UnidadeContext';
import { filterByUnidade } from '../services/unidadesService';
import {
  consultarStatusAutorizacaoOrizon,
  solicitarAutorizacaoProcedimentoOrizon
} from '../services/orizonWebservice';

const STATUS_AUTORIZACAO = [
  { value: 'pendente', label: 'Sem Autorização', cor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icone: ClockIcon },
  { value: 'parcial', label: 'Parcialmente Autorizada', cor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icone: ExclamationTriangleIcon },
  { value: 'autorizado', label: 'Autorizada', cor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icone: CheckBadgeIcon },
  { value: 'faturado', label: 'Faturado', cor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icone: CurrencyDollarIcon },
  { value: 'finalizado', label: 'Finalizado', cor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icone: ShieldCheckIcon }
];

const SELECT_ATENDIMENTOS_BASE = `
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
  updated_at,
  unidade_id
`;

const SELECT_ATENDIMENTOS_WS = `
  ${SELECT_ATENDIMENTOS_BASE},
  protocolo_autorizacao,
  status_autorizacao_ws,
  integracao_autorizacao
`;

function erroColunaIntegracaoAusente(error) {
  const texto = `${error?.code || ''} ${error?.message || ''} ${error?.details || ''}`;
  return /protocolo_autorizacao|status_autorizacao_ws|integracao_autorizacao|schema cache|Could not find|column/i.test(texto);
}

export default function Autorizacoes() {
  const { unidadeAtualId } = useUnidade();
  const [autorizacoes, setAutorizacoes] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [convenios, setConvenios] = useState([]);
  const [procedimentos, setProcedimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showItensModal, setShowItensModal] = useState(false);
  const [selectedAutorizacao, setSelectedAutorizacao] = useState(null);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroConvenio, setFiltroConvenio] = useState('todos');
  const [expandedItems, setExpandedItems] = useState({});
  const [buscaNumeroGuia, setBuscaNumeroGuia] = useState('');
  const [atendimentoEncontrado, setAtendimentoEncontrado] = useState(null);
  const [buscandoAtendimento, setBuscandoAtendimento] = useState(false);
  const [enviandoWebserviceId, setEnviandoWebserviceId] = useState(null);
  const [consultandoWebserviceId, setConsultandoWebserviceId] = useState(null);
  const [quantidadesAutorizar, setQuantidadesAutorizar] = useState({});
  
  const [dadosAutorizacao, setDadosAutorizacao] = useState({
    numero_guia_operadora: '',
    data_autorizacao: new Date().toISOString().split('T')[0],
    data_validade_senha: '',
    senha_autorizacao: ''
  });
  
  const [itensAutorizacao, setItensAutorizacao] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    codigo: '',
    nome: '',
    quantidade_autorizada: 1,
    valor_unitario: 0
  });
  const [searchItemTerm, setSearchItemTerm] = useState('');
  const [editandoItemId, setEditandoItemId] = useState(null);

  useEffect(() => {
    carregarDados();
  }, [unidadeAtualId]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [autorizacoesData, pacientesData, conveniosData, procedimentosData] = await Promise.all([
        listarAtendimentosComPendentes(),
        supabase.from('pacientes').select('*').order('nome'),
        supabase.from('convenios').select('*').order('razao_social'),
        supabase.from('procedimentos').select('*').order('codigo_tuss')
      ]);

      setAutorizacoes(filterByUnidade(autorizacoesData, unidadeAtualId));
      // Pacientes são compartilhados por empresa; o RLS já limita a empresa atual.
      setPacientes(pacientesData.data || []);
      setConvenios(filterByUnidade(conveniosData.data || [], unidadeAtualId));
      setProcedimentos(filterByUnidade(procedimentosData.data || [], unidadeAtualId));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const listarAtendimentosComPendentes = async () => {
    let { data, error } = await supabase
      .from('atendimentos')
      .select(SELECT_ATENDIMENTOS_WS)
      .order('created_at', { ascending: false });

    if (error && erroColunaIntegracaoAusente(error)) {
      console.warn('Colunas de integração de autorização ainda não aplicadas; carregando autorizações sem metadados WS.', error);
      const fallback = await supabase
        .from('atendimentos')
        .select(SELECT_ATENDIMENTOS_BASE)
        .order('created_at', { ascending: false });
      data = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;

    return filterByUnidade(data || [], unidadeAtualId).map(item => {
      const itensExecutados = item.itens || [];
      const itensAutorizadosList = item.itens_autorizados || [];
      
      const itensPendentes = itensExecutados.filter(executado => {
        const autorizado = itensAutorizadosList.find(aut => aut.codigo === executado.codigo);
        const qtdExecutada = executado.quantidade || 1;
        const qtdAutorizada = autorizado?.quantidade_autorizada || 0;
        return !autorizado || qtdAutorizada < qtdExecutada;
      }).map(executado => {
        const autorizado = itensAutorizadosList.find(aut => aut.codigo === executado.codigo);
        const qtdExecutada = executado.quantidade || 1;
        const qtdAutorizada = autorizado?.quantidade_autorizada || 0;
        
        return {
          id: executado.id || `${executado.codigo}_${Date.now()}`,
          codigo: executado.codigo,
          nome: executado.nome,
          quantidade_executada: qtdExecutada,
          quantidade_autorizada: qtdAutorizada,
          quantidade_necessaria: qtdExecutada - qtdAutorizada,
          valor_unitario: executado.valor_unitario || 0,
          precisa_autorizar: true
        };
      });

      return {
        ...item,
        paciente: {
          id: item.paciente_id,
          nome: item.paciente_nome,
          numero_carteira: item.numero_carteira
        },
        itens_pendentes: itensPendentes,
        itens_autorizados_list: itensAutorizadosList
      };
    });
  };

  const handleBuscarAtendimento = async () => {
    if (!buscaNumeroGuia) {
      toast.error('Digite o número da guia');
      return;
    }
    
    setBuscandoAtendimento(true);
    try {
      const { data, error } = await supabase
        .from('atendimentos')
        .select('*')
        .eq('numero_guia_prestador', buscaNumeroGuia)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data || filterByUnidade([data], unidadeAtualId).length === 0) {
        toast.error('Guia não encontrada nesta unidade');
        setAtendimentoEncontrado(null);
        return;
      }
      
      const itensExecutados = data.itens || [];
      const itensAutorizadosList = data.itens_autorizados || [];
      
      const itensPendentes = itensExecutados.filter(executado => {
        const autorizado = itensAutorizadosList.find(aut => aut.codigo === executado.codigo);
        const qtdExecutada = executado.quantidade || 1;
        const qtdAutorizada = autorizado?.quantidade_autorizada || 0;
        return !autorizado || qtdAutorizada < qtdExecutada;
      }).map(executado => {
        const autorizado = itensAutorizadosList.find(aut => aut.codigo === executado.codigo);
        const qtdExecutada = executado.quantidade || 1;
        const qtdAutorizada = autorizado?.quantidade_autorizada || 0;
        
        return {
          id: executado.id || `${executado.codigo}_${Date.now()}`,
          codigo: executado.codigo,
          nome: executado.nome,
          quantidade_executada: qtdExecutada,
          quantidade_autorizada: qtdAutorizada,
          quantidade_necessaria: qtdExecutada - qtdAutorizada,
          valor_unitario: executado.valor_unitario || 0,
          precisa_autorizar: true
        };
      });
      
      setAtendimentoEncontrado({
        ...data,
        itens_pendentes: itensPendentes,
        itens_autorizados_list: itensAutorizadosList
      });
      
      // Inicializar quantidades para autorização
      const quantidadesIniciais = {};
      itensPendentes.forEach(item => {
        quantidadesIniciais[item.id] = item.quantidade_necessaria;
      });
      setQuantidadesAutorizar(quantidadesIniciais);
      
      if (data.numero_guia_operadora || data.data_autorizacao || data.senha_autorizacao) {
        setDadosAutorizacao({
          numero_guia_operadora: data.numero_guia_operadora || '',
          data_autorizacao: data.data_autorizacao || new Date().toISOString().split('T')[0],
          data_validade_senha: data.data_validade_senha || '',
          senha_autorizacao: data.senha_autorizacao || ''
        });
      } else {
        setDadosAutorizacao({
          numero_guia_operadora: '',
          data_autorizacao: new Date().toISOString().split('T')[0],
          data_validade_senha: '',
          senha_autorizacao: ''
        });
      }
      
      setItensAutorizacao(itensAutorizadosList);
      toast.success(`Guia encontrada: ${data.paciente_nome}`);
    } catch (error) {
      console.error('Erro ao buscar guia:', error);
      toast.error('Erro ao buscar guia');
    } finally {
      setBuscandoAtendimento(false);
    }
  };

  const handleQuantidadeChange = (itemId, valor, maxQuantidade) => {
    let novaQuantidade = parseInt(valor) || 0;
    if (novaQuantidade > maxQuantidade) novaQuantidade = maxQuantidade;
    if (novaQuantidade < 0) novaQuantidade = 0;
    
    setQuantidadesAutorizar(prev => ({
      ...prev,
      [itemId]: novaQuantidade
    }));
  };

  const handleAdicionarItemPendente = (itemPendente) => {
    if (itemPendente.quantidade_autorizar <= 0) {
      toast.warning('Informe uma quantidade válida');
      return;
    }
    
    const itemExistente = itensAutorizacao.find(item => item.codigo === itemPendente.codigo);
    
    if (itemExistente) {
      const novaQuantidade = itemExistente.quantidade_autorizada + itemPendente.quantidade_autorizar;
      setItensAutorizacao(itensAutorizacao.map(item => 
        item.codigo === itemPendente.codigo 
          ? {
              ...item,
              quantidade_autorizada: novaQuantidade,
              valor_total: novaQuantidade * item.valor_unitario,
              updated_at: new Date().toISOString()
            }
          : item
      ));
      toast.success(`Quantidade autorizada atualizada para ${novaQuantidade}`);
    } else {
      const novoItem = {
        id: Date.now(),
        codigo: itemPendente.codigo,
        nome: itemPendente.nome,
        quantidade_autorizada: itemPendente.quantidade_autorizar,
        quantidade_utilizada: 0,
        valor_unitario: itemPendente.valor_unitario,
        valor_total: itemPendente.valor_unitario * itemPendente.quantidade_autorizar,
        pendente_autorizacao: false,
        created_at: new Date().toISOString()
      };
      setItensAutorizacao([...itensAutorizacao, novoItem]);
      toast.success('Item adicionado!');
    }
    
    // Atualizar a quantidade pendente no objeto atendimentoEncontrado
    setAtendimentoEncontrado(prev => {
      if (!prev) return prev;
      const novosItensPendentes = prev.itens_pendentes.map(item => {
        if (item.id === itemPendente.id) {
          const novaNecessaria = item.quantidade_necessaria - itemPendente.quantidade_autorizar;
          return {
            ...item,
            quantidade_necessaria: novaNecessaria,
            quantidade_autorizada: item.quantidade_autorizada + itemPendente.quantidade_autorizar
          };
        }
        return item;
      }).filter(item => item.quantidade_necessaria > 0);
      
      return {
        ...prev,
        itens_pendentes: novosItensPendentes
      };
    });
    
    // Resetar a quantidade do input
    setQuantidadesAutorizar(prev => ({
      ...prev,
      [itemPendente.id]: 0
    }));
  };

  const handleBuscarProcedimento = (codigo) => {
    if (!codigo) return;
    
    const procedimento = procedimentos.find(p => p.codigo_tuss === codigo);
    if (procedimento) {
      setCurrentItem({
        codigo: procedimento.codigo_tuss,
        nome: procedimento.nome,
        quantidade_autorizada: 1,
        valor_unitario: procedimento.valor_convenio || procedimento.valor_sugerido || 0
      });
      setSearchItemTerm('');
    }
  };

  const handleAdicionarItem = () => {
    if (!currentItem.codigo) {
      toast.error('Selecione um procedimento');
      return;
    }

    const itemExistente = itensAutorizacao.find(item => item.codigo === currentItem.codigo);
    
    if (itemExistente) {
      const novaQuantidade = itemExistente.quantidade_autorizada + currentItem.quantidade_autorizada;
      setItensAutorizacao(itensAutorizacao.map(item => 
        item.codigo === currentItem.codigo 
          ? {
              ...item,
              quantidade_autorizada: novaQuantidade,
              valor_total: novaQuantidade * item.valor_unitario,
              updated_at: new Date().toISOString()
            }
          : item
      ));
      toast.success(`Quantidade autorizada atualizada para ${novaQuantidade}`);
    } else {
      const novoItem = {
        id: Date.now(),
        codigo: currentItem.codigo,
        nome: currentItem.nome,
        quantidade_autorizada: currentItem.quantidade_autorizada,
        quantidade_utilizada: 0,
        valor_unitario: currentItem.valor_unitario,
        valor_total: currentItem.valor_unitario * currentItem.quantidade_autorizada,
        pendente_autorizacao: false,
        created_at: new Date().toISOString()
      };
      setItensAutorizacao([...itensAutorizacao, novoItem]);
      toast.success('Item adicionado!');
    }

    setCurrentItem({
      codigo: '',
      nome: '',
      quantidade_autorizada: 1,
      valor_unitario: 0
    });
    setSearchItemTerm('');
  };

  const handleEditarItem = (item) => {
    setEditandoItemId(item.id);
    setCurrentItem({
      codigo: item.codigo,
      nome: item.nome,
      quantidade_autorizada: item.quantidade_autorizada,
      valor_unitario: item.valor_unitario
    });
  };

  const handleSalvarEdicao = () => {
    if (!currentItem.codigo) return;
    
    setItensAutorizacao(itensAutorizacao.map(item => 
      item.id === editandoItemId
        ? {
            ...item,
            quantidade_autorizada: currentItem.quantidade_autorizada,
            valor_unitario: currentItem.valor_unitario,
            valor_total: currentItem.quantidade_autorizada * currentItem.valor_unitario,
            updated_at: new Date().toISOString()
          }
        : item
    ));
    setEditandoItemId(null);
    setCurrentItem({
      codigo: '',
      nome: '',
      quantidade_autorizada: 1,
      valor_unitario: 0
    });
    toast.success('Item atualizado!');
  };

  const handleRemoverItem = (itemId) => {
    setItensAutorizacao(itensAutorizacao.filter(item => item.id !== itemId));
    toast.success('Item removido');
  };

  const handleSalvarAutorizacao = async () => {
    if (!atendimentoEncontrado) {
      toast.error('Nenhuma guia selecionada');
      return;
    }

    if (itensAutorizacao.length === 0) {
      toast.error('Adicione pelo menos um item autorizado');
      return;
    }

    if (!dadosAutorizacao.numero_guia_operadora) {
      toast.warning('Número da Guia Operadora não informado');
    }

    try {
      const { error } = await supabase
        .from('atendimentos')
        .update({
          itens_autorizados: itensAutorizacao,
          numero_guia_operadora: dadosAutorizacao.numero_guia_operadora,
          data_autorizacao: dadosAutorizacao.data_autorizacao,
          data_validade_senha: dadosAutorizacao.data_validade_senha,
          senha_autorizacao: dadosAutorizacao.senha_autorizacao,
          status: itensAutorizacao.length > 0 ? 'autorizado' : 'pendente',
          updated_at: new Date().toISOString()
        })
        .eq('id', atendimentoEncontrado.id);

      if (error) throw error;
      
      toast.success('Autorização salva com sucesso!');
      setShowModal(false);
      setAtendimentoEncontrado(null);
      setItensAutorizacao([]);
      setQuantidadesAutorizar({});
      setDadosAutorizacao({
        numero_guia_operadora: '',
        data_autorizacao: new Date().toISOString().split('T')[0],
        data_validade_senha: '',
        senha_autorizacao: ''
      });
      setBuscaNumeroGuia('');
      carregarDados();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar autorização');
    }
  };


  const carregarCredenciaisAutorizacao = async (atendimento) => {
    const convenio = convenios.find(c => c.id === atendimento.paciente_convenio_id);
    if (!convenio) throw new Error('Convênio não encontrado para esta guia.');

    let configIntegracao = {};
    try {
      const { data, error } = await supabase
        .from('convenios_config')
        .select('configuracoes')
        .eq('convenio_id', convenio.id)
        .maybeSingle();

      if (error) throw error;
      configIntegracao = data?.configuracoes ? JSON.parse(data.configuracoes) : {};
    } catch (error) {
      console.warn('Não foi possível carregar configuração de WebService do convênio:', error);
    }

    const login = configIntegracao.usuario_webservice || configIntegracao.login_prestador_orizon || '';
    const senha = configIntegracao.senha_webservice || configIntegracao.chave_transmissao_orizon || convenio.senha_prestador || '';
    const endpointAutorizacao = configIntegracao.url_autorizacao_orizon || '';
    const endpointStatusAutorizacao = configIntegracao.url_status_autorizacao_orizon || '';

    if (!login || !senha) {
      throw new Error('Informe login e chave/senha do WebService na configuração do convênio.');
    }

    return {
      convenio,
      login,
      senha,
      endpointAutorizacao,
      endpointStatusAutorizacao,
      proxyUrl: configIntegracao.proxy_url_webservice || '',
      cnes: configIntegracao.cnes || convenio.cnes || '',
      ambiente: configIntegracao.ambiente_orizon || convenio.ambiente || 'homologacao'
    };
  };

  const atualizarIntegracaoAutorizacao = async (atendimento, patchIntegracao, patchCampos = {}) => {
    const integracaoAtual = atendimento.integracao_autorizacao || {};
    const payload = {
      ...patchCampos,
      integracao_autorizacao: {
        ...integracaoAtual,
        ...patchIntegracao,
        atualizado_em: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('atendimentos')
      .update(payload)
      .eq('id', atendimento.id);

    if (error && erroColunaIntegracaoAusente(error)) {
      const { protocolo_autorizacao, status_autorizacao_ws, integracao_autorizacao, ...camposLegados } = patchCampos;
      const fallbackPayload = {
        ...camposLegados,
        updated_at: new Date().toISOString()
      };

      if (Object.keys(camposLegados).length === 0) {
        console.warn('Migration de autorizações WebService pendente; metadados WS não foram persistidos.', error);
        return;
      }

      const fallback = await supabase
        .from('atendimentos')
        .update(fallbackPayload)
        .eq('id', atendimento.id);

      if (fallback.error) throw fallback.error;
      console.warn('Migration de autorizações WebService pendente; salvando apenas campos legados de autorização.', error);
      return;
    }

    if (error) throw error;
  };

  const montarCamposRetornoAutorizacao = (retorno, atendimento) => {
    const campos = {
      status_autorizacao_ws: retorno.statusSolicitacao || 'retorno_recebido'
    };

    if (retorno.numeroGuiaOperadora) campos.numero_guia_operadora = retorno.numeroGuiaOperadora;
    if (retorno.senha) campos.senha_autorizacao = retorno.senha;
    if (retorno.dataAutorizacao) campos.data_autorizacao = retorno.dataAutorizacao;
    if (retorno.dataValidadeSenha) campos.data_validade_senha = retorno.dataValidadeSenha;
    if (retorno.numeroGuiaOperadora || retorno.numeroGuiaPrestador) {
      campos.protocolo_autorizacao = retorno.numeroGuiaOperadora || retorno.numeroGuiaPrestador;
    }
    const statusRetorno = (retorno.statusSolicitacao || '').toString().toLowerCase();
    if (/parcial/.test(statusRetorno)) {
      campos.status = 'parcial';
    }
    if (
      (retorno.numeroGuiaOperadora || atendimento.numero_guia_operadora) &&
      (retorno.senha || atendimento.senha_autorizacao || /autoriz|aprov|liberad/.test(statusRetorno))
    ) {
      campos.status = 'autorizado';
    }
    if (/negad|rejeitad|cancelad/.test(statusRetorno)) {
      campos.status = 'pendente';
    }

    return campos;
  };

  const enviarAutorizacaoWebservice = async (atendimento) => {
    const id = atendimento.id;
    setEnviandoWebserviceId(id);
    try {
      const credenciais = await carregarCredenciaisAutorizacao(atendimento);
      if (!credenciais.endpointAutorizacao) {
        throw new Error('Informe o endpoint de Solicitação de Autorização na configuração WebService do convênio.');
      }

      const retorno = await solicitarAutorizacaoProcedimentoOrizon({
        endpoint: credenciais.endpointAutorizacao,
        atendimento,
        convenio: credenciais.convenio,
        login: credenciais.login,
        senha: credenciais.senha,
        cnes: credenciais.cnes,
        proxyUrl: credenciais.proxyUrl
      });

      if (!retorno.sucesso) {
        throw new Error(retorno.erro || 'A operadora retornou erro na solicitação de autorização.');
      }

      await atualizarIntegracaoAutorizacao(atendimento, {
        ambiente: credenciais.ambiente,
        endpoint_autorizacao: credenciais.endpointAutorizacao,
        numero_guia_prestador: retorno.numeroGuiaPrestador || atendimento.numero_guia_prestador,
        numero_guia_operadora: retorno.numeroGuiaOperadora,
        senha: retorno.senha,
        status_solicitacao: retorno.statusSolicitacao,
        motivo_negativa: retorno.motivoNegativa,
        xml_resposta_autorizacao: retorno.xmlResposta,
        enviado_em: new Date().toISOString()
      }, montarCamposRetornoAutorizacao(retorno, atendimento));

      toast.success(`Solicitação de autorização enviada${retorno.numeroGuiaOperadora ? ` - Guia operadora ${retorno.numeroGuiaOperadora}` : ''}.`);
      await carregarDados();
    } catch (error) {
      console.error('Erro ao enviar autorização WebService:', error);
      try {
        await atualizarIntegracaoAutorizacao(atendimento, {
          erro_envio: error.message,
          falha_em: new Date().toISOString()
        }, { status_autorizacao_ws: 'falha_envio' });
        await carregarDados();
      } catch (logError) {
        console.warn('Não foi possível registrar falha de autorização:', logError);
      }
      toast.error(`Erro no WebService de autorização: ${error.message}`, { duration: 12000 });
    } finally {
      setEnviandoWebserviceId(null);
    }
  };

  const consultarAutorizacaoWebservice = async (atendimento) => {
    const id = atendimento.id;
    setConsultandoWebserviceId(id);
    try {
      const credenciais = await carregarCredenciaisAutorizacao(atendimento);
      if (!credenciais.endpointStatusAutorizacao) {
        throw new Error('Informe o endpoint de Status Autorização na configuração WebService do convênio.');
      }

      const retorno = await consultarStatusAutorizacaoOrizon({
        endpoint: credenciais.endpointStatusAutorizacao,
        codigoPrestador: credenciais.convenio.codigo_prestador || atendimento.convenio_codigo_prestador,
        registroANS: credenciais.convenio.registro_ans || atendimento.convenio_registro_ans,
        numeroGuiaPrestador: atendimento.numero_guia_prestador,
        numeroGuiaOperadora: atendimento.numero_guia_operadora || atendimento.protocolo_autorizacao,
        login: credenciais.login,
        senha: credenciais.senha,
        proxyUrl: credenciais.proxyUrl
      });

      if (!retorno.sucesso) {
        throw new Error(retorno.erro || 'A operadora retornou erro na consulta de autorização.');
      }

      await atualizarIntegracaoAutorizacao(atendimento, {
        endpoint_status_autorizacao: credenciais.endpointStatusAutorizacao,
        status_solicitacao: retorno.statusSolicitacao,
        numero_guia_operadora: retorno.numeroGuiaOperadora,
        senha: retorno.senha,
        motivo_negativa: retorno.motivoNegativa,
        xml_resposta_status_autorizacao: retorno.xmlResposta,
        consultado_em: new Date().toISOString()
      }, montarCamposRetornoAutorizacao(retorno, atendimento));

      toast.success(`Status de autorização consultado${retorno.statusSolicitacao ? `: ${retorno.statusSolicitacao}` : ''}.`);
      await carregarDados();
    } catch (error) {
      console.error('Erro ao consultar autorização WebService:', error);
      toast.error(`Erro na consulta de autorização: ${error.message}`, { duration: 12000 });
    } finally {
      setConsultandoWebserviceId(null);
    }
  };

  const handleEditarAutorizacao = async (atendimento) => {
    setEditing(atendimento);
    setAtendimentoEncontrado(atendimento);
    setDadosAutorizacao({
      numero_guia_operadora: atendimento.numero_guia_operadora || '',
      data_autorizacao: atendimento.data_autorizacao || new Date().toISOString().split('T')[0],
      data_validade_senha: atendimento.data_validade_senha || '',
      senha_autorizacao: atendimento.senha_autorizacao || ''
    });
    setItensAutorizacao(atendimento.itens_autorizados || []);
    setShowModal(true);
  };

  const autorizacoesFiltradas = useMemo(() => {
    return autorizacoes.filter(a => {
      if (filtroStatus !== 'todos' && a.status !== filtroStatus) return false;
      if (filtroConvenio !== 'todos' && a.paciente_convenio_id !== parseInt(filtroConvenio)) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return a.paciente_nome?.toLowerCase().includes(term) ||
               a.numero_guia_prestador?.includes(term);
      }
      return true;
    });
  }, [autorizacoes, filtroStatus, filtroConvenio, searchTerm]);

  const estatisticas = useMemo(() => {
    const pendentes = autorizacoes.filter(a => a.status === 'pendente').length;
    const autorizados = autorizacoes.filter(a => a.status === 'autorizado').length;
    const parciais = autorizacoes.filter(a => a.status === 'parcial').length;
    const faturados = autorizacoes.filter(a => a.status === 'faturado').length;
    const finalizados = autorizacoes.filter(a => a.status === 'finalizado').length;
    const valorTotal = autorizacoes.reduce((sum, a) => sum + (a.valor_total || 0), 0);
    
    return { pendentes, autorizados, parciais, faturados, finalizados, valorTotal, total: autorizacoes.length };
  }, [autorizacoes]);

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusCor = (status) => {
    const statusMap = {
      pendente: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      autorizado: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      parcial: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      faturado: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      finalizado: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      pendente: 'Sem Autorização',
      autorizado: 'Autorizada',
      parcial: 'Parcialmente Autorizada',
      faturado: 'Faturado',
      finalizado: 'Finalizado'
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <ShieldCheckIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                  Autorizações de Procedimentos
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2">
                  <KeyIcon className="w-4 h-4" />
                  Gerencie as autorizações de procedimentos por número de guia
                </p>
              </div>
            </div>
            <button 
              onClick={() => { setEditing(null); setAtendimentoEncontrado(null); setItensAutorizacao([]); setQuantidadesAutorizar({}); setBuscaNumeroGuia(''); setDadosAutorizacao({numero_guia_operadora: '', data_autorizacao: new Date().toISOString().split('T')[0], data_validade_senha: '', senha_autorizacao: ''}); setShowModal(true); }} 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:shadow-lg transition-all"
            >
              <PlusIcon className="w-4 h-4" /> Nova Autorização
            </button>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1"><DocumentPlusIcon className="w-3 h-3" /> Total</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{estatisticas.total}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <DocumentPlusIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1"><ClockIcon className="w-3 h-3" /> Sem Autorização</p>
                <p className="text-2xl font-bold text-yellow-600">{estatisticas.pendentes}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                <ClockIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1"><CheckBadgeIcon className="w-3 h-3" /> Autorizadas</p>
                <p className="text-2xl font-bold text-green-600">{estatisticas.autorizados}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <CheckBadgeIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1"><ExclamationTriangleIcon className="w-3 h-3" /> Parcialmente Autorizada</p>
                <p className="text-2xl font-bold text-orange-600">{estatisticas.parciais}</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1"><CurrencyDollarIcon className="w-3 h-3" /> Faturados</p>
                <p className="text-2xl font-bold text-blue-600">{estatisticas.faturados}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <CurrencyDollarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1"><ShieldCheckIcon className="w-3 h-3" /> Finalizados</p>
                <p className="text-2xl font-bold text-purple-600">{estatisticas.finalizados}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <ShieldCheckIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Buscar por paciente ou guia..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
            </div>
            <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm">
              <option value="todos">Todos os status</option>
              {STATUS_AUTORIZACAO.map(s => (<option key={s.value} value={s.value}>{s.label}</option>))}
            </select>
            <select value={filtroConvenio} onChange={(e) => setFiltroConvenio(e.target.value)} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm">
              <option value="todos">Todos os convênios</option>
              {convenios.map(c => (<option key={c.id} value={c.id}>{c.razao_social}</option>))}
            </select>
            <button onClick={carregarDados} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-gray-200"><ArrowPathIcon className="w-4 h-4" /> Atualizar</button>
          </div>
        </div>

        {/* Tabela de Autorizações */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><IdentificationIcon className="w-3 h-3 inline mr-1" />Nº Guia</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><UserCircleIcon className="w-3 h-3 inline mr-1" />Paciente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><BuildingOfficeIcon className="w-3 h-3 inline mr-1" />Convênio</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><CreditCardIcon className="w-3 h-3 inline mr-1" />Guia Operadora</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><CalendarDaysIcon className="w-3 h-3 inline mr-1" />Validade</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"><ListBulletIcon className="w-3 h-3 inline mr-1" />Itens</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"><CurrencyDollarIcon className="w-3 h-3 inline mr-1" />Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><ShieldCheckIcon className="w-3 h-3 inline mr-1" />Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-44">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {autorizacoesFiltradas.map((a) => {
                  const isExpanded = expandedItems[a.id];
                  const temItensPendentes = a.itens_pendentes?.length > 0;
                  const itensPendentesCount = a.itens_pendentes?.length || 0;
                  const diasRestantes = a.data_validade_senha ? differenceInDays(new Date(a.data_validade_senha), new Date()) : 0;
                  
                  return (
                    <React.Fragment key={a.id}>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                        <td className="px-4 py-3">
                          <button onClick={() => toggleExpand(a.id)} className="p-1 hover:bg-gray-100 rounded transition-colors">
                            {isExpanded ? <ChevronUpIcon className="w-4 h-4 text-gray-400" /> : <ChevronDownIcon className="w-4 h-4 text-gray-400" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">{a.numero_guia_prestador}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">{a.paciente_nome}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{a.paciente_convenio_nome || '-'}</td>
                        <td className="px-4 py-3 font-mono text-sm text-gray-600 dark:text-gray-400">{a.numero_guia_operadora || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-1">
                            <CalendarDaysIcon className="w-3 h-3 text-gray-400" />
                            <span className={diasRestantes < 0 ? 'text-red-600' : diasRestantes < 7 ? 'text-yellow-600' : 'text-gray-600'}>
                              {a.data_validade_senha ? format(new Date(a.data_validade_senha), 'dd/MM/yyyy') : '-'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {temItensPendentes ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                              <ExclamationTriangleIcon className="w-3 h-3" />{itensPendentesCount}
                            </span>
                          ) : (<span className="text-gray-400">-</span>)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">R$ {(a.valor_total || 0).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusCor(a.status)}`}>
                            {STATUS_AUTORIZACAO.find(s => s.value === a.status)?.icone && React.createElement(STATUS_AUTORIZACAO.find(s => s.value === a.status).icone, { className: "w-3 h-3" })}
                            {getStatusLabel(a.status)}
                          </span>
                          {a.status_autorizacao_ws && (
                            <p className="text-[10px] text-cyan-700 dark:text-cyan-300 mt-1">WS: {a.status_autorizacao_ws}</p>
                          )}
                          {a.integracao_autorizacao?.motivo_negativa && (
                            <p className="text-[10px] text-red-600 mt-1">{a.integracao_autorizacao.motivo_negativa}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-1 justify-center flex-wrap">
                            <button onClick={() => { setSelectedAutorizacao(a); setShowItensModal(true); }} className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors" title="Ver Itens">
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            {a.status !== 'faturado' && a.status !== 'finalizado' && temItensPendentes && (
                              <button onClick={() => handleEditarAutorizacao(a)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors" title="Editar Autorização">
                                <PencilIcon className="w-4 h-4" />
                              </button>
                            )}
                            {a.status !== 'faturado' && a.status !== 'finalizado' && (
                              <button
                                onClick={() => enviarAutorizacaoWebservice(a)}
                                disabled={enviandoWebserviceId === a.id}
                                className="p-1.5 rounded-lg text-cyan-600 hover:bg-cyan-50 transition-colors disabled:opacity-50"
                                title="Enviar solicitação de autorização via WebService"
                              >
                                {enviandoWebserviceId === a.id ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-600"></div> : <CloudArrowUpIcon className="w-4 h-4" />}
                              </button>
                            )}
                            <button
                              onClick={() => consultarAutorizacaoWebservice(a)}
                              disabled={consultandoWebserviceId === a.id}
                              className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 transition-colors disabled:opacity-50"
                              title="Consultar status da autorização via WebService"
                            >
                              {consultandoWebserviceId === a.id ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div> : <ArrowPathIcon className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && a.itens_pendentes?.length > 0 && (
                        <tr className="bg-gray-50 dark:bg-gray-700/30">
                          <td colSpan="10" className="px-4 py-3">
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead className="bg-gray-100 dark:bg-gray-700">
                                  <tr>
                                    <th className="px-2 py-1 text-left"><CubeIcon className="w-3 h-3 inline mr-1" />Código</th>
                                    <th className="px-2 py-1 text-left">Procedimento</th>
                                    <th className="px-2 py-1 text-center"><ListBulletIcon className="w-3 h-3 inline mr-1" />Qtd Executada</th>
                                    <th className="px-2 py-1 text-center"><CheckBadgeIcon className="w-3 h-3 inline mr-1" />Qtd Autorizada</th>
                                    <th className="px-2 py-1 text-center"><ExclamationTriangleIcon className="w-3 h-3 inline mr-1" />Necessita</th>
                                    <th className="px-2 py-1 text-right"><CurrencyDollarIcon className="w-3 h-3 inline mr-1" />Valor Unit.</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {a.itens_pendentes.map((item, idx) => {
                                    const necessidade = (item.quantidade_executada || 1) - (item.quantidade_autorizada || 0);
                                    return (
                                      <tr key={idx} className="hover:bg-gray-100">
                                        <td className="px-2 py-1 font-mono text-blue-600">{item.codigo}</td>
                                        <td className="px-2 py-1">{item.nome}</td>
                                        <td className="px-2 py-1 text-center font-medium">{item.quantidade_executada || 1}</td>
                                        <td className="px-2 py-1 text-center">{item.quantidade_autorizada || 0}</td>
                                        <td className="px-2 py-1 text-center font-semibold text-yellow-600">{necessidade} unidade(s)</td>
                                        <td className="px-2 py-1 text-right">R$ {(item.valor_unitario || 0).toFixed(2)}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                                <tfoot className="bg-gray-100 dark:bg-gray-700">
                                  <tr className="border-t">
                                    <td colSpan="5" className="px-2 py-1 text-right font-semibold">Total Pendente:</td>
                                    <td className="px-2 py-1 text-right font-bold text-yellow-600">
                                      R$ {a.itens_pendentes.reduce((sum, i) => sum + ((i.valor_unitario || 0) * ((i.quantidade_executada || 1) - (i.quantidade_autorizada || 0))), 0).toFixed(2)}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {autorizacoesFiltradas.length === 0 && (
                  <tr>
                    <td colSpan="10" className="px-4 py-12 text-center text-gray-500">
                      <DocumentPlusIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      Nenhuma autorização encontrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Nova/Editar Autorização */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-semibold">{editing ? 'Editar Autorização' : 'Nova Autorização'}</h3>
                  </div>
                  <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="p-5">
                {!editing && !atendimentoEncontrado && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <IdentificationIcon className="w-4 h-4 text-gray-500" />
                      Número da Guia Prestador *
                    </label>
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        value={buscaNumeroGuia} 
                        onChange={(e) => setBuscaNumeroGuia(e.target.value)} 
                        placeholder="Digite o número da guia prestador..." 
                        className="flex-1 border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <button 
                        onClick={handleBuscarAtendimento} 
                        disabled={buscandoAtendimento} 
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <MagnifyingGlassIcon className="w-4 h-4" />
                        {buscandoAtendimento ? 'Buscando...' : 'Buscar Guia'}
                      </button>
                    </div>
                  </div>
                )}

                {atendimentoEncontrado && (
                  <>
                    {/* Informações da Guia */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 mb-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <UserCircleIcon className="w-5 h-5 text-blue-500" />
                          <div>
                            <span className="text-xs text-gray-500">Paciente</span>
                            <p className="text-sm font-medium">{atendimentoEncontrado.paciente_nome}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCardIcon className="w-5 h-5 text-blue-500" />
                          <div>
                            <span className="text-xs text-gray-500">Carteira</span>
                            <p className="text-sm font-mono">{atendimentoEncontrado.numero_carteira}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <BuildingOfficeIcon className="w-5 h-5 text-blue-500" />
                          <div>
                            <span className="text-xs text-gray-500">Convênio</span>
                            <p className="text-sm">{atendimentoEncontrado.paciente_convenio_nome}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="w-5 h-5 text-blue-500" />
                          <div>
                            <span className="text-xs text-gray-500">Status Atual</span>
                            <p className="text-sm">{getStatusLabel(atendimentoEncontrado.status)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dados da Autorização */}
                    <div className="border rounded-xl p-4 mb-6 bg-blue-50 dark:bg-blue-900/20">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <KeyIcon className="w-4 h-4 text-blue-600" />
                        Dados da Autorização
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                            <CreditCardIcon className="w-3 h-3" /> Número Guia Operadora
                          </label>
                          <input 
                            type="text" 
                            value={dadosAutorizacao.numero_guia_operadora} 
                            onChange={e => setDadosAutorizacao({...dadosAutorizacao, numero_guia_operadora: e.target.value})} 
                            placeholder="Número fornecido pela operadora" 
                            className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                            <KeyIcon className="w-3 h-3" /> Senha de Autorização
                          </label>
                          <input 
                            type="text" 
                            value={dadosAutorizacao.senha_autorizacao} 
                            onChange={e => setDadosAutorizacao({...dadosAutorizacao, senha_autorizacao: e.target.value})} 
                            placeholder="Senha fornecida pela operadora" 
                            className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" /> Data da Autorização
                          </label>
                          <input 
                            type="date" 
                            value={dadosAutorizacao.data_autorizacao} 
                            onChange={e => setDadosAutorizacao({...dadosAutorizacao, data_autorizacao: e.target.value})} 
                            className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                            <CalendarDaysIcon className="w-3 h-3" /> Data Validade da Senha
                          </label>
                          <input 
                              type="date" 
                            value={dadosAutorizacao.data_validade_senha} 
                            onChange={e => setDadosAutorizacao({...dadosAutorizacao, data_validade_senha: e.target.value})} 
                            className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Itens Pendentes com campo para digitar quantidade autorizada */}
                    {atendimentoEncontrado.itens_pendentes?.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600" />
                          Itens que Precisam de Autorização
                        </h4>
                        <div className="border rounded-xl overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs"><CubeIcon className="w-3 h-3 inline" /> Código</th>
                                  <th className="px-3 py-2 text-left text-xs">Procedimento</th>
                                  <th className="px-3 py-2 text-center text-xs"><ListBulletIcon className="w-3 h-3 inline" /> Qtd Executada</th>
                                  <th className="px-3 py-2 text-center text-xs"><CheckBadgeIcon className="w-3 h-3 inline" /> Qtd Autorizada</th>
                                  <th className="px-3 py-2 text-center text-xs"><ExclamationTriangleIcon className="w-3 h-3 inline" /> Necessita</th>
                                  <th className="px-3 py-2 text-center text-xs"><PencilIcon className="w-3 h-3 inline" /> Qtd a Autorizar</th>
                                  <th className="px-3 py-2 text-right text-xs"><CurrencyDollarIcon className="w-3 h-3 inline" /> Valor Unit.</th>
                                  <th className="px-3 py-2 text-center text-xs w-28">Ação</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {atendimentoEncontrado.itens_pendentes.map((item) => {
                                  const quantidadeAtual = quantidadesAutorizar[item.id] || item.quantidade_necessaria;
                                  
                                  return (
                                    <tr key={item.id} className="bg-yellow-50 dark:bg-yellow-900/10">
                                      <td className="px-3 py-2 text-xs font-mono text-blue-600">{item.codigo}</td>
                                      <td className="px-3 py-2 text-xs">{item.nome}</td>
                                      <td className="px-3 py-2 text-xs text-center font-medium">{item.quantidade_executada}</td>
                                      <td className="px-3 py-2 text-xs text-center">{item.quantidade_autorizada || 0}</td>
                                      <td className="px-3 py-2 text-xs text-center font-semibold text-yellow-600">{item.quantidade_necessaria} unidade(s)</td>
                                      <td className="px-3 py-2 text-center">
                                        <input
                                          type="number"
                                          min="0"
                                          max={item.quantidade_necessaria}
                                          value={quantidadeAtual}
                                          onChange={(e) => handleQuantidadeChange(item.id, e.target.value, item.quantidade_necessaria)}
                                          className="w-24 border rounded px-2 py-1 text-xs text-center focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700"
                                        />
                                      </td>
                                      <td className="px-3 py-2 text-xs text-right">R$ {(item.valor_unitario || 0).toFixed(2)}</td>
                                      <td className="px-3 py-2 text-center">
                                        <button 
                                          onClick={() => {
                                            if (quantidadeAtual > 0) {
                                              handleAdicionarItemPendente({
                                                ...item, 
                                                quantidade_autorizar: quantidadeAtual
                                              });
                                            } else {
                                              toast.warning('Informe uma quantidade válida');
                                            }
                                          }} 
                                          disabled={quantidadeAtual === 0}
                                          className={`px-3 py-1 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                                            quantidadeAtual > 0 
                                              ? 'bg-green-600 text-white hover:bg-green-700' 
                                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                          }`}
                                        >
                                          <CheckIcon className="w-3 h-3" /> Autorizar
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Adicionar Itens Manualmente */}
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <PlusIcon className="w-4 h-4 text-green-600" />
                        Adicionar Outros Itens Manualmente
                      </h4>
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Buscar Procedimento</label>
                        <div className="relative">
                          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input 
                            type="text" 
                            value={searchItemTerm} 
                            onChange={(e) => { setSearchItemTerm(e.target.value); if (e.target.value.length >= 3) handleBuscarProcedimento(e.target.value); }} 
                            placeholder="Digite código ou descrição..." 
                            className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>

                      {currentItem.codigo && (
                        <div className="border rounded-xl p-4 bg-gray-50 dark:bg-gray-700/30 mb-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div className="md:col-span-2">
                              <label className="block text-xs text-gray-500 mb-1">Procedimento</label>
                              <input type="text" value={currentItem.nome} disabled className="w-full bg-white dark:bg-gray-600 border rounded px-2 py-2 text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Qtd. Autorizada</label>
                              <input 
                                type="number" 
                                min="1" 
                                value={currentItem.quantidade_autorizada} 
                                onChange={e => setCurrentItem({...currentItem, quantidade_autorizada: parseInt(e.target.value) || 1})} 
                                className="w-full border rounded px-2 py-2 text-sm text-center dark:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            <div className="flex items-end">
                              <button 
                                type="button" 
                                onClick={handleAdicionarItem} 
                                className="w-full bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                              >
                                <PlusIcon className="w-4 h-4" /> Adicionar
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Lista de Itens Autorizados */}
                      {itensAutorizacao.length > 0 && (
                        <div className="border rounded-xl overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs"><CubeIcon className="w-3 h-3 inline" /> Código</th>
                                  <th className="px-3 py-2 text-left text-xs">Procedimento</th>
                                  <th className="px-3 py-2 text-center text-xs"><ListBulletIcon className="w-3 h-3 inline" /> Qtd</th>
                                  <th className="px-3 py-2 text-right text-xs"><CurrencyDollarIcon className="w-3 h-3 inline" /> Valor Unit.</th>
                                  <th className="px-3 py-2 text-right text-xs">Valor Total</th>
                                  <th className="px-3 py-2 text-center text-xs w-20">Ações</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {itensAutorizacao.map((item) => (
                                  <tr key={item.id}>
                                    {editandoItemId === item.id ? (
                                      <>
                                        <td className="px-3 py-2 text-xs font-mono text-blue-600">{item.codigo}</td>
                                        <td className="px-3 py-2 text-xs">{item.nome}</td>
                                        <td className="px-3 py-2">
                                          <input 
                                            type="number" 
                                            min="1" 
                                            value={currentItem.quantidade_autorizada} 
                                            onChange={(e) => setCurrentItem({...currentItem, quantidade_autorizada: parseInt(e.target.value) || 1})} 
                                            className="w-20 border rounded px-2 py-1 text-sm text-center dark:bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                          />
                                        </td>
                                        <td className="px-3 py-2">
                                          <input 
                                            type="number" 
                                            step="0.01" 
                                            value={currentItem.valor_unitario} 
                                            onChange={(e) => setCurrentItem({...currentItem, valor_unitario: parseFloat(e.target.value) || 0})} 
                                            className="w-24 border rounded px-2 py-1 text-sm text-right dark:bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                          />
                                        </td>
                                        <td className="px-3 py-2 text-right font-semibold">R$ {(currentItem.quantidade_autorizada * currentItem.valor_unitario).toFixed(2)}</td>
                                        <td className="px-3 py-2 text-center">
                                          <div className="flex gap-1 justify-center">
                                            <button onClick={handleSalvarEdicao} className="text-green-600 hover:text-green-800 transition-colors" title="Salvar">
                                              <CheckIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setEditandoItemId(null)} className="text-red-600 hover:text-red-800 transition-colors" title="Cancelar">
                                              <XMarkIcon className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </td>
                                      </>
                                    ) : (
                                      <>
                                        <td className="px-3 py-2 text-xs font-mono text-blue-600">{item.codigo}</td>
                                        <td className="px-3 py-2 text-xs">{item.nome}</td>
                                        <td className="px-3 py-2 text-xs text-center font-medium">{item.quantidade_autorizada}</td>
                                        <td className="px-3 py-2 text-xs text-right">R$ {(item.valor_unitario || 0).toFixed(2)}</td>
                                        <td className="px-3 py-2 text-xs text-right font-semibold">R$ {(item.valor_total || 0).toFixed(2)}</td>
                                        <td className="px-3 py-2 text-center">
                                          <div className="flex gap-1 justify-center">
                                            <button onClick={() => handleEditarItem(item)} className="text-blue-600 hover:text-blue-800 transition-colors" title="Editar">
                                              <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleRemoverItem(item.id)} className="text-red-600 hover:text-red-800 transition-colors" title="Remover">
                                              <TrashIcon className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </td>
                                      </>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="bg-gray-50 dark:bg-gray-700/50">
                                <tr className="border-t">
                                  <td colSpan="4" className="px-3 py-2 text-right font-semibold">Total:</td>
                                  <td className="px-3 py-2 text-right font-bold text-blue-600">
                                    R$ {itensAutorizacao.reduce((sum, i) => sum + (i.valor_total || 0), 0).toFixed(2)}
                                  </td>
                                  <td className="px-3 py-2"></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                      <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm font-medium dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        Cancelar
                      </button>
                      <button onClick={handleSalvarAutorizacao} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                        <ShieldCheckIcon className="w-4 h-4" /> Salvar Autorização
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de Visualização de Itens */}
        {showItensModal && selectedAutorizacao && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <ListBulletIcon className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-semibold">Itens Autorizados</h3>
                  </div>
                  <button onClick={() => setShowItensModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <IdentificationIcon className="w-4 h-4 text-gray-500" />
                    <div><span className="text-xs text-gray-500">Nº Guia</span><p className="text-sm font-mono">{selectedAutorizacao.numero_guia_prestador}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCircleIcon className="w-4 h-4 text-gray-500" />
                    <div><span className="text-xs text-gray-500">Paciente</span><p className="text-sm font-medium">{selectedAutorizacao.paciente_nome}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BuildingOfficeIcon className="w-4 h-4 text-gray-500" />
                    <div><span className="text-xs text-gray-500">Convênio</span><p className="text-sm">{selectedAutorizacao.paciente_convenio_nome}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheckIcon className="w-4 h-4 text-gray-500" />
                    <div><span className="text-xs text-gray-500">Status</span><p className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusCor(selectedAutorizacao.status)}`}>{getStatusLabel(selectedAutorizacao.status)}</p></div>
                  </div>
                </div>

                {(selectedAutorizacao.protocolo_autorizacao || selectedAutorizacao.status_autorizacao_ws) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5 p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl">
                    <div><span className="text-xs text-gray-500">Protocolo/guia WS</span><p className="text-sm font-mono">{selectedAutorizacao.protocolo_autorizacao || '-'}</p></div>
                    <div><span className="text-xs text-gray-500">Status WS</span><p className="text-sm">{selectedAutorizacao.status_autorizacao_ws || '-'}</p></div>
                    <div><span className="text-xs text-gray-500">Última consulta</span><p className="text-sm">{selectedAutorizacao.integracao_autorizacao?.consultado_em ? format(new Date(selectedAutorizacao.integracao_autorizacao.consultado_em), 'dd/MM/yyyy HH:mm') : '-'}</p></div>
                  </div>
                )}

                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs"><CubeIcon className="w-3 h-3 inline" /> Código</th>
                        <th className="px-3 py-2 text-left text-xs">Procedimento</th>
                        <th className="px-3 py-2 text-center text-xs"><ListBulletIcon className="w-3 h-3 inline" /> Qtd</th>
                        <th className="px-3 py-2 text-right text-xs"><CurrencyDollarIcon className="w-3 h-3 inline" /> Valor Unit.</th>
                        <th className="px-3 py-2 text-right text-xs">Valor Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedAutorizacao.itens_autorizados_list?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-xs font-mono text-blue-600">{item.codigo}</td>
                          <td className="px-3 py-2 text-xs">{item.nome}</td>
                          <td className="px-3 py-2 text-xs text-center">{item.quantidade_autorizada}</td>
                          <td className="px-3 py-2 text-xs text-right">R$ {(item.valor_unitario || 0).toFixed(2)}</td>
                          <td className="px-3 py-2 text-xs text-right font-semibold">R$ {((item.valor_unitario || 0) * (item.quantidade_autorizada || 0)).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 dark:bg-gray-700/50">
                      <tr className="border-t">
                        <td colSpan="4" className="px-3 py-2 text-right font-semibold">Total:</td>
                        <td className="px-3 py-2 text-right font-bold text-blue-600">R$ {(selectedAutorizacao.valor_total || 0).toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="flex justify-end mt-5 pt-4 border-t">
                  <button onClick={() => setShowItensModal(false)} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                    <XMarkIcon className="w-4 h-4" /> Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
