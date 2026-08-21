import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRightIcon, CalendarDaysIcon, ChartBarIcon, CheckCircleIcon, ClockIcon,
  CurrencyDollarIcon, ExclamationTriangleIcon, HomeModernIcon, UserGroupIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../lib/supabaseClient';
import { useUnidade } from '../contexts/UnidadeContext';
import { getWorkspace } from '../lib/sectorWorkspaces';

const ACTIONS = {
  todos: [
    ['Agenda do dia','agendamentos',CalendarDaysIcon], ['Central hospitalar','operacao-hospitalar',HomeModernIcon],
    ['Lançar atendimento','atendimentos',CheckCircleIcon], ['Faturamento TISS','faturamento',CurrencyDollarIcon]
  ],
  recepcao: [['Pronto atendimento','pronto-atendimento',ClockIcon],['Novo atendimento','atendimentos',CheckCircleIcon],['Agenda','agendamentos',CalendarDaysIcon],['Fila de pacientes','chamados',UserGroupIcon]],
  assistencial: [['Pronto atendimento','pronto-atendimento',ClockIcon],['Central hospitalar','operacao-hospitalar',HomeModernIcon],['Apoio diagnóstico','apoio-diagnostico',ChartBarIcon],['Prescrição e enfermagem','prescricao-enfermagem',CheckCircleIcon]],
  diagnostico: [['Fila de exames','apoio-diagnostico',ChartBarIcon],['Pacientes','pacientes',UserGroupIcon],['Pronto atendimento','pronto-atendimento',ClockIcon],['Atendimentos','atendimentos',CheckCircleIcon]],
  farmacia: [['Estoque hospitalar','operacao-hospitalar',HomeModernIcon],['Agenda de administração','prescricao-enfermagem',ClockIcon],['Procedimentos','procedimentos',CheckCircleIcon]],
  faturamento: [['Contas e lotes','faturamento',CurrencyDollarIcon],['Autorizações','autorizacoes',CheckCircleIcon],['Glosas','glosas',ExclamationTriangleIcon],['Relatórios','relatorios',ChartBarIcon]],
  financeiro: [['Financeiro','financeiro',CurrencyDollarIcon],['Relatórios gerenciais','relatorios',ChartBarIcon],['Unidades','unidades',HomeModernIcon]],
  administracao: [['Configurações','configuracoes',CheckCircleIcon],['Unidades','unidades',HomeModernIcon],['Prestadores','prestadores',UserGroupIcon],['Homologação WS','homologacao-webservice',ChartBarIcon]]
};

const emptyMetrics = { pacientes: 0, agenda: 0, atendimentos: 0, internados: 0, pendencias: 0, faturamento: 0 };

