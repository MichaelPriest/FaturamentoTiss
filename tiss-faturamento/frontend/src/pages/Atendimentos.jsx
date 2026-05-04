import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon, 
  CheckIcon, 
  XMarkIcon, 
  EyeIcon, 
  DocumentPlusIcon,
  CurrencyDollarIcon, 
  BeakerIcon, 
  CubeIcon,
  UserGroupIcon,
  CalendarIcon,
  IdentificationIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  LockOpenIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { supabase } from '../lib/supabaseClient';

// ============================================
// CONSTANTES
// ============================================

const CARATER_ATENDIMENTO = [
  { value: '', label: 'Selecione' },  
  { value: '1', label: 'Eletivo' },
  { value: '2', label: 'Urgência/Emergência' }
];

const TIPO_ATENDIMENTO = [
  { value: '', label: 'Selecione' },  
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
  { value: '', label: 'Selecione' },  
  { value: '0', label: 'Trabalho' },
  { value: '1', label: 'Trânsito' },
  { value: '2', label: 'Outros Acidentes' },
  { value: '9', label: 'Não Acidente' }
];

const TIPO_CONSULTA = [
  { value: '', label: 'Selecione' },  
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
  { value: '', label: 'Selecione' },  
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
  { value: '12', label: '12 - Clínico' },
  { value: '13', label: '13 - Intensivista' }
];

const STATUS_ATENDIMENTO = [
  { value: 'pendente', label: 'Pendente', cor: 'yellow' },
  { value: 'autorizado', label: 'Autorizado', cor: 'blue' },
  { value: 'parcial', label: 'Autorizado Parcialmente', cor: 'orange' },
  { value: 'faturado', label: 'Faturado', cor: 'green' },
  { value: 'cancelado', label: 'Cancelado', cor: 'red' },
  { value: 'finalizado', label: 'Finalizado', cor: 'purple' }
];

const SIM_NAO = [
  { value: 'S', label: 'Sim' },
  { value: 'N', label: 'Não' }
];

