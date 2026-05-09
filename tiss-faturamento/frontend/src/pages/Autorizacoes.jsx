// src/pages/Autorizacoes.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusIcon, PencilIcon, MagnifyingGlassIcon, 
  CheckIcon, XMarkIcon, EyeIcon, DocumentPlusIcon,
  CurrencyDollarIcon, CalendarIcon,
  ClockIcon, ExclamationTriangleIcon, 
  ArrowPathIcon, BuildingOfficeIcon,
  ChevronUpIcon, ChevronDownIcon, TrashIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { supabase } from '../lib/supabaseClient';

const STATUS_AUTORIZACAO = [
  { value: 'pendente', label: 'Sem Autorização', cor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { value: 'parcial', label: 'Parcialmente Autorizada', cor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  { value: 'autorizado', label: 'Autorizada', cor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'faturado', label: 'Faturado', cor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'finalizado', label: 'Finalizado', cor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' }
];

export default function Autorizacoes() {
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
  
  // Dados da autorização
  const [dadosAutorizacao, setDadosAutorizacao] = useState({
    numero_guia_operadora: '',
    data_autorizacao: new Date().toISOString().split('T')[0],
    data_validade_senha: '',
    senha_autorizacao: ''
  });
  
  // Estado para itens da autorização
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
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [autorizacoesData, pacientesData, conveniosData, procedimentosData] = await Promise.all([
        listarAtendimentosComPendentes(),
        supabase.from('pacientes').select('*').order('nome'),
        supabase.from('convenios').select('*').order('razao_social'),
        supabase.from('procedimentos').select('*').order('codigo_tuss')
      ]);

      setAutorizacoes(autorizacoesData);
      setPacientes(pacientesData.data || []);
      setConvenios(conveniosData.data || []);
      setProcedimentos(procedimentosData.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const listarAtendimentosComPendentes = async () => {
    const { data, error } = await supabase
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

    if (error) throw error;

    return data.map(item => {
      const itensExecutados = item.itens || [];
      const itensAutorizadosList = item.itens_autorizados || [];
      
      const itensPendentes = itensExecutados.filter(executado => {
        const autorizado = itensAutorizadosList.find(aut => aut.codigo === executado.codigo);
        const qtdExecutada = executado.quantidade || 1;
        const qtdAutorizada = autorizado?.quantidade_autorizada || 0;
        return !autorizado || qtdAutorizada < qtdExecutada;
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

  // Buscar atendimento por número de guia
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
      
      if (!data) {
        toast.error('Guia não encontrada');
        setAtendimentoEncontrado(null);
        return;
      }
      
      const itensExecutados = data.itens || [];
      const itensAutorizadosList = data.itens_autorizados || [];
      
      // Mapear itens que precisam de autorização
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
          id: executado.id || Date.now(),
          codigo: executado.codigo,
          nome: executado.nome,
          quantidade_executada: qtdExecutada,
          quantidade_autorizada: qtdAutorizada,
          quantidade_necessaria: qtdExecutada - qtdAutorizada,
          valor_unitario: executado.valor_unitario || 0,
          precisa_autorizar: true,
          selecionado: false,
          quantidade_autorizar: qtdExecutada - qtdAutorizada
        };
      });
      
      setAtendimentoEncontrado({
        ...data,
        itens_pendentes: itensPendentes,
        itens_autorizados_list: itensAutorizadosList
      });
      
      // Preencher dados da autorização se já existirem
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

  // Adicionar item pendente à autorização
  const handleAdicionarItemPendente = (itemPendente) => {
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
  };

  // Buscar procedimento para adicionar manualmente
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

  // Adicionar item manual à autorização
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

  // Editar item da autorização
  const handleEditarItem = (item) => {
    setEditandoItemId(item.id);
    setCurrentItem({
      codigo: item.codigo,
      nome: item.nome,
      quantidade_autorizada: item.quantidade_autorizada,
      valor_unitario: item.valor_unitario
    });
  };

  // Salvar edição do item
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

  // Remover item da autorização
  const handleRemoverItem = (itemId) => {
    setItensAutorizacao(itensAutorizacao.filter(item => item.id !== itemId));
    toast.success('Item removido');
  };

  // Salvar autorização completa
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
          status: 'autorizado',
          updated_at: new Date().toISOString()
        })
        .eq('id', atendimentoEncontrado.id);

      if (error) throw error;
      
      toast.success('Autorização salva com sucesso!');
      setShowModal(false);
      setAtendimentoEncontrado(null);
      setItensAutorizacao([]);
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

  // Editar autorização existente
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
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                Autorizações de Procedimentos
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Gerencie as autorizações de procedimentos por número de guia
              </p>
            </div>
            <button 
              onClick={() => { setEditing(null); setAtendimentoEncontrado(null); setItensAutorizacao([]); setBuscaNumeroGuia(''); setDadosAutorizacao({numero_guia_operadora: '', data_autorizacao: new Date().toISOString().split('T')[0], data_validade_senha: '', senha_autorizacao: ''}); setShowModal(true); }} 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:shadow-lg transition-all"
            >
              <PlusIcon className="w-4 h-4" /> Nova Autorização
            </button>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex justify-between">
              <div><p className="text-xs text-gray-500">Total</p><p className="text-2xl font-bold text-gray-800 dark:text-white">{estatisticas.total}</p></div>
              <DocumentPlusIcon className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex justify-between">
              <div><p className="text-xs text-gray-500">Sem Autorização</p><p className="text-2xl font-bold text-yellow-600">{estatisticas.pendentes}</p></div>
              <ClockIcon className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex justify-between">
              <div><p className="text-xs text-gray-500">Autorizadas</p><p className="text-2xl font-bold text-green-600">{estatisticas.autorizados}</p></div>
              <CheckIcon className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex justify-between">
              <div><p className="text-xs text-gray-500">Parcialmente Autorizada</p><p className="text-2xl font-bold text-orange-600">{estatisticas.parciais}</p></div>
              <ExclamationTriangleIcon className="w-8 h-8 text-orange-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex justify-between">
              <div><p className="text-xs text-gray-500">Faturados</p><p className="text-2xl font-bold text-blue-600">{estatisticas.faturados}</p></div>
              <CurrencyDollarIcon className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex justify-between">
              <div><p className="text-xs text-gray-500">Finalizados</p><p className="text-2xl font-bold text-purple-600">{estatisticas.finalizados}</p></div>
              <CheckIcon className="w-8 h-8 text-purple-500 opacity-50" />
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nº Guia</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Convênio</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nº Guia Operadora</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validade</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Itens</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Ações</th>
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
                          <button onClick={() => toggleExpand(a.id)} className="p-1 hover:bg-gray-100 rounded">
                            {isExpanded ? <ChevronUpIcon className="w-4 h-4 text-gray-400" /> : <ChevronDownIcon className="w-4 h-4 text-gray-400" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">{a.numero_guia_prestador}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">{a.paciente_nome}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{a.paciente_convenio_nome || '-'}</td>
                        <td className="px-4 py-3 font-mono text-sm text-gray-600 dark:text-gray-400">{a.numero_guia_operadora || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={diasRestantes < 0 ? 'text-red-600' : diasRestantes < 7 ? 'text-yellow-600' : 'text-gray-600'}>
                            {a.data_validade_senha ? format(new Date(a.data_validade_senha), 'dd/MM/yyyy') : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {temItensPendentes ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                              <ExclamationTriangleIcon className="w-3 h-3" />{itensPendentesCount}
                            </span>
                          ) : (<span className="text-gray-400">-</span>)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">R$ {(a.valor_total || 0).toFixed(2)}</td>
                        <td className="px-4 py-3"><span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusCor(a.status)}`}>{getStatusLabel(a.status)}</span></td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-1 justify-center">
                            <button onClick={() => { setSelectedAutorizacao(a); setShowItensModal(true); }} className="p-1 rounded-lg text-gray-600 hover:bg-gray-100" title="Ver Itens"><EyeIcon className="w-4 h-4" /></button>
                            {a.status !== 'faturado' && a.status !== 'finalizado' && temItensPendentes && (
                              <button onClick={() => handleEditarAutorizacao(a)} className="p-1 rounded-lg text-blue-600 hover:bg-blue-50" title="Editar Autorização"><PencilIcon className="w-4 h-4" /></button>
                            )}
                          </div>
                        </td>
                       </tr>
                      {isExpanded && a.itens_pendentes?.length > 0 && (
                        <tr className="bg-gray-50 dark:bg-gray-700/30">
                          <td colSpan="10" className="px-4 py-3">
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead className="bg-gray-100 dark:bg-gray-700">
                                  <tr><th className="px-2 py-1 text-left">Código</th><th className="px-2 py-1 text-left">Procedimento</th><th className="px-2 py-1 text-center">Qtd Executada</th><th className="px-2 py-1 text-center">Qtd Autorizada</th><th className="px-2 py-1 text-center">Necessita</th><th className="px-2 py-1 text-right">Valor Unit.</th></tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {a.itens_pendentes.map((item, idx) => {
                                    const necessidade = (item.quantidade || 1) - (item.quantidade_autorizada || 0);
                                    return (<tr key={idx}><td className="px-2 py-1 font-mono text-blue-600">{item.codigo}</td><td className="px-2 py-1">{item.nome}</td><td className="px-2 py-1 text-center">{item.quantidade || 1}</td><td className="px-2 py-1 text-center">{item.quantidade_autorizada || 0}</td><td className="px-2 py-1 text-center font-semibold text-yellow-600">{necessidade}</td><td className="px-2 py-1 text-right">R$ {(item.valor_unitario || 0).toFixed(2)}</td></tr>);
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {autorizacoesFiltradas.length === 0 && (
                  <tr><td colSpan="10" className="px-4 py-12 text-center text-gray-500"><DocumentPlusIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />Nenhuma autorização encontrada</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Nova/Editar Autorização */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">{editing ? 'Editar Autorização' : 'Nova Autorização'}</h3>
                  <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><XMarkIcon className="w-5 h-5 text-gray-500" /></button>
                </div>
              </div>
              
              <div className="p-5">
                {!editing && !atendimentoEncontrado && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Número da Guia Prestador *</label>
                    <div className="flex gap-3">
                      <input type="text" value={buscaNumeroGuia} onChange={(e) => setBuscaNumeroGuia(e.target.value)} placeholder="Digite o número da guia prestador..." className="flex-1 border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" />
                      <button onClick={handleBuscarAtendimento} disabled={buscandoAtendimento} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">{buscandoAtendimento ? 'Buscando...' : 'Buscar Guia'}</button>
                    </div>
                  </div>
                )}

                {atendimentoEncontrado && (
                  <>
                    {/* Informações da Guia */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div><span className="text-xs text-gray-500">Paciente</span><p className="text-sm font-medium">{atendimentoEncontrado.paciente_nome}</p></div>
                        <div><span className="text-xs text-gray-500">Carteira</span><p className="text-sm font-mono">{atendimentoEncontrado.numero_carteira}</p></div>
                        <div><span className="text-xs text-gray-500">Convênio</span><p className="text-sm">{atendimentoEncontrado.paciente_convenio_nome}</p></div>
                        <div><span className="text-xs text-gray-500">Status Atual</span><p className="text-sm">{getStatusLabel(atendimentoEncontrado.status)}</p></div>
                      </div>
                    </div>

                    {/* Dados da Autorização */}
                    <div className="border rounded-xl p-4 mb-6 bg-blue-50 dark:bg-blue-900/20">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><CheckIcon className="w-4 h-4 text-blue-600" />Dados da Autorização</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Número Guia Operadora</label>
                          <input type="text" value={dadosAutorizacao.numero_guia_operadora} onChange={e => setDadosAutorizacao({...dadosAutorizacao, numero_guia_operadora: e.target.value})} placeholder="Número fornecido pela operadora" className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Senha de Autorização</label>
                          <input type="text" value={dadosAutorizacao.senha_autorizacao} onChange={e => setDadosAutorizacao({...dadosAutorizacao, senha_autorizacao: e.target.value})} placeholder="Senha fornecida pela operadora" className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Data da Autorização</label>
                          <input type="date" value={dadosAutorizacao.data_autorizacao} onChange={e => setDadosAutorizacao({...dadosAutorizacao, data_autorizacao: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Data Validade da Senha</label>
                          <input type="date" value={dadosAutorizacao.data_validade_senha} onChange={e => setDadosAutorizacao({...dadosAutorizacao, data_validade_senha: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" />
                        </div>
                      </div>
                    </div>

                    {/* Itens Pendentes (que precisam de autorização) */}
                    {atendimentoEncontrado.itens_pendentes?.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><ExclamationTriangleIcon className="w-4 h-4 text-yellow-600" />Itens que Precisam de Autorização</h4>
                        <div className="border rounded-xl overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <table><th className="px-3 py-2 text-left text-xs">Código</th><th className="px-3 py-2 text-left text-xs">Procedimento</th><th className="px-3 py-2 text-center text-xs">Qtd Executada</th><th className="px-3 py-2 text-center text-xs">Qtd Autorizada</th><th className="px-3 py-2 text-center text-xs">Necessita</th><th className="px-3 py-2 text-right text-xs">Valor Unit.</th><th className="px-3 py-2 text-center text-xs w-24">Ação</th></tr>
                              </thead>
                              <tbody className="divide-y">
                                {atendimentoEncontrado.itens_pendentes.map((item, idx) => (
                                  <tr key={idx} className="bg-yellow-50 dark:bg-yellow-900/10">
                                    <td className="px-3 py-2 text-xs font-mono text-blue-600">{item.codigo}</td>
                                    <td className="px-3 py-2 text-xs">{item.nome}</td>
                                    <td className="px-3 py-2 text-xs text-center font-medium">{item.quantidade_executada}</td>
                                    <td className="px-3 py-2 text-xs text-center">{item.quantidade_autorizada || 0}</td>
                                    <td className="px-3 py-2 text-xs text-center font-semibold text-yellow-600">{item.quantidade_necessaria} unidade(s)</td>
                                    <td className="px-3 py-2 text-xs text-right">R$ {(item.valor_unitario || 0).toFixed(2)}</td>
                                    <td className="px-3 py-2 text-center">
                                      <button onClick={() => handleAdicionarItemPendente({...item, quantidade_autorizar: item.quantidade_necessaria})} className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-green-700">Autorizar</button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Adicionar Itens Manualmente */}
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><PlusIcon className="w-4 h-4 text-green-600" />Adicionar Outros Itens Manualmente</h4>
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Buscar Procedimento</label>
                        <div className="relative">
                          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input type="text" value={searchItemTerm} onChange={(e) => { setSearchItemTerm(e.target.value); if (e.target.value.length >= 3) handleBuscarProcedimento(e.target.value); }} placeholder="Digite código ou descrição..." className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                      </div>

                      {currentItem.codigo && (
                        <div className="border rounded-xl p-4 bg-gray-50 dark:bg-gray-700/30 mb-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div className="md:col-span-2"><label className="block text-xs text-gray-500 mb-1">Procedimento</label><input type="text" value={currentItem.nome} disabled className="w-full bg-white dark:bg-gray-600 border rounded px-2 py-2 text-sm" /></div>
                            <div><label className="block text-xs text-gray-500 mb-1">Qtd. Autorizada</label><input type="number" min="1" value={currentItem.quantidade_autorizada} onChange={e => setCurrentItem({...currentItem, quantidade_autorizada: parseInt(e.target.value) || 1})} className="w-full border rounded px-2 py-2 text-sm text-center dark:bg-white" /></div>
                            <div className="flex items-end"><button type="button" onClick={handleAdicionarItem} className="w-full bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700">Adicionar</button></div>
                          </div>
                        </div>
                      )}

                      {/* Lista de Itens Autorizados */}
                      {itensAutorizacao.length > 0 && (
                        <div className="border rounded-xl overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr><th className="px-3 py-2 text-left text-xs">Código</th><th className="px-3 py-2 text-left text-xs">Procedimento</th><th className="px-3 py-2 text-center text-xs">Qtd</th><th className="px-3 py-2 text-right text-xs">Valor Unit.</th><th className="px-3 py-2 text-right text-xs">Valor Total</th><th className="px-3 py-2 text-center text-xs w-20">Ações</th></tr>
                              </thead>
                              <tbody className="divide-y">
                                {itensAutorizacao.map((item) => (
                                  <tr key={item.id}>
                                    {editandoItemId === item.id ? (
                                      <>
                                        <td className="px-3 py-2 text-xs font-mono text-blue-600">{item.codigo}</td>
                                        <td className="px-3 py-2 text-xs">{item.nome}</td>
                                        <td className="px-3 py-2"><input type="number" min="1" value={currentItem.quantidade_autorizada} onChange={(e) => setCurrentItem({...currentItem, quantidade_autorizada: parseInt(e.target.value) || 1})} className="w-20 border rounded px-2 py-1 text-sm text-center" /></td>
                                        <td className="px-3 py-2"><input type="number" step="0.01" value={currentItem.valor_unitario} onChange={(e) => setCurrentItem({...currentItem, valor_unitario: parseFloat(e.target.value) || 0})} className="w-24 border rounded px-2 py-1 text-sm text-right" /></td>
                                        <td className="px-3 py-2 text-right font-semibold">R$ {(currentItem.quantidade_autorizada * currentItem.valor_unitario).toFixed(2)}</td>
                                        <td className="px-3 py-2 text-center"><div className="flex gap-1 justify-center"><button onClick={handleSalvarEdicao} className="text-green-600 hover:text-green-800"><CheckIcon className="w-4 h-4" /></button><button onClick={() => setEditandoItemId(null)} className="text-red-600 hover:text-red-800"><XMarkIcon className="w-4 h-4" /></button></div></td>
                                      </>
                                    ) : (
                                      <>
                                        <td className="px-3 py-2 text-xs font-mono text-blue-600">{item.codigo}</td>
                                        <td className="px-3 py-2 text-xs">{item.nome}</td>
                                        <td className="px-3 py-2 text-xs text-center font-medium">{item.quantidade_autorizada}</td>
                                        <td className="px-3 py-2 text-xs text-right">R$ {(item.valor_unitario || 0).toFixed(2)}</td>
                                        <td className="px-3 py-2 text-xs text-right font-semibold">R$ {(item.valor_total || 0).toFixed(2)}</td>
                                        <td className="px-3 py-2 text-center"><div className="flex gap-1 justify-center"><button onClick={() => handleEditarItem(item)} className="text-blue-600 hover:text-blue-800"><PencilIcon className="w-4 h-4" /></button><button onClick={() => handleRemoverItem(item.id)} className="text-red-600 hover:text-red-800"><TrashIcon className="w-4 h-4" /></button></div></td>
                                      </>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="bg-gray-50 dark:bg-gray-700/50">
                                <tr className="border-t"><td colSpan="4" className="px-3 py-2 text-right font-semibold">Total:</td><td className="px-3 py-2 text-right font-bold text-blue-600">R$ {itensAutorizacao.reduce((sum, i) => sum + (i.valor_total || 0), 0).toFixed(2)}</td><td className="px-3 py-2"></td></tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                      <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm font-medium dark:border-gray-600">Cancelar</button>
                      <button onClick={handleSalvarAutorizacao} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium shadow-md">Salvar Autorização</button>
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
                <div className="flex justify-between items-center"><h3 className="text-xl font-semibold">Itens Autorizados</h3><button onClick={() => setShowItensModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><XMarkIcon className="w-5 h-5 text-gray-500" /></button></div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div><span className="text-xs text-gray-500">Nº Guia:</span><span className="text-sm font-mono">{selectedAutorizacao.numero_guia_prestador}</span></div>
                  <div><span className="text-xs text-gray-500">Paciente:</span><span className="text-sm font-medium">{selectedAutorizacao.paciente_nome}</span></div>
                  <div><span className="text-xs text-gray-500">Convênio:</span><span className="text-sm">{selectedAutorizacao.paciente_convenio_nome}</span></div>
                  <div><span className="text-xs text-gray-500">Status:</span><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusCor(selectedAutorizacao.status)}`}>{getStatusLabel(selectedAutorizacao.status)}</span></div>
                </div>

                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr><th className="px-3 py-2 text-left text-xs">Código</th><th className="px-3 py-2 text-left text-xs">Procedimento</th><th className="px-3 py-2 text-center text-xs">Qtd</th><th className="px-3 py-2 text-right text-xs">Valor Unit.</th><th className="px-3 py-2 text-right text-xs">Valor Total</th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedAutorizacao.itens_autorizados_list?.map((item, idx) => (
                        <tr key={idx}><td className="px-3 py-2 text-xs font-mono text-blue-600">{item.codigo}</td><td className="px-3 py-2 text-xs">{item.nome}</td><td className="px-3 py-2 text-xs text-center">{item.quantidade_autorizada}</td><td className="px-3 py-2 text-xs text-right">R$ {(item.valor_unitario || 0).toFixed(2)}</td><td className="px-3 py-2 text-xs text-right font-semibold">R$ {((item.valor_unitario || 0) * (item.quantidade_autorizada || 0)).toFixed(2)}</td></table>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 dark:bg-gray-700/50"><tr className="border-t"><td colSpan="4" className="px-3 py-2 text-right font-semibold">Total:</td><td className="px-3 py-2 text-right font-bold text-blue-600">R$ {(selectedAutorizacao.valor_total || 0).toFixed(2)}</td></tr></tfoot>
                  </table>
                </div>

                <div className="flex justify-end mt-5 pt-4 border-t"><button onClick={() => setShowItensModal(false)} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium">Fechar</button></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
