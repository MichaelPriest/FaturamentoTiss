import { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon, 
  BuildingOfficeIcon, 
  UsersIcon,
  DocumentTextIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowPathIcon,
  ArchiveBoxIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalConvenios: 0,
    totalPacientes: 0,
    totalPrestadores: 0,
    totalProcedimentos: 0,
    totalAtendimentos: 0,
    atendimentosFaturados: 0,      // status = 'faturado' (aguardando baixa)
    atendimentosFinalizados: 0,    // status = 'finalizado' (lote gerado)
    atendimentosPendentes: 0,
    totalLotes: 0,
    lotesGerados: 0,
    faturadoMes: 0,
    faturadoTotal: 0,
    valorPendente: 0,
    valorFinalizado: 0,
    ticketMedio: 0,
    ultimoLote: null,
    taxaGlosa: 0,
    recebidoMes: 0,
    glosasMes: 0,
    totalGlosas: 0,
    totalReceber: 0,
    totalPagar: 0
  });

  useEffect(() => {
    carregarStats();
  }, []);

  const carregarStats = async () => {
    setLoading(true);
    try {
      const [
        conveniosRes,
        pacientesRes,
        prestadoresRes,
        procedimentosRes,
        atendimentosRes,
        lotesRes,
        glosasRes,
        receberRes,
        pagarRes
      ] = await Promise.all([
        supabase.from('convenios').select('id', { count: 'exact', head: true }).eq('ativo', true),
        supabase.from('pacientes').select('id', { count: 'exact', head: true }),
        supabase.from('prestadores').select('id', { count: 'exact', head: true }),
        supabase.from('procedimentos').select('id', { count: 'exact', head: true }),
        supabase.from('atendimentos').select('status, valor_total, data_atendimento, created_at'),
        supabase.from('lotes_faturamento').select('*').order('created_at', { ascending: false }),
        supabase.from('glosas').select('valor_glosado, status'),
        supabase.from('contas_receber').select('valor_total, valor_recebido, status'),
        supabase.from('contas_pagar').select('valor_total, valor_pago, status')
      ]);

      const atendimentos = atendimentosRes.data || [];
      const lotes = lotesRes.data || [];
      const glosas = glosasRes.data || [];
      const contasReceber = receberRes.data || [];
      const contasPagar = pagarRes.data || [];

      // Contagem por status (CORRIGIDO: 'finalizado' em vez de 'finalizada')
      const faturados = atendimentos.filter(a => a.status === 'faturado');
      const finalizados = atendimentos.filter(a => a.status === 'finalizado');
      const pendentes = atendimentos.filter(a => !['faturado', 'finalizado', 'cancelado'].includes(a.status || ''));

      // Valores
      const valorPendente = faturados.reduce((sum, a) => sum + (a.valor_total || 0), 0);
      const valorFinalizado = finalizados.reduce((sum, a) => sum + (a.valor_total || 0), 0);
      
      // Faturamento total = soma dos valores das notas fiscais (lotes)
      const faturadoTotal = lotes.reduce((sum, l) => sum + (l.dados_fatura?.base_calculo || 0), 0);
      
      // Faturamento do mês atual
      const agora = new Date();
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();
      const lotesMes = lotes.filter(l => l.created_at >= inicioMes);
      const faturadoMes = lotesMes.reduce((sum, l) => sum + (l.dados_fatura?.base_calculo || 0), 0);

      // Ticket médio
      const ticketMedio = finalizados.length > 0 
        ? valorFinalizado / finalizados.length 
        : 0;

      // Último lote
      const ultimoLote = lotes.length > 0 ? lotes[0] : null;

      // Glosas
      const totalGlosas = glosas.reduce((sum, g) => sum + (g.valor_glosado || 0), 0);
      const glosasMes = glosas
        .filter(g => g.created_at >= inicioMes)
        .reduce((sum, g) => sum + (g.valor_glosado || 0), 0);
      const taxaGlosa = faturadoMes > 0 ? (glosasMes / faturadoMes) * 100 : 0;

      // Financeiro
      const totalReceber = contasReceber
        .filter(c => c.status === 'pendente')
        .reduce((sum, c) => sum + (c.valor_total || 0), 0);
      const totalPagar = contasPagar
        .filter(c => c.status === 'pendente')
        .reduce((sum, c) => sum + (c.valor_total || 0), 0);
      const recebidoMes = contasReceber
        .filter(c => c.status === 'recebido')
        .reduce((sum, c) => sum + (c.valor_recebido || 0), 0);

      setStats({
        totalConvenios: conveniosRes.count || 0,
        totalPacientes: pacientesRes.count || 0,
        totalPrestadores: prestadoresRes.count || 0,
        totalProcedimentos: procedimentosRes.count || 0,
        totalAtendimentos: atendimentos.length,
        atendimentosFaturados: faturados.length,
        atendimentosFinalizados: finalizados.length,
        atendimentosPendentes: pendentes.length,
        totalLotes: lotes.length,
        lotesGerados: lotes.filter(l => l.status === 'faturado').length,
        faturadoMes,
        faturadoTotal,
        valorPendente,
        valorFinalizado,
        ticketMedio,
        ultimoLote,
        taxaGlosa,
        recebidoMes,
        glosasMes,
        totalGlosas,
        totalReceber,
        totalPagar
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    { name: 'Convênios Ativos', value: stats.totalConvenios, icon: BuildingOfficeIcon, color: 'from-blue-500 to-blue-600' },
    { name: 'Pacientes', value: stats.totalPacientes, icon: UsersIcon, color: 'from-green-500 to-green-600' },
    { name: 'Prestadores', value: stats.totalPrestadores, icon: UsersIcon, color: 'from-indigo-500 to-indigo-600' },
    { name: 'Procedimentos', value: stats.totalProcedimentos, icon: DocumentTextIcon, color: 'from-cyan-500 to-cyan-600' },
    { name: 'Total Atendimentos', value: stats.totalAtendimentos, icon: DocumentTextIcon, color: 'from-purple-500 to-purple-600' },
    { name: 'Lotes Gerados', value: stats.totalLotes, icon: ArchiveBoxIcon, color: 'from-orange-500 to-orange-600' },
    { name: 'Faturado no Mês', value: `R$ ${stats.faturadoMes.toFixed(2)}`, icon: CurrencyDollarIcon, color: 'from-emerald-500 to-emerald-600' },
    { name: 'Valor a Faturar', value: `R$ ${stats.valorPendente.toFixed(2)}`, icon: ClockIcon, color: 'from-yellow-500 to-yellow-600' },
    { name: 'A Receber', value: `R$ ${stats.totalReceber.toFixed(2)}`, icon: BanknotesIcon, color: 'from-blue-500 to-blue-600' },
    { name: 'A Pagar', value: `R$ ${stats.totalPagar.toFixed(2)}`, icon: BanknotesIcon, color: 'from-red-500 to-red-600' },
    { name: 'Total Glosas', value: `R$ ${stats.totalGlosas.toFixed(2)}`, icon: ExclamationTriangleIcon, color: 'from-red-500 to-red-600' },
    { name: 'Recebido no Mês', value: `R$ ${stats.recebidoMes.toFixed(2)}`, icon: CheckCircleIcon, color: 'from-green-500 to-green-600' },
  ];

  const getTaxaGlosaColor = () => {
    if (stats.taxaGlosa < 5) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
    if (stats.taxaGlosa < 10) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
    return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <ArrowPathIcon className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Dashboard
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Visão geral do sistema de faturamento TISS
          </p>
        </div>
        <button 
          onClick={carregarStats}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Atualizar
        </button>
      </div>
      
      {/* Cards principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => (
          <div key={card.name} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.name}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{card.value}</p>
              </div>
              <div className={`bg-gradient-to-r ${card.color} p-3 rounded-xl shadow-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status dos Atendimentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Aguardando Faturamento */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Aguardando Faturamento</h3>
            <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded-full">status: faturado</span>
          </div>
          <div className="text-center py-6">
            <ClockIcon className="w-14 h-14 text-yellow-400 dark:text-yellow-500 mx-auto mb-3" />
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.atendimentosFaturados}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">atendimentos aguardando geração de lote</p>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mt-2">R$ {stats.valorPendente.toFixed(2)}</p>
          </div>
        </div>

        {/* Finalizados */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Finalizados</h3>
            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">status: finalizado</span>
          </div>
          <div className="text-center py-6">
            <CheckCircleIcon className="w-14 h-14 text-green-400 dark:text-green-500 mx-auto mb-3" />
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.atendimentosFinalizados}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">atendimentos com lote gerado</p>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mt-2">R$ {stats.valorFinalizado.toFixed(2)}</p>
          </div>
          {stats.ultimoLote && (
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-xs">
              <p className="text-gray-500 dark:text-gray-400">Último lote: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{stats.ultimoLote.numero_lote}</span></p>
              <p className="text-gray-500 dark:text-gray-400">Convênio: {stats.ultimoLote.convenio_nome}</p>
              <p className="text-gray-500 dark:text-gray-400">Data: {stats.ultimoLote.data_envio}</p>
            </div>
          )}
        </div>
      </div>

      {/* Guia rápido */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
        <h4 className="text-md font-semibold text-blue-800 dark:text-blue-300 mb-3">🚀 Fluxo de Faturamento TISS</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
            <span className="text-gray-700 dark:text-gray-300">Cadastre <strong>Convênios</strong> e <strong>Prestadores</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
            <span className="text-gray-700 dark:text-gray-300">Cadastre <strong>Pacientes</strong> e <strong>Procedimentos</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
            <span className="text-gray-700 dark:text-gray-300">Registre os <strong>Atendimentos</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">4</span>
            <span className="text-gray-700 dark:text-gray-300">Autorize os atendimentos</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">5</span>
            <span className="text-gray-700 dark:text-gray-300">Status muda para <strong>"faturado"</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">6</span>
            <span className="text-gray-700 dark:text-gray-300">Acesse o <strong>Faturamento</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">7</span>
            <span className="text-gray-700 dark:text-gray-300">Gere o <strong>Lote XML TISS</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">8</span>
            <span className="text-gray-700 dark:text-gray-300">Status muda para <strong>"finalizado"</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
