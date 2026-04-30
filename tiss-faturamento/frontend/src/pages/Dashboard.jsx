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
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { conveniosService, pacientesService, atendimentosService } from '../services/supabaseService';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalConvenios: 0,
    totalPacientes: 0,
    totalAtendimentos: 0,
    totalGuias: 0,
    faturadoMes: 0,
    faturadoTotal: 0,
    recebidoMes: 0,
    glosasMes: 0,
    taxaGlosa: 0,
    atendimentosPendentes: 0,
    guiasPendentes: 0,
    guiasFaturadas: 0,
    valorPendente: 0,
    ticketMedio: 0
  });

  useEffect(() => {
    carregarStats();
  }, []);

  const carregarStats = async () => {
    setLoading(true);
    try {
      const [convenios, pacientes, estatisticasAtendimentos] = await Promise.all([
        conveniosService.listar(),
        pacientesService.listar(),
        atendimentosService.getEstatisticas(),
      ]);
      
      const guiasList = JSON.parse(localStorage.getItem('guias_geradas') || '[]');
      const guiasPendentes = guiasList.filter(g => g.status === 'pendente');
      const guiasFaturadas = guiasList.filter(g => g.status === 'gerado');
      
      const faturadoMes = estatisticasAtendimentos.valorTotal * 0.8;
      const recebidoMes = faturadoMes * 0.7;
      const glosasMes = faturadoMes * 0.1;
      const taxaGlosa = faturadoMes > 0 ? (glosasMes / faturadoMes) * 100 : 0;
      const ticketMedio = estatisticasAtendimentos.total > 0 ? estatisticasAtendimentos.valorTotal / estatisticasAtendimentos.total : 0;
      
      setStats({
        totalConvenios: convenios.length,
        totalPacientes: pacientes.length,
        totalAtendimentos: estatisticasAtendimentos.total,
        totalGuias: guiasList.length,
        faturadoMes: faturadoMes,
        faturadoTotal: estatisticasAtendimentos.valorTotal,
        recebidoMes: recebidoMes,
        glosasMes: glosasMes,
        taxaGlosa: taxaGlosa,
        atendimentosPendentes: estatisticasAtendimentos.pendentes,
        guiasPendentes: guiasPendentes.length,
        guiasFaturadas: guiasFaturadas.length,
        valorPendente: estatisticasAtendimentos.valorPendente,
        ticketMedio: ticketMedio
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    { name: 'Convênios', value: stats.totalConvenios, icon: BuildingOfficeIcon, color: 'from-blue-500 to-blue-600' },
    { name: 'Pacientes', value: stats.totalPacientes, icon: UsersIcon, color: 'from-green-500 to-green-600' },
    { name: 'Atendimentos', value: stats.totalAtendimentos, icon: DocumentTextIcon, color: 'from-purple-500 to-purple-600' },
    { name: 'Faturamento Mensal', value: `R$ ${stats.faturadoMes.toFixed(2)}`, icon: CurrencyDollarIcon, color: 'from-emerald-500 to-emerald-600' },
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
            Visão geral do sistema de faturamento
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

      {/* Cards de métricas financeiras */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Faturamento Total</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">R$ {stats.faturadoTotal.toFixed(2)}</p>
            </div>
            <ArrowTrendingUpIcon className="w-8 h-8 text-green-200 dark:text-green-900" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Recebido no Mês</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">R$ {stats.recebidoMes.toFixed(2)}</p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-blue-200 dark:text-blue-900" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Glosas no Mês</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">R$ {stats.glosasMes.toFixed(2)}</p>
            </div>
            <ArrowTrendingDownIcon className="w-8 h-8 text-red-200 dark:text-red-900" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Ticket Médio</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">R$ {stats.ticketMedio.toFixed(2)}</p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-purple-200 dark:text-purple-900" />
          </div>
        </div>
      </div>

      {/* Status e Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Atendimentos Pendentes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Atendimentos Pendentes</h3>
            <span className="text-xs text-gray-400 dark:text-gray-500">Aguardando faturamento</span>
          </div>
          <div className="text-center py-6">
            <ClockIcon className="w-14 h-14 text-yellow-400 dark:text-yellow-500 mx-auto mb-3" />
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.atendimentosPendentes}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">atendimentos aguardando</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Valor pendente: R$ {stats.valorPendente.toFixed(2)}</p>
          </div>
          {stats.atendimentosPendentes > 0 && (
            <button className="w-full mt-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-2 rounded-lg text-sm hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 shadow-md">
              Faturar Agora
            </button>
          )}
        </div>

        {/* Alertas e Indicadores */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Indicadores</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <DocumentTextIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Guias Geradas</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Total de lotes enviados</p>
                </div>
              </div>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.totalGuias}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">Guias Faturadas</p>
                  <p className="text-xs text-green-600 dark:text-green-400">Lotes processados</p>
                </div>
              </div>
              <span className="text-xl font-bold text-green-600 dark:text-green-400">{stats.guiasFaturadas}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <ClockIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Guias Pendentes</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">Aguardando envio</p>
                </div>
              </div>
              <span className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{stats.guiasPendentes}</span>
            </div>

            <div className={`flex items-center justify-between p-3 rounded-lg ${getTaxaGlosaColor()}`}>
              <div className="flex items-center gap-3">
                <ExclamationTriangleIcon className="w-5 h-5" />
                <div>
                  <p className="text-sm font-medium">Taxa de Glosa</p>
                  <p className="text-xs">Percentual de glosas no período</p>
                </div>
              </div>
              <span className="text-xl font-bold">{stats.taxaGlosa.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dicas e instruções */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
        <h4 className="text-md font-semibold text-blue-800 dark:text-blue-300 mb-3">🚀 Guia Rápido de Uso</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <span className="text-gray-700 dark:text-gray-300">Cadastre os <strong>Convênios</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <span className="text-gray-700 dark:text-gray-300">Cadastre os <strong>Prestadores</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <span className="text-gray-700 dark:text-gray-300">Cadastre os <strong>Procedimentos</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
            <span className="text-gray-700 dark:text-gray-300">Cadastre os <strong>Pacientes</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
            <span className="text-gray-700 dark:text-gray-300">Registre os <strong>Atendimentos</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">6</span>
            <span className="text-gray-700 dark:text-gray-300">Gere o <strong>XML TISS</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">7</span>
            <span className="text-gray-700 dark:text-gray-300">Envie o <strong>Lote</strong> para operadora</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">8</span>
            <span className="text-gray-700 dark:text-gray-300">Acompanhe as <strong>Glosas</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
