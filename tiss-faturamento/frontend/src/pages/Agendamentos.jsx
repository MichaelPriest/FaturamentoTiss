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
import { format, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, addWeeks, subWeeks, addMonths, subMonths, parseISO } from 'date-fns';
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
  const [showFiltros, setShowFiltros] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroSala, setFiltroSala] = useState('todos');
  const [viewMode, setViewMode] = useState('semana');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tooltipData, setTooltipData] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.paciente-dropdown')) setShowPacienteList(false);
      if (!event.target.closest('.prestador-dropdown')) setShowPrestadorList(false);
      if (!event.target.closest('.sala-dropdown')) setShowSalaList(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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
      
      console.log('Agendamentos carregados:', agendamentosRes.data?.length);
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

  const pacientesFiltrados = pacientes.filter(p => 
    p.nome?.toLowerCase().includes(pacienteBusca.toLowerCase()) ||
    p.cpf?.includes(pacienteBusca) ||
    p.numero_carteira?.includes(pacienteBusca)
  ).slice(0, 15);

  const prestadoresFiltrados = prestadores.filter(p => 
    p.nome?.toLowerCase().includes(prestadorBusca.toLowerCase()) ||
    p.especialidade?.toLowerCase().includes(prestadorBusca.toLowerCase()) ||
    p.cpf?.includes(prestadorBusca) ||
    p.numero_conselho?.includes(prestadorBusca)
  ).slice(0, 15);

  const salasFiltradas = salas.filter(s => 
    s.nome?.toLowerCase().includes(salaBusca.toLowerCase())
  ).slice(0, 15);

  const verificarConflitoHorario = async (data, horaInicio, horaFim, prestadorId, agendamentoId = null) => {
    const { data: agendamentosExistentes, error } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('data_agendamento', data)
      .eq('prestador_id', prestadorId)
      .neq('status', 'cancelado');
    
    if (error) {
      console.error('Erro ao verificar conflito:', error);
      return false;
    }

    const horarioInicioNum = parseFloat(horaInicio.replace(':', '.'));
    const horarioFimNum = parseFloat(horaFim.replace(':', '.'));

    for (const ag of agendamentosExistentes) {
      if (agendamentoId && ag.id === parseInt(agendamentoId)) continue;
      
      const agInicio = parseFloat(ag.hora_inicio.replace(':', '.'));
      const agFim = parseFloat(ag.hora_fim.replace(':', '.'));
      
      if ((horarioInicioNum >= agInicio && horarioInicioNum < agFim) ||
          (horarioFimNum > agInicio && horarioFimNum <= agFim) ||
          (horarioInicioNum <= agInicio && horarioFimNum >= agFim)) {
        return { conflito: true, agendamento: ag };
      }
    }
    
    return { conflito: false };
  };

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

    const conflito = await verificarConflitoHorario(
      formData.data_agendamento,
      formData.hora_inicio,
      formData.hora_fim,
      parseInt(formData.prestador_id),
      editing?.id
    );

    if (conflito.conflito) {
      toast.error(`Conflito de horário! O profissional já possui um agendamento das ${conflito.agendamento.hora_inicio} às ${conflito.agendamento.hora_fim}`);
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

  // CORREÇÃO PRINCIPAL: Função para obter a data em formato YYYY-MM-DD
  const obterDataAgendamento = (agendamento) => {
    if (!agendamento.data_agendamento) return '';
    // Se já está no formato YYYY-MM-DD, retorna direto
    if (typeof agendamento.data_agendamento === 'string' && agendamento.data_agendamento.includes('-')) {
      return agendamento.data_agendamento.split('T')[0];
    }
    // Se for objeto Date ou ISO string
    try {
      return new Date(agendamento.data_agendamento).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const getAgendamentosFiltrados = useCallback(() => {
    let filtrados = [...agendamentos];
    
    if (filtroStatus !== 'todos') {
      filtrados = filtrados.filter(a => a.status === filtroStatus);
    }
    if (filtroSala !== 'todos') {
      filtrados = filtrados.filter(a => a.sala_id === parseInt(filtroSala));
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtrados = filtrados.filter(a => 
        a.paciente_nome?.toLowerCase().includes(term) ||
        a.prestador_nome?.toLowerCase().includes(term) ||
        a.sala_nome?.toLowerCase().includes(term)
      );
    }
    return filtrados;
  }, [agendamentos, filtroStatus, filtroSala, searchTerm]);

  // CORREÇÃO PRINCIPAL: Get agendamentos por data - comparação correta
  const getAgendamentosPorData = useCallback((data) => {
    const dataStr = format(data, 'yyyy-MM-dd');
    const filtrados = getAgendamentosFiltrados();
    
    const result = filtrados.filter(a => {
      const dataAgendamento = obterDataAgendamento(a);
      return dataAgendamento === dataStr;
    });
    
    return result;
  }, [getAgendamentosFiltrados]);

  const getDiasDaSemana = () => {
    const inicio = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(inicio, i));
  };

  // CORREÇÃO PRINCIPAL: Estatísticas usando a data correta
  const estatisticas = {
    hoje: getAgendamentosFiltrados().filter(a => {
      const dataAgendamento = obterDataAgendamento(a);
      const hoje = format(new Date(), 'yyyy-MM-dd');
      return dataAgendamento === hoje && a.status !== 'cancelado';
    }).length,
    semana: getAgendamentosFiltrados().filter(a => {
      const dataAgendamento = obterDataAgendamento(a);
      if (!dataAgendamento) return false;
      const data = new Date(dataAgendamento);
      const hoje = new Date();
      const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 });
      const fimSemana = endOfWeek(hoje, { weekStartsOn: 1 });
      return data >= inicioSemana && data <= fimSemana && a.status !== 'cancelado';
    }).length,
    total: getAgendamentosFiltrados().length,
    pendentes: getAgendamentosFiltrados().filter(a => a.status === 'agendado' || a.status === 'aguardando').length,
    realizados: getAgendamentosFiltrados().filter(a => a.status === 'realizado').length
  };

  const podeAtender = (agendamento) => {
    return agendamento.status !== 'realizado' && agendamento.status !== 'cancelado';
  };

  // Formatar hora para exibição (remover segundos)
  const formatarHora = (hora) => {
    if (!hora) return '';
    return hora.substring(0, 5);
  };

  const handleMouseEnter = (event, dia, agendamentosDia) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    setTooltipData({
      data: format(dia, "dd 'de' MMMM", { locale: ptBR }),
      agendamentos: agendamentosDia
    });
  };

  const handleMouseLeave = () => {
    setTooltipData(null);
  };

  // Debug
  console.log('Agendamentos hoje:', getAgendamentosPorData(new Date()).length);
  console.log('Data atual:', format(new Date(), 'yyyy-MM-dd'));

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

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-500 dark:text-gray-400">Hoje</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{estatisticas.hoje}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-500 dark:text-gray-400">Esta Semana</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{estatisticas.semana}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-purple-500">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{estatisticas.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-500 dark:text-gray-400">Pendentes</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{estatisticas.pendentes}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-purple-500">
            <p className="text-sm text-gray-500 dark:text-gray-400">Realizados</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{estatisticas.realizados}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="p-4 border-b dark:border-gray-700">
            <button onClick={() => setShowFiltros(!showFiltros)} className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <FunnelIcon className="w-5 h-5" />
              Filtros
              {showFiltros ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
            </button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar paciente, profissional ou sala..."
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
              <select
                value={filtroSala}
                onChange={(e) => setFiltroSala(e.target.value)}
                className="border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="todos">Todas as salas</option>
                {salas.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Navegação */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex gap-2">
              <button onClick={navegarAnterior} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button onClick={irParaHoje} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Hoje</button>
              <button onClick={navegarProximo} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setViewMode('dia')} className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${viewMode === 'dia' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                <ListBulletIcon className="w-4 h-4" /> Dia
              </button>
              <button onClick={() => setViewMode('semana')} className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${viewMode === 'semana' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                <ViewColumnsIcon className="w-4 h-4" /> Semana
              </button>
              <button onClick={() => setViewMode('mes')} className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${viewMode === 'mes' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                <CalendarDaysIcon className="w-4 h-4" /> Mês
              </button>
            </div>
          </div>
          <div className="text-center mt-3">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              {viewMode === 'dia' && format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              {viewMode === 'semana' && `Semana de ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "dd/MM")} a ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), "dd/MM/yyyy")}`}
              {viewMode === 'mes' && format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
            </h2>
          </div>
        </div>

        {/* VISUALIZAÇÃO DIA - CORRIGIDA */}
        {viewMode === 'dia' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="bg-blue-600 text-white p-3 rounded-t-lg">
              <h3 className="text-center font-semibold">Agenda do Dia</h3>
            </div>
            <div className="divide-y dark:divide-gray-700">
              {getAgendamentosPorData(currentDate).length === 0 && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  Nenhum agendamento para {format(currentDate, "dd 'de' MMMM", { locale: ptBR })}
                </div>
              )}
              {HORARIOS.map(hora => {
                const agendamento = getAgendamentosPorData(currentDate).find(a => a.hora_inicio === hora);
                const statusInfo = agendamento ? STATUS_AGENDAMENTO.find(s => s.value === agendamento.status) : null;
                return (
                  <div key={hora} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-20 font-mono font-bold text-gray-700 dark:text-gray-300">{hora}</div>
                        {agendamento ? (
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-800 dark:text-white">{agendamento.paciente_nome}</span>
                              <span className="text-xs text-gray-500">{agendamento.paciente_carteira}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${statusInfo?.color}`}>{statusInfo?.label}</span>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {agendamento.prestador_nome}
                              {agendamento.sala_nome && ` • Sala: ${agendamento.sala_nome}`}
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 text-gray-400 dark:text-gray-500">Disponível</div>
                        )}
                      </div>
                      {agendamento && (
                        <div className="flex gap-1">
                          {podeAtender(agendamento) && (
                            <Link to={`/prontuario/${agendamento.id}`} className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors" title="Atender">
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
                              hora_inicio: formatarHora(agendamento.hora_inicio),
                              hora_fim: formatarHora(agendamento.hora_fim),
                              observacao: agendamento.observacao || '',
                              local: agendamento.local || ''
                            });
                            setPacienteBusca(agendamento.paciente_nome || '');
                            setPrestadorBusca(agendamento.prestador_nome || '');
                            setSalaBusca(agendamento.sala_nome || '');
                            setShowModal(true);
                          }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button onClick={() => excluirAgendamento(agendamento.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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

        {/* VISUALIZAÇÃO SEMANA - CORRIGIDA */}
        {viewMode === 'semana' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
            <div className="bg-green-600 text-white p-3 rounded-t-lg">
              <h3 className="text-center font-semibold">Agenda Semanal</h3>
            </div>
            <div className="min-w-[900px] p-4">
              <div className="grid grid-cols-8 gap-2 mb-3">
                <div className="col-span-1"></div>
                {getDiasDaSemana().map((dia, idx) => (
                  <div key={idx} className="text-center p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                    <div className="font-bold text-gray-600 dark:text-gray-400">{format(dia, 'EEE', { locale: ptBR })}</div>
                    <div className={`text-lg font-bold ${isSameDay(dia, new Date()) ? 'text-blue-600' : 'text-gray-800 dark:text-white'}`}>
                      {format(dia, 'dd/MM')}
                    </div>
                  </div>
                ))}
              </div>
              {HORARIOS.map(hora => (
                <div key={hora} className="grid grid-cols-8 gap-2 mb-2">
                  <div className="col-span-1 text-sm font-mono font-bold text-gray-500 pt-2">{hora}</div>
                  {getDiasDaSemana().map((dia, idx) => {
                    const agendamento = getAgendamentosPorData(dia).find(a => a.hora_inicio === hora);
                    return (
                      <div key={idx} className={`border rounded-lg p-2 min-h-[80px] transition-all ${agendamento ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200' : 'bg-white dark:bg-gray-800 border-gray-200 hover:bg-gray-50'}`}>
                        {agendamento ? (
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-800 dark:text-white truncate">{agendamento.paciente_nome}</p>
                            <p className="text-xs text-gray-500 truncate">{agendamento.prestador_nome}</p>
                            <div className="flex gap-1 mt-1">
                              {podeAtender(agendamento) && (
                                <Link to={`/prontuario/${agendamento.id}`} className="p-1 rounded text-cyan-600" title="Atender">
                                  <CheckBadgeIcon className="w-3 h-3" />
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
                                  hora_inicio: formatarHora(agendamento.hora_inicio),
                                  hora_fim: formatarHora(agendamento.hora_fim),
                                  observacao: agendamento.observacao || '',
                                  local: agendamento.local || ''
                                });
                                setPacienteBusca(agendamento.paciente_nome || '');
                                setPrestadorBusca(agendamento.prestador_nome || '');
                                setSalaBusca(agendamento.sala_nome || '');
                                setShowModal(true);
                              }} className="p-1 rounded text-blue-600">
                                <PencilIcon className="w-3 h-3" />
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
                            className="w-full h-full min-h-[70px] flex items-center justify-center text-gray-400 hover:text-blue-500 transition-colors"
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

        {/* VISUALIZAÇÃO MÊS - COM TOOLTIP */}
        {viewMode === 'mes' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
            <div className="bg-purple-600 text-white p-3 rounded-t-lg">
              <h3 className="text-center font-semibold">Calendário Mensal</h3>
            </div>
            <div className="min-w-[800px] p-4">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(dia => (
                  <div key={dia} className="text-center py-2 text-sm font-semibold text-gray-500">{dia}</div>
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
                    const agendamentosDia = getAgendamentosPorData(current);
                    const isToday = isSameDay(current, new Date());
                    cells.push(
                      <div 
                        key={i} 
                        className={`border dark:border-gray-700 rounded-lg min-h-[100px] p-2 transition-all hover:shadow-md cursor-pointer ${!isCurrentMonth ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-800'} ${isToday ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
                        onMouseEnter={(e) => handleMouseEnter(e, current, agendamentosDia)}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="flex justify-between items-start">
                          <span className={`text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center ${isToday ? 'bg-blue-600 text-white shadow-md' : isCurrentMonth ? 'text-gray-800 dark:text-white' : 'text-gray-400'}`}>
                            {format(current, 'dd')}
                          </span>
                          {agendamentosDia.length > 0 && (
                            <span className="bg-blue-100 text-blue-700 text-xs rounded-full px-2 py-0.5">
                              {agendamentosDia.length}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 mt-2 max-h-[70px] overflow-y-auto">
                          {agendamentosDia.slice(0, 3).map(ag => {
                            const statusInfo = STATUS_AGENDAMENTO.find(s => s.value === ag.status);
                            return (
                              <div key={ag.id} className={`text-xs p-1 rounded flex items-center justify-between gap-1 ${statusInfo?.color} bg-opacity-50`}>
                                <span className="truncate flex-1">
                                  <span className="font-mono">{formatarHora(ag.hora_inicio)}</span> {ag.paciente_nome?.split(' ')[0]}
                                </span>
                                {podeAtender(ag) && (
                                  <Link to={`/prontuario/${ag.id}`} className="text-cyan-600" onClick={(e) => e.stopPropagation()}>
                                    <CheckBadgeIcon className="w-3 h-3" />
                                  </Link>
                                )}
                              </div>
                            );
                          })}
                          {agendamentosDia.length === 0 && isCurrentMonth && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditing(null);
                                setFormData({
                                  ...formData,
                                  data_agendamento: format(current, 'yyyy-MM-dd'),
                                  hora_inicio: '09:00',
                                  hora_fim: '09:30'
                                });
                                setShowModal(true);
                              }}
                              className="w-full text-xs text-gray-400 hover:text-blue-500 py-1 transition-colors"
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

        {/* Tooltip */}
        {tooltipData && (
          <div 
            className="fixed z-50 bg-gray-900 text-white rounded-lg shadow-xl p-3 max-w-sm pointer-events-none"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y - 10,
              transform: 'translateX(-50%) translateY(-100%)'
            }}
          >
            <div className="text-sm font-semibold mb-2 border-b border-gray-700 pb-1">
              {tooltipData.data}
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {tooltipData.agendamentos.map(ag => (
                <div key={ag.id} className="text-xs flex items-center justify-between gap-2 py-1 border-b border-gray-700 last:border-0">
                  <div>
                    <span className="font-mono text-gray-300">{formatarHora(ag.hora_inicio)}</span>
                    <span className="ml-2">{ag.paciente_nome}</span>
                    <div className="text-gray-400 text-[10px]">{ag.prestador_nome}</div>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                    ag.status === 'realizado' ? 'bg-green-600' : 
                    ag.status === 'cancelado' ? 'bg-red-600' : 
                    ag.status === 'confirmado' ? 'bg-blue-600' : 'bg-yellow-600'
                  }`}>
                    {STATUS_AGENDAMENTO.find(s => s.value === ag.status)?.label || ag.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{editing ? 'Editar' : 'Novo'} Agendamento</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Paciente com busca */}
                <div className="relative paciente-dropdown">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paciente *</label>
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
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    autoComplete="off"
                  />
                  {showPacienteList && pacientesFiltrados.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {pacientesFiltrados.map(p => (
                        <div
                          key={p.id}
                          className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b dark:border-gray-700 last:border-b-0"
                          onClick={() => {
                            setFormData({...formData, paciente_id: p.id.toString()});
                            setPacienteBusca(`${p.nome} - ${p.numero_carteira}`);
                            setShowPacienteList(false);
                          }}
                        >
                          <div className="font-medium text-gray-800 dark:text-white">{p.nome}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">CPF: {p.cpf || '---'} | Carteira: {p.numero_carteira}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Profissional com busca */}
                <div className="relative prestador-dropdown">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profissional *</label>
                  <input
                    type="text"
                    placeholder="Digite nome, especialidade ou número do conselho..."
                    value={prestadorBusca}
                    onChange={(e) => {
                      setPrestadorBusca(e.target.value);
                      setShowPrestadorList(true);
                      if (e.target.value === '') setFormData({...formData, prestador_id: ''});
                    }}
                    onFocus={() => setShowPrestadorList(true)}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    autoComplete="off"
                  />
                  {showPrestadorList && prestadoresFiltrados.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {prestadoresFiltrados.map(p => (
                        <div
                          key={p.id}
                          className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b dark:border-gray-700 last:border-b-0"
                          onClick={() => {
                            setFormData({...formData, prestador_id: p.id.toString()});
                            setPrestadorBusca(`${p.nome} - ${p.especialidade}`);
                            setShowPrestadorList(false);
                          }}
                        >
                          <div className="font-medium text-gray-800 dark:text-white">{p.nome}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {p.especialidade} | CPF: {p.cpf || '---'} | Conselho: {p.numero_conselho}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sala com busca */}
                <div className="relative sala-dropdown">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sala</label>
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
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    autoComplete="off"
                  />
                  {showSalaList && salasFiltradas.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {salasFiltradas.map(s => (
                        <div
                          key={s.id}
                          className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b dark:border-gray-700 last:border-b-0 flex items-center gap-2"
                          onClick={() => {
                            setFormData({...formData, sala_id: s.id.toString()});
                            setSalaBusca(s.nome);
                            setShowSalaList(false);
                          }}
                        >
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.cor }}></div>
                          <span className="text-gray-800 dark:text-white">{s.nome}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">({s.tipo})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {TIPO_AGENDAMENTO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Modalidade</label>
                  <select
                    value={formData.modalidade}
                    onChange={(e) => setFormData({...formData, modalidade: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {MODALIDADE.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label>
                  <input
                    type="date"
                    value={formData.data_agendamento}
                    onChange={(e) => setFormData({...formData, data_agendamento: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hora Início</label>
                    <input
                      type="time"
                      value={formData.hora_inicio}
                      onChange={(e) => setFormData({...formData, hora_inicio: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hora Fim</label>
                    <input
                      type="time"
                      value={formData.hora_fim}
                      onChange={(e) => setFormData({...formData, hora_fim: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                  <textarea
                    rows="3"
                    value={formData.observacao}
                    onChange={(e) => setFormData({...formData, observacao: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Informações adicionais..."
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t dark:border-gray-700 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-gray-800">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 text-gray-700 dark:text-gray-300">
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
