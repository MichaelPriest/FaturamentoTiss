// src/pages/Autorizacoes.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, 
  CheckIcon, XMarkIcon, EyeIcon, DocumentPlusIcon,
  CurrencyDollarIcon, CalendarIcon, UserGroupIcon,
  ClockIcon, ExclamationTriangleIcon, LockClosedIcon,
  LockOpenIcon, ArrowPathIcon, BuildingOfficeIcon,
  RefreshIcon, PrinterIcon, DownloadIcon, FilterIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabaseClient';
import { autorizacoesService } from '../services/autorizacoesService';

// Constantes
const STATUS_AUTORIZACAO = [
  { value: 'ativa', label: 'Ativa', cor: 'green', icone: CheckIcon },
  { value: 'expirada', label: 'Expirada', cor: 'red', icone: ClockIcon },
  { value: 'cancelada', label: 'Cancelada', cor: 'gray', icone: XMarkIcon },
  { value: 'parcial', label: 'Parcialmente Utilizada', cor: 'yellow', icone: ExclamationTriangleIcon }
];

const TIPOS_ITEM = [
  { value: 'procedimento', label: 'Procedimento' },
  { value: 'material', label: 'Material' },
  { value: 'medicamento', label: 'Medicamento' },
  { value: 'diaria', label: 'Diária' },
  { value: 'taxa', label: 'Taxa' },
  { value: 'opme', label: 'OPME' }
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
  const [searchPacienteTerm, setSearchPacienteTerm] = useState('');
  const [searchItemTerm, setSearchItemTerm] = useState('');

  // Estado do formulário
  const [formData, setFormData] = useState({
    paciente_id: '',
    convenio_id: '',
    numero_guia_operadora: '',
    data_autorizacao: new Date().toISOString().split('T')[0],
    data_validade_senha: '',
    senha_autorizacao: '',
    observacao: '',
    itens: []
  });

  // Estado para itens da autorização
  const [currentItem, setCurrentItem] = useState({
    codigo: '',
    nome: '',
    tipo: 'procedimento',
    quantidade_autorizada: 1,
    quantidade_utilizada: 0,
    valor_unitario: 0,
    valor_total: 0,
    tabela_referencia: '22'
  });

  const [itensAutorizacao, setItensAutorizacao] = useState([]);

  // Carregar dados iniciais
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [autorizacoesData, pacientesData, conveniosData, procedimentosData] = await Promise.all([
        autorizacoesService.listar(),
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

  // Filtrar pacientes
  const pacientesFiltrados = useMemo(() => {
    if (!searchPacienteTerm) return pacientes;
    const term = searchPacienteTerm.toLowerCase();
    return pacientes.filter(p => 
      p.nome?.toLowerCase().includes(term) ||
      p.numero_carteira?.includes(term) ||
      p.cpf?.includes(term)
    );
  }, [pacientes, searchPacienteTerm]);

  // Filtrar procedimentos do convênio
  const procedimentosDoConvenio = useMemo(() => {
    if (!formData.convenio_id) return [];
    return procedimentos.filter(p => !p.convenio_id || p.convenio_id === formData.convenio_id);
  }, [procedimentos, formData.convenio_id]);

  const itensFiltrados = useMemo(() => {
    if (!searchItemTerm) return procedimentosDoConvenio;
    const term = searchItemTerm.toLowerCase();
    return procedimentosDoConvenio.filter(p =>
      p.codigo_tuss?.toLowerCase().includes(term) ||
      p.nome?.toLowerCase().includes(term)
    );
  }, [procedimentosDoConvenio, searchItemTerm]);

  // Filtrar autorizações na tabela
  const autorizacoesFiltradas = useMemo(() => {
    return autorizacoes.filter(a => {
      if (filtroStatus !== 'todos' && a.status !== filtroStatus) return false;
      if (filtroConvenio !== 'todos' && a.convenio_id !== parseInt(filtroConvenio)) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return a.paciente?.nome?.toLowerCase().includes(term) ||
               a.numero_guia_operadora?.includes(term);
      }
      return true;
    });
  }, [autorizacoes, filtroStatus, filtroConvenio, searchTerm]);

  // Calcular estatísticas
  const estatisticas = useMemo(() => {
    const ativas = autorizacoes.filter(a => a.status === 'ativa').length;
    const expiradas = autorizacoes.filter(a => a.status === 'expirada').length;
    const canceladas = autorizacoes.filter(a => a.status === 'cancelada').length;
    const valorTotal = autorizacoes.reduce((sum, a) => sum + (a.valor_total || 0), 0);
    return { ativas, expiradas, canceladas, valorTotal, total: autorizacoes.length };
  }, [autorizacoes]);

  // Calcular status baseado nos itens
  const calcularStatus = useCallback((itens) => {
    if (!itens || itens.length === 0) return 'ativa';
    
    let todosUtilizados = true;
    let algumUtilizado = false;
    
    for (const item of itens) {
      const utilizada = item.quantidade_utilizada || 0;
      const autorizada = item.quantidade_autorizada || 0;
      
      if (utilizada > 0) algumUtilizado = true;
      if (utilizada < autorizada) todosUtilizados = false;
    }
    
    if (todosUtilizados && algumUtilizado) return 'parcial';
    return 'ativa';
  }, []);

  // Adicionar item à autorização
  const handleAdicionarItem = () => {
    if (!currentItem.codigo) {
      toast.error('Selecione um procedimento');
      return;
    }

    if (itensAutorizacao.some(item => item.codigo === currentItem.codigo)) {
      toast.warning('Este procedimento já foi adicionado!');
      return;
    }

    const itemSelecionado = procedimentosDoConvenio.find(p => p.codigo_tuss === currentItem.codigo);
    const valorUnitario = currentItem.valor_unitario || itemSelecionado?.valor_convenio || itemSelecionado?.valor_sugerido || 0;
    
    const novoItem = {
      id: Date.now(),
      codigo: currentItem.codigo,
      nome: currentItem.nome || itemSelecionado?.nome,
      tipo: currentItem.tipo,
      quantidade_autorizada: currentItem.quantidade_autorizada,
      quantidade_utilizada: 0,
      valor_unitario: valorUnitario,
      valor_total: valorUnitario * currentItem.quantidade_autorizada,
      tabela_referencia: itemSelecionado?.tabela === 'PROPRIA' ? '00' : '22'
    };

    setItensAutorizacao([...itensAutorizacao, novoItem]);
    setCurrentItem({
      codigo: '', nome: '', tipo: 'procedimento',
      quantidade_autorizada: 1, quantidade_utilizada: 0,
      valor_unitario: 0, valor_total: 0, tabela_referencia: '22'
    });
    setSearchItemTerm('');
    toast.success('Item adicionado!');
  };

  // Remover item
  const removerItem = (itemId) => {
    setItensAutorizacao(itensAutorizacao.filter(item => item.id !== itemId));
    toast.success('Item removido');
  };

  // Calcular valor total
  const valorTotal = useMemo(() => {
    return itensAutorizacao.reduce((sum, item) => sum + (item.valor_total || 0), 0);
  }, [itensAutorizacao]);

  // Salvar autorização
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.paciente_id) {
      toast.error('Selecione um paciente');
      return;
    }
    if (itensAutorizacao.length === 0) {
      toast.error('Adicione pelo menos um item autorizado');
      return;
    }

    const autorizacaoData = {
      paciente_id: formData.paciente_id,
      convenio_id: formData.convenio_id,
      numero_guia_operadora: formData.numero_guia_operadora,
      data_autorizacao: formData.data_autorizacao,
      data_validade_senha: formData.data_validade_senha,
      senha_autorizacao: formData.senha_autorizacao,
      observacao: formData.observacao,
      itens: itensAutorizacao,
      valor_total: valorTotal,
      status: calcularStatus(itensAutorizacao)
    };

    try {
      if (editing) {
        await autorizacoesService.atualizar(editing.id, autorizacaoData);
        toast.success('Autorização atualizada!');
      } else {
        await autorizacoesService.criar(autorizacaoData);
        toast.success('Autorização criada!');
      }
      carregarDados();
      resetModal();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar autorização');
    }
  };

  // Cancelar autorização
  const handleCancelar = async (id, motivo) => {
    if (!motivo) {
      motivo = prompt('Informe o motivo do cancelamento:');
      if (!motivo) return;
    }
    
    try {
      await autorizacoesService.cancelar(id, motivo);
      toast.success('Autorização cancelada!');
      carregarDados();
    } catch (error) {
      toast.error('Erro ao cancelar autorização');
    }
  };

  // Renovar autorização
  const handleRenovar = async (id) => {
    const novaData = prompt('Nova data de validade (YYYY-MM-DD):', 
      new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]);
    if (!novaData) return;
    
    const novaSenha = prompt('Nova senha de autorização:');
    if (!novaSenha) return;
    
    try {
      await autorizacoesService.renovar(id, novaData, novaSenha);
      toast.success('Autorização renovada!');
      carregarDados();
    } catch (error) {
      toast.error('Erro ao renovar autorização');
    }
  };

  const resetModal = () => {
    setShowModal(false);
    setEditing(null);
    setItensAutorizacao([]);
    setFormData({
      paciente_id: '',
      convenio_id: '',
      numero_guia_operadora: '',
      data_autorizacao: new Date().toISOString().split('T')[0],
      data_validade_senha: '',
      senha_autorizacao: '',
      observacao: '',
      itens: []
    });
  };

  const handleEdit = (autorizacao) => {
    setEditing(autorizacao);
    setItensAutorizacao(autorizacao.itens || []);
    setFormData({
      paciente_id: autorizacao.paciente_id,
      convenio_id: autorizacao.convenio_id,
      numero_guia_operadora: autorizacao.numero_guia_operadora || '',
      data_autorizacao: autorizacao.data_autorizacao,
      data_validade_senha: autorizacao.data_validade_senha || '',
      senha_autorizacao: autorizacao.senha_autorizacao || '',
      observacao: autorizacao.observacao || '',
      itens: []
    });
    setShowModal(true);
  };

  const handleViewItens = (autorizacao) => {
    setSelectedAutorizacao(autorizacao);
    setShowItensModal(true);
  };

  const getStatusCor = (status) => {
    const cores = {
      ativa: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      expirada: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      cancelada: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      parcial: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    };
    return cores[status] || 'bg-gray-100 text-gray-700';
  };

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const podeEditar = (status) => {
    return status !== 'expirada' && status !== 'cancelada';
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
                Gerenciamento de autorizações de procedimentos pelos convênios
              </p>
            </div>
            <button 
              onClick={() => { setEditing(null); resetModal(); setShowModal(true); }} 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:shadow-lg transition-all"
            >
              <PlusIcon className="w-4 h-4" /> Nova Autorização
            </button>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex justify-between">
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{estatisticas.total}</p>
              </div>
              <DocumentPlusIcon className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex justify-between">
              <div>
                <p className="text-xs text-gray-500">Ativas</p>
                <p className="text-2xl font-bold text-green-600">{estatisticas.ativas}</p>
              </div>
              <CheckIcon className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex justify-between">
              <div>
                <p className="text-xs text-gray-500">Expiradas</p>
                <p className="text-2xl font-bold text-red-600">{estatisticas.expiradas}</p>
              </div>
              <ClockIcon className="w-8 h-8 text-red-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex justify-between">
              <div>
                <p className="text-xs text-gray-500">Canceladas</p>
                <p className="text-2xl font-bold text-gray-600">{estatisticas.canceladas}</p>
              </div>
              <XMarkIcon className="w-8 h-8 text-gray-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex justify-between">
              <div>
                <p className="text-xs text-gray-500">Valor Total</p>
                <p className="text-xl font-bold text-purple-600">R$ {estatisticas.valorTotal.toFixed(2)}</p>
              </div>
              <CurrencyDollarIcon className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar por paciente ou guia..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-8 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
              />
            </div>
            <select 
              value={filtroStatus} 
              onChange={(e) => setFiltroStatus(e.target.value)} 
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
            >
              <option value="todos">Todos os status</option>
              {STATUS_AUTORIZACAO.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select 
              value={filtroConvenio} 
              onChange={(e) => setFiltroConvenio(e.target.value)} 
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
            >
              <option value="todos">Todos os convênios</option>
              {convenios.map(c => (<option key={c.id} value={c.id}>{c.razao_social}</option>))}
            </select>
            <button 
              onClick={carregarDados} 
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-gray-200"
            >
              <RefreshIcon className="w-4 h-4" /> Atualizar
            </button>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Autorização</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validade</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Itens</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-36">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {autorizacoesFiltradas.map((a) => {
                  const isExpanded = expandedItems[a.id];
                  const diasRestantes = a.data_validade_senha ? 
                    differenceInDays(new Date(a.data_validade_senha), new Date()) : 0;
                  
                  return (
                    <React.Fragment key={a.id}>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                        <td className="px-4 py-3">
                          <button onClick={() => toggleExpand(a.id)} className="p-1 hover:bg-gray-100 rounded">
                            {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-blue-600">{a.numero_guia_operadora || '-'}</td>
                        <td className="px-4 py-3 text-sm">{a.paciente?.nome}</td>
                        <td className="px-4 py-3 text-sm">{a.convenio?.razao_social || '-'}</td>
                        <td className="px-4 py-3 text-sm">{format(new Date(a.data_autorizacao), 'dd/MM/yyyy')}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={diasRestantes < 0 ? 'text-red-600' : diasRestantes < 7 ? 'text-yellow-600' : 'text-gray-600'}>
                            {a.data_validade_senha ? format(new Date(a.data_validade_senha), 'dd/MM/yyyy') : '-'}
                            {diasRestantes >= 0 && diasRestantes < 7 && ` (${diasRestantes} dias)`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => handleViewItens(a)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 mx-auto">
                            <DocumentPlusIcon className="w-4 h-4" />
                            <span className="font-bold">{a.itens?.length || 0}</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">R$ {(a.valor_total || 0).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusCor(a.status)}`}>
                            {STATUS_AUTORIZACAO.find(s => s.value === a.status)?.label || a.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-1 justify-center">
                            <button onClick={() => handleViewItens(a)} className="p-1 rounded-lg text-gray-600 hover:bg-gray-100" title="Ver Itens">
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            {a.status === 'ativa' && (
                              <>
                                <button onClick={() => handleEdit(a)} className="p-1 rounded-lg text-blue-600 hover:bg-blue-50" title="Editar">
                                  <PencilIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleRenovar(a.id)} className="p-1 rounded-lg text-green-600 hover:bg-green-50" title="Renovar">
                                  <ArrowPathIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleCancelar(a.id)} className="p-1 rounded-lg text-red-600 hover:bg-red-50" title="Cancelar">
                                  <XMarkIcon className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button onClick={() => handleDelete(a.id)} className="p-1 rounded-lg text-red-600 hover:bg-red-50" title="Excluir">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && a.itens && (
                        <tr className="bg-gray-50 dark:bg-gray-700/30">
                          <td colSpan="10" className="px-4 py-3">
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold">Itens Autorizados</h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead className="bg-gray-100 dark:bg-gray-700">
                                    <tr>
                                      <th className="px-2 py-1 text-left">Código</th>
                                      <th className="px-2 py-1 text-left">Procedimento</th>
                                      <th className="px-2 py-1 text-center">Qtd Autorizada</th>
                                      <th className="px-2 py-1 text-center">Qtd Utilizada</th>
                                      <th className="px-2 py-1 text-center">Saldo</th>
                                      <th className="px-2 py-1 text-right">Valor Unit.</th>
                                      <th className="px-2 py-1 text-right">Valor Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {a.itens.map((item, idx) => {
                                      const saldo = (item.quantidade_autorizada || 0) - (item.quantidade_utilizada || 0);
                                      return (
                                        <tr key={idx} className="border-b border-gray-200">
                                          <td className="px-2 py-1 font-mono text-blue-600">{item.codigo}</td>
                                          <td className="px-2 py-1">{item.nome}</td>
                                          <td className="px-2 py-1 text-center">{item.quantidade_autorizada}</td>
                                          <td className="px-2 py-1 text-center">{item.quantidade_utilizada || 0}</td>
                                          <td className={`px-2 py-1 text-center font-semibold ${saldo > 0 ? 'text-green-600' : 'text-gray-500'}`}>{saldo}</td>
                                          <td className="px-2 py-1 text-right">R$ {(item.valor_unitario || 0).toFixed(2)}</td>
                                          <td className="px-2 py-1 text-right font-semibold">R$ {((item.valor_unitario || 0) * (item.quantidade_utilizada || 0)).toFixed(2)}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                              {a.observacao && (
                                <div className="mt-2 p-2 bg-gray-100 rounded">
                                  <span className="text-xs text-gray-500">Observações:</span>
                                  <p className="text-xs text-gray-600 mt-1">{a.observacao}</p>
                                </div>
                              )}
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

        {/* Modal de Cadastro/Edição */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">
                    {editing ? 'Editar Autorização' : 'Nova Autorização'}
                  </h3>
                  <button onClick={resetModal} className="p-2 rounded-lg hover:bg-gray-100">
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="p-5">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    {/* Dados do Paciente */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Buscar Paciente</label>
                        <div className="relative">
                          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Digite nome, CPF ou carteira..."
                            value={searchPacienteTerm}
                            onChange={(e) => setSearchPacienteTerm(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Paciente *</label>
                        <select 
                          value={formData.paciente_id} 
                          onChange={e => {
                            const paciente = pacientes.find(p => p.id === parseInt(e.target.value));
                            setFormData({
                              ...formData,
                              paciente_id: e.target.value,
                              convenio_id: paciente?.convenio_id || ''
                            });
                          }}
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          required
                        >
                          <option value="">Selecione um paciente</option>
                          {pacientesFiltrados.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.nome} - {p.numero_carteira} - {p.cpf || 'SEM CPF'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Dados da Autorização */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Número Guia Operadora</label>
                        <input 
                          type="text" 
                          value={formData.numero_guia_operadora} 
                          onChange={e => setFormData({...formData, numero_guia_operadora: e.target.value})}
                          className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
                          placeholder="Número fornecendo pela operadora"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Senha de Autorização</label>
                        <input 
                          type="text" 
                          value={formData.senha_autorizacao} 
                          onChange={e => setFormData({...formData, senha_autorizacao: e.target.value})}
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          placeholder="Senha fornecida pela operadora"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Data da Autorização</label>
                        <input 
                          type="date" 
                          value={formData.data_autorizacao} 
                          onChange={e => setFormData({...formData, data_autorizacao: e.target.value})}
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Data de Validade</label>
                        <input 
                          type="date" 
                          value={formData.data_validade_senha} 
                          onChange={e => setFormData({...formData, data_validade_senha: e.target.value})}
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    {/* Itens Autorizados */}
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <PlusIcon className="w-4 h-4 text-green-600" />
                        Itens Autorizados
                      </h4>
                      
                      {/* Busca de Procedimento */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Buscar Procedimento</label>
                        <div className="relative">
                          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={searchItemTerm}
                            onChange={e => setSearchItemTerm(e.target.value)}
                            placeholder="Digite código ou descrição..."
                            className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm"
                            list="itens-suggestions"
                          />
                          <datalist id="itens-suggestions">
                            {itensFiltrados.slice(0, 20).map(item => (
                              <option key={item.codigo_tuss} value={item.codigo_tuss}>
                                {item.codigo_tuss} - {item.nome}
                              </option>
                            ))}
                          </datalist>
                        </div>
                      </div>

                      {/* Seleção do Item */}
                      {searchItemTerm && itensFiltrados.length > 0 && (
                        <div className="border rounded-xl max-h-48 overflow-y-auto mb-4">
                          {itensFiltrados.slice(0, 10).map(item => (
                            <button
                              key={item.codigo_tuss}
                              type="button"
                              onClick={() => {
                                setCurrentItem({
                                  ...currentItem,
                                  codigo: item.codigo_tuss,
                                  nome: item.nome,
                                  valor_unitario: item.valor_convenio || item.valor_sugerido || 0
                                });
                                setSearchItemTerm('');
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                            >
                              <div className="flex justify-between">
                                <div>
                                  <span className="font-mono text-sm text-blue-600">{item.codigo_tuss}</span>
                                  <span className="text-sm ml-2">{item.nome}</span>
                                </div>
                                <span className="text-sm font-semibold text-green-600">
                                  R$ {(item.valor_convenio || item.valor_sugerido || 0).toFixed(2)}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Formulário do Item */}
                      {currentItem.codigo && (
                        <div className="border rounded-xl p-4 bg-gray-50 mb-4">
                          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                            <div className="md:col-span-2">
                              <label className="block text-xs text-gray-500 mb-1">Código</label>
                              <input type="text" value={currentItem.codigo} disabled className="w-full bg-white border rounded px-2 py-2 text-sm font-mono" />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-xs text-gray-500 mb-1">Procedimento</label>
                              <input type="text" value={currentItem.nome} disabled className="w-full bg-white border rounded px-2 py-2 text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Qtd. Autorizada</label>
                              <input 
                                type="number" 
                                min="1" 
                                value={currentItem.quantidade_autorizada} 
                                onChange={e => {
                                  const qtd = parseInt(e.target.value) || 1;
                                  setCurrentItem({
                                    ...currentItem,
                                    quantidade_autorizada: qtd,
                                    valor_total: qtd * currentItem.valor_unitario
                                  });
                                }}
                                className="w-full border rounded px-2 py-2 text-sm text-center"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Valor Unit. (R$)</label>
                              <input 
                                type="number" 
                                step="0.01" 
                                value={currentItem.valor_unitario} 
                                onChange={e => {
                                  const valor = parseFloat(e.target.value) || 0;
                                  setCurrentItem({
                                    ...currentItem,
                                    valor_unitario: valor,
                                    valor_total: currentItem.quantidade_autorizada * valor
                                  });
                                }}
                                className="w-full border rounded px-2 py-2 text-sm text-right"
                              />
                            </div>
                            <div className="flex items-end">
                              <button 
                                type="button" 
                                onClick={handleAdicionarItem}
                                className="w-full bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700"
                              >
                                + Adicionar
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Lista de Itens Adicionados */}
                      {itensAutorizacao.length > 0 && (
                        <div className="border rounded-xl overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs">Código</th>
                                  <th className="px-3 py-2 text-left text-xs">Procedimento</th>
                                  <th className="px-3 py-2 text-center text-xs">Qtd</th>
                                  <th className="px-3 py-2 text-right text-xs">Valor Unit.</th>
                                  <th className="px-3 py-2 text-right text-xs">Valor Total</th>
                                  <th className="px-3 py-2 text-center text-xs w-16">Ações</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {itensAutorizacao.map((item) => (
                                  <tr key={item.id}>
                                    <td className="px-3 py-2 text-xs font-mono text-blue-600">{item.codigo}</td>
                                    <td className="px-3 py-2 text-xs">{item.nome}</td>
                                    <td className="px-3 py-2 text-xs text-center">{item.quantidade_autorizada}</td>
                                    <td className="px-3 py-2 text-xs text-right">R$ {item.valor_unitario.toFixed(2)}</td>
                                    <td className="px-3 py-2 text-xs text-right font-semibold">R$ {item.valor_total.toFixed(2)}</td>
                                    <td className="px-3 py-2 text-center">
                                      <button type="button" onClick={() => removerItem(item.id)} className="text-red-600 hover:text-red-800">
                                        <TrashIcon className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="bg-gray-50">
                                <tr className="border-t">
                                  <td colSpan="4" className="px-3 py-2 text-right font-semibold">Total Autorizado:</td>
                                  <td className="px-3 py-2 text-right font-bold text-blue-600">R$ {valorTotal.toFixed(2)}</td>
                                  <td></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Observações */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Observações</label>
                      <textarea 
                        rows="3" 
                        value={formData.observacao} 
                        onChange={e => setFormData({...formData, observacao: e.target.value})}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        placeholder="Informações adicionais sobre a autorização..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                    <button type="button" onClick={resetModal} className="px-4 py-2 border rounded-lg text-sm font-medium">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium shadow-md">
                      {editing ? 'Atualizar' : 'Salvar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Visualização de Itens */}
        {showItensModal && selectedAutorizacao && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 p-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">Itens da Autorização</h3>
                  <button onClick={() => setShowItensModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 p-4 bg-gray-50 rounded-xl">
                  <div><span className="text-xs text-gray-500">Nº Guia:</span> <span className="text-sm font-mono">{selectedAutorizacao.numero_guia_operadora || '-'}</span></div>
                  <div><span className="text-xs text-gray-500">Paciente:</span> <span className="text-sm font-medium">{selectedAutorizacao.paciente?.nome}</span></div>
                  <div><span className="text-xs text-gray-500">Convênio:</span> <span className="text-sm">{selectedAutorizacao.convenio?.razao_social}</span></div>
                  <div><span className="text-xs text-gray-500">Data:</span> <span className="text-sm">{format(new Date(selectedAutorizacao.data_autorizacao), 'dd/MM/yyyy')}</span></div>
                </div>

                <h4 className="text-sm font-semibold mb-3">Itens Autorizados</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs">Código</th>
                        <th className="px-3 py-2 text-left text-xs">Procedimento</th>
                        <th className="px-3 py-2 text-center text-xs">Qtd Autorizada</th>
                        <th className="px-3 py-2 text-center text-xs">Qtd Utilizada</th>
                        <th className="px-3 py-2 text-center text-xs">Saldo</th>
                        <th className="px-3 py-2 text-right text-xs">Valor Unit.</th>
                        <th className="px-3 py-2 text-right text-xs">Valor Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedAutorizacao.itens?.map((item, idx) => {
                        const saldo = (item.quantidade_autorizada || 0) - (item.quantidade_utilizada || 0);
                        return (
                          <tr key={idx}>
                            <td className="px-3 py-2 text-xs font-mono text-blue-600">{item.codigo}</td>
                            <td className="px-3 py-2 text-xs">{item.nome}</td>
                            <td className="px-3 py-2 text-xs text-center">{item.quantidade_autorizada}</td>
                            <td className="px-3 py-2 text-xs text-center">{item.quantidade_utilizada || 0}</td>
                            <td className={`px-3 py-2 text-xs text-center font-semibold ${saldo > 0 ? 'text-green-600' : 'text-gray-500'}`}>{saldo}</td>
                            <td className="px-3 py-2 text-xs text-right">R$ {(item.valor_unitario || 0).toFixed(2)}</td>
                            <td className="px-3 py-2 text-xs text-right font-semibold">R$ {((item.valor_unitario || 0) * (item.quantidade_autorizada || 0)).toFixed(2)}</td>
                          </td>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr className="border-t">
                        <td colSpan="6" className="px-3 py-2 text-right font-semibold">Total:</td>
                        <td className="px-3 py-2 text-right font-bold text-blue-600">R$ {(selectedAutorizacao.valor_total || 0).toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {selectedAutorizacao.observacao && (
                  <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                    <p className="text-xs text-gray-500">Observações:</p>
                    <p className="text-sm text-gray-700 mt-1">{selectedAutorizacao.observacao}</p>
                  </div>
                )}

                <div className="flex justify-end mt-5 pt-4 border-t">
                  <button onClick={() => setShowItensModal(false)} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium">
                    Fechar
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