export default function InicioSetor({ workspaceId = 'todos' }) {
  const navigate = useNavigate();
  const { unidadeAtualId, unidadeAtual } = useUnidade();
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [loading, setLoading] = useState(true);
  const workspace = getWorkspace(workspaceId);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);
      const queries = [
        supabase.from('pacientes').select('id', { count: 'exact', head: true }),
        supabase.from('agendamentos').select('id', { count: 'exact', head: true }).eq('data_agendamento', today),
        supabase.from('atendimentos').select('id', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00`),
        supabase.from('internacoes').select('id', { count: 'exact', head: true }).eq('status', 'ativa'),
        supabase.from('autorizacoes').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
        supabase.from('lotes_faturamento').select('dados_fatura').gte('created_at', `${today.slice(0, 7)}-01T00:00:00`)
      ];
      const responses = await Promise.all(queries);
      if (!active) return;
      setMetrics({
        pacientes: responses[0].count || 0, agenda: responses[1].count || 0,
        atendimentos: responses[2].count || 0, internados: responses[3].count || 0,
        pendencias: responses[4].count || 0,
        faturamento: (responses[5].data || []).reduce((total, item) => total + Number(item.dados_fatura?.base_calculo || 0), 0)
      });
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [unidadeAtualId]);

  const cards = useMemo(() => [
    ['Pacientes cadastrados',metrics.pacientes,UserGroupIcon,'text-blue-600','Base da unidade'],
    ['Agenda hoje',metrics.agenda,CalendarDaysIcon,'text-cyan-600','Compromissos previstos'],
    ['Atendimentos hoje',metrics.atendimentos,CheckCircleIcon,'text-emerald-600','Registros iniciados'],
    ['Internados',metrics.internados,HomeModernIcon,'text-violet-600','Internações ativas'],
    ['Autorizações pendentes',metrics.pendencias,ExclamationTriangleIcon,'text-amber-600','Exigem acompanhamento'],
    ['Produção mensal',metrics.faturamento.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}),CurrencyDollarIcon,'text-indigo-600','Valor registrado']
  ], [metrics]);

  return <div className="min-h-screen bg-slate-50 p-4 dark:bg-gray-950 md:p-6">
    <div className="mx-auto max-w-7xl space-y-7">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900 p-7 text-white shadow-xl md:p-9">
        <div className="max-w-3xl"><span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest">Workspace · {workspace.shortName}</span><h1 className="mt-5 text-3xl font-bold md:text-4xl">Olá, equipe de {workspace.name}</h1><p className="mt-2 text-blue-100">{workspace.description}. Você está acompanhando {unidadeAtual?.nome || 'a unidade selecionada'}.</p></div>
        <div className="mt-7 flex flex-wrap gap-3">{(ACTIONS[workspace.id] || ACTIONS.todos).map(([label,path,Icon]) => <button key={path} onClick={() => navigate(`/${path}`)} className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold backdrop-blur hover:bg-white/20"><Icon className="h-5 w-5" />{label}<ArrowRightIcon className="h-4 w-4" /></button>)}</div>
      </section>

      <section><div className="mb-4 flex items-end justify-between"><div><h2 className="text-lg font-bold text-slate-900 dark:text-white">Indicadores em tempo real</h2><p className="text-sm text-slate-500">Resumo operacional da unidade atual</p></div>{loading && <span className="text-xs text-blue-600">Atualizando...</span>}</div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([label,value,Icon,color,detail]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className={`mt-2 text-3xl font-bold ${color}`}>{loading ? '—' : value}</p><p className="mt-1 text-xs text-slate-400">{detail}</p></div><div className="rounded-xl bg-slate-100 p-3 dark:bg-gray-800"><Icon className={`h-6 w-6 ${color}`} /></div></div></article>)}</div></section>

      <section className="grid gap-5 lg:grid-cols-3"><article className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 lg:col-span-2"><h2 className="font-bold text-slate-900 dark:text-white">Fluxo recomendado do setor</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{(ACTIONS[workspace.id] || ACTIONS.todos).map(([label,path,Icon],index) => <button key={path} onClick={() => navigate(`/${path}`)} className="flex items-center gap-4 rounded-xl border border-slate-200 p-4 text-left hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-950/20"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">{index+1}</span><span className="flex-1"><strong className="block text-sm dark:text-white">{label}</strong><small className="text-slate-500">Abrir módulo operacional</small></span><Icon className="h-5 w-5 text-slate-400" /></button>)}</div></article><article className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"><h2 className="font-bold text-slate-900 dark:text-white">Segurança operacional</h2><div className="mt-5 space-y-4 text-sm"><Status label="Unidade selecionada" ok={Boolean(unidadeAtualId)} /><Status label="Sessão autenticada" ok /><Status label="Isolamento de dados" ok /><Status label="Pendências de autorização" ok={metrics.pendencias === 0} /></div></article></section>
    </div>
  </div>;
}

function Status({label,ok}) { return <div className="flex items-center justify-between"><span className="text-slate-600 dark:text-gray-300">{label}</span><span className={`rounded-full px-2 py-1 text-xs font-semibold ${ok?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>{ok?'OK':'Atenção'}</span></div>; }
