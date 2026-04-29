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
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
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

  const carregarStats = () => {
    const convenios = JSON.parse(localStorage.getItem('convenios') || '[]');
    const pacientes = JSON.parse(localStorage.getItem('pacientes') || '[]');
    const atendimentos = JSON.parse(localStorage.getItem('atendimentos') || '[]');
    const guias = JSON.parse(localStorage.getItem('guias_geradas') || '[]');
    
    const pendentes = atendimentos.filter(a => a.status === 'pendente');
    const faturados = atendimentos.filter(a => a.status === 'faturado');
    const guiasPendentes = guias.filter(g => g.status === 'pendente');
    const guiasFaturadas = guias.filter(g => g.status === 'gerado');
    
    const valorTotalPendente = pendentes.reduce((sum, a) => sum + (a.valor_total || 0), 0);
    const valorTotalFaturado = faturados.reduce((sum, a) => sum + (a.valor_total || 0), 0);
    const faturadoMes = valorTotalFaturado * 0.8;
    const recebidoMes = faturadoMes * 0.7;
    const glosasMes = faturadoMes * 0.1;
    const taxaGlosa = faturadoMes > 0 ? (glosasMes / faturadoMes) * 100 : 0;
    const ticketMedio = atendimentos.length > 0 ? valorTotalFaturado / atendimentos.length : 0;
    
    setStats({
      totalConvenios: convenios.length,
      totalPacientes: pacientes.length,
      totalAtendimentos: atendimentos.length,
      totalGuias: guias.length,
      faturadoMes: faturadoMes,
      faturadoTotal: valorTotalFaturado,
      recebidoMes: recebidoMes,
      glosasMes: glosasMes,
      taxaGlosa: taxaGlosa,
      atendimentosPendentes: pendentes.length,
      guiasPendentes: guiasPendentes.length,
      guiasFaturadas: guiasFaturadas.length,
      valorPendente: valorTotalPendente,
      ticketMedio: ticketMedio
    });
  };

  const cards = [
    { name: 'Convênios', value: stats.totalConvenios, icon: BuildingOfficeIcon, color: 'bg-blue-500', change: '+' },
    { name: 'Pacientes', value: stats.totalPacientes, icon: UsersIcon, color: 'bg-green-500', change: '+' },
    { name: 'Atendimentos', value: stats.totalAtendimentos, icon: DocumentTextIcon, color: 'bg-purple-500', change: '+' },
    { name: 'Faturamento Mensal', value: `R$ ${stats.faturadoMes.toFixed(2)}`, icon: CurrencyDollarIcon, color: 'bg-emerald-500', change: '+' },
  ];

  const getTaxaGlosaColor = () => {
    if (stats.taxaGlosa < 5) return 'text-green-600 bg-green-100';
    if (stats.taxaGlosa < 10) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Dashboard</h2>
      
      {/* Cards principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => (
          <div key={card.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.name}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{card.value}</p>
              </div>
              <div className={`${card.color} p-3 rounded-xl`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cards de métricas financeiras */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Faturamento Total</p>
              <p className="text-xl font-bold text-green-600">R$ {stats.faturadoTotal.toFixed(2)}</p>
            </div>
            <ArrowTrendingUpIcon className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Recebido no Mês</p>
              <p className="text-xl font-bold text-blue-600">R$ {stats.recebidoMes.toFixed(2)}</p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Glosas no Mês</p>
              <p className="text-xl font-bold text-red-600">R$ {stats.glosasMes.toFixed(2)}</p>
            </div>
            <ArrowTrendingDownIcon className="w-8 h-8 text-red-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Ticket Médio</p>
              <p className="text-xl font-bold text-purple-600">R$ {stats.ticketMedio.toFixed(2)}</p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Status e Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Atendimentos Pendentes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Atendimentos Pendentes</h3>
            <span className="text-xs text-gray-400">Aguardando faturamento</span>
          </div>
          <div className="text-center py-6">
            <ClockIcon className="w-14 h-14 text-yellow-400 mx-auto mb-3" />
            <p className="text-3xl font-bold text-yellow-600">{stats.atendimentosPendentes}</p>
            <p className="text-sm text-gray-500 mt-1">atendimentos aguardando</p>
            <p className="text-xs text-gray-400 mt-2">Valor pendente: R$ {stats.valorPendente.toFixed(2)}</p>
          </div>
          {stats.atendimentosPendentes > 0 && (
            <button className="w-full mt-2 bg-yellow-500 text-white py-2 rounded-lg text-sm hover:bg-yellow-600 transition-colors">
              Faturar Agora
            </button>
          )}
        </div>

        {/* Alertas e Indicadores */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Indicadores</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Guias Geradas</p>
                  <p className="text-xs text-blue-600">Total de lotes enviados</p>
                </div>
              </div>
              <span className="text-xl font-bold text-blue-600">{stats.totalGuias}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">Guias Faturadas</p>
                  <p className="text-xs text-green-600">Lotes processados</p>
                </div>
              </div>
              <span className="text-xl font-bold text-green-600">{stats.guiasFaturadas}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <ClockIcon className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Guias Pendentes</p>
                  <p className="text-xs text-yellow-600">Aguardando envio</p>
                </div>
              </div>
              <span className="text-xl font-bold text-yellow-600">{stats.guiasPendentes}</span>
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
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
        <h4 className="text-md font-semibold text-blue-800 mb-3">🚀 Guia Rápido de Uso</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <span className="text-gray-700">Cadastre os <strong>Convênios</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <span className="text-gray-700">Cadastre os <strong>Prestadores</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <span className="text-gray-700">Cadastre os <strong>Procedimentos</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
            <span className="text-gray-700">Cadastre os <strong>Pacientes</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
            <span className="text-gray-700">Registre os <strong>Atendimentos</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">6</span>
            <span className="text-gray-700">Gere o <strong>XML TISS</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">7</span>
            <span className="text-gray-700">Envie o <strong>Lote</strong> para operadora</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">8</span>
            <span className="text-gray-700">Acompanhe as <strong>Glosas</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}