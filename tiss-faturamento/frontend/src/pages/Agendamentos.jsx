// src/pages/Agendamentos.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon, 
  CheckIcon, 
  XMarkIcon, 
  EyeIcon, 
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  BeakerIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  VideoCameraIcon,
  ArrowPathIcon,
  BellIcon,
  CheckBadgeIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format, addDays, subDays, startOfWeek, endOfWeek, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabaseClient';

// Status de agendamento
const STATUS_AGENDAMENTO = [
  { value: 'agendado', label: 'Agendado', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: ClockIcon },
  { value: 'confirmado', label: 'Confirmado', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckBadgeIcon },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircleIcon },
  { value: 'realizado', label: 'Realizado', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: CheckIcon },
  { value: 'aguardando', label: 'Aguardando', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: BellIcon }
];

// Tipos de agendamento
const TIPO_AGENDAMENTO = [
  { value: 'consulta', label: 'Consulta', icon: UserGroupIcon },
  { value: 'exame', label: 'Exame', icon: BeakerIcon },
  { value: 'procedimento', label: 'Procedimento', icon: BeakerIcon },
  { value: 'retorno', label: 'Retorno', icon: ArrowPathIcon },
  { value: 'teleconsulta', label: 'Teleconsulta', icon: VideoCameraIcon }
];

