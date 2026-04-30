// src/pages/Agendamentos.jsx
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon, 
  CheckIcon, 
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
  EyeIcon
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
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [viewMode, setViewMode] = useState('dia');
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
    link_teleconsulta: '',
    lembrete_envio: true,
    lembrete_antecedencia: 60,
    paciente_nome: '',
    paciente_carteira: '',
    prestador_nome: '',
    prestador_especialidade: '',
    convenio_nome: ''
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

  const salvarAgendamento = async (agendamento) => {
    try {
      if (editing) {
        const { error } = await supabase
          .from('agendamentos')
          .update(agendamento)
          .eq('id', editing.id);
        if (error) throw error;
        toast.success('Agendamento atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('agendamentos')
          .insert([agendamento]);
        if (error) throw error;
        toast.success('Agendamento registrado com sucesso!');
      }
      await carregarDados();
      return true;
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      toast.error('Erro ao salvar agendamento');
      return false;
    }
  };

  const excluirAgendamento = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return;
    try {
      const { error } = await supabase.from('agendamentos').delete().eq('id', id);
      if (error) throw error;
      toast.success('Agendamento excluído com sucesso!');
      await carregarDados();
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error);
      toast.error('Erro ao excluir agendamento');
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
      await carregarDados();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handlePacienteChange = (pacienteId) => {
    if (!pacienteId) return;
    const paciente = pacientes.find(p => p.id === parseInt(pacienteId));
    if (paciente) {
      const convenio = convenios.find(c => c.id === paciente.convenio_id);
      setFormData({
        ...formData,
        paciente_id: pacienteId,
        paciente_nome: paciente.nome || '',
        paciente_carteira: paciente.numero_carteira || '',
        convenio_id: paciente.convenio_id || '',
        convenio_nome: convenio?.razao_social || 'Sem convênio'
      });
    }
  };

  const handlePrestadorChange = (prestadorId) => {
    if (!prestadorId) return;
    const prestador = prestadores.find(p => p.id === parseInt(prestadorId));
    if (prestador) {
      setFormData({
        ...formData,
        prestador_id: prestadorId,
        prestador_nome: prestador.nome || '',
        prestador_especialidade: prestador.especialidade || ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

    const novoAgendamento = {
      ...formData,
      created_at: editing ? editing.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (editing) novoAgendamento.id = editing.id;
    const sucesso = await salvarAgendamento(novoAgendamento);
    if (sucesso) resetModal();
  };

  const resetModal = () => {
    setShowModal(false);
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
      link_teleconsulta: '',
      lembrete_envio: true,
      lembrete_antecedencia: 60,
      paciente_nome: '',
      paciente_carteira: '',
      prestador_nome: '',
      prestador_especialidade: '',
      convenio_nome: ''
    });
  };

  const handleEdit = (agendamento) => {
    setEditing(agendamento);
    setFormData({ ...agendamento });
    setShowModal(true);
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

  const getAgendamentosPorData = (data) => {
    const dataStr = format(data, 'yyyy-MM-dd');
    return agendamentos.filter(a => a.data_agendamento === dataStr);
  };

  const getDiasDaSemana = () => {
    const inicio = startOfWeek(currentDate, { weekStartsOn: 1 });
    const dias = [];
    for (let i = 0; i < 7; i++) dias.push(addDays(inicio, i));
    return dias;
  };

  const agendamentosHoje = agendamentos.filter(a => a.data_agendamento === new Date().toISOString().split('T')[0] && a.status !== 'cancelado').length;
  const agendamentosSemana = agendamentos.filter(a => {
    const inicio = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split('T')[0];
    const fim = endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split('T')[0];
    return a.data_agendamento >= inicio && a.data_agendamento <= fim && a.status !== 'cancelado';
  }).length;
  const agendamentosPendentes = agendamentos.filter(a => a.status === 'agendado' || a.status === 'aguardando').length;

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
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Agendamentos
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Gerenciamento de consultas, exames e procedimentos
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
              <button onClick={() => setViewMode('dia')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 ${viewMode === 'dia' ? 'bg-white dark:bg-gray-600 shadow-md text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                <ListBulletIcon className="w-4 h-4" /> Dia
              </button>
              <button onClick={() => setViewMode('semana')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 ${viewMode === 'semana' ? 'bg-white dark:bg-gray-600 shadow-md text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                <ViewColumnsIcon className="w-4 h-4" /> Semana
              </button>
              <button onClick={() => setViewMode('mes')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 ${viewMode === 'mes' ? 'bg-white dark:bg-gray-600 shadow-md text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                <CalendarDaysIcon className="w-4 h-4" /> Mês
              </button>
            </div>
            <button onClick={() => { setEditing(null); resetModal(); setShowModal(true); }} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg">
              <PlusIcon className="w-4 h-4" /> Novo Agendamento
            </button>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-500 dark:text-gray-400">Agendamentos Hoje</p><p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{agendamentosHoje}</p></div>
              <CalendarIcon className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-500 dark:text-gray-400">Esta Semana</p><p className="text-2xl font-bold text-green-600 dark:text-green-400">{agendamentosSemana}</p></div>
              <ClockIcon className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-500 dark:text-gray-400">Total Agendamentos</p><p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{agendamentos.length}</p></div>
              <UserGroupIcon className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-500 dark:text-gray-400">Pendentes</p><p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{agendamentosPendentes}</p></div>
              <BellIcon className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Navegação e Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex gap-2">
              <button onClick={navegarAnterior} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronLeftIcon className="w-5 h-5" /></button>
              <button onClick={navegarProximo} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronRightIcon className="w-5 h-5" /></button>
              <button onClick={irParaHoje} className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">Hoje</button>
            </div>
            <div className="text-lg font-semibold text-gray-800 dark:text-white">
              {viewMode === 'dia' && format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              {viewMode === 'semana' && `Semana de ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "dd/MM")} a ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), "dd/MM/yyyy")}`}
              {viewMode === 'mes' && format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
            </div>
            <div className="flex gap-2">
              <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm">
                <option value="todos">Todos status</option>
                {STATUS_AGENDAMENTO.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-48 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg pl-8 pr-3 py-2 text-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Visualização do Calendário */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden p-4">
          {viewMode === 'dia' && (
            <div className="space-y-4">
              <div className="text-center py-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                  {format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </h3>
              </div>
              <div className="space-y-2">
                {HORARIOS.map(hora => {
                  const agendamento = getAgendamentosPorData(currentDate).find(a => a.hora_inicio === hora);
                  const statusInfo = agendamento ? STATUS_AGENDAMENTO.find(s => s.value === agendamento.status) : null;
                  return (
                    <div key={hora} className={`border rounded-lg p-3 transition-all ${agendamento ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200' : 'bg-white dark:bg-gray-800 border-gray-200 hover:bg-gray-50'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 font-mono text-sm font-medium text-gray-600">{hora}</div>
                          {agendamento ? (
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-gray-800">{agendamento.paciente_nome}</span>
                                <span className="text-xs text-gray-500">{agendamento.prestador_nome}</span>
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${statusInfo?.color}`}>{statusInfo?.label}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 text-gray-400 text-sm">Disponível</div>
                          )}
                        </div>
                        {agendamento && (
                          <div className="flex gap-1">
                            <Link to={`/prontuario/${agendamento.id}`} className="p-1 rounded-lg text-cyan-600 hover:bg-cyan-50" title="Atender">
                              <CheckBadgeIcon className="w-4 h-4" />
                            </Link>
                            <button onClick={() => handleEdit(agendamento)} className="p-1 rounded-lg text-blue-600 hover:bg-blue-50"><PencilIcon className="w-4 h-4" /></button>
                            <button onClick={() => excluirAgendamento(agendamento.id)} className="p-1 rounded-lg text-red-600 hover:bg-red-50"><TrashIcon className="w-4 h-4" /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'semana' && (
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-8 gap-2 mb-4">
                  <div className="col-span-1"></div>
                  {getDiasDaSemana().map((dia, idx) => (
                    <div key={idx} className="text-center">
                      <div className="text-sm font-medium text-gray-600">{format(dia, 'EEE', { locale: ptBR })}</div>
                      <div className={`text-lg font-semibold rounded-full w-10 h-10 flex items-center justify-center mx-auto ${isSameDay(dia, new Date()) ? 'bg-blue-600 text-white' : 'text-gray-800'}`}>
                        {format(dia, 'dd')}
                      </div>
                    </div>
                  ))}
                </div>
                {HORARIOS.map(hora => (
                  <div key={hora} className="grid grid-cols-8 gap-2 mb-2">
                    <div className="col-span-1 text-sm font-mono text-gray-500 pt-2">{hora}</div>
                    {getDiasDaSemana().map((dia, idx) => {
                      const agendamento = getAgendamentosPorData(dia).find(a => a.hora_inicio === hora);
                      return (
                        <div key={idx} className={`border rounded-lg p-2 min-h-[80px] ${agendamento ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200' : 'bg-white dark:bg-gray-800 border-gray-200'}`}>
                          {agendamento ? (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-gray-800 truncate">{agendamento.paciente_nome}</p>
                              <div className="flex gap-1">
                                <Link to={`/prontuario/${agendamento.id}`} className="p-1 rounded text-cyan-600"><CheckBadgeIcon className="w-3 h-3" /></Link>
                                <button onClick={() => handleEdit(agendamento)} className="p-1 rounded text-blue-600"><PencilIcon className="w-3 h-3" /></button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => { setFormData({ ...formData, data_agendamento: format(dia, 'yyyy-MM-dd'), hora_inicio: hora, hora_fim: HORARIOS[HORARIOS.indexOf(hora) + 1] || HORARIOS[HORARIOS.indexOf(hora)] }); setShowModal(true); }} className="w-full h-full flex items-center justify-center text-gray-400 hover:text-blue-500"><PlusIcon className="w-4 h-4" /></button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'mes' && (
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(dia => <div key={dia} className="text-center py-2 text-sm font-medium text-gray-500">{dia}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    const start = startOfMonth(currentDate);
                    const end = endOfMonth(currentDate);
                    let startDay = start.getDay();
                    startDay = startDay === 0 ? 6 : startDay - 1;
                    let current = subDays(start, startDay);
                    const dias = [];
                    for (let i = 0; i < 42; i++) { dias.push(current); current = addDays(current, 1); }
                    return dias.map((dia, idx) => {
                      const isCurrentMonth = dia.getMonth() === currentDate.getMonth();
                      const agendamentosDia = getAgendamentosPorData(dia);
                      const isToday = isSameDay(dia, new Date());
                      return (
                        <div key={idx} className={`border rounded-lg min-h-[120px] p-2 ${isCurrentMonth ? 'bg-white dark:bg-gray-800 border-gray-200' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100'} ${isToday ? 'ring-2 ring-blue-500' : ''}`}>
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-sm font-medium ${isCurrentMonth ? 'text-gray-800' : 'text-gray-400'} ${isToday ? 'text-blue-600 font-bold' : ''}`}>{format(dia, 'dd')}</span>
                            {agendamentosDia.length > 0 && <span className="bg-blue-100 text-blue-700 text-xs rounded-full px-1.5 py-0.5">{agendamentosDia.length}</span>}
                          </div>
                          <div className="space-y-1">
                            {agendamentosDia.slice(0, 3).map((ag, i) => (
                              <div key={i} className="text-xs truncate flex items-center justify-between gap-1">
                                <span className="text-gray-600 truncate flex-1">{ag.hora_inicio} - {ag.paciente_nome?.split(' ')[0]}</span>
                                <Link to={`/prontuario/${ag.id}`} className="text-cyan-600"><CheckBadgeIcon className="w-3 h-3" /></Link>
                              </div>
                            ))}
                            {agendamentosDia.length === 0 && isCurrentMonth && (
                              <button onClick={() => { setFormData({ ...formData, data_agendamento: format(dia, 'yyyy-MM-dd'), hora_inicio: '09:00', hora_fim: '09:30' }); setShowModal(true); }} className="w-full text-xs text-gray-400 hover:text-blue-500">+ Agendar</button>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal de Cadastro/Edição */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">{editing ? 'Editar Agendamento' : 'Novo Agendamento'}</h3>
                  <button onClick={resetModal} className="p-2 rounded-lg hover:bg-gray-100"><XMarkIcon className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="p-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Paciente *</label>
                      <select value={formData.paciente_id} onChange={e => handlePacienteChange(e.target.value)} className="w-full bg-white dark:bg-gray-700 border rounded-lg px-3 py-2 text-sm" required>
                        <option value="">Selecione um paciente</option>
                        {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome} - {p.numero_carteira}</option>)}
                      </select>
                    </div>
                    <div><label className="block text-sm font-medium mb-1">Profissional *</label>
                      <select value={formData.prestador_id} onChange={e => handlePrestadorChange(e.target.value)} className="w-full bg-white dark:bg-gray-700 border rounded-lg px-3 py-2 text-sm" required>
                        <option value="">Selecione um profissional</option>
                        {prestadores.map(p => <option key={p.id} value={p.id}>{p.nome} - {p.especialidade}</option>)}
                      </select>
                    </div>
                    <div><label className="block text-sm font-medium mb-1">Tipo *</label>
                      <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="w-full bg-white dark:bg-gray-700 border rounded-lg px-3 py-2 text-sm">
                        {TIPO_AGENDAMENTO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div><label className="block text-sm font-medium mb-1">Modalidade *</label>
                      <select value={formData.modalidade} onChange={e => setFormData({...formData, modalidade: e.target.value})} className="w-full bg-white dark:bg-gray-700 border rounded-lg px-3 py-2 text-sm">
                        {MODALIDADE.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </div>
                    <div><label className="block text-sm font-medium mb-1">Data *</label>
                      <input type="date" value={formData.data_agendamento} onChange={e => setFormData({...formData, data_agendamento: e.target.value})} className="w-full bg-white dark:bg-gray-700 border rounded-lg px-3 py-2 text-sm" required />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="block text-sm font-medium mb-1">Hora Início *</label>
                        <input type="time" value={formData.hora_inicio} onChange={e => setFormData({...formData, hora_inicio: e.target.value})} className="w-full bg-white dark:bg-gray-700 border rounded-lg px-3 py-2 text-sm" required />
                      </div>
                      <div><label className="block text-sm font-medium mb-1">Hora Fim *</label>
                        <input type="time" value={formData.hora_fim} onChange={e => setFormData({...formData, hora_fim: e.target.value})} className="w-full bg-white dark:bg-gray-700 border rounded-lg px-3 py-2 text-sm" required />
                      </div>
                    </div>
                    {formData.modalidade === 'teleconsulta' && (
                      <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Link da Teleconsulta</label>
                        <input type="url" value={formData.link_teleconsulta} onChange={e => setFormData({...formData, link_teleconsulta: e.target.value})} className="w-full bg-white dark:bg-gray-700 border rounded-lg px-3 py-2 text-sm" />
                      </div>
                    )}
                    {formData.modalidade === 'presencial' && (
                      <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Local</label>
                        <input type="text" value={formData.local} onChange={e => setFormData({...formData, local: e.target.value})} className="w-full bg-white dark:bg-gray-700 border rounded-lg px-3 py-2 text-sm" />
                      </div>
                    )}
                    <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Observações</label>
                      <textarea rows="3" value={formData.observacao} onChange={e => setFormData({...formData, observacao: e.target.value})} className="w-full bg-white dark:bg-gray-700 border rounded-lg px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                    <button type="button" onClick={resetModal} className="px-4 py-2 border rounded-lg">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">{editing ? 'Atualizar' : 'Salvar'}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
