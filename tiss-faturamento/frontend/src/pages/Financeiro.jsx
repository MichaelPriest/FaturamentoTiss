import { useState, useEffect, useMemo } from 'react';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  CalendarIcon,
  PlusCircleIcon,
  MinusCircleIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabaseClient';

export default function Financeiro() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  
  // Dados
  const [contasReceber, setContasReceber] = useState([]);
  const [contasPagar, setContasPagar] = useState([]);
  const [fluxoCaixa, setFluxoCaixa] = useState([]);
  const [convenios, setConvenios] = useState([]);
  const [lotes, setLotes] = useState([]);
  
  // Modals
  const [showContaReceberModal, setShowContaReceberModal] = useState(false);
  const [showContaPagarModal, setShowContaPagarModal] = useState(false);
  const [showRecebimentoModal, setShowRecebimentoModal] = useState(false);
  const [showPagamentoModal, setShowPagamentoModal] = useState(false);
  const [selectedConta, setSelectedConta] = useState(null);
  
  // Forms
  const [novaContaReceber, setNovaContaReceber] = useState({
    descricao: '',
    numero_lote: '',
    valor_total: 0,
    data_emissao: format(new Date(), 'yyyy-MM-dd'),
    data_vencimento: '',
    status: 'pendente',
    observacoes: ''
  });
  
  const [novaContaPagar, setNovaContaPagar] = useState({
    descricao: '',
    fornecedor: '',
    categoria: 'operacional',
    valor_total: 0,
    data_emissao: format(new Date(), 'yyyy-MM-dd'),
    data_vencimento: '',
    status: 'pendente',
    observacoes: ''
  });
  
  const [valorRecebimento, setValorRecebimento] = useState(0);
  const [dataRecebimento, setDataRecebimento] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [valorPagamento, setValorPagamento] = useState(0);
  const [dataPagamento, setDataPagamento] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // Filtros
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [mesSelecionado, setMesSelecionado] = useState(format(new Date(), 'yyyy-MM'));

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [receberRes, pagarRes, fluxoRes, conveniosRes, lotesRes] = await Promise.all([
        supabase.from('contas_receber').select('*').order('data_vencimento', { ascending: true }),
        supabase.from('contas_pagar').select('*').order('data_vencimento', { ascending: true }),
        supabase.from('fluxo_caixa').select('*').order('data', { ascending: false }),
        supabase.from('convenios').select('id, razao_social').eq('ativo', true),
        supabase.from('lotes_faturamento').select('numero_lote, convenio_nome, dados_fatura')
      ]);

      setContasReceber(receberRes.data || []);
      setContasPagar(pagarRes.data || []);
      setFluxoCaixa(fluxoRes.data || []);
      setConvenios(conveniosRes.data || []);
      setLotes(lotesRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  };

  // ===== CONTAS A RECEBER =====
  const handleAddContaReceber = async () => {
    if (!novaContaReceber.descricao || novaContaReceber.valor_total <= 0) {
      toast.error('Preencha descrição e valor');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('contas_receber')
        .insert([{ ...novaContaReceber, created_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;

      setContasReceber([data, ...contasReceber]);
      toast.success('Conta a receber registrada!');
      setShowContaReceberModal(false);
      setNovaContaReceber({
        descricao: '',
        numero_lote: '',
        valor_total: 0,
        data_emissao: format(new Date(), 'yyyy-MM-dd'),
        data_vencimento: '',
        status: 'pendente',
        observacoes: ''
      });
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao registrar conta');
    }
  };

  const handleReceber = async () => {
    if (!selectedConta || valorRecebimento <= 0) return;

    try {
      const { error } = await supabase
        .from('contas_receber')
        .update({
          valor_recebido: valorRecebimento,
          data_recebimento: dataRecebimento,
          status: 'recebido',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedConta.id);

      if (error) throw error;

      // Registrar no fluxo de caixa
      await supabase.from('fluxo_caixa').insert([{
        tipo: 'entrada',
        descricao: `Recebimento: ${selectedConta.descricao}`,
        valor: valorRecebimento,
        data: dataRecebimento,
        conta_id: selectedConta.id,
        origem: 'conta_receber'
      }]);

      await carregarDados();
      toast.success('Recebimento registrado!');
      setShowRecebimentoModal(false);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao registrar recebimento');
    }
  };

  // ===== CONTAS A PAGAR =====
  const handleAddContaPagar = async () => {
    if (!novaContaPagar.descricao || novaContaPagar.valor_total <= 0) {
      toast.error('Preencha descrição e valor');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('contas_pagar')
        .insert([{ ...novaContaPagar, created_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;

      setContasPagar([data, ...contasPagar]);
      toast.success('Conta a pagar registrada!');
      setShowContaPagarModal(false);
      setNovaContaPagar({
        descricao: '',
        fornecedor: '',
        categoria: 'operacional',
        valor_total: 0,
        data_emissao: format(new Date(), 'yyyy-MM-dd'),
        data_vencimento: '',
        status: 'pendente',
        observacoes: ''
      });
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao registrar conta');
    }
  };

  const handlePagar = async () => {
    if (!selectedConta || valorPagamento <= 0) return;

    try {
      const { error } = await supabase
        .from('contas_pagar')
        .update({
          valor_pago: valorPagamento,
          data_pagamento: dataPagamento,
          status: 'pago',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedConta.id);

      if (error) throw error;

      await supabase.from('fluxo_caixa').insert([{
        tipo: 'saida',
        descricao: `Pagamento: ${selectedConta.descricao}`,
        valor: valorPagamento,
        data: dataPagamento,
        conta_id: selectedConta.id,
        origem: 'conta_pagar'
      }]);

      await carregarDados();
      toast.success('Pagamento registrado!');
      setShowPagamentoModal(false);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao registrar pagamento');
    }
  };

  // ===== FILTROS E ESTATÍSTICAS =====
  const receberFiltradas = useMemo(() => {
    if (filtroStatus === 'todos') return contasReceber;
    if (filtroStatus === 'vencidas') return contasReceber.filter(c => c.status === 'pendente' && new Date(c.data_vencimento) < new Date());
    return contasReceber.filter(c => c.status === filtroStatus);
  }, [contasReceber, filtroStatus]);

  const pagarFiltradas = useMemo(() => {
    if (filtroStatus === 'todos') return contasPagar;
    if (filtroStatus === 'vencidas') return contasPagar.filter(c => c.status === 'pendente' && new Date(c.data_vencimento) < new Date());
    return contasPagar.filter(c => c.status === filtroStatus);
  }, [contasPagar, filtroStatus]);

  const fluxoDoMes = useMemo(() => {
    const inicio = startOfMonth(new Date(mesSelecionado + '-01'));
    const fim = endOfMonth(inicio);
    return fluxoCaixa.filter(f => {
      const data = new Date(f.data);
      return data >= inicio && data <= fim;
    });
  }, [fluxoCaixa, mesSelecionado]);

  const stats = useMemo(() => {
    const totalReceber = contasReceber.filter(c => c.status !== 'cancelado').reduce((s, c) => s + c.valor_total, 0);
    const totalRecebido = contasReceber.filter(c => c.status === 'recebido').reduce((s, c) => s + c.valor_recebido, 0);
    const totalPagar = contasPagar.filter(c => c.status !== 'cancelado').reduce((s, c) => s + c.valor_total, 0);
    const totalPago = contasPagar.filter(c => c.status === 'pago').reduce((s, c) => s + c.valor_pago, 0);
    const totalEntradas = fluxoCaixa.filter(f => f.tipo === 'entrada').reduce((s, f) => s + f.valor, 0);
    const totalSaidas = fluxoCaixa.filter(f => f.tipo === 'saida').reduce((s, f) => s + f.valor, 0);

    return {
      totalReceber,
      totalRecebido,
      totalPagar,
      totalPago,
      saldoGeral: totalEntradas - totalSaidas,
      contasVencidas: contasReceber.filter(c => c.status === 'pendente' && new Date(c.data_vencimento) < new Date()).length
    };
  }, [contasReceber, contasPagar, fluxoCaixa]);

  const statusBadge = (status) => {
    const configs = {
      'pendente': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      'vencido': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      'recebido': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'pago': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'cancelado': 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return configs[status] || configs['pendente'];
  };

  const formatCurrency = (value) => `R$ ${(value || 0).toFixed(2)}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Financeiro</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Contas a receber, pagar e fluxo de caixa</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowContaPagarModal(true)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1">
              <MinusCircleIcon className="w-4 h-4" /> Conta a Pagar
            </button>
            <button onClick={() => setShowContaReceberModal(true)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1">
              <PlusCircleIcon className="w-4 h-4" /> Conta a Receber
            </button>
            <button onClick={carregarDados} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg text-sm flex items-center gap-1">
              <ArrowPathIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
            <p className="text-xs text-gray-500">A Receber</p>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(stats.totalReceber)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
            <p className="text-xs text-gray-500">Recebido</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(stats.totalRecebido)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
            <p className="text-xs text-gray-500">A Pagar</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(stats.totalPagar)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
            <p className="text-xs text-gray-500">Saldo</p>
            <p className={`text-xl font-bold ${stats.saldoGeral >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats.saldoGeral)}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'dashboard', label: 'Dashboard' },
            { key: 'receber', label: 'Contas a Receber' },
            { key: 'pagar', label: 'Contas a Pagar' },
            { key: 'fluxo', label: 'Fluxo de Caixa' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conteúdo das Tabs */}
        {/* ===== DASHBOARD ===== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Resumo Receber */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border p-6">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Resumo Contas a Receber</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Pendentes</span>
                    <span className="font-bold text-yellow-600">{contasReceber.filter(c => c.status === 'pendente').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Vencidas</span>
                    <span className="font-bold text-red-600">{stats.contasVencidas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Recebidas</span>
                    <span className="font-bold text-green-600">{contasReceber.filter(c => c.status === 'recebido').length}</span>
                  </div>
                </div>
              </div>

              {/* Resumo Pagar */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border p-6">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Resumo Contas a Pagar</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Pendentes</span>
                    <span className="font-bold text-yellow-600">{contasPagar.filter(c => c.status === 'pendente').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Pagas</span>
                    <span className="font-bold text-green-600">{contasPagar.filter(c => c.status === 'pago').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total Pago</span>
                    <span className="font-bold text-green-600">{formatCurrency(stats.totalPago)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== CONTAS A RECEBER ===== */}
        {activeTab === 'receber' && (
          <>
            <div className="flex gap-2 mb-4">
              {['todos', 'pendente', 'vencidas', 'recebido'].map(s => (
                <button
                  key={s}
                  onClick={() => setFiltroStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs ${filtroStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs">Descrição</th>
                    <th className="px-4 py-3 text-left text-xs">Lote</th>
                    <th className="px-4 py-3 text-right text-xs">Valor</th>
                    <th className="px-4 py-3 text-left text-xs">Vencimento</th>
                    <th className="px-4 py-3 text-left text-xs">Status</th>
                    <th className="px-4 py-3 text-center text-xs">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {receberFiltradas.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-xs text-gray-800 dark:text-white">{c.descricao}</td>
                      <td className="px-4 py-3 text-xs font-mono">{c.numero_lote || '-'}</td>
                      <td className="px-4 py-3 text-xs text-right font-semibold">{formatCurrency(c.valor_total)}</td>
                      <td className="px-4 py-3 text-xs">{c.data_vencimento ? format(new Date(c.data_vencimento + 'T00:00:00'), 'dd/MM/yyyy') : '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${statusBadge(c.status)}`}>{c.status}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {c.status === 'pendente' && (
                          <button
                            onClick={() => { setSelectedConta(c); setValorRecebimento(c.valor_total); setShowRecebimentoModal(true); }}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                          >
                            Receber
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {receberFiltradas.length === 0 && (
                    <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">Nenhuma conta encontrada</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ===== CONTAS A PAGAR ===== */}
        {activeTab === 'pagar' && (
          <>
            <div className="flex gap-2 mb-4">
              {['todos', 'pendente', 'vencidas', 'pago'].map(s => (
                <button
                  key={s}
                  onClick={() => setFiltroStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs ${filtroStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs">Descrição</th>
                    <th className="px-4 py-3 text-left text-xs">Fornecedor</th>
                    <th className="px-4 py-3 text-left text-xs">Categoria</th>
                    <th className="px-4 py-3 text-right text-xs">Valor</th>
                    <th className="px-4 py-3 text-left text-xs">Vencimento</th>
                    <th className="px-4 py-3 text-left text-xs">Status</th>
                    <th className="px-4 py-3 text-center text-xs">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {pagarFiltradas.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-xs text-gray-800 dark:text-white">{c.descricao}</td>
                      <td className="px-4 py-3 text-xs">{c.fornecedor || '-'}</td>
                      <td className="px-4 py-3 text-xs">{c.categoria}</td>
                      <td className="px-4 py-3 text-xs text-right font-semibold text-red-600">{formatCurrency(c.valor_total)}</td>
                      <td className="px-4 py-3 text-xs">{c.data_vencimento ? format(new Date(c.data_vencimento + 'T00:00:00'), 'dd/MM/yyyy') : '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${statusBadge(c.status)}`}>{c.status}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {c.status === 'pendente' && (
                          <button
                            onClick={() => { setSelectedConta(c); setValorPagamento(c.valor_total); setShowPagamentoModal(true); }}
                            className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                          >
                            Pagar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {pagarFiltradas.length === 0 && (
                    <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">Nenhuma conta encontrada</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ===== FLUXO DE CAIXA ===== */}
        {activeTab === 'fluxo' && (
          <>
            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm text-gray-500">Mês:</label>
              <input
                type="month"
                value={mesSelecionado}
                onChange={(e) => setMesSelecionado(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
                <p className="text-xs text-gray-500">Entradas</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(fluxoDoMes.filter(f => f.tipo === 'entrada').reduce((s, f) => s + f.valor, 0))}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
                <p className="text-xs text-gray-500">Saídas</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(fluxoDoMes.filter(f => f.tipo === 'saida').reduce((s, f) => s + f.valor, 0))}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
                <p className="text-xs text-gray-500">Saldo do Mês</p>
                <p className={`text-xl font-bold ${fluxoDoMes.reduce((s, f) => s + (f.tipo === 'entrada' ? f.valor : -f.valor), 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(fluxoDoMes.reduce((s, f) => s + (f.tipo === 'entrada' ? f.valor : -f.valor), 0))}
                </p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs">Data</th>
                    <th className="px-4 py-3 text-left text-xs">Descrição</th>
                    <th className="px-4 py-3 text-left text-xs">Tipo</th>
                    <th className="px-4 py-3 text-right text-xs">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {fluxoDoMes.map(f => (
                    <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-xs">{format(new Date(f.data + 'T00:00:00'), 'dd/MM/yyyy')}</td>
                      <td className="px-4 py-3 text-xs text-gray-800 dark:text-white">{f.descricao}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${f.tipo === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {f.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-xs text-right font-semibold ${f.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                        {f.tipo === 'entrada' ? '+' : '-'} {formatCurrency(f.valor)}
                      </td>
                    </tr>
                  ))}
                  {fluxoDoMes.length === 0 && (
                    <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500">Nenhum lançamento neste mês</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Modal: Nova Conta a Receber */}
        {showContaReceberModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Nova Conta a Receber</h3>
                <button onClick={() => setShowContaReceberModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Descrição *</label>
                  <input type="text" value={novaContaReceber.descricao} onChange={(e) => setNovaContaReceber({...novaContaReceber, descricao: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nº Lote</label>
                  <select value={novaContaReceber.numero_lote} onChange={(e) => setNovaContaReceber({...novaContaReceber, numero_lote: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="">Selecione...</option>
                    {lotes.map(l => <option key={l.numero_lote} value={l.numero_lote}>{l.numero_lote} - {l.convenio_nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Valor *</label>
                  <input type="number" step="0.01" value={novaContaReceber.valor_total} onChange={(e) => setNovaContaReceber({...novaContaReceber, valor_total: parseFloat(e.target.value) || 0})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Emissão</label>
                    <input type="date" value={novaContaReceber.data_emissao} onChange={(e) => setNovaContaReceber({...novaContaReceber, data_emissao: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Vencimento</label>
                    <input type="date" value={novaContaReceber.data_vencimento} onChange={(e) => setNovaContaReceber({...novaContaReceber, data_vencimento: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                </div>
              </div>
              <div className="p-5 border-t dark:border-gray-700 flex justify-end gap-3">
                <button onClick={() => setShowContaReceberModal(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
                <button onClick={handleAddContaReceber} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Salvar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Nova Conta a Pagar */}
        {showContaPagarModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Nova Conta a Pagar</h3>
                <button onClick={() => setShowContaPagarModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Descrição *</label>
                  <input type="text" value={novaContaPagar.descricao} onChange={(e) => setNovaContaPagar({...novaContaPagar, descricao: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Fornecedor</label>
                  <input type="text" value={novaContaPagar.fornecedor} onChange={(e) => setNovaContaPagar({...novaContaPagar, fornecedor: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Categoria</label>
                  <select value={novaContaPagar.categoria} onChange={(e) => setNovaContaPagar({...novaContaPagar, categoria: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="prestador">Prestador</option>
                    <option value="operacional">Operacional</option>
                    <option value="imposto">Imposto</option>
                    <option value="aluguel">Aluguel</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Valor *</label>
                  <input type="number" step="0.01" value={novaContaPagar.valor_total} onChange={(e) => setNovaContaPagar({...novaContaPagar, valor_total: parseFloat(e.target.value) || 0})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Emissão</label>
                    <input type="date" value={novaContaPagar.data_emissao} onChange={(e) => setNovaContaPagar({...novaContaPagar, data_emissao: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Vencimento</label>
                    <input type="date" value={novaContaPagar.data_vencimento} onChange={(e) => setNovaContaPagar({...novaContaPagar, data_vencimento: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                </div>
              </div>
              <div className="p-5 border-t dark:border-gray-700 flex justify-end gap-3">
                <button onClick={() => setShowContaPagarModal(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
                <button onClick={handleAddContaPagar} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Salvar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Recebimento */}
        {showRecebimentoModal && selectedConta && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm">
              <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Registrar Recebimento</h3>
                <button onClick={() => setShowRecebimentoModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-500">{selectedConta.descricao}</p>
                <p className="text-sm font-bold">Valor total: {formatCurrency(selectedConta.valor_total)}</p>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Valor Recebido</label>
                  <input type="number" step="0.01" value={valorRecebimento} onChange={(e) => setValorRecebimento(parseFloat(e.target.value) || 0)} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Data Recebimento</label>
                  <input type="date" value={dataRecebimento} onChange={(e) => setDataRecebimento(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
              </div>
              <div className="p-5 border-t dark:border-gray-700 flex justify-end gap-3">
                <button onClick={() => setShowRecebimentoModal(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
                <button onClick={handleReceber} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Confirmar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Pagamento */}
        {showPagamentoModal && selectedConta && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm">
              <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Registrar Pagamento</h3>
                <button onClick={() => setShowPagamentoModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-500">{selectedConta.descricao}</p>
                <p className="text-sm font-bold">Valor total: {formatCurrency(selectedConta.valor_total)}</p>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Valor Pago</label>
                  <input type="number" step="0.01" value={valorPagamento} onChange={(e) => setValorPagamento(parseFloat(e.target.value) || 0)} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Data Pagamento</label>
                  <input type="date" value={dataPagamento} onChange={(e) => setDataPagamento(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
              </div>
              <div className="p-5 border-t dark:border-gray-700 flex justify-end gap-3">
                <button onClick={() => setShowPagamentoModal(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
                <button onClick={handlePagar} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Confirmar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
