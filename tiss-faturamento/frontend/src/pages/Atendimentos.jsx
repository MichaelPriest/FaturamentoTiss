import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, 
  CheckIcon, XMarkIcon, EyeIcon, DocumentPlusIcon,
  CurrencyDollarIcon, BeakerIcon, CubeIcon, 
  TruckIcon, BuildingStorefrontIcon, PackageIcon,
  CalculatorIcon, UserGroupIcon, CalendarIcon,
  BuildingOfficeIcon, IdentificationIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format } from 'date-fns';

// ============================================
// CONSTANTES E TABELAS
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

const SIM_NAO = [
  { value: 'S', label: 'Sim' },
  { value: 'N', label: 'Não' }
];

// Tipos de itens para faturamento
const TIPOS_ITEM = [
  { value: 'procedimento', label: 'Procedimento', icon: BeakerIcon, tabelas: ['22', '00', '98'] },
  { value: 'material', label: 'Material/OPME', icon: CubeIcon, tabelas: ['19'] },
  { value: 'medicamento', label: 'Medicamento', icon: BeakerIcon, tabelas: ['20'] },
  { value: 'diaria', label: 'Diária/Taxa', icon: BuildingStorefrontIcon, tabelas: ['18'] },
  { value: 'pacote', label: 'Pacote', icon: PackageIcon, tabelas: ['98'] },
  { value: 'outros', label: 'Outras Despesas', icon: CurrencyDollarIcon, tabelas: ['00'] }
];

// Tabelas disponíveis
const TABELAS = {
  '22': { nome: 'TUSS - Procedimentos', tipo: 'procedimento' },
  '00': { nome: 'Tabela Própria', tipo: 'procedimento' },
  '98': { nome: 'Pacotes', tipo: 'pacote' },
  '19': { nome: 'TUSS - Materiais/OPME', tipo: 'material' },
  '20': { nome: 'TUSS - Medicamentos', tipo: 'medicamento' },
  '18': { nome: 'TUSS - Diárias e Taxas', tipo: 'diaria' }
};

// Códigos de Despesas
const CODIGO_DESPESA = [
  { value: '01', label: 'Gases medicinais' },
  { value: '02', label: 'Medicamentos' },
  { value: '03', label: 'Materiais' },
  { value: '05', label: 'Diárias' },
  { value: '07', label: 'Taxas e aluguéis' },
  { value: '08', label: 'OPME' }
];

const UF_OPCOES = [
  { value: '35', label: 'SP - São Paulo' },
  { value: '33', label: 'RJ - Rio de Janeiro' },
  { value: '31', label: 'MG - Minas Gerais' },
  { value: '41', label: 'PR - Paraná' },
  { value: '42', label: 'SC - Santa Catarina' },
  { value: '43', label: 'RS - Rio Grande do Sul' },
  { value: '53', label: 'DF - Distrito Federal' },
  { value: '29', label: 'BA - Bahia' },
  { value: '26', label: 'PE - Pernambuco' },
  { value: '23', label: 'CE - Ceará' }
];

