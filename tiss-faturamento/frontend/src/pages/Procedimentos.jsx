import { useState, useEffect } from 'react';
import { 
  PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, 
  BuildingOfficeIcon, XMarkIcon, Cog6ToothIcon, CalculatorIcon, 
  ChartBarIcon, ArchiveBoxIcon, CurrencyDollarIcon, 
  DocumentTextIcon, TagIcon, BeakerIcon, HeartIcon,
  ChevronDownIcon, ChevronUpIcon, CheckCircleIcon,
  ExclamationTriangleIcon, InformationCircleIcon,
  FolderIcon, FolderOpenIcon, AdjustmentsHorizontalIcon,
  SparklesIcon, TableCellsIcon, ClockIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { procedimentosService, conveniosService } from '../services/supabaseService';
import { useTheme } from '../contexts/ThemeContext';

// ============================================
// CONFIGURAÇÕES DAS TABELAS (constantes)
// ============================================

const TIPOS_TABELA = [
  { value: 'TUSS', label: 'TUSS - Tabela Unificada', codigo: '22', tipo: 'valor_fixo', icone: '📋' },
  { value: 'CBHPM', label: 'CBHPM', codigo: '22', tipo: 'porte_uco', icone: '📊' },
  { value: 'AMB90', label: 'AMB 90', codigo: '01', tipo: 'ch', icone: '🔬' },
  { value: 'AMB92', label: 'AMB 92', codigo: '02', tipo: 'ch', icone: '🔬' },
  { value: 'AMB96', label: 'AMB 96', codigo: '03', tipo: 'valor_fixo', icone: '💊' },
  { value: 'AMB99', label: 'AMB 99', codigo: '04', tipo: 'valor_fixo', icone: '💊' },
  { value: 'BRASINDICE', label: 'Brasíndice', codigo: '05', tipo: 'pontos', icone: '📈' },
  { value: 'SIMPRO', label: 'SIMPRO', codigo: '12', tipo: 'pontos', icone: '📈' },
  { value: 'PROPRIA', label: 'Tabela Própria', codigo: '00', tipo: 'valor_fixo', icone: '🏢' },
  { value: 'PACOTE', label: 'Pacote', codigo: '98', tipo: 'pacote', icone: '📦' }
];

const TIPOS_ITEM = [
  { value: 'PROCEDIMENTO', label: 'Procedimento', cor: 'blue', icone: '🔧' },
  { value: 'CONSULTA', label: 'Consulta', cor: 'green', icone: '👨‍⚕️' },
  { value: 'EXAME', label: 'Exame', cor: 'cyan', icone: '🔬' },
  { value: 'CIRURGIA', label: 'Cirurgia', cor: 'purple', icone: '🏥' },
  { value: 'MATERIAL', label: 'Material', cor: 'orange', icone: '📦' },
  { value: 'MEDICAMENTO', label: 'Medicamento', cor: 'red', icone: '💊' },
  { value: 'OPME', label: 'OPME', cor: 'pink', icone: '🔩' },
  { value: 'DIARIA', label: 'Diária', cor: 'yellow', icone: '📅' },
  { value: 'TAXA', label: 'Taxa', cor: 'gray', icone: '💰' },
  { value: 'PACOTE', label: 'Pacote', cor: 'indigo', icone: '📦' }
];

// ============================================
// UNIDADES DE MEDIDA - PADRÃO TISS (Tabela 60)
// ============================================
const UNIDADES_MEDIDA = [
  { value: '001', label: '001 - AMP - Ampola' },
  { value: '002', label: '002 - BUI - Bilhões de Unidades Internacionais' },
  { value: '003', label: '003 - BG - Bisnaga' },
  { value: '004', label: '004 - BOLS - Bolsa' },
  { value: '005', label: '005 - CX - Caixa' },
  { value: '006', label: '006 - CAP - Cápsula' },
  { value: '007', label: '007 - CARP - Carpule' },
  { value: '008', label: '008 - COM - Comprimido' },
  { value: '009', label: '009 - DOSE - Dose' },
  { value: '010', label: '010 - DRG - Drágea' },
  { value: '011', label: '011 - ENV - Envelope' },
  { value: '012', label: '012 - FLAC - Flaconete' },
  { value: '013', label: '013 - FR - Frasco' },
  { value: '014', label: '014 - FA - Frasco Ampola' },
  { value: '015', label: '015 - GAL - Galão' },
  { value: '016', label: '016 - GLOB - Glóbulo' },
  { value: '017', label: '017 - GTS - Gotas' },
  { value: '018', label: '018 - G - Grama' },
  { value: '019', label: '019 - L - Litro' },
  { value: '020', label: '020 - MCG - Microgramas' },
  { value: '021', label: '021 - MUI - Milhões de Unidades Internacionais' },
  { value: '022', label: '022 - MG - Miligrama' },
  { value: '023', label: '023 - ML - Mililitro' },
  { value: '024', label: '024 - OVL - Óvulo' },
  { value: '025', label: '025 - PAS - Pastilha' },
  { value: '026', label: '026 - LT - Lata' },
  { value: '027', label: '027 - PER - Pérola' },
  { value: '028', label: '028 - PIL - Pílula' },
  { value: '029', label: '029 - PT - Pote' },
  { value: '030', label: '030 - KG - Quilograma' },
  { value: '031', label: '031 - SER - Seringa' },
  { value: '032', label: '032 - SUP - Supositório' },
  { value: '033', label: '033 - TABLE - Tablete' },
  { value: '034', label: '034 - TUB - Tubete' },
  { value: '035', label: '035 - TB - Tubo' },
  { value: '036', label: '036 - UN - Unidade' },
  { value: '037', label: '037 - UI - Unidade Internacional' },
  { value: '038', label: '038 - CM - Centímetro' },
  { value: '039', label: '039 - CONJ - Conjunto' },
  { value: '040', label: '040 - KIT - Kit' },
  { value: '041', label: '041 - MÇ - Maço' },
  { value: '042', label: '042 - M - Metro' },
  { value: '043', label: '043 - PC - Pacote' },
  { value: '044', label: '044 - PÇ - Peça' },
  { value: '045', label: '045 - RL - Rolo' },
  { value: '046', label: '046 - GY - Gray' },
  { value: '047', label: '047 - CGY - Centigray' },
  { value: '048', label: '048 - PAR - Par' },
  { value: '049', label: '049 - ADES - Adesivo Transdérmico' },
  { value: '050', label: '050 - COM EFEV - Comprimido Efervescente' },
  { value: '051', label: '051 - COM MST - Comprimido Mastigável' },
  { value: '052', label: '052 - SACHE - Sachê' }
];

// ============================================
// CONFIGURAÇÕES PADRÃO DAS TABELAS
// ============================================
const CONFIG_PADRAO_TABELAS = {
  AMB90: { hm_ch: 0.50, sadt_ch: 0.40, anestesia_ch: 0.35, perc_aux_1: 30, perc_aux_2: 20, perc_aux_3: 15, valor_filme: 20, ativo: true },
  AMB92: { hm_ch: 0.55, sadt_ch: 0.45, anestesia_ch: 0.40, perc_aux_1: 30, perc_aux_2: 20, perc_aux_3: 15, valor_filme: 22, ativo: true },
  AMB96: { consulta: 80.00, exame: 45.00, cirurgia_pequeno: 250.00, cirurgia_medio: 500.00, cirurgia_grande: 800.00, anestesia: 150.00, ativo: true },
  AMB99: { consulta: 100.00, exame: 60.00, cirurgia_pequeno: 300.00, cirurgia_medio: 600.00, cirurgia_grande: 1000.00, anestesia: 200.00, ativo: true },
  CBHPM: { valor_porte_1: 80.00, valor_porte_2: 120.00, valor_porte_3: 180.00, valor_porte_4: 250.00, valor_porte_5: 400.00, valor_porte_6: 600.00, valor_porte_7: 900.00, valor_porte_8: 1200.00, valor_uco: 10.00, perc_aux_1: 30, perc_aux_2: 20, perc_aux_3: 15, ativo: true },
  BRASINDICE: { valor_ponto: 0.80, ativo: true },
  SIMPRO: { valor_ponto: 0.90, ativo: true }
};

const CONFIG_AJUSTES_PADRAO = {
  materiais: { deflator: 0, inflator: 0, data_referencia: new Date().toISOString().split('T')[0], ativo: true },
  medicamentos: { deflator: 0, inflator: 0, data_referencia: new Date().toISOString().split('T')[0], ativo: true },
  opme: { deflator: 0, inflator: 0, data_referencia: new Date().toISOString().split('T')[0], ativo: true },
  historico_ajustes: []
};

export default function Procedimentos() {
  const { darkMode } = useTheme();
  const [procedimentos, setProcedimentos] = useState([]);
  const [convenios, setConvenios] = useState([]);
  const [convenioSelecionado, setConvenioSelecionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showAjustesModal, setShowAjustesModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [aba, setAba] = useState('tuss');
  const [configTabelas, setConfigTabelas] = useState(CONFIG_PADRAO_TABELAS);
  const [configAjustes, setConfigAjustes] = useState(CONFIG_AJUSTES_PADRAO);
  const [tabelaConfigAtual, setTabelaConfigAtual] = useState('AMB90');
  const [tipoAjusteAtual, setTipoAjusteAtual] = useState('materiais');
  const [expandedItems, setExpandedItems] = useState({});

  const [formData, setFormData] = useState({
    codigo: '', nome: '', tipo: 'PROCEDIMENTO', grupo: '', tabela: 'TUSS',
    valor: '', ch: '', porte: '', uco: '', pontos: '', auxiliar_1: false,
    auxiliar_2: false, auxiliar_3: false, filme: false, quantidade: 1,
    unidade: '036', valor_unitario: '', valor_total: '', observacoes: ''
  });

  useEffect(() => {
    carregarConfiguracoes();
    carregarDados();
  }, []);

  const carregarConfiguracoes = async () => {
    try {
      const storedTabelas = localStorage.getItem('config_tabelas_procedimentos');
      const storedAjustes = localStorage.getItem('config_ajustes_materiais');
      
      if (storedTabelas) setConfigTabelas(JSON.parse(storedTabelas));
      else localStorage.setItem('config_tabelas_procedimentos', JSON.stringify(CONFIG_PADRAO_TABELAS));
      
      if (storedAjustes) setConfigAjustes(JSON.parse(storedAjustes));
      else localStorage.setItem('config_ajustes_materiais', JSON.stringify(CONFIG_AJUSTES_PADRAO));
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const salvarConfiguracoesTabelas = async (novaConfig) => {
    setConfigTabelas(novaConfig);
    localStorage.setItem('config_tabelas_procedimentos', JSON.stringify(novaConfig));
    toast.success('Configurações das tabelas salvas!');
    setShowConfigModal(false);
  };

  const salvarConfiguracoesAjustes = async (novaConfig) => {
    const historico = [...configAjustes.historico_ajustes, {
      data: new Date().toISOString(),
      tipo: tipoAjusteAtual,
      valores_anteriores: configAjustes[tipoAjusteAtual],
      valores_novos: novaConfig[tipoAjusteAtual],
      usuario: 'sistema'
    }];
    
    const configAtualizada = { ...novaConfig, historico_ajustes: historico };
    setConfigAjustes(configAtualizada);
    localStorage.setItem('config_ajustes_materiais', JSON.stringify(configAtualizada));
    toast.success(`Configurações de ${tipoAjusteAtual} salvas!`);
    setShowAjustesModal(false);
  };

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [conveniosData, procedimentosData] = await Promise.all([
        conveniosService.listar(),
        procedimentosService.listar()
      ]);
      
      setConvenios(conveniosData);
      setProcedimentos(procedimentosData);
      
      if (conveniosData.length > 0 && !convenioSelecionado) {
        setConvenioSelecionado(conveniosData[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    try {
      await procedimentosService.remover(id);
      toast.success('Item excluído!');
      carregarDados();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir');
    }
  };

  const aplicarAjuste = (valor, tipo) => {
    const ajustes = configAjustes[tipo];
    if (!ajustes) return valor;
    let valorAjustado = valor;
    if (ajustes.inflator && ajustes.inflator > 0) valorAjustado = valorAjustado * (1 + (ajustes.inflator / 100));
    if (ajustes.deflator && ajustes.deflator > 0) valorAjustado = valorAjustado * (1 - (ajustes.deflator / 100));
    return Math.round(valorAjustado * 100) / 100;
  };

  const calcularValorTabela = (dados) => {
    const config = configTabelas[dados.tabela];
    if (!config) return 0;

    switch (dados.tabela) {
      case 'AMB90':
      case 'AMB92':
        const ch = parseFloat(dados.ch) || 0;
        let valorCH = config.hm_ch;
        if (dados.tipo === 'EXAME') valorCH = config.sadt_ch;
        if (dados.tipo === 'ANESTESIA') valorCH = config.anestesia_ch;
        let chTotal = ch;
        if (dados.auxiliar_1) chTotal += ch * (config.perc_aux_1 / 100);
        if (dados.auxiliar_2) chTotal += ch * (config.perc_aux_2 / 100);
        if (dados.auxiliar_3) chTotal += ch * (config.perc_aux_3 / 100);
        let valor = chTotal * valorCH;
        if (dados.filme) valor += config.valor_filme;
        return valor;
      case 'AMB96':
      case 'AMB99':
        if (dados.tipo === 'CONSULTA') return config.consulta;
        if (dados.tipo === 'EXAME') return config.exame;
        if (dados.tipo === 'ANESTESIA') return config.anestesia;
        return 0;
      case 'CBHPM':
        const porte = parseFloat(dados.porte) || 1;
        const uco = parseFloat(dados.uco) || 0;
        const valorPorte = config[`valor_porte_${porte}`] || 80;
        let honorario = valorPorte;
        if (dados.auxiliar_1) honorario += honorario * (config.perc_aux_1 / 100);
        if (dados.auxiliar_2) honorario += honorario * (config.perc_aux_2 / 100);
        return honorario + (uco * config.valor_uco);
      case 'BRASINDICE':
      case 'SIMPRO':
        const pontos = parseFloat(dados.pontos) || 0;
        return pontos * config.valor_ponto;
      default:
        return parseFloat(dados.valor) || 0;
    }
  };

  const calcularValorItem = (dados) => {
    let valorBase = 0;
    switch (dados.tipo) {
      case 'MATERIAL': valorBase = parseFloat(dados.valor_unitario) || 0; return aplicarAjuste(valorBase * (dados.quantidade || 1), 'materiais');
      case 'MEDICAMENTO': valorBase = parseFloat(dados.valor_unitario) || 0; return aplicarAjuste(valorBase * (dados.quantidade || 1), 'medicamentos');
      case 'OPME': valorBase = parseFloat(dados.valor_unitario) || 0; return aplicarAjuste(valorBase * (dados.quantidade || 1), 'opme');
      default: return calcularValorTabela(dados);
    }
  };

  const handleCalcular = () => {
    let valorCalculado = calcularValorItem(formData);
    setFormData(prev => ({ ...prev, valor: valorCalculado.toFixed(2) }));
    toast.info(`Valor calculado: R$ ${valorCalculado.toFixed(2)}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.codigo || !formData.nome) {
      toast.error('Código e nome são obrigatórios');
      return;
    }

    const valorCalculado = calcularValorItem(formData);
    const procedimentoData = {
      codigo_tuss: formData.codigo,
      nome: formData.nome,
      tipo: formData.tipo,
      grupo: formData.grupo,
      valor_sugerido: valorCalculado,
      tabela: formData.tabela,
      convenio_id: convenioSelecionado?.id || null,
      dados_adicionais: {
        ch: formData.ch, porte: formData.porte, uco: formData.uco, pontos: formData.pontos,
        auxiliar_1: formData.auxiliar_1, auxiliar_2: formData.auxiliar_2, auxiliar_3: formData.auxiliar_3,
        filme: formData.filme, quantidade: formData.quantidade, unidade: formData.unidade,
        valor_unitario: formData.valor_unitario, observacoes: formData.observacoes
      }
    };

    try {
      if (editing) {
        await procedimentosService.atualizar(editing.id, procedimentoData);
        toast.success('Procedimento atualizado!');
      } else {
        await procedimentosService.criar(procedimentoData);
        toast.success('Procedimento cadastrado!');
      }
      carregarDados();
      setShowModal(false);
      setEditing(null);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar procedimento');
    }
  };

  const resetForm = () => {
    setFormData({
      codigo: '', nome: '', tipo: 'PROCEDIMENTO', grupo: '', tabela: 'TUSS',
      valor: '', ch: '', porte: '', uco: '', pontos: '', auxiliar_1: false,
      auxiliar_2: false, auxiliar_3: false, filme: false, quantidade: 1,
      unidade: '036', valor_unitario: '', valor_total: '', observacoes: ''
    });
  };

  const getCorTipo = (tipo) => {
    const cores = {
      PROCEDIMENTO: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      CONSULTA: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      EXAME: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
      CIRURGIA: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      MATERIAL: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      MEDICAMENTO: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      OPME: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
      DIARIA: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    };
    return cores[tipo] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filtered = procedimentos.filter(p => {
    if (convenioSelecionado && p.convenio_id && p.convenio_id !== convenioSelecionado.id) return false;
    if (!convenioSelecionado && p.convenio_id) return false;
    if (aba === 'tuss' && p.tabela !== 'TUSS') return false;
    if (aba === 'cbhpm' && p.tabela !== 'CBHPM') return false;
    if (aba === 'amb' && !p.tabela?.startsWith('AMB')) return false;
    if (aba === 'materiais' && !['MATERIAL', 'MEDICAMENTO', 'OPME'].includes(p.tipo)) return false;
    return p.codigo_tuss?.toLowerCase().includes(searchTerm.toLowerCase()) || 
           p.nome?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalItens = filtered.length;
  const totalMateriais = filtered.filter(p => p.tipo === 'MATERIAL').length;
  const totalMedicamentos = filtered.filter(p => p.tipo === 'MEDICAMENTO').length;
  const totalProcedimentos = filtered.filter(p => ['PROCEDIMENTO', 'CONSULTA', 'EXAME', 'CIRURGIA'].includes(p.tipo)).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Carregando procedimentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                Gestão de Procedimentos
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Cadastro e gerenciamento de procedimentos, materiais, medicamentos e OPME
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowAjustesModal(true)} 
                className="group relative px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-sm font-medium flex items-center gap-2 hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-300"
              >
                <AdjustmentsHorizontalIcon className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                Ajustes de Preços
              </button>
              <button 
                onClick={() => setShowConfigModal(true)} 
                className="group relative px-4 py-2.5 bg-gradient-to-r from-gray-600 to-gray-800 dark:from-gray-700 dark:to-gray-900 text-white rounded-xl text-sm font-medium flex items-center gap-2 hover:shadow-lg transition-all duration-300"
              >
                <Cog6ToothIcon className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                Configurar Tabelas
              </button>
              <button 
                onClick={() => { setEditing(null); resetForm(); setShowModal(true); }} 
                className="group relative px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
              >
                <PlusIcon className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                Novo Item
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total de Itens</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{totalItens}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <ArchiveBoxIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Procedimentos</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{totalProcedimentos}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <BeakerIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Materiais</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{totalMateriais}</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                <ArchiveBoxIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Medicamentos</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{totalMedicamentos}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <HeartIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Cards de Ajustes Ativos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {['materiais', 'medicamentos', 'opme'].map((tipo) => {
            const ajuste = configAjustes[tipo];
            const temAjuste = (ajuste?.inflator > 0) || (ajuste?.deflator > 0);
            return (
              <div key={tipo} className={`rounded-2xl border p-4 transition-all duration-300 ${temAjuste ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-300 dark:border-yellow-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider capitalize">{tipo}</p>
                    <p className="text-xl font-bold mt-1">
                      {ajuste?.inflator > 0 && <span className="text-green-600 dark:text-green-400">+{ajuste.inflator}%</span>}
                      {ajuste?.deflator > 0 && <span className="text-red-600 dark:text-red-400">-{ajuste.deflator}%</span>}
                      {!temAjuste && <span className="text-gray-400">Sem ajuste</span>}
                    </p>
                  </div>
                  {temAjuste && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Seleção de Convênio */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <BuildingOfficeIcon className="w-4 h-4" />
            Convênio / Tabela
          </label>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setConvenioSelecionado(null)} 
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${!convenioSelecionado ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
            >
              Tabela Padrão
            </button>
            {convenios.filter(c => c.ativo).map(c => (
              <button 
                key={c.id} 
                onClick={() => setConvenioSelecionado(c)} 
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${convenioSelecionado?.id === c.id ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              >
                {c.razao_social}
              </button>
            ))}
          </div>
          {convenioSelecionado && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <InformationCircleIcon className="w-4 h-4" />
                Editando valores específicos para o convênio: <strong>{convenioSelecionado.razao_social}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl w-fit">
          {[
            { id: 'tuss', label: 'TUSS', icone: '📋' },
            { id: 'cbhpm', label: 'CBHPM', icone: '📊' },
            { id: 'amb', label: 'AMB', icone: '🔬' },
            { id: 'materiais', label: 'Materiais/Medicamentos', icone: '💊' },
            { id: 'outras', label: 'Outras Tabelas', icone: '📈' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setAba(tab.id)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${aba === tab.id ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              <span>{tab.icone}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Busca */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por código ou nome do procedimento..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all duration-200" 
            />
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-10"></th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tabela</th>
                  <th className="px-4 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor Padrão</th>
                  <th className="px-4 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor Convênio</th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((p) => {
                  const valorPadrao = p.valor_sugerido || 0;
                  const valorConvenio = p.valor_convenio || null;
                  const isExpanded = expandedItems[p.id];
                  const tipoIcon = TIPOS_ITEM.find(t => t.value === p.tipo)?.icone || '📄';
                  
                  return (
                    <>
                      <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 group">
                        <td className="px-4 py-3">
                          <button onClick={() => toggleExpand(p.id)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            {isExpanded ? <ChevronUpIcon className="w-4 h-4 text-gray-400" /> : <ChevronDownIcon className="w-4 h-4 text-gray-400" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono font-semibold text-blue-600 dark:text-blue-400">{p.codigo_tuss}</td>
                        <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 max-w-md truncate" title={p.nome}>{p.nome}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getCorTipo(p.tipo)}`}>
                            <span>{tipoIcon}</span>
                            {p.tipo}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            {TIPOS_TABELA.find(t => t.value === p.tabela)?.icone || '📋'}
                            {p.tabela || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-600 dark:text-gray-400">
                          R$ {valorPadrao.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {valorConvenio ? (
                            <span className="font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg">
                              R$ {valorConvenio.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button 
                              onClick={() => { setEditing(p); setFormData({...p, valor_convenio: p.valor_convenio || '', valor_sugerido: p.valor_sugerido || ''}); setShowModal(true); }} 
                              className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" 
                              title="Editar"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(p.id)} 
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" 
                              title="Excluir"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && p.dados_adicionais && (
                        <tr className="bg-gray-50 dark:bg-gray-700/30">
                          <td colSpan="8" className="px-4 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              {p.dados_adicionais.ch && (
                                <div><span className="text-xs text-gray-500">CH:</span> <span className="font-mono">{p.dados_adicionais.ch}</span></div>
                              )}
                              {p.dados_adicionais.porte && (
                                <div><span className="text-xs text-gray-500">Porte:</span> <span>{p.dados_adicionais.porte}</span></div>
                              )}
                              {p.dados_adicionais.uco && (
                                <div><span className="text-xs text-gray-500">UCO:</span> <span>{p.dados_adicionais.uco}</span></div>
                              )}
                              {p.dados_adicionais.pontos && (
                                <div><span className="text-xs text-gray-500">Pontos:</span> <span>{p.dados_adicionais.pontos}</span></div>
                              )}
                              {p.dados_adicionais.quantidade && p.tipo !== 'PROCEDIMENTO' && (
                                <div><span className="text-xs text-gray-500">Quantidade:</span> <span>{p.dados_adicionais.quantidade} {UNIDADES_MEDIDA.find(u => u.value === p.dados_adicionais.unidade)?.label.split(' - ')[1] || p.dados_adicionais.unidade}</span></div>
                              )}
                              {p.dados_adicionais.observacoes && (
                                <div className="col-span-full"><span className="text-xs text-gray-500">Observações:</span> <span className="text-gray-600 dark:text-gray-400">{p.dados_adicionais.observacoes}</span></div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="px-4 py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
                <DocumentTextIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">Nenhum item encontrado</p>
              <button onClick={() => { setEditing(null); resetForm(); setShowModal(true); }} className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
                + Cadastrar primeiro item
              </button>
            </div>
          )}
        </div>

        {/* Modal de Cadastro/Edição */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                    {editing ? 'Editar Item' : 'Novo Item'}
                  </h3>
                  <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="p-5">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo *</label>
                        <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" required>
                          {TIPOS_ITEM.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código *</label>
                        <input type="text" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm font-mono dark:bg-gray-700" required />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome *</label>
                      <input type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" required />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tabela</label>
                      <select value={formData.tabela} onChange={e => setFormData({...formData, tabela: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700">
                        {TIPOS_TABELA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grupo</label>
                      <input type="text" value={formData.grupo} onChange={e => setFormData({...formData, grupo: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" />
                    </div>
                    
                    {/* Campos específicos para Materiais/Medicamentos/OPME */}
                    {(formData.tipo === 'MATERIAL' || formData.tipo === 'MEDICAMENTO' || formData.tipo === 'OPME') && (
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantidade</label>
                          <input type="number" step="0.01" value={formData.quantidade} onChange={e => setFormData({...formData, quantidade: parseFloat(e.target.value)})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unidade</label>
                          <select value={formData.unidade} onChange={e => setFormData({...formData, unidade: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700">
                            {UNIDADES_MEDIDA.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Unitário (R$)</label>
                          <input type="number" step="0.01" value={formData.valor_unitario} onChange={e => setFormData({...formData, valor_unitario: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" />
                        </div>
                      </div>
                    )}
                    
                    {/* Campos para procedimentos com CH (AMB) */}
                    {(formData.tabela === 'AMB90' || formData.tabela === 'AMB92') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CH (Coeficiente Honorário)</label>
                        <input type="number" step="1" value={formData.ch} onChange={e => setFormData({...formData, ch: parseFloat(e.target.value)})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" />
                      </div>
                    )}
                    
                    {/* Campos para CBHPM */}
                    {formData.tabela === 'CBHPM' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Porte</label>
                          <input type="number" step="1" value={formData.porte} onChange={e => setFormData({...formData, porte: parseFloat(e.target.value)})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">UCO</label>
                          <input type="number" step="1" value={formData.uco} onChange={e => setFormData({...formData, uco: parseFloat(e.target.value)})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" />
                        </div>
                      </div>
                    )}
                    
                    {/* Campos para Brasíndice/SIMPRO */}
                    {(formData.tabela === 'BRASINDICE' || formData.tabela === 'SIMPRO') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pontos</label>
                        <input type="number" step="1" value={formData.pontos} onChange={e => setFormData({...formData, pontos: parseFloat(e.target.value)})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" />
                      </div>
                    )}
                    
                    {/* Checkboxes para auxiliares */}
                    {(formData.tabela === 'AMB90' || formData.tabela === 'AMB92' || formData.tabela === 'CBHPM') && (
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={formData.auxiliar_1} onChange={e => setFormData({...formData, auxiliar_1: e.target.checked})} className="w-4 h-4" />
                          <span className="text-sm">1º Auxiliar</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={formData.auxiliar_2} onChange={e => setFormData({...formData, auxiliar_2: e.target.checked})} className="w-4 h-4" />
                          <span className="text-sm">2º Auxiliar</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={formData.auxiliar_3} onChange={e => setFormData({...formData, auxiliar_3: e.target.checked})} className="w-4 h-4" />
                          <span className="text-sm">3º Auxiliar</span>
                        </label>
                        {(formData.tabela === 'AMB90' || formData.tabela === 'AMB92') && (
                          <label className="flex items-center gap-2">
                            <input type="checkbox" checked={formData.filme} onChange={e => setFormData({...formData, filme: e.target.checked})} className="w-4 h-4" />
                            <span className="text-sm">Incluir Filme</span>
                          </label>
                        )}
                      </div>
                    )}
                    
                    {/* Botão Calcular */}
                    <button type="button" onClick={handleCalcular} className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-2.5 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-green-500/25 transition-all duration-200 flex items-center justify-center gap-2">
                      <CalculatorIcon className="w-4 h-4" />
                      Calcular Valor
                    </button>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Calculado (R$)</label>
                      <input type="number" step="0.01" value={formData.valor} readOnly className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-100 dark:bg-gray-600 font-mono font-bold" />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                      <textarea rows="2" value={formData.observacoes} onChange={e => setFormData({...formData, observacoes: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm font-medium">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium shadow-md">
                      {editing ? 'Atualizar' : 'Salvar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Configuração de Ajustes */}
        {showAjustesModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Configurar Ajustes de Preços
                  </h3>
                  <button onClick={() => setShowAjustesModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="p-5">
                <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
                  {['materiais', 'medicamentos', 'opme'].map((tipo) => (
                    <button
                      key={tipo}
                      onClick={() => setTipoAjusteAtual(tipo)}
                      className={`px-4 py-2 text-sm font-medium capitalize transition-all duration-200 ${
                        tipoAjusteAtual === tipo
                          ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                      }`}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Inflator (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={configAjustes[tipoAjusteAtual]?.inflator || 0}
                        onChange={(e) => setConfigAjustes({
                          ...configAjustes,
                          [tipoAjusteAtual]: {
                            ...configAjustes[tipoAjusteAtual],
                            inflator: parseFloat(e.target.value) || 0
                          }
                        })}
                        className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700"
                      />
                      <p className="text-xs text-gray-500 mt-1">Aumento percentual no preço (ex: 10 = +10%)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Deflator (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={configAjustes[tipoAjusteAtual]?.deflator || 0}
                        onChange={(e) => setConfigAjustes({
                          ...configAjustes,
                          [tipoAjusteAtual]: {
                            ...configAjustes[tipoAjusteAtual],
                            deflator: parseFloat(e.target.value) || 0
                          }
                        })}
                        className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700"
                      />
                      <p className="text-xs text-gray-500 mt-1">Redução percentual no preço (ex: 5 = -5%)</p>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      💡 O inflator e deflator são aplicados em sequência. Primeiro o inflator, depois o deflator.
                    </p>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={() => setShowAjustesModal(false)} className="px-4 py-2 border rounded-lg text-sm font-medium">Cancelar</button>
                    <button onClick={() => salvarConfiguracoesAjustes(configAjustes)} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium">Salvar Configurações</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Configuração das Tabelas */}
        {showConfigModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Configuração das Tabelas
                  </h3>
                  <button onClick={() => setShowConfigModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="p-5">
                <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                  {Object.keys(configTabelas).map((tabela) => (
                    <button
                      key={tabela}
                      onClick={() => setTabelaConfigAtual(tabela)}
                      className={`px-4 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                        tabelaConfigAtual === tabela
                          ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                      }`}
                    >
                      {TIPOS_TABELA.find(t => t.value === tabela)?.label || tabela}
                    </button>
                  ))}
                </div>
                
                {/* Configuração simplificada - exibe apenas campos relevantes */}
                <div className="space-y-4">
                  {tabelaConfigAtual === 'CBHPM' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Valor do Ponto (UCO)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={configTabelas.CBHPM?.valor_uco || 10}
                        onChange={(e) => setConfigTabelas({
                          ...configTabelas,
                          CBHPM: { ...configTabelas.CBHPM, valor_uco: parseFloat(e.target.value) }
                        })}
                        className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700"
                      />
                    </div>
                  )}
                  
                  {(tabelaConfigAtual === 'BRASINDICE' || tabelaConfigAtual === 'SIMPRO') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Valor do Ponto (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={configTabelas[tabelaConfigAtual]?.valor_ponto || 0.80}
                        onChange={(e) => setConfigTabelas({
                          ...configTabelas,
                          [tabelaConfigAtual]: { ...configTabelas[tabelaConfigAtual], valor_ponto: parseFloat(e.target.value) }
                        })}
                        className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700"
                      />
                    </div>
                  )}
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                      <TableCellsIcon className="w-4 h-4" />
                      As configurações de todas as tabelas são salvas automaticamente.
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button onClick={() => setShowConfigModal(false)} className="px-4 py-2 border rounded-lg text-sm font-medium">Cancelar</button>
                  <button onClick={() => salvarConfiguracoesTabelas(configTabelas)} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium">Salvar Configurações</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
