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
  LockClosedIcon,      // ADICIONAR ESTE
  LockOpenIcon         // ADICIONAR ESTE TAMBÉM (se for usado)
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { supabase } from '../lib/supabaseClient';

// ============================================
// CONSTANTES E TABELAS
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

// Tipos de itens para faturamento
const TIPOS_ITEM = [
  { value: 'procedimento', label: 'Procedimento', tabelas: ['22', '00', '98'] },
  { value: 'material', label: 'Material/OPME', tabelas: ['19'] },
  { value: 'medicamento', label: 'Medicamento', tabelas: ['20'] },
  { value: 'diaria', label: 'Diária/Taxa', tabelas: ['18'] },
  { value: 'pacote', label: 'Pacote', tabelas: ['98'] },
  { value: 'outros', label: 'Outras Despesas', tabelas: ['00'] }
];

// Tabelas disponíveis
const TABELAS = {
  '22': { nome: 'TUSS - Procedimentos', tipo: 'procedimento' },
  '00': { nome: 'Tabela Própria', tipo: 'procedimento' },
  '98': { nome: 'Pacotes de Serviços', tipo: 'pacote' },
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

// Unidades de medida
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
  const [procedimentos, setProcedimentos] = useState([]);
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
  
  // Itens da guia (executados)
  const [itensGuia, setItensGuia] = useState([]);
  // Itens autorizados pelo convênio
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
    viaAcesso: '1',        // 1=Ambulatorial, 2=Hospitalar, 3=Domiciliar, 4=Outros
    tecnicaUtilizada: '1', // 1=Convencional, 2=Vídeo, 3=Robótica, 4=Outras
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
  // FUNÇÕES DE AUTORIZAÇÃO E VALIDAÇÃO
  // ============================================

  // Calcular status da guia baseado nos itens autorizados vs executados
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

  // Verificar se um item pode ser adicionado (respeitando autorização)
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

  // Atualizar quantidade utilizada nos itens autorizados
  const atualizarQuantidadeUtilizada = useCallback((itemCodigo, quantidade, isAdicionando = true) => {
    setItensAutorizados(prev => {
      const novosItens = prev.map(aut => {
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
      
      console.log('📊 Itens autorizados atualizados:', novosItens); // Debug
      return novosItens;
    });
  }, []);

  // Verificar se a guia pode ser faturada - USANDO OS ITENS DO ATENDIMENTO
  const podeFaturar = useCallback((atendimento) => {
    if (!atendimento.itens || atendimento.itens.length === 0) {
      toast.error('Não é possível faturar: Nenhum item na guia');
      return false;
    }
    
    // USAR OS ITENS AUTORIZADOS DO PRÓPRIO ATENDIMENTO
    const itensAutorizadosDoAtendimento = atendimento.itens_autorizados || [];
    
    // Se não há itens autorizados, não pode faturar
    if (itensAutorizadosDoAtendimento.length === 0) {
      toast.error('Não é possível faturar: Nenhum procedimento autorizado pelo convênio');
      return false;
    }
    
    // Verificar se há itens autorizados não executados
    const itensAutorizadosNaoExecutados = itensAutorizadosDoAtendimento.filter(aut => {
      const itemExecutado = atendimento.itens.find(item => item.codigo === aut.codigo);
      const quantidadeUtilizada = itemExecutado?.quantidade || 0;
      return quantidadeUtilizada < aut.quantidade_autorizada;
    });
    
    if (itensAutorizadosNaoExecutados.length > 0) {
      toast.error(`Existem ${itensAutorizadosNaoExecutados.length} procedimento(s) autorizado(s) não executado(s) integralmente!`);
      return false;
    }
    
    // Verificar se algum item excedeu a quantidade autorizada
    const itensExcedidos = atendimento.itens.filter(item => {
      const itemAutorizado = itensAutorizadosDoAtendimento.find(aut => aut.codigo === item.codigo);
      if (itemAutorizado && item.quantidade > itemAutorizado.quantidade_autorizada) {
        return true;
      }
      return false;
    });
    
    if (itensExcedidos.length > 0) {
      toast.error(`${itensExcedidos.length} item(ns) excederam a quantidade autorizada!`);
      return false;
    }
    
    // Verificar se algum item está pendente de autorização (não autorizado)
    const itensPendentes = atendimento.itens.filter(item => {
      const itemAutorizado = itensAutorizadosDoAtendimento.find(aut => aut.codigo === item.codigo);
      return !itemAutorizado;
    });
    
    if (itensPendentes.length > 0) {
      toast.error(`${itensPendentes.length} item(ns) não possuem autorização!`);
      return false;
    }
    
    return true;
  }, []); // Sem dependências - usa os dados do atendimento

  // Calcular saldo autorizado para edição (usando estado local)
  const calcularSaldoAutorizado = useCallback((itemCodigo, quantidadeAtual = 0) => {
    const itemAutorizado = itensAutorizados.find(aut => aut.codigo === itemCodigo);
    if (!itemAutorizado) return 0;
    return itemAutorizado.quantidade_autorizada - (itemAutorizado.quantidade_utilizada || 0);
  }, [itensAutorizados]);

  // ============================================
  // CARREGAR DADOS DO SUPABASE
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
      setProcedimentos(procedimentosRes.data || []);
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

  // Salvar atendimento no Supabase
  const salvarAtendimento = async (atendimento) => {
    try {
      if (editing) {
        // Remover campos que não devem ser atualizados
        const { 
          id,                      // não enviar no update
          numero_guia_prestador,   // não atualizar número da guia
          created_at,              // não atualizar
          ...dadosParaAtualizar 
        } = atendimento;
        
        // Garantir que apenas campos que existem na tabela sejam enviados
        const { error } = await supabase
          .from('atendimentos')
          .update({
            ...dadosParaAtualizar,
            updated_at: new Date().toISOString()
          })
          .eq('id', editing.id);
        
        if (error) {
          console.error('Erro detalhado:', error);
          throw error;
        }
        
        toast.success('Atendimento atualizado com sucesso!');
      } else {
        // Para novo atendimento, incluir todos os campos
        const { data, error } = await supabase
          .from('atendimentos')
          .insert([{
            ...atendimento,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select();
        
        if (error) {
          console.error('Erro detalhado:', error);
          throw error;
        }
        
        toast.success('Atendimento registrado com sucesso!');
      }
      
      await carregarDados();
      return true;
    } catch (error) {
      console.error('Erro ao salvar atendimento:', error);
      
      // Mensagem mais detalhada
      if (error.message?.includes('status')) {
        toast.error('Status inválido. Verifique se "finalizado" está na lista de status permitidos.');
      } else if (error.message?.includes('duplicate')) {
        toast.error('Número de guia já existe.');
      } else if (error.code === 'PGRST204') {
        toast.error('Coluna não encontrada na tabela. Verifique os campos enviados.');
      } else {
        toast.error(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`);
      }
      
      return false;
    }
  };

  // Excluir atendimento
  const excluirAtendimento = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este atendimento?')) return;
    
    try {
      const { error } = await supabase
        .from('atendimentos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Atendimento excluído com sucesso!');
      await carregarDados();
    } catch (error) {
      console.error('Erro ao excluir atendimento:', error);
      toast.error('Erro ao excluir atendimento');
    }
  };

  // Atualizar status do atendimento
  const atualizarStatus = async (id, status) => {
    // Buscar o atendimento atualizado com todos os dados
    const atendimento = atendimentos.find(a => a.id === id);
    
    if (!atendimento) {
      toast.error('Atendimento não encontrado');
      return;
    }
    
    // Se for para faturado, validar
    if (status === 'faturado') {
      if (!podeFaturar(atendimento)) {
        return;
      }
    }
    
    // Para outros status, permitir diretamente
    try {
      const { error } = await supabase
        .from('atendimentos')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success(`Atendimento ${status === 'faturado' ? 'enviado para faturamento!' : 'atualizado para ' + STATUS_ATENDIMENTO.find(s => s.value === status)?.label || status}`);
      await carregarDados();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  // Recalcular status da guia baseado nos itens atuais
  const recalcularStatus = useCallback(() => {
    const novoStatus = calcularStatusGuia(itensGuia, itensAutorizados);
    setFormData(prev => ({ ...prev, status: novoStatus }));
  }, [itensGuia, itensAutorizados, calcularStatusGuia]);
  
  // Chamar recalcularStatus sempre que itensGuia ou itensAutorizados mudarem
  useEffect(() => {
    if (!editing && (itensGuia.length > 0 || itensAutorizados.length > 0)) {
      recalcularStatus();
    }
  }, [itensGuia, itensAutorizados, recalcularStatus, editing]);

  // Alterar status manualmente via botão
  const alterarStatusManual = async (id, novoStatus) => {
    const atendimento = atendimentos.find(a => a.id === id);
    
    if (!atendimento) {
      toast.error('Atendimento não encontrado');
      return;
    }
    
    // Se for mudar para autorizado, verificar se tem itens autorizados
    if (novoStatus === 'autorizado') {
      const itensAutorizadosDoAtendimento = atendimento.itens_autorizados || [];
      if (itensAutorizadosDoAtendimento.length === 0) {
        toast.error('Não é possível autorizar: Não há itens autorizados pelo convênio');
        return;
      }
    }
    
    // Se for mudar para faturado, validar
    if (novoStatus === 'faturado') {
      if (!podeFaturar(atendimento)) {
        return;
      }
    }
    
    try {
      const { error } = await supabase
        .from('atendimentos')
        .update({ status: novoStatus, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success(`Status alterado para ${STATUS_ATENDIMENTO.find(s => s.value === novoStatus)?.label || novoStatus}`);
      await carregarDados();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status');
    }
  };
  
  // Atualizar número da guia no convênio
  const atualizarProximoNumeroGuia = async (convenioId, proximoNumero) => {
    try {
      const { error } = await supabase
        .from('convenios')
        .update({ proximo_numero_guia: proximoNumero, updated_at: new Date().toISOString() })
        .eq('id', convenioId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao atualizar número da guia:', error);
    }
  };

  // Buscar profissional por número do conselho
  const buscarProfissionalPorConselho = useCallback(async (numeroConselho) => {
    if (!numeroConselho || numeroConselho.length < 3) return;
    
    setBuscandoProfissional(true);
    try {
      const { data, error } = await supabase
        .from('prestadores')
        .select('*')
        .eq('numero_conselho', numeroConselho)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setFormData(prev => ({
          ...prev,
          profissional_solicitante: data.nome,
          conselho_solicitante: data.codigo_conselho_ans || '06',
          numero_conselho_solicitante: data.numero_conselho,
          uf_solicitante: data.uf_conselho || '35',
          cbos_solicitante: data.cbos || '225125'
        }));
        toast.success(`Profissional ${data.nome} encontrado!`);
      }
    } catch (error) {
      console.error('Erro ao buscar profissional:', error);
    } finally {
      setBuscandoProfissional(false);
    }
  }, []);

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
    
    if (item.tabela === 'PACOTE' || item.tabela === '98' || item.codigo_tuss?.startsWith('666')) {
      valorBase = item.valor_sugerido || 100;
    }
    
    if (item.tabela === 'CBHPM' && item.ch_base) {
      const ch = item.ch_base;
      const valorCH = convenio?.valor_ch || 100;
      valorBase = ch * valorCH;
    }
    
    if (item.tabela === 'AMB') {
      if (item.tipo === 'CONSULTA') {
        valorBase = item.ch_consulta || valorBase;
      } else if (item.tipo === 'EXAME') {
        valorBase = item.ch_exame || valorBase;
      }
    }
    
    return valorBase * multiplicador;
  };

  // Adicionar item autorizado (do convênio)
  const handleAdicionarItemAutorizado = () => {
    if (!currentItem.codigo) {
      toast.error('Selecione um procedimento');
      return;
    }
    
    if (itensAutorizados.some(item => item.codigo === currentItem.codigo)) {
      toast.warning('Este procedimento já foi autorizado!');
      return;
    }
    
    const itemSelecionado = procedimentos.find(p => p.codigo_tuss === currentItem.codigo);
    const convenio = convenios.find(c => c.id === formData.convenio_id);
    
    let valorUnitario = currentItem.valor_unitario;
    if (!valorUnitario && itemSelecionado) {
      valorUnitario = calcularValor(itemSelecionado, convenio);
    }
    
    const novoItemAutorizado = {
      id: Date.now() + Math.random(),
      tipo: 'procedimento',
      codigo: currentItem.codigo,
      nome: currentItem.nome || itemSelecionado?.nome,
      quantidade_autorizada: currentItem.quantidade_autorizada || 1,
      quantidade_utilizada: 0,
      valor_unitario: valorUnitario,
      valor_total: valorUnitario * (currentItem.quantidade_autorizada || 1),
      data_autorizacao: formData.data_autorizacao || new Date().toISOString().split('T')[0],
      saldo_autorizado: currentItem.quantidade_autorizada || 1,
      pendente_autorizacao: false
    };
    
    setItensAutorizados([...itensAutorizados, novoItemAutorizado]);
    
    setCurrentItem({
      ...currentItem,
      codigo: '',
      nome: '',
      quantidade_autorizada: 0,
      quantidade: 1,
      valor_unitario: 0,
      valor_total: 0
    });
    setSearchItemTerm('');
    toast.success('Procedimento autorizado adicionado!');
  };

  // Editar item da guia (executado)
  const handleEditItem = (item) => {
    const saldo = calcularSaldoAutorizado(item.codigo, item.quantidade);
    const itemAutorizado = itensAutorizados.find(aut => aut.codigo === item.codigo);
    
    setEditandoItem(item);
    setCurrentItem({
      ...item,
      quantidade_autorizada: itemAutorizado?.quantidade_autorizada || 0,
      saldo_autorizado: saldo
    });
  };

  // Atualizar item editado (executado)
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
    
    const itemAtualizado = {
      ...currentItem,
      valor_total: valorTotal,
      pendente_autorizacao: pendenteAutorizacao
    };
    
    setItensGuia(itensGuia.map(item => 
      item.id === editandoItem.id ? { ...itemAtualizado, id: item.id } : item
    ));
    
    setEditandoItem(null);
    resetCurrentItem();
    toast.success('Item atualizado com sucesso!');
  };

  // Adicionar item executado
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
    
    const itemSelecionado = procedimentos.find(p => p.codigo_tuss === currentItem.codigo);
    const convenio = convenios.find(c => c.id === formData.convenio_id);
    
    let valorUnitario = currentItem.valor_unitario;
    if (!valorUnitario && itemSelecionado) {
      valorUnitario = calcularValor(itemSelecionado, convenio);
    }
    
    const valorTotal = currentItem.quantidade * valorUnitario;
    const prestador = prestadores.find(p => p.id === parseInt(currentItem.prestador_id));
    const pendenteAutorizacao = validacao.pendente || !itensAutorizados.some(aut => aut.codigo === currentItem.codigo);
    
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
      pendente_autorizacao: pendenteAutorizacao,
      // NOVOS CAMPOS
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
  
  const [searchPacienteTerm, setSearchPacienteTerm] = useState('');

  // Filtrar pacientes por nome, CPF ou data de nascimento - VERSÃO CORRIGIDA
  const pacientesFiltrados = useMemo(() => {
    if (!searchPacienteTerm || searchPacienteTerm.trim() === '') {
      return pacientes;
    }
    
    const term = searchPacienteTerm.toLowerCase().trim();
    
    // Tentar interpretar como data (formato DD/MM/AAAA)
    let dataBusca = null;
    if (term.includes('/')) {
      const partes = term.split('/');
      if (partes.length === 3) {
        const dia = parseInt(partes[0]);
        const mes = parseInt(partes[1]) - 1;
        const ano = parseInt(partes[2]);
        if (!isNaN(dia) && !isNaN(mes) && !isNaN(ano)) {
          dataBusca = new Date(ano, mes, dia);
          dataBusca.setHours(0, 0, 0, 0);
        }
      }
    }
    
    // Tentar interpretar como CPF (remover pontos e traços)
    const termLimpo = term.replace(/[\.\-]/g, '');
    
    return pacientes.filter(p => {
      // Buscar por nome
      if (p.nome && p.nome.toLowerCase().includes(term)) return true;
      
      // Buscar por CPF (remover pontos e traços)
      const cpfLimpo = p.cpf ? p.cpf.replace(/[\.\-]/g, '') : '';
      if (cpfLimpo && cpfLimpo.includes(termLimpo)) return true;
      
      // Buscar por data de nascimento
      if (dataBusca && p.data_nascimento) {
        const dataPaciente = new Date(p.data_nascimento);
        dataPaciente.setHours(0, 0, 0, 0);
        if (dataPaciente.getTime() === dataBusca.getTime()) return true;
      }
      
      // Buscar por número da carteira
      if (p.numero_carteira && p.numero_carteira.toLowerCase().includes(term)) return true;
      
      return false;
    });
  }, [pacientes, searchPacienteTerm]);
  
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

  const handleProcedimentoItemChange = (codigo) => {
    const procedimento = procedimentos.find(p => p.codigo_tuss === codigo);
    if (procedimento) {
      const convenio = convenios.find(c => c.id === formData.convenio_id);
      const valorCalculado = calcularValor(procedimento, convenio);
      const saldo = calcularSaldoAutorizado(codigo);
      const itemAutorizado = itensAutorizados.find(aut => aut.codigo === codigo);
      
      setCurrentItem({
        ...currentItem,
        codigo: procedimento.codigo_tuss,
        nome: procedimento.nome,
        valor_unitario: valorCalculado,
        quantidade_autorizada: itemAutorizado?.quantidade_autorizada || 0,
        saldo_autorizado: saldo,
        valor_total: (currentItem.quantidade || 1) * valorCalculado,
        tabela_referencia: procedimento.tabela === 'CBHPM' ? '98' : 
                          procedimento.tabela === 'AMB' ? '90' : 
                          procedimento.tabela === 'PACOTE' ? '98' : '22'
      });
      setSearchItemTerm('');
    }
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
      await atualizarProximoNumeroGuia(convenio.id, convenio.proximo_numero_guia + 1);
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

    if (editing) {
      novoAtendimento.id = editing.id;
    }

    const sucesso = await salvarAtendimento(novoAtendimento);
    if (sucesso) {
      resetModal();
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

  const handleEnviarFaturamento = (id) => {
    atualizarStatus(id, 'faturado');
  };

  const handleEdit = (atendimento) => {
    // 🔒 BLOQUEAR EDIÇÃO SE FOR FATURADO OU FINALIZADO
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
    
    // RECALCULAR SALDOS DOS ITENS AUTORIZADOS
    const itensAutorizadosAtualizados = (atendimento.itens_autorizados || []).map(aut => {
      // Somar quantidades utilizadas pelos itens executados
      let quantidadeUtilizada = 0;
      (atendimento.itens || []).forEach(itemExecutado => {
        if (itemExecutado.codigo === aut.codigo) {
          quantidadeUtilizada += (itemExecutado.quantidade || 0);
        }
      });
      
      return {
        ...aut,
        quantidade_utilizada: quantidadeUtilizada,
        saldo_autorizado: aut.quantidade_autorizada - quantidadeUtilizada
      };
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
    
    console.log('📊 Itens autorizados recalculados:', itensAutorizadosAtualizados);
    
    setShowModal(true);
  };
  
  const handleDelete = (id) => {
    const atendimento = atendimentos.find(a => a.id === id);
    
    // 🔒 BLOQUEAR EXCLUSÃO SE FOR FATURADO OU FINALIZADO
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
  
  // Adicionar função para verificar se pode editar (usada nos botões)
  const podeEditar = (status) => {
    return status !== 'faturado' && status !== 'finalizado';
  };
  
  // Logo após as outras variáveis de contagem
  const pendentes = atendimentos.filter(a => a.status === 'pendente').length;
  const autorizados = atendimentos.filter(a => a.status === 'autorizado').length;
  const parciais = atendimentos.filter(a => a.status === 'parcial').length;
  const faturados = atendimentos.filter(a => a.status === 'faturado').length;
  const finalizados = atendimentos.filter(a => a.status === 'finalizado').length; // NOVO
  const valorTotalPendente = atendimentos.filter(a => a.status === 'pendente' || a.status === 'parcial').reduce((sum, a) => sum + (a.valor_total || 0), 0);
  
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
        {/* Header e Cards */}
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
            <button 
              onClick={() => { carregarDados(); }} 
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Recarregar
            </button>
            <button 
              onClick={() => { setEditing(null); resetModal(); setShowModal(true); }} 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg"
            >
              <PlusIcon className="w-4 h-4" /> Nova Guia
            </button>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
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
                <p className="text-xs text-gray-500 dark:text-gray-400">Autorizados</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{autorizados}</p>
              </div>
              <CheckIcon className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Autorização Parcial</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{parciais}</p>
              </div>
              <ExclamationTriangleIcon className="w-8 h-8 text-orange-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Faturados</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{faturados}</p>
              </div>
              <CurrencyDollarIcon className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Finalizados</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{finalizados}</p>
              </div>
              <LockClosedIcon className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Valor Pendente</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">R$ {valorTotalPendente.toFixed(2)}</p>
              </div>
              <CurrencyDollarIcon className="w-8 h-8 text-purple-500 opacity-50" />
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
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
              />
            </div>
            <select 
              value={filtroStatus} 
              onChange={(e) => setFiltroStatus(e.target.value)} 
              className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              <option value="todos">Todos os status</option>
              {STATUS_ATENDIMENTO.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select 
              value={filtroConvenio} 
              onChange={(e) => setFiltroConvenio(e.target.value)} 
              className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              <option value="todos">Todos os convênios</option>
              {convenios.map(c => (<option key={c.id} value={c.id}>{c.razao_social}</option>))}
            </select>
          </div>
        </div>

        {/* Tabela de Guias */}
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
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-36">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {atendimentosFiltrados.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {a.data_atendimento ? format(new Date(a.data_atendimento), 'dd/MM/yyyy') : 
                       (a.itens && a.itens[0] ? format(new Date(a.itens[0].data_execucao), 'dd/MM/yyyy') : '-')}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">
                      {a.numero_guia_prestador}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                      {a.paciente_nome}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">
                      {a.numero_carteira}
                    </td>
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
                    {/* Célula do Valor Total */}
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-700 dark:text-gray-300">
                      {a.valor_total ? `R$ ${a.valor_total.toFixed(2)}` : 'R$ 0,00'}
                    </td>
                    {/* Célula do Status */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusCor(a.status || 'pendente')}`}>
                        {STATUS_ATENDIMENTO.find(s => s.value === (a.status || 'pendente'))?.label || (a.status || 'Pendente')}
                      </span>
                    </td>
                    {/* Célula de Ações */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => handleViewItens(a)} className="p-1 rounded-lg text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Ver Itens">
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        
                        {/* Botão Autorizar - apenas para pendente/parcial */}
                        {(a.status === 'pendente' || a.status === 'parcial') && a.itens_autorizados?.length > 0 && (
                          <button onClick={() => alterarStatusManual(a.id, 'autorizado')} className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Autorizar">
                            <CheckIcon className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* Botão Faturar - apenas para não faturados/finalizados */}
                        {a.status !== 'faturado' && a.status !== 'cancelado' && a.status !== 'finalizado' && (
                          <button onClick={() => handleEnviarFaturamento(a.id)} className="p-1 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors" title="Faturar">
                            <CurrencyDollarIcon className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* Botão Cancelar - apenas para não cancelados/faturados/finalizados */}
                        {a.status !== 'cancelado' && a.status !== 'faturado' && a.status !== 'finalizado' && (
                          <button onClick={() => alterarStatusManual(a.id, 'cancelado')} className="p-1 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Cancelar">
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* Botão Editar - desabilitado para faturado/finalizado */}
                        <button 
                          onClick={() => handleEdit(a)} 
                          disabled={!podeEditar(a.status)}
                          className={`p-1 rounded-lg transition-colors ${podeEditar(a.status) ? 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20' : 'text-gray-400 cursor-not-allowed'}`} 
                          title={!podeEditar(a.status) ? 'Guia bloqueada para edição' : 'Editar'}
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        
                        {/* Botão Excluir - desabilitado para faturado/finalizado */}
                        <button 
                          onClick={() => handleDelete(a.id)} 
                          disabled={!podeEditar(a.status)}
                          className={`p-1 rounded-lg transition-colors ${podeEditar(a.status) ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-gray-400 cursor-not-allowed'}`} 
                          title={!podeEditar(a.status) ? 'Guia bloqueada para exclusão' : 'Excluir'}
                        >
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[80vh] overflow-y-auto">
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
                </div>
                
                {selectedGuia.status === 'parcial' && (
                  <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-2">
                      <ExclamationTriangleIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      <span className="text-sm text-orange-700 dark:text-orange-300">
                        ⚠️ Esta guia possui itens pendentes de autorização ou com quantidade excedente.
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Itens Executados */}
                <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <CheckIcon className="w-4 h-4 text-green-600" />
                  Itens Executados
                </h4>
                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Seq</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Data</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">H.Início</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">H.Fim</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Código</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Descrição</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Qtd</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Valor Unit.</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Valor Total</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Profissional</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {(selectedGuia.itens || []).map((item, idx) => (
                        <tr key={idx} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${item.pendente_autorizacao ? 'bg-orange-50 dark:bg-orange-900/10' : ''}`}>
                          <td className="px-3 py-2 text-xs text-center font-medium">{idx + 1}</td>
                          <td className="px-3 py-2 text-xs">{item.data_execucao || '-'}</td>
                          <td className="px-3 py-2 text-xs">{item.hora_inicial || '-'}</td>
                          <td className="px-3 py-2 text-xs">{item.hora_final || '-'}</td>
                          <td className="px-3 py-2 text-xs font-mono text-blue-600">{item.codigo}</td>
                          <td className="px-3 py-2 text-xs">{item.nome}</td>
                          <td className="px-3 py-2 text-xs text-center font-medium">{item.quantidade}</td>
                          <td className="px-3 py-2 text-xs text-right">R$ {item.valor_unitario?.toFixed(2)}</td>
                          <td className="px-3 py-2 text-xs text-right font-semibold">R$ {item.valor_total?.toFixed(2)}</td>
                          <td className="px-3 py-2 text-xs">
                            <div>{item.prestador_nome || '-'}</div>
                            {item.prestador_numero_conselho && (
                              <div className="text-xs text-gray-400">
                                {item.prestador_conselho === '06' ? 'CRM' : 
                                 item.prestador_conselho === '08' ? 'CRO' :
                                 item.prestador_conselho === '03' ? 'CRF' :
                                 item.prestador_conselho === '02' ? 'COREN' :
                                 item.prestador_conselho === '05' ? 'CREFITO' :
                                 item.prestador_conselho === '09' ? 'CRP' :
                                 item.prestador_conselho === '07' ? 'CRN' : ''} {item.prestador_numero_conselho} - {item.prestador_uf_conselho}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {item.pendente_autorizacao ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                <ExclamationTriangleIcon className="w-3 h-3" />
                                Pendente
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                Autorizado
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 dark:bg-gray-700/50">
                      <tr className="border-t">
                        <td colSpan="9" className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">Total da Guia:</td>
                        <td colSpan="2" className="px-3 py-2 text-right font-bold text-blue-600 dark:text-blue-400">R$ {selectedGuia.valor_total?.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                {/* Itens Autorizados */}
                {selectedGuia.itens_autorizados && selectedGuia.itens_autorizados.length > 0 && (
                  <>
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                      <DocumentPlusIcon className="w-4 h-4 text-blue-600" />
                      Itens Autorizados pelo Convênio
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Código</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Descrição</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Qtd Autorizada</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Qtd Utilizada</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Saldo</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Valor Unit.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {selectedGuia.itens_autorizados.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-3 py-2 text-xs font-mono text-blue-600">{item.codigo}</td>
                              <td className="px-3 py-2 text-xs">{item.nome}</td>
                              <td className="px-3 py-2 text-xs text-center font-medium">{item.quantidade_autorizada}</td>
                              <td className="px-3 py-2 text-xs text-center">{item.quantidade_utilizada || 0}</td>
                              <td className={`px-3 py-2 text-xs text-center font-semibold ${(item.saldo_autorizado || item.quantidade_autorizada - (item.quantidade_utilizada || 0)) > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                                {item.saldo_autorizado || item.quantidade_autorizada - (item.quantidade_utilizada || 0)}
                              </td>
                              <td className="px-3 py-2 text-xs text-right">R$ {item.valor_unitario?.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
                
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
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5 z-10">
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
                  <button onClick={() => setAba('paciente')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 ${aba === 'paciente' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                    <UserGroupIcon className="w-4 h-4 inline mr-1" /> Paciente
                  </button>
                  <button onClick={() => setAba('autorizacao')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 ${aba === 'autorizacao' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                    <CheckIcon className="w-4 h-4 inline mr-1" /> Autorização
                  </button>
                  <button onClick={() => setAba('solicitante')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 ${aba === 'solicitante' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                    <IdentificationIcon className="w-4 h-4 inline mr-1" /> Solicitante
                  </button>
                  <button onClick={() => setAba('atendimento')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 ${aba === 'atendimento' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                    <CalendarIcon className="w-4 h-4 inline mr-1" /> Atendimento
                  </button>
                  <button onClick={() => setAba('procedimentos')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 ${aba === 'procedimentos' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                    <BeakerIcon className="w-4 h-4 inline mr-1" /> Procedimentos
                  </button>
                </div>
                
                <form onSubmit={handleSubmit}>
                  {/* Aba Paciente */}
                  {aba === 'paciente' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buscar Paciente</label>
                        <div className="relative">
                          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Digite nome, CPF ou data de nascimento (DD/MM/AAAA)..."
                            value={searchPacienteTerm}
                            onChange={(e) => setSearchPacienteTerm(e.target.value)}
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                          />
                        </div>
                        {searchPacienteTerm && (
                          <p className="text-xs text-gray-500 mt-1">
                            {pacientesFiltrados.length} paciente(s) encontrado(s)
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paciente *</label>
                        <select 
                          value={formData.paciente_id} 
                          onChange={e => handlePacienteChange(e.target.value)} 
                          className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                          required
                        >
                          <option value="">Selecione um paciente</option>
                          {pacientesFiltrados.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.nome} - {p.cpf || 'SEM CPF'} - Nasc: {p.data_nascimento ? format(new Date(p.data_nascimento), 'dd/MM/yyyy') : '---'} - Carteira: {p.numero_carteira}
                            </option>
                          ))}
                        </select>
                        {pacientesFiltrados.length === 0 && searchPacienteTerm && (
                          <p className="text-xs text-red-500 mt-1">
                            Nenhum paciente encontrado com o termo "{searchPacienteTerm}"
                          </p>
                        )}
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
                          className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                          placeholder="Informações adicionais sobre o atendimento..."
                        />
                      </div>
                      
                      {editing && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                          <select 
                            value={formData.status} 
                            onChange={e => {
                              setFormData({...formData, status: e.target.value});
                            }} 
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                          >
                            {STATUS_ATENDIMENTO.map(s => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Aba Autorização */}
                  {aba === 'autorizacao' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          <strong>📋 Autorização da Guia:</strong> Registre aqui os procedimentos autorizados PELO CONVÊNIO/OPERADORA, com suas respectivas quantidades autorizadas.
                          Estes procedimentos serão usados como base para o faturamento e controle de saldo.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número da Guia (Operadora)</label>
                          <input 
                            type="text" 
                            value={formData.numero_guia_operadora} 
                            onChange={e => setFormData({...formData, numero_guia_operadora: e.target.value})} 
                            placeholder="Número fornecido pela operadora" 
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data da Autorização</label>
                          <input 
                            type="date" 
                            value={formData.data_autorizacao} 
                            onChange={e => setFormData({...formData, data_autorizacao: e.target.value})} 
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Validade da Senha</label>
                          <input 
                            type="date" 
                            value={formData.data_validade_senha} 
                            onChange={e => setFormData({...formData, data_validade_senha: e.target.value})} 
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha de Autorização</label>
                          <input 
                            type="text" 
                            value={formData.senha_autorizacao} 
                            onChange={e => setFormData({...formData, senha_autorizacao: e.target.value})} 
                            placeholder="Senha de acesso" 
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                          />
                        </div>
                      </div>
                  
                      {/* Busca e Inclusão de Itens Autorizados */}
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                        <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                          <PlusIcon className="w-4 h-4 text-green-600" />
                          Procedimentos Autorizados pelo Convênio
                        </h4>
                        
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buscar Procedimento</label>
                          <div className="relative">
                            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={searchItemTerm}
                              onChange={e => setSearchItemTerm(e.target.value)}
                              placeholder="Digite o código ou descrição do procedimento autorizado..."
                              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                              list="itens-suggestions-aut"
                            />
                            <datalist id="itens-suggestions-aut">
                              {itensFiltrados.slice(0, 20).map(item => (
                                <option key={item.codigo_tuss} value={item.codigo_tuss}>
                                  {item.codigo_tuss} - {item.nome}
                                </option>
                              ))}
                            </datalist>
                          </div>
                        </div>
                  
                        {searchItemTerm && itensFiltrados.length > 0 && (
                          <div className="border border-gray-200 dark:border-gray-700 rounded-xl max-h-48 overflow-y-auto mb-4">
                            {itensFiltrados.slice(0, 10).map(item => (
                              <button
                                key={item.codigo_tuss}
                                type="button"
                                onClick={() => {
                                  setCurrentItem({
                                    ...currentItem,
                                    codigo: item.codigo_tuss,
                                    nome: item.nome,
                                    quantidade_autorizada: 1,
                                    valor_unitario: item.valor_sugerido || 0,
                                    valor_total: item.valor_sugerido || 0
                                  });
                                  setSearchItemTerm('');
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 border-b last:border-b-0 transition-colors"
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    <span className="font-mono text-sm text-blue-600">{item.codigo_tuss}</span>
                                    <span className="text-sm text-gray-700 dark:text-gray-300 ml-2">{item.nome}</span>
                                  </div>
                                  <span className="text-sm font-semibold text-green-600">R$ {item.valor_sugerido?.toFixed(2)}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                  
                        {currentItem.codigo && (
                          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-700/30 mb-4">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                              <div className="md:col-span-3">
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Código</label>
                                <input type="text" value={currentItem.codigo} disabled className="w-full bg-gray-100 dark:bg-gray-600 border rounded-lg px-2 py-2 text-sm font-mono" />
                              </div>
                              <div className="md:col-span-4">
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Procedimento</label>
                                <input type="text" value={currentItem.nome} disabled className="w-full bg-gray-100 dark:bg-gray-600 border rounded-lg px-2 py-2 text-sm" />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Qtd. Autorizada</label>
                                <input 
                                  type="number" 
                                  min="1" 
                                  value={currentItem.quantidade_autorizada} 
                                  onChange={e => {
                                    const qtd = parseInt(e.target.value) || 1;
                                    setCurrentItem({
                                      ...currentItem,
                                      quantidade_autorizada: qtd,
                                      valor_total: qtd * currentItem.valor_unitario
                                    });
                                  }} 
                                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Valor Unit. (R$)</label>
                                <input 
                                  type="number" 
                                  step="0.01" 
                                  value={currentItem.valor_unitario} 
                                  onChange={e => {
                                    const valor = parseFloat(e.target.value) || 0;
                                    setCurrentItem({
                                      ...currentItem,
                                      valor_unitario: valor,
                                      valor_total: currentItem.quantidade_autorizada * valor
                                    });
                                  }} 
                                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                                />
                              </div>
                              <div className="md:col-span-1">
                                <button 
                                  type="button" 
                                  onClick={handleAdicionarItemAutorizado}
                                  className="w-full bg-green-600 text-white px-2 py-2 rounded-lg text-sm hover:bg-green-700 font-medium"
                                >
                                  + Adicionar
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                  
                        {itensAutorizados.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                              <CheckIcon className="w-4 h-4 text-green-600" />
                              Procedimentos Autorizados ({itensAutorizados.length})
                            </h4>
                            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Código</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Procedimento</th>
                                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Qtd. Autorizada</th>
                                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Qtd. Utilizada</th>
                                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Saldo</th>
                                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Valor Unit.</th>
                                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Valor Total</th>
                                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 w-16">Ações</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {itensAutorizados.map((item, idx) => {
                                      const saldo = item.quantidade_autorizada - (item.quantidade_utilizada || 0);
                                      return (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                          <td className="px-3 py-2 text-xs font-mono text-blue-600">{item.codigo}</td>
                                          <td className="px-3 py-2 text-xs text-gray-800 dark:text-gray-200">{item.nome}</td>
                                          <td className="px-3 py-2 text-xs text-center font-medium">{item.quantidade_autorizada}</td>
                                          <td className="px-3 py-2 text-xs text-center">{item.quantidade_utilizada || 0}</td>
                                          <td className={`px-3 py-2 text-xs text-center font-semibold ${saldo > 0 ? 'text-green-600' : saldo === 0 ? 'text-gray-600' : 'text-red-600'}`}>
                                            {saldo}
                                          </td>
                                          <td className="px-3 py-2 text-xs text-right">R$ {item.valor_unitario?.toFixed(2)}</td>
                                          <td className="px-3 py-2 text-xs text-right font-semibold">R$ {(item.valor_unitario * (item.quantidade_utilizada || 0)).toFixed(2)}</td>
                                          <td className="px-3 py-2 text-center">
                                            <button 
                                              type="button" 
                                              onClick={() => removerItemAutorizado(item.id)} 
                                              className="text-red-600 hover:text-red-800"
                                            >
                                              <TrashIcon className="w-4 h-4" />
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                  <tfoot className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr className="border-t">
                                      <td colSpan="6" className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">
                                        Total Autorizado:
                                      </td>
                                      <td className="px-3 py-2 text-right font-bold text-blue-600 dark:text-blue-400">
                                        R$ {itensAutorizados.reduce((sum, i) => sum + (i.valor_unitario * (i.quantidade_utilizada || 0)), 0).toFixed(2)}
                                      </td>
                                      <td className="px-3 py-2"></td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              * Ao adicionar itens na aba "Procedimentos", as quantidades serão automaticamente descontadas do saldo autorizado.
                            </p>
                          </div>
                        )}
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
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Contratado</label>
                          <input 
                            type="text" 
                            value={formData.nome_contratado} 
                            onChange={e => setFormData({...formData, nome_contratado: e.target.value})} 
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
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
                              placeholder="Digite o número do conselho" 
                              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
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
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conselho Profissional</label>
                          <select 
                            value={formData.conselho_solicitante} 
                            onChange={e => setFormData({...formData, conselho_solicitante: e.target.value})} 
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
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
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">UF do Conselho</label>
                          <select 
                            value={formData.uf_solicitante} 
                            onChange={e => setFormData({...formData, uf_solicitante: e.target.value})} 
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                          >
                            {UF_OPCOES.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CBOS</label>
                          <input 
                            type="text" 
                            value={formData.cbos_solicitante} 
                            onChange={e => setFormData({...formData, cbos_solicitante: e.target.value})} 
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
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
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
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
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                            required 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Atendimento a RN</label>
                          <select 
                            value={formData.atendimento_rn} 
                            onChange={e => setFormData({...formData, atendimento_rn: e.target.value})} 
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                          >
                            {SIM_NAO.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Atendimento *</label>
                          <select 
                            value={formData.tipo_atendimento} 
                            onChange={e => setFormData({...formData, tipo_atendimento: e.target.value})} 
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                          >
                            {TIPO_ATENDIMENTO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Indicação de Acidente</label>
                          <select 
                            value={formData.indicacao_acidente} 
                            onChange={e => setFormData({...formData, indicacao_acidente: e.target.value})} 
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                          >
                            {INDICADOR_ACIDENTE.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Consulta</label>
                          <select 
                            value={formData.tipo_consulta} 
                            onChange={e => setFormData({...formData, tipo_consulta: e.target.value})} 
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                          >
                            {TIPO_CONSULTA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Regime de Atendimento *</label>
                          <select 
                            value={formData.regime_atendimento} 
                            onChange={e => setFormData({...formData, regime_atendimento: e.target.value})} 
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                          >
                            {REGIME_ATENDIMENTO.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cobertura Especial</label>
                          <select 
                            value={formData.cobertura_especial} 
                            onChange={e => setFormData({...formData, cobertura_especial: e.target.value})} 
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                          >
                            {COBERTURA_ESPECIAL.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Saúde Ocupacional</label>
                          <select 
                            value={formData.saude_ocupacional} 
                            onChange={e => setFormData({...formData, saude_ocupacional: e.target.value})} 
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                          >
                            {SAUDE_OCUPACIONAL.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motivo de Encerramento</label>
                          <select 
                            value={formData.motivo_encerramento} 
                            onChange={e => setFormData({...formData, motivo_encerramento: e.target.value})} 
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
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
                          className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
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
                          <strong>ℹ️ Informações:</strong> Selecione o tipo de item e busque por código ou descrição.
                          {itensAutorizados.length > 0 && (
                            <span className="block mt-1 text-xs">
                              ✅ Você possui {itensAutorizados.length} procedimento(s) autorizado(s). 
                              Ao adicionar itens, o sistema verificará o saldo disponível.
                            </span>
                          )}
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
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">H.Início</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">H.Fim</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Via Acesso</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Técnica</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Código</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Descrição</th>
                                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Qtd</th>
                                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Valor</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Profissional</th>
                                  <th className="px-2 py-2 text-center w-20">Ações</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {itensGuia.map((item, idx) => (
                                  <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${item.pendente_autorizacao ? 'bg-orange-50 dark:bg-orange-900/10' : ''}`}>
                                    <td className="px-2 py-2 text-xs text-center">{idx + 1}</td>
                                    <td className="px-2 py-2 text-xs">{item.data_execucao}</td>
                                    <td className="px-2 py-2 text-xs">{item.hora_inicial || '-'}</td>
                                    <td className="px-2 py-2 text-xs">{item.hora_final || '-'}</td>
                                    <td className="px-2 py-2 text-xs font-mono text-blue-600">{item.codigo}</td>
                                    <td className="px-2 py-2 text-xs">
                                      {item.nome}
                                      {item.pendente_autorizacao && (
                                        <span className="ml-2 text-xs text-orange-600">(Sem autorização)</span>
                                      )}
                                    </td>
                                    <td className="px-2 py-2 text-xs text-center font-medium">{item.quantidade}</td>
                                    <td className="px-2 py-2 text-xs text-right font-semibold">R$ {item.valor_total?.toFixed(2)}</td>
                                    <td className="px-2 py-2 text-xs">
                                      <div className="text-gray-700 dark:text-gray-300">{item.prestador_nome || '-'}</div>
                                      {item.prestador_numero_conselho && (
                                        <div className="text-xs text-gray-400">
                                          {item.prestador_conselho === '06' ? 'CRM' : 
                                           item.prestador_conselho === '08' ? 'CRO' :
                                           item.prestador_conselho === '03' ? 'CRF' :
                                           item.prestador_conselho === '02' ? 'COREN' :
                                           item.prestador_conselho === '05' ? 'CREFITO' :
                                           item.prestador_conselho === '09' ? 'CRP' :
                                           item.prestador_conselho === '07' ? 'CRN' : ''} {item.prestador_numero_conselho} - {item.prestador_uf_conselho}
                                        </div>
                                      )}
                                    </td>
                                    <td className="px-2 py-2 text-center">
                                      <div className="flex gap-1">
                                        <button type="button" onClick={() => handleEditItem(item)} className="text-blue-600 hover:text-blue-800">
                                          <PencilIcon className="w-3 h-3" />
                                        </button>
                                        <button type="button" onClick={() => removerItem(item.id)} className="text-red-600 hover:text-red-800">
                                          <TrashIcon className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="bg-gray-50 dark:bg-gray-700/50">
                                <tr className="border-t">
                                  <td colSpan="7" className="px-2 py-2 text-right font-semibold">Subtotal:</td>
                                  <td colSpan="2" className="px-2 py-2 text-right font-bold text-blue-600">
                                    R$ {itensGuia.reduce((sum, i) => sum + i.valor_total, 0).toFixed(2)}
                                  </td>
                                  <td className="px-2 py-2"></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      )}
                  
                      {editandoItem && (
                        <div className="border rounded-xl p-4 bg-blue-50 dark:bg-blue-900/20">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300">Editando Item</h4>
                            <button type="button" onClick={() => setEditandoItem(null)} className="text-gray-500 hover:text-gray-700">
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Data Execução</label>
                              <input type="date" value={currentItem.data_execucao} onChange={e => setCurrentItem({...currentItem, data_execucao: e.target.value})} className="w-full border rounded px-2 py-1 text-sm dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Hora Início</label>
                              <input type="time" value={currentItem.hora_inicial} onChange={e => setCurrentItem({...currentItem, hora_inicial: e.target.value})} className="w-full border rounded px-2 py-1 text-sm dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Hora Fim</label>
                              <input type="time" value={currentItem.hora_final} onChange={e => setCurrentItem({...currentItem, hora_final: e.target.value})} className="w-full border rounded px-2 py-1 text-sm dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Quantidade</label>
                              <input type="number" min="1" value={currentItem.quantidade} onChange={e => {
                                const qtd = parseInt(e.target.value) || 1;
                                setCurrentItem({...currentItem, quantidade: qtd, valor_total: qtd * currentItem.valor_unitario});
                              }} className="w-full border rounded px-2 py-1 text-sm text-center dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Valor Unitário (R$)</label>
                              <input type="number" step="0.01" value={currentItem.valor_unitario} onChange={e => {
                                const valor = parseFloat(e.target.value) || 0;
                                setCurrentItem({...currentItem, valor_unitario: valor, valor_total: currentItem.quantidade * valor});
                              }} className="w-full border rounded px-2 py-1 text-sm text-right dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div>
                              <button type="button" onClick={handleUpdateItem} className="w-full bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 mt-5">
                                Atualizar
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                  
                      {/* Seletor de Tipo de Item */}
                      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
                        {TIPOS_ITEM.map(tipo => (
                          <button
                            key={tipo.value}
                            type="button"
                            onClick={() => {
                              setTipoItem(tipo.value);
                              setTabelaSelecionada(tipo.tabelas[0]);
                              setCurrentItem({...currentItem, tipo: tipo.value, tabela_referencia: tipo.tabelas[0]});
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${tipoItem === tipo.value ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                          >
                            {tipo.label}
                          </button>
                        ))}
                      </div>
                  
                      {/* Busca de Item */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buscar Item</label>
                        <div className="relative">
                          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={searchItemTerm}
                            onChange={e => setSearchItemTerm(e.target.value)}
                            placeholder="Digite o código ou descrição..."
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            list="itens-suggestions-proc"
                          />
                          <datalist id="itens-suggestions-proc">
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
                          {itensFiltrados.slice(0, 10).map(item => {
                            const itemAutorizado = itensAutorizados.find(aut => aut.codigo === item.codigo_tuss);
                            const saldo = itemAutorizado?.quantidade_autorizada - (itemAutorizado?.quantidade_utilizada || 0);
                            return (
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
                                  <div className="text-right">
                                    <span className="text-sm font-semibold text-green-600">R$ {item.valor_sugerido?.toFixed(2)}</span>
                                    {itemAutorizado && (
                                      <span className="text-xs text-blue-600 ml-2 block">
                                        ✅ Autorizado: {saldo} disponível
                                      </span>
                                    )}
                                    {!itemAutorizado && (
                                      <span className="text-xs text-orange-500 ml-2 block">
                                        ⚠️ Sem autorização
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                  
                      {/* Formulário do Item */}
                      {currentItem.codigo && (
                        <div className="border-t pt-4 mt-2">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                            <div className="md:col-span-1">
                              <label className="block text-xs text-gray-500 mb-1">Data</label>
                              <input type="date" value={currentItem.data_execucao} onChange={e => setCurrentItem({...currentItem, data_execucao: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div className="md:col-span-1">
                              <label className="block text-xs text-gray-500 mb-1">H.Início</label>
                              <input type="time" value={currentItem.hora_inicial} onChange={e => setCurrentItem({...currentItem, hora_inicial: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div className="md:col-span-1">
                              <label className="block text-xs text-gray-500 mb-1">H.Fim</label>
                              <input type="time" value={currentItem.hora_final} onChange={e => setCurrentItem({...currentItem, hora_final: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:text-white" />
                            </div>
                           {/* NOVOS CAMPOS TISS */}
                            <div className="md:col-span-1">
                              <label className="block text-xs text-gray-500 mb-1">Via Acesso</label>
                              <select value={currentItem.viaAcesso} onChange={e => setCurrentItem({...currentItem, viaAcesso: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm">
                                <option value="1">Única</option>
                                <option value="2">Mesma via</option>
                                <option value="3">Diferentes vias</option>
                              </select>
                            </div>
                            <div className="md:col-span-1">
                              <label className="block text-xs text-gray-500 mb-1">Técnica Utilizada</label>
                              <select value={currentItem.tecnicaUtilizada} onChange={e => setCurrentItem({...currentItem, tecnicaUtilizada: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm">
                                <option value="1">Convencional</option>
                                <option value="2">Vídeo</option>
                                <option value="3">Robótica</option>
                              </select>
                            </div>
                            <div className="md:col-span-1">
                              <label className="block text-xs text-gray-500 mb-1">Redução/Acréscimo (%)</label>
                              <input type="number" step="0.01" min="0" max="100" value={currentItem.reducaoAcrescimo} onChange={e => setCurrentItem({...currentItem, reducaoAcrescimo: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm text-center" />
                            </div>                         
                            <div className="md:col-span-2">
                              <label className="block text-xs text-gray-500 mb-1">Item</label>
                              <input type="text" value={currentItem.nome} disabled className="w-full bg-gray-100 border rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div className="md:col-span-1">
                              <label className="block text-xs text-gray-500 mb-1">Qtd</label>
                              <input type="number" min="1" value={currentItem.quantidade} onChange={e => {
                                const qtd = parseInt(e.target.value) || 1;
                                const saldo = calcularSaldoAutorizado(currentItem.codigo, qtd);
                                setCurrentItem({...currentItem, quantidade: qtd, saldo_autorizado: saldo, valor_total: qtd * currentItem.valor_unitario});
                              }} className="w-full border rounded px-2 py-1.5 text-sm text-center dark:bg-gray-700 dark:text-white" />
                              {currentItem.saldo_autorizado > 0 && (
                                <span className="text-xs text-green-600">Saldo: {currentItem.saldo_autorizado}</span>
                              )}
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-xs text-gray-500 mb-1">Valor Unitário</label>
                              <input type="number" step="0.01" value={currentItem.valor_unitario} onChange={e => {
                                const valor = parseFloat(e.target.value) || 0;
                                setCurrentItem({...currentItem, valor_unitario: valor, valor_total: currentItem.quantidade * valor});
                              }} className="w-full border rounded px-2 py-1.5 text-sm text-right dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div className="md:col-span-3">
                              <label className="block text-xs text-gray-500 mb-1">Profissional (buscar por nome ou conselho)</label>
                              <select 
                                value={currentItem.prestador_id} 
                                onChange={e => {
                                  const prestador = prestadores.find(p => p.id === parseInt(e.target.value));
                                  if (prestador) {
                                    setCurrentItem({
                                      ...currentItem, 
                                      prestador_id: e.target.value, 
                                      prestador_nome: prestador.nome || '',
                                      prestador_cpf: prestador.cpf || '00000000000',
                                      prestador_conselho: prestador.codigo_conselho_ans || '06',
                                      prestador_numero_conselho: prestador.numero_conselho || '',
                                      prestador_uf_conselho: prestador.uf_conselho || '35',
                                      prestador_cbos: prestador.cbos || '225125'
                                    });
                                  }
                                }} 
                                className="w-full border rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:text-white"
                              >
                                <option value="">Selecione um profissional</option>
                                {prestadores.map(p => (
                                  <option key={p.id} value={p.id}>
                                    {p.nome} - {p.codigo_conselho_ans === '06' ? 'CRM' : 
                                                 p.codigo_conselho_ans === '08' ? 'CRO' :
                                                 p.codigo_conselho_ans === '03' ? 'CRF' :
                                                 p.codigo_conselho_ans === '02' ? 'COREN' :
                                                 p.codigo_conselho_ans === '05' ? 'CREFITO' :
                                                 p.codigo_conselho_ans === '09' ? 'CRP' :
                                                 p.codigo_conselho_ans === '07' ? 'CRN' : ''} {p.numero_conselho} - {p.uf_conselho}
                                  </option>
                                ))}
                              </select>
                              {currentItem.prestador_numero_conselho && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Conselho: {currentItem.prestador_conselho === '06' ? 'CRM' : 
                                             currentItem.prestador_conselho === '08' ? 'CRO' :
                                             currentItem.prestador_conselho === '03' ? 'CRF' :
                                             currentItem.prestador_conselho === '02' ? 'COREN' :
                                             currentItem.prestador_conselho === '05' ? 'CREFITO' :
                                             currentItem.prestador_conselho === '09' ? 'CRP' :
                                             currentItem.prestador_conselho === '07' ? 'CRN' : ''} {currentItem.prestador_numero_conselho} - {currentItem.prestador_uf_conselho}
                                </div>
                              )}
                            </div>
                            <div className="md:col-span-1">
                              <button type="button" onClick={handleAdicionarItem} className="w-full bg-green-600 text-white px-2 py-1.5 rounded-lg text-sm hover:bg-green-700 mt-5">+ Add</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Botões de Ação */}
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button type="button" onClick={resetModal} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                      Cancelar
                    </button>
                    <button type="submit" className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium shadow-md hover:from-blue-600 hover:to-indigo-700">
                      {editing ? 'Atualizar' : 'Salvar'} Guia
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
