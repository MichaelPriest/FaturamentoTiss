// src/pages/ChamadosRegistro.jsx
import { useEffect, useState } from 'react';
import { PlusIcon, XMarkIcon, UserPlusIcon, QrCodeIcon, CalendarIcon, ClockIcon, UserIcon, BuildingOfficeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useUnidade } from '../contexts/UnidadeContext';
import { applyUnidadeToPayload, filterByUnidade } from '../services/unidadesService';

const initialForm = {
  paciente_nome: '',
  paciente_id: '',
  senha: '',
  destino_tipo: 'consultorio',
  destino_nome: '',
  origem_nome: 'Recepção',
  observacao: '',
  agendamento_id: ''
};

export default function ChamadosRegistro() {
  const { user } = useAuth();
  const { unidadeAtualId } = useUnidade();
  const [agendamentos, setAgendamentos] = useState([]);
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState(null);
  
  // ============================================
  // FUNÇÕES DE DATA/HORA COM FUSO BRASIL (UTC-3)
  // ============================================
  
  const getDataLocalBrasil = () => {
    const agora = new Date();
    // Ajustar para fuso horário de Brasília (UTC-3)
    const offsetBrasil = -3;
    const utc = agora.getTime() + (agora.getTimezoneOffset() * 60000);
    const dataBrasil = new Date(utc + (offsetBrasil * 3600000));
    return dataBrasil;
  };

  const getDataLocalFormatada = () => {
    const dataBrasil = getDataLocalBrasil();
    const ano = dataBrasil.getFullYear();
    const mes = String(dataBrasil.getMonth() + 1).padStart(2, '0');
    const dia = String(dataBrasil.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  const getHoraLocalFormatada = () => {
    const dataBrasil = getDataLocalBrasil();
    const horas = String(dataBrasil.getHours()).padStart(2, '0');
    const minutos = String(dataBrasil.getMinutes()).padStart(2, '0');
    return `${horas}:${minutos}`;
  };

  const getDataExibicao = () => {
    const dataBrasil = getDataLocalBrasil();
    return dataBrasil.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const [dataAtual, setDataAtual] = useState(getDataLocalFormatada);
  const [horaAtual, setHoraAtual] = useState(getHoraLocalFormatada);
  const [dataExibicao, setDataExibicao] = useState(getDataExibicao);

  // Atualizar data/hora local a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setDataAtual(getDataLocalFormatada());
      setHoraAtual(getHoraLocalFormatada());
      setDataExibicao(getDataExibicao());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // ============================================
  // CARREGAR DADOS
  // ============================================

  const carregarDados = async () => {
    setLoading(true);
    setError(null);
    try {
      // Usar a data atual do Brasil
      const hoje = dataAtual;
      
      // Calcular data limite (próximos 7 dias)
      const dataLimite = getDataLocalBrasil();
      dataLimite.setDate(dataLimite.getDate() + 7);
      const dataLimiteStr = dataLimite.toISOString().split('T')[0];
      
      console.log('📅 Data atual Brasil:', hoje);
      console.log('🕐 Hora atual Brasil:', horaAtual);
      console.log('📅 Buscando agendamentos entre:', hoje, 'e', dataLimiteStr);
      console.log('🏢 Unidade atual:', unidadeAtualId);
      
      // Buscar agendamentos a partir de hoje até próximos 7 dias
      let query = supabase
        .from('agendamentos')
        .select(`
          id,
          paciente_id,
          paciente_nome,
          prestador_id,
          prestador_nome,
          prestador_especialidade,
          convenio_id,
          convenio_nome,
          data_agendamento,
          hora_inicio,
          hora_fim,
          status,
          tipo,
          modalidade,
          local,
          sala_id,
          sala_nome,
          observacao,
          unidade_id
        `)
        .gte('data_agendamento', hoje)
        .lte('data_agendamento', dataLimiteStr)
        .in('status', ['agendado', 'confirmado', 'em_andamento'])
        .order('data_agendamento', { ascending: true })
        .order('hora_inicio', { ascending: true });

      // Se tiver unidade específica, filtrar por ela
      if (unidadeAtualId && unidadeAtualId !== 'todas') {
        query = query.eq('unidade_id', unidadeAtualId);
      }

      const { data: agendamentosData, error: agendamentosError } = await query;

      if (agendamentosError) {
        console.error('❌ Erro ao buscar agendamentos:', agendamentosError);
        throw agendamentosError;
      }

      console.log('📋 Agendamentos encontrados:', agendamentosData?.length || 0);

      // Buscar salas ativas da unidade
      let salasQuery = supabase
        .from('salas')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (unidadeAtualId && unidadeAtualId !== 'todas') {
        salasQuery = salasQuery.eq('unidade_id', unidadeAtualId);
      }

      const { data: salasData, error: salasError } = await salasQuery;

      if (salasError) {
        console.error('❌ Erro ao buscar salas:', salasError);
        throw salasError;
      }

      console.log('🏢 Salas encontradas:', salasData?.length || 0);

      setAgendamentos(agendamentosData || []);
      setSalas(salasData || []);
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      setError(error.message);
      toast.error('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Recarregar quando a data mudar ou unidade mudar
  useEffect(() => {
    if (dataAtual) {
      carregarDados();
    }
  }, [dataAtual, unidadeAtualId]);

  // ============================================
  // FUNÇÕES AUXILIARES
  // ============================================

  // Função para formatar data para exibição
  const formatarData = (dataString) => {
    const data = new Date(dataString);
    const hoje = getDataLocalBrasil();
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    
    if (data.toDateString() === hoje.toDateString()) {
      return 'Hoje';
    } else if (data.toDateString() === amanha.toDateString()) {
      return 'Amanhã';
    } else {
      return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  // Verificar se o agendamento já passou do horário
  const isAtrasado = (dataAgendamento, horaInicio) => {
    if (dataAgendamento !== dataAtual) return false;
    
    const agora = getDataLocalBrasil();
    const [horas, minutos] = horaInicio.split(':');
    const horaAgendamento = new Date(agora);
    horaAgendamento.setHours(parseInt(horas), parseInt(minutos), 0);
    
    return agora > horaAgendamento;
  };

  // Função para gerar senha aleatória
  const gerarSenhaAleatoria = () => {
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numeros = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const letra = letras.charAt(Math.floor(Math.random() * letras.length));
    return `${letra}${numeros}`;
  };

  // Buscar paciente por ID
  const buscarPacientePorId = async (pacienteId) => {
    if (!pacienteId) return null;
    
    setBuscando(true);
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .select('id, nome, numero_carteira, convenio_id')
        .eq('id', pacienteId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar paciente:', error);
      return null;
    } finally {
      setBuscando(false);
    }
  };

  // Selecionar agendamento
  const selecionarAgendamento = async (agendamentoId) => {
    const agendamento = agendamentos.find((item) => String(item.id) === String(agendamentoId));
    if (!agendamento) return;

    console.log('📋 Agendamento selecionado:', agendamento);

    // Buscar dados completos do paciente se necessário
    let pacienteNome = agendamento.paciente_nome;
    let pacienteId = agendamento.paciente_id;
    
    if (agendamento.paciente_id && !pacienteNome) {
      const paciente = await buscarPacientePorId(agendamento.paciente_id);
      if (paciente) {
        pacienteNome = paciente.nome;
      }
    }
    
    // Definir destino
    let destinoNome = 'Consultório';
    let destinoTipo = 'consultorio';
    
    if (agendamento.sala_nome) {
      destinoNome = agendamento.sala_nome;
    } else if (agendamento.local) {
      destinoNome = agendamento.local;
    }
    
    // Definir tipo de destino baseado no tipo do agendamento
    if (agendamento.tipo === 'consulta') {
      destinoTipo = 'consultorio';
    } else if (agendamento.tipo === 'procedimento') {
      destinoTipo = 'procedimento';
    } else if (agendamento.tipo === 'exame') {
      destinoTipo = 'exame';
    }
    
    setFormData((prev) => ({
      ...prev,
      agendamento_id: String(agendamento.id),
      paciente_id: pacienteId || '',
      paciente_nome: pacienteNome || '',
      destino_tipo: destinoTipo,
      destino_nome: destinoNome,
      senha: prev.senha || gerarSenhaAleatoria(),
      observacao: agendamento.observacao || prev.observacao
    }));
  };

  // Criar chamado
  const criarChamado = async (event) => {
    event.preventDefault();
    
    if (!formData.paciente_nome.trim()) {
      toast.error('Informe o nome do paciente');
      return;
    }
    
    if (!formData.destino_nome.trim()) {
      toast.error('Informe o destino (sala/consultório)');
      return;
    }

    const senhaFinal = formData.senha.trim() || gerarSenhaAleatoria();
    const agendamentoSelecionado = agendamentos.find(
      (item) => String(item.id) === String(formData.agendamento_id)
    );
    
    const payload = applyUnidadeToPayload({
      titulo: `Chamar ${formData.paciente_nome.trim()}`,
      descricao: formData.observacao.trim(),
      categoria: 'chamada_paciente',
      prioridade: 'normal',
      status: 'aguardando',
      etapa: 'recepcao',
      etapa_ordem: 1,
      paciente_id: formData.paciente_id || (agendamentoSelecionado?.paciente_id ? String(agendamentoSelecionado.paciente_id) : null),
      paciente_nome: formData.paciente_nome.trim(),
      senha: senhaFinal,
      destino_tipo: formData.destino_tipo,
      destino_nome: formData.destino_nome.trim(),
      origem_nome: formData.origem_nome.trim() || 'Recepção',
      agendamento_id: formData.agendamento_id ? String(formData.agendamento_id) : null,
      solicitante_id: user?.id || null,
      solicitante_nome: user?.nome || user?.email?.split('@')[0] || 'Usuário',
      metadata: { 
        agendamento_id: formData.agendamento_id ? String(formData.agendamento_id) : null,
        senha_gerada: senhaFinal,
        destino_tipo: formData.destino_tipo,
        origem: formData.origem_nome,
        fluxo: ['recepcao', 'triagem', 'atendimento']
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, unidadeAtualId);

    try {
      const { error } = await supabase.from('chamados').insert([payload]);
      if (error) throw error;
      
      toast.success(`Paciente adicionado à fila com senha ${senhaFinal}`);
      setShowModal(false);
      setFormData(initialForm);
      await carregarDados();
    } catch (error) {
      console.error('Erro ao criar chamada:', error);
      toast.error('Erro ao criar chamada: ' + error.message);
    }
  };

  // Formatar hora
  const formatHora = (hora) => {
    if (!hora) return '';
    return typeof hora === 'string' ? hora.substring(0, 5) : hora;
  };

  // Obter cor da sala
  const getSalaCor = (sala) => {
    if (sala.cor) return sala.cor;
    return '#3B82F6';
  };

  // Separar agendamentos por data
  const agendamentosHoje = agendamentos.filter(ag => ag.data_agendamento === dataAtual);
  const agendamentosFuturos = agendamentos.filter(ag => ag.data_agendamento > dataAtual);

  if (loading && !dataAtual) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Recepção / Registro
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Adicione pacientes à fila de chamada por unidade
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1.5">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{dataExibicao}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{horaAtual}</p>
            </div>
            <button 
              onClick={() => setShowModal(true)} 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:from-blue-600 hover:to-indigo-700 shadow-lg"
            >
              <UserPlusIcon className="w-4 h-4" /> 
              Adicionar à Fila
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <QrCodeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Como funciona?</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Adicione pacientes à fila para que sejam chamados nos painéis de atendimento
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2">1</div>
              <p className="text-sm font-medium">Informe o paciente</p>
              <p className="text-xs text-gray-500">Nome e identificação</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2">2</div>
              <p className="text-sm font-medium">Selecione o destino</p>
              <p className="text-xs text-gray-500">Sala/consultório para atendimento</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2">3</div>
              <p className="text-sm font-medium">Gere a senha</p>
              <p className="text-xs text-gray-500">Senha será mostrada no painel</p>
            </div>
          </div>
        </div>

        {/* Exibir erro se houver */}
        {error && (
          <div className="mt-6 bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Lista de Salas Disponíveis */}
        {salas.length > 0 && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <BuildingOfficeIcon className="w-4 h-4" />
                Salas Disponíveis ({salas.length})
              </h3>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {salas.map((sala) => (
                <div 
                  key={sala.id}
                  className="p-3 rounded-lg border text-center cursor-pointer hover:shadow-md transition-all"
                  style={{ borderColor: getSalaCor(sala), backgroundColor: `${getSalaCor(sala)}10` }}
                  onClick={() => {
                    setFormData({
                      ...formData,
                      destino_nome: sala.nome,
                      destino_tipo: sala.tipo || 'consultorio'
                    });
                    setShowModal(true);
                  }}
                >
                  <div 
                    className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center"
                    style={{ backgroundColor: getSalaCor(sala) }}
                  >
                    <span className="text-white text-xs font-bold">
                      {sala.nome.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">{sala.nome}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {sala.tipo === 'consultorio' ? 'Consultório' : sala.tipo === 'procedimento' ? 'Procedimento' : 'Sala'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agendamentos de Hoje */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Agendamentos de Hoje ({dataExibicao})
              {agendamentosHoje.length > 0 && <span className="text-sm text-gray-500">({agendamentosHoje.length})</span>}
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {agendamentosHoje.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum agendamento para hoje</p>
                <p className="text-xs mt-1">Data atual: {dataExibicao} - {horaAtual}</p>
              </div>
            ) : (
              agendamentosHoje.map((ag) => {
                const atrasado = isAtrasado(ag.data_agendamento, ag.hora_inicio);
                return (
                  <div key={ag.id} className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${atrasado ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-800 dark:text-white">
                            {ag.paciente_nome || 'Paciente não identificado'}
                          </p>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                            {ag.tipo === 'consulta' ? 'Consulta' : ag.tipo === 'procedimento' ? 'Procedimento' : ag.tipo || 'Atendimento'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            ag.status === 'agendado' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            ag.status === 'confirmado' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            ag.status === 'em_andamento' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            {ag.status === 'agendado' ? 'Agendado' : ag.status === 'confirmado' ? 'Confirmado' : ag.status === 'em_andamento' ? 'Em andamento' : ag.status}
                          </span>
                          {atrasado && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              Atrasado
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" />
                            <span className={atrasado ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                              {formatHora(ag.hora_inicio)} - {formatHora(ag.hora_fim)}
                            </span>
                          </div>
                          {ag.prestador_nome && (
                            <div className="flex items-center gap-1">
                              <UserIcon className="w-3 h-3" />
                              <span>{ag.prestador_nome}</span>
                            </div>
                          )}
                          {ag.convenio_nome && (
                            <div className="flex items-center gap-1">
                              <BuildingOfficeIcon className="w-3 h-3" />
                              <span>{ag.convenio_nome}</span>
                            </div>
                          )}
                          {ag.sala_nome && (
                            <span className="text-xs text-gray-400">Sala: {ag.sala_nome}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          selecionarAgendamento(ag.id);
                          setShowModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 self-start"
                      >
                        <UserPlusIcon className="w-4 h-4" />
                        Chamar Paciente
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Próximos Agendamentos */}
        {agendamentosFuturos.length > 0 && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Próximos Agendamentos ({agendamentosFuturos.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {agendamentosFuturos.map((ag) => (
                <div key={ag.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-800 dark:text-white">
                          {ag.paciente_nome || 'Paciente não identificado'}
                        </p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                          {ag.tipo === 'consulta' ? 'Consulta' : ag.tipo === 'procedimento' ? 'Procedimento' : ag.tipo || 'Atendimento'}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                          {formatarData(ag.data_agendamento)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          <span>{formatHora(ag.hora_inicio)} - {formatHora(ag.hora_fim)}</span>
                        </div>
                        {ag.prestador_nome && (
                          <div className="flex items-center gap-1">
                            <UserIcon className="w-3 h-3" />
                            <span>{ag.prestador_nome}</span>
                          </div>
                        )}
                        {ag.sala_nome && (
                          <span className="text-xs text-gray-400">Sala: {ag.sala_nome}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        selecionarAgendamento(ag.id);
                        setShowModal(true);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 self-start"
                    >
                      <UserPlusIcon className="w-4 h-4" />
                      Chamar Paciente
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Criação */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={criarChamado} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold dark:text-white">Adicionar Paciente à Fila</h3>
              <button type="button" onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Agendamento (opcional)
                </label>
                <select 
                  value={formData.agendamento_id} 
                  onChange={(e) => selecionarAgendamento(e.target.value)} 
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white"
                >
                  <option value="">Selecionar agendamento</option>
                  {agendamentosHoje.map((agendamento) => (
                    <option key={agendamento.id} value={agendamento.id}>
                      {formatHora(agendamento.hora_inicio)} - {agendamento.paciente_nome || 'Paciente'} (Hoje)
                    </option>
                  ))}
                  {agendamentosFuturos.map((agendamento) => (
                    <option key={agendamento.id} value={agendamento.id}>
                      {formatarData(agendamento.data_agendamento)} {formatHora(agendamento.hora_inicio)} - {agendamento.paciente_nome || 'Paciente'}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome do Paciente *
                  </label>
                  <input 
                    value={formData.paciente_nome} 
                    onChange={(e) => setFormData({ ...formData, paciente_nome: e.target.value })} 
                    placeholder="Nome completo" 
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Senha/Identificador
                  </label>
                  <div className="flex gap-2">
                    <input 
                      value={formData.senha} 
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })} 
                      placeholder="Senha automática" 
                      className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white" 
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, senha: gerarSenhaAleatoria() })}
                      className="px-3 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                      Gerar
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Destino
                  </label>
                  <select 
                    value={formData.destino_tipo} 
                    onChange={(e) => setFormData({ ...formData, destino_tipo: e.target.value })} 
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white"
                  >
                    <option value="consultorio">Consultório médico</option>
                    <option value="procedimento">Sala de procedimento</option>
                    <option value="exame">Sala de exame</option>
                    <option value="recepcao">Recepção</option>
                    <option value="triagem">Triagem</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Destino (Sala/Consultório) *
                  </label>
                  <div className="flex gap-2">
                    <input 
                      value={formData.destino_nome} 
                      onChange={(e) => setFormData({ ...formData, destino_nome: e.target.value })} 
                      placeholder="Ex.: Consultório 2" 
                      className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white" 
                      required 
                    />
                    <select 
                      value={formData.destino_nome} 
                      onChange={(e) => setFormData({ ...formData, destino_nome: e.target.value })} 
                      className="w-40 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-2 text-sm dark:text-white"
                    >
                      <option value="">Sala cadastrada</option>
                      {salas.map((sala) => (
                        <option key={sala.id} value={sala.nome}>{sala.nome}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Origem
                </label>
                <input 
                  value={formData.origem_nome} 
                  onChange={(e) => setFormData({ ...formData, origem_nome: e.target.value })} 
                  placeholder="Recepção, Triagem, etc." 
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Observações Internas
                </label>
                <textarea 
                  value={formData.observacao} 
                  onChange={(e) => setFormData({ ...formData, observacao: e.target.value })} 
                  placeholder="Informações adicionais para a equipe" 
                  rows="3" 
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white" 
                />
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700/50 p-5 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setShowModal(false)} 
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-medium hover:from-blue-600 hover:to-indigo-700 shadow-md"
              >
                <PlusIcon className="w-4 h-4 inline mr-1" />
                Adicionar à Fila
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
