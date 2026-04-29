import { useState, useEffect } from 'react';
import { 
  PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, 
  CheckIcon, XMarkIcon, EyeIcon, DocumentPlusIcon 
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format } from 'date-fns';

// ============================================
// TABELAS PADRÃO TISS 4.03.00
// ============================================

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
  { value: '23', label: 'Exame (englobando exame radiológico)' }
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
  { value: '15', label: 'Alta com previsão de retorno' },
  { value: '16', label: 'Alta por Evasão' },
  { value: '31', label: 'Transferido para outro estabelecimento' },
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
  { value: '', label: 'Selecione' },
  { value: '01', label: 'Admissional' },
  { value: '02', label: 'Demissional' },
  { value: '03', label: 'Periódico' },
  { value: '04', label: 'Retorno ao trabalho' },
  { value: '05', label: 'Mudança de função' },
  { value: '06', label: 'Promoção à saúde' }
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
  { value: '08', label: '08 - Consultor' },
  { value: '09', label: '09 - Perfusionista' },
  { value: '10', label: '10 - Pediatra na sala de parto' },
  { value: '11', label: '11 - Auxiliar SADT' },
  { value: '12', label: '12 - Clínico' },
  { value: '13', label: '13 - Intensivista' }
];

const SIM_NAO = [
  { value: 'S', label: 'Sim' },
  { value: 'N', label: 'Não' }
];

const UNIDADE_MEDIDA = [
  { value: '001', label: 'Ampola' },
  { value: '008', label: 'Comprimido' },
  { value: '009', label: 'Dose' },
  { value: '013', label: 'Frasco' },
  { value: '018', label: 'Grama' },
  { value: '019', label: 'Litro' },
  { value: '022', label: 'Miligrama' },
  { value: '023', label: 'Mililitro' },
  { value: '036', label: 'Unidade' }
];

const TABELA_REFERENCIA = [
  { value: '18', label: '18 - TUSS (Taxas/diárias/gases)' },
  { value: '19', label: '19 - TUSS (Materiais)' },
  { value: '20', label: '20 - TUSS (Medicamentos)' },
  { value: '22', label: '22 - TUSS (Procedimentos)' },
  { value: '00', label: '00 - Tabela Própria da Operadora' }
];

const CODIGO_DESPESA = [
  { value: '01', label: 'Gases medicinais' },
  { value: '02', label: 'Medicamentos' },
  { value: '03', label: 'Materiais' },
  { value: '05', label: 'Diárias' },
  { value: '07', label: 'Taxas e aluguéis' },
  { value: '08', label: 'OPME' }
];

const UF_OPCOES = [
  { value: '11', label: 'RO - Rondônia' },
  { value: '12', label: 'AC - Acre' },
  { value: '13', label: 'AM - Amazonas' },
  { value: '14', label: 'RR - Roraima' },
  { value: '15', label: 'PA - Pará' },
  { value: '16', label: 'AP - Amapá' },
  { value: '17', label: 'TO - Tocantins' },
  { value: '21', label: 'MA - Maranhão' },
  { value: '22', label: 'PI - Piauí' },
  { value: '23', label: 'CE - Ceará' },
  { value: '24', label: 'RN - Rio Grande do Norte' },
  { value: '25', label: 'PB - Paraíba' },
  { value: '26', label: 'PE - Pernambuco' },
  { value: '27', label: 'AL - Alagoas' },
  { value: '28', label: 'SE - Sergipe' },
  { value: '29', label: 'BA - Bahia' },
  { value: '31', label: 'MG - Minas Gerais' },
  { value: '32', label: 'ES - Espírito Santo' },
  { value: '33', label: 'RJ - Rio de Janeiro' },
  { value: '35', label: 'SP - São Paulo' },
  { value: '41', label: 'PR - Paraná' },
  { value: '42', label: 'SC - Santa Catarina' },
  { value: '43', label: 'RS - Rio Grande do Sul' },
  { value: '50', label: 'MS - Mato Grosso do Sul' },
  { value: '51', label: 'MT - Mato Grosso' },
  { value: '52', label: 'GO - Goiás' },
  { value: '53', label: 'DF - Distrito Federal' },
  { value: '98', label: 'EX - Países Estrangeiros' }
];

const CONSELHOS = [
  { value: '01', label: '01 - CRESS (Serviço Social)' },
  { value: '02', label: '02 - COREN (Enfermagem)' },
  { value: '03', label: '03 - CRF (Farmácia)' },
  { value: '04', label: '04 - CRFA (Fonoaudiologia)' },
  { value: '05', label: '05 - CREFITO (Fisioterapia)' },
  { value: '06', label: '06 - CRM (Medicina)' },
  { value: '07', label: '07 - CRN (Nutrição)' },
  { value: '08', label: '08 - CRO (Odontologia)' },
  { value: '09', label: '09 - CRP (Psicologia)' },
  { value: '10', label: '10 - OUT (Outros Conselhos)' },
  { value: '11', label: '11 - CRBio (Biologia)' },
  { value: '12', label: '12 - CRBM (Biomedicina)' },
  { value: '13', label: '13 - CREF (Educação Física)' },
  { value: '14', label: '14 - CRMV (Medicina Veterinária)' },
  { value: '15', label: '15 - CRTR (Técnicos em Radiologia)' }
];

