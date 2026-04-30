// src/pages/Agendamentos.jsx - VERSÃO CORRIGIDA E COMPLETA
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon, 
  XMarkIcon, 
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  BeakerIcon,
  VideoCameraIcon,
  BellIcon,
  CheckBadgeIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ViewColumnsIcon,
  CalendarDaysIcon,
  ListBulletIcon,
  EyeIcon,
  FunnelIcon,
  ChartBarIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabaseClient';

const STATUS_AGENDAMENTO = [
  { value: 'agendado', label: 'Agendado', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'confirmado', label: 'Confirmado', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  { value: 'realizado', label: 'Realizado', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  { value: 'aguardando', label: 'Aguardando', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' }
];

const TIPO_AGENDAMENTO = [
  { value: 'consulta', label: 'Consulta' },
  { value: 'exame', label: 'Exame' },
  { value: 'procedimento', label: 'Procedimento' },
  { value: 'retorno', label: 'Retorno' },
  { value: 'teleconsulta', label: 'Teleconsulta' }
];

const MODALIDADE = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'teleconsulta', label: 'Teleconsulta' },
  { value: 'domicilio', label: 'Domicílio' }
];

const HORARIOS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
];

export default function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [prestadores, setPrestadores] = useState([]);
  const [convenios, setConvenios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showFiltros, setShowFiltros] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroModalidade, setFiltroModalidade] = useState('todos');
  const [filtroPrestador, setFiltroPrestador] = useState('todos');
  const [filtroConvenio, setFiltroConvenio] = useState('todos');
  const [viewMode, setViewMode] = useState('semana');
  const [currentDate, setCurrentDate] = useState(new Date());

  const [formData, setFormData] = useState({
    paciente_id: '',
    prestador_id: '',
    convenio_id: '',
    tipo: 'consulta',
    status: 'agendado',
    modalidade: 'presencial',
    data_agendamento: new Date().toISOString().split('T')[0],
    hora_inicio: '09:00',
    hora_fim: '09:30',
    observacao: '',
    local: '',
    link_teleconsulta: ''
  });

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [agendamentosRes, pacientesRes, prestadoresRes, conveniosRes] = await Promise.all([
        supabase.from('agendamentos').select('*').order('data_agendamento', { ascending: true }),
        supabase.from('pacientes').select('*').order('nome'),
        supabase.from('prestadores').select('*').order('nome'),
        supabase.from('convenios').select('*').order('razao_social')
      ]);

      if (agendamentosRes.error) throw agendamentosRes.error;
      if (pacientesRes.error) throw pacientesRes.error;
      if (prestadoresRes.error) throw prestadoresRes.error;
      if (conveniosRes.error) throw conveniosRes.error;

      console.log('Agendamentos carregados:', agendamentosRes.data?.length || 0);
      console.log('Primeiro agendamento:', agendamentosRes.data?.[0]);
      
      setAgendamentos(agendamentosRes.data || []);
      setPacientes(pacientesRes.data || []);
      setPrestadores(prestadoresRes.data || []);
      setConvenios(conveniosRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do Supabase');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const abrirModalNovo = () => {
    setEditing(null);
    setFormData({
      paciente_id: '',
      prestador_id: '',
      convenio_id: '',
      tipo: 'consulta',
      status: 'agendado',
      modalidade: 'presencial',
      data_agendamento: new Date().toISOString().split('T')[0],
      hora_inicio: '09:00',
      hora_fim: '09:30',
      observacao: '',
      local: '',
      link_teleconsulta: ''
    });
    setShowModal(true);
  };

  const salvarAgendamento = async () => {
    if (!formData.paciente_id) {
      toast.error('Selecione um paciente');
      return;
    }
    if (!formData.prestador_id) {
      toast.error('Selecione um profissional');
      return;
    }
    if (!formData.data_agendamento) {
      toast.error('Selecione uma data');
      return;
    }

    const paciente = pacientes.find(p => p.id === parseInt(formData.paciente_id));
    const prestador = prestadores.find(p => p.id === parseInt(formData.prestador_id));
    const convenio = convenios.find(c => c.id === paciente?.convenio_id);

    const novoAgendamento = {
      paciente_id: parseInt(formData.paciente_id),
      prestador_id: parseInt(formData.prestador_id),
      convenio_id: paciente?.convenio_id || null,
      tipo: formData.tipo,
      status: formData.status,
      modalidade: formData.modalidade,
      data_agendamento: formData.data_agendamento,
      hora_inicio: formData.hora_inicio,
      hora_fim: formData.hora_fim,
      observacao: formData.observacao || null,
      local: formData.local || null,
      link_teleconsulta: formData.link_teleconsulta || null,
      paciente_nome: paciente?.nome || '',
      paciente_carteira: paciente?.numero_carteira || '',
      prestador_nome: prestador?.nome || '',
      prestador_especialidade: prestador?.especialidade || '',
      convenio_nome: convenio?.razao_social || 'Sem convênio',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      let error;
      if (editing) {
        const result = await supabase
          .from('agendamentos')
          .update(novoAgendamento)
          .eq('id', editing.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('agendamentos')
          .insert([novoAgendamento]);
        error = result.error;
      }

      if (error) throw error;

      toast.success(editing ? 'Agendamento atualizado!' : 'Agendamento criado!');
      setShowModal(false);
      carregarDados();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar agendamento');
    }
  };

  const excluirAgendamento = async (id) => {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
      try {
        const { error } = await supabase.from('agendamentos').delete().eq('id', id);
        if (error) throw error;
        toast.success('Agendamento excluído!');
        carregarDados();
      } catch (error) {
        toast.error('Erro ao excluir');
      }
    }
  };

  const atualizarStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      toast.success(`Status atualizado para ${STATUS_AGENDAMENTO.find(s => s.value === status)?.label}`);
      carregarDados();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const navegarAnterior = () => {
    if (viewMode === 'dia') setCurrentDate(subDays(currentDate, 1));
    else if (viewMode === 'semana') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };

  const navegarProximo = () => {
    if (viewMode === 'dia') setCurrentDate(addDays(currentDate, 1));
    else if (viewMode === 'semana') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const irParaHoje = () => setCurrentDate(new Date());

  const getAgendamentosFiltrados = () => {
    let filtrados = [...agendamentos];
    console.log('Filtrando agendamentos, total:', filtrados.length);
    
    if (filtroStatus !== 'todos') {
      filtrados = filtrados.filter(a => a.status === filtroStatus);
    }
    if (filtroTipo !== 'todos') {
      filtrados = filtrados.filter(a => a.tipo === filtroTipo);
    }
    if (filtroModalidade !== 'todos') {
      filtrados = filtrados.filter(a => a.modalidade === filtroModalidade);
    }
    if (filtroPrestador !== 'todos') {
      filtrados = filtrados.filter(a => a.prestador_id === parseInt(filtroPrestador));
    }
    if (filtroConvenio !== 'todos') {
      filtrados = filtrados.filter(a => a.convenio_id === parseInt(filtroConvenio));
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtrados = filtrados.filter(a => 
        a.paciente_nome?.toLowerCase().includes(term) ||
        a.prestador_nome?.toLowerCase().includes(term)
      );
    }
    console.log('Após filtros:', filtrados.length);
    return filtrados;
  };

  const getAgendamentosPorData = (data) => {
    const dataStr = format(data, 'yyyy-MM-dd');
    const todosFiltrados = getAgendamentosFiltrados();
    const resultado = todosFiltrados.filter(a => a.data_agendamento === dataStr);
    console.log(`Agendamentos para ${dataStr}: ${resultado.length}`);
    return resultado;
  };

  const getDiasDaSemana = () => {
    const inicio = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(inicio, i));
  };

  const getEstatisticas = () => {
    const hoje = format(new Date(), 'yyyy-MM-dd');
    const inicioSemana = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const fimSemana = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const filtrados = getAgendamentosFiltrados();
    
    return {
      hoje: filtrados.filter(a => a.data_agendamento === hoje && a.status !== 'cancelado').length,
      semana: filtrados.filter(a => a.data_agendamento >= inicioSemana && a.data_agendamento <= fimSemana && a.status !== 'cancelado').length,
      total: filtrados.length,
      pendentes: filtrados.filter(a => a.status === 'agendado' || a.status === 'aguardando').length,
      realizados: filtrados.filter(a => a.status === 'realizado').length
    };
  };

  const podeAtender = (agendamento) => {
    return agendamento.status !== 'realizado' && agendamento.status !== 'cancelado';
  };

  const estatisticas = getEstatisticas();
  const diasDaSemana = getDiasDaSemana();

  // Debug: Mostrar agendamentos por data
  console.log('Data atual:', format(currentDate, 'yyyy-MM-dd'));
  console.log('Agendamentos hoje (view):', getAgendamentosPorData(currentDate).length);

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
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Agendamentos</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie consultas, exames e procedimentos</p>
          </div>
          <button
            onClick={abrirModalNovo}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Novo Agendamento
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-500">Hoje</p>
            <p className="text-2xl font-bold">{estatisticas.hoje}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-500">Esta Semana</p>
            <p className="text-2xl font-bold">{estatisticas.semana}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-purple-500">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold">{estatisticas.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-500">Pendentes</p>
            <p className="text-2xl font-bold">{estatisticas.pendentes}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-emerald-500">
            <p className="text-sm text-gray-500">Realizados</p>
            <p className="text-2xl font-bold">{estatisticas.realizados}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="p-4 border-b dark:border-gray-700">
            <button
              onClick={() => setShowFiltros(!showFiltros)}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600"
            >
              <FunnelIcon className="w-5 h-5" />
              Filtros
              {showFiltros ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
            </button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="todos">Todos os status</option>
                {STATUS_AGENDAMENTO.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="todos">Todos os tipos</option>
                {TIPO_AGENDAMENTO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <select
                value={filtroPrestador}
                onChange={(e) => setFiltroPrestador(e.target.value)}
                className="border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="todos">Todos os profissionais</option>
                {prestadores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            {showFiltros && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <select
                  value={filtroModalidade}
                  onChange={(e) => setFiltroModalidade(e.target.value)}
                  className="border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="todos">Todas as modalidades</option>
                  {MODALIDADE.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <select
                  value={filtroConvenio}
                  onChange={(e) => setFiltroConvenio(e.target.value)}
                  className="border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="todos">Todos os convênios</option>
                  {convenios.map(c => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex gap-2">
              <button onClick={navegarAnterior} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <button onClick={irParaHoje} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Hoje
              </button>
              <button onClick={navegarProximo} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('dia')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${viewMode === 'dia' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              >
                <ListBulletIcon className="w-4 h-4" /> Dia
              </button>
              <button
                onClick={() => setViewMode('semana')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${viewMode === 'semana' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              >
                <ViewColumnsIcon className="w-4 h-4" /> Semana
              </button>
              <button
                onClick={() => setViewMode('mes')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${viewMode === 'mes' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              >
                <CalendarDaysIcon className="w-4 h-4" /> Mês
              </button>
            </div>
          </div>
          <div className="text-center mt-3">
            <h2 className="text-xl font-semibold">
              {viewMode === 'dia' && format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              {viewMode === 'semana' && `Semana de ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "dd/MM")} a ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), "dd/MM/yyyy")}`}
              {viewMode === 'mes' && format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
            </h2>
          </div>
        </div>

        {/* View: Day */}
        {viewMode === 'dia' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="divide-y dark:divide-gray-700">
              {getAgendamentosPorData(currentDate).length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  Nenhum agendamento para este dia
                </div>
              )}
              {HORARIOS.map(hora => {
                const agendamento = getAgendamentosPorData(currentDate).find(a => a.hora_inicio === hora);
                const statusInfo = agendamento ? STATUS_AGENDAMENTO.find(s => s.value === agendamento.status) : null;
                return (
                  <div key={hora} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-20 font-mono font-bold">{hora}</div>
                        {agendamento ? (
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold">{agendamento.paciente_nome}</span>
                              <span className="text-xs text-gray-500">{agendamento.paciente_carteira}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${statusInfo?.color}`}>{statusInfo?.label}</span>
                            </div>
                            <div className="text-sm text-gray-500">{agendamento.prestador_nome}</div>
                          </div>
                        ) : (
                          <div className="flex-1 text-gray-400">Disponível</div>
                        )}
                      </div>
                      {agendamento && (
                        <div className="flex gap-1">
                          {podeAtender(agendamento) && (
                            <Link to={`/prontuario/${agendamento.id}`} className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg" title="Atender Paciente">
                              <CheckBadgeIcon className="w-5 h-5" />
                            </Link>
                          )}
                          <button onClick={() => {
                            setEditing(agendamento);
                            setFormData({
                              paciente_id: agendamento.paciente_id.toString(),
                              prestador_id: agendamento.prestador_id.toString(),
                              convenio_id: agendamento.convenio_id?.toString() || '',
                              tipo: agendamento.tipo,
                              status: agendamento.status,
                              modalidade: agendamento.modalidade,
                              data_agendamento: agendamento.data_agendamento,
                              hora_inicio: agendamento.hora_inicio,
                              hora_fim: agendamento.hora_fim,
                              observacao: agendamento.observacao || '',
                              local: agendamento.local || '',
                              link_teleconsulta: agendamento.link_teleconsulta || ''
                            });
                            setShowModal(true);
                          }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button onClick={() => excluirAgendamento(agendamento.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* View: Week */}
        {viewMode === 'semana' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-8 border-b dark:border-gray-700">
                <div className="p-3 font-semibold">Horário</div>
                {diasDaSemana.map((dia, idx) => (
                  <div key={idx} className="p-3 text-center font-semibold">
                    <div>{format(dia, 'EEE', { locale: ptBR })}</div>
                    <div className={`text-lg ${isSameDay(dia, new Date()) ? 'text-blue-600' : ''}`}>{format(dia, 'dd/MM')}</div>
                  </div>
                ))}
              </div>
              {HORARIOS.map(hora => (
                <div key={hora} className="grid grid-cols-8 border-b dark:border-gray-700">
                  <div className="p-3 font-mono">{hora}</div>
                  {diasDaSemana.map((dia, idx) => {
                    const agendamento = getAgendamentosPorData(dia).find(a => a.hora_inicio === hora);
                    return (
                      <div key={idx} className="p-2 border-l dark:border-gray-700 min-h-[80px]">
                        {agendamento ? (
                          <div className="text-sm">
                            <p className="font-medium">{agendamento.paciente_nome}</p>
                            <p className="text-xs text-gray-500">{agendamento.prestador_nome}</p>
                            <div className="flex gap-1 mt-1">
                              {podeAtender(agendamento) && (
                                <Link to={`/prontuario/${agendamento.id}`} className="text-cyan-600" title="Atender">
                                  <CheckBadgeIcon className="w-4 h-4" />
                                </Link>
                              )}
                              <button onClick={() => {
                                setEditing(agendamento);
                                setFormData({
                                  paciente_id: agendamento.paciente_id.toString(),
                                  prestador_id: agendamento.prestador_id.toString(),
                                  convenio_id: agendamento.convenio_id?.toString() || '',
                                  tipo: agendamento.tipo,
                                  status: agendamento.status,
                                  modalidade: agendamento.modalidade,
                                  data_agendamento: agendamento.data_agendamento,
                                  hora_inicio: agendamento.hora_inicio,
                                  hora_fim: agendamento.hora_fim,
                                  observacao: agendamento.observacao || '',
                                  local: agendamento.local || '',
                                  link_teleconsulta: agendamento.link_teleconsulta || ''
                                });
                                setShowModal(true);
                              }} className="text-blue-600">
                                <PencilIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditing(null);
                              setFormData({
                                ...formData,
                                data_agendamento: format(dia, 'yyyy-MM-dd'),
                                hora_inicio: hora,
                                hora_fim: HORARIOS[HORARIOS.indexOf(hora) + 1] || HORARIOS[HORARIOS.indexOf(hora)]
                              });
                              setShowModal(true);
                            }}
                            className="w-full h-full flex items-center justify-center text-gray-400 hover:text-blue-500"
                          >
                            <PlusIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View: Month */}
        {viewMode === 'mes' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-7 border-b dark:border-gray-700">
                {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(dia => (
                  <div key={dia} className="p-3 text-center font-semibold">{dia}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {(() => {
                  const start = startOfMonth(currentDate);
                  let startDay = start.getDay();
                  startDay = startDay === 0 ? 6 : startDay - 1;
                  let current = subDays(start, startDay);
                  const cells = [];
                  for (let i = 0; i < 42; i++) {
                    const isCurrentMonth = current.getMonth() === currentDate.getMonth();
                    const agendamentosDia = getAgendamentosPorData(current);
                    cells.push(
                      <div key={i} className={`border dark:border-gray-700 min-h-[100px] p-2 ${!isCurrentMonth ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}>
                        <div className={`font-medium ${isSameDay(current, new Date()) ? 'text-blue-600' : ''}`}>
                          {format(current, 'dd')}
                        </div>
                        <div className="space-y-1 mt-1">
                          {agendamentosDia.slice(0, 2).map(ag => (
                            <div key={ag.id} className="text-xs p-1 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-between">
                              <span><span className="font-mono">{ag.hora_inicio}</span> {ag.paciente_nome?.split(' ')[0]}</span>
                              {podeAtender(ag) && (
                                <Link to={`/prontuario/${ag.id}`} className="text-cyan-600">
                                  <CheckBadgeIcon className="w-3 h-3" />
                                </Link>
                              )}
                            </div>
                          ))}
                          {agendamentosDia.length > 2 && (
                            <div className="text-xs text-gray-500 text-center">+{agendamentosDia.length - 2}</div>
                          )}
                        </div>
                      </div>
                    );
                    current = addDays(current, 1);
                  }
                  return cells;
                })()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold">{editing ? 'Editar Agendamento' : 'Novo Agendamento'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Paciente *</label>
                  <select
                    value={formData.paciente_id}
                    onChange={(e) => setFormData({...formData, paciente_id: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                    required
                  >
                    <option value="">Selecione</option>
                    {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome} - {p.numero_carteira}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Profissional *</label>
                  <select
                    value={formData.prestador_id}
                    onChange={(e) => setFormData({...formData, prestador_id: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                    required
                  >
                    <option value="">Selecione</option>
                    {prestadores.map(p => <option key={p.id} value={p.id}>{p.nome} - {p.especialidade}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                  >
                    {TIPO_AGENDAMENTO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Modalidade</label>
                  <select
                    value={formData.modalidade}
                    onChange={(e) => setFormData({...formData, modalidade: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                  >
                    {MODALIDADE.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Data *</label>
                  <input
                    type="date"
                    value={formData.data_agendamento}
                    onChange={(e) => setFormData({...formData, data_agendamento: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Hora Início</label>
                    <input
                      type="time"
                      value={formData.hora_inicio}
                      onChange={(e) => setFormData({...formData, hora_inicio: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Hora Fim</label>
                    <input
                      type="time"
                      value={formData.hora_fim}
                      onChange={(e) => setFormData({...formData, hora_fim: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>
                {formData.modalidade === 'teleconsulta' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Link da Teleconsulta</label>
                    <input
                      type="url"
                      value={formData.link_teleconsulta}
                      onChange={(e) => setFormData({...formData, link_teleconsulta: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                      placeholder="https://meet.google.com/..."
                    />
                  </div>
                )}
                {formData.modalidade === 'presencial' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Local</label>
                    <input
                      type="text"
                      value={formData.local}
                      onChange={(e) => setFormData({...formData, local: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                      placeholder="Sala/Consultório"
                    />
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Observações</label>
                  <textarea
                    rows="3"
                    value={formData.observacao}
                    onChange={(e) => setFormData({...formData, observacao: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t dark:border-gray-700 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                Cancelar
              </button>
              <button onClick={salvarAgendamento} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {editing ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
