// src/pages/Prontuario.jsx
import { useState, useEffect, useCallback } from 'react';
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
  EyeIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  DocumentDuplicateIcon,
  CloudArrowDownIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { supabase } from '../lib/supabaseClient';

// Componente de Prontuário
export default function Prontuario() {
  const { id } = useParams(); // id do agendamento
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
  const [editingPrescricao, setEditingPrescricao] = useState(null);
  const [editingReceita, setEditingReceita] = useState(null);
  const [editingAtestado, setEditingAtestado] = useState(null);
  const [showProcedimentosModal, setShowProcedimentosModal] = useState(false);
  const [procedimentosSelecionados, setProcedimentosSelecionados] = useState([]);
  const [procedimentos, setProcedimentos] = useState([]);
  const [convenios, setConvenios] = useState([]);
  const [prestadores, setPrestadores] = useState([]);

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

  // Carregar dados
  useEffect(() => {
    carregarDados();
  }, [id]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Carregar agendamento
      const { data: agendamentoData, error: agendamentoError } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('id', id)
        .single();

      if (agendamentoError) throw agendamentoError;
      setAgendamento(agendamentoData);

      // Carregar paciente
      if (agendamentoData.paciente_id) {
        const { data: pacienteData, error: pacienteError } = await supabase
          .from('pacientes')
          .select('*')
          .eq('id', agendamentoData.paciente_id)
          .single();

        if (!pacienteError) setPaciente(pacienteData);
      }

      // Carregar prontuário existente
      const { data: prontuarioData, error: prontuarioError } = await supabase
        .from('prontuario')
        .select('*')
        .eq('agendamento_id', id)
        .maybeSingle();

      if (!prontuarioError && prontuarioData) {
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

        // Carregar prescrições
        const { data: prescricoesData } = await supabase
          .from('prescricoes')
          .select('*')
          .eq('prontuario_id', prontuarioData.id)
          .order('created_at', { ascending: false });
        
        setPrescricoes(prescricoesData || []);

        // Carregar receitas
        const { data: receitasData } = await supabase
          .from('receitas')
          .select('*')
          .eq('prontuario_id', prontuarioData.id)
          .order('created_at', { ascending: false });
        
        setReceitas(receitasData || []);

        // Carregar atestados
        const { data: atestadosData } = await supabase
          .from('atestados')
          .select('*')
          .eq('prontuario_id', prontuarioData.id)
          .order('created_at', { ascending: false });
        
        setAtestados(atestadosData || []);
      }

      // Carregar procedimentos, convênios e prestadores
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

  // Salvar prontuário
  const salvarProntuario = async () => {
    setSaving(true);
    try {
      let prontuarioId = prontuario?.id;

      if (prontuario) {
        // Atualizar
        const { error } = await supabase
          .from('prontuario')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', prontuario.id);

        if (error) throw error;
      } else {
        // Criar novo
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
        prontuarioId = data[0].id;
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

  // Finalizar atendimento
  const finalizarAtendimento = async () => {
    if (!confirm('Deseja finalizar este atendimento? Isso irá gerar uma guia de atendimento.')) return;

    setSaving(true);
    try {
      // Atualizar status do agendamento
      await supabase
        .from('agendamentos')
        .update({ status: 'realizado', updated_at: new Date().toISOString() })
        .eq('id', id);

      // Atualizar status do prontuário
      await supabase
        .from('prontuario')
        .update({ status: 'finalizado', updated_at: new Date().toISOString() })
        .eq('id', prontuario?.id);

      // Criar atendimento na tabela de atendimentos
      const valorTotal = procedimentosSelecionados.reduce((sum, p) => sum + (p.valor_total || 0), 0);
      
      const atendimento = {
        numero_guia_prestador: `GUI${Date.now()}`,
        paciente_id: agendamento.paciente_id,
        paciente_nome: paciente?.nome,
        numero_carteira: paciente?.numero_carteira,
        paciente_convenio_id: paciente?.convenio_id,
        paciente_convenio_nome: convenios.find(c => c.id === paciente?.convenio_id)?.razao_social || 'Sem convênio',
        prestador_id: agendamento.prestador_id,
        prestador_nome: agendamento.prestador_nome,
        data_atendimento: agendamento.data_agendamento,
        status: 'pendente',
        itens: procedimentosSelecionados.map(p => ({
          ...p,
          data_execucao: agendamento.data_agendamento,
          hora_inicial: agendamento.hora_inicio,
          hora_final: agendamento.hora_fim
        })),
        valor_total: valorTotal,
        observacao: formData.conduta,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: atendimentoError } = await supabase
        .from('atendimentos')
        .insert([atendimento]);

      if (atendimentoError) throw atendimentoError;

      toast.success('Atendimento finalizado e guia gerada com sucesso!');
      navigate('/atendimentos');
    } catch (error) {
      console.error('Erro ao finalizar atendimento:', error);
      toast.error('Erro ao finalizar atendimento');
    } finally {
      setSaving(false);
    }
  };

  // Adicionar prescrição
  const adicionarPrescricao = async () => {
    if (!prescricaoForm.descricao) {
      toast.error('Descrição da prescrição é obrigatória');
      return;
    }

    setSaving(true);
    try {
      if (!prontuario) {
        await salvarProntuario();
      }

      const { data, error } = await supabase
        .from('prescricoes')
        .insert({
          prontuario_id: prontuario?.id || (await salvarProntuario()),
          ...prescricaoForm
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

  // Adicionar receita
  const adicionarReceita = async () => {
    if (!receitaForm.medicamentos.some(m => m.nome)) {
      toast.error('Adicione pelo menos um medicamento');
      return;
    }

    setSaving(true);
    try {
      if (!prontuario) {
        await salvarProntuario();
      }

      const numeroReceita = `REC${Date.now()}`;

      const { data, error } = await supabase
        .from('receitas')
        .insert({
          prontuario_id: prontuario?.id || (await salvarProntuario()),
          numero_receita: numeroReceita,
          tipo: receitaForm.tipo,
          medicamentos: receitaForm.medicamentos,
          validade: receitaForm.validade,
          observacoes: receitaForm.observacoes
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

  // Adicionar atestado
  const adicionarAtestado = async () => {
    setSaving(true);
    try {
      if (!prontuario) {
        await salvarProntuario();
      }

      const numeroAtestado = `ATE${Date.now()}`;

      const { data, error } = await supabase
        .from('atestados')
        .insert({
          prontuario_id: prontuario?.id || (await salvarProntuario()),
          numero_atestado: numeroAtestado,
          tipo: atestadoForm.tipo,
          dias_afastamento: atestadoForm.dias_afastamento,
          data_inicio: atestadoForm.data_inicio,
          data_fim: atestadoForm.data_fim,
          cid: atestadoForm.cid,
          recomendacoes: atestadoForm.recomendacoes
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
      <head>
        <title>Receita Médica</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .receita { border: 1px solid #ccc; padding: 20px; margin-bottom: 20px; }
          .medicamento { margin-bottom: 10px; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          @media print {
            button { display: none; }
          }
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
          <p><strong>Convênio:</strong> ${agendamento?.convenio_nome || 'Particular'}</p>
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
        <script>window.onload = function() { window.print(); };</script>
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
      <head>
        <title>Atestado Médico</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .atestado { border: 1px solid #ccc; padding: 20px; margin-bottom: 20px; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          @media print {
            button { display: none; }
          }
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
          portador(a) da carteira de plano de saúde nº ${paciente?.numero_carteira || 'N/A'}, 
          esteve sob meus cuidados médicos e necessita de afastamento por 
          <strong>${atestado.dias_afastamento} dias</strong>, 
          no período de ${new Date(atestado.data_inicio).toLocaleDateString()} a ${new Date(atestado.data_fim).toLocaleDateString()}.</p>
          ${atestado.recomendacoes ? `<p><strong>Recomendações:</strong> ${atestado.recomendacoes}</p>` : ''}
        </div>
        <div class="footer">
          <p>Dr. ${agendamento?.prestador_nome}</p>
          <p>CRM: ${agendamento?.prestador_numero_conselho || '00000'}</p>
        </div>
        <script>window.onload = function() { window.print(); };</script>
      </body>
      </html>
    `);
    printWindow.document.close();
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
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/agendamentos')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-500" />
            </button>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Prontuário Eletrônico
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Atendimento médico e registro clínico
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={salvarProntuario}
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-blue-700 transition-all duration-200"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <CheckIcon className="w-4 h-4" />
              )}
              Salvar
            </button>
            <button
              onClick={finalizarAtendimento}
              disabled={saving}
              className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-green-700 transition-all duration-200"
            >
              Finalizar Atendimento
            </button>
          </div>
        </div>

        {/* Informações do Paciente */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Paciente</p>
                <p className="text-sm font-medium">{paciente?.nome || '---'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Data</p>
                <p className="text-sm font-medium">{agendamento?.data_agendamento}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Horário</p>
                <p className="text-sm font-medium">{agendamento?.hora_inicio} - {agendamento?.hora_fim}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Convênio</p>
                <p className="text-sm font-medium">{agendamento?.convenio_nome || 'Particular'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setAba('clinico')}
                className={`px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  aba === 'clinico'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                <DocumentTextIcon className="w-4 h-4 inline mr-1" />
                Clínico
              </button>
              <button
                onClick={() => setAba('prescricoes')}
                className={`px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  aba === 'prescricoes'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                <BeakerIcon className="w-4 h-4 inline mr-1" />
                Prescrições ({prescricoes.length})
              </button>
              <button
                onClick={() => setAba('receitas')}
                className={`px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  aba === 'receitas'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                <ClipboardDocumentListIcon className="w-4 h-4 inline mr-1" />
                Receitas ({receitas.length})
              </button>
              <button
                onClick={() => setAba('atestados')}
                className={`px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  aba === 'atestados'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                <DocumentDuplicateIcon className="w-4 h-4 inline mr-1" />
                Atestados ({atestados.length})
              </button>
              <button
                onClick={() => setAba('procedimentos')}
                className={`px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  aba === 'procedimentos'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                <ExclamationTriangleIcon className="w-4 h-4 inline mr-1" />
                Procedimentos
              </button>
            </div>
          </div>

          <div className="p-5">
            {/* Aba Clínica */}
            {aba === 'clinico' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Anamnese</label>
                  <textarea
                    rows="3"
                    value={formData.anamnese}
                    onChange={(e) => setFormData({...formData, anamnese: e.target.value})}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="História da doença atual, queixas principais..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Exame Físico</label>
                  <textarea
                    rows="3"
                    value={formData.exame_fisico}
                    onChange={(e) => setFormData({...formData, exame_fisico: e.target.value})}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Sinais vitais, inspeção, palpação..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hipótese Diagnóstica</label>
                    <textarea
                      rows="2"
                      value={formData.hipotese_diagnostica}
                      onChange={(e) => setFormData({...formData, hipotese_diagnostica: e.target.value})}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Possíveis diagnósticos..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Diagnóstico Principal</label>
                    <input
                      type="text"
                      value={formData.diagnostico_principal}
                      onChange={(e) => setFormData({...formData, diagnostico_principal: e.target.value})}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Diagnóstico confirmado"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conduta / Plano Terapêutico</label>
                  <textarea
                    rows="3"
                    value={formData.conduta}
                    onChange={(e) => setFormData({...formData, conduta: e.target.value})}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Orientações, exames solicitados, retorno..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                  <textarea
                    rows="2"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Informações adicionais..."
                  />
                </div>
              </div>
            )}

            {/* Aba Prescrições */}
            {aba === 'prescricoes' && (
              <div>
                <button
                  onClick={() => setShowPrescricaoModal(true)}
                  className="mb-4 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700"
                >
                  <PlusIcon className="w-4 h-4" />
                  Nova Prescrição
                </button>

                <div className="space-y-3">
                  {prescricoes.map((p) => (
                    <div key={p.id} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 mb-2">
                            {p.tipo === 'medicamento' ? '💊 Medicamento' : p.tipo === 'exame' ? '🔬 Exame' : '📋 Procedimento'}
                          </span>
                          <p className="text-sm font-medium mt-1">{p.descricao}</p>
                          {p.dosagem && <p className="text-xs text-gray-500">Dosagem: {p.dosagem}</p>}
                          {p.via_administracao && <p className="text-xs text-gray-500">Via: {p.via_administracao}</p>}
                          {p.frequencia && <p className="text-xs text-gray-500">Frequência: {p.frequencia}</p>}
                          {p.duracao && <p className="text-xs text-gray-500">Duração: {p.duracao}</p>}
                          {p.observacoes && <p className="text-xs text-gray-500 mt-1">Obs: {p.observacoes}</p>}
                        </div>
                        <button
                          onClick={() => {
                            setEditingPrescricao(p);
                            setPrescricaoForm(p);
                            setShowPrescricaoModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {prescricoes.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhuma prescrição adicionada
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Aba Receitas */}
            {aba === 'receitas' && (
              <div>
                <button
                  onClick={() => setShowReceitaModal(true)}
                  className="mb-4 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700"
                >
                  <PlusIcon className="w-4 h-4" />
                  Nova Receita
                </button>

                <div className="space-y-3">
                  {receitas.map((r) => (
                    <div key={r.id} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-medium">Receita #{r.numero_receita}</p>
                          <p className="text-xs text-gray-500">Data: {new Date(r.created_at).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-500">Medicamentos: {r.medicamentos?.length || 0}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => imprimirReceita(r)}
                            className="text-green-600 hover:text-green-800"
                            title="Imprimir"
                          >
                            <PrinterIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingReceita(r);
                              setReceitaForm(r);
                              setShowReceitaModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="Editar"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {receitas.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhuma receita gerada
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Aba Atestados */}
            {aba === 'atestados' && (
              <div>
                <button
                  onClick={() => setShowAtestadoModal(true)}
                  className="mb-4 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700"
                >
                  <PlusIcon className="w-4 h-4" />
                  Novo Atestado
                </button>

                <div className="space-y-3">
                  {atestados.map((a) => (
                    <div key={a.id} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-medium">Atestado #{a.numero_atestado}</p>
                          <p className="text-xs text-gray-500">
                            Afastamento: {a.dias_afastamento} dias ({new Date(a.data_inicio).toLocaleDateString()} - {new Date(a.data_fim).toLocaleDateString()})
                          </p>
                          {a.cid && <p className="text-xs text-gray-500">CID: {a.cid}</p>}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => imprimirAtestado(a)}
                            className="text-green-600 hover:text-green-800"
                            title="Imprimir"
                          >
                            <PrinterIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingAtestado(a);
                              setAtestadoForm(a);
                              setShowAtestadoModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="Editar"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {atestados.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum atestado gerado
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Aba Procedimentos */}
            {aba === 'procedimentos' && (
              <div>
                <button
                  onClick={() => setShowProcedimentosModal(true)}
                  className="mb-4 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700"
                >
                  <PlusIcon className="w-4 h-4" />
                  Adicionar Procedimento
                </button>

                <div className="space-y-3">
                  {procedimentosSelecionados.map((p, idx) => (
                    <div key={idx} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium">{p.nome}</p>
                          <p className="text-xs text-gray-500">Código: {p.codigo_tuss}</p>
                          <p className="text-xs text-gray-500">Valor: R$ {p.valor_sugerido?.toFixed(2)}</p>
                        </div>
                        <button
                          onClick={() => setProcedimentosSelecionados(procedimentosSelecionados.filter((_, i) => i !== idx))}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {procedimentosSelecionados.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum procedimento adicionado
                    </div>
                  )}
                </div>

                {procedimentosSelecionados.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium">Total: R$ {procedimentosSelecionados.reduce((sum, p) => sum + (p.valor_sugerido || 0), 0).toFixed(2)}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Prescrição */}
      {showPrescricaoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">{editingPrescricao ? 'Editar Prescrição' : 'Nova Prescrição'}</h3>
                <button onClick={() => setShowPrescricaoModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select
                  value={prescricaoForm.tipo}
                  onChange={(e) => setPrescricaoForm({...prescricaoForm, tipo: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="medicamento">Medicamento</option>
                  <option value="exame">Exame</option>
                  <option value="procedimento">Procedimento</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrição *</label>
                <textarea
                  rows="3"
                  value={prescricaoForm.descricao}
                  onChange={(e) => setPrescricaoForm({...prescricaoForm, descricao: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Descreva a prescrição..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Dosagem</label>
                  <input
                    type="text"
                    value={prescricaoForm.dosagem}
                    onChange={(e) => setPrescricaoForm({...prescricaoForm, dosagem: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Ex: 500mg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Via Administração</label>
                  <select
                    value={prescricaoForm.via_administracao}
                    onChange={(e) => setPrescricaoForm({...prescricaoForm, via_administracao: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Selecione</option>
                    <option value="oral">Oral</option>
                    <option value="intravenosa">Intravenosa</option>
                    <option value="intramuscular">Intramuscular</option>
                    <option value="topica">Tópica</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Frequência</label>
                  <input
                    type="text"
                    value={prescricaoForm.frequencia}
                    onChange={(e) => setPrescricaoForm({...prescricaoForm, frequencia: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Ex: 8/8h"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Duração</label>
                  <input
                    type="text"
                    value={prescricaoForm.duracao}
                    onChange={(e) => setPrescricaoForm({...prescricaoForm, duracao: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Ex: 7 dias"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Observações</label>
                <textarea
                  rows="2"
                  value={prescricaoForm.observacoes}
                  onChange={(e) => setPrescricaoForm({...prescricaoForm, observacoes: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Informações adicionais..."
                />
              </div>
            </div>
            <div className="p-5 border-t flex justify-end gap-3">
              <button onClick={() => setShowPrescricaoModal(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
              <button onClick={adicionarPrescricao} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Receita */}
      {showReceitaModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-5 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">{editingReceita ? 'Editar Receita' : 'Nova Receita'}</h3>
                <button onClick={() => setShowReceitaModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Receita</label>
                <select
                  value={receitaForm.tipo}
                  onChange={(e) => setReceitaForm({...receitaForm, tipo: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="medicamento">Receita de Medicamento</option>
                  <option value="especial">Receita Especial (Controle Especial)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Medicamentos</label>
                {receitaForm.medicamentos.map((med, idx) => (
                  <div key={idx} className="border rounded-lg p-3 mb-2">
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Medicamento"
                        value={med.nome}
                        onChange={(e) => atualizarMedicamentoReceita(idx, 'nome', e.target.value)}
                        className="border rounded-lg px-2 py-1 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Dosagem"
                        value={med.dosagem}
                        onChange={(e) => atualizarMedicamentoReceita(idx, 'dosagem', e.target.value)}
                        className="border rounded-lg px-2 py-1 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Quantidade"
                        value={med.quantidade}
                        onChange={(e) => atualizarMedicamentoReceita(idx, 'quantidade', e.target.value)}
                        className="border rounded-lg px-2 py-1 text-sm"
                      />
                    </div>
                    {receitaForm.medicamentos.length > 1 && (
                      <button
                        onClick={() => removerMedicamentoReceita(idx)}
                        className="text-red-600 text-xs hover:text-red-800"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={adicionarMedicamentoReceita}
                  className="text-blue-600 text-sm hover:text-blue-800 flex items-center gap-1"
                >
                  <PlusIcon className="w-4 h-4" />
                  Adicionar Medicamento
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Validade da Receita</label>
                <input
                  type="date"
                  value={receitaForm.validade}
                  onChange={(e) => setReceitaForm({...receitaForm, validade: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Observações</label>
                <textarea
                  rows="2"
                  value={receitaForm.observacoes}
                  onChange={(e) => setReceitaForm({...receitaForm, observacoes: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Instruções adicionais..."
                />
              </div>
            </div>
            <div className="p-5 border-t flex justify-end gap-3">
              <button onClick={() => setShowReceitaModal(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
              <button onClick={adicionarReceita} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Gerar Receita</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Atestado */}
      {showAtestadoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-5 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">{editingAtestado ? 'Editar Atestado' : 'Novo Atestado'}</h3>
                <button onClick={() => setShowAtestadoModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Atestado</label>
                <select
                  value={atestadoForm.tipo}
                  onChange={(e) => setAtestadoForm({...atestadoForm, tipo: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="saude">Atestado de Saúde</option>
                  <option value="acompanhamento">Atestado de Acompanhamento</option>
                  <option value="comparecimento">Atestado de Comparecimento</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Dias de Afastamento</label>
                  <input
                    type="number"
                    value={atestadoForm.dias_afastamento}
                    onChange={(e) => {
                      const dias = parseInt(e.target.value);
                      setAtestadoForm({
                        ...atestadoForm,
                        dias_afastamento: dias,
                        data_fim: atestadoForm.data_inicio ? addDays(new Date(atestadoForm.data_inicio), dias - 1).toISOString().split('T')[0] : ''
                      });
                    }}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Ex: 7"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Data Início</label>
                  <input
                    type="date"
                    value={atestadoForm.data_inicio}
                    onChange={(e) => setAtestadoForm({...atestadoForm, data_inicio: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Data Fim</label>
                  <input
                    type="date"
                    value={atestadoForm.data_fim}
                    onChange={(e) => setAtestadoForm({...atestadoForm, data_fim: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CID</label>
                <input
                  type="text"
                  value={atestadoForm.cid}
                  onChange={(e) => setAtestadoForm({...atestadoForm, cid: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Ex: J06.9"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Recomendações</label>
                <textarea
                  rows="3"
                  value={atestadoForm.recomendacoes}
                  onChange={(e) => setAtestadoForm({...atestadoForm, recomendacoes: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Recomendações médicas..."
                />
              </div>
            </div>
            <div className="p-5 border-t flex justify-end gap-3">
              <button onClick={() => setShowAtestadoModal(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
              <button onClick={adicionarAtestado} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Gerar Atestado</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Procedimentos */}
      {showProcedimentosModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="p-5 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Adicionar Procedimentos</h3>
                <button onClick={() => setShowProcedimentosModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-5">
              <div className="mb-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar procedimento..."
                    className="w-full border rounded-lg pl-8 pr-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {procedimentos.map((proc) => (
                  <div key={proc.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{proc.nome}</p>
                      <p className="text-xs text-gray-500">Código: {proc.codigo_tuss} - R$ {proc.valor_sugerido?.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (!procedimentosSelecionados.find(p => p.id === proc.id)) {
                          setProcedimentosSelecionados([...procedimentosSelecionados, proc]);
                        }
                      }}
                      className="p-1 rounded-lg text-green-600 hover:bg-green-50"
                    >
                      <PlusIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-5 border-t flex justify-end gap-3">
              <button onClick={() => setShowProcedimentosModal(false)} className="px-4 py-2 border rounded-lg">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
