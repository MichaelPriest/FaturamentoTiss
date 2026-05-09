// src/pages/Autorizacoes.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, 
  CheckIcon, XMarkIcon, EyeIcon, DocumentPlusIcon,
  CurrencyDollarIcon, CalendarIcon, UserGroupIcon,
  ClockIcon, ExclamationTriangleIcon, LockClosedIcon,
  LockOpenIcon, ArrowPathIcon, BuildingOfficeIcon,
  ChevronUpIcon, ChevronDownIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { supabase } from '../lib/supabaseClient';
import { autorizacoesService } from '../services/autorizacoesService';
import ResumoAutorizacao from '../components/autorizacoes/ResumoAutorizacao';
import ModalAutorizacao from '../components/autorizacoes/ModalAutorizacao';

// Constantes
const STATUS_AUTORIZACAO = [
  { value: 'ativa', label: 'Ativa', cor: 'green', icone: CheckIcon },
  { value: 'expirada', label: 'Expirada', cor: 'red', icone: ClockIcon },
  { value: 'cancelada', label: 'Cancelada', cor: 'gray', icone: XMarkIcon },
  { value: 'parcial', label: 'Parcialmente Utilizada', cor: 'yellow', icone: ExclamationTriangleIcon }
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
    
    const hoje = new Date();
    const proximasVencer = autorizacoes.filter(a => {
      if (a.status !== 'ativa') return false;
      if (!a.data_validade_senha) return false;
      const diasRestantes = differenceInDays(new Date(a.data_validade_senha), hoje);
      return diasRestantes >= 0 && diasRestantes <= 7;
    }).length;
    
    return { ativas, expiradas, canceladas, valorTotal, proximasVencer, total: autorizacoes.length };
  }, [autorizacoes]);

  // Salvar autorização
  const handleSave = async (dados) => {
    try {
      if (editing) {
        await autorizacoesService.atualizar(editing.id, dados);
        toast.success('Autorização atualizada!');
      } else {
        await autorizacoesService.criar(dados);
        toast.success('Autorização criada!');
      }
      carregarDados();
      setShowModal(false);
      setEditing(null);
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

  // Excluir autorização
  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta autorização?')) return;
    
    try {
      const { error } = await supabase
        .from('autorizacoes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Autorização excluída!');
      carregarDados();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir autorização');
    }
  };

  const handleEdit = (autorizacao) => {
    setEditing(autorizacao);
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
              onClick={() => { setEditing(null); setShowModal(true); }} 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:shadow-lg transition-all"
            >
              <PlusIcon className="w-4 h-4" /> Nova Autorização
            </button>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <ResumoAutorizacao estatisticas={estatisticas} />

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
                className="w-full pl-8 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>
            <select 
              value={filtroStatus} 
              onChange={(e) => setFiltroStatus(e.target.value)} 
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              <option value="todos">Todos os status</option>
              {STATUS_AUTORIZACAO.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select 
              value={filtroConvenio} 
              onChange={(e) => setFiltroConvenio(e.target.value)} 
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              <option value="todos">Todos os convênios</option>
              {convenios.map(c => (<option key={c.id} value={c.id}>{c.razao_social}</option>))}
            </select>
            <button 
              onClick={carregarDados} 
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
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
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Ações</th>
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
                          <button onClick={() => toggleExpand(a.id)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                            {isExpanded ? <ChevronUpIcon className="w-4 h-4 text-gray-400" /> : <ChevronDownIcon className="w-4 h-4 text-gray-400" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-blue-600 dark:text-blue-400">
                          {a.numero_guia_operadora || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                          {a.paciente?.nome}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {a.convenio?.razao_social || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {format(new Date(a.data_autorizacao), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={diasRestantes < 0 ? 'text-red-600' : diasRestantes < 7 ? 'text-yellow-600' : 'text-gray-600'}>
                            {a.data_validade_senha ? format(new Date(a.data_validade_senha), 'dd/MM/yyyy') : '-'}
                            {diasRestantes >= 0 && diasRestantes < 7 && ` (${diasRestantes} dias)`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => handleViewItens(a)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 mx-auto transition-colors">
                            <DocumentPlusIcon className="w-4 h-4" />
                            <span className="font-bold">{a.itens?.length || 0}</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">
                          R$ {(a.valor_total || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusCor(a.status)}`}>
                            {STATUS_AUTORIZACAO.find(s => s.value === a.status)?.label || a.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-1 justify-center">
                            <button onClick={() => handleViewItens(a)} className="p-1 rounded-lg text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Ver Itens">
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            {a.status === 'ativa' && (
                              <>
                                <button onClick={() => handleEdit(a)} className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Editar">
                                  <PencilIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleRenovar(a.id)} className="p-1 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors" title="Renovar">
                                  <ArrowPathIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleCancelar(a.id)} className="p-1 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Cancelar">
                                  <XMarkIcon className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {(a.status === 'expirada' || a.status === 'cancelada') && (
                              <button onClick={() => handleDelete(a.id)} className="p-1 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Excluir">
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && a.itens && (
                        <tr className="bg-gray-50 dark:bg-gray-700/30">
                          <td colSpan="10" className="px-4 py-3">
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Itens Autorizados</h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead className="bg-gray-100 dark:bg-gray-700">
                                    <tr>
                                      <th className="px-2 py-1 text-left text-gray-600 dark:text-gray-400">Código</th>
                                      <th className="px-2 py-1 text-left text-gray-600 dark:text-gray-400">Procedimento</th>
                                      <th className="px-2 py-1 text-center text-gray-600 dark:text-gray-400">Qtd Autorizada</th>
                                      <th className="px-2 py-1 text-center text-gray-600 dark:text-gray-400">Qtd Utilizada</th>
                                      <th className="px-2 py-1 text-center text-gray-600 dark:text-gray-400">Saldo</th>
                                      <th className="px-2 py-1 text-right text-gray-600 dark:text-gray-400">Valor Unit.</th>
                                      <th className="px-2 py-1 text-right text-gray-600 dark:text-gray-400">Valor Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {a.itens.map((item, idx) => {
                                      const saldo = (item.quantidade_autorizada || 0) - (item.quantidade_utilizada || 0);
                                      return (
                                        <tr key={idx}>
                                          <td className="px-2 py-1 font-mono text-blue-600">{item.codigo}</td>
                                          <td className="px-2 py-1">{item.nome}</td>
                                          <td className="px-2 py-1 text-center">{item.quantidade_autorizada}</td>
                                          <td className="px-2 py-1 text-center">{item.quantidade_utilizada || 0}</td>
                                          <td className={`px-2 py-1 text-center font-semibold ${saldo > 0 ? 'text-green-600' : 'text-gray-500'}`}>{saldo}</td>
                                          <td className="px-2 py-1 text-right">R$ {(item.valor_unitario || 0).toFixed(2)}</td>
                                          <td className="px-2 py-1 text-right font-semibold">R$ {((item.valor_unitario || 0) * (item.quantidade_autorizada || 0)).toFixed(2)}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                  <tfoot className="bg-gray-100 dark:bg-gray-700">
                                    <tr className="border-t">
                                      <td colSpan="6" className="px-2 py-1 text-right font-semibold text-gray-700">Total:</td>
                                      <td className="px-2 py-1 text-right font-bold text-blue-600">
                                        R$ {(a.itens || []).reduce((sum, i) => sum + ((i.valor_unitario || 0) * (i.quantidade_autorizada || 0)), 0).toFixed(2)}
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                              {a.observacao && (
                                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                  <span className="text-xs text-gray-500">Observações:</span>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{a.observacao}</p>
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
                    <td colSpan="10" className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
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
        <ModalAutorizacao
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
          onSave={handleSave}
          editing={editing}
          pacientes={pacientes}
          convenios={convenios}
          procedimentos={procedimentos}
          initialData={editing}
        />

        {/* Modal de Visualização de Itens */}
        {showItensModal && selectedAutorizacao && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Itens da Autorização
                  </h3>
                  <button onClick={() => setShowItensModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="p-5">
                {/* Informações da Autorização */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Nº Guia</span>
                    <span className="text-sm font-mono font-medium text-gray-900 dark:text-white block truncate">
                      {selectedAutorizacao.numero_guia_operadora || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Paciente</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white block">
                      {selectedAutorizacao.paciente?.nome}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Convênio</span>
                    <span className="text-sm text-gray-900 dark:text-white block">
                      {selectedAutorizacao.convenio?.razao_social}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Data</span>
                    <span className="text-sm text-gray-900 dark:text-white block">
                      {format(new Date(selectedAutorizacao.data_autorizacao), 'dd/MM/yyyy')}
                    </span>
                  </div>
                </div>

                {/* Tabela de Itens */}
                <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">
                  Itens Autorizados
                </h4>
                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Código</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Procedimento</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Qtd Autorizada</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Qtd Utilizada</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Saldo</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Valor Unit.</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Valor Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {selectedAutorizacao.itens?.map((item, idx) => {
                        const saldo = (item.quantidade_autorizada || 0) - (item.quantidade_utilizada || 0);
                        return (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-3 py-2 text-xs font-mono text-blue-600">{item.codigo}</td>
                            <td className="px-3 py-2 text-xs">{item.nome}</td>
                            <td className="px-3 py-2 text-xs text-center font-medium">{item.quantidade_autorizada}</td>
                            <td className="px-3 py-2 text-xs text-center">{item.quantidade_utilizada || 0}</td>
                            <td className={`px-3 py-2 text-xs text-center font-semibold ${saldo > 0 ? 'text-green-600' : 'text-gray-500'}`}>{saldo}</td>
                            <td className="px-3 py-2 text-xs text-right">R$ {(item.valor_unitario || 0).toFixed(2)}</td>
                            <td className="px-3 py-2 text-xs text-right font-semibold">R$ {((item.valor_unitario || 0) * (item.quantidade_autorizada || 0)).toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50 dark:bg-gray-700/50">
                      <tr className="border-t">
                        <td colSpan="6" className="px-3 py-2 text-right font-semibold text-gray-700">Total:</td>
                        <td className="px-3 py-2 text-right font-bold text-blue-600">
                          R$ {(selectedAutorizacao.valor_total || 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {selectedAutorizacao.observacao && (
                  <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-500">Observações:</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{selectedAutorizacao.observacao}</p>
                  </div>
                )}

                <div className="flex justify-end mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button onClick={() => setShowItensModal(false)} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium shadow-md hover:from-blue-600 hover:to-indigo-700 transition-all">
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
