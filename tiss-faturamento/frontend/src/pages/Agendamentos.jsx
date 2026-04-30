// src/pages/Agendamentos.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon,
  CalendarIcon, ClockIcon, UserGroupIcon, BuildingOfficeIcon, BeakerIcon,
  VideoCameraIcon, BellIcon, CheckBadgeIcon, XCircleIcon,
  ChevronLeftIcon, ChevronRightIcon, ViewColumnsIcon, CalendarDaysIcon,
  ListBulletIcon, EyeIcon, FunnelIcon, ChartBarIcon,
  ChevronUpIcon, ChevronDownIcon, HomeModernIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabaseClient';

const STATUS_AGENDAMENTO = [
  { value: 'agendado', label: 'Agendado', color: 'bg-blue-100 text-blue-700' },
  { value: 'confirmado', label: 'Confirmado', color: 'bg-green-100 text-green-700' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-700' },
  { value: 'realizado', label: 'Realizado', color: 'bg-purple-100 text-purple-700' },
  { value: 'aguardando', label: 'Aguardando', color: 'bg-yellow-100 text-yellow-700' }
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
  const [showFiltros, setShowFiltros] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [viewMode, setViewMode] = useState('semana');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Campos do formulário com busca
  const [pacienteBusca, setPacienteBusca] = useState('');
  const [prestadorBusca, setPrestadorBusca] = useState('');
  const [salaBusca, setSalaBusca] = useState('');
  const [showPacienteList, setShowPacienteList] = useState(false);
  const [showPrestadorList, setShowPrestadorList] = useState(false);
  const [showSalaList, setShowSalaList] = useState(false);
  
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

  // Carregar dados
  const carregarDados = async () => {
    setLoading(true);
    try {
      const [agendamentosRes, pacientesRes, prestadoresRes, conveniosRes, salasRes] = await Promise.all([
        supabase.from('agendamentos').select('*').order('data_agendamento', { ascending: true }),
        supabase.from('pacientes').select('*').order('nome'),
        supabase.from('prestadores').select('*').order('nome'),
        supabase.from('convenios').select('*').order('razao_social'),
        supabase.from('salas').select('*').eq('ativo', true).order('nome')
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
      
      console.log('Dados carregados:', {
        agendamentos: agendamentosRes.data?.length,
        pacientes: pacientesRes.data?.length,
        prestadores: prestadoresRes.data?.length,
        salas: salasRes.data?.length
      });
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

  // Filtrar pacientes
  const pacientesFiltrados = pacientes.filter(p => 
    p.nome?.toLowerCase().includes(pacienteBusca.toLowerCase()) ||
    p.cpf?.includes(pacienteBusca) ||
    p.numero_carteira?.includes(pacienteBusca)
  ).slice(0, 15);

  // Filtrar prestadores
  const prestadoresFiltrados = prestadores.filter(p => 
    p.nome?.toLowerCase().includes(prestadorBusca.toLowerCase()) ||
    p.especialidade?.toLowerCase().includes(prestadorBusca.toLowerCase()) ||
    p.cpf?.includes(prestadorBusca)
  ).slice(0, 15);

  // Filtrar salas
  const salasFiltradas = salas.filter(s => 
    s.nome?.toLowerCase().includes(salaBusca.toLowerCase())
  ).slice(0, 15);

  const abrirModalNovo = () => {
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
    setPacienteBusca('');
    setPrestadorBusca('');
    setSalaBusca('');
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
      let result;
      if (editing) {
        result = await supabase
          .from('agendamentos')
          .update(novoAgendamento)
          .eq('id', editing.id);
      } else {
        result = await supabase
          .from('agendamentos')
          .insert([novoAgendamento]);
      }

      if (result.error) throw result.error;

      toast.success(editing ? 'Atualizado!' : 'Agendamento criado!');
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

  const atualizarStatus = async (id, status) => {
    const { error } = await supabase
      .from('agendamentos')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      toast.error('Erro ao atualizar status');
    } else {
      toast.success('Status atualizado!');
      carregarDados();
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

  // Filtros
  const getAgendamentosFiltrados = useCallback(() => {
    let filtrados = [...agendamentos];
    
    if (filtroStatus !== 'todos') {
      filtrados = filtrados.filter(a => a.status === filtroStatus);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtrados = filtrados.filter(a => 
        a.paciente_nome?.toLowerCase().includes(term) ||
        a.prestador_nome?.toLowerCase().includes(term)
      );
    }
    return filtrados;
  }, [agendamentos, filtroStatus, searchTerm]);

  const getAgendamentosPorData = (data) => {
    const dataStr = format(data, 'yyyy-MM-dd');
    return getAgendamentosFiltrados().filter(a => a.data_agendamento === dataStr);
  };

  const getDiasDaSemana = () => {
    const inicio = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(inicio, i));
  };

  const estatisticas = {
    hoje: getAgendamentosFiltrados().filter(a => a.data_agendamento === format(new Date(), 'yyyy-MM-dd') && a.status !== 'cancelado').length,
    total: getAgendamentosFiltrados().length,
    pendentes: getAgendamentosFiltrados().filter(a => a.status === 'agendado' || a.status === 'aguardando').length,
    realizados: getAgendamentosFiltrados().filter(a => a.status === 'realizado').length
  };

  const podeAtender = (agendamento) => {
    return agendamento.status !== 'realizado' && agendamento.status !== 'cancelado';
  };

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
            <p className="text-sm text-gray-500">Gerencie consultas, exames e procedimentos</p>
          </div>
          <button
            onClick={abrirModalNovo}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Novo Agendamento
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-500">Hoje</p>
            <p className="text-2xl font-bold">{estatisticas.hoje}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold">{estatisticas.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-500">Pendentes</p>
            <p className="text-2xl font-bold">{estatisticas.pendentes}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
            <p className="text-sm text-gray-500">Realizados</p>
            <p className="text-2xl font-bold">{estatisticas.realizados}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b">
            <button onClick={() => setShowFiltros(!showFiltros)} className="flex items-center gap-2 text-gray-600">
              <FunnelIcon className="w-5 h-5" />
              Filtros
              {showFiltros ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
            </button>
          </div>
          <div className="p-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar paciente ou profissional..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border rounded-lg"
                />
              </div>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="border rounded-lg px-3 py-2"
              >
                <option value="todos">Todos os status</option>
                {STATUS_AGENDAMENTO.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Navegação */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button onClick={navegarAnterior} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeftIcon className="w-5 h-5" /></button>
              <button onClick={irParaHoje} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Hoje</button>
              <button onClick={navegarProximo} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRightIcon className="w-5 h-5" /></button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setViewMode('dia')} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${viewMode === 'dia' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                <ListBulletIcon className="w-4 h-4" /> Dia
              </button>
              <button onClick={() => setViewMode('semana')} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${viewMode === 'semana' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                <ViewColumnsIcon className="w-4 h-4" /> Semana
              </button>
              <button onClick={() => setViewMode('mes')} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${viewMode === 'mes' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
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
          <div className="bg-white rounded-lg shadow">
            <div className="divide-y">
              {HORARIOS.map(hora => {
                const agendamento = getAgendamentosPorData(currentDate).find(a => a.hora_inicio === hora);
                const statusInfo = agendamento ? STATUS_AGENDAMENTO.find(s => s.value === agendamento.status) : null;
                return (
                  <div key={hora} className="p-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-20 font-mono font-bold">{hora}</div>
                        {agendamento ? (
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{agendamento.paciente_nome}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${statusInfo?.color}`}>{statusInfo?.label}</span>
                            </div>
                            <div className="text-sm text-gray-500">{agendamento.prestador_nome}</div>
                            {agendamento.sala_nome && <div className="text-xs text-gray-400">Sala: {agendamento.sala_nome}</div>}
                          </div>
                        ) : (
                          <div className="flex-1 text-gray-400">Disponível</div>
                        )}
                      </div>
                      {agendamento && (
                        <div className="flex gap-1">
                          {podeAtender(agendamento) && (
                            <Link to={`/prontuario/${agendamento.id}`} className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg">
                              <CheckBadgeIcon className="w-5 h-5" />
                            </Link>
                          )}
                          <button onClick={() => {
                            setEditing(agendamento);
                            setFormData({
                              paciente_id: agendamento.paciente_id?.toString() || '',
                              prestador_id: agendamento.prestador_id?.toString() || '',
                              sala_id: agendamento.sala_id?.toString() || '',
                              tipo: agendamento.tipo,
                              status: agendamento.status,
                              modalidade: agendamento.modalidade,
                              data_agendamento: agendamento.data_agendamento,
                              hora_inicio: agendamento.hora_inicio,
                              hora_fim: agendamento.hora_fim,
                              observacao: agendamento.observacao || '',
                              local: agendamento.local || ''
                            });
                            setPacienteBusca(agendamento.paciente_nome || '');
                            setPrestadorBusca(agendamento.prestador_nome || '');
                            setSalaBusca(agendamento.sala_nome || '');
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

        {/* VISUALIZAÇÃO SEMANA */}
        {viewMode === 'semana' && (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-8 border-b bg-gray-50">
                <div className="p-3 font-semibold">Horário</div>
                {getDiasDaSemana().map((dia, idx) => (
                  <div key={idx} className="p-3 text-center font-semibold">
                    <div>{format(dia, 'EEE', { locale: ptBR })}</div>
                    <div className={`text-lg ${isSameDay(dia, new Date()) ? 'text-blue-600' : ''}`}>{format(dia, 'dd/MM')}</div>
                  </div>
                ))}
              </div>
              {HORARIOS.map(hora => (
                <div key={hora} className="grid grid-cols-8 border-b">
                  <div className="p-3 font-mono font-bold bg-gray-50">{hora}</div>
                  {getDiasDaSemana().map((dia, idx) => {
                    const agendamento = getAgendamentosPorData(dia).find(a => a.hora_inicio === hora);
                    return (
                      <div key={idx} className="p-2 border-l min-h-[80px]">
                        {agendamento ? (
                          <div className="text-sm">
                            <p className="font-medium truncate">{agendamento.paciente_nome}</p>
                            <p className="text-xs text-gray-500 truncate">{agendamento.prestador_nome}</p>
                            <div className="flex gap-1 mt-1">
                              {podeAtender(agendamento) && (
                                <Link to={`/prontuario/${agendamento.id}`} className="text-cyan-600">
                                  <CheckBadgeIcon className="w-4 h-4" />
                                </Link>
                              )}
                              <button onClick={() => {
                                setEditing(agendamento);
                                setFormData({
                                  paciente_id: agendamento.paciente_id?.toString() || '',
                                  prestador_id: agendamento.prestador_id?.toString() || '',
                                  sala_id: agendamento.sala_id?.toString() || '',
                                  tipo: agendamento.tipo,
                                  status: agendamento.status,
                                  modalidade: agendamento.modalidade,
                                  data_agendamento: agendamento.data_agendamento,
                                  hora_inicio: agendamento.hora_inicio,
                                  hora_fim: agendamento.hora_fim,
                                  observacao: agendamento.observacao || '',
                                  local: agendamento.local || ''
                                });
                                setPacienteBusca(agendamento.paciente_nome || '');
                                setPrestadorBusca(agendamento.prestador_nome || '');
                                setSalaBusca(agendamento.sala_nome || '');
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
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-7 border-b bg-gray-50">
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(dia => (
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
                      <div key={i} className={`border min-h-[100px] p-2 ${!isCurrentMonth ? 'bg-gray-50' : ''}`}>
                        <div className={`font-medium ${isSameDay(current, new Date()) ? 'text-blue-600' : ''}`}>
                          {format(current, 'dd')}
                        </div>
                        <div className="space-y-1 mt-1">
                          {agendamentosDia.slice(0, 2).map(ag => (
                            <div key={ag.id} className="text-xs p-1 rounded bg-gray-100 flex items-center justify-between">
                              <span className="truncate">{ag.hora_inicio} {ag.paciente_nome?.split(' ')[0]}</span>
                              {podeAtender(ag) && (
                                <Link to={`/prontuario/${ag.id}`} className="text-cyan-600">
                                  <CheckBadgeIcon className="w-3 h-3" />
                                </Link>
                              )}
                            </div>
                          ))}
                          {agendamentosDia.length > 2 && <div className="text-xs text-gray-400">+{agendamentosDia.length - 2}</div>}
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">{editing ? 'Editar' : 'Novo'} Agendamento</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                {/* Paciente com busca */}
                <div className="relative">
                  <label className="block text-sm font-medium mb-1">Paciente *</label>
                  <input
                    type="text"
                    placeholder="Digite nome, CPF ou carteira..."
                    value={pacienteBusca}
                    onChange={(e) => {
                      setPacienteBusca(e.target.value);
                      setShowPacienteList(true);
                      if (e.target.value === '') setFormData({...formData, paciente_id: ''});
                    }}
                    onFocus={() => setShowPacienteList(true)}
                    className="w-full border rounded-lg px-3 py-2"
                    autoComplete="off"
                  />
                  {showPacienteList && pacientesFiltrados.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {pacientesFiltrados.map(p => (
                        <div
                          key={p.id}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                          onClick={() => {
                            setFormData({...formData, paciente_id: p.id.toString()});
                            setPacienteBusca(`${p.nome} - ${p.numero_carteira}`);
                            setShowPacienteList(false);
                          }}
                        >
                          <div className="font-medium">{p.nome}</div>
                          <div className="text-xs text-gray-500">CPF: {p.cpf || '---'} | Carteira: {p.numero_carteira}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Profissional com busca */}
                <div className="relative">
                  <label className="block text-sm font-medium mb-1">Profissional *</label>
                  <input
                    type="text"
                    placeholder="Digite nome ou especialidade..."
                    value={prestadorBusca}
                    onChange={(e) => {
                      setPrestadorBusca(e.target.value);
                      setShowPrestadorList(true);
                      if (e.target.value === '') setFormData({...formData, prestador_id: ''});
                    }}
                    onFocus={() => setShowPrestadorList(true)}
                    className="w-full border rounded-lg px-3 py-2"
                    autoComplete="off"
                  />
                  {showPrestadorList && prestadoresFiltrados.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {prestadoresFiltrados.map(p => (
                        <div
                          key={p.id}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                          onClick={() => {
                            setFormData({...formData, prestador_id: p.id.toString()});
                            setPrestadorBusca(`${p.nome} - ${p.especialidade}`);
                            setShowPrestadorList(false);
                          }}
                        >
                          <div className="font-medium">{p.nome}</div>
                          <div className="text-xs text-gray-500">{p.especialidade} | CPF: {p.cpf || '---'}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sala com busca */}
                <div className="relative">
                  <label className="block text-sm font-medium mb-1">Sala</label>
                  <input
                    type="text"
                    placeholder="Digite o nome da sala..."
                    value={salaBusca}
                    onChange={(e) => {
                      setSalaBusca(e.target.value);
                      setShowSalaList(true);
                      if (e.target.value === '') setFormData({...formData, sala_id: ''});
                    }}
                    onFocus={() => setShowSalaList(true)}
                    className="w-full border rounded-lg px-3 py-2"
                    autoComplete="off"
                  />
                  {showSalaList && salasFiltradas.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {salasFiltradas.map(s => (
                        <div
                          key={s.id}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 flex items-center gap-2"
                          onClick={() => {
                            setFormData({...formData, sala_id: s.id.toString()});
                            setSalaBusca(s.nome);
                            setShowSalaList(false);
                          }}
                        >
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.cor }}></div>
                          <span>{s.nome}</span>
                          <span className="text-xs text-gray-500">({s.tipo})</span>
                        </div>
                      ))}
                    </div>
                  )}
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
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
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