const TIPOS_ITEM = [
  { value: 'procedimento', label: 'Procedimento', tabelas: ['22', '00', '98'] },
  { value: 'material', label: 'Material/OPME', tabelas: ['19'] },
  { value: 'medicamento', label: 'Medicamento', tabelas: ['20'] },
  { value: 'diaria', label: 'Diária/Taxa', tabelas: ['18'] },
  { value: 'pacote', label: 'Pacote', tabelas: ['98'] },
  { value: 'outros', label: 'Outras Despesas', tabelas: ['00'] }
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

const UNIDADES_MEDIDA = [
  { value: '036', label: 'UN - Unidade' },
  { value: '022', label: 'MG - Miligrama' },
  { value: '018', label: 'G - Grama' },
  { value: '023', label: 'ML - Mililitro' },
  { value: '001', label: 'AMP - Ampola' },
  { value: '013', label: 'FR - Frasco' },
  { value: '005', label: 'CX - Caixa' },
  { value: '040', label: 'KIT - Kit' }
];

export default function Atendimentos() {
  const [atendimentos, setAtendimentos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [prestadores, setPrestadores] = useState([]);
  const [todosProcedimentos, setTodosProcedimentos] = useState([]);
  const [procedimentosFiltrados, setProcedimentosFiltrados] = useState([]);
  const [convenios, setConvenios] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [editandoItem, setEditandoItem] = useState(null);
  
  const [itensGuia, setItensGuia] = useState([]);
  const [itensAutorizados, setItensAutorizados] = useState([]);
  
  const [currentItem, setCurrentItem] = useState({
    tipo: 'procedimento',
    codigo: '',
    nome: '',
    quantidade: 1,
    quantidade_autorizada: 0,
    valor_unitario: 0,
    valor_total: 0,
    data_execucao: new Date().toISOString().split('T')[0],
    hora_inicial: '',
    hora_final: '',
    viaAcesso: '1',
    tecnicaUtilizada: '1',
    reducaoAcrescimo: '1.00',    
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
    unidade_medida: '036',
    pendente_autorizacao: false,
    saldo_autorizado: 0
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

  // ============================================
  // FUNÇÕES DE CARREGAMENTO
  // ============================================

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [atendimentosRes, pacientesRes, prestadoresRes, procedimentosRes, conveniosRes] = await Promise.all([
        supabase.from('atendimentos').select('*').order('created_at', { ascending: false }),
        supabase.from('pacientes').select('*').order('nome'),
        supabase.from('prestadores').select('*').order('nome'),
        supabase.from('procedimentos').select('*').order('codigo_tuss'),
        supabase.from('convenios').select('*').order('razao_social')
      ]);

      if (atendimentosRes.error) throw atendimentosRes.error;
      if (pacientesRes.error) throw pacientesRes.error;
      if (prestadoresRes.error) throw prestadoresRes.error;
      if (procedimentosRes.error) throw procedimentosRes.error;
      if (conveniosRes.error) throw conveniosRes.error;

      setAtendimentos(atendimentosRes.data || []);
      setPacientes(pacientesRes.data || []);
      setPrestadores(prestadoresRes.data || []);
      setTodosProcedimentos(procedimentosRes.data || []);
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

  // Filtrar procedimentos por convênio do paciente
  useEffect(() => {
    if (!formData.convenio_id) {
      setProcedimentosFiltrados([]);
      return;
    }
    const filtrados = todosProcedimentos.filter(p => 
      p.convenio_id === formData.convenio_id || p.convenio_id === null
    );
    setProcedimentosFiltrados(filtrados);
  }, [formData.convenio_id, todosProcedimentos]);

  // ============================================
  // FUNÇÕES DE AUTORIZAÇÃO E CÁLCULOS
  // ============================================

  const calcularValor = (procedimento, convenio) => {
    if (!procedimento) return 0;
    // Prioriza valor_convenio específico deste convênio
    if (procedimento.valor_convenio && procedimento.convenio_id === convenio?.id) {
      return procedimento.valor_convenio;
    }
    let valorBase = procedimento.valor_sugerido || 0;
    const multiplicador = convenio?.multiplicador || 1;
    return valorBase * multiplicador;
  };

  const calcularStatusGuia = useCallback((itensExecutados, itensAutorizadosList) => {
    if (!itensExecutados || itensExecutados.length === 0) return 'pendente';
    if (!itensAutorizadosList || itensAutorizadosList.length === 0) return 'pendente';
    let todosAutorizados = true;
    let algumPendente = false;
    let algumParcial = false;
    itensExecutados.forEach(item => {
      const itemAutorizado = itensAutorizadosList.find(aut => aut.codigo === item.codigo);
      if (!itemAutorizado) {
        algumPendente = true;
        todosAutorizados = false;
      } else {
        const saldo = itemAutorizado.quantidade_autorizada - (item.quantidade || 0);
        if (saldo < 0) {
          algumPendente = true;
          todosAutorizados = false;
        } else if (saldo > 0 && item.quantidade < itemAutorizado.quantidade_autorizada) {
          algumParcial = true;
        }
      }
    });
    if (algumPendente) return 'parcial';
    if (algumParcial && !algumPendente) return 'parcial';
    if (todosAutorizados && !algumPendente) return 'autorizado';
    return 'pendente';
  }, []);

  const podeAdicionarItem = useCallback((itemCodigo, quantidade) => {
    const itemAutorizado = itensAutorizados.find(aut => aut.codigo === itemCodigo);
    if (!itemAutorizado) {
      return { pode: true, mensagem: 'Este procedimento não está autorizado. Será marcado como pendente.', pendente: true };
    }
    const qtdAutorizada = itemAutorizado.quantidade_autorizada;
    const qtdUtilizada = itemAutorizado.quantidade_utilizada || 0;
    const saldo = qtdAutorizada - qtdUtilizada;
    if (quantidade > saldo) {
      return { pode: false, mensagem: `Quantidade excede o saldo autorizado! Saldo disponível: ${saldo}`, pendente: false };
    }
    return { pode: true, mensagem: '', pendente: false };
  }, [itensAutorizados]);

  const atualizarQuantidadeUtilizada = useCallback((itemCodigo, quantidade, isAdicionando = true) => {
    setItensAutorizados(prev => {
      return prev.map(aut => {
        if (aut.codigo === itemCodigo) {
          const quantidadeAtual = aut.quantidade_utilizada || 0;
          const novaQuantidadeUtilizada = isAdicionando 
            ? quantidadeAtual + quantidade
            : Math.max(0, quantidadeAtual - quantidade);
          return {
            ...aut,
            quantidade_utilizada: novaQuantidadeUtilizada,
            saldo_autorizado: aut.quantidade_autorizada - novaQuantidadeUtilizada
          };
        }
        return aut;
      });
    });
  }, []);

  const podeFaturar = useCallback((atendimento) => {
    if (!atendimento.itens || atendimento.itens.length === 0) return false;
    const itensAutorizadosDoAtendimento = atendimento.itens_autorizados || [];
    if (itensAutorizadosDoAtendimento.length === 0) return false;
    const itensPendentes = atendimento.itens.filter(item => 
      !itensAutorizadosDoAtendimento.find(aut => aut.codigo === item.codigo)
    );
    if (itensPendentes.length > 0) return false;
    const itensExcedidos = atendimento.itens.filter(item => {
      const itemAutorizado = itensAutorizadosDoAtendimento.find(aut => aut.codigo === item.codigo);
      if (!itemAutorizado) return false;
      return (item.quantidade || 0) > (itemAutorizado.quantidade_autorizada || 0);
    });
    if (itensExcedidos.length > 0) return false;
    if (atendimento.status === 'cancelado' || atendimento.status === 'finalizado' || atendimento.status === 'faturado') return false;
    const valorTotal = atendimento.itens.reduce((sum, item) => sum + (item.valor_total || 0), 0);
    return valorTotal > 0;
  }, []);

  // ============================================
  // MANIPULAÇÃO DE FORMULÁRIO E ITENS
  // ============================================

  const handlePacienteChange = (pacienteId) => {
    const id = pacienteId ? parseInt(pacienteId) : null;
    if (!id) return;
    const paciente = pacientes.find(p => p.id === id);
    if (paciente) {
      const convenio = convenios.find(c => c.id === paciente.convenio_id);
      setFormData({
        ...formData,
        paciente_id: id,
        paciente_nome: paciente.nome || '',
        paciente_carteira: paciente.numero_carteira || '',
        convenio_id: paciente.convenio_id || null,
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

  const handleProcedimentoItemChange = (codigo) => {
    const procedimento = procedimentosFiltrados.find(p => p.codigo_tuss === codigo);
    if (!procedimento) return;
    const convenio = convenios.find(c => c.id === formData.convenio_id);
    const valorCalculado = calcularValor(procedimento, convenio);
    const itemAutorizado = itensAutorizados.find(aut => aut.codigo === codigo);
    const saldo = itemAutorizado ? (itemAutorizado.quantidade_autorizada - (itemAutorizado.quantidade_utilizada || 0)) : 0;
    setCurrentItem({
      ...currentItem,
      codigo: procedimento.codigo_tuss,
      nome: procedimento.nome,
      valor_unitario: valorCalculado,
      quantidade_autorizada: itemAutorizado?.quantidade_autorizada || 0,
      saldo_autorizado: saldo,
      valor_total: (currentItem.quantidade || 1) * valorCalculado,
      tabela_referencia: procedimento.tipo_tabela === 'CBHPM' ? '98' : 
                        procedimento.tipo_tabela === 'AMB' ? '90' : 
                        procedimento.tipo_tabela === 'PROPRIA' ? '00' : '22'
    });
    setSearchItemTerm('');
  };

  const handleAdicionarItemAutorizado = () => {
    if (!currentItem.codigo) {
      toast.error('Selecione um procedimento');
      return;
    }
    if (itensAutorizados.some(item => item.codigo === currentItem.codigo)) {
      toast.warning('Este procedimento já foi autorizado!');
      return;
    }
    const procedimento = procedimentosFiltrados.find(p => p.codigo_tuss === currentItem.codigo);
    const convenio = convenios.find(c => c.id === formData.convenio_id);
    const valorUnitario = currentItem.valor_unitario || calcularValor(procedimento, convenio);
    const novoItemAutorizado = {
      id: Date.now() + Math.random(),
      tipo: 'procedimento',
      codigo: currentItem.codigo,
      nome: currentItem.nome || procedimento?.nome,
      quantidade_autorizada: currentItem.quantidade_autorizada || 1,
      quantidade_utilizada: 0,
      valor_unitario: valorUnitario,
      valor_total: valorUnitario * (currentItem.quantidade_autorizada || 1),
      data_autorizacao: formData.data_autorizacao || new Date().toISOString().split('T')[0],
      saldo_autorizado: currentItem.quantidade_autorizada || 1
    };
    setItensAutorizados([...itensAutorizados, novoItemAutorizado]);
    resetCurrentItem();
    toast.success('Procedimento autorizado adicionado!');
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
    const validacao = podeAdicionarItem(currentItem.codigo, currentItem.quantidade);
    if (!validacao.pode) {
      toast.error(validacao.mensagem);
      return;
    }
    const valorTotal = currentItem.quantidade * currentItem.valor_unitario;
    const prestador = prestadores.find(p => p.id === parseInt(currentItem.prestador_id));
    const pendenteAutorizacao = validacao.pendente || !itensAutorizados.some(aut => aut.codigo === currentItem.codigo);
    const novoItem = {
      ...currentItem,
      valor_total: valorTotal,
      prestador_id: prestador?.id,
      prestador_nome: prestador?.nome,
      prestador_cpf: prestador?.cpf || '00000000000',
      prestador_conselho: prestador?.codigo_conselho_ans || '06',
      prestador_numero_conselho: prestador?.numero_conselho || '00000',
      prestador_uf_conselho: prestador?.uf_conselho || '35',
      prestador_cbos: prestador?.cbos || '225125',
      pendente_autorizacao: pendenteAutorizacao,
      viaAcesso: currentItem.viaAcesso || '1',
      tecnicaUtilizada: currentItem.tecnicaUtilizada || '1',
      reducaoAcrescimo: currentItem.reducaoAcrescimo || '1.00',
      id: Date.now() + Math.random()
    };
    atualizarQuantidadeUtilizada(currentItem.codigo, currentItem.quantidade, true);
    setItensGuia([...itensGuia, novoItem]);
    resetCurrentItem();
    toast.success('Item adicionado à guia!');
  };

  const handleEditItem = (item) => {
    const saldo = itensAutorizados.find(aut => aut.codigo === item.codigo)?.saldo_autorizado || 0;
    const itemAutorizado = itensAutorizados.find(aut => aut.codigo === item.codigo);
    setEditandoItem(item);
    setCurrentItem({
      ...item,
      quantidade_autorizada: itemAutorizado?.quantidade_autorizada || 0,
      saldo_autorizado: saldo
    });
  };

  const handleUpdateItem = () => {
    if (!currentItem.codigo) {
      toast.error('Item inválido');
      return;
    }
    const validacao = podeAdicionarItem(currentItem.codigo, currentItem.quantidade);
    if (!validacao.pode) {
      toast.error(validacao.mensagem);
      return;
    }
    const itemAntigo = itensGuia.find(item => item.id === editandoItem.id);
    if (itemAntigo && itemAntigo.codigo === currentItem.codigo) {
      const diferenca = currentItem.quantidade - itemAntigo.quantidade;
      if (diferenca !== 0) {
        atualizarQuantidadeUtilizada(currentItem.codigo, Math.abs(diferenca), diferenca > 0);
      }
    }
    const valorTotal = currentItem.quantidade * currentItem.valor_unitario;
    const pendenteAutorizacao = validacao.pendente || !itensAutorizados.some(aut => aut.codigo === currentItem.codigo);
    const itemAtualizado = { ...currentItem, valor_total: valorTotal, pendente_autorizacao: pendenteAutorizacao };
    setItensGuia(itensGuia.map(item => item.id === editandoItem.id ? { ...itemAtualizado, id: item.id } : item));
    setEditandoItem(null);
    resetCurrentItem();
    toast.success('Item atualizado com sucesso!');
  };

  const removerItem = (itemId) => {
    const itemRemovido = itensGuia.find(item => item.id === itemId);
    if (itemRemovido) {
      atualizarQuantidadeUtilizada(itemRemovido.codigo, itemRemovido.quantidade, false);
    }
    setItensGuia(itensGuia.filter(item => item.id !== itemId));
    toast.success('Item removido da guia');
  };

  const removerItemAutorizado = (itemId) => {
    setItensAutorizados(itensAutorizados.filter(item => item.id !== itemId));
    toast.success('Item autorizado removido');
  };

  const resetCurrentItem = () => {
    setCurrentItem({
      tipo: 'procedimento',
      codigo: '',
      nome: '',
      quantidade: 1,
      quantidade_autorizada: 0,
      valor_unitario: 0,
      valor_total: 0,
      data_execucao: new Date().toISOString().split('T')[0],
      hora_inicial: '',
      hora_final: '',
      viaAcesso: '1',
      tecnicaUtilizada: '1',
      reducaoAcrescimo: '1.00',
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
      unidade_medida: '036',
      pendente_autorizacao: false,
      saldo_autorizado: 0
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.paciente_id) {
      toast.error('Selecione um paciente');
      return;
    }
    if (itensGuia.length === 0) {
      toast.error('Adicione pelo menos um item executado à guia');
      return;
    }
    const paciente = pacientes.find(p => p.id === parseInt(formData.paciente_id));
    const convenio = convenios.find(c => c.id === paciente?.convenio_id);
    if (!convenio) {
      toast.error('Convênio não encontrado. Verifique se o paciente possui convênio associado.');
      return;
    }
    const valorTotalGuia = itensGuia.reduce((sum, item) => sum + item.valor_total, 0);
    const statusGuia = calcularStatusGuia(itensGuia, itensAutorizados);
    let numeroGuiaPrestador;
    if (editing) {
      numeroGuiaPrestador = editing.numero_guia_prestador;
    } else if (convenio.proximo_numero_guia) {
      numeroGuiaPrestador = convenio.proximo_numero_guia.toString();
      await supabase
        .from('convenios')
        .update({ proximo_numero_guia: convenio.proximo_numero_guia + 1, updated_at: new Date().toISOString() })
        .eq('id', convenio.id);
    } else {
      numeroGuiaPrestador = Date.now().toString();
    }
    const novoAtendimento = {
      numero_guia_prestador: numeroGuiaPrestador,
      observacao: formData.observacao,
      status: statusGuia,
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
      itens_autorizados: itensAutorizados,
      valor_total: valorTotalGuia,
      data_atendimento: itensGuia[0]?.data_execucao || new Date().toISOString().split('T')[0],
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
    if (editing) novoAtendimento.id = editing.id;
    const sucesso = await salvarAtendimento(novoAtendimento);
    if (sucesso) resetModal();
  };

  const salvarAtendimento = async (atendimento) => {
    try {
      if (editing) {
        const { id, numero_guia_prestador, created_at, ...dadosParaAtualizar } = atendimento;
        const { error } = await supabase
          .from('atendimentos')
          .update({ ...dadosParaAtualizar, updated_at: new Date().toISOString() })
          .eq('id', editing.id);
        if (error) throw error;
        toast.success('Atendimento atualizado com sucesso!');
      } else {
        const { data, error } = await supabase
          .from('atendimentos')
          .insert([{ ...atendimento, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }])
          .select();
        if (error) throw error;
        toast.success('Atendimento registrado com sucesso!');
      }
      await carregarDados();
      return true;
    } catch (error) {
      console.error('Erro ao salvar atendimento:', error);
      toast.error(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`);
      return false;
    }
  };

  const resetModal = () => {
    setShowModal(false);
    setEditing(null);
    setEditandoItem(null);
    setItensGuia([]);
    setItensAutorizados([]);
    setAba('paciente');
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

  const handleEdit = (atendimento) => {
    if (atendimento.status === 'faturado') {
      toast.error('❌ Não é possível editar: Guia já foi faturada!');
      return;
    }
    if (atendimento.status === 'finalizado') {
      toast.error('🔒 Não é possível editar: Guia está finalizada e bloqueada para edição!');
      return;
    }
    setEditing(atendimento);
    setItensGuia(atendimento.itens || []);
    const itensAutorizadosAtualizados = (atendimento.itens_autorizados || []).map(aut => {
      let quantidadeUtilizada = 0;
      (atendimento.itens || []).forEach(itemExecutado => {
        if (itemExecutado.codigo === aut.codigo) quantidadeUtilizada += (itemExecutado.quantidade || 0);
      });
      return { ...aut, quantidade_utilizada: quantidadeUtilizada, saldo_autorizado: aut.quantidade_autorizada - quantidadeUtilizada };
    });
    setItensAutorizados(itensAutorizadosAtualizados);
    setAba('paciente');
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

  const handleDelete = (id) => {
    const atendimento = atendimentos.find(a => a.id === id);
    if (atendimento?.status === 'faturado') {
      toast.error('❌ Não é possível excluir: Guia já foi faturada!');
      return;
    }
    if (atendimento?.status === 'finalizado') {
      toast.error('🔒 Não é possível excluir: Guia está finalizada!');
      return;
    }
    excluirAtendimento(id);
  };

  const excluirAtendimento = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este atendimento?')) return;
    try {
      const { error } = await supabase.from('atendimentos').delete().eq('id', id);
      if (error) throw error;
      toast.success('Atendimento excluído com sucesso!');
      await carregarDados();
    } catch (error) {
      console.error('Erro ao excluir atendimento:', error);
      toast.error('Erro ao excluir atendimento');
    }
  };

  const handleViewItens = (atendimento) => {
    setSelectedGuia(atendimento);
    setShowItensModal(true);
  };

  const getStatusCor = (status) => {
    const cores = {
      pendente: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      autorizado: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      parcial: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      faturado: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      cancelado: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      finalizado: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    };
    return cores[status] || 'bg-gray-100 text-gray-700';
  };

  const podeEditar = (status) => status !== 'faturado' && status !== 'finalizado';

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
  const autorizados = atendimentos.filter(a => a.status === 'autorizado').length;
  const parciais = atendimentos.filter(a => a.status === 'parcial').length;
  const faturados = atendimentos.filter(a => a.status === 'faturado').length;
  const finalizados = atendimentos.filter(a => a.status === 'finalizado').length;
  const valorTotalPendente = atendimentos.filter(a => a.status === 'pendente' || a.status === 'parcial').reduce((sum, a) => sum + (a.valor_total || 0), 0);

  const pacientesFiltrados = useMemo(() => {
    if (!searchTerm) return pacientes;
    const term = searchTerm.toLowerCase();
    return pacientes.filter(p => 
      p.nome?.toLowerCase().includes(term) ||
      p.cpf?.replace(/\D/g, '').includes(term.replace(/\D/g, '')) ||
      p.numero_carteira?.toLowerCase().includes(term)
    );
  }, [pacientes, searchTerm]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Atendimentos / Guias
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Registro de atendimentos e criação de guias TISS
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { carregarDados(); }} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Recarregar
            </button>
            <button onClick={() => { setEditing(null); resetModal(); setShowModal(true); }} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:from-blue-600 hover:to-indigo-700 shadow-lg">
              <PlusIcon className="w-4 h-4" /> Nova Guia
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4"><div><p className="text-xs text-gray-500">Total de Guias</p><p className="text-2xl font-bold">{atendimentos.length}</p></div><DocumentPlusIcon className="w-8 h-8 text-blue-500 opacity-50 float-right" /></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4"><div><p className="text-xs text-gray-500">Pendentes</p><p className="text-2xl font-bold text-yellow-600">{pendentes}</p></div><ClockIcon className="w-8 h-8 text-yellow-500 opacity-50 float-right" /></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4"><div><p className="text-xs text-gray-500">Autorizados</p><p className="text-2xl font-bold text-blue-600">{autorizados}</p></div><CheckIcon className="w-8 h-8 text-blue-500 opacity-50 float-right" /></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4"><div><p className="text-xs text-gray-500">Autorização Parcial</p><p className="text-2xl font-bold text-orange-600">{parciais}</p></div><ExclamationTriangleIcon className="w-8 h-8 text-orange-500 opacity-50 float-right" /></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4"><div><p className="text-xs text-gray-500">Faturados</p><p className="text-2xl font-bold text-green-600">{faturados}</p></div><CurrencyDollarIcon className="w-8 h-8 text-green-500 opacity-50 float-right" /></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4"><div><p className="text-xs text-gray-500">Finalizados</p><p className="text-2xl font-bold text-purple-600">{finalizados}</p></div><LockClosedIcon className="w-8 h-8 text-purple-500 opacity-50 float-right" /></div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative"><MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Buscar por paciente, carteira ou guia..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600" /></div>
            <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"><option value="todos">Todos os status</option>{STATUS_ATENDIMENTO.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
            <select value={filtroConvenio} onChange={e => setFiltroConvenio(e.target.value)} className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"><option value="todos">Todos os convênios</option>{convenios.map(c => <option key={c.id} value={c.id}>{c.razao_social}</option>)}</select>
          </div>
        </div>

        {/* Tabela de Guias */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr><th className="px-4 py-3 text-left">Data</th><th className="px-4 py-3 text-left">Nº Guia</th><th className="px-4 py-3 text-left">Paciente</th><th className="px-4 py-3 text-left">Carteira</th><th className="px-4 py-3 text-left">Convênio</th><th className="px-4 py-3 text-center">Itens</th><th className="px-4 py-3 text-right">Valor Total</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-center">Ações</th></tr>
              </thead>
              <tbody className="divide-y">
                {atendimentosFiltrados.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">{a.data_atendimento ? format(new Date(a.data_atendimento), 'dd/MM/yyyy') : (a.itens?.[0]?.data_execucao ? format(new Date(a.itens[0].data_execucao), 'dd/MM/yyyy') : '-')}</td>
                    <td className="px-4 py-3 font-mono">{a.numero_guia_prestador}</td>
                    <td className="px-4 py-3">{a.paciente_nome}</td>
                    <td className="px-4 py-3 font-mono">{a.numero_carteira}</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">{a.paciente_convenio_nome || '-'}</span></td>
                    <td className="px-4 py-3 text-center"><button onClick={() => handleViewItens(a)} className="text-blue-600"><DocumentPlusIcon className="w-4 h-4 inline mr-1" />{a.itens?.length || 0}</button></td>
                    <td className="px-4 py-3 text-right font-semibold">R$ {(a.valor_total || 0).toFixed(2)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${getStatusCor(a.status)}`}>{STATUS_ATENDIMENTO.find(s => s.value === a.status)?.label || a.status}</span></td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => handleViewItens(a)} className="p-1 text-gray-600 hover:bg-gray-100 rounded"><EyeIcon className="w-4 h-4" /></button>
                        {a.status !== 'autorizado' && a.status !== 'faturado' && a.status !== 'finalizado' && a.itens_autorizados?.length > 0 && <button onClick={() => atualizarStatus(a.id, 'autorizado')} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><CheckIcon className="w-4 h-4" /></button>}
                        {a.status !== 'faturado' && a.status !== 'cancelado' && a.status !== 'finalizado' && <button onClick={() => atualizarStatus(a.id, 'faturado')} className="p-1 text-green-600 hover:bg-green-50 rounded"><CurrencyDollarIcon className="w-4 h-4" /></button>}
                        {a.status !== 'cancelado' && a.status !== 'faturado' && a.status !== 'finalizado' && <button onClick={() => atualizarStatus(a.id, 'cancelado')} className="p-1 text-red-600 hover:bg-red-50 rounded"><XMarkIcon className="w-4 h-4" /></button>}
                        <button onClick={() => recalcularGuia(a.id)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"><ArrowPathIcon className="w-4 h-4" /></button>
                        <button onClick={() => handleEdit(a)} disabled={!podeEditar(a.status)} className={`p-1 rounded ${podeEditar(a.status) ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-400 cursor-not-allowed'}`}><PencilIcon className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(a.id)} disabled={!podeEditar(a.status)} className={`p-1 rounded ${podeEditar(a.status) ? 'text-red-600 hover:bg-red-50' : 'text-gray-400 cursor-not-allowed'}`}><TrashIcon className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {atendimentosFiltrados.length === 0 && <tr><td colSpan="9" className="text-center py-12 text-gray-500">Nenhum atendimento encontrado</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Visualização de Itens */}
      {showItensModal && selectedGuia && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-6xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b p-5 flex justify-between"><h3 className="text-xl font-semibold">Itens da Guia</h3><button onClick={() => setShowItensModal(false)}><XMarkIcon className="w-5 h-5" /></button></div>
            <div className="p-5">
              <div className="grid grid-cols-4 gap-3 p-3 bg-gray-50 rounded-xl mb-4"><div><span className="text-xs">Guia:</span> <span className="font-mono">{selectedGuia.numero_guia_prestador}</span></div><div><span className="text-xs">Paciente:</span> <span>{selectedGuia.paciente_nome}</span></div><div><span className="text-xs">Carteira:</span> <span>{selectedGuia.numero_carteira}</span></div><div><span className="text-xs">Convênio:</span> <span className="text-blue-600">{selectedGuia.paciente_convenio_nome}</span></div></div>
              <h4 className="font-semibold mb-2 flex items-center gap-2"><CheckIcon className="w-4 h-4 text-green-600" /> Itens Executados</h4>
              <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr><th>Seq</th><th>Data</th><th>H.Início</th><th>H.Fim</th><th>Código</th><th>Descrição</th><th>Qtd</th><th>Valor Unit.</th><th>Valor Total</th><th>Profissional</th><th>Status</th></tr></thead><tbody>{(selectedGuia.itens || []).map((item, i) => <tr key={i} className="border-t"><td className="px-2 py-1 text-center">{i+1}</td><td className="px-2 py-1">{item.data_execucao}</td><td className="px-2 py-1">{item.hora_inicial}</td><td className="px-2 py-1">{item.hora_final}</td><td className="px-2 py-1 font-mono text-blue-600">{item.codigo}</td><td className="px-2 py-1">{item.nome}</td><td className="px-2 py-1 text-center">{item.quantidade}</td><td className="px-2 py-1 text-right">R$ {item.valor_unitario?.toFixed(2)}</td><td className="px-2 py-1 text-right font-semibold">R$ {item.valor_total?.toFixed(2)}</td><td className="px-2 py-1">{item.prestador_nome}</td><td className="px-2 py-1 text-center">{item.pendente_autorizacao ? <span className="px-1 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">Pendente</span> : <span className="px-1 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">Autorizado</span>}</td></tr>)}</tbody><tfoot className="bg-gray-50"><tr><td colSpan="8" className="px-2 py-2 text-right font-semibold">Total:</td><td className="px-2 py-2 text-right font-bold">R$ {(selectedGuia.valor_total || 0).toFixed(2)}</td><td></td></tr></tfoot></table></div>

              {selectedGuia.itens_autorizados?.length > 0 && (
                <>
                  <h4 className="font-semibold mt-4 mb-2 flex items-center gap-2"><DocumentPlusIcon className="w-4 h-4 text-blue-600" /> Itens Autorizados pelo Convênio</h4>
                  <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr><th>Código</th><th>Descrição</th><th>Qtd Autorizada</th><th>Qtd Utilizada</th><th>Saldo</th><th>Valor Unit.</th></tr></thead><tbody>{(selectedGuia.itens_autorizados || []).map((item, i) => <tr key={i} className="border-t"><td className="px-2 py-1 font-mono text-blue-600">{item.codigo}</td><td className="px-2 py-1">{item.nome}</td><td className="px-2 py-1 text-center">{item.quantidade_autorizada}</td><td className="px-2 py-1 text-center">{item.quantidade_utilizada || 0}</td><td className="px-2 py-1 text-center text-green-600">{item.saldo_autorizado}</td><td className="px-2 py-1 text-right">R$ {item.valor_unitario?.toFixed(2)}</td></tr>)}</tbody></table></div>
                </>
              )}
              <div className="flex justify-end mt-4"><button onClick={() => setShowItensModal(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Fechar</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b p-5"><h3 className="text-xl font-semibold">{editing ? 'Editar Guia' : 'Nova Guia'}</h3></div>
            <div className="p-5">
              <div className="flex gap-1 border-b mb-5">
                <button onClick={() => setAba('paciente')} className={`px-4 py-2 text-sm font-medium rounded-t-lg ${aba === 'paciente' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : ''}`}>Paciente</button>
                <button onClick={() => setAba('autorizacao')} className={`px-4 py-2 text-sm font-medium rounded-t-lg ${aba === 'autorizacao' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : ''}`}>Autorização</button>
                <button onClick={() => setAba('solicitante')} className={`px-4 py-2 text-sm font-medium rounded-t-lg ${aba === 'solicitante' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : ''}`}>Solicitante</button>
                <button onClick={() => setAba('atendimento')} className={`px-4 py-2 text-sm font-medium rounded-t-lg ${aba === 'atendimento' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : ''}`}>Atendimento</button>
                <button onClick={() => setAba('procedimentos')} className={`px-4 py-2 text-sm font-medium rounded-t-lg ${aba === 'procedimentos' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : ''}`}>Procedimentos</button>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Aba Paciente */}
                {aba === 'paciente' && (
                  <div className="space-y-4">
                    <div><label className="block text-sm font-medium mb-1">Buscar Paciente</label><div className="relative"><MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Digite nome, CPF ou data de nascimento (DD/MM/AAAA)..." className="w-full pl-8 pr-3 py-2 border rounded-lg" /></div></div>
                    <div><label className="block text-sm font-medium mb-1">Paciente *</label><select value={formData.paciente_id} onChange={e => handlePacienteChange(e.target.value)} className="w-full border rounded-lg px-3 py-2" required><option value="">Selecione um paciente</option>{pacientes.map(p => <option key={p.id} value={p.id}>{p.nome} - {p.cpf} - Nasc: {p.data_nascimento ? format(new Date(p.data_nascimento), 'dd/MM/yyyy') : '---'} - Carteira: {p.numero_carteira}</option>)}</select></div>
                    <div><label className="block text-sm font-medium mb-1">Observações</label><textarea rows="3" value={formData.observacao} onChange={e => setFormData({...formData, observacao: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                    {editing && <div><label className="block text-sm font-medium mb-1">Status</label><select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border rounded-lg px-3 py-2">{STATUS_ATENDIMENTO.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>}
                  </div>
                )}

                {/* Aba Autorização - usando procedimentosFiltrados */}
                {aba === 'autorizacao' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div><label className="block text-sm font-medium mb-1">Número da Guia (Operadora)</label><input type="text" value={formData.numero_guia_operadora} onChange={e => setFormData({...formData, numero_guia_operadora: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                      <div><label className="block text-sm font-medium mb-1">Data da Autorização</label><input type="date" value={formData.data_autorizacao} onChange={e => setFormData({...formData, data_autorizacao: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                      <div><label className="block text-sm font-medium mb-1">Data Validade da Senha</label><input type="date" value={formData.data_validade_senha} onChange={e => setFormData({...formData, data_validade_senha: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                      <div><label className="block text-sm font-medium mb-1">Senha de Autorização</label><input type="text" value={formData.senha_autorizacao} onChange={e => setFormData({...formData, senha_autorizacao: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                    </div>
                    <div><h4 className="font-semibold mb-2">Procedimentos Autorizados pelo Convênio</h4>
                      <div className="relative"><MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-3 text-gray-400" /><input type="text" value={searchItemTerm} onChange={e => setSearchItemTerm(e.target.value)} placeholder="Digite o código ou descrição do procedimento autorizado..." className="w-full pl-8 pr-3 py-2 border rounded-lg mb-2" list="aut-suggestions" /><datalist id="aut-suggestions">{procedimentosFiltrados.slice(0, 20).map(item => <option key={item.codigo_tuss} value={item.codigo_tuss}>{item.codigo_tuss} - {item.nome}</option>)}</datalist></div>
                      {searchItemTerm && procedimentosFiltrados.length > 0 && <div className="border rounded-lg mb-2 max-h-48 overflow-y-auto">{procedimentosFiltrados.slice(0, 10).map(item => <button key={item.codigo_tuss} type="button" onClick={() => handleProcedimentoItemChange(item.codigo_tuss)} className="w-full text-left px-3 py-2 border-b hover:bg-gray-50">{item.codigo_tuss} - {item.nome} <span className="float-right text-green-600">R$ {calcularValor(item, convenios.find(c => c.id === formData.convenio_id)).toFixed(2)}</span></button>)}</div>}
                      {currentItem.codigo && (
                        <div className="border rounded-lg p-4 bg-gray-50 mb-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div><label className="block text-xs">Código</label><input type="text" value={currentItem.codigo} disabled className="w-full bg-gray-100 rounded px-2 py-1" /></div>
                            <div className="md:col-span-2"><label className="block text-xs">Procedimento</label><input type="text" value={currentItem.nome} disabled className="w-full bg-gray-100 rounded px-2 py-1" /></div>
                            <div><label className="block text-xs">Qtd. Autorizada</label><input type="number" min="1" value={currentItem.quantidade_autorizada} onChange={e => setCurrentItem({...currentItem, quantidade_autorizada: parseInt(e.target.value)||1, valor_total: (parseInt(e.target.value)||1)*currentItem.valor_unitario})} className="w-full border rounded px-2 py-1" /></div>
                            <div><label className="block text-xs">Valor Unit. (R$)</label><input type="number" step="0.01" value={currentItem.valor_unitario} onChange={e => setCurrentItem({...currentItem, valor_unitario: parseFloat(e.target.value)||0, valor_total: currentItem.quantidade_autorizada * (parseFloat(e.target.value)||0)})} className="w-full border rounded px-2 py-1 text-right" /></div>
                            <div><button type="button" onClick={handleAdicionarItemAutorizado} className="w-full bg-green-600 text-white px-2 py-2 rounded-lg mt-2">+ Adicionar</button></div>
                          </div>
                        </div>
                      )}
                      {itensAutorizados.length > 0 && (
                        <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr><th>Código</th><th>Descrição</th><th>Qtd Aut.</th><th>Qtd Util.</th><th>Saldo</th><th>Valor Unit.</th><th>Ações</th></tr></thead><tbody>{itensAutorizados.map(item => <tr key={item.id} className="border-t"><td className="px-2 py-1 font-mono text-blue-600">{item.codigo}</td><td className="px-2 py-1">{item.nome}</td><td className="px-2 py-1 text-center">{item.quantidade_autorizada}</td><td className="px-2 py-1 text-center">{item.quantidade_utilizada||0}</td><td className="px-2 py-1 text-center text-green-600">{item.quantidade_autorizada - (item.quantidade_utilizada||0)}</td><td className="px-2 py-1 text-right">R$ {item.valor_unitario.toFixed(2)}</td><td className="px-2 py-1 text-center"><button type="button" onClick={() => removerItemAutorizado(item.id)} className="text-red-600"><TrashIcon className="w-4 h-4" /></button></td></tr>)}</tbody></table></div>
                      )}
                    </div>
                  </div>
                )}

                {/* Aba Solicitante (resumida para brevidade, igual ao original) */}
                {aba === 'solicitante' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Código na Operadora</label><input type="text" value={formData.codigo_operadora} onChange={e => setFormData({...formData, codigo_operadora: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm font-medium mb-1">Nome do Contratado</label><input type="text" value={formData.nome_contratado} onChange={e => setFormData({...formData, nome_contratado: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm font-medium mb-1">Buscar Profissional por Nº Conselho</label><input type="text" value={buscaProfissional} onChange={e => { setBuscaProfissional(e.target.value); buscarProfissionalPorConselho(e.target.value); }} className="w-full border rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm font-medium mb-1">Nome do Profissional Solicitante</label><input type="text" value={formData.profissional_solicitante} onChange={e => setFormData({...formData, profissional_solicitante: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm font-medium mb-1">Conselho Profissional</label><select value={formData.conselho_solicitante} onChange={e => setFormData({...formData, conselho_solicitante: e.target.value})} className="w-full border rounded-lg px-3 py-2">{CONSELHOS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
                    <div><label className="block text-sm font-medium mb-1">Número no Conselho</label><input type="text" value={formData.numero_conselho_solicitante} onChange={e => setFormData({...formData, numero_conselho_solicitante: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm font-medium mb-1">UF do Conselho</label><select value={formData.uf_solicitante} onChange={e => setFormData({...formData, uf_solicitante: e.target.value})} className="w-full border rounded-lg px-3 py-2">{UF_OPCOES.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}</select></div>
                    <div><label className="block text-sm font-medium mb-1">CBOS</label><input type="text" value={formData.cbos_solicitante} onChange={e => setFormData({...formData, cbos_solicitante: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                  </div>
                )}

                {/* Aba Atendimento (resumida) */}
                {aba === 'atendimento' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Caráter do Atendimento</label><select value={formData.carater_atendimento} onChange={e => setFormData({...formData, carater_atendimento: e.target.value})} className="w-full border rounded-lg px-3 py-2">{CARATER_ATENDIMENTO.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
                    <div><label className="block text-sm font-medium mb-1">Data da Solicitação</label><input type="date" value={formData.data_solicitacao} onChange={e => setFormData({...formData, data_solicitacao: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm font-medium mb-1">Tipo de Atendimento</label><select value={formData.tipo_atendimento} onChange={e => setFormData({...formData, tipo_atendimento: e.target.value})} className="w-full border rounded-lg px-3 py-2">{TIPO_ATENDIMENTO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                    <div><label className="block text-sm font-medium mb-1">Indicação de Acidente</label><select value={formData.indicacao_acidente} onChange={e => setFormData({...formData, indicacao_acidente: e.target.value})} className="w-full border rounded-lg px-3 py-2">{INDICADOR_ACIDENTE.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}</select></div>
                    <div><label className="block text-sm font-medium mb-1">Tipo de Consulta</label><select value={formData.tipo_consulta} onChange={e => setFormData({...formData, tipo_consulta: e.target.value})} className="w-full border rounded-lg px-3 py-2">{TIPO_CONSULTA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                    <div><label className="block text-sm font-medium mb-1">Regime de Atendimento</label><select value={formData.regime_atendimento} onChange={e => setFormData({...formData, regime_atendimento: e.target.value})} className="w-full border rounded-lg px-3 py-2">{REGIME_ATENDIMENTO.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
                    <div><label className="block text-sm font-medium mb-1">Cobertura Especial</label><select value={formData.cobertura_especial} onChange={e => setFormData({...formData, cobertura_especial: e.target.value})} className="w-full border rounded-lg px-3 py-2">{COBERTURA_ESPECIAL.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
                    <div><label className="block text-sm font-medium mb-1">Saúde Ocupacional</label><select value={formData.saude_ocupacional} onChange={e => setFormData({...formData, saude_ocupacional: e.target.value})} className="w-full border rounded-lg px-3 py-2">{SAUDE_OCUPACIONAL.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
                    <div><label className="block text-sm font-medium mb-1">Motivo de Encerramento</label><select value={formData.motivo_encerramento} onChange={e => setFormData({...formData, motivo_encerramento: e.target.value})} className="w-full border rounded-lg px-3 py-2">{MOTIVO_ENCERRAMENTO.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select></div>
                    <div className="md:col-span-3"><label className="block text-sm font-medium mb-1">Indicação Clínica</label><textarea rows="3" value={formData.indicacao_clinica} onChange={e => setFormData({...formData, indicacao_clinica: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                  </div>
                )}

                {/* Aba Procedimentos - usando procedimentosFiltrados */}
                {aba === 'procedimentos' && (
                  <div className="space-y-4">
                    {itensGuia.length > 0 && (
                      <div className="border rounded-xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr><th>Seq</th><th>Data</th><th>H.Início</th><th>H.Fim</th><th>Código</th><th>Descrição</th><th>Qtd</th><th>Valor Unit.</th><th>Valor Total</th><th>Profissional</th><th>Ações</th></tr></thead><tbody>{itensGuia.map((item, idx) => <tr key={item.id} className={`border-t ${item.pendente_autorizacao ? 'bg-orange-50' : ''}`}><td className="px-2 py-2 text-center">{idx+1}</td><td className="px-2 py-2">{item.data_execucao}</td><td className="px-2 py-2">{item.hora_inicial}</td><td className="px-2 py-2">{item.hora_final}</td><td className="px-2 py-2 font-mono text-blue-600">{item.codigo}</td><td className="px-2 py-2">{item.nome}{item.pendente_autorizacao && <span className="ml-1 text-xs text-orange-600">(Sem autorização)</span>}</td><td className="px-2 py-2 text-center font-medium">{item.quantidade}</td><td className="px-2 py-2 text-right">R$ {item.valor_unitario.toFixed(2)}</td><td className="px-2 py-2 text-right font-semibold">R$ {item.valor_total.toFixed(2)}</td><td className="px-2 py-2 text-xs">{item.prestador_nome}<br/><span className="text-gray-400">{item.prestador_conselho === '06' ? 'CRM' : ''} {item.prestador_numero_conselho}</span></td><td className="px-2 py-2 text-center"><div className="flex gap-1"><button type="button" onClick={() => handleEditItem(item)} className="text-blue-600"><PencilIcon className="w-3 h-3" /></button><button type="button" onClick={() => removerItem(item.id)} className="text-red-600"><TrashIcon className="w-3 h-3" /></button></div></td></tr>)}</tbody><tfoot className="bg-gray-50"><tr><td colSpan="8" className="px-2 py-2 text-right font-semibold">Total:</td><td className="px-2 py-2 text-right font-bold">R$ {itensGuia.reduce((s,i)=>s+(i.valor_total||0),0).toFixed(2)}</td><td></td></tr></tfoot></table></div></div>
                    )}

                    {/* Seletor de tipo de item */}
                    <div className="flex gap-2 border-b pb-2">{TIPOS_ITEM.map(tipo => <button key={tipo.value} type="button" onClick={() => { setTipoItem(tipo.value); setTabelaSelecionada(tipo.tabelas[0]); setCurrentItem({...currentItem, tipo: tipo.value, tabela_referencia: tipo.tabelas[0]}); }} className={`px-3 py-1 rounded-lg text-xs font-medium ${tipoItem === tipo.value ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>{tipo.label}</button>)}</div>

                    <div><label className="block text-sm font-medium mb-1">Buscar Item</label><div className="relative"><MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" value={searchItemTerm} onChange={e => setSearchItemTerm(e.target.value)} placeholder="Digite o código ou descrição..." className="w-full pl-8 pr-3 py-2 border rounded-lg" list="proc-suggestions" /><datalist id="proc-suggestions">{procedimentosFiltrados.slice(0, 20).map(item => <option key={item.codigo_tuss} value={item.codigo_tuss}>{item.codigo_tuss} - {item.nome}</option>)}</datalist></div></div>

                    {searchItemTerm && procedimentosFiltrados.length > 0 && (
                      <div className="border rounded-xl max-h-48 overflow-y-auto">{procedimentosFiltrados.slice(0, 10).map(item => {
                        const itemAutorizado = itensAutorizados.find(aut => aut.codigo === item.codigo_tuss);
                        const saldo = itemAutorizado ? (itemAutorizado.quantidade_autorizada - (itemAutorizado.quantidade_utilizada || 0)) : 0;
                        return <button key={item.codigo_tuss} type="button" onClick={() => handleProcedimentoItemChange(item.codigo_tuss)} className="w-full text-left px-3 py-2 border-b hover:bg-gray-50"><div className="flex justify-between"><span><span className="font-mono text-blue-600">{item.codigo_tuss}</span> - {item.nome}</span><span className="text-green-600">R$ {calcularValor(item, convenios.find(c => c.id === formData.convenio_id)).toFixed(2)}</span></div>{itemAutorizado && <div className="text-xs text-blue-600">Autorizado: {saldo} disponível</div>}</button>;
                      })}</div>
                    )}

                    {currentItem.codigo && (
                      <div className="border-t pt-4 mt-2">
                        <div className="grid grid-cols-2 md:grid-cols-12 gap-2 items-end">
                          <div className="md:col-span-1"><label className="block text-xs">Data</label><input type="date" value={currentItem.data_execucao} onChange={e => setCurrentItem({...currentItem, data_execucao: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" /></div>
                          <div className="md:col-span-1"><label className="block text-xs">H.Início</label><input type="time" value={currentItem.hora_inicial} onChange={e => setCurrentItem({...currentItem, hora_inicial: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" /></div>
                          <div className="md:col-span-1"><label className="block text-xs">H.Fim</label><input type="time" value={currentItem.hora_final} onChange={e => setCurrentItem({...currentItem, hora_final: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" /></div>
                          <div className="md:col-span-1"><label className="block text-xs">Via Acesso</label><select value={currentItem.viaAcesso} onChange={e => setCurrentItem({...currentItem, viaAcesso: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm"><option value="1">Única</option><option value="2">Mesma via</option><option value="3">Diferentes vias</option></select></div>
                          <div className="md:col-span-1"><label className="block text-xs">Técnica</label><select value={currentItem.tecnicaUtilizada} onChange={e => setCurrentItem({...currentItem, tecnicaUtilizada: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm"><option value="1">Convencional</option><option value="2">Vídeo</option><option value="3">Robótica</option></select></div>
                          <div className="md:col-span-1"><label className="block text-xs">Red./Acr.</label><input type="number" step="0.01" value={currentItem.reducaoAcrescimo} onChange={e => setCurrentItem({...currentItem, reducaoAcrescimo: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm text-center" /></div>
                          <div className="md:col-span-2"><input type="text" value={currentItem.nome} disabled className="w-full bg-gray-100 border rounded px-2 py-1.5 text-sm" /></div>
                          <div className="md:col-span-1"><label className="block text-xs">Qtd</label><input type="number" min="1" value={currentItem.quantidade} onChange={e => { const qtd = parseInt(e.target.value)||1; const saldo = itensAutorizados.find(aut=>aut.codigo===currentItem.codigo)?.saldo_autorizado || 0; setCurrentItem({...currentItem, quantidade: qtd, saldo_autorizado: saldo, valor_total: qtd * currentItem.valor_unitario}); }} className="w-full border rounded px-2 py-1.5 text-sm text-center" />{currentItem.saldo_autorizado > 0 && <span className="text-xs text-green-600">Saldo: {currentItem.saldo_autorizado}</span>}</div>
                          <div className="md:col-span-2"><label className="block text-xs">Valor Unitário</label><input type="number" step="0.01" value={currentItem.valor_unitario} onChange={e => { const val = parseFloat(e.target.value)||0; setCurrentItem({...currentItem, valor_unitario: val, valor_total: currentItem.quantidade * val}); }} className="w-full border rounded px-2 py-1.5 text-sm text-right" /></div>
                          <div className="md:col-span-3"><label className="block text-xs">Profissional</label><select value={currentItem.prestador_id} onChange={e => { const p = prestadores.find(pr => pr.id === parseInt(e.target.value)); if(p) setCurrentItem({...currentItem, prestador_id: e.target.value, prestador_nome: p.nome, prestador_cpf: p.cpf, prestador_conselho: p.codigo_conselho_ans||'06', prestador_numero_conselho: p.numero_conselho, prestador_uf_conselho: p.uf_conselho||'35', prestador_cbos: p.cbos||'225125'}); }} className="w-full border rounded px-2 py-1.5 text-sm"><option value="">Selecione</option>{prestadores.map(p => <option key={p.id} value={p.id}>{p.nome} - {p.codigo_conselho_ans === '06' ? 'CRM' : ''} {p.numero_conselho}</option>)}</select></div>
                          <div className="md:col-span-1"><button type="button" onClick={handleAdicionarItem} className="w-full bg-green-600 text-white px-2 py-1.5 rounded-lg text-sm mt-5">+ Add</button></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button type="button" onClick={resetModal} className="px-4 py-2 border rounded-lg">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md">Salvar Guia</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
