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
  IdentificationIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { supabase } from '../lib/supabaseClient';

// Constantes
const CARATER_ATENDIMENTO = [
  { value: '1', label: 'Eletivo' },
  { value: '2', label: 'Urgência/Emergência' }
];

const TIPO_ATENDIMENTO = [
  { value: '01', label: 'Remoção' },
  { value: '02', label: 'Pequena Cirurgia' },
  { value: '03', label: 'Outras Terapias' },
  { value: '04', label: 'Consulta' },
  { value: '08', label: 'Quimioterapia' },
  { value: '09', label: 'Radioterapia' },
  { value: '10', label: 'Terapia Renal Substitutiva (TRS)' },
  { value: '13', label: 'Pequenos atendimentos' },
  { value: '23', label: 'Exame' }
];

const INDICADOR_ACIDENTE = [
  { value: '0', label: 'Trabalho' },
  { value: '1', label: 'Trânsito' },
  { value: '2', label: 'Outros Acidentes' },
  { value: '9', label: 'Não Acidente' }
];

const TIPO_CONSULTA = [
  { value: '1', label: 'Primeira Consulta' },
  { value: '2', label: 'Seguimento' },
  { value: '3', label: 'Pré-Natal' },
  { value: '4', label: 'Por encaminhamento' }
];

const MOTIVO_ENCERRAMENTO = [
  { value: '', label: 'Selecione' },
  { value: '11', label: 'Alta Curado' },
  { value: '12', label: 'Alta Melhorado' },
  { value: '14', label: 'Alta a pedido' },
  { value: '31', label: 'Transferido' },
  { value: '41', label: 'Óbito' }
];

const COBERTURA_ESPECIAL = [
  { value: '', label: 'Selecione' },
  { value: '01', label: 'Gestante' },
  { value: '02', label: 'Pré-operatório' },
  { value: '03', label: 'Pós-operatório' }
];

const REGIME_ATENDIMENTO = [
  { value: '01', label: 'Ambulatorial' },
  { value: '02', label: 'Domiciliar' },
  { value: '03', label: 'Internação' },
  { value: '04', label: 'Pronto Socorro' },
  { value: '05', label: 'Telessaúde' }
];

const SAUDE_OCUPACIONAL = [
  { value: '01', label: 'Admissional' },
  { value: '02', label: 'Demissional' },
  { value: '03', label: 'Periódico' },
  { value: '04', label: 'Retorno ao trabalho' },
  { value: '05', label: 'Mudança de função' },
  { value: '06', label: 'Promoção à saúde' }
];

const SIM_NAO = [
  { value: 'S', label: 'Sim' },
  { value: 'N', label: 'Não' }
];

