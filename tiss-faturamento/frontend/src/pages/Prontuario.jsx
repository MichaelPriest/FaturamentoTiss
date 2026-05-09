// src/pages/Prontuario.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  DocumentTextIcon, 
  BeakerIcon, 
  ClipboardDocumentListIcon,
  PlusIcon,
  TrashIcon,
  PrinterIcon,
  CheckIcon,
  XMarkIcon,
  CalendarIcon,
  ClockIcon, 
  UserIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  DocumentDuplicateIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  CurrencyDollarIcon,
  IdentificationIcon,
  HeartIcon,
  StethoscopeIcon,
  ShieldCheckIcon,
  SparklesIcon,
  MicrophoneIcon,
  ChatBubbleLeftRightIcon,
  LightBulbIcon,
  ClipboardDocumentCheckIcon,
  ListBulletIcon,
  UserGroupIcon,
  ScissorsIcon,
  SyringeIcon,
  PillIcon,
  MicroscopeIcon,
  ActivityIcon,
  BandAidIcon,
  CalendarDaysIcon,
  SearchIcon
} from '@heroicons/react/24/outline';

// Importando ícones adicionais do react-icons
import { 
  FaHospitalUser, 
  FaNotesMedical, 
  FaPrescriptionBottle, 
  FaFilePrescription,
  FaStethoscope,
  FaHeartbeat,
  FaSyringe,
  FaPills,
  FaBandAid,
  FaScalpel,
  FaMicroscope,
  FaClipboardList,
  FaCalendarCheck,
  FaUserMd,
  FaIdCard,
  FaMoneyBillWave,
  FaFileInvoiceDollar,
  FaLock,
  FaKey,
  FaCalendarAlt,
  FaClock,
  FaBuilding,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaBirthdayCake,
  FaVenusMars,
  FaNotesMedical as FaClinicalNotes
} from 'react-icons/fa';

import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { supabase } from '../lib/supabaseClient';

// Constantes com ícones
const CARATER_ATENDIMENTO = [
  { value: '1', label: 'Eletivo', icon: '📅' },
  { value: '2', label: 'Urgência/Emergência', icon: '🚨' }
];

const TIPO_ATENDIMENTO = [
  { value: '01', label: 'Remoção', icon: '🚑' },
  { value: '02', label: 'Pequena Cirurgia', icon: '🔪' },
  { value: '03', label: 'Outras Terapias', icon: '💆' },
  { value: '04', label: 'Consulta', icon: '👨‍⚕️' },
  { value: '08', label: 'Quimioterapia', icon: '💉' },
  { value: '09', label: 'Radioterapia', icon: '⚡' },
  { value: '10', label: 'Terapia Renal Substitutiva (TRS)', icon: '🩸' },
  { value: '13', label: 'Pequenos atendimentos', icon: '🩹' },
  { value: '23', label: 'Exame', icon: '🔬' }
];

const INDICADOR_ACIDENTE = [
  { value: '0', label: 'Trabalho', icon: '🏭' },
  { value: '1', label: 'Trânsito', icon: '🚗' },
  { value: '2', label: 'Outros Acidentes', icon: '⚠️' },
  { value: '9', label: 'Não Acidente', icon: '✅' }
];

const TIPO_CONSULTA = [
  { value: '1', label: 'Primeira Consulta', icon: '🆕' },
  { value: '2', label: 'Seguimento', icon: '🔄' },
  { value: '3', label: 'Pré-Natal', icon: '👶' },
  { value: '4', label: 'Por encaminhamento', icon: '📋' }
];

const MOTIVO_ENCERRAMENTO = [
  { value: '', label: 'Selecione', icon: '❓' },
  { value: '11', label: 'Alta Curado', icon: '🎉' },
  { value: '12', label: 'Alta Melhorado', icon: '👍' },
  { value: '14', label: 'Alta a pedido', icon: '👋' },
  { value: '31', label: 'Transferido', icon: '🚑' },
  { value: '41', label: 'Óbito', icon: '💔' }
];

const COBERTURA_ESPECIAL = [
  { value: '', label: 'Selecione', icon: '❓' },
  { value: '01', label: 'Gestante', icon: '🤰' },
  { value: '02', label: 'Pré-operatório', icon: '🔪' },
  { value: '03', label: 'Pós-operatório', icon: '🩺' }
];

const REGIME_ATENDIMENTO = [
  { value: '01', label: 'Ambulatorial', icon: '🏥' },
  { value: '02', label: 'Domiciliar', icon: '🏠' },
  { value: '03', label: 'Internação', icon: '🛏️' },
  { value: '04', label: 'Pronto Socorro', icon: '🚨' },
  { value: '05', label: 'Telessaúde', icon: '💻' }
];

const SAUDE_OCUPACIONAL = [
  { value: '01', label: 'Admissional', icon: '📝' },
  { value: '02', label: 'Demissional', icon: '📄' },
  { value: '03', label: 'Periódico', icon: '🔄' },
  { value: '04', label: 'Retorno ao trabalho', icon: '↩️' },
  { value: '05', label: 'Mudança de função', icon: '🔄' },
  { value: '06', label: 'Promoção à saúde', icon: '💪' }
];

const SIM_NAO = [
  { value: 'S', label: 'Sim', icon: '✅' },
  { value: 'N', label: 'Não', icon: '❌' }
];

// Sugestões de IA para campos clínicos
const sugestoesIA = {
  anamnese: [
    "Paciente relata início dos sintomas há ___ dias, com evolução ___ (progredindo/estacionária/regredindo).",
    "Negou febre, dispneia, palpitações ou outros sintomas associados.",
    "Histórico patológico pregresso: HAS/DM/Dislipidemia em uso de medicação regular.",
    "Histórico familiar: nega doenças hereditárias.",
    "Hábitos de vida: não tabagista, etilista social, sedentário."
  ],
  hipotese_diagnostica: [
    "Síndrome gripal em investigação",
    "Hipertensão arterial sistêmica descompensada",
    "Diabetes mellitus tipo 2 em descontrole",
    "Infecção do trato urinário",
    "Insuficiência cardíaca congestiva descompensada",
    "Pneumonia adquirida na comunidade",
    "Crise asmática",
    "Doença pulmonar obstrutiva crônica agudizada"
  ],
  conduta: [
    "Solicitado exames laboratoriais: hemograma, bioquímica, PCR.",
    "Encaminhado para avaliação especializada.",
    "Prescrito medicação sintomática e orientado retorno em 7 dias.",
    "Solicitado exames de imagem para elucidação diagnóstica.",
    "Internação para investigação e tratamento."
  ]
};

