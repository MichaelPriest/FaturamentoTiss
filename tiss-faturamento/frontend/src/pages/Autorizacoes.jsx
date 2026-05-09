// src/pages/Autorizacoes.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusIcon, PencilIcon, MagnifyingGlassIcon, 
  CheckIcon, XMarkIcon, EyeIcon, DocumentPlusIcon,
  CurrencyDollarIcon, CalendarIcon,
  ClockIcon, ExclamationTriangleIcon, 
  ArrowPathIcon, BuildingOfficeIcon,
  ChevronUpIcon, ChevronDownIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { supabase } from '../lib/supabaseClient';
import { autorizacoesService } from '../services/autorizacoesService';

// Constantes de status
const STATUS_AUTORIZACAO = [
  { value: 'pendente', label: 'Sem Autorização', cor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icone: ClockIcon },
  { value: 'parcial', label: 'Parcialmente Autorizada', cor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icone: ExclamationTriangleIcon },
  { value: 'autorizado', label: 'Autorizada', cor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icone: CheckIcon },
  { value: 'faturado', label: 'Faturado', cor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icone: CurrencyDollarIcon },
  { value: 'finalizado', label: 'Finalizado', cor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icone: CheckIcon }
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
  
  // Estado para itens da autorização
  const [itensAutorizacao, setItensAutorizacao] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    codigo: '',
    nome: '',
    quantidade_autorizada: 1,
    valor_unitario: 0,
    pendente_autorizacao: false
  });
  const [searchItemTerm, setSearchItemTerm] = useState('');

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

  // Buscar atendimento por número de guia
  const handleBuscarAtendimento = async () => {
    if (!buscaNumeroGuia) {
      toast.error('Digite o número da guia');
      return;
    }
    
    setBuscandoAtendimento(true);
    try {
      const atendimento = await autorizacoesService.buscarPorNumeroGuia(buscaNumeroGuia);
      
      if (!atendimento) {
        toast.error('Guia não encontrada');
        setAtendimentoEncontrado(null);
        return;
      }
      
      setAtendimentoEncontrado(atendimento);
      setItensAutorizacao(atendimento.itens_autorizados || []);
      toast.success(`Guia encontrada: ${atendimento.paciente_nome}`);
    } catch (error) {
      console.error('Erro ao buscar guia:', error);
      toast.error('Erro ao buscar guia');
    } finally {
      setBuscandoAtendimento(false);
    }
  };

  // Adicionar item à autorização
  const handleAdicionarItem = () => {
    if (!currentItem.codigo) {
      toast.error('Selecione um procedimento');
      return;
    }

    if (itensAutorizacao.some(item => item.codigo === currentItem.codigo)) {
      toast.warning('Este procedimento já foi autorizado!');
      return;
    }

    const novoItem = {
      id: Date.now(),
      codigo: currentItem.codigo,
      nome: currentItem.nome,
      quantidade_autorizada: currentItem.quantidade_autorizada,
      quantidade_utilizada: 0,
      valor_unitario: currentItem.valor_unitario,
      valor_total: currentItem.valor_unitario * currentItem.quantidade_autorizada,
      pendente_autorizacao: false
    };

    setItensAutorizacao([...itensAutorizacao, novoItem]);
    setCurrentItem({
      codigo: '', nome: '', quantidade_autorizada: 1, valor_unitario: 0, pendente_autorizacao: false
    });
    setSearchItemTerm('');
    toast.success('Item adicionado!');
  };

  // Remover item da autorização
  const handleRemoverItem = (itemId) => {
    setItensAutorizacao(itensAutorizacao.filter(item => item.id !== itemId));
    toast.success('Item removido');
  };

  // Salvar autorização
  const handleSalvarAutorizacao = async () => {
    if (!atendimentoEncontrado) {
      toast.error('Nenhuma guia selecionada');
      return;
    }

    if (itensAutorizacao.length === 0) {
      toast.error('Adicione pelo menos um item autorizado');
      return;
    }

    try {
      await autorizacoesService.atualizarItensAutorizados(atendimentoEncontrado.id, itensAutorizacao);
      toast.success('Autorização salva com sucesso!');
      setShowModal(false);
      setAtendimentoEncontrado(null);
      setItensAutorizacao([]);
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
    setItensAutorizacao(atendimento.itens_autorizados || []);
    setShowModal(true);
  };

  // Filtrar autorizações
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

  // Calcular estatísticas
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
                Gerenciamento de autorizações de procedimentos por número de guia
              </p>
            </div>
            <button 
              onClick={() => { setEditing(null); setAtendimentoEncontrado(null); setItensAutorizacao([]); setBuscaNumeroGuia(''); setShowModal(true); }} 
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
                <p className="text-xs text-gray-500">Sem Autorização</p>
                <p className="text-2xl font-bold text-yellow-600">{estatisticas.pendentes}</p>
              </div>
              <ClockIcon className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex justify-between">
              <div>
                <p className="text-xs text-gray-500">Autorizadas</p>
                <p className="text-2xl font-bold text-green-600">{estatisticas.autorizados}</p>
              </div>
              <CheckIcon className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex justify-between">
              <div>
                <p className="text-xs text-gray-500">Parcialmente Autorizada</p>
                <p className="text-2xl font-bold text-orange-600">{estatisticas.parciais}</p>
              </div>
              <ExclamationTriangleIcon className="w-8 h-8 text-orange-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex justify-between">
              <div>
                <p className="text-xs text-gray-500">Faturados</p>
                <p className="text-2xl font-bold text-blue-600">{estatisticas.faturados}</p>
              </div>
              <CurrencyDollarIcon className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex justify-between">
              <div>
                <p className="text-xs text-gray-500">Finalizados</p>
                <p className="text-2xl font-bold text-purple-600">{estatisticas.finalizados}</p>
              </div>
              <CheckIcon className="w-8 h-8 text-purple-500 opacity-50" />
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
              <ArrowPathIcon className="w-4 h-4" /> Atualizar
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
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Ações</th>
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
                        <td className="px-4 py-3 font-mono text-sm font-semibold text-blue-600">
                          {a.numero_guia_prestador}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">
                          {a.paciente_nome}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {a.paciente_convenio_nome || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {a.data_autorizacao ? format(new Date(a.data_autorizacao), 'dd/MM/yyyy') : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={diasRestantes < 0 ? 'text-red-600' : diasRestantes < 7 ? 'text-yellow-600' : 'text-gray-600'}>
                            {a.data_validade_senha ? format(new Date(a.data_validade_senha), 'dd/MM/yyyy') : '-'}
                            {diasRestantes >= 0 && diasRestantes < 7 && ` (${diasRestantes} dias)`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => { setSelectedAutorizacao(a); setShowItensModal(true); }} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 mx-auto">
                            <DocumentPlusIcon className="w-4 h-4" />
                            <span className="font-bold">{a.itens?.length || 0}</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">
                          R$ {(a.valor_total || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusCor(a.status)}`}>
                            {getStatusLabel(a.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-1 justify-center">
                            <button onClick={() => { setSelectedAutorizacao(a); setShowItensModal(true); }} className="p-1 rounded-lg text-gray-600 hover:bg-gray-100" title="Ver Itens">
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            {/* Só permite editar se não estiver faturado ou finalizado */}
                            {a.status !== 'faturado' && a.status !== 'finalizado' && (
                              <button onClick={() => handleEditarAutorizacao(a)} className="p-1 rounded-lg text-blue-600 hover:bg-blue-50" title="Editar Autorização">
                                <PencilIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && a.itens && a.itens.length > 0 && (
                        <tr className="bg-gray-50 dark:bg-gray-700/30">
                          <td colSpan="10" className="px-4 py-3">
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
                                <tbody className="divide-y divide-gray-200">
                                  {a.itens.map((item, idx) => {
                                    const saldo = (item.quantidade_autorizada || 0) - (item.quantidade_utilizada || 0);
                                    return (
                                      <tr key={idx}>
                                        <td className="px-2 py-1 font-mono text-blue-600">{item.codigo}</td>
                                        <td className="px-2 py-1">{item.nome}</td>
                                        <td className="px-2 py-1 text-center">{item.quantidade_autorizada}</td>
                                        <td className="px-2 py-1 text-center">{item.quantidade_utilizada || 0}<td>
                                        <td className={`px-2 py-1 text-center font-semibold ${saldo > 0 ? 'text-green-600' : 'text-gray-500'}`}>{saldo}</td>
                                        <td className="px-2 py-1 text-right">R$ {(item.valor_unitario || 0).toFixed(2)}</td>
                                        <td className="px-2 py-1 text-right font-semibold">R$ {((item.valor_unitario || 0) * (item.quantidade_autorizada || 0)).toFixed(2)}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                                <tfoot className="bg-gray-100">
                                  <tr className="border-t">
                                    <td colSpan="6" className="px-2 py-1 text-right font-semibold">Total:</td>
                                    <td className="px-2 py-1 text-right font-bold text-blue-600">
                                      R$ {(a.itens || []).reduce((sum, i) => sum + ((i.valor_unitario || 0) * (i.quantidade_autorizada || 0)), 0).toFixed(2)}
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">
                    {editing ? 'Editar Autorização' : 'Nova Autorização'}
                  </h3>
                  <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="p-5">
                {/* Buscar por número de guia (apenas para nova autorização) */}
                {!editing && !atendimentoEncontrado && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Número da Guia *</label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={buscaNumeroGuia}
                        onChange={(e) => setBuscaNumeroGuia(e.target.value)}
                        placeholder="Digite o número da guia prestador..."
                        className="flex-1 border rounded-lg px-3 py-2 text-sm"
                      />
                      <button
                        onClick={handleBuscarAtendimento}
                        disabled={buscandoAtendimento}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                      >
                        {buscandoAtendimento ? 'Buscando...' : 'Buscar Guia'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Dados da guia encontrada */}
                {atendimentoEncontrado && (
                  <>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <span className="text-xs text-gray-500">Paciente</span>
                          <p className="text-sm font-medium">{atendimentoEncontrado.paciente_nome}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Carteira</span>
                          <p className="text-sm font-mono">{atendimentoEncontrado.numero_carteira}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Convênio</span>
                          <p className="text-sm">{atendimentoEncontrado.paciente_convenio_nome}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Data do Atendimento</span>
                          <p className="text-sm">{atendimentoEncontrado.data_atendimento ? format(new Date(atendimentoEncontrado.data_atendimento), 'dd/MM/yyyy') : '-'}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Status</span>
                          <p className="text-sm">{getStatusLabel(atendimentoEncontrado.status)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Adicionar Itens Autorizados */}
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <PlusIcon className="w-4 h-4 text-green-600" />
                        Itens Autorizados
                      </h4>
                      
                      {/* Buscar Procedimento */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Buscar Procedimento</label>
                        <div className="relative">
                          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={searchItemTerm}
                            onChange={(e) => setSearchItemTerm(e.target.value)}
                            placeholder="Digite código ou descrição..."
                            className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm"
                            list="itens-suggestions"
                          />
                          <datalist id="itens-suggestions">
                            {procedimentos.slice(0, 20).map(item => (
                              <option key={item.codigo_tuss} value={item.codigo_tuss}>
                                {item.codigo_tuss} - {item.nome}
                              </option>
                            ))}
                          </datalist>
                        </div>
                      </div>

                      {/* Formulário do Item */}
                      {currentItem.codigo && (
                        <div className="border rounded-xl p-4 bg-gray-50 mb-4">
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
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
                                Adicionar
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
                                      <button type="button" onClick={() => handleRemoverItem(item.id)} className="text-red-600 hover:text-red-800">
                                        <TrashIcon className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="bg-gray-50">
                                <tr className="border-t">
                                  <td colSpan="4" className="px-3 py-2 text-right font-semibold">Total Autorizado:</td>
                                  <td className="px-3 py-2 text-right font-bold text-blue-600">
                                    R$ {itensAutorizacao.reduce((sum, i) => sum + (i.valor_total || 0), 0).toFixed(2)}
                                  </td>
                                  </table>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                      <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm font-medium">Cancelar</button>
                      <button onClick={handleSalvarAutorizacao} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium shadow-md">
                        Salvar Autorização
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
                  <div><span className="text-xs text-gray-500">Nº Guia:</span> <span className="text-sm font-mono">{selectedAutorizacao.numero_guia_prestador}</span></div>
                  <div><span className="text-xs text-gray-500">Paciente:</span> <span className="text-sm font-medium">{selectedAutorizacao.paciente_nome}</span></div>
                  <div><span className="text-xs text-gray-500">Convênio:</span> <span className="text-sm">{selectedAutorizacao.paciente_convenio_nome}</span></div>
                  <div><span className="text-xs text-gray-500">Status:</span> <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusCor(selectedAutorizacao.status)}`}>{getStatusLabel(selectedAutorizacao.status)}</span></div>
                </div>

                <h4 className="text-sm font-semibold mb-3">Itens Autorizados</h4>
                <div className="overflow-x-auto border rounded-xl">
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
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr className="border-t">
                        <td colSpan="6" className="px-3 py-2 text-right font-semibold">Total:</td>
                        <td className="px-3 py-2 text-right font-bold text-blue-600">
                          R$ {(selectedAutorizacao.valor_total || 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="flex justify-end mt-5 pt-4 border-t">
                  <button onClick={() => setShowItensModal(false)} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium">Fechar</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
