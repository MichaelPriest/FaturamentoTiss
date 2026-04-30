// src/pages/Agendamentos.jsx - VERSÃO FUNCIONAL
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon,
  CalendarIcon, ClockIcon, UserGroupIcon, BuildingOfficeIcon, BeakerIcon,
  VideoCameraIcon, BellIcon, CheckBadgeIcon, XCircleIcon,
  ChevronLeftIcon, ChevronRightIcon, ViewColumnsIcon, CalendarDaysIcon,
  ListBulletIcon, EyeIcon, FunnelIcon,
  ChevronUpIcon, ChevronDownIcon, HomeModernIcon
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
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [viewMode, setViewMode] = useState('dia');
  const [currentDate, setCurrentDate] = useState(new Date());

  const [formData, setFormData] = useState({
    paciente_id: '',
    prestador_id: '',
    sala_id: '',
    tipo: 'consulta',
    status: 'agendado',
    modalidade: 'presencial',
    data_agendamento: new Date().toISOString().split('T')[0],
    hora_inicio: '09:00',
    hora_fim: '09:30',
    observacao: '',
    local: ''
  });

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [agendamentosRes, pacientesRes, prestadoresRes, conveniosRes, salasRes] = await Promise.all([
        supabase.from('agendamentos').select('*'),
        supabase.from('pacientes').select('*'),
        supabase.from('prestadores').select('*'),
        supabase.from('convenios').select('*'),
        supabase.from('salas').select('*')
      ]);

      if (agendamentosRes.error) throw agendamentosRes.error;
      if (pacientesRes.error) throw pacientesRes.error;
      if (prestadoresRes.error) throw prestadoresRes.error;
      if (conveniosRes.error) throw conveniosRes.error;
      if (salasRes.error) throw salasRes.error;

      setAgendamentos(agendamentosRes.data || []);
      setPacientes(pacientesRes.data || []);
      setPrestadores(prestadoresRes.data || []);
      setConvenios(conveniosRes.data || []);
      setSalas(salasRes.data || []);
      
      console.log('Agendamentos carregados:', agendamentosRes.data);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Função para normalizar data (garantir formato YYYY-MM-DD)
  const normalizarData = (data) => {
    if (!data) return '';
    if (typeof data === 'string' && data.includes('-')) {
      return data.split('T')[0];
    }
    return data;
  };

  // Agendamentos filtrados
  const agendamentosFiltrados = agendamentos.filter(a => {
    if (filtroStatus !== 'todos' && a.status !== filtroStatus) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (a.paciente_nome?.toLowerCase().includes(term) ||
              a.prestador_nome?.toLowerCase().includes(term));
    }
    return true;
  });

  // Agendamentos para uma data específica
  const getAgendamentosPorData = (data) => {
    const dataStr = format(data, 'yyyy-MM-dd');
    return agendamentosFiltrados.filter(a => {
      const dataAgendamento = normalizarData(a.data_agendamento);
      return dataAgendamento === dataStr;
    });
  };

  const diasDaSemana = () => {
    const inicio = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(inicio, i));
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

  const salvarAgendamento = async () => {
    if (!formData.paciente_id) {
      toast.error('Selecione um paciente');
      return;
    }
    if (!formData.prestador_id) {
      toast.error('Selecione um profissional');
      return;
    }

    const paciente = pacientes.find(p => p.id === parseInt(formData.paciente_id));
    const prestador = prestadores.find(p => p.id === parseInt(formData.prestador_id));
    const sala = salas.find(s => s.id === parseInt(formData.sala_id));
    const convenio = convenios.find(c => c.id === paciente?.convenio_id);

    const novoAgendamento = {
      paciente_id: parseInt(formData.paciente_id),
      prestador_id: parseInt(formData.prestador_id),
      sala_id: formData.sala_id ? parseInt(formData.sala_id) : null,
      sala_nome: sala?.nome || null,
      tipo: formData.tipo,
      status: formData.status,
      modalidade: formData.modalidade,
      data_agendamento: formData.data_agendamento,
      hora_inicio: formData.hora_inicio,
      hora_fim: formData.hora_fim,
      observacao: formData.observacao || null,
      local: formData.local || null,
      paciente_nome: paciente?.nome || '',
      paciente_carteira: paciente?.numero_carteira || '',
      prestador_nome: prestador?.nome || '',
      prestador_especialidade: prestador?.especialidade || '',
      convenio_id: paciente?.convenio_id || null,
      convenio_nome: convenio?.razao_social || 'Sem convênio',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      if (editing) {
        const { error } = await supabase
          .from('agendamentos')
          .update(novoAgendamento)
          .eq('id', editing.id);
        if (error) throw error;
        toast.success('Atualizado!');
      } else {
        const { error } = await supabase
          .from('agendamentos')
          .insert([novoAgendamento]);
        if (error) throw error;
        toast.success('Agendamento criado!');
      }
      setShowModal(false);
      carregarDados();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao salvar');
    }
  };

  const excluirAgendamento = async (id) => {
    if (confirm('Excluir este agendamento?')) {
      const { error } = await supabase.from('agendamentos').delete().eq('id', id);
      if (error) {
        toast.error('Erro ao excluir');
      } else {
        toast.success('Excluído!');
        carregarDados();
      }
    }
  };

  const podeAtender = (agendamento) => {
    return agendamento.status !== 'realizado' && agendamento.status !== 'cancelado';
  };

  const formatarHora = (hora) => {
    if (!hora) return '';
    return hora.substring(0, 5);
  };

  const estatisticas = {
    hoje: agendamentosFiltrados.filter(a => {
      const dataAgendamento = normalizarData(a.data_agendamento);
      const hoje = format(new Date(), 'yyyy-MM-dd');
      return dataAgendamento === hoje && a.status !== 'cancelado';
    }).length,
    total: agendamentosFiltrados.length,
    pendentes: agendamentosFiltrados.filter(a => a.status === 'agendado' || a.status === 'aguardando').length,
    realizados: agendamentosFiltrados.filter(a => a.status === 'realizado').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Log para debug
  console.log('Modo:', viewMode);
  console.log('Data atual:', format(currentDate, 'yyyy-MM-dd'));
  console.log('Agendamentos hoje:', getAgendamentosPorData(new Date()).length);
  console.log('Agendamentos na data atual:', getAgendamentosPorData(currentDate).length);

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
            onClick={() => {
              setEditing(null);
              setFormData({
                paciente_id: '',
                prestador_id: '',
                sala_id: '',
                tipo: 'consulta',
                status: 'agendado',
                modalidade: 'presencial',
                data_agendamento: new Date().toISOString().split('T')[0],
                hora_inicio: '09:00',
                hora_fim: '09:30',
                observacao: '',
                local: ''
              });
              setShowModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Novo Agendamento
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-500 dark:text-gray-400">Hoje</p>
            <p className="text-2xl font-bold text-blue-600">{estatisticas.hoje}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
            <p className="text-2xl font-bold text-green-600">{estatisticas.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-500 dark:text-gray-400">Pendentes</p>
            <p className="text-2xl font-bold text-yellow-600">{estatisticas.pendentes}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-purple-500">
            <p className="text-sm text-gray-500 dark:text-gray-400">Realizados</p>
            <p className="text-2xl font-bold text-purple-600">{estatisticas.realizados}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar paciente ou profissional..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="todos">Todos os status</option>
              {STATUS_AGENDAMENTO.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* Navegação */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button onClick={navegarAnterior} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <button onClick={irParaHoje} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Hoje</button>
              <button onClick={navegarProximo} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setViewMode('dia')} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${viewMode === 'dia' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}>
                <ListBulletIcon className="w-4 h-4" /> Dia
              </button>
              <button onClick={() => setViewMode('semana')} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${viewMode === 'semana' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}>
                <ViewColumnsIcon className="w-4 h-4" /> Semana
              </button>
              <button onClick={() => setViewMode('mes')} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${viewMode === 'mes' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}>
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

        {/* VISUALIZAÇÃO DIA */}
        {viewMode === 'dia' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="bg-blue-600 text-white p-3">
              <h3 className="text-center font-semibold">
                {format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </h3>
            </div>
            <div className="divide-y dark:divide-gray-700">
              {getAgendamentosPorData(currentDate).length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  Nenhum agendamento para este dia
                </div>
              ) : (
                getAgendamentosPorData(currentDate).map(ag => {
                  const statusInfo = STATUS_AGENDAMENTO.find(s => s.value === ag.status);
                  return (
                    <div key={ag.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-24 font-mono font-bold text-lg">
                            {formatarHora(ag.hora_inicio)} - {formatarHora(ag.hora_fim)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-lg">{ag.paciente_nome}</span>
                              <span className="text-sm text-gray-500">{ag.paciente_carteira}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${statusInfo?.color}`}>
                                {statusInfo?.label}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {ag.prestador_nome}
                              {ag.sala_nome && <span className="ml-2">🏥 {ag.sala_nome}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {podeAtender(ag) && (
                            <Link to={`/prontuario/${ag.id}`} className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg" title="Atender">
                              <CheckBadgeIcon className="w-5 h-5" />
                            </Link>
                          )}
                          <button onClick={() => {
                            setEditing(ag);
                            setFormData({
                              paciente_id: ag.paciente_id?.toString() || '',
                              prestador_id: ag.prestador_id?.toString() || '',
                              sala_id: ag.sala_id?.toString() || '',
                              tipo: ag.tipo,
                              status: ag.status,
                              modalidade: ag.modalidade,
                              data_agendamento: ag.data_agendamento,
                              hora_inicio: ag.hora_inicio,
                              hora_fim: ag.hora_fim,
                              observacao: ag.observacao || '',
                              local: ag.local || ''
                            });
                            setShowModal(true);
                          }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button onClick={() => excluirAgendamento(ag.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* VISUALIZAÇÃO SEMANA */}
        {viewMode === 'semana' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
            <div className="bg-green-600 text-white p-3">
              <h3 className="text-center font-semibold">Agenda Semanal</h3>
            </div>
            <div className="p-4 min-w-[800px]">
              <div className="grid grid-cols-8 gap-2 mb-3">
                <div className="col-span-1"></div>
                {diasDaSemana().map((dia, idx) => (
                  <div key={idx} className="text-center">
                    <div className="font-bold">{format(dia, 'EEE', { locale: ptBR })}</div>
                    <div className={`text-lg font-bold ${isSameDay(dia, new Date()) ? 'text-blue-600' : ''}`}>
                      {format(dia, 'dd/MM')}
                    </div>
                  </div>
                ))}
              </div>
              {HORARIOS.map(hora => (
                <div key={hora} className="grid grid-cols-8 gap-2 mb-2">
                  <div className="col-span-1 text-sm font-mono font-bold pt-2">{hora}</div>
                  {diasDaSemana().map((dia, idx) => {
                    const ag = getAgendamentosPorData(dia).find(a => a.hora_inicio === hora);
                    return (
                      <div key={idx} className={`border rounded-lg p-2 min-h-[80px] ${ag ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 hover:bg-gray-100'}`}>
                        {ag ? (
                          <div className="text-sm">
                            <p className="font-medium truncate">{ag.paciente_nome}</p>
                            <p className="text-xs text-gray-500 truncate">{ag.prestador_nome}</p>
                            <div className="flex gap-1 mt-1">
                              {podeAtender(ag) && (
                                <Link to={`/prontuario/${ag.id}`} className="text-cyan-600">
                                  <CheckBadgeIcon className="w-4 h-4" />
                                </Link>
                              )}
                              <button onClick={() => {
                                setEditing(ag);
                                setFormData({
                                  paciente_id: ag.paciente_id?.toString() || '',
                                  prestador_id: ag.prestador_id?.toString() || '',
                                  sala_id: ag.sala_id?.toString() || '',
                                  tipo: ag.tipo,
                                  status: ag.status,
                                  modalidade: ag.modalidade,
                                  data_agendamento: ag.data_agendamento,
                                  hora_inicio: ag.hora_inicio,
                                  hora_fim: ag.hora_fim,
                                  observacao: ag.observacao || '',
                                  local: ag.local || ''
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
                                hora_fim: HORARIOS[HORARIOS.indexOf(hora) + 1] || hora
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

        {/* VISUALIZAÇÃO MÊS */}
        {viewMode === 'mes' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
            <div className="bg-purple-600 text-white p-3">
              <h3 className="text-center font-semibold">Calendário Mensal</h3>
            </div>
            <div className="p-4 min-w-[800px]">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(dia => (
                  <div key={dia} className="text-center font-semibold text-gray-500">{dia}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {(() => {
                  const start = startOfMonth(currentDate);
                  let startDay = start.getDay();
                  startDay = startDay === 0 ? 6 : startDay - 1;
                  let current = subDays(start, startDay);
                  const cells = [];
                  for (let i = 0; i < 42; i++) {
                    const isCurrentMonth = current.getMonth() === currentDate.getMonth();
                    const ags = getAgendamentosPorData(current);
                    cells.push(
                      <div key={i} className={`border rounded-lg p-1 min-h-[90px] ${!isCurrentMonth ? 'bg-gray-50' : 'bg-white'} ${isSameDay(current, new Date()) ? 'ring-2 ring-blue-500' : ''}`}>
                        <div className={`font-semibold text-sm p-1 ${isSameDay(current, new Date()) ? 'text-blue-600' : ''}`}>
                          {format(current, 'dd')}
                        </div>
                        <div className="space-y-1">
                          {ags.slice(0, 2).map(ag => (
                            <div key={ag.id} className="text-xs p-1 rounded bg-gray-100 truncate">
                              {formatarHora(ag.hora_inicio)} {ag.paciente_nome?.split(' ')[0]}
                            </div>
                          ))}
                          {ags.length === 0 && isCurrentMonth && (
                            <button
                              onClick={() => {
                                setEditing(null);
                                setFormData({
                                  ...formData,
                                  data_agendamento: format(current, 'yyyy-MM-dd')
                                });
                                setShowModal(true);
                              }}
                              className="w-full text-xs text-gray-400 hover:text-blue-500 text-center py-1"
                            >
                              + Agendar
                            </button>
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

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-xl font-semibold">{editing ? 'Editar' : 'Novo'} Agendamento</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
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
                    className="w-full border rounded-lg px-3 py-2"
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
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Selecione</option>
                    {prestadores.map(p => <option key={p.id} value={p.id}>{p.nome} - {p.especialidade}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Sala</label>
                  <select
                    value={formData.sala_id}
                    onChange={(e) => setFormData({...formData, sala_id: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Nenhuma</option>
                    {salas.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Tipo</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    {TIPO_AGENDAMENTO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Modalidade</label>
                  <select
                    value={formData.modalidade}
                    onChange={(e) => setFormData({...formData, modalidade: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    {MODALIDADE.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Data</label>
                  <input
                    type="date"
                    value={formData.data_agendamento}
                    onChange={(e) => setFormData({...formData, data_agendamento: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
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
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Hora Fim</label>
                    <input
                      type="time"
                      value={formData.hora_fim}
                      onChange={(e) => setFormData({...formData, hora_fim: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Observações</label>
                  <textarea
                    rows="3"
                    value={formData.observacao}
                    onChange={(e) => setFormData({...formData, observacao: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Informações adicionais..."
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-gray-800">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">
                Cancelar
              </button>
              <button onClick={salvarAgendamento} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                {editing ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
