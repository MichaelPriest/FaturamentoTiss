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
  EyeIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChartBarIcon,
  UserIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabaseClient';

const STATUS_AGENDAMENTO = [
  { value: 'agendado', label: 'Agendado', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', bgCard: 'border-l-4 border-l-blue-500' },
  { value: 'confirmado', label: 'Confirmado', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', bgCard: 'border-l-4 border-l-green-500' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', bgCard: 'border-l-4 border-l-red-500 opacity-60' },
  { value: 'realizado', label: 'Realizado', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', bgCard: 'border-l-4 border-l-purple-500' },
  { value: 'aguardando', label: 'Aguardando', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', bgCard: 'border-l-4 border-l-yellow-500' }
];

const TIPO_AGENDAMENTO = [
  { value: 'consulta', label: 'Consulta', icon: UserIcon, color: 'from-blue-500 to-blue-600' },
  { value: 'exame', label: 'Exame', icon: BeakerIcon, color: 'from-green-500 to-green-600' },
  { value: 'procedimento', label: 'Procedimento', icon: DocumentTextIcon, color: 'from-orange-500 to-orange-600' },
  { value: 'retorno', label: 'Retorno', icon: ArrowPathIcon, color: 'from-purple-500 to-purple-600' },
  { value: 'teleconsulta', label: 'Teleconsulta', icon: VideoCameraIcon, color: 'from-cyan-500 to-cyan-600' }
];

const MODALIDADE = [
  { value: 'presencial', label: 'Presencial', icon: BuildingOfficeIcon },
  { value: 'teleconsulta', label: 'Teleconsulta', icon: VideoCameraIcon },
  { value: 'domicilio', label: 'Domicílio', icon: UserGroupIcon }
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
  const [selectedDate, setSelectedDate] = useState(new Date());

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

      console.log('Agendamentos carregados:', agendamentosRes.data);
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

  const handleDateClick = (data) => {
    setSelectedDate(data);
    setViewMode('dia');
    setCurrentDate(data);
  };

  const getAgendamentosFiltrados = () => {
    let filtrados = [...agendamentos];
    
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
        a.prestador_nome?.toLowerCase().includes(term) ||
        a.paciente_carteira?.includes(term)
      );
    }
    
    return filtrados;
  };

  const getAgendamentosPorData = (data) => {
    const dataStr = format(data, 'yyyy-MM-dd');
    const filtrados = getAgendamentosFiltrados();
    return filtrados.filter(a => a.data_agendamento === dataStr);
  };

  const getDiasDaSemana = () => {
    const inicio = startOfWeek(currentDate, { weekStartsOn: 1 });
    const dias = [];
    for (let i = 0; i < 7; i++) dias.push(addDays(inicio, i));
    return dias;
  };

  const getEstatisticas = () => {
    const hoje = new Date().toISOString().split('T')[0];
    const inicioSemana = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split('T')[0];
    const fimSemana = endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split('T')[0];
    const todosAgendamentos = getAgendamentosFiltrados();
    
    const agendamentosHoje = todosAgendamentos.filter(a => a.data_agendamento === hoje && a.status !== 'cancelado').length;
    const agendamentosSemana = todosAgendamentos.filter(a => a.data_agendamento >= inicioSemana && a.data_agendamento <= fimSemana && a.status !== 'cancelado').length;
    const agendamentosMes = todosAgendamentos.filter(a => {
      const data = new Date(a.data_agendamento);
      const hojeDate = new Date();
      return data.getMonth() === hojeDate.getMonth() && data.getFullYear() === hojeDate.getFullYear() && a.status !== 'cancelado';
    }).length;
    const agendamentosPendentes = todosAgendamentos.filter(a => a.status === 'agendado' || a.status === 'aguardando').length;
    const agendamentosRealizados = todosAgendamentos.filter(a => a.status === 'realizado').length;
    const totalAgendamentos = todosAgendamentos.length;
    const taxaOcupacao = totalAgendamentos > 0 ? Math.round((agendamentosHoje / HORARIOS.length) * 100) : 0;

    return { agendamentosHoje, agendamentosSemana, agendamentosMes, agendamentosPendentes, agendamentosRealizados, totalAgendamentos, taxaOcupacao };
  };

  const podeAtender = (agendamento) => {
    return agendamento.status !== 'realizado' && agendamento.status !== 'cancelado';
  };

  const agendamentosFiltrados = getAgendamentosFiltrados();
  const estatisticas = getEstatisticas();
  const diasDaSemana = getDiasDaSemana();

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
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Agendamentos
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Gerenciamento de consultas, exames e procedimentos
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
              <button onClick={() => setViewMode('dia')} className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-all ${viewMode === 'dia' ? 'bg-white dark:bg-gray-600 shadow-md text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                <ListBulletIcon className="w-4 h-4" /> Dia
              </button>
              <button onClick={() => setViewMode('semana')} className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-all ${viewMode === 'semana' ? 'bg-white dark:bg-gray-600 shadow-md text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                <ViewColumnsIcon className="w-4 h-4" /> Semana
              </button>
              <button onClick={() => setViewMode('mes')} className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-all ${viewMode === 'mes' ? 'bg-white dark:bg-gray-600 shadow-md text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                <CalendarDaysIcon className="w-4 h-4" /> Mês
              </button>
            </div>
            <button onClick={() => { setEditing(null); resetModal(); setShowModal(true); }} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-all">
              <PlusIcon className="w-4 h-4" /> Novo Agendamento
            </button>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex justify-between items-start">
              <div><p className="text-xs opacity-80">Hoje</p><p className="text-2xl font-bold">{estatisticas.agendamentosHoje}</p></div>
              <CalendarIcon className="w-8 h-8 opacity-50" />
            </div>
            <div className="mt-2"><div className="h-1 bg-white/30 rounded-full"><div className="h-1 bg-white rounded-full" style={{ width: `${estatisticas.taxaOcupacao}%` }}></div></div></div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex justify-between items-start"><div><p className="text-xs opacity-80">Esta Semana</p><p className="text-2xl font-bold">{estatisticas.agendamentosSemana}</p></div><ClockIcon className="w-8 h-8 opacity-50" /></div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex justify-between items-start"><div><p className="text-xs opacity-80">Este Mês</p><p className="text-2xl font-bold">{estatisticas.agendamentosMes}</p></div><ChartBarIcon className="w-8 h-8 opacity-50" /></div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex justify-between items-start"><div><p className="text-xs opacity-80">Pendentes</p><p className="text-2xl font-bold">{estatisticas.agendamentosPendentes}</p></div><BellIcon className="w-8 h-8 opacity-50" /></div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex justify-between items-start"><div><p className="text-xs opacity-80">Realizados</p><p className="text-2xl font-bold">{estatisticas.agendamentosRealizados}</p></div><CheckBadgeIcon className="w-8 h-8 opacity-50" /></div>
          </div>
          <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex justify-between items-start"><div><p className="text-xs opacity-80">Total</p><p className="text-2xl font-bold">{estatisticas.totalAgendamentos}</p></div><UserGroupIcon className="w-8 h-8 opacity-50" /></div>
          </div>
        </div>

        {/* Filtros Avançados */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4 shadow-sm">
          <button onClick={() => setShowFiltros(!showFiltros)} className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium mb-3 hover:text-blue-600 transition-colors">
            <FunnelIcon className="w-4 h-4" />
            Filtros Avançados
            {showFiltros ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
          </button>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Buscar por paciente, profissional ou carteira..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg pl-8 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:text-white" />
            </div>
            <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm">
              <option value="todos">Todos os status</option>
              {STATUS_AGENDAMENTO.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm">
              <option value="todos">Todos os tipos</option>
              {TIPO_AGENDAMENTO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          
          {showFiltros && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <select value={filtroModalidade} onChange={(e) => setFiltroModalidade(e.target.value)} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm">
                <option value="todos">Todas as modalidades</option>
                {MODALIDADE.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select value={filtroPrestador} onChange={(e) => setFiltroPrestador(e.target.value)} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm">
                <option value="todos">Todos os profissionais</option>
                {prestadores.map(p => <option key={p.id} value={p.id}>{p.nome} - {p.especialidade}</option>)}
              </select>
              <select value={filtroConvenio} onChange={(e) => setFiltroConvenio(e.target.value)} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm">
                <option value="todos">Todos os convênios</option>
                {convenios.map(c => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Navegação do Calendário */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4 shadow-sm">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex gap-2">
              <button onClick={navegarAnterior} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><ChevronLeftIcon className="w-5 h-5" /></button>
              <button onClick={navegarProximo} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><ChevronRightIcon className="w-5 h-5" /></button>
              <button onClick={irParaHoje} className="px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm shadow-md hover:shadow-lg transition-all">Hoje</button>
            </div>
            <div className="text-lg font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              {viewMode === 'dia' && format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              {viewMode === 'semana' && `Semana de ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "dd/MM")} a ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), "dd/MM/yyyy")}`}
              {viewMode === 'mes' && format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
            </div>
            <div className="text-sm text-gray-500">{agendamentosFiltrados.length} agendamentos encontrados</div>
          </div>
        </div>

        {/* Visualização Dia */}
        {viewMode === 'dia' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 text-white">
              <h3 className="text-center font-semibold">{format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</h3>
            </div>
            <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
              {HORARIOS.map(hora => {
                const agendamento = getAgendamentosPorData(currentDate).find(a => a.hora_inicio === hora);
                const statusInfo = agendamento ? STATUS_AGENDAMENTO.find(s => s.value === agendamento.status) : null;
                const tipoInfo = agendamento ? TIPO_AGENDAMENTO.find(t => t.value === agendamento.tipo) : null;
                const podeAtenderAgendamento = agendamento && podeAtender(agendamento);
                
                return (
                  <div key={hora} className={`border rounded-lg transition-all hover:shadow-md ${agendamento ? statusInfo?.bgCard + ' bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-800 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-4 min-w-[200px]">
                        <div className="w-20 font-mono text-base font-bold text-gray-700 dark:text-gray-300">{hora}</div>
                        {agendamento ? (
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-800 dark:text-white">{agendamento.paciente_nome}</span>
                              <span className="text-xs text-gray-500">({agendamento.paciente_carteira})</span>
                              {tipoInfo && <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gradient-to-r ${tipoInfo.color} text-white`}>{tipoInfo.label}</span>}
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${statusInfo?.color}`}>{statusInfo?.label}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{agendamento.prestador_nome} • {MODALIDADE.find(m => m.value === agendamento.modalidade)?.label}</div>
                          </div>
                        ) : (
                          <button onClick={() => { setFormData({ ...formData, data_agendamento: format(currentDate, 'yyyy-MM-dd'), hora_inicio: hora, hora_fim: HORARIOS[HORARIOS.indexOf(hora) + 1] || HORARIOS[HORARIOS.indexOf(hora)] }); setShowModal(true); }} className="flex-1 text-left text-gray-400 text-sm hover:text-blue-500 transition-colors">
                            Disponível para agendamento
                          </button>
                        )}
                      </div>
                      {agendamento && (
                        <div className="flex gap-1">
                          {podeAtenderAgendamento ? (
                            <Link to={`/prontuario/${agendamento.id}`} className="p-1.5 rounded-lg text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors" title="Atender Paciente">
                              <CheckBadgeIcon className="w-4 h-4" />
                            </Link>
                          ) : (
                            <button className="p-1.5 rounded-lg text-gray-400 cursor-not-allowed" title="Atendimento já realizado" disabled><EyeIcon className="w-4 h-4" /></button>
                          )}
                          <button onClick={() => handleEdit(agendamento)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Editar"><PencilIcon className="w-4 h-4" /></button>
                          <button onClick={() => excluirAgendamento(agendamento.id)} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Excluir"><TrashIcon className="w-4 h-4" /></button>
                          {agendamento.status === 'agendado' && (
                            <button onClick={() => atualizarStatus(agendamento.id, 'confirmado')} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50" title="Confirmar"><CheckBadgeIcon className="w-4 h-4" /></button>
                          )}
                          {(agendamento.status === 'agendado' || agendamento.status === 'confirmado') && (
                            <button onClick={() => atualizarStatus(agendamento.id, 'cancelado')} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50" title="Cancelar"><XCircleIcon className="w-4 h-4" /></button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Visualização Semana */}
        {viewMode === 'semana' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 text-white">
              <h3 className="text-center font-semibold">Agenda Semanal</h3>
            </div>
            <div className="p-4 overflow-x-auto">
              <div className="min-w-[1000px]">
                <div className="grid grid-cols-8 gap-2 mb-3">
                  <div className="col-span-1"></div>
                  {diasDaSemana.map((dia, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleDateClick(dia)}
                      className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                    >
                      <div className="text-sm font-bold text-gray-600 dark:text-gray-400">{format(dia, 'EEE', { locale: ptBR })}</div>
                      <div className={`text-lg font-bold rounded-full w-10 h-10 flex items-center justify-center mx-auto mt-1 ${isSameDay(dia, new Date()) ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md' : 'text-gray-800 dark:text-white'}`}>
                        {format(dia, 'dd')}
                      </div>
                    </button>
                  ))}
                </div>
                {HORARIOS.map(hora => (
                  <div key={hora} className="grid grid-cols-8 gap-2 mb-2">
                    <div className="col-span-1 text-sm font-mono font-bold text-gray-500 pt-2">{hora}</div>
                    {diasDaSemana.map((dia, idx) => {
                      const agendamento = getAgendamentosPorData(dia).find(a => a.hora_inicio === hora);
                      const podeAtenderAgendamento = agendamento && podeAtender(agendamento);
                      const statusInfo = agendamento ? STATUS_AGENDAMENTO.find(s => s.value === agendamento.status) : null;
                      return (
                        <div key={idx} className={`border rounded-lg p-2 min-h-[90px] transition-all hover:shadow-md ${agendamento ? statusInfo?.bgCard + ' bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-800 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                          {agendamento ? (
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-gray-800 dark:text-white truncate">{agendamento.paciente_nome}</p>
                              <p className="text-xs text-gray-500 truncate">{agendamento.prestador_nome}</p>
                              <div className="flex gap-1 mt-1">
                                {podeAtenderAgendamento ? (
                                  <Link to={`/prontuario/${agendamento.id}`} className="p-1 rounded text-cyan-600 hover:bg-cyan-50" title="Atender"><CheckBadgeIcon className="w-3 h-3" /></Link>
                                ) : (
                                  <button className="p-1 rounded text-gray-400 cursor-not-allowed"><EyeIcon className="w-3 h-3" /></button>
                                )}
                                <button onClick={() => handleEdit(agendamento)} className="p-1 rounded text-blue-600 hover:bg-blue-50" title="Editar"><PencilIcon className="w-3 h-3" /></button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => { setFormData({ ...formData, data_agendamento: format(dia, 'yyyy-MM-dd'), hora_inicio: hora, hora_fim: HORARIOS[HORARIOS.indexOf(hora) + 1] || HORARIOS[HORARIOS.indexOf(hora)] }); setShowModal(true); }} className="w-full h-full min-h-[70px] flex items-center justify-center text-gray-400 hover:text-blue-500 transition-colors">
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
          </div>
        )}

        {/* Visualização Mês */}
        {viewMode === 'mes' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 text-white">
              <h3 className="text-center font-semibold">Calendário Mensal</h3>
            </div>
            <div className="p-4 overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(dia => <div key={dia} className="text-center py-2 text-sm font-semibold text-gray-500">{dia}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    const start = startOfMonth(currentDate);
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
                        <div 
                          key={idx} 
                          onClick={() => handleDateClick(dia)}
                          className={`border rounded-lg min-h-[130px] p-2 transition-all hover:shadow-md cursor-pointer ${isCurrentMonth ? 'bg-white dark:bg-gray-800 border-gray-200' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100'} ${isToday ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center ${isToday ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md' : isCurrentMonth ? 'text-gray-800 dark:text-white' : 'text-gray-400'}`}>
                              {format(dia, 'dd')}
                            </span>
                            {agendamentosDia.length > 0 && <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs rounded-full px-2 py-0.5 shadow-sm">{agendamentosDia.length}</span>}
                          </div>
                          <div className="space-y-1 max-h-[80px] overflow-y-auto">
                            {agendamentosDia.slice(0, 3).map((ag, i) => {
                              const podeAtenderAgendamento = podeAtender(ag);
                              const statusInfo = STATUS_AGENDAMENTO.find(s => s.value === ag.status);
                              return (
                                <div key={i} className={`text-xs p-1 rounded flex items-center justify-between gap-1 ${statusInfo?.color}`}>
                                  <span className="truncate flex-1"><span className="font-mono">{ag.hora_inicio}</span> - {ag.paciente_nome?.split(' ')[0]}</span>
                                  {podeAtenderAgendamento ? (
                                    <Link to={`/prontuario/${ag.id}`} onClick={(e) => e.stopPropagation()} className="text-cyan-600 hover:text-cyan-800"><CheckBadgeIcon className="w-3 h-3" /></Link>
                                  ) : (
                                    <EyeIcon className="w-3 h-3 text-gray-400" />
                                  )}
                                </div>
                              );
                            })}
                            {agendamentosDia.length > 3 && <p className="text-xs text-gray-400 text-center">+{agendamentosDia.length - 3}</p>}
                            {agendamentosDia.length === 0 && isCurrentMonth && (
                              <button onClick={(e) => { e.stopPropagation(); setFormData({ ...formData, data_agendamento: format(dia, 'yyyy-MM-dd'), hora_inicio: '09:00', hora_fim: '09:30' }); setShowModal(true); }} className="w-full text-xs text-gray-400 hover:text-blue-500 py-2 transition-colors">
                                + Agendar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