export default function Prontuario() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agendamento, setAgendamento] = useState(null);
  const [paciente, setPaciente] = useState(null);
  const [prontuario, setProntuario] = useState(null);
  const [prescricoes, setPrescricoes] = useState([]);
  const [receitas, setReceitas] = useState([]);
  const [atestados, setAtestados] = useState([]);
  const [aba, setAba] = useState('clinico');
  const [showPrescricaoModal, setShowPrescricaoModal] = useState(false);
  const [showReceitaModal, setShowReceitaModal] = useState(false);
  const [showAtestadoModal, setShowAtestadoModal] = useState(false);
  const [showProcedimentosModal, setShowProcedimentosModal] = useState(false);
  const [editingPrescricao, setEditingPrescricao] = useState(null);
  const [editingReceita, setEditingReceita] = useState(null);
  const [editingAtestado, setEditingAtestado] = useState(null);
  const [procedimentosSelecionados, setProcedimentosSelecionados] = useState([]);
  const [procedimentos, setProcedimentos] = useState([]);
  const [convenios, setConvenios] = useState([]);
  const [prestadores, setPrestadores] = useState([]);
  const [buscaProcedimento, setBuscaProcedimento] = useState('');
  const [showSugestaoIA, setShowSugestaoIA] = useState(null);
  const [processandoIA, setProcessandoIA] = useState(false);

  const [faturamentoData, setFaturamentoData] = useState({
    numero_guia_operadora: '',
    data_autorizacao: '',
    senha_autorizacao: '',
    data_validade_senha: '',
    codigo_operadora: '',
    nome_contratado: '',
    profissional_solicitante: '',
    conselho_solicitante: '06',
    uf_solicitante: '35',
    numero_conselho_solicitante: '',
    cbos_solicitante: '225125',
    carater_atendimento: '1',
    data_solicitacao: new Date().toISOString().split('T')[0],
    atendimento_rn: 'N',
    indicacao_clinica: '',
    tipo_atendimento: '04',
    indicacao_acidente: '9',
    tipo_consulta: '1',
    motivo_encerramento: '',
    cobertura_especial: '',
    regime_atendimento: '01',
    saude_ocupacional: ''
  });

  const [formData, setFormData] = useState({
    anamnese: '',
    exame_fisico: '',
    hipotese_diagnostica: '',
    diagnostico_principal: '',
    diagnostico_cid: '',
    conduta: '',
    observacoes: '',
    status: 'em_andamento'
  });

  const [prescricaoForm, setPrescricaoForm] = useState({
    tipo: 'medicamento',
    descricao: '',
    dosagem: '',
    via_administracao: '',
    frequencia: '',
    duracao: '',
    observacoes: ''
  });

  const [receitaForm, setReceitaForm] = useState({
    tipo: 'medicamento',
    medicamentos: [{ nome: '', dosagem: '', quantidade: '' }],
    validade: '',
    observacoes: ''
  });

  const [atestadoForm, setAtestadoForm] = useState({
    tipo: 'saude',
    dias_afastamento: '',
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: '',
    cid: '',
    recomendacoes: ''
  });

  useEffect(() => {
    carregarDados();
  }, [id]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const { data: agendamentoData, error: agendamentoError } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('id', id)
        .single();

      if (agendamentoError) throw agendamentoError;
      setAgendamento(agendamentoData);

      if (agendamentoData.paciente_id) {
        const { data: pacienteData } = await supabase
          .from('pacientes')
          .select('*')
          .eq('id', agendamentoData.paciente_id)
          .single();
        if (pacienteData) setPaciente(pacienteData);
        
        if (agendamentoData.prestador_nome) {
          setFaturamentoData(prev => ({
            ...prev,
            profissional_solicitante: agendamentoData.prestador_nome,
            data_solicitacao: agendamentoData.data_agendamento || new Date().toISOString().split('T')[0]
          }));
        }
      }

      const { data: prontuarioData } = await supabase
        .from('prontuario')
        .select('*')
        .eq('agendamento_id', id)
        .maybeSingle();

      if (prontuarioData) {
        setProntuario(prontuarioData);
        setFormData({
          anamnese: prontuarioData.anamnese || '',
          exame_fisico: prontuarioData.exame_fisico || '',
          hipotese_diagnostica: prontuarioData.hipotese_diagnostica || '',
          diagnostico_principal: prontuarioData.diagnostico_principal || '',
          diagnostico_cid: prontuarioData.diagnostico_cid || '',
          conduta: prontuarioData.conduta || '',
          observacoes: prontuarioData.observacoes || '',
          status: prontuarioData.status || 'em_andamento'
        });

        const { data: prescricoesData } = await supabase
          .from('prescricoes')
          .select('*')
          .eq('prontuario_id', prontuarioData.id)
          .order('created_at', { ascending: false });
        setPrescricoes(prescricoesData || []);

        const { data: receitasData } = await supabase
          .from('receitas')
          .select('*')
          .eq('prontuario_id', prontuarioData.id)
          .order('created_at', { ascending: false });
        setReceitas(receitasData || []);

        const { data: atestadosData } = await supabase
          .from('atestados')
          .select('*')
          .eq('prontuario_id', prontuarioData.id)
          .order('created_at', { ascending: false });
        setAtestados(atestadosData || []);
      }

      const [procedimentosRes, conveniosRes, prestadoresRes] = await Promise.all([
        supabase.from('procedimentos').select('*').order('nome'),
        supabase.from('convenios').select('*').order('razao_social'),
        supabase.from('prestadores').select('*').order('nome')
      ]);

      setProcedimentos(procedimentosRes.data || []);
      setConvenios(conveniosRes.data || []);
      setPrestadores(prestadoresRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const aplicarSugestaoIA = (campo, sugestao) => {
    setFormData(prev => ({ ...prev, [campo]: sugestao }));
    setShowSugestaoIA(null);
    toast.success(`Sugestão aplicada em ${campo}!`);
  };

  const gerarSugestaoComIA = async (campo, textoAtual) => {
    setProcessandoIA(true);
    setTimeout(() => {
      let sugestao = '';
      if (campo === 'hipotese_diagnostica') {
        const opcoes = sugestoesIA.hipotese_diagnostica;
        sugestao = opcoes[Math.floor(Math.random() * opcoes.length)];
      } else if (campo === 'conduta') {
        const opcoes = sugestoesIA.conduta;
        sugestao = opcoes[Math.floor(Math.random() * opcoes.length)];
      } else if (campo === 'anamnese') {
        const opcoes = sugestoesIA.anamnese;
        sugestao = opcoes[Math.floor(Math.random() * opcoes.length)];
      }
      setFormData(prev => ({ ...prev, [campo]: sugestao }));
      toast.success(`Sugestão de IA aplicada em ${campo}!`);
      setProcessandoIA(false);
    }, 1000);
  };

  const salvarProntuario = async () => {
    setSaving(true);
    try {
      if (prontuario) {
        const { error } = await supabase
          .from('prontuario')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', prontuario.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('prontuario')
          .insert({
            paciente_id: agendamento.paciente_id,
            agendamento_id: parseInt(id),
            data_atendimento: agendamento.data_agendamento,
            hora_inicio: agendamento.hora_inicio,
            hora_fim: agendamento.hora_fim,
            ...formData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();
        if (error) throw error;
        setProntuario(data[0]);
      }
      toast.success('Prontuário salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar prontuário:', error);
      toast.error('Erro ao salvar prontuário');
    } finally {
      setSaving(false);
    }
  };

  const adicionarPrescricao = async () => {
    if (!prescricaoForm.descricao) {
      toast.error('Descrição da prescrição é obrigatória');
      return;
    }

    setSaving(true);
    try {
      let prontuarioId = prontuario?.id;
      if (!prontuarioId) {
        await salvarProntuario();
        prontuarioId = prontuario?.id;
      }

      const { data, error } = await supabase
        .from('prescricoes')
        .insert({
          prontuario_id: prontuarioId,
          ...prescricaoForm,
          created_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;

      setPrescricoes([data[0], ...prescricoes]);
      setShowPrescricaoModal(false);
      setPrescricaoForm({
        tipo: 'medicamento',
        descricao: '',
        dosagem: '',
        via_administracao: '',
        frequencia: '',
        duracao: '',
        observacoes: ''
      });
      toast.success('Prescrição adicionada com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar prescrição:', error);
      toast.error('Erro ao adicionar prescrição');
    } finally {
      setSaving(false);
    }
  };

  const adicionarReceita = async () => {
    if (!receitaForm.medicamentos.some(m => m.nome)) {
      toast.error('Adicione pelo menos um medicamento');
      return;
    }

    setSaving(true);
    try {
      let prontuarioId = prontuario?.id;
      if (!prontuarioId) {
        await salvarProntuario();
        prontuarioId = prontuario?.id;
      }

      const numeroReceita = `REC${Date.now()}`;

      const { data, error } = await supabase
        .from('receitas')
        .insert({
          prontuario_id: prontuarioId,
          numero_receita: numeroReceita,
          tipo: receitaForm.tipo,
          medicamentos: receitaForm.medicamentos,
          validade: receitaForm.validade,
          observacoes: receitaForm.observacoes,
          created_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;

      setReceitas([data[0], ...receitas]);
      setShowReceitaModal(false);
      setReceitaForm({
        tipo: 'medicamento',
        medicamentos: [{ nome: '', dosagem: '', quantidade: '' }],
        validade: '',
        observacoes: ''
      });
      toast.success('Receita gerada com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar receita:', error);
      toast.error('Erro ao adicionar receita');
    } finally {
      setSaving(false);
    }
  };

  const adicionarAtestado = async () => {
    setSaving(true);
    try {
      let prontuarioId = prontuario?.id;
      if (!prontuarioId) {
        await salvarProntuario();
        prontuarioId = prontuario?.id;
      }

      const numeroAtestado = `ATE${Date.now()}`;
      
      let dataFim = atestadoForm.data_fim;
      if (atestadoForm.dias_afastamento && atestadoForm.data_inicio && !dataFim) {
        dataFim = addDays(new Date(atestadoForm.data_inicio), atestadoForm.dias_afastamento - 1).toISOString().split('T')[0];
      }

      const { data, error } = await supabase
        .from('atestados')
        .insert({
          prontuario_id: prontuarioId,
          numero_atestado: numeroAtestado,
          tipo: atestadoForm.tipo,
          dias_afastamento: atestadoForm.dias_afastamento,
          data_inicio: atestadoForm.data_inicio,
          data_fim: dataFim,
          cid: atestadoForm.cid,
          recomendacoes: atestadoForm.recomendacoes,
          created_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;

      setAtestados([data[0], ...atestados]);
      setShowAtestadoModal(false);
      setAtestadoForm({
        tipo: 'saude',
        dias_afastamento: '',
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: '',
        cid: '',
        recomendacoes: ''
      });
      toast.success('Atestado gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar atestado:', error);
      toast.error('Erro ao adicionar atestado');
    } finally {
      setSaving(false);
    }
  };

  const finalizarAtendimento = async () => {
    if (!confirm('Deseja finalizar este atendimento? Isso irá gerar uma guia de atendimento.')) return;
  
    setSaving(true);
    try {
      await supabase
        .from('agendamentos')
        .update({ status: 'realizado', updated_at: new Date().toISOString() })
        .eq('id', id);
  
      if (prontuario) {
        await supabase
          .from('prontuario')
          .update({ status: 'finalizado', updated_at: new Date().toISOString() })
          .eq('id', prontuario.id);
      }
  
      const convenio = convenios.find(c => c.id === paciente?.convenio_id);
      
      let numeroGuiaPrestador;
      if (convenio && convenio.proximo_numero_guia) {
        numeroGuiaPrestador = convenio.proximo_numero_guia.toString();
        await supabase
          .from('convenios')
          .update({ proximo_numero_guia: convenio.proximo_numero_guia + 1 })
          .eq('id', convenio.id);
      } else {
        numeroGuiaPrestador = String(Date.now());
      }
  
      const valorTotal = procedimentosSelecionados.reduce((sum, p) => sum + (p.valor_sugerido || 0), 0);
      const dataAtual = new Date().toISOString().split('T')[0];
      const agora = new Date().toISOString();
      
      const atendimento = {
        numero_guia_prestador: numeroGuiaPrestador,
        data_atendimento: agendamento?.data_agendamento || dataAtual,
        hora_atendimento: agendamento?.hora_inicio || '00:00:00',
        observacao: formData.conduta || null,
        status: 'pendente',
        numero_guia_operadora: faturamentoData.numero_guia_operadora || null,
        data_autorizacao: faturamentoData.data_autorizacao || null,
        senha_autorizacao: faturamentoData.senha_autorizacao || null,
        data_validade_senha: faturamentoData.data_validade_senha || null,
        valor_total: valorTotal,
        paciente_id: agendamento?.paciente_id,
        paciente_nome: paciente?.nome || '',
        numero_carteira: paciente?.numero_carteira || '',
        paciente_convenio_id: paciente?.convenio_id || null,
        paciente_convenio_nome: convenio?.razao_social || 'Sem convênio',
        prestador_id: agendamento?.prestador_id,
        prestador_nome: agendamento?.prestador_nome,
        itens: procedimentosSelecionados.map(p => ({
          codigo: p.codigo_tuss,
          nome: p.nome,
          quantidade: 1,
          valor_unitario: p.valor_sugerido || 0,
          valor_total: p.valor_sugerido || 0,
          data_execucao: agendamento?.data_agendamento || dataAtual,
          hora_inicial: agendamento?.hora_inicio || '00:00:00',
          hora_final: agendamento?.hora_fim || '00:00:00',
          tabela_referencia: '22',
          prestador_nome: agendamento?.prestador_nome,
          prestador_id: agendamento?.prestador_id,
          prestador_conselho: '06',
          grau_participacao: '12'
        })),
        created_at: agora,
        updated_at: agora,
        codigo_operadora: faturamentoData.codigo_operadora || convenio?.codigo_prestador || null,
        nome_contratado: faturamentoData.nome_contratado || null,
        profissional_solicitante: faturamentoData.profissional_solicitante || agendamento?.prestador_nome || null,
        conselho_solicitante: faturamentoData.conselho_solicitante || '06',
        uf_solicitante: faturamentoData.uf_solicitante || '35',
        numero_conselho_solicitante: faturamentoData.numero_conselho_solicitante || null,
        cbos_solicitante: faturamentoData.cbos_solicitante || '225125',
        carater_atendimento: faturamentoData.carater_atendimento || '1',
        data_solicitacao: faturamentoData.data_solicitacao || agendamento?.data_agendamento || dataAtual,
        atendimento_rn: faturamentoData.atendimento_rn || 'N',
        indicacao_clinica: faturamentoData.indicacao_clinica || formData.conduta || null,
        tipo_atendimento: faturamentoData.tipo_atendimento || '04',
        indicacao_acidente: faturamentoData.indicacao_acidente || '9',
        tipo_consulta: faturamentoData.tipo_consulta || '1',
        motivo_encerramento: faturamentoData.motivo_encerramento || null,
        cobertura_especial: faturamentoData.cobertura_especial || null,
        regime_atendimento: faturamentoData.regime_atendimento || '01',
        saude_ocupacional: faturamentoData.saude_ocupacional || null,
        convenio_registro_ans: convenio?.registro_ans || null,
        convenio_codigo_prestador: convenio?.codigo_prestador || null
      };
  
      Object.keys(atendimento).forEach(key => {
        if (atendimento[key] === undefined) {
          delete atendimento[key];
        }
      });
  
      const { error } = await supabase
        .from('atendimentos')
        .insert([atendimento]);
  
      if (error) throw error;
  
      toast.success('Atendimento finalizado e guia gerada com sucesso!');
      navigate('/atendimentos');
    } catch (error) {
      console.error('Erro ao finalizar atendimento:', error);
      toast.error('Erro ao finalizar atendimento: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  const adicionarMedicamentoReceita = () => {
    setReceitaForm({
      ...receitaForm,
      medicamentos: [...receitaForm.medicamentos, { nome: '', dosagem: '', quantidade: '' }]
    });
  };

  const removerMedicamentoReceita = (index) => {
    setReceitaForm({
      ...receitaForm,
      medicamentos: receitaForm.medicamentos.filter((_, i) => i !== index)
    });
  };

  const atualizarMedicamentoReceita = (index, campo, valor) => {
    const novosMedicamentos = [...receitaForm.medicamentos];
    novosMedicamentos[index][campo] = valor;
    setReceitaForm({ ...receitaForm, medicamentos: novosMedicamentos });
  };

  const imprimirReceita = (receita) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head><title>Receita Médica</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header h1 { color: #1a73e8; }
        .receita { border: 1px solid #ccc; padding: 20px; margin-bottom: 20px; border-radius: 8px; }
        .medicamento { margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .medicamento strong { color: #1a73e8; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ccc; padding-top: 10px; }
        .assinatura { margin-top: 30px; text-align: center; }
        @media print { button { display: none; } }
      </style>
      </head>
      <body>
        <div class="header">
          <h1>🏥 RECEITA MÉDICA</h1>
          <p><strong>Nº:</strong> ${receita.numero_receita}</p>
          <p><strong>Data:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <div class="receita">
          <h3>📋 Dados do Paciente</h3>
          <p><strong>Nome:</strong> ${paciente?.nome}</p>
          <p><strong>Data de Nascimento:</strong> ${paciente?.data_nascimento || '---'}</p>
          <hr>
          <h3>💊 Medicamentos Prescritos:</h3>
          ${receita.medicamentos.map((m, i) => `
            <div class="medicamento">
              <strong>${i+1}. ${m.nome}</strong><br>
              <span>💊 Dosagem: ${m.dosagem}</span><br>
              <span>📦 Quantidade: ${m.quantidade}</span>
            </div>
          `).join('')}
          ${receita.observacoes ? `<p><strong>📝 Observações:</strong> ${receita.observacoes}</p>` : ''}
        </div>
        <div class="footer">
          <p>Dr(a). ${agendamento?.prestador_nome}</p>
          <p>CRM: ${agendamento?.prestador_numero_conselho || '00000'}</p>
          <p>Assinatura: _________________________</p>
        </div>
        <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const imprimirAtestado = (atestado) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head><title>Atestado Médico</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header h1 { color: #1a73e8; }
        .atestado { border: 1px solid #ccc; padding: 20px; margin-bottom: 20px; border-radius: 8px; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ccc; padding-top: 10px; }
        .assinatura { margin-top: 30px; text-align: center; }
        @media print { button { display: none; } }
      </style>
      </head>
      <body>
        <div class="header">
          <h1>🏥 ATESTADO MÉDICO</h1>
          <p><strong>Nº:</strong> ${atestado.numero_atestado}</p>
          <p><strong>Data:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <div class="atestado">
          <p>Atesto para os devidos fins que o(a) paciente <strong>${paciente?.nome}</strong>, 
          esteve sob meus cuidados médicos e necessita de afastamento por 
          <strong>${atestado.dias_afastamento} dias</strong>, 
          no período de ${new Date(atestado.data_inicio).toLocaleDateString()} a ${new Date(atestado.data_fim).toLocaleDateString()}.</p>
          <p><strong>📋 CID:</strong> ${atestado.cid || 'Não informado'}</p>
          ${atestado.recomendacoes ? `<p><strong>💊 Recomendações:</strong> ${atestado.recomendacoes}</p>` : ''}
        </div>
        <div class="footer">
          <p>Dr(a). ${agendamento?.prestador_nome}</p>
          <p>CRM: ${agendamento?.prestador_numero_conselho || '00000'}</p>
          <p>Assinatura: _________________________</p>
        </div>
        <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const procedimentosFiltrados = procedimentos.filter(p => 
    p.nome?.toLowerCase().includes(buscaProcedimento.toLowerCase()) ||
    p.codigo_tuss?.includes(buscaProcedimento)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho com tema hospitalar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/agendamentos')} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200">
              <ArrowLeftIcon className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <FaHeartbeat className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Prontuário Eletrônico
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <FaStethoscope className="w-3 h-3" /> Atendimento médico e registro clínico
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={salvarProntuario} disabled={saving} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200">
              {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <CheckIcon className="w-4 h-4" />}
              💾 Salvar
            </button>
            <button onClick={finalizarAtendimento} disabled={saving} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200">
              ✅ Finalizar Atendimento
            </button>
          </div>
        </div>

        {/* Informações do Paciente - Cartão Hospitalar */}
        <div className="bg-gradient-to-r from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 mb-6 shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <FaHospitalUser className="w-5 h-5 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">📌 Dados do Atendimento</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div><p className="text-xs text-gray-500">Paciente</p><p className="text-sm font-medium">{paciente?.nome || '---'}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <CalendarIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div><p className="text-xs text-gray-500">Data</p><p className="text-sm font-medium">{agendamento?.data_agendamento}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <ClockIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div><p className="text-xs text-gray-500">Horário</p><p className="text-sm font-medium">{agendamento?.hora_inicio} - {agendamento?.hora_fim}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                <BuildingOfficeIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div><p className="text-xs text-gray-500">Convênio</p><p className="text-sm font-medium">{agendamento?.convenio_nome || 'Particular'}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-xl">
                <IdentificationIcon className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
              <div><p className="text-xs text-gray-500">Carteira</p><p className="text-sm font-mono">{paciente?.numero_carteira || '---'}</p></div>
            </div>
          </div>
        </div>

        {/* Tabs com ícones hospitalares */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
          <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex overflow-x-auto">
              {[
                { id: 'clinico', label: 'Clínico', icon: FaStethoscope, count: null },
                { id: 'prescricoes', label: 'Prescrições', icon: FaSyringe, count: prescricoes.length },
                { id: 'receitas', label: 'Receitas', icon: FaPills, count: receitas.length },
                { id: 'atestados', label: 'Atestados', icon: FaBandAid, count: atestados.length },
                { id: 'procedimentos', label: 'Procedimentos', icon: FaScalpel, count: procedimentosSelecionados.length },
                { id: 'faturamento', label: 'Faturamento', icon: FaMoneyBillWave, count: null }
              ].map(tab => (
                <button key={tab.id} onClick={() => setAba(tab.id)} className={`px-5 py-3 text-sm font-medium flex items-center gap-2 transition-all duration-200 ${aba === tab.id ? 'text-blue-600 border-b-2 border-blue-600 bg-white dark:bg-gray-800' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                  <tab.icon className="w-4 h-4" /> {tab.label}
                  {tab.count !== null && tab.count > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">{tab.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Aba Clínica */}
            {aba === 'clinico' && (
              <div className="space-y-5">
                <div className="group relative">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <FaClinicalNotes className="w-4 h-4 text-blue-500" /> Anamnese
                    </label>
                    <button onClick={() => gerarSugestaoComIA('anamnese', formData.anamnese)} className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-lg flex items-center gap-1 hover:shadow-md transition-all">
                      <SparklesIcon className="w-3 h-3" /> IA
                    </button>
                  </div>
                  <textarea rows="4" value={formData.anamnese} onChange={(e) => setFormData({...formData, anamnese: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="História da doença atual, queixas principais, tempo de evolução..." />
                  {showSugestaoIA === 'anamnese' && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border rounded-xl shadow-lg z-10 p-2">
                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><LightBulbIcon className="w-3 h-3" /> Sugestões de IA:</p>
                      {sugestoesIA.anamnese.map((sug, i) => (
                        <button key={i} onClick={() => aplicarSugestaoIA('anamnese', sug)} className="block w-full text-left text-sm p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">{sug}</button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2"><ActivityIcon className="w-4 h-4 text-green-500" /> Exame Físico</label><textarea rows="3" value={formData.exame_fisico} onChange={(e) => setFormData({...formData, exame_fisico: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Sinais vitais, alterações encontradas..." /></div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="group relative">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"><LightBulbIcon className="w-4 h-4 text-yellow-500" /> Hipótese Diagnóstica</label>
                      <button onClick={() => gerarSugestaoComIA('hipotese_diagnostica', formData.hipotese_diagnostica)} className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-lg flex items-center gap-1"><SparklesIcon className="w-3 h-3" /> IA</button>
                    </div>
                    <textarea rows="2" value={formData.hipotese_diagnostica} onChange={(e) => setFormData({...formData, hipotese_diagnostica: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2"><IdentificationIcon className="w-4 h-4 text-red-500" /> Diagnóstico Principal</label><input type="text" value={formData.diagnostico_principal} onChange={(e) => setFormData({...formData, diagnostico_principal: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="CID-10" /></div>
                </div>
                
                <div className="group relative">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"><ClipboardDocumentCheckIcon className="w-4 h-4 text-green-500" /> Conduta</label>
                    <button onClick={() => gerarSugestaoComIA('conduta', formData.conduta)} className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-lg flex items-center gap-1"><SparklesIcon className="w-3 h-3" /> IA</button>
                  </div>
                  <textarea rows="3" value={formData.conduta} onChange={(e) => setFormData({...formData, conduta: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Medicamentos prescritos, orientações, encaminhamentos..." />
                </div>
                
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2"><DocumentTextIcon className="w-4 h-4 text-gray-500" /> Observações</label><textarea rows="2" value={formData.observacoes} onChange={(e) => setFormData({...formData, observacoes: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" /></div>
              </div>
            )}

            {/* Aba Prescrições */}
            {aba === 'prescricoes' && (
              <div>
                <button onClick={() => setShowPrescricaoModal(true)} className="mb-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all"><PlusIcon className="w-4 h-4" /> Nova Prescrição</button>
                <div className="space-y-3">
                  {prescricoes.map(p => (
                    <div key={p.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><FaPrescriptionBottle className="w-5 h-5 text-blue-600" /></div>
                          <div><span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-blue-100 text-blue-700">{p.tipo === 'medicamento' ? '💊' : p.tipo === 'exame' ? '🔬' : '🔪'} {p.tipo}</span><p className="text-sm font-medium mt-1">{p.descricao}</p>{p.dosagem && <p className="text-xs text-gray-500 mt-1">💊 Dosagem: {p.dosagem} | 📅 Frequência: {p.frequencia}</p>}</div>
                        </div>
                        <button onClick={() => { setEditingPrescricao(p); setPrescricaoForm(p); setShowPrescricaoModal(true); }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><PencilIcon className="w-4 h-4 text-blue-600" /></button>
                      </div>
                    </div>
                  ))}
                  {prescricoes.length === 0 && <div className="text-center py-12 text-gray-500 bg-gray-50 dark:bg-gray-700/30 rounded-xl"><FaPrescriptionBottle className="w-12 h-12 mx-auto mb-3 opacity-50" />Nenhuma prescrição</div>}
                </div>
              </div>
            )}

            {/* Aba Receitas */}
            {aba === 'receitas' && (
              <div>
                <button onClick={() => setShowReceitaModal(true)} className="mb-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all"><PlusIcon className="w-4 h-4" /> Nova Receita</button>
                <div className="space-y-3">
                  {receitas.map(r => (
                    <div key={r.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800 hover:shadow-md transition-all">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg"><FaFilePrescription className="w-5 h-5 text-green-600" /></div>
                          <div><p className="text-sm font-medium">📋 Receita #{r.numero_receita}</p><p className="text-xs text-gray-500">📅 {new Date(r.created_at).toLocaleDateString()} | {r.medicamentos.length} medicamentos</p></div>
                        </div>
                        <button onClick={() => imprimirReceita(r)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><PrinterIcon className="w-4 h-4 text-green-600" /></button>
                      </div>
                    </div>
                  ))}
                  {receitas.length === 0 && <div className="text-center py-12 text-gray-500 bg-gray-50 dark:bg-gray-700/30 rounded-xl"><FaFilePrescription className="w-12 h-12 mx-auto mb-3 opacity-50" />Nenhuma receita</div>}
                </div>
              </div>
            )}

            {/* Aba Atestados */}
            {aba === 'atestados' && (
              <div>
                <button onClick={() => setShowAtestadoModal(true)} className="mb-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all"><PlusIcon className="w-4 h-4" /> Novo Atestado</button>
                <div className="space-y-3">
                  {atestados.map(a => (
                    <div key={a.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800 hover:shadow-md transition-all">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg"><FaBandAid className="w-5 h-5 text-yellow-600" /></div>
                          <div><p className="text-sm font-medium">📄 Atestado #{a.numero_atestado}</p><p className="text-xs text-gray-500">📅 {a.dias_afastamento} dias de afastamento</p></div>
                        </div>
                        <button onClick={() => imprimirAtestado(a)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><PrinterIcon className="w-4 h-4 text-green-600" /></button>
                      </div>
                    </div>
                  ))}
                  {atestados.length === 0 && <div className="text-center py-12 text-gray-500 bg-gray-50 dark:bg-gray-700/30 rounded-xl"><FaBandAid className="w-12 h-12 mx-auto mb-3 opacity-50" />Nenhum atestado</div>}
                </div>
              </div>
            )}

            {/* Aba Procedimentos */}
            {aba === 'procedimentos' && (
              <div>
                <button onClick={() => setShowProcedimentosModal(true)} className="mb-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all"><PlusIcon className="w-4 h-4" /> Adicionar Procedimento</button>
                <div className="space-y-3">
                  {procedimentosSelecionados.map((p, idx) => (
                    <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg"><FaScalpel className="w-5 h-5 text-purple-600" /></div>
                          <div><p className="text-sm font-medium">{p.nome}</p><p className="text-xs text-gray-500">💰 R$ {p.valor_sugerido?.toFixed(2)} | Código: {p.codigo_tuss}</p></div>
                        </div>
                        <button onClick={() => setProcedimentosSelecionados(procedimentosSelecionados.filter((_, i) => i !== idx))} className="p-2 rounded-lg hover:bg-red-50"><TrashIcon className="w-4 h-4 text-red-600" /></button>
                      </div>
                    </div>
                  ))}
                  {procedimentosSelecionados.length > 0 && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                      <p className="text-right font-semibold text-gray-800 dark:text-white flex items-center justify-end gap-2"><FaMoneyBillWave className="w-4 h-4" /> Total: R$ {procedimentosSelecionados.reduce((s, p) => s + (p.valor_sugerido || 0), 0).toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Aba Faturamento */}
            {aba === 'faturamento' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                      <FaFileInvoiceDollar className="w-4 h-4" /> Nº Guia Operadora
                    </label>
                    <input type="text" value={faturamentoData.numero_guia_operadora} onChange={e => setFaturamentoData({...faturamentoData, numero_guia_operadora: e.target.value})} className="w-full bg-white dark:bg-gray-700 border rounded-xl px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                      <FaCalendarAlt className="w-4 h-4" /> Data Autorização
                    </label>
                    <input type="date" value={faturamentoData.data_autorizacao} onChange={e => setFaturamentoData({...faturamentoData, data_autorizacao: e.target.value})} className="w-full bg-white dark:bg-gray-700 border rounded-xl px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                      <FaKey className="w-4 h-4" /> Senha
                    </label>
                    <input type="text" value={faturamentoData.senha_autorizacao} onChange={e => setFaturamentoData({...faturamentoData, senha_autorizacao: e.target.value})} className="w-full bg-white dark:bg-gray-700 border rounded-xl px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                      <FaCalendarAlt className="w-4 h-4" /> Validade Senha
                    </label>
                    <input type="date" value={faturamentoData.data_validade_senha} onChange={e => setFaturamentoData({...faturamentoData, data_validade_senha: e.target.value})} className="w-full bg-white dark:bg-gray-700 border rounded-xl px-3 py-2 text-sm" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modais (mantidos do código anterior) */}
        {showPrescricaoModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeIn">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                      <FaSyringe className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                      {editingPrescricao ? '✏️ Editar Prescrição' : '📋 Nova Prescrição'}
                    </h3>
                  </div>
                  <button onClick={() => { setShowPrescricaoModal(false); setEditingPrescricao(null); }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="p-5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <ListBulletIcon className="w-4 h-4 text-blue-500" />
                      Tipo
                    </label>
                    <div className="flex gap-3">
                      {['medicamento', 'exame', 'procedimento'].map(tipo => (
                        <button
                          key={tipo}
                          onClick={() => setPrescricaoForm({...prescricaoForm, tipo})}
                          className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                            prescricaoForm.tipo === tipo
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {tipo === 'medicamento' && <FaPills className="w-4 h-4" />}
                          {tipo === 'exame' && <FaMicroscope className="w-4 h-4" />}
                          {tipo === 'procedimento' && <FaScalpel className="w-4 h-4" />}
                          {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <DocumentTextIcon className="w-4 h-4 text-green-500" />
                      Descrição *
                    </label>
                    <textarea 
                      rows="3" 
                      value={prescricaoForm.descricao} 
                      onChange={e => setPrescricaoForm({...prescricaoForm, descricao: e.target.value})} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" 
                      placeholder={prescricaoForm.tipo === 'medicamento' ? "Ex: Paracetamol 500mg" : prescricaoForm.tipo === 'exame' ? "Ex: Hemograma completo" : "Ex: Curativo simples"}
                    />
                  </div>
                  
                  {prescricaoForm.tipo === 'medicamento' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                            <BeakerIcon className="w-4 h-4 text-purple-500" />
                            Dosagem
                          </label>
                          <input 
                            type="text" 
                            placeholder="Ex: 1 comprimido" 
                            value={prescricaoForm.dosagem} 
                            onChange={e => setPrescricaoForm({...prescricaoForm, dosagem: e.target.value})} 
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                            <ClockIcon className="w-4 h-4 text-yellow-500" />
                            Via Administração
                          </label>
                          <select 
                            value={prescricaoForm.via_administracao} 
                            onChange={e => setPrescricaoForm({...prescricaoForm, via_administracao: e.target.value})} 
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          >
                            <option value="">Selecione</option>
                            <option value="oral">💊 Oral</option>
                            <option value="intravenosa">💉 Intravenosa</option>
                            <option value="intramuscular">🦵 Intramuscular</option>
                            <option value="subcutanea">💪 Subcutânea</option>
                            <option value="topica">🧴 Tópica</option>
                            <option value="inalatoria">💨 Inalatória</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                            <FaCalendarAlt className="w-4 h-4 text-orange-500" />
                            Frequência
                          </label>
                          <input 
                            type="text" 
                            placeholder="Ex: 8/8 horas" 
                            value={prescricaoForm.frequencia} 
                            onChange={e => setPrescricaoForm({...prescricaoForm, frequencia: e.target.value})} 
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                            <FaCalendarDays className="w-4 h-4 text-red-500" />
                            Duração
                          </label>
                          <input 
                            type="text" 
                            placeholder="Ex: 7 dias" 
                            value={prescricaoForm.duracao} 
                            onChange={e => setPrescricaoForm({...prescricaoForm, duracao: e.target.value})} 
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" 
                          />
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <ChatBubbleLeftRightIcon className="w-4 h-4 text-gray-500" />
                      Observações
                    </label>
                    <textarea 
                      rows="2" 
                      value={prescricaoForm.observacoes} 
                      onChange={e => setPrescricaoForm({...prescricaoForm, observacoes: e.target.value})} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" 
                      placeholder="Informações adicionais..."
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button onClick={() => setShowPrescricaoModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={adicionarPrescricao} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" /> {editingPrescricao ? 'Atualizar' : 'Adicionar'} Prescrição
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Receita */}
        {showReceitaModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                      <FaFilePrescription className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                      {editingReceita ? '✏️ Editar Receita' : '📋 Nova Receita'}
                    </h3>
                  </div>
                  <button onClick={() => { setShowReceitaModal(false); setEditingReceita(null); }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="p-5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <DocumentTextIcon className="w-4 h-4 text-blue-500" />
                      Tipo de Receita
                    </label>
                    <div className="flex gap-3">
                      {['medicamento', 'especial'].map(tipo => (
                        <button
                          key={tipo}
                          onClick={() => setReceitaForm({...receitaForm, tipo})}
                          className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                            receitaForm.tipo === tipo
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {tipo === 'medicamento' ? <FaPills className="w-4 h-4" /> : <FaClipboardList className="w-4 h-4" />}
                          {tipo === 'medicamento' ? 'Medicamento' : 'Especial'}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <FaPills className="w-4 h-4 text-green-500" />
                      Medicamentos
                    </label>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {receitaForm.medicamentos.map((med, idx) => (
                        <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-700/30 relative group">
                          <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-1">
                              <input 
                                placeholder="💊 Medicamento" 
                                value={med.nome} 
                                onChange={e => atualizarMedicamentoReceita(idx, 'nome', e.target.value)} 
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" 
                              />
                            </div>
                            <div>
                              <input 
                                placeholder="📊 Dosagem" 
                                value={med.dosagem} 
                                onChange={e => atualizarMedicamentoReceita(idx, 'dosagem', e.target.value)} 
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" 
                              />
                            </div>
                            <div className="flex gap-2">
                              <input 
                                placeholder="📦 Quantidade" 
                                value={med.quantidade} 
                                onChange={e => atualizarMedicamentoReceita(idx, 'quantidade', e.target.value)} 
                                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" 
                              />
                              <button 
                                onClick={() => removerMedicamentoReceita(idx)} 
                                className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={adicionarMedicamentoReceita} 
                      className="mt-3 text-blue-600 dark:text-blue-400 text-sm flex items-center gap-1 hover:underline"
                    >
                      <PlusIcon className="w-4 h-4" /> Adicionar medicamento
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <FaCalendarAlt className="w-4 h-4 text-orange-500" />
                        Data de Validade
                      </label>
                      <input 
                        type="date" 
                        value={receitaForm.validade} 
                        onChange={e => setReceitaForm({...receitaForm, validade: e.target.value})} 
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <ChatBubbleLeftRightIcon className="w-4 h-4 text-gray-500" />
                      Observações
                    </label>
                    <textarea 
                      rows="2" 
                      value={receitaForm.observacoes} 
                      onChange={e => setReceitaForm({...receitaForm, observacoes: e.target.value})} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" 
                      placeholder="Instruções adicionais para o paciente..."
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button onClick={() => setShowReceitaModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={adicionarReceita} className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                    <PrinterIcon className="w-4 h-4" /> Gerar Receita
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Atestado */}
        {showAtestadoModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeIn">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl">
                      <FaBandAid className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                      {editingAtestado ? '✏️ Editar Atestado' : '📋 Novo Atestado'}
                    </h3>
                  </div>
                  <button onClick={() => { setShowAtestadoModal(false); setEditingAtestado(null); }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="p-5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <DocumentTextIcon className="w-4 h-4 text-blue-500" />
                      Tipo de Atestado
                    </label>
                    <div className="flex gap-3">
                      {['saude', 'acompanhamento'].map(tipo => (
                        <button
                          key={tipo}
                          onClick={() => setAtestadoForm({...atestadoForm, tipo})}
                          className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                            atestadoForm.tipo === tipo
                              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {tipo === 'saude' ? <HeartIcon className="w-4 h-4" /> : <UserGroupIcon className="w-4 h-4" />}
                          {tipo === 'saude' ? 'Saúde' : 'Acompanhamento'}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <FaCalendarAlt className="w-4 h-4 text-orange-500" />
                      Dias de Afastamento
                    </label>
                    <input 
                      type="number" 
                      placeholder="Quantidade de dias" 
                      value={atestadoForm.dias_afastamento} 
                      onChange={e => setAtestadoForm({...atestadoForm, dias_afastamento: e.target.value})} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <FaCalendarAlt className="w-4 h-4 text-green-500" />
                        Data Início
                      </label>
                      <input 
                        type="date" 
                        value={atestadoForm.data_inicio} 
                        onChange={e => setAtestadoForm({...atestadoForm, data_inicio: e.target.value})} 
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <FaCalendarDays className="w-4 h-4 text-red-500" />
                        Data Fim
                      </label>
                      <input 
                        type="date" 
                        value={atestadoForm.data_fim} 
                        onChange={e => setAtestadoForm({...atestadoForm, data_fim: e.target.value})} 
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <IdentificationIcon className="w-4 h-4 text-purple-500" />
                      CID (Código Internacional de Doenças)
                    </label>
                    <input 
                      type="text" 
                      placeholder="Ex: J06 - Infecção aguda das vias aéreas superiores" 
                      value={atestadoForm.cid} 
                      onChange={e => setAtestadoForm({...atestadoForm, cid: e.target.value})} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <ChatBubbleLeftRightIcon className="w-4 h-4 text-gray-500" />
                      Recomendações
                    </label>
                    <textarea 
                      rows="3" 
                      placeholder="Recomendações médicas durante o afastamento..." 
                      value={atestadoForm.recomendacoes} 
                      onChange={e => setAtestadoForm({...atestadoForm, recomendacoes: e.target.value})} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" 
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button onClick={() => setShowAtestadoModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={adicionarAtestado} className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                    <PrinterIcon className="w-4 h-4" /> Gerar Atestado
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Procedimentos */}
        {showProcedimentosModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                      <FaScalpel className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                      Adicionar Procedimentos
                    </h3>
                  </div>
                  <button onClick={() => setShowProcedimentosModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="p-5">
                <div className="relative mb-4">
                  <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="🔍 Buscar procedimento por código ou nome..." 
                    value={buscaProcedimento} 
                    onChange={e => setBuscaProcedimento(e.target.value)} 
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl pl-10 pr-3 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" 
                  />
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {procedimentosFiltrados.length > 0 ? (
                    procedimentosFiltrados.map(proc => {
                      const jaAdicionado = procedimentosSelecionados.find(p => p.id === proc.id);
                      return (
                        <div 
                          key={proc.id} 
                          className={`flex justify-between items-center p-3 rounded-xl transition-all duration-200 ${
                            jaAdicionado 
                              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-800 dark:text-white">{proc.nome}</span>
                              {jaAdicionado && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                                  <CheckIcon className="w-3 h-3" /> Adicionado
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              <span className="font-mono">{proc.codigo_tuss}</span> | 
                              <span className="ml-2">💰 R$ {proc.valor_sugerido?.toFixed(2)}</span> |
                              <span className="ml-2">📋 {proc.tabela || 'TUSS'}</span>
                            </p>
                          </div>
                          {!jaAdicionado && (
                            <button 
                              onClick={() => { 
                                setProcedimentosSelecionados([...procedimentosSelecionados, proc]); 
                                toast.success(`${proc.nome} adicionado!`);
                              }} 
                              className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-md transition-all"
                            >
                              <PlusIcon className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <SearchIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      Nenhum procedimento encontrado
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button onClick={() => setShowProcedimentosModal(false)} className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all">
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
