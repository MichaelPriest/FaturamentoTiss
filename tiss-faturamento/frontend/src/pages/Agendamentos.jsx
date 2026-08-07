// src/pages/Agendamentos.jsx - VERSÃO COMPLETA
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon,
  CalendarIcon, ClockIcon, UserGroupIcon, BuildingOfficeIcon, BeakerIcon,
  VideoCameraIcon, BellIcon, CheckBadgeIcon, XCircleIcon,
  ChevronLeftIcon, ChevronRightIcon, ViewColumnsIcon, CalendarDaysIcon,
  ListBulletIcon, EyeIcon, FunnelIcon,
  ChevronUpIcon, ChevronDownIcon, HomeModernIcon,
  DocumentArrowDownIcon, PrinterIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabaseClient';
import { useUnidade } from '../contexts/UnidadeContext';
import { applyUnidadeToPayload, filterByUnidade } from '../services/unidadesService';

const STATUS_AGENDAMENTO = [
  { value: 'agendado', label: 'Agendado', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', bgCard: 'border-l-4 border-l-blue-500' },
  { value: 'confirmado', label: 'Confirmado', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', bgCard: 'border-l-4 border-l-green-500' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', bgCard: 'border-l-4 border-l-red-500 opacity-60' },
  { value: 'realizado', label: 'Realizado', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', bgCard: 'border-l-4 border-l-purple-500' },
  { value: 'aguardando', label: 'Aguardando', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', bgCard: 'border-l-4 border-l-yellow-500' }
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
  const { unidadeAtualId } = useUnidade();
  const [agendamentos, setAgendamentos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [prestadores, setPrestadores] = useState([]);
  const [convenios, setConvenios] = useState([]);
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showFiltros, setShowFiltros] = useState(false);
  const [showRelatorioModal, setShowRelatorioModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroSala, setFiltroSala] = useState('todos');
  const [filtroPrestador, setFiltroPrestador] = useState('todos');
  const [viewMode, setViewMode] = useState('semana');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tooltipData, setTooltipData] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [relatorioPeriodo, setRelatorioPeriodo] = useState('semana');

  const [pacienteBusca, setPacienteBusca] = useState('');
  const [prestadorBusca, setPrestadorBusca] = useState('');
  const [salaBusca, setSalaBusca] = useState('');
  const [showPacienteList, setShowPacienteList] = useState(false);
  const [showPrestadorList, setShowPrestadorList] = useState(false);
  const [showSalaList, setShowSalaList] = useState(false);

  const [formData, setFormData] = useState({
    paciente_id: '',
    convenio_id: '',
    numero_carteira: '',
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

      setAgendamentos(filterByUnidade(agendamentosRes.data || [], unidadeAtualId));
      // Pacientes são compartilhados por empresa; o RLS já limita a empresa atual.
      setPacientes(pacientesRes.data || []);
      setPrestadores(filterByUnidade(prestadoresRes.data || [], unidadeAtualId));
      setConvenios(filterByUnidade(conveniosRes.data || [], unidadeAtualId));
      setSalas(filterByUnidade(salasRes.data || [], unidadeAtualId));
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [unidadeAtualId]);

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
    p.cpf?.includes(prestadorBusca) ||
    p.numero_conselho?.includes(prestadorBusca)
  ).slice(0, 15);

  // Filtrar salas
  const salasFiltradas = salas.filter(s =>
    s.nome?.toLowerCase().includes(salaBusca.toLowerCase())
  ).slice(0, 15);

  // Normalizar data
  const normalizarData = (data) => {
    if (!data) return '';
    if (typeof data === 'string' && data.includes('-')) {
      return data.split('T')[0];
    }
    return data;
  };

  const formatarHora = (hora) => {
    if (!hora) return '';
    return hora.substring(0, 5);
  };

  // Agendamentos filtrados
  const getAgendamentosFiltrados = () => {
    let filtrados = [...agendamentos];

    if (filtroStatus !== 'todos') {
      filtrados = filtrados.filter(a => a.status === filtroStatus);
    }
    if (filtroSala !== 'todos') {
      filtrados = filtrados.filter(a => a.sala_id === parseInt(filtroSala));
    }
    if (filtroPrestador !== 'todos') {
      filtrados = filtrados.filter(a => a.prestador_id === parseInt(filtroPrestador));
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
  };

  const getAgendamentosPorData = (data) => {
    const dataStr = format(data, 'yyyy-MM-dd');
    return getAgendamentosFiltrados().filter(a => normalizarData(a.data_agendamento) === dataStr);
  };

  const getDiasDaSemana = () => {
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

  const verificarConflitoHorario = async (data, horaInicio, horaFim, prestadorId, agendamentoId = null) => {
    const { data: agendamentosExistentes } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('data_agendamento', data)
      .eq('prestador_id', prestadorId)
      .neq('status', 'cancelado');

    if (!agendamentosExistentes) return false;

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

  const salvarAgendamento = async () => {
    if (!formData.paciente_id) {
      toast.error('Selecione um paciente');
      return;
    }
    if (!formData.convenio_id) {
      toast.error('Selecione o convênio deste agendamento');
      return;
    }
    if (!formData.numero_carteira?.trim()) {
      toast.error('Informe a carteira do paciente para este agendamento');
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
      toast.error(`Conflito! O profissional já tem agendamento das ${conflito.agendamento.hora_inicio} às ${conflito.agendamento.hora_fim}`);
      return;
    }

    const paciente = pacientes.find(p => p.id === parseInt(formData.paciente_id));
    const prestador = prestadores.find(p => p.id === parseInt(formData.prestador_id));
    const sala = salas.find(s => s.id === parseInt(formData.sala_id));
    const convenio = convenios.find(c => c.id === parseInt(formData.convenio_id));

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
      paciente_carteira: formData.numero_carteira || '',
      prestador_nome: prestador?.nome || '',
      prestador_especialidade: prestador?.especialidade || '',
      convenio_id: formData.convenio_id ? parseInt(formData.convenio_id) : null,
      convenio_nome: convenio?.razao_social || 'Sem convênio',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      if (editing) {
        const { error } = await supabase
          .from('agendamentos')
          .update(applyUnidadeToPayload(novoAgendamento, unidadeAtualId))
          .eq('id', editing.id);
        if (error) throw error;
        toast.success('Atualizado!');
      } else {
        const { error } = await supabase
          .from('agendamentos')
          .insert([applyUnidadeToPayload(novoAgendamento, unidadeAtualId)]);
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

  const atualizarStatus = async (id, status) => {
    const { error } = await supabase
      .from('agendamentos')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      toast.error('Erro ao atualizar status');
    } else {
      toast.success(`Status atualizado para ${STATUS_AGENDAMENTO.find(s => s.value === status)?.label}`);
      carregarDados();
    }
  };

  const podeAtender = (agendamento) => {
    return agendamento.status !== 'realizado' && agendamento.status !== 'cancelado';
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

  // Exportar para CSV
  const exportarCSV = () => {
    let dados = [];
    if (relatorioPeriodo === 'hoje') {
      dados = getAgendamentosPorData(new Date());
    } else if (relatorioPeriodo === 'semana') {
      const dias = getDiasDaSemana();
      dados = dias.flatMap(dia => getAgendamentosPorData(dia));
    } else {
      dados = getAgendamentosFiltrados();
    }

    if (dados.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const csvRows = [
      ['Data', 'Hora', 'Paciente', 'Carteira', 'Profissional', 'Especialidade', 'Tipo', 'Modalidade', 'Sala', 'Status', 'Observações']
    ];

    dados.forEach(ag => {
      csvRows.push([
        normalizarData(ag.data_agendamento),
        `${formatarHora(ag.hora_inicio)} - ${formatarHora(ag.hora_fim)}`,
        ag.paciente_nome,
        ag.paciente_carteira,
        ag.prestador_nome,
        ag.prestador_especialidade || '',
        TIPO_AGENDAMENTO.find(t => t.value === ag.tipo)?.label || ag.tipo,
        MODALIDADE.find(m => m.value === ag.modalidade)?.label || ag.modalidade,
        ag.sala_nome || '',
        STATUS_AGENDAMENTO.find(s => s.value === ag.status)?.label || ag.status,
        ag.observacao || ''
      ]);
    });

    const csvContent = csvRows.map(row => row.join(';')).join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `agendamentos_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('CSV exportado com sucesso!');
  };

  // Imprimir relatório
  const imprimirRelatorio = () => {
    let dados = [];
    let titulo = '';

    if (relatorioPeriodo === 'hoje') {
      dados = getAgendamentosPorData(new Date());
      titulo = `Relatório de Agendamentos - ${format(new Date(), "dd/MM/yyyy")}`;
    } else if (relatorioPeriodo === 'semana') {
      const dias = getDiasDaSemana();
      dados = dias.flatMap(dia => getAgendamentosPorData(dia));
      titulo = `Relatório de Agendamentos - Semana de ${format(startOfWeek(new Date(), { weekStartsOn: 1 }), "dd/MM")} a ${format(endOfWeek(new Date(), { weekStartsOn: 1 }), "dd/MM/yyyy")}`;
    } else {
      dados = getAgendamentosFiltrados();
      titulo = 'Relatório de Agendamentos - Geral';
    }

    if (dados.length === 0) {
      toast.error('Nenhum dado para imprimir');
      return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório de Agendamentos</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #2563eb; text-align: center; }
          .header { text-align: center; margin-bottom: 30px; }
          .info { margin-bottom: 20px; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th { background-color: #2563eb; color: white; padding: 10px; text-align: left; }
          td { border: 1px solid #ddd; padding: 8px; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .status { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
          .status-agendado { background-color: #dbeafe; color: #1e40af; }
          .status-confirmado { background-color: #dcfce7; color: #166534; }
          .status-realizado { background-color: #f3e8ff; color: #6b21a5; }
          .status-cancelado { background-color: #fee2e2; color: #991b1b; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          @media print {
            body { margin: 0; padding: 10px; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Sistema de Faturamento TISS</h1>
          <h2>${titulo}</h2>
          <p>Gerado em: ${new Date().toLocaleString()}</p>
        </div>
        <div class="info">
          <p><strong>Total de agendamentos:</strong> ${dados.length}</p>
          <p><strong>Filtros aplicados:</strong> ${filtroStatus !== 'todos' ? `Status: ${STATUS_AGENDAMENTO.find(s => s.value === filtroStatus)?.label} | ` : ''}${filtroSala !== 'todos' ? `Sala: ${salas.find(s => s.id === parseInt(filtroSala))?.nome} | ` : ''}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Data</th><th>Hora</th><th>Paciente</th><th>Carteira</th><th>Profissional</th><th>Tipo</th><th>Sala</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${dados.map(ag => `
              <tr>
                <td>${normalizarData(ag.data_agendamento)}</td>
                <td>${formatarHora(ag.hora_inicio)} - ${formatarHora(ag.hora_fim)}</td>
                <td>${ag.paciente_nome}</td>
                <td>${ag.paciente_carteira}</td>
                <td>${ag.prestador_nome}</td>
                <td>${TIPO_AGENDAMENTO.find(t => t.value === ag.tipo)?.label || ag.tipo}</td>
                <td>${ag.sala_nome || '-'}</td>
                <td><span class="status status-${ag.status}">${STATUS_AGENDAMENTO.find(s => s.value === ag.status)?.label}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>Sistema de Faturamento TISS - Relatório gerado automaticamente</p>
        </div>
        <script>window.onload = function() { window.print(); window.close(); };</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const agendamentosFiltrados = getAgendamentosFiltrados();
  const estatisticas = {
    hoje: getAgendamentosPorData(new Date()).filter(a => a.status !== 'cancelado').length,
    semana: getAgendamentosPorData(new Date()).length + getAgendamentosPorData(addDays(new Date(), 1)).length,
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

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Agendamentos</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie consultas, exames e procedimentos</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowRelatorioModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              Relatório
            </button>
            <button
              onClick={() => {
                setEditing(null);
                setFormData({
                  paciente_id: '',
                  convenio_id: '',
                  numero_carteira: '',
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
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Novo Agendamento
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-500 dark:text-gray-400">Hoje</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{estatisticas.hoje}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-500 dark:text-gray-400">Esta Semana</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{estatisticas.semana}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-purple-500">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{estatisticas.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-500 dark:text-gray-400">Pendentes</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{estatisticas.pendentes}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-purple-500">
            <p className="text-sm text-gray-500 dark:text-gray-400">Realizados</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{estatisticas.realizados}</p>
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
            <div className="grid grid-cols-4 gap-3">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar paciente, profissional..."
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
              <select
                value={filtroPrestador}
                onChange={(e) => setFiltroPrestador(e.target.value)}
                className="border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="todos">Todos os profissionais</option>
                {prestadores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Navegação */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="flex justify-between items-center">
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
              <button onClick={() => setViewMode('dia')} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${viewMode === 'dia' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                <ListBulletIcon className="w-4 h-4" /> Dia
              </button>
              <button onClick={() => setViewMode('semana')} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${viewMode === 'semana' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                <ViewColumnsIcon className="w-4 h-4" /> Semana
              </button>
              <button onClick={() => setViewMode('mes')} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${viewMode === 'mes' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
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

        {/* VISUALIZAÇÃO DIA */}
        {viewMode === 'dia' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-t-lg">
              <h3 className="text-center font-semibold">Agenda do Dia</h3>
            </div>
            <div className="divide-y dark:divide-gray-700">
              {getAgendamentosPorData(currentDate).length === 0 ? (
                <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  Nenhum agendamento para {format(currentDate, "dd 'de' MMMM", { locale: ptBR })}
                </div>
              ) : (
                getAgendamentosPorData(currentDate).map(ag => {
                  const statusInfo = STATUS_AGENDAMENTO.find(s => s.value === ag.status);
                  return (
                    <div key={ag.id} className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${statusInfo?.bgCard}`}>
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-24 font-mono font-bold text-lg text-gray-700 dark:text-gray-300">
                            {formatarHora(ag.hora_inicio)} - {formatarHora(ag.hora_fim)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-lg text-gray-800 dark:text-white">{ag.paciente_nome}</span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">{ag.paciente_carteira}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${statusInfo?.color}`}>
                                {statusInfo?.label}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {ag.prestador_nome}
                              {ag.sala_nome && <span className="ml-2">🏥 {ag.sala_nome}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {ag.status === 'agendado' && (
                            <button onClick={() => atualizarStatus(ag.id, 'confirmado')} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg" title="Confirmar">
                              <CheckBadgeIcon className="w-5 h-5" />
                            </button>
                          )}
                          {(ag.status === 'agendado' || ag.status === 'confirmado') && (
                            <button onClick={() => atualizarStatus(ag.id, 'cancelado')} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Cancelar">
                              <XCircleIcon className="w-5 h-5" />
                            </button>
                          )}
                          {podeAtender(ag) && (
                            <Link to={`/prontuario/${ag.id}`} className="p-2 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg" title="Atender">
                              <CheckBadgeIcon className="w-5 h-5" />
                            </Link>
                          )}
                          <button onClick={() => {
                            setEditing(ag);
                            setFormData({
                              paciente_id: ag.paciente_id?.toString() || '',
                              convenio_id: ag.convenio_id?.toString() || '',
                              numero_carteira: ag.paciente_carteira || '',
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
                            setPacienteBusca(ag.paciente_nome || '');
                            setPrestadorBusca(ag.prestador_nome || '');
                            setSalaBusca(ag.sala_nome || '');
                            setShowModal(true);
                          }} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button onClick={() => excluirAgendamento(ag.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
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

        {/* VISUALIZAÇÃO SEMANA - CORRIGIDA */}
        {viewMode === 'semana' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-3 rounded-t-lg">
              <h3 className="text-center font-semibold">Agenda Semanal</h3>
            </div>
            <div className="p-4 min-w-[1000px]">
              <div className="grid grid-cols-8 gap-2 mb-3">
                <div className="col-span-1"></div>
                {getDiasDaSemana().map((dia, idx) => (
                  <div key={idx} className="text-center p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                    <div className="font-bold text-gray-600 dark:text-gray-300">{format(dia, 'EEE', { locale: ptBR })}</div>
                    <div className={`text-lg font-bold ${isSameDay(dia, new Date()) ? 'text-blue-600' : 'text-gray-800 dark:text-white'}`}>
                      {format(dia, 'dd/MM')}
                    </div>
                  </div>
                ))}
              </div>
              {HORARIOS.map(hora => {
                const agendamentosPorHorario = {};
                getDiasDaSemana().forEach(dia => {
                  agendamentosPorHorario[format(dia, 'yyyy-MM-dd')] = getAgendamentosPorData(dia).find(a => a.hora_inicio === hora);
                });
                return (
                  <div key={hora} className="grid grid-cols-8 gap-2 mb-2">
                    <div className="col-span-1 text-sm font-mono font-bold text-gray-500 dark:text-gray-400 pt-2">{hora}</div>
                    {getDiasDaSemana().map((dia, idx) => {
                      const ag = agendamentosPorHorario[format(dia, 'yyyy-MM-dd')];
                      return (
                        <div key={idx} className={`border rounded-lg p-2 min-h-[80px] transition-all ${ag ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                          {ag ? (
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-gray-800 dark:text-white truncate">{ag.paciente_nome}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{ag.prestador_nome}</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {ag.status === 'agendado' && (
                                  <button onClick={() => atualizarStatus(ag.id, 'confirmado')} className="p-1 rounded text-green-600 hover:bg-green-50" title="Confirmar">
                                    <CheckBadgeIcon className="w-3 h-3" />
                                  </button>
                                )}
                                {podeAtender(ag) && (
                                  <Link to={`/prontuario/${ag.id}`} className="p-1 rounded text-cyan-600 hover:bg-cyan-50" title="Atender">
                                    <CheckBadgeIcon className="w-3 h-3" />
                                  </Link>
                                )}
                                <button onClick={() => {
                                  setEditing(ag);
                                  setFormData({
                                    paciente_id: ag.paciente_id?.toString() || '',
                                    convenio_id: ag.convenio_id?.toString() || '',
                                    numero_carteira: ag.paciente_carteira || '',
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
                                  setPacienteBusca(ag.paciente_nome || '');
                                  setPrestadorBusca(ag.prestador_nome || '');
                                  setSalaBusca(ag.sala_nome || '');
                                  setShowModal(true);
                                }} className="p-1 rounded text-blue-600 hover:bg-blue-50">
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
                              className="w-full h-full flex items-center justify-center text-gray-400 hover:text-blue-500 transition-colors"
                            >
                              <PlusIcon className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VISUALIZAÇÃO MÊS COM TOOLTIP */}
        {viewMode === 'mes' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-3 rounded-t-lg">
              <h3 className="text-center font-semibold">Calendário Mensal</h3>
            </div>
            <div className="p-4 min-w-[900px]">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(dia => (
                  <div key={dia} className="text-center py-2 text-sm font-semibold text-gray-500 dark:text-gray-400">{dia}</div>
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
                      <div
                        key={i}
                        className={`border dark:border-gray-700 rounded-lg min-h-[100px] p-2 transition-all hover:shadow-md cursor-pointer ${!isCurrentMonth ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-800'} ${isSameDay(current, new Date()) ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
                        onMouseEnter={(e) => handleMouseEnter(e, current, ags)}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className={`font-semibold text-sm p-1 ${isSameDay(current, new Date()) ? 'text-blue-600 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                          {format(current, 'dd')}
                        </div>
                        <div className="space-y-1 mt-1 max-h-[70px] overflow-y-auto">
                          {ags.slice(0, 3).map(ag => {
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
                          {ags.length === 0 && isCurrentMonth && (
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

        {/* TOOLTIP */}
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

      {/* MODAL DE RELATÓRIO */}
      {showRelatorioModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Exportar Relatório</h2>
              <button onClick={() => setShowRelatorioModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Período</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setRelatorioPeriodo('hoje')}
                    className={`px-3 py-2 rounded-lg text-sm ${relatorioPeriodo === 'hoje' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  >
                    Hoje
                  </button>
                  <button
                    onClick={() => setRelatorioPeriodo('semana')}
                    className={`px-3 py-2 rounded-lg text-sm ${relatorioPeriodo === 'semana' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  >
                    Esta Semana
                  </button>
                  <button
                    onClick={() => setRelatorioPeriodo('todos')}
                    className={`px-3 py-2 rounded-lg text-sm ${relatorioPeriodo === 'todos' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  >
                    Todos
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    exportarCSV();
                    setShowRelatorioModal(false);
                  }}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  Exportar CSV
                </button>
                <button
                  onClick={() => {
                    imprimirRelatorio();
                    setShowRelatorioModal(false);
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700"
                >
                  <PrinterIcon className="w-5 h-5" />
                  Imprimir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AGENDAMENTO */}
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
                <div className="relative paciente-dropdown">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paciente *</label>
                  <input
                    type="text"
                    placeholder="Digite nome ou CPF..."
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
                            setFormData({...formData, paciente_id: p.id.toString(), numero_carteira: '', convenio_id: ''});
                            setPacienteBusca(p.nome);
                            setShowPacienteList(false);
                          }}
                        >
                          <div className="font-medium text-gray-800 dark:text-white">{p.nome}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">CPF: {p.cpf || '---'} | Nasc.: {p.data_nascimento || '---'}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Convênio do Agendamento *</label>
                  <select
                    value={formData.convenio_id || ''}
                    onChange={(e) => setFormData({...formData, convenio_id: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  >
                    <option value="">Selecione o convênio</option>
                    {convenios.filter(c => c.ativo !== false).map(c => (
                      <option key={c.id} value={c.id}>{c.razao_social}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Carteira do Agendamento *</label>
                  <input
                    type="text"
                    value={formData.numero_carteira || ''}
                    onChange={(e) => setFormData({...formData, numero_carteira: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Número da carteira neste convênio"
                    required
                  />
                </div>

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