const CONSELHOS = [
  { value: '06', label: '06 - CRM (Medicina)' },
  { value: '08', label: '08 - CRO (Odontologia)' },
  { value: '03', label: '03 - CRF (Farmácia)' },
  { value: '02', label: '02 - COREN (Enfermagem)' },
  { value: '05', label: '05 - CREFITO (Fisioterapia)' },
  { value: '09', label: '09 - CRP (Psicologia)' },
  { value: '07', label: '07 - CRN (Nutrição)' }
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
  const [searchItemTerm, setSearchItemTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroConvenio, setFiltroConvenio] = useState('todos');
  const [aba, setAba] = useState('paciente');
  const [tipoItem, setTipoItem] = useState('procedimento');
  const [tabelaSelecionada, setTabelaSelecionada] = useState('22');
  const [buscandoProfissional, setBuscandoProfissional] = useState(false);
  const [buscaProfissional, setBuscaProfissional] = useState('');
  
  // Itens da guia
  const [itensGuia, setItensGuia] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    tipo: 'procedimento',
    codigo: '',
    nome: '',
    quantidade: 1,
    valor_unitario: 0,
    valor_total: 0,
    data_execucao: new Date().toISOString().split('T')[0],
    hora_inicial: '',
    hora_final: '',
    tabela_referencia: '22',
    codigo_despesa: '',
    prestador_id: '',
    prestador_nome: '',
    prestador_cpf: '',
    prestador_conselho: '06',
    prestador_numero_conselho: '',
    prestador_uf_conselho: '35',
    prestador_cbos: '225125',
    grau_participacao: '12',
    unidade_medida: '036'
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

  // Buscar profissional por número do conselho
  const buscarProfissionalPorConselho = useCallback(async (numeroConselho) => {
    if (!numeroConselho || numeroConselho.length < 3) return;
    
    setBuscandoProfissional(true);
    // Simular busca - em produção, fazer requisição ao backend
    setTimeout(() => {
      const encontrado = prestadores.find(p => 
        p.numero_conselho === numeroConselho || 
        p.numero_conselho?.includes(numeroConselho)
      );
      
      if (encontrado) {
        setFormData(prev => ({
          ...prev,
          profissional_solicitante: encontrado.nome,
          conselho_solicitante: encontrado.codigo_conselho_ans || '06',
          numero_conselho_solicitante: encontrado.numero_conselho,
          uf_solicitante: encontrado.uf_conselho || '35',
          cbos_solicitante: encontrado.cbos || '225125'
        }));
        toast.success(`Profissional ${encontrado.nome} encontrado!`);
      }
      setBuscandoProfissional(false);
    }, 300);
  }, [prestadores]);

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

  // Filtrar itens por busca (código ou descrição)
  const itensFiltrados = useMemo(() => {
    if (!searchItemTerm) return procedimentos;
    
    const term = searchItemTerm.toLowerCase();
    return procedimentos.filter(p => 
      p.codigo_tuss?.toLowerCase().includes(term) ||
      p.nome?.toLowerCase().includes(term)
    );
  }, [procedimentos, searchItemTerm]);

  // Calcular valor baseado no tipo de tabela
  const calcularValor = (item, convenio) => {
    let valorBase = item.valor_sugerido || 0;
    const multiplicador = convenio?.multiplicador || 1;
    
    // Se for CBHPM, calcular por CH (Custo Hospitalar)
    if (item.tabela === 'CBHPM' && item.ch_base) {
      const ch = item.ch_base;
      const valorCH = convenio?.valor_ch || 100;
      valorBase = ch * valorCH;
    }
    
    // Se for AMB, calcular por CH/HM/SADT
    if (item.tabela === 'AMB') {
      // Regras específicas da AMB
      if (item.tipo === 'CONSULTA') {
        valorBase = item.ch_consulta || valorBase;
      } else if (item.tipo === 'EXAME') {
        valorBase = item.ch_exame || valorBase;
      }
    }
    
    return valorBase * multiplicador;
  };

  const handleAdicionarItem = () => {
    if (!currentItem.codigo) {
      toast.error('Selecione um item');
      return;
    }
    
    if (currentItem.tipo === 'procedimento' && !currentItem.prestador_id) {
      toast.error('Selecione o profissional que executou este procedimento');
      return;
    }

    const itemSelecionado = procedimentos.find(p => p.codigo_tuss === currentItem.codigo);
    const convenio = convenios.find(c => c.id === formData.convenio_id);
    
    let valorUnitario = currentItem.valor_unitario;
    if (!valorUnitario && itemSelecionado) {
      valorUnitario = calcularValor(itemSelecionado, convenio);
    }
    
    const valorTotal = currentItem.quantidade * valorUnitario;
    const prestador = prestadores.find(p => p.id === parseInt(currentItem.prestador_id));
    
    const novoItem = {
      ...currentItem,
      nome: currentItem.nome || itemSelecionado?.nome,
      valor_unitario: valorUnitario,
      valor_total: valorTotal,
      prestador_id: prestador?.id,
      prestador_nome: prestador?.nome,
      prestador_cpf: prestador?.cpf || '00000000000',
      prestador_conselho: prestador?.codigo_conselho_ans || '06',
      prestador_numero_conselho: prestador?.numero_conselho || '00000',
      prestador_uf_conselho: prestador?.uf_conselho || '35',
      prestador_cbos: prestador?.cbos || '225125',
      id: Date.now() + Math.random()
    };

    setItensGuia([...itensGuia, novoItem]);
    
    setCurrentItem({
      tipo: 'procedimento',
      codigo: '',
      nome: '',
      quantidade: 1,
      valor_unitario: 0,
      valor_total: 0,
      data_execucao: new Date().toISOString().split('T')[0],
      hora_inicial: '',
      hora_final: '',
      tabela_referencia: '22',
      codigo_despesa: '',
      prestador_id: '',
      prestador_nome: '',
      prestador_cpf: '',
      prestador_conselho: '06',
      prestador_numero_conselho: '',
      prestador_uf_conselho: '35',
      prestador_cbos: '225125',
      grau_participacao: '12',
      unidade_medida: '036'
    });
    setSearchItemTerm('');
  };

  const removerItem = (itemId) => {
    setItensGuia(itensGuia.filter(item => item.id !== itemId));
  };

  const handleProcedimentoItemChange = (codigo) => {
    const procedimento = procedimentos.find(p => p.codigo_tuss === codigo);
    if (procedimento) {
      const convenio = convenios.find(c => c.id === formData.convenio_id);
      const valorCalculado = calcularValor(procedimento, convenio);
      
      setCurrentItem({
        ...currentItem,
        codigo: procedimento.codigo_tuss,
        nome: procedimento.nome,
        valor_unitario: valorCalculado,
        valor_total: (currentItem.quantidade || 1) * valorCalculado,
        tabela_referencia: procedimento.tabela === 'CBHPM' ? '98' : 
                          procedimento.tabela === 'AMB' ? '90' : '22'
      });
      setSearchItemTerm('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.paciente_id) {
      toast.error('Selecione um paciente');
      return;
    }
    if (itensGuia.length === 0) {
      toast.error('Adicione pelo menos um item à guia');
      return;
    }

    const conveniosAtualizados = JSON.parse(localStorage.getItem('convenios') || '[]');
    const paciente = pacientes.find(p => p.id === parseInt(formData.paciente_id));
    const convenio = conveniosAtualizados.find(c => c.id === paciente?.convenio_id);
    
    if (!convenio) {
      toast.error('Convênio não encontrado. Verifique se o paciente possui convênio associado.');
      return;
    }
    
    const valorTotalGuia = itensGuia.reduce((sum, item) => sum + item.valor_total, 0);
    
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
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Atendimentos / Guias
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Registro de atendimentos e criação de guias TISS
          </p>
        </div>
        <button 
          onClick={() => { setEditing(null); resetModal(); setShowModal(true); }} 
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg"
        >
          <PlusIcon className="w-4 h-4" /> Nova Guia
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total de Guias</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{atendimentos.length}</p>
            </div>
            <DocumentPlusIcon className="w-8 h-8 text-blue-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendentes}</p>
            </div>
            <ClockIcon className="w-8 h-8 text-yellow-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Faturados</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{faturados}</p>
            </div>
            <CheckIcon className="w-8 h-8 text-green-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Valor Pendente</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">R$ {valorTotalPendente.toFixed(2)}</p>
            </div>
            <CurrencyDollarIcon className="w-8 h-8 text-blue-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar por paciente, carteira ou guia..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full border-0 bg-transparent rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
            />
          </div>
          <select 
            value={filtroStatus} 
            onChange={(e) => setFiltroStatus(e.target.value)} 
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="todos">Todos os status</option>
            <option value="pendente">Pendentes</option>
            <option value="faturado">Faturados</option>
          </select>
          <select 
            value={filtroConvenio} 
            onChange={(e) => setFiltroConvenio(e.target.value)} 
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="todos">Todos os convênios</option>
            {convenios.map(c => (<option key={c.id} value={c.id}>{c.razao_social}</option>))}
          </select>
        </div>
      </div>

      {/* Tabela de Guias - Versão Corrigida */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nº Guia</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Paciente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Carteira</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Convênio</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Itens</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {atendimentosFiltrados.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {a.itens && a.itens[0] ? format(new Date(a.itens[0].data_execucao), 'dd/MM/yyyy') : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">{a.numero_guia_prestador}</td>
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">{a.paciente_nome}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">{a.numero_carteira}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${a.paciente_convenio_nome && a.paciente_convenio_nome !== 'Sem convênio' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                      {a.paciente_convenio_nome || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <button onClick={() => handleViewItens(a)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 mx-auto" title="Ver itens">
                      <DocumentPlusIcon className="w-4 h-4" />
                      <span className="font-bold">{a.itens?.length || 0}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">R$ {a.valor_total?.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${a.status === 'faturado' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'}`}>
                      {a.status === 'faturado' ? 'Faturado' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => handleViewItens(a)} className="p-1 rounded-lg text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Ver Itens">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      {a.status === 'pendente' && (
                        <button onClick={() => handleEnviarFaturamento(a.id)} className="p-1 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors" title="Faturar">
                          <CheckIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handleEdit(a)} className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Editar">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(a.id)} className="p-1 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Excluir">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {atendimentosFiltrados.length === 0 && (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                    <DocumentPlusIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    Nenhum atendimento encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Visualização de Itens */}
      {showItensModal && selectedGuia && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Itens da Guia</h3>
                <button onClick={() => setShowItensModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div><span className="text-xs text-gray-500 dark:text-gray-400">Guia:</span> <span className="text-sm font-mono font-medium">{selectedGuia.numero_guia_prestador}</span></div>
                <div><span className="text-xs text-gray-500 dark:text-gray-400">Paciente:</span> <span className="text-sm font-medium">{selectedGuia.paciente_nome}</span></div>
                <div><span className="text-xs text-gray-500 dark:text-gray-400">Carteira:</span> <span className="text-sm font-mono">{selectedGuia.numero_carteira}</span></div>
                <div><span className="text-xs text-gray-500 dark:text-gray-400">Convênio:</span> <span className="text-sm font-medium text-blue-600">{selectedGuia.paciente_convenio_nome || '-'}</span></div>
                <div><span className="text-xs text-gray-500 dark:text-gray-400">Guia Operadora:</span> <span className="text-sm">{selectedGuia.numero_guia_operadora || '-'}</span></div>
                <div><span className="text-xs text-gray-500 dark:text-gray-400">Data Autorização:</span> <span className="text-sm">{selectedGuia.data_autorizacao || '-'}</span></div>
                <div><span className="text-xs text-gray-500 dark:text-gray-400">Senha:</span> <span className="text-sm font-mono">{selectedGuia.senha_autorizacao || '-'}</span></div>
                <div><span className="text-xs text-gray-500 dark:text-gray-400">Status:</span> 
                  <span className={`inline-flex ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${selectedGuia.status === 'faturado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {selectedGuia.status}
                  </span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Seq</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Data</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">H.I</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">H.F</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Tabela</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Código</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Descrição</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Qtd</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Valor Unit.</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Valor Total</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Profissional</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {(selectedGuia.itens || []).map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-3 py-2 text-xs text-center font-medium">{idx + 1}</td>
                        <td className="px-3 py-2 text-xs">{item.data_execucao || '-'}</td>
                        <td className="px-3 py-2 text-xs">{item.hora_inicial || '-'}</td>
                        <td className="px-3 py-2 text-xs">{item.hora_final || '-'}</td>
                        <td className="px-3 py-2 text-xs font-mono">{item.tabela_referencia}</td>
                        <td className="px-3 py-2 text-xs font-mono text-blue-600">{item.codigo}</td>
                        <td className="px-3 py-2 text-xs">{item.nome}</td>
                        <td className="px-3 py-2 text-xs text-center">{item.quantidade}</td>
                        <td className="px-3 py-2 text-xs text-right">R$ {item.valor_unitario?.toFixed(2)}</td>
                        <td className="px-3 py-2 text-xs text-right font-semibold">R$ {item.valor_total?.toFixed(2)}</td>
                        <td className="px-3 py-2 text-xs text-gray-600">{item.prestador_nome}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-gray-700/50">
                    <tr className="border-t">
                      <td colSpan="9" className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">Total da Guia:</td>
                      <td className="px-3 py-2 text-right font-bold text-blue-600 dark:text-blue-400">R$ {selectedGuia.valor_total?.toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <div className="flex justify-end mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button onClick={() => setShowItensModal(false)} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                  {editing ? 'Editar Guia' : 'Nova Guia'}
                </h3>
                <button onClick={resetModal} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-5">
              {/* Tabs */}
              <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700 mb-5">
                <button 
                  onClick={() => setAba('paciente')} 
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 ${aba === 'paciente' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  <UserGroupIcon className="w-4 h-4 inline mr-1" /> Paciente
                </button>
                <button 
                  onClick={() => setAba('autorizacao')} 
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 ${aba === 'autorizacao' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  <CheckIcon className="w-4 h-4 inline mr-1" /> Autorização
                </button>
                <button 
                  onClick={() => setAba('solicitante')} 
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 ${aba === 'solicitante' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  <IdentificationIcon className="w-4 h-4 inline mr-1" /> Solicitante
                </button>
                <button 
                  onClick={() => setAba('atendimento')} 
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 ${aba === 'atendimento' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  <CalendarIcon className="w-4 h-4 inline mr-1" /> Atendimento
                </button>
                <button 
                  onClick={() => setAba('procedimentos')} 
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 ${aba === 'procedimentos' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  <BeakerIcon className="w-4 h-4 inline mr-1" /> Procedimentos
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                {/* Aba Paciente */}
                {aba === 'paciente' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paciente *</label>
                      <select 
                        value={formData.paciente_id} 
                        onChange={e => handlePacienteChange(e.target.value)} 
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                        required
                      >
                        <option value="">Selecione um paciente</option>
                        {pacientes.map(p => (
                          <option key={p.id} value={p.id}>{p.nome} - {p.numero_carteira}</option>
                        ))}
                      </select>
                      {formData.paciente_carteira && (
                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            <strong>Carteira:</strong> {formData.paciente_carteira} | 
                            <strong> Convênio:</strong> {formData.convenio_nome || 'Não definido'}
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                      <textarea 
                        rows="3" 
                        value={formData.observacao} 
                        onChange={e => setFormData({...formData, observacao: e.target.value})} 
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                        placeholder="Informações adicionais sobre o atendimento..."
                      />
                    </div>
                    {editing && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                        <select 
                          value={formData.status} 
                          onChange={e => setFormData({...formData, status: e.target.value})} 
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="pendente">Pendente</option>
                          <option value="faturado">Faturado</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Aba Autorização */}
                {aba === 'autorizacao' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número da Guia (Operadora)</label>
                        <input 
                          type="text" 
                          value={formData.numero_guia_operadora} 
                          onChange={e => setFormData({...formData, numero_guia_operadora: e.target.value})} 
                          placeholder="Número fornecido pela operadora" 
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data da Autorização</label>
                        <input 
                          type="date" 
                          value={formData.data_autorizacao} 
                          onChange={e => setFormData({...formData, data_autorizacao: e.target.value})} 
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Validade da Senha</label>
                        <input 
                          type="date" 
                          value={formData.data_validade_senha} 
                          onChange={e => setFormData({...formData, data_validade_senha: e.target.value})} 
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha de Autorização</label>
                        <input 
                          type="text" 
                          value={formData.senha_autorizacao} 
                          onChange={e => setFormData({...formData, senha_autorizacao: e.target.value})} 
                          placeholder="Pode conter letras e números" 
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Aba Solicitante */}
                {aba === 'solicitante' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código na Operadora</label>
                        <input 
                          type="text" 
                          value={formData.codigo_operadora} 
                          onChange={e => setFormData({...formData, codigo_operadora: e.target.value})} 
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Contratado</label>
                        <input 
                          type="text" 
                          value={formData.nome_contratado} 
                          onChange={e => setFormData({...formData, nome_contratado: e.target.value})} 
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm" 
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buscar Profissional por Número do Conselho</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={buscaProfissional} 
                            onChange={e => {
                              setBuscaProfissional(e.target.value);
                              buscarProfissionalPorConselho(e.target.value);
                            }}
                            placeholder="Digite o número do conselho (ex: 124182)" 
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                          />
                          {buscandoProfissional && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Profissional Solicitante</label>
                        <input 
                          type="text" 
                          value={formData.profissional_solicitante} 
                          onChange={e => setFormData({...formData, profissional_solicitante: e.target.value})} 
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conselho Profissional</label>
                        <select 
                          value={formData.conselho_solicitante} 
                          onChange={e => setFormData({...formData, conselho_solicitante: e.target.value})} 
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
                        >
                          {CONSELHOS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número no Conselho</label>
                        <input 
                          type="text" 
                          value={formData.numero_conselho_solicitante} 
                          onChange={e => setFormData({...formData, numero_conselho_solicitante: e.target.value})} 
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">UF do Conselho</label>
                        <select 
                          value={formData.uf_solicitante} 
                          onChange={e => setFormData({...formData, uf_solicitante: e.target.value})} 
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
                        >
                          {UF_OPCOES.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CBOS (Código CBO)</label>
                        <input 
                          type="text" 
                          value={formData.cbos_solicitante} 
                          onChange={e => setFormData({...formData, cbos_solicitante: e.target.value})} 
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono" 
                          placeholder="Ex: 225125 - Médico neurologista" 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Aba Atendimento */}
                {aba === 'atendimento' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Caráter do Atendimento *</label>
                        <select 
                          value={formData.carater_atendimento} 
                          onChange={e => setFormData({...formData, carater_atendimento: e.target.value})} 
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
                        >
                          {CARATER_ATENDIMENTO.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data da Solicitação *</label>
                        <input 
                          type="date" 
                          value={formData.data_solicitacao} 
                          onChange={e => setFormData({...formData, data_solicitacao: e.target.value})} 
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm" 
                          required 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Atendimento a RN</label>
                        <select 
                          value={formData.atendimento_rn} 
                          onChange={e => setFormData({...formData, atendimento_rn: e.target.value})} 
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
                        >
                          {SIM_NAO.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Atendimento *</label>
                        <select 
                          value={formData.tipo_atendimento} 
                          onChange={e => setFormData({...formData, tipo_atendimento: e.target.value})} 
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
                        >
                          {TIPO_ATENDIMENTO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Indicação de Acidente</label>
                        <select 
                          value={formData.indicacao_acidente} 
                          onChange={e => setFormData({...formData, indicacao_acidente: e.target.value})} 
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
                        >
                          {INDICADOR_ACIDENTE.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Consulta</label>
                        <select 
                          value={formData.tipo_consulta} 
                          onChange={e => setFormData({...formData, tipo_consulta: e.target.value})} 
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
                        >
                          {TIPO_CONSULTA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Regime de Atendimento *</label>
                        <select 
                          value={formData.regime_atendimento} 
                          onChange={e => setFormData({...formData, regime_atendimento: e.target.value})} 
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
                        >
                          {REGIME_ATENDIMENTO.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cobertura Especial</label>
                        <select 
                          value={formData.cobertura_especial} 
                          onChange={e => setFormData({...formData, cobertura_especial: e.target.value})} 
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
                        >
                          {COBERTURA_ESPECIAL.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Saúde Ocupacional</label>
                        <select 
                          value={formData.saude_ocupacional} 
                          onChange={e => setFormData({...formData, saude_ocupacional: e.target.value})} 
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
                        >
                          {SAUDE_OCUPACIONAL.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motivo de Encerramento</label>
                        <select 
                          value={formData.motivo_encerramento} 
                          onChange={e => setFormData({...formData, motivo_encerramento: e.target.value})} 
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
                        >
                          {MOTIVO_ENCERRAMENTO.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Indicação Clínica</label>
                      <textarea 
                        rows="3" 
                        value={formData.indicacao_clinica} 
                        onChange={e => setFormData({...formData, indicacao_clinica: e.target.value})} 
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                        placeholder="Descrição da indicação clínica..."
                      />
                    </div>
                  </div>
                )}

                {/* Aba Procedimentos */}
                {aba === 'procedimentos' && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>ℹ️ Informações:</strong> Selecione o tipo de item, busque por código ou descrição, e preencha os dados do atendimento.
                        Os valores podem ser calculados automaticamente com base nas tabelas TUSS, CBHPM ou AMB conforme configuração do convênio.
                      </p>
                    </div>

                    {itensGuia.length > 0 && (
                      <div className="border rounded-xl overflow-hidden">
                        <div className="overflow-x-auto max-h-64">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                              <tr>
                                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Seq</th>
                                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Data</th>
                                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">H.I</th>
                                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">H.F</th>
                                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Tabela</th>
                                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Código</th>
                                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Descrição</th>
                                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Qtd</th>
                                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Valor Unit.</th>
                                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Valor Total</th>
                                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Profissional</th>
                                <th className="px-2 py-2 text-center w-8"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                              {itensGuia.map((item, idx) => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                  <td className="px-2 py-2 text-xs text-center">{idx + 1}</td>
                                  <td className="px-2 py-2 text-xs">{item.data_execucao}</td>
                                  <td className="px-2 py-2 text-xs">{item.hora_inicial}</td>
                                  <td className="px-2 py-2 text-xs">{item.hora_final}</td>
                                  <td className="px-2 py-2 text-xs font-mono">{item.tabela_referencia}<tr>
                                  <td className="px-2 py-2 text-xs font-mono text-blue-600">{item.codigo}</td>
                                  <td className="px-2 py-2 text-xs">{item.nome}</td>
                                  <td className="px-2 py-2 text-xs text-center">{item.quantidade}</td>
                                  <td className="px-2 py-2 text-xs text-right">R$ {item.valor_unitario?.toFixed(2)}</td>
                                  <td className="px-2 py-2 text-xs text-right font-semibold">R$ {item.valor_total?.toFixed(2)}</td>
                                  <td className="px-2 py-2 text-xs text-gray-600">{item.prestador_nome}</td>
                                  <td className="px-2 py-2 text-center">
                                    <button type="button" onClick={() => removerItem(item.id)} className="text-red-600 hover:text-red-800">
                                      <TrashIcon className="w-3 h-3" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-gray-50 dark:bg-gray-700/50">
                              <tr className="border-t">
                                <td colSpan="10" className="px-2 py-2 text-right font-semibold">Subtotal:</td>
                                  <td className="px-2 py-2 text-right font-bold text-blue-600">
                                  R$ {itensGuia.reduce((sum, i) => sum + i.valor_total, 0).toFixed(2)}
                                </td>
                                <td></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Seletor de Tipo de Item */}
                    <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
                      {TIPOS_ITEM.map(tipo => {
                        const Icon = tipo.icon;
                        return (
                          <button
                            key={tipo.value}
                            type="button"
                            onClick={() => {
                              setTipoItem(tipo.value);
                              setTabelaSelecionada(tipo.tabelas[0]);
                              setCurrentItem({
                                ...currentItem,
                                tipo: tipo.value,
                                tabela_referencia: tipo.tabelas[0]
                              });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1 ${
                              tipoItem === tipo.value
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            <Icon className="w-3 h-3" />
                            {tipo.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Seletor de Tabela */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tabela de Referência</label>
                      <select
                        value={currentItem.tabela_referencia}
                        onChange={e => setCurrentItem({...currentItem, tabela_referencia: e.target.value})}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        {TIPOS_ITEM.find(t => t.value === tipoItem)?.tabelas.map(tabela => (
                          <option key={tabela} value={tabela}>
                            {TABELAS[tabela]?.nome || tabela} ({tabela})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Busca de Item */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buscar Item (código ou descrição)</label>
                      <div className="relative">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={searchItemTerm}
                          onChange={e => setSearchItemTerm(e.target.value)}
                          placeholder="Digite o código ou descrição do procedimento..."
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          list="itens-suggestions"
                        />
                        <datalist id="itens-suggestions">
                          {itensFiltrados.slice(0, 20).map(item => (
                            <option key={item.codigo_tuss} value={item.codigo_tuss}>
                              {item.codigo_tuss} - {item.nome}
                            </option>
                          ))}
                        </datalist>
                      </div>
                    </div>

                    {/* Seleção do Item */}
                    {searchItemTerm && itensFiltrados.length > 0 && (
                      <div className="border rounded-xl max-h-48 overflow-y-auto">
                        {itensFiltrados.slice(0, 10).map(item => (
                          <button
                            key={item.codigo_tuss}
                            type="button"
                            onClick={() => {
                              handleProcedimentoItemChange(item.codigo_tuss);
                              setSearchItemTerm('');
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 border-b last:border-b-0 transition-colors"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-mono text-sm text-blue-600">{item.codigo_tuss}</span>
                                <span className="text-sm text-gray-700 dark:text-gray-300 ml-2">{item.nome}</span>
                              </div>
                              <span className="text-sm font-semibold text-green-600">
                                R$ {item.valor_sugerido?.toFixed(2)}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Formulário do Item */}
                    {currentItem.codigo && (
                      <div className="border-t pt-4 mt-2">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                          <div className="md:col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">Data Execução</label>
                            <input
                              type="date"
                              value={currentItem.data_execucao}
                              onChange={e => setCurrentItem({...currentItem, data_execucao: e.target.value})}
                              className="w-full border rounded-lg px-2 py-1.5 text-sm"
                            />
                          </div>
                          <div className="md:col-span-1">
                            <label className="block text-xs text-gray-500 mb-1">H.I</label>
                            <input
                              type="time"
                              value={currentItem.hora_inicial}
                              onChange={e => setCurrentItem({...currentItem, hora_inicial: e.target.value})}
                              className="w-full border rounded-lg px-2 py-1.5 text-sm"
                            />
                          </div>
                          <div className="md:col-span-1">
                            <label className="block text-xs text-gray-500 mb-1">H.F</label>
                            <input
                              type="time"
                              value={currentItem.hora_final}
                              onChange={e => setCurrentItem({...currentItem, hora_final: e.target.value})}
                              className="w-full border rounded-lg px-2 py-1.5 text-sm"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs text-gray-500 mb-1">Item</label>
                            <input
                              type="text"
                              value={currentItem.nome}
                              disabled
                              className="w-full border rounded-lg px-2 py-1.5 text-sm bg-gray-50 dark:bg-gray-700"
                            />
                          </div>
                          <div className="md:col-span-1">
                            <label className="block text-xs text-gray-500 mb-1">Qtd</label>
                            <input
                              type="number"
                              min="1"
                              value={currentItem.quantidade}
                              onChange={e => setCurrentItem({
                                ...currentItem,
                                quantidade: parseInt(e.target.value) || 1,
                                valor_total: (parseInt(e.target.value) || 1) * currentItem.valor_unitario
                              })}
                              className="w-full border rounded-lg px-2 py-1.5 text-sm text-center"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">Valor Unitário</label>
                            <input
                              type="number"
                              step="0.01"
                              value={currentItem.valor_unitario}
                              onChange={e => setCurrentItem({
                                ...currentItem,
                                valor_unitario: parseFloat(e.target.value) || 0,
                                valor_total: currentItem.quantidade * (parseFloat(e.target.value) || 0)
                              })}
                              className="w-full border rounded-lg px-2 py-1.5 text-sm text-right"
                            />
                          </div>
                          <div className="md:col-span-1">
                            <label className="block text-xs text-gray-500 mb-1">Grau Part.</label>
                            <select
                              value={currentItem.grau_participacao}
                              onChange={e => setCurrentItem({...currentItem, grau_participacao: e.target.value})}
                              className="w-full border rounded-lg px-2 py-1.5 text-sm"
                            >
                              {GRAU_PARTICIPACAO.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">Profissional (executante)</label>
                            <select
                              value={currentItem.prestador_id}
                              onChange={e => {
                                const prestador = prestadores.find(p => p.id === parseInt(e.target.value));
                                setCurrentItem({
                                  ...currentItem,
                                  prestador_id: e.target.value,
                                  prestador_nome: prestador?.nome || '',
                                  prestador_cpf: prestador?.cpf || '',
                                  prestador_conselho: prestador?.codigo_conselho_ans || '06',
                                  prestador_numero_conselho: prestador?.numero_conselho || '',
                                  prestador_uf_conselho: prestador?.uf_conselho || '35',
                                  prestador_cbos: prestador?.cbos || '225125'
                                });
                              }}
                              className="w-full border rounded-lg px-2 py-1.5 text-sm"
                            >
                              <option value="">Selecione</option>
                              {prestadores.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.nome} - {p.especialidade} ({p.conselho} {p.numero_conselho})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="md:col-span-1">
                            <button
                              type="button"
                              onClick={handleAdicionarItem}
                              className="w-full bg-green-600 text-white px-2 py-1.5 rounded-lg text-sm hover:bg-green-700 transition-colors"
                            >
                              + Add
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

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
                    {editing ? 'Atualizar' : 'Salvar'} Guia
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