const GRAU_PARTICIPACAO = [
  { value: '00', label: '00 - Cirurgião' },
  { value: '01', label: '01 - Primeiro Auxiliar' },
  { value: '02', label: '02 - Segundo Auxiliar' },
  { value: '03', label: '03 - Terceiro Auxiliar' },
  { value: '04', label: '04 - Quarto Auxiliar' },
  { value: '05', label: '05 - Instrumentador' },
  { value: '06', label: '06 - Anestesista' },
  { value: '07', label: '07 - Auxiliar de Anestesista' },
  { value: '12', label: '12 - Clínico' },
  { value: '13', label: '13 - Intensivista' }
];

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

  // Dados de faturamento
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
        .header { text-align: center; margin-bottom: 30px; }
        .receita { border: 1px solid #ccc; padding: 20px; margin-bottom: 20px; }
        .medicamento { margin-bottom: 10px; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        @media print { button { display: none; } }
      </style>
      </head>
      <body>
        <div class="header">
          <h2>RECEITA MÉDICA</h2>
          <p>Nº: ${receita.numero_receita}</p>
          <p>Data: ${new Date().toLocaleDateString()}</p>
        </div>
        <div class="receita">
          <h3>Paciente: ${paciente?.nome}</h3>
          <h4>Medicamentos:</h4>
          ${receita.medicamentos.map(m => `
            <div class="medicamento">
              <strong>${m.nome}</strong><br>
              Dosagem: ${m.dosagem}<br>
              Quantidade: ${m.quantidade}
            </div>
          `).join('')}
          ${receita.observacoes ? `<p><strong>Observações:</strong> ${receita.observacoes}</p>` : ''}
        </div>
        <div class="footer">
          <p>Dr. ${agendamento?.prestador_nome}</p>
          <p>CRM: ${agendamento?.prestador_numero_conselho || '00000'}</p>
        </div>
        <script>window.onload = function() { window.print(); window.close(); };</script>
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
        .header { text-align: center; margin-bottom: 30px; }
        .atestado { border: 1px solid #ccc; padding: 20px; margin-bottom: 20px; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        @media print { button { display: none; } }
      </style>
      </head>
      <body>
        <div class="header">
          <h2>ATESTADO MÉDICO</h2>
          <p>Nº: ${atestado.numero_atestado}</p>
          <p>Data: ${new Date().toLocaleDateString()}</p>
        </div>
        <div class="atestado">
          <p>Atesto para os devidos fins que o(a) paciente <strong>${paciente?.nome}</strong>, 
          esteve sob meus cuidados médicos e necessita de afastamento por 
          <strong>${atestado.dias_afastamento} dias</strong>, 
          no período de ${new Date(atestado.data_inicio).toLocaleDateString()} a ${new Date(atestado.data_fim).toLocaleDateString()}.</p>
          ${atestado.recomendacoes ? `<p><strong>Recomendações:</strong> ${atestado.recomendacoes}</p>` : ''}
        </div>
        <div class="footer">
          <p>Dr. ${agendamento?.prestador_nome}</p>
          <p>CRM: ${agendamento?.prestador_numero_conselho || '00000'}</p>
        </div>
        <script>window.onload = function() { window.print(); window.close(); };</script>
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
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/agendamentos')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <ArrowLeftIcon className="w-5 h-5 text-gray-500" />
            </button>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Prontuário Eletrônico
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Atendimento médico e registro clínico</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={salvarProntuario} disabled={saving} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-lg">
              {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <CheckIcon className="w-4 h-4" />}
              Salvar
            </button>
            <button onClick={finalizarAtendimento} disabled={saving} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-lg">
              Finalizar Atendimento
            </button>
          </div>
        </div>

        {/* Informações do Paciente */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-gray-400" />
              <div><p className="text-xs text-gray-500">Paciente</p><p className="text-sm font-medium">{paciente?.nome || '---'}</p></div>
            </div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-gray-400" />
              <div><p className="text-xs text-gray-500">Data</p><p className="text-sm font-medium">{agendamento?.data_agendamento}</p></div>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-gray-400" />
              <div><p className="text-xs text-gray-500">Horário</p><p className="text-sm font-medium">{agendamento?.hora_inicio} - {agendamento?.hora_fim}</p></div>
            </div>
            <div className="flex items-center gap-2">
              <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
              <div><p className="text-xs text-gray-500">Convênio</p><p className="text-sm font-medium">{agendamento?.convenio_nome || 'Particular'}</p></div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex overflow-x-auto">
              {[
                { id: 'clinico', label: 'Clínico', icon: DocumentTextIcon },
                { id: 'prescricoes', label: `Prescrições (${prescricoes.length})`, icon: BeakerIcon },
                { id: 'receitas', label: `Receitas (${receitas.length})`, icon: ClipboardDocumentListIcon },
                { id: 'atestados', label: `Atestados (${atestados.length})`, icon: DocumentDuplicateIcon },
                { id: 'procedimentos', label: 'Procedimentos', icon: ExclamationTriangleIcon },
                { id: 'faturamento', label: 'Faturamento', icon: CurrencyDollarIcon }
              ].map(tab => (
                <button key={tab.id} onClick={() => setAba(tab.id)} className={`px-4 py-3 text-sm font-medium flex items-center gap-1 transition-all duration-200 ${aba === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5">
            {/* Aba Clínica */}
            {aba === 'clinico' && (
              <div className="space-y-4">
                <div><label className="block text-sm font-medium mb-1">Anamnese</label><textarea rows="3" value={formData.anamnese} onChange={(e) => setFormData({...formData, anamnese: e.target.value})} className="w-full bg-white dark:bg-gray-700 border rounded-lg px-3 py-2 text-sm" placeholder="História da doença atual..." /></div>
                <div><label className="block text-sm font-medium mb-1">Exame Físico</label><textarea rows="3" value={formData.exame_fisico} onChange={(e) => setFormData({...formData, exame_fisico: e.target.value})} className="w-full bg-white dark:bg-gray-700 border rounded-lg px-3 py-2 text-sm" placeholder="Sinais vitais..." /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">Hipótese Diagnóstica</label><textarea rows="2" value={formData.hipotese_diagnostica} onChange={(e) => setFormData({...formData, hipotese_diagnostica: e.target.value})} className="w-full bg-white dark:bg-gray-700 border rounded-lg px-3 py-2 text-sm" /></div>
                  <div><label className="block text-sm font-medium mb-1">Diagnóstico Principal</label><input type="text" value={formData.diagnostico_principal} onChange={(e) => setFormData({...formData, diagnostico_principal: e.target.value})} className="w-full bg-white dark:bg-gray-700 border rounded-lg px-3 py-2 text-sm" /></div>
                </div>
                <div><label className="block text-sm font-medium mb-1">Conduta</label><textarea rows="3" value={formData.conduta} onChange={(e) => setFormData({...formData, conduta: e.target.value})} className="w-full bg-white dark:bg-gray-700 border rounded-lg px-3 py-2 text-sm" placeholder="Orientações..." /></div>
                <div><label className="block text-sm font-medium mb-1">Observações</label><textarea rows="2" value={formData.observacoes} onChange={(e) => setFormData({...formData, observacoes: e.target.value})} className="w-full bg-white dark:bg-gray-700 border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            )}

            {/* Aba Prescrições */}
            {aba === 'prescricoes' && (
              <div>
                <button onClick={() => setShowPrescricaoModal(true)} className="mb-4 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2"><PlusIcon className="w-4 h-4" /> Nova Prescrição</button>
                <div className="space-y-3">
                  {prescricoes.map(p => (
                    <div key={p.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50">
                      <div className="flex justify-between">
                        <div><span className="inline-flex px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">{p.tipo}</span><p className="text-sm font-medium mt-1">{p.descricao}</p></div>
                        <button onClick={() => { setEditingPrescricao(p); setPrescricaoForm(p); setShowPrescricaoModal(true); }}><PencilIcon className="w-4 h-4 text-blue-600" /></button>
                      </div>
                    </div>
                  ))}
                  {prescricoes.length === 0 && <div className="text-center py-8 text-gray-500">Nenhuma prescrição</div>}
                </div>
              </div>
            )}

            {/* Aba Receitas */}
            {aba === 'receitas' && (
              <div>
                <button onClick={() => setShowReceitaModal(true)} className="mb-4 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2"><PlusIcon className="w-4 h-4" /> Nova Receita</button>
                <div className="space-y-3">
                  {receitas.map(r => (
                    <div key={r.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50">
                      <div className="flex justify-between items-center">
                        <div><p className="text-sm font-medium">Receita #{r.numero_receita}</p><p className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString()}</p></div>
                        <button onClick={() => imprimirReceita(r)} className="text-green-600"><PrinterIcon className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                  {receitas.length === 0 && <div className="text-center py-8 text-gray-500">Nenhuma receita</div>}
                </div>
              </div>
            )}

            {/* Aba Atestados */}
            {aba === 'atestados' && (
              <div>
                <button onClick={() => setShowAtestadoModal(true)} className="mb-4 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2"><PlusIcon className="w-4 h-4" /> Novo Atestado</button>
                <div className="space-y-3">
                  {atestados.map(a => (
                    <div key={a.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50">
                      <div className="flex justify-between">
                        <div><p className="text-sm font-medium">Atestado #{a.numero_atestado}</p><p className="text-xs text-gray-500">{a.dias_afastamento} dias</p></div>
                        <button onClick={() => imprimirAtestado(a)} className="text-green-600"><PrinterIcon className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                  {atestados.length === 0 && <div className="text-center py-8 text-gray-500">Nenhum atestado</div>}
                </div>
              </div>
            )}

            {/* Aba Procedimentos */}
            {aba === 'procedimentos' && (
              <div>
                <button onClick={() => setShowProcedimentosModal(true)} className="mb-4 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2"><PlusIcon className="w-4 h-4" /> Adicionar</button>
                <div className="space-y-3">
                  {procedimentosSelecionados.map((p, idx) => (
                    <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50">
                      <div className="flex justify-between">
                        <div><p className="text-sm font-medium">{p.nome}</p><p className="text-xs text-gray-500">R$ {p.valor_sugerido?.toFixed(2)}</p></div>
                        <button onClick={() => setProcedimentosSelecionados(procedimentosSelecionados.filter((_, i) => i !== idx))}><TrashIcon className="w-4 h-4 text-red-600" /></button>
                      </div>
                    </div>
                  ))}
                  {procedimentosSelecionados.length > 0 && <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-gray-800 dark:text-white"> Total: R$ {procedimentosSelecionados.reduce((s, p) => s + (p.valor_sugerido || 0), 0).toFixed(2)}</div>}
                </div>
              </div>
            )}

            {/* Aba Faturamento */}
            {aba === 'faturamento' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nº Guia Operadora</label>
                    <input type="text" value={faturamentoData.numero_guia_operadora} onChange={e => setFaturamentoData({...faturamentoData, numero_guia_operadora: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Autorização</label>
                    <input type="date" value={faturamentoData.data_autorizacao} onChange={e => setFaturamentoData({...faturamentoData, data_autorizacao: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha</label>
                    <input type="text" value={faturamentoData.senha_autorizacao} onChange={e => setFaturamentoData({...faturamentoData, senha_autorizacao: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Validade Senha</label>
                    <input type="date" value={faturamentoData.data_validade_senha} onChange={e => setFaturamentoData({...faturamentoData, data_validade_senha: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código Operadora</label>
                    <input type="text" value={faturamentoData.codigo_operadora} onChange={e => setFaturamentoData({...faturamentoData, codigo_operadora: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Contratado</label>
                    <input type="text" value={faturamentoData.nome_contratado} onChange={e => setFaturamentoData({...faturamentoData, nome_contratado: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Profissional Solicitante</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                      <input type="text" value={faturamentoData.profissional_solicitante} onChange={e => setFaturamentoData({...faturamentoData, profissional_solicitante: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conselho</label>
                      <select value={faturamentoData.conselho_solicitante} onChange={e => setFaturamentoData({...faturamentoData, conselho_solicitante: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
                        <option value="06">CRM - Conselho Regional de Medicina</option>
                        <option value="08">CRO - Conselho Regional de Odontologia</option>
                        <option value="03">CRF - Conselho Regional de Farmácia</option>
                        <option value="02">COREN - Conselho de Enfermagem</option>
                        <option value="05">CREFITO - Conselho de Fisioterapia</option>
                        <option value="09">CRP - Conselho de Psicologia</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nº Conselho</label>
                      <input type="text" value={faturamentoData.numero_conselho_solicitante} onChange={e => setFaturamentoData({...faturamentoData, numero_conselho_solicitante: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">UF</label>
                      <select value={faturamentoData.uf_solicitante} onChange={e => setFaturamentoData({...faturamentoData, uf_solicitante: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
                        <option value="35">SP - São Paulo</option>
                        <option value="33">RJ - Rio de Janeiro</option>
                        <option value="31">MG - Minas Gerais</option>
                        <option value="41">PR - Paraná</option>
                        <option value="42">SC - Santa Catarina</option>
                        <option value="43">RS - Rio Grande do Sul</option>
                        <option value="53">DF - Distrito Federal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CBOS</label>
                      <input type="text" value={faturamentoData.cbos_solicitante} onChange={e => setFaturamentoData({...faturamentoData, cbos_solicitante: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" placeholder="225125" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Dados do Atendimento</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Caráter</label>
                      <select value={faturamentoData.carater_atendimento} onChange={e => setFaturamentoData({...faturamentoData, carater_atendimento: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
                        {CARATER_ATENDIMENTO.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Solicitação</label>
                      <input type="date" value={faturamentoData.data_solicitacao} onChange={e => setFaturamentoData({...faturamentoData, data_solicitacao: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Atendimento RN</label>
                      <select value={faturamentoData.atendimento_rn} onChange={e => setFaturamentoData({...faturamentoData, atendimento_rn: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
                        {SIM_NAO.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo Atendimento</label>
                      <select value={faturamentoData.tipo_atendimento} onChange={e => setFaturamentoData({...faturamentoData, tipo_atendimento: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
                        {TIPO_ATENDIMENTO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Indicador Acidente</label>
                      <select value={faturamentoData.indicacao_acidente} onChange={e => setFaturamentoData({...faturamentoData, indicacao_acidente: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
                        {INDICADOR_ACIDENTE.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo Consulta</label>
                      <select value={faturamentoData.tipo_consulta} onChange={e => setFaturamentoData({...faturamentoData, tipo_consulta: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
                        {TIPO_CONSULTA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Regime</label>
                      <select value={faturamentoData.regime_atendimento} onChange={e => setFaturamentoData({...faturamentoData, regime_atendimento: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
                        {REGIME_ATENDIMENTO.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cobertura Especial</label>
                      <select value={faturamentoData.cobertura_especial} onChange={e => setFaturamentoData({...faturamentoData, cobertura_especial: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
                        {COBERTURA_ESPECIAL.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Saúde Ocupacional</label>
                      <select value={faturamentoData.saude_ocupacional} onChange={e => setFaturamentoData({...faturamentoData, saude_ocupacional: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
                        {SAUDE_OCUPACIONAL.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motivo Encerramento</label>
                      <select value={faturamentoData.motivo_encerramento} onChange={e => setFaturamentoData({...faturamentoData, motivo_encerramento: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
                        {MOTIVO_ENCERRAMENTO.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Indicação Clínica</label>
                    <textarea rows="2" value={faturamentoData.indicacao_clinica} onChange={e => setFaturamentoData({...faturamentoData, indicacao_clinica: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" placeholder="Descrição da indicação clínica..." />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modais */}
        {showPrescricaoModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-5">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">{editingPrescricao ? 'Editar' : 'Nova'} Prescrição</h3>
              <div className="space-y-3">
                <select value={prescricaoForm.tipo} onChange={e => setPrescricaoForm({...prescricaoForm, tipo: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white">
                  <option value="medicamento">Medicamento</option>
                  <option value="exame">Exame</option>
                  <option value="procedimento">Procedimento</option>
                </select>
                <textarea rows="3" value={prescricaoForm.descricao} onChange={e => setPrescricaoForm({...prescricaoForm, descricao: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" placeholder="Descrição" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Dosagem" value={prescricaoForm.dosagem} onChange={e => setPrescricaoForm({...prescricaoForm, dosagem: e.target.value})} className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" />
                  <select value={prescricaoForm.via_administracao} onChange={e => setPrescricaoForm({...prescricaoForm, via_administracao: e.target.value})} className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white">
                    <option value="">Via</option>
                    <option value="oral">Oral</option>
                    <option value="intravenosa">IV</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Frequência" value={prescricaoForm.frequencia} onChange={e => setPrescricaoForm({...prescricaoForm, frequencia: e.target.value})} className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" />
                  <input type="text" placeholder="Duração" value={prescricaoForm.duracao} onChange={e => setPrescricaoForm({...prescricaoForm, duracao: e.target.value})} className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-5">
                <button onClick={() => setShowPrescricaoModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300">Cancelar</button>
                <button onClick={adicionarPrescricao} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Salvar</button>
              </div>
            </div>
          </div>
        )}

        {showReceitaModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-5">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">{editingReceita ? 'Editar' : 'Nova'} Receita</h3>
              <div className="space-y-3">
                <select value={receitaForm.tipo} onChange={e => setReceitaForm({...receitaForm, tipo: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white">
                  <option value="medicamento">Medicamento</option>
                  <option value="especial">Especial</option>
                </select>
                {receitaForm.medicamentos.map((med, idx) => (
                  <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50">
                    <div className="grid grid-cols-3 gap-2">
                      <input placeholder="Medicamento" value={med.nome} onChange={e => atualizarMedicamentoReceita(idx, 'nome', e.target.value)} className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 dark:text-white" />
                      <input placeholder="Dosagem" value={med.dosagem} onChange={e => atualizarMedicamentoReceita(idx, 'dosagem', e.target.value)} className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 dark:text-white" />
                      <input placeholder="Quantidade" value={med.quantidade} onChange={e => atualizarMedicamentoReceita(idx, 'quantidade', e.target.value)} className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 dark:text-white" />
                    </div>
                  </div>
                ))}
                <button onClick={adicionarMedicamentoReceita} className="text-blue-600 dark:text-blue-400 text-sm">+ Adicionar</button>
                <input type="date" placeholder="Validade" value={receitaForm.validade} onChange={e => setReceitaForm({...receitaForm, validade: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" />
              </div>
              <div className="flex justify-end gap-3 mt-5">
                <button onClick={() => setShowReceitaModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300">Cancelar</button>
                <button onClick={adicionarReceita} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Gerar</button>
              </div>
            </div>
          </div>
        )}

        {showAtestadoModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-5">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">{editingAtestado ? 'Editar' : 'Novo'} Atestado</h3>
              <div className="space-y-3">
                <select value={atestadoForm.tipo} onChange={e => setAtestadoForm({...atestadoForm, tipo: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white">
                  <option value="saude">Saúde</option>
                  <option value="acompanhamento">Acompanhamento</option>
                </select>
                <input type="number" placeholder="Dias de afastamento" value={atestadoForm.dias_afastamento} onChange={e => setAtestadoForm({...atestadoForm, dias_afastamento: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={atestadoForm.data_inicio} onChange={e => setAtestadoForm({...atestadoForm, data_inicio: e.target.value})} className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" />
                  <input type="date" value={atestadoForm.data_fim} onChange={e => setAtestadoForm({...atestadoForm, data_fim: e.target.value})} className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" />
                </div>
                <input type="text" placeholder="CID" value={atestadoForm.cid} onChange={e => setAtestadoForm({...atestadoForm, cid: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" />
                <textarea rows="2" placeholder="Recomendações" value={atestadoForm.recomendacoes} onChange={e => setAtestadoForm({...atestadoForm, recomendacoes: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" />
              </div>
              <div className="flex justify-end gap-3 mt-5">
                <button onClick={() => setShowAtestadoModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300">Cancelar</button>
                <button onClick={adicionarAtestado} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Gerar</button>
              </div>
            </div>
          </div>
        )}

        {showProcedimentosModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-5">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Adicionar Procedimentos</h3>
              <div className="relative mb-4">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input type="text" placeholder="Buscar..." value={buscaProcedimento} onChange={e => setBuscaProcedimento(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg pl-8 pr-3 py-2 bg-white dark:bg-gray-700 dark:text-white" />
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {procedimentosFiltrados.map(proc => (
                  <div key={proc.id} className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">{proc.nome}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{proc.codigo_tuss} - R$ {proc.valor_sugerido?.toFixed(2)}</p>
                    </div>
                    <button onClick={() => { if (!procedimentosSelecionados.find(p => p.id === proc.id)) { setProcedimentosSelecionados([...procedimentosSelecionados, proc]); toast.success(`${proc.nome} adicionado!`); } }} className="p-1 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20">
                      <PlusIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <button onClick={() => setShowProcedimentosModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300">Fechar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