export default function Atendimentos() {
  const [atendimentos, setAtendimentos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [prestadores, setPrestadores] = useState([]);
  const [procedimentos, setProcedimentos] = useState([]);
  const [convenios, setConvenios] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showItensModal, setShowItensModal] = useState(false);
  const [selectedGuia, setSelectedGuia] = useState(null);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroConvenio, setFiltroConvenio] = useState('todos');
  const [aba, setAba] = useState('procedimentos');
  
  const [itensGuia, setItensGuia] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    procedimento_codigo: '',
    procedimento_nome: '',
    quantidade: 1,
    valor_unitario: 0,
    valor_total: 0,
    data_execucao: new Date().toISOString().split('T')[0],
    hora_inicial: '',
    hora_final: '',
    tabela_referencia: '22',
    unidade_medida: '036',
    fator_reducao_acrescimo: 1.00,
    prestador_id: '',
    prestador_nome: '',
    prestador_cpf: '',
    prestador_conselho: '06',
    prestador_numero_conselho: '',
    prestador_uf_conselho: '35',
    prestador_cbos: '225125',
    grau_participacao: '00'
  });

  const [outrasDespesas, setOutrasDespesas] = useState({
    diarias: 0,
    taxas_alugueis: 0,
    materiais: 0,
    medicamentos: 0,
    gases_medicinais: 0,
    opme: 0
  });

  const [formData, setFormData] = useState({
    paciente_id: '',
    observacao: '',
    status: 'pendente',
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
    saude_ocupacional: '',
    paciente_nome: '',
    paciente_carteira: '',
    convenio_id: '',
    convenio_nome: '',
    convenio_registro_ans: '',
    convenio_codigo_prestador: '',
    convenio_proximo_numero_guia: null
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = () => {
    const storedAtendimentos = localStorage.getItem('atendimentos');
    const storedPacientes = localStorage.getItem('pacientes');
    const storedPrestadores = localStorage.getItem('prestadores');
    const storedProcedimentos = localStorage.getItem('procedimentos');
    const storedConvenios = localStorage.getItem('convenios');
    
    if (storedAtendimentos) setAtendimentos(JSON.parse(storedAtendimentos));
    if (storedPacientes) setPacientes(JSON.parse(storedPacientes));
    if (storedPrestadores) setPrestadores(JSON.parse(storedPrestadores));
    if (storedProcedimentos) setProcedimentos(JSON.parse(storedProcedimentos));
    if (storedConvenios) setConvenios(JSON.parse(storedConvenios));
  };

  const salvar = (lista) => {
    localStorage.setItem('atendimentos', JSON.stringify(lista));
    setAtendimentos(lista);
  };

  const atualizarConvenios = () => {
    const storedConvenios = localStorage.getItem('convenios');
    if (storedConvenios) setConvenios(JSON.parse(storedConvenios));
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
        convenio_nome: convenio?.razao_social || 'Sem convênio',
        convenio_registro_ans: convenio?.registro_ans || '',
        convenio_codigo_prestador: convenio?.codigo_prestador || '',
        convenio_proximo_numero_guia: convenio?.proximo_numero_guia || null,
        codigo_operadora: convenio?.codigo_prestador || '',
        nome_contratado: convenio?.nome_fantasia || ''
      });
      if (!paciente.convenio_id) {
        toast.warning('Este paciente não possui convênio associado!');
      }
    }
  };

  const handleAdicionarItem = () => {
    if (!currentItem.procedimento_codigo) {
      toast.error('Selecione um procedimento');
      return;
    }
    if (!currentItem.prestador_id) {
      toast.error('Selecione o profissional que executou este procedimento');
      return;
    }

    const valorTotal = currentItem.quantidade * currentItem.valor_unitario;
    const prestador = prestadores.find(p => p.id === parseInt(currentItem.prestador_id));
    
    const novoItem = {
      ...currentItem,
      prestador_id: prestador?.id,
      prestador_nome: prestador?.nome,
      prestador_cpf: prestador?.cpf || '00000000000',
      prestador_conselho: prestador?.conselho || '06',
      prestador_numero_conselho: prestador?.numero_conselho || '00000',
      prestador_uf_conselho: prestador?.uf_conselho || '35',
      prestador_cbos: prestador?.cbos || '225125',
      grau_participacao: currentItem.grau_participacao || '00',
      valor_total: valorTotal,
      id: Date.now() + Math.random()
    };

    setItensGuia([...itensGuia, novoItem]);
    
    setCurrentItem({
      procedimento_codigo: '',
      procedimento_nome: '',
      quantidade: 1,
      valor_unitario: 0,
      valor_total: 0,
      data_execucao: new Date().toISOString().split('T')[0],
      hora_inicial: '',
      hora_final: '',
      tabela_referencia: '22',
      unidade_medida: '036',
      fator_reducao_acrescimo: 1.00,
      prestador_id: '',
      prestador_nome: '',
      prestador_cpf: '',
      prestador_conselho: '06',
      prestador_numero_conselho: '',
      prestador_uf_conselho: '35',
      prestador_cbos: '225125',
      grau_participacao: '00'
    });
  };

  const removerItem = (itemId) => {
    setItensGuia(itensGuia.filter(item => item.id !== itemId));
  };

  const handleProcedimentoItemChange = (procedimentoCodigo) => {
    const procedimento = procedimentos.find(p => p.codigo_tuss === procedimentoCodigo);
    if (procedimento) {
      setCurrentItem({
        ...currentItem,
        procedimento_codigo: procedimento.codigo_tuss,
        procedimento_nome: procedimento.nome,
        valor_unitario: procedimento.valor_sugerido || 0,
        valor_total: (currentItem.quantidade || 1) * (procedimento.valor_sugerido || 0)
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.paciente_id) {
      toast.error('Selecione um paciente');
      return;
    }
    if (itensGuia.length === 0) {
      toast.error('Adicione pelo menos um procedimento');
      return;
    }

    const conveniosAtualizados = JSON.parse(localStorage.getItem('convenios') || '[]');
    const paciente = pacientes.find(p => p.id === parseInt(formData.paciente_id));
    const convenio = conveniosAtualizados.find(c => c.id === paciente?.convenio_id);
    
    if (!convenio) {
      toast.error('Convênio não encontrado. Verifique se o paciente possui convênio associado.');
      return;
    }
    
    const valorProcedimentos = itensGuia.reduce((sum, item) => sum + item.valor_total, 0);
    const valorTotalGuia = valorProcedimentos + outrasDespesas.diarias + outrasDespesas.taxas_alugueis + 
                           outrasDespesas.materiais + outrasDespesas.medicamentos + 
                           outrasDespesas.gases_medicinais + outrasDespesas.opme;
    
    let numeroGuiaPrestador;
    if (convenio.proximo_numero_guia) {
      numeroGuiaPrestador = convenio.proximo_numero_guia.toString();
      const conveniosAtualizadosComNovoNumero = conveniosAtualizados.map(c => 
        c.id === convenio.id ? { ...c, proximo_numero_guia: c.proximo_numero_guia + 1 } : c
      );
      localStorage.setItem('convenios', JSON.stringify(conveniosAtualizadosComNovoNumero));
      atualizarConvenios();
    } else {
      numeroGuiaPrestador = Date.now().toString();
    }
    
    const novoAtendimento = {
      id: editing ? editing.id : Date.now(),
      numero_guia_prestador: numeroGuiaPrestador,
      observacao: formData.observacao,
      status: formData.status,
      numero_guia_operadora: formData.numero_guia_operadora,
      data_autorizacao: formData.data_autorizacao,
      senha_autorizacao: formData.senha_autorizacao,
      data_validade_senha: formData.data_validade_senha,
      codigo_operadora: formData.codigo_operadora,
      nome_contratado: formData.nome_contratado,
      profissional_solicitante: formData.profissional_solicitante,
      conselho_solicitante: formData.conselho_solicitante,
      uf_solicitante: formData.uf_solicitante,
      numero_conselho_solicitante: formData.numero_conselho_solicitante,
      cbos_solicitante: formData.cbos_solicitante,
      carater_atendimento: formData.carater_atendimento,
      data_solicitacao: formData.data_solicitacao,
      atendimento_rn: formData.atendimento_rn,
      indicacao_clinica: formData.indicacao_clinica,
      tipo_atendimento: formData.tipo_atendimento,
      indicacao_acidente: formData.indicacao_acidente,
      tipo_consulta: formData.tipo_consulta,
      motivo_encerramento: formData.motivo_encerramento,
      cobertura_especial: formData.cobertura_especial,
      regime_atendimento: formData.regime_atendimento,
      saude_ocupacional: formData.saude_ocupacional,
      itens: itensGuia,
      outras_despesas: outrasDespesas,
      valor_procedimentos: valorProcedimentos,
      valor_diarias: outrasDespesas.diarias,
      valor_taxas_alugueis: outrasDespesas.taxas_alugueis,
      valor_materiais: outrasDespesas.materiais,
      valor_medicamentos: outrasDespesas.medicamentos,
      valor_gases_medicinais: outrasDespesas.gases_medicinais,
      valor_opme: outrasDespesas.opme,
      valor_total: valorTotalGuia,
      paciente_id: paciente.id,
      paciente_nome: paciente.nome,
      numero_carteira: paciente.numero_carteira,
      paciente_convenio_id: paciente.convenio_id,
      paciente_convenio_nome: convenio?.razao_social || 'Sem convênio',
      convenio_registro_ans: convenio?.registro_ans,
      convenio_codigo_prestador: convenio?.codigo_prestador,
      created_at: editing ? editing.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (editing) {
      salvar(atendimentos.map(a => a.id === editing.id ? novoAtendimento : a));
      toast.success('Atendimento atualizado com sucesso!');
    } else {
      salvar([...atendimentos, novoAtendimento]);
      toast.success('Atendimento registrado com sucesso!');
    }

    resetModal();
  };

  const resetModal = () => {
    setShowModal(false);
    setEditing(null);
    setItensGuia([]);
    setOutrasDespesas({
      diarias: 0, taxas_alugueis: 0, materiais: 0, medicamentos: 0, gases_medicinais: 0, opme: 0
    });
    setFormData({
      paciente_id: '',
      observacao: '',
      status: 'pendente',
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
      saude_ocupacional: '',
      paciente_nome: '',
      paciente_carteira: '',
      convenio_id: '',
      convenio_nome: '',
      convenio_registro_ans: '',
      convenio_codigo_prestador: '',
      convenio_proximo_numero_guia: null
    });
  };

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja excluir este atendimento?')) {
      salvar(atendimentos.filter(a => a.id !== id));
      toast.success('Atendimento excluído com sucesso!');
    }
  };

  const handleEnviarFaturamento = (id) => {
    salvar(atendimentos.map(a => a.id === id ? { ...a, status: 'faturado' } : a));
    toast.success('Atendimento enviado para faturamento!');
  };

  const handleEdit = (atendimento) => {
    setEditing(atendimento);
    setItensGuia(atendimento.itens || []);
    setOutrasDespesas({
      diarias: atendimento.valor_diarias || 0,
      taxas_alugueis: atendimento.valor_taxas_alugueis || 0,
      materiais: atendimento.valor_materiais || 0,
      medicamentos: atendimento.valor_medicamentos || 0,
      gases_medicinais: atendimento.valor_gases_medicinais || 0,
      opme: atendimento.valor_opme || 0
    });
    setFormData({
      ...atendimento,
      paciente_id: atendimento.paciente_id,
      observacao: atendimento.observacao || '',
      status: atendimento.status,
      numero_guia_operadora: atendimento.numero_guia_operadora || '',
      data_autorizacao: atendimento.data_autorizacao || '',
      senha_autorizacao: atendimento.senha_autorizacao || '',
      data_validade_senha: atendimento.data_validade_senha || '',
      codigo_operadora: atendimento.codigo_operadora || '',
      nome_contratado: atendimento.nome_contratado || '',
      profissional_solicitante: atendimento.profissional_solicitante || '',
      conselho_solicitante: atendimento.conselho_solicitante || '06',
      uf_solicitante: atendimento.uf_solicitante || '35',
      numero_conselho_solicitante: atendimento.numero_conselho_solicitante || '',
      cbos_solicitante: atendimento.cbos_solicitante || '225125',
      carater_atendimento: atendimento.carater_atendimento || '1',
      data_solicitacao: atendimento.data_solicitacao || new Date().toISOString().split('T')[0],
      atendimento_rn: atendimento.atendimento_rn || 'N',
      indicacao_clinica: atendimento.indicacao_clinica || '',
      tipo_atendimento: atendimento.tipo_atendimento || '04',
      indicacao_acidente: atendimento.indicacao_acidente || '9',
      tipo_consulta: atendimento.tipo_consulta || '1',
      motivo_encerramento: atendimento.motivo_encerramento || '',
      cobertura_especial: atendimento.cobertura_especial || '',
      regime_atendimento: atendimento.regime_atendimento || '01',
      saude_ocupacional: atendimento.saude_ocupacional || '',
      paciente_nome: atendimento.paciente_nome,
      paciente_carteira: atendimento.numero_carteira,
      convenio_id: atendimento.paciente_convenio_id,
      convenio_nome: atendimento.paciente_convenio_nome
    });
    setShowModal(true);
  };

  const handleViewItens = (atendimento) => {
    setSelectedGuia(atendimento);
    setShowItensModal(true);
  };

  const atendimentosFiltrados = atendimentos.filter(a => {
    if (filtroStatus !== 'todos' && a.status !== filtroStatus) return false;
    if (filtroConvenio !== 'todos' && a.paciente_convenio_id !== parseInt(filtroConvenio)) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return a.paciente_nome?.toLowerCase().includes(term) ||
             a.numero_carteira?.includes(term) ||
             a.numero_guia_prestador?.includes(term);
    }
    return true;
  });

  const pendentes = atendimentos.filter(a => a.status === 'pendente').length;
  const faturados = atendimentos.filter(a => a.status === 'faturado').length;
  const valorTotalPendente = atendimentos.filter(a => a.status === 'pendente').reduce((sum, a) => sum + (a.valor_total || 0), 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Atendimentos / Guias</h2>
        <button onClick={() => { setEditing(null); resetModal(); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700">
          <PlusIcon className="w-4 h-4" /> Nova Guia
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500">Total de Guias</p>
          <p className="text-2xl font-bold text-gray-800">{atendimentos.length}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500">Pendentes</p>
          <p className="text-2xl font-bold text-yellow-600">{pendentes}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500">Faturados</p>
          <p className="text-2xl font-bold text-green-600">{faturados}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500">Valor Pendente</p>
          <p className="text-2xl font-bold text-blue-600">R$ {valorTotalPendente.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar por paciente, carteira ou guia..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border rounded-lg pl-8 pr-3 py-1.5 text-sm" />
          </div>
          <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm">
            <option value="todos">Todos os status</option>
            <option value="pendente">Pendentes</option>
            <option value="faturado">Faturados</option>
          </select>
          <select value={filtroConvenio} onChange={(e) => setFiltroConvenio(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm">
            <option value="todos">Todos os convênios</option>
            {convenios.map(c => (<option key={c.id} value={c.id}>{c.razao_social}</option>))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs text-gray-500">Data</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500">Nº Guia</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500">Paciente</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500">Carteira</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500">Convênio</th>
                <th className="px-4 py-3 text-center text-xs text-gray-500">Itens</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500">Valor Total</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500">Status</th>
                <th className="px-4 py-3 text-center text-xs text-gray-500 w-32">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {atendimentosFiltrados.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {a.itens && a.itens[0] ? format(new Date(a.itens[0].data_execucao), 'dd/MM/yyyy') : '-'}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-600">{a.numero_guia_prestador}</td>
                  <td className="px-4 py-3 text-xs text-gray-800">{a.paciente_nome}</td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-600">{a.numero_carteira}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${a.paciente_convenio_nome && a.paciente_convenio_nome !== 'Sem convênio' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {a.paciente_convenio_nome || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-center">
                    <button onClick={() => handleViewItens(a)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 mx-auto" title="Ver itens">
                      <DocumentPlusIcon className="w-4 h-4" />
                      <span className="font-bold">{a.itens?.length || 0}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 font-medium">R$ {a.valor_total?.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${a.status === 'faturado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {a.status === 'faturado' ? 'Faturado' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => handleViewItens(a)} className="text-gray-600 hover:text-gray-800 p-1" title="Ver Itens">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      {a.status === 'pendente' && (
                        <button onClick={() => handleEnviarFaturamento(a.id)} className="text-green-600 hover:text-green-800 p-1" title="Faturar">
                          <CheckIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handleEdit(a)} className="text-blue-600 hover:text-blue-800 p-1" title="Editar">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(a.id)} className="text-red-600 hover:text-red-800 p-1" title="Excluir">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {atendimentosFiltrados.length === 0 && (
                <tr><td colSpan="9" className="px-4 py-12 text-center text-gray-500 text-sm">Nenhum atendimento encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Itens da Guia */}
      {showItensModal && selectedGuia && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-5xl max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Itens da Guia</h3>
                <button onClick={() => setShowItensModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div><strong>Guia:</strong> {selectedGuia.numero_guia_prestador}</div>
                <div><strong>Paciente:</strong> {selectedGuia.paciente_nome}</div>
                <div><strong>Carteira:</strong> {selectedGuia.numero_carteira}</div>
                <div><strong>Convênio:</strong> <span className="text-blue-600 font-medium">{selectedGuia.paciente_convenio_nome || '-'}</span></div>
                <div><strong>Guia Operadora:</strong> {selectedGuia.numero_guia_operadora || '-'}</div>
                <div><strong>Data Autorização:</strong> {selectedGuia.data_autorizacao || '-'}</div>
                <div><strong>Senha:</strong> {selectedGuia.senha_autorizacao || '-'}</div>
                <div><strong>Status:</strong> {selectedGuia.status}</div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Seq</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Data</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">H.I</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">H.F</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Código</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Procedimento</th>
                      <th className="px-3 py-2 text-center text-xs text-gray-500">Qtd</th>
                      <th className="px-3 py-2 text-right text-xs text-gray-500">Valor</th>
                      <th className="px-3 py-2 text-center text-xs text-gray-500">Grau</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Profissional</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(selectedGuia.itens || []).map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 text-xs text-center font-medium">{idx + 1}</td>
                        <td className="px-3 py-2 text-xs">{item.data_execucao || '-'}</td>
                        <td className="px-3 py-2 text-xs">{item.hora_inicial || '-'}</td>
                        <td className="px-3 py-2 text-xs">{item.hora_final || '-'}</td>
                        <td className="px-3 py-2 text-xs font-mono">{item.procedimento_codigo}</td>
                        <td className="px-3 py-2 text-xs">{item.procedimento_nome}</td>
                        <td className="px-3 py-2 text-xs text-center">{item.quantidade}</td>
                        <td className="px-3 py-2 text-xs text-right">R$ {item.valor_total?.toFixed(2)}</td>
                        <td className="px-3 py-2 text-xs text-center">
                          <span className="px-1 py-0.5 rounded text-xs bg-gray-100">
                            {item.grau_participacao || '00'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-600">{item.prestador_nome}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="8" className="px-3 py-2 text-right font-semibold">Total da Guia:</td>
                      <td className="px-3 py-2 text-right font-bold text-blue-600">R$ {selectedGuia.valor_total?.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button onClick={() => setShowItensModal(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">{editing ? 'Editar Guia' : 'Nova Guia'}</h3>
                <button onClick={resetModal} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b mb-4 overflow-x-auto">
                <button onClick={() => setAba('paciente')} className={`px-4 py-2 text-sm whitespace-nowrap ${aba === 'paciente' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Paciente</button>
                <button onClick={() => setAba('autorizacao')} className={`px-4 py-2 text-sm whitespace-nowrap ${aba === 'autorizacao' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Autorização</button>
                <button onClick={() => setAba('solicitante')} className={`px-4 py-2 text-sm whitespace-nowrap ${aba === 'solicitante' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Solicitante</button>
                <button onClick={() => setAba('solicitacao')} className={`px-4 py-2 text-sm whitespace-nowrap ${aba === 'solicitacao' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Solicitação</button>
                <button onClick={() => setAba('atendimento')} className={`px-4 py-2 text-sm whitespace-nowrap ${aba === 'atendimento' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Atendimento</button>
                <button onClick={() => setAba('procedimentos')} className={`px-4 py-2 text-sm whitespace-nowrap ${aba === 'procedimentos' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Procedimentos</button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Aba Paciente */}
                {aba === 'paciente' && (
                  <div className="border rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Paciente *</label>
                    <select value={formData.paciente_id} onChange={e => handlePacienteChange(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" required>
                      <option value="">Selecione um paciente</option>
                      {pacientes.map(p => (<option key={p.id} value={p.id}>{p.nome} - {p.numero_carteira}</option>))}
                    </select>
                    {formData.paciente_carteira && (
                      <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-700">
                          <strong>Carteira:</strong> {formData.paciente_carteira} | 
                          <strong> Convênio:</strong> {formData.convenio_nome || 'Não definido'}
                        </p>
                      </div>
                    )}
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                      <textarea rows="2" value={formData.observacao} onChange={e => setFormData({...formData, observacao: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Informações adicionais..." />
                    </div>
                    {editing && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                          <option value="pendente">Pendente</option>
                          <option value="faturado">Faturado</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Aba Autorização */}
                {aba === 'autorizacao' && (
                  <div className="border rounded-lg p-4">
                    <label className="block text-sm font-semibold text-gray-800 mb-3">Dados de Autorização da Operadora</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Número da Guia (Operadora)</label>
                        <input type="text" value={formData.numero_guia_operadora} onChange={e => setFormData({...formData, numero_guia_operadora: e.target.value})} placeholder="Número fornecido pela operadora" className="w-full border rounded-lg px-3 py-2 text-sm font-mono" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Data da Autorização</label>
                        <input type="date" value={formData.data_autorizacao} onChange={e => setFormData({...formData, data_autorizacao: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Data Validade da Senha</label>
                        <input type="date" value={formData.data_validade_senha} onChange={e => setFormData({...formData, data_validade_senha: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Senha de Autorização</label>
                        <input type="text" value={formData.senha_autorizacao} onChange={e => setFormData({...formData, senha_autorizacao: e.target.value})} placeholder="Pode conter letras e números" className="w-full border rounded-lg px-3 py-2 text-sm" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Aba Solicitante */}
                {aba === 'solicitante' && (
                  <div className="border rounded-lg p-4">
                    <label className="block text-sm font-semibold text-gray-800 mb-3">Dados do Solicitante</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Código na Operadora</label>
                        <input type="text" value={formData.codigo_operadora} onChange={e => setFormData({...formData, codigo_operadora: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm font-mono" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Nome do Contratado</label>
                        <input type="text" value={formData.nome_contratado} onChange={e => setFormData({...formData, nome_contratado: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Nome do Profissional Solicitante</label>
                        <input type="text" value={formData.profissional_solicitante} onChange={e => setFormData({...formData, profissional_solicitante: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Conselho Profissional</label>
                        <select value={formData.conselho_solicitante} onChange={e => setFormData({...formData, conselho_solicitante: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                          {CONSELHOS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Número no Conselho</label>
                        <input type="text" value={formData.numero_conselho_solicitante} onChange={e => setFormData({...formData, numero_conselho_solicitante: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">UF do Conselho</label>
                        <select value={formData.uf_solicitante} onChange={e => setFormData({...formData, uf_solicitante: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                          {UF_OPCOES.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">CBOS (Código CBO)</label>
                        <input type="text" value={formData.cbos_solicitante} onChange={e => setFormData({...formData, cbos_solicitante: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm font-mono" placeholder="Ex: 225125 - Médico neurologista" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Aba Solicitação */}
                {aba === 'solicitacao' && (
                  <div className="border rounded-lg p-4">
                    <label className="block text-sm font-semibold text-gray-800 mb-3">Dados da Solicitação</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Caráter do Atendimento *</label>
                        <select value={formData.carater_atendimento} onChange={e => setFormData({...formData, carater_atendimento: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                          {CARATER_ATENDIMENTO.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Data da Solicitação *</label>
                        <input type="date" value={formData.data_solicitacao} onChange={e => setFormData({...formData, data_solicitacao: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" required />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Atendimento a RN</label>
                        <select value={formData.atendimento_rn} onChange={e => setFormData({...formData, atendimento_rn: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                          {SIM_NAO.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Indicação Clínica</label>
                        <textarea rows="3" value={formData.indicacao_clinica} onChange={e => setFormData({...formData, indicacao_clinica: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Descrição da indicação clínica..." />
                      </div>
                    </div>
                  </div>
                )}

                {/* Aba Atendimento */}
                {aba === 'atendimento' && (
                  <div className="border rounded-lg p-4">
                    <label className="block text-sm font-semibold text-gray-800 mb-3">Dados do Atendimento</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Atendimento *</label>
                        <select value={formData.tipo_atendimento} onChange={e => setFormData({...formData, tipo_atendimento: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                          {TIPO_ATENDIMENTO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Indicação de Acidente</label>
                        <select value={formData.indicacao_acidente} onChange={e => setFormData({...formData, indicacao_acidente: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                          {INDICADOR_ACIDENTE.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Consulta</label>
                        <select value={formData.tipo_consulta} onChange={e => setFormData({...formData, tipo_consulta: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                          {TIPO_CONSULTA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Motivo de Encerramento</label>
                        <select value={formData.motivo_encerramento} onChange={e => setFormData({...formData, motivo_encerramento: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                          {MOTIVO_ENCERRAMENTO.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Cobertura Especial</label>
                        <select value={formData.cobertura_especial} onChange={e => setFormData({...formData, cobertura_especial: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                          {COBERTURA_ESPECIAL.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Regime de Atendimento *</label>
                        <select value={formData.regime_atendimento} onChange={e => setFormData({...formData, regime_atendimento: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                          {REGIME_ATENDIMENTO.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Saúde Ocupacional</label>
                        <select value={formData.saude_ocupacional} onChange={e => setFormData({...formData, saude_ocupacional: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                          {SAUDE_OCUPACIONAL.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Aba Procedimentos */}
                {aba === 'procedimentos' && (
                  <div className="border rounded-lg p-4">
                    <label className="block text-sm font-semibold text-gray-800 mb-3">Procedimentos da Guia</label>
                    
                    {itensGuia.length > 0 && (
                      <div className="mb-3 max-h-40 overflow-y-auto border rounded-lg">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-2 py-1 text-left text-xs text-gray-500">Seq</th>
                              <th className="px-2 py-1 text-left text-xs text-gray-500">Data</th>
                              <th className="px-2 py-1 text-left text-xs text-gray-500">H.I</th>
                              <th className="px-2 py-1 text-left text-xs text-gray-500">H.F</th>
                              <th className="px-2 py-1 text-left text-xs text-gray-500">Código</th>
                              <th className="px-2 py-1 text-left text-xs text-gray-500">Procedimento</th>
                              <th className="px-2 py-1 text-center text-xs text-gray-500">Qtd</th>
                              <th className="px-2 py-1 text-right text-xs text-gray-500">Valor</th>
                              <th className="px-2 py-1 text-center text-xs text-gray-500">Grau</th>
                              <th className="px-2 py-1 text-left text-xs text-gray-500">Profissional</th>
                              <th className="px-2 py-1 text-center w-8"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {itensGuia.map((item, idx) => (
                              <tr key={item.id}>
                                <td className="px-2 py-1 text-xs text-center">{idx + 1}</td>
                                <td className="px-2 py-1 text-xs">{item.data_execucao}</td>
                                <td className="px-2 py-1 text-xs">{item.hora_inicial}</td>
                                <td className="px-2 py-1 text-xs">{item.hora_final}</td>
                                <td className="px-2 py-1 text-xs font-mono">{item.procedimento_codigo}</td>
                                <td className="px-2 py-1 text-xs">{item.procedimento_nome}</td>
                                <td className="px-2 py-1 text-xs text-center">{item.quantidade}</td>
                                <td className="px-2 py-1 text-xs text-right">R$ {item.valor_total?.toFixed(2)}</td>
                                <td className="px-2 py-1 text-xs text-center">{item.grau_participacao || '00'}</td>
                                <td className="px-2 py-1 text-xs text-gray-600">{item.prestador_nome}</td>
                                <td className="px-2 py-1 text-center">
                                  <button type="button" onClick={() => removerItem(item.id)} className="text-red-600 hover:text-red-800">
                                    <XMarkIcon className="w-3 h-3" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="border-t pt-3 mt-2">
                      <p className="text-xs font-medium text-gray-700 mb-2">Adicionar novo procedimento:</p>
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                        <div className="md:col-span-2">
                          <label className="block text-xs text-gray-500 mb-1">Data</label>
                          <input type="date" value={currentItem.data_execucao} onChange={e => setCurrentItem({...currentItem, data_execucao: e.target.value})} className="w-full border rounded-lg px-2 py-1.5 text-sm" />
                        </div>
                        <div className="md:col-span-1">
                          <label className="block text-xs text-gray-500 mb-1">H.I</label>
                          <input type="time" value={currentItem.hora_inicial} onChange={e => setCurrentItem({...currentItem, hora_inicial: e.target.value})} className="w-full border rounded-lg px-2 py-1.5 text-sm" />
                        </div>
                        <div className="md:col-span-1">
                          <label className="block text-xs text-gray-500 mb-1">H.F</label>
                          <input type="time" value={currentItem.hora_final} onChange={e => setCurrentItem({...currentItem, hora_final: e.target.value})} className="w-full border rounded-lg px-2 py-1.5 text-sm" />
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-xs text-gray-500 mb-1">Procedimento</label>
                          <select value={currentItem.procedimento_codigo} onChange={e => handleProcedimentoItemChange(e.target.value)} className="w-full border rounded-lg px-2 py-1.5 text-sm">
                            <option value="">Selecione</option>
                            {procedimentos.map(p => (<option key={p.id} value={p.codigo_tuss}>{p.codigo_tuss} - {p.nome}</option>))}
                          </select>
                        </div>
                        <div className="md:col-span-1">
                          <label className="block text-xs text-gray-500 mb-1">Qtd</label>
                          <input type="number" min="1" value={currentItem.quantidade} onChange={e => setCurrentItem({...currentItem, quantidade: parseInt(e.target.value) || 1, valor_total: (parseInt(e.target.value) || 1) * currentItem.valor_unitario})} className="w-full border rounded-lg px-2 py-1.5 text-sm text-center" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-gray-500 mb-1">Valor Unit.</label>
                          <input type="number" step="0.01" value={currentItem.valor_unitario} onChange={e => setCurrentItem({...currentItem, valor_unitario: parseFloat(e.target.value) || 0, valor_total: currentItem.quantidade * (parseFloat(e.target.value) || 0)})} className="w-full border rounded-lg px-2 py-1.5 text-sm text-right" />
                        </div>
                        <div className="md:col-span-1">
                          <label className="block text-xs text-gray-500 mb-1">Tabela</label>
                          <select value={currentItem.tabela_referencia} onChange={e => setCurrentItem({...currentItem, tabela_referencia: e.target.value})} className="w-full border rounded-lg px-2 py-1.5 text-sm">
                            {TABELA_REFERENCIA.map(t => <option key={t.value} value={t.value}>{t.label.substring(0, 15)}</option>)}
                          </select>
                        </div>
                        <div className="md:col-span-1">
                          <label className="block text-xs text-gray-500 mb-1">Grau Part.</label>
                          <select value={currentItem.grau_participacao} onChange={e => setCurrentItem({...currentItem, grau_participacao: e.target.value})} className="w-full border rounded-lg px-2 py-1.5 text-sm">
                            {GRAU_PARTICIPACAO.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-gray-500 mb-1">Profissional</label>
                          <select value={currentItem.prestador_id} onChange={e => {
                            const prestador = prestadores.find(p => p.id === parseInt(e.target.value));
                            setCurrentItem({...currentItem, prestador_id: e.target.value, prestador_nome: prestador?.nome || '', prestador_cpf: prestador?.cpf || '', prestador_conselho: prestador?.conselho || '06', prestador_numero_conselho: prestador?.numero_conselho || '', prestador_uf_conselho: prestador?.uf_conselho || '35', prestador_cbos: prestador?.cbos || '225125'});
                          }} className="w-full border rounded-lg px-2 py-1.5 text-sm">
                            <option value="">Selecione</option>
                            {prestadores.map(p => (<option key={p.id} value={p.id}>{p.nome}</option>))}
                          </select>
                        </div>
                        <div className="md:col-span-1">
                          <button type="button" onClick={handleAdicionarItem} className="w-full bg-green-600 text-white px-2 py-1.5 rounded-lg text-sm hover:bg-green-700">+ Add</button>
                        </div>
                      </div>
                    </div>
                    
                    {itensGuia.length === 0 && <p className="text-xs text-yellow-600 mt-3">⚠️ Adicione pelo menos um procedimento</p>}
                    {itensGuia.length > 0 && <div className="text-right mt-3 pt-2 border-t"><p className="text-sm font-semibold">Subtotal: R$ {itensGuia.reduce((sum, i) => sum + i.valor_total, 0).toFixed(2)}</p></div>}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={resetModal} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">{editing ? 'Atualizar' : 'Salvar'} Guia</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