// Modalidades de atendimento
const MODALIDADE = [
  { value: 'presencial', label: 'Presencial', icon: MapPinIcon },
  { value: 'teleconsulta', label: 'Teleconsulta', icon: VideoCameraIcon },
  { value: 'domicilio', label: 'Domicílio', icon: BuildingOfficeIcon }
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
  const [filtroData, setFiltroData] = useState('hoje');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('lista'); // lista, calendario

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
    lembrete_antecedencia: 60, // minutos
    paciente_nome: '',
    paciente_carteira: '',
    prestador_nome: '',
    prestador_especialidade: '',
    convenio_nome: ''
  });

  // ============================================
  // CARREGAR DADOS DO SUPABASE
  // ============================================

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

  // Salvar agendamento
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

  // Excluir agendamento
  const excluirAgendamento = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return;
    
    try {
      const { error } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Agendamento excluído com sucesso!');
      await carregarDados();
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error);
      toast.error('Erro ao excluir agendamento');
    }
  };

  // Atualizar status
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

    if (editing) {
      novoAgendamento.id = editing.id;
    }

    const sucesso = await salvarAgendamento(novoAgendamento);
    if (sucesso) {
      resetModal();
    }
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
    setFormData({
      ...agendamento
    });
    setShowModal(true);
  };

  // Filtrar agendamentos
  const agendamentosFiltrados = useMemo(() => {
    let filtrados = [...agendamentos];

    if (filtroStatus !== 'todos') {
      filtrados = filtrados.filter(a => a.status === filtroStatus);
    }

    if (filtroTipo !== 'todos') {
      filtrados = filtrados.filter(a => a.tipo === filtroTipo);
    }

    if (filtroData === 'hoje') {
      const hoje = new Date().toISOString().split('T')[0];
      filtrados = filtrados.filter(a => a.data_agendamento === hoje);
    } else if (filtroData === 'amanha') {
      const amanha = addDays(new Date(), 1).toISOString().split('T')[0];
      filtrados = filtrados.filter(a => a.data_agendamento === amanha);
    } else if (filtroData === 'semana') {
      const inicio = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split('T')[0];
      const fim = endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split('T')[0];
      filtrados = filtrados.filter(a => a.data_agendamento >= inicio && a.data_agendamento <= fim);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtrados = filtrados.filter(a => 
        a.paciente_nome?.toLowerCase().includes(term) ||
        a.prestador_nome?.toLowerCase().includes(term)
      );
    }

    return filtrados;
  }, [agendamentos, filtroStatus, filtroTipo, filtroData, searchTerm]);

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
        <div className="flex justify-between items-center mb-6">
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
              <button
                onClick={() => setViewMode('lista')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === 'lista' 
                    ? 'bg-white dark:bg-gray-600 shadow-md text-gray-900 dark:text-white' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Lista
              </button>
              <button
                onClick={() => setViewMode('calendario')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === 'calendario' 
                    ? 'bg-white dark:bg-gray-600 shadow-md text-gray-900 dark:text-white' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Calendário
              </button>
            </div>
            <button 
              onClick={() => { setEditing(null); resetModal(); setShowModal(true); }} 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg"
            >
              <PlusIcon className="w-4 h-4" /> Novo Agendamento
            </button>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Agendamentos Hoje</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{agendamentosHoje}</p>
              </div>
              <CalendarIcon className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Esta Semana</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{agendamentosSemana}</p>
              </div>
              <ClockIcon className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Agendamentos</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{agendamentos.length}</p>
              </div>
              <UserGroupIcon className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{agendamentosPendentes}</p>
              </div>
              <BellIcon className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input 
                type="text" 
                placeholder="Buscar por paciente ou profissional..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
              />
            </div>
            <select 
              value={filtroStatus} 
              onChange={(e) => setFiltroStatus(e.target.value)} 
              className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              <option value="todos">Todos os status</option>
              {STATUS_AGENDAMENTO.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select 
              value={filtroTipo} 
              onChange={(e) => setFiltroTipo(e.target.value)} 
              className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              <option value="todos">Todos os tipos</option>
              {TIPO_AGENDAMENTO.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <select 
              value={filtroData} 
              onChange={(e) => setFiltroData(e.target.value)} 
              className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              <option value="hoje">Hoje</option>
              <option value="amanha">Amanhã</option>
              <option value="semana">Esta semana</option>
              <option value="todos">Todos</option>
            </select>
          </div>
        </div>

        {/* Lista de Agendamentos */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data/Hora</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Paciente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Profissional</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Modalidade</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {agendamentosFiltrados.map((a) => {
                  const statusInfo = STATUS_AGENDAMENTO.find(s => s.value === a.status);
                  const StatusIcon = statusInfo?.icon;
                  return (
                    <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {format(new Date(a.data_agendamento), 'dd/MM/yyyy')}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {a.hora_inicio} - {a.hora_fim}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-800 dark:text-gray-200">{a.paciente_nome}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{a.paciente_carteira}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-800 dark:text-gray-200">{a.prestador_nome}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{a.prestador_especialidade}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {TIPO_AGENDAMENTO.find(t => t.value === a.tipo)?.label || a.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {MODALIDADE.find(m => m.value === a.modalidade)?.label || a.modalidade}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo?.color}`}>
                          {StatusIcon && <StatusIcon className="w-3 h-3" />}
                          {statusInfo?.label || a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-1 justify-center">
                          {a.status === 'agendado' && (
                            <button 
                              onClick={() => atualizarStatus(a.id, 'confirmado')} 
                              className="p-1 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors" 
                              title="Confirmar"
                            >
                              <CheckBadgeIcon className="w-4 h-4" />
                            </button>
                          )}
                          {(a.status === 'agendado' || a.status === 'confirmado') && (
                            <button 
                              onClick={() => atualizarStatus(a.id, 'cancelado')} 
                              className="p-1 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" 
                              title="Cancelar"
                            >
                              <XCircleIcon className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => handleEdit(a)} className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Editar">
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => excluirAgendamento(a.id)} className="p-1 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Excluir">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </table>
                  );
                })}
                {agendamentosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-4 py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                      <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      Nenhum agendamento encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Cadastro/Edição */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                    {editing ? 'Editar Agendamento' : 'Novo Agendamento'}
                  </h3>
                  <button onClick={resetModal} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="p-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paciente *</label>
                      <select 
                        value={formData.paciente_id} 
                        onChange={e => handlePacienteChange(e.target.value)} 
                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                        required
                      >
                        <option value="">Selecione um paciente</option>
                        {pacientes.map(p => (
                          <option key={p.id} value={p.id}>{p.nome} - {p.numero_carteira}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profissional *</label>
                      <select 
                        value={formData.prestador_id} 
                        onChange={e => handlePrestadorChange(e.target.value)} 
                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                        required
                      >
                        <option value="">Selecione um profissional</option>
                        {prestadores.map(p => (
                          <option key={p.id} value={p.id}>{p.nome} - {p.especialidade}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Agendamento *</label>
                      <select 
                        value={formData.tipo} 
                        onChange={e => setFormData({...formData, tipo: e.target.value})} 
                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      >
                        {TIPO_AGENDAMENTO.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Modalidade *</label>
                      <select 
                        value={formData.modalidade} 
                        onChange={e => setFormData({...formData, modalidade: e.target.value})} 
                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      >
                        {MODALIDADE.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data *</label>
                      <input 
                        type="date" 
                        value={formData.data_agendamento} 
                        onChange={e => setFormData({...formData, data_agendamento: e.target.value})} 
                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hora Início *</label>
                        <input 
                          type="time" 
                          value={formData.hora_inicio} 
                          onChange={e => setFormData({...formData, hora_inicio: e.target.value})} 
                          className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hora Fim *</label>
                        <input 
                          type="time" 
                          value={formData.hora_fim} 
                          onChange={e => setFormData({...formData, hora_fim: e.target.value})} 
                          className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                          required
                        />
                      </div>
                    </div>

                    {formData.modalidade === 'teleconsulta' && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link da Teleconsulta</label>
                        <input 
                          type="url" 
                          value={formData.link_teleconsulta} 
                          onChange={e => setFormData({...formData, link_teleconsulta: e.target.value})} 
                          placeholder="https://meet.google.com/..." 
                          className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        />
                      </div>
                    )}

                    {formData.modalidade === 'presencial' && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Local</label>
                        <input 
                          type="text" 
                          value={formData.local} 
                          onChange={e => setFormData({...formData, local: e.target.value})} 
                          placeholder="Sala, consultório, etc." 
                          className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        />
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                      <textarea 
                        rows="3" 
                        value={formData.observacao} 
                        onChange={e => setFormData({...formData, observacao: e.target.value})} 
                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                        placeholder="Informações adicionais..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={resetModal}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md"
                    >
                      {editing ? 'Atualizar' : 'Salvar'} Agendamento
                    </button>
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
