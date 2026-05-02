import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, BuildingOfficeIcon, XMarkIcon, Cog6ToothIcon, CalculatorIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { procedimentosService, conveniosService } from '../services/supabaseService';
import { useTheme } from '../contexts/ThemeContext';

// ============================================
// CONFIGURAÇÕES DAS TABELAS
// ============================================

// Tipos de tabela
const TIPOS_TABELA = [
  { value: 'TUSS', label: 'TUSS - Tabela Unificada', codigo: '22', tipo: 'valor_fixo' },
  { value: 'CBHPM', label: 'CBHPM', codigo: '22', tipo: 'porte_uco' },
  { value: 'AMB90', label: 'AMB 90', codigo: '01', tipo: 'ch' },
  { value: 'AMB92', label: 'AMB 92', codigo: '02', tipo: 'ch' },
  { value: 'AMB96', label: 'AMB 96', codigo: '03', tipo: 'valor_fixo' },
  { value: 'AMB99', label: 'AMB 99', codigo: '04', tipo: 'valor_fixo' },
  { value: 'BRASINDICE', label: 'Brasíndice', codigo: '05', tipo: 'pontos' },
  { value: 'SIMPRO', label: 'SIMPRO', codigo: '12', tipo: 'pontos' },
  { value: 'PROPRIA', label: 'Tabela Própria', codigo: '00', tipo: 'valor_fixo' },
  { value: 'PACOTE', label: 'Pacote', codigo: '98', tipo: 'pacote' }
];

// Tipos de item
const TIPOS_ITEM = [
  { value: 'PROCEDIMENTO', label: 'Procedimento', cor: 'blue' },
  { value: 'CONSULTA', label: 'Consulta', cor: 'green' },
  { value: 'EXAME', label: 'Exame', cor: 'cyan' },
  { value: 'CIRURGIA', label: 'Cirurgia', cor: 'purple' },
  { value: 'MATERIAL', label: 'Material', cor: 'orange' },
  { value: 'MEDICAMENTO', label: 'Medicamento', cor: 'red' },
  { value: 'OPME', label: 'OPME', cor: 'pink' },
  { value: 'DIARIA', label: 'Diária', cor: 'yellow' },
  { value: 'TAXA', label: 'Taxa', cor: 'gray' },
  { value: 'PACOTE', label: 'Pacote', cor: 'indigo' }
];

// Unidades de medida
const UNIDADES_MEDIDA = [
  { value: 'UN', label: 'UN - Unidade' },
  { value: 'MG', label: 'MG - Miligrama' },
  { value: 'G', label: 'G - Grama' },
  { value: 'ML', label: 'ML - Mililitro' },
  { value: 'AMP', label: 'AMP - Ampola' },
  { value: 'FR', label: 'FR - Frasco' },
  { value: 'CX', label: 'CX - Caixa' },
  { value: 'KIT', label: 'KIT - Kit' }
];

// Configuração padrão das tabelas
const CONFIG_PADRAO_TABELAS = {
  // AMB 90
  AMB90: {
    hm_ch: 0.50,
    sadt_ch: 0.40,
    anestesia_ch: 0.35,
    perc_aux_1: 30,
    perc_aux_2: 20,
    perc_aux_3: 15,
    valor_filme: 20,
    ativo: true
  },
  // AMB 92
  AMB92: {
    hm_ch: 0.55,
    sadt_ch: 0.45,
    anestesia_ch: 0.40,
    perc_aux_1: 30,
    perc_aux_2: 20,
    perc_aux_3: 15,
    valor_filme: 22,
    ativo: true
  },
  // AMB 96
  AMB96: {
    consulta: 80.00,
    exame: 45.00,
    cirurgia_pequeno: 250.00,
    cirurgia_medio: 500.00,
    cirurgia_grande: 800.00,
    anestesia: 150.00,
    ativo: true
  },
  // AMB 99
  AMB99: {
    consulta: 100.00,
    exame: 60.00,
    cirurgia_pequeno: 300.00,
    cirurgia_medio: 600.00,
    cirurgia_grande: 1000.00,
    anestesia: 200.00,
    ativo: true
  },
  // CBHPM
  CBHPM: {
    valor_porte_1: 80.00,
    valor_porte_2: 120.00,
    valor_porte_3: 180.00,
    valor_porte_4: 250.00,
    valor_porte_5: 400.00,
    valor_porte_6: 600.00,
    valor_porte_7: 900.00,
    valor_porte_8: 1200.00,
    valor_uco: 10.00,
    perc_aux_1: 30,
    perc_aux_2: 20,
    perc_aux_3: 15,
    ativo: true
  },
  // Brasíndice
  BRASINDICE: {
    valor_ponto: 0.80,
    ativo: true
  },
  // SIMPRO
  SIMPRO: {
    valor_ponto: 0.90,
    ativo: true
  }
};

// Configuração de ajustes de materiais e medicamentos
const CONFIG_AJUSTES_PADRAO = {
  materiais: {
    deflator: 0,      // Percentual de redução (ex: 10 = -10%)
    inflator: 0,      // Percentual de aumento (ex: 5 = +5%)
    data_referencia: new Date().toISOString().split('T')[0],
    ativo: true
  },
  medicamentos: {
    deflator: 0,
    inflator: 0,
    data_referencia: new Date().toISOString().split('T')[0],
    ativo: true
  },
  opme: {
    deflator: 0,
    inflator: 0,
    data_referencia: new Date().toISOString().split('T')[0],
    ativo: true
  },
  historico_ajustes: []
};

export default function Procedimentos() {
  const { darkMode } = useTheme();
  const [procedimentos, setProcedimentos] = useState([]);
  const [convenios, setConvenios] = useState([]);
  const [convenioSelecionado, setConvenioSelecionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);  // <-- MOVER PARA CÁ
  const [showAjustesModal, setShowAjustesModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [aba, setAba] = useState('tuss');
  const [configTabelas, setConfigTabelas] = useState(CONFIG_PADRAO_TABELAS);
  const [configAjustes, setConfigAjustes] = useState(CONFIG_AJUSTES_PADRAO);
  const [tabelaConfigAtual, setTabelaConfigAtual] = useState('AMB90');  // <-- MOVER PARA CÁ
  const [tipoAjusteAtual, setTipoAjusteAtual] = useState('materiais');

  // Adicione a função aqui também, dentro do componente
  const salvarConfiguracoesTabelas = async (novaConfig) => {
    setConfigTabelas(novaConfig);
    localStorage.setItem('config_tabelas_procedimentos', JSON.stringify(novaConfig));
    toast.success('Configurações das tabelas salvas!');
    setShowConfigModal(false);
  };
  
  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    tipo: 'PROCEDIMENTO',
    grupo: '',
    tabela: 'TUSS',
    valor: '',
    ch: '',
    porte: '',
    uco: '',
    pontos: '',
    auxiliar_1: false,
    auxiliar_2: false,
    auxiliar_3: false,
    filme: false,
    quantidade: 1,
    unidade: 'UN',
    valor_unitario: '',
    valor_total: '',
    observacoes: ''
  });

  useEffect(() => {
    carregarConfiguracoes();
    carregarDados();
  }, []);

  const carregarConfiguracoes = async () => {
    try {
      const storedTabelas = localStorage.getItem('config_tabelas_procedimentos');
      const storedAjustes = localStorage.getItem('config_ajustes_materiais');
      
      if (storedTabelas) {
        setConfigTabelas(JSON.parse(storedTabelas));
      } else {
        localStorage.setItem('config_tabelas_procedimentos', JSON.stringify(CONFIG_PADRAO_TABELAS));
      }
      
      if (storedAjustes) {
        setConfigAjustes(JSON.parse(storedAjustes));
      } else {
        localStorage.setItem('config_ajustes_materiais', JSON.stringify(CONFIG_AJUSTES_PADRAO));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const salvarConfiguracoesAjustes = async (novaConfig) => {
    // Registrar no histórico
    const historico = [...configAjustes.historico_ajustes, {
      data: new Date().toISOString(),
      tipo: tipoAjusteAtual,
      valores_anteriores: configAjustes[tipoAjusteAtual],
      valores_novos: novaConfig[tipoAjusteAtual],
      usuario: 'sistema'
    }];
    
    const configAtualizada = {
      ...novaConfig,
      historico_ajustes: historico
    };
    
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

  // Função para aplicar ajustes (deflator/inflator) em materiais e medicamentos
  const aplicarAjuste = (valor, tipo) => {
    const ajustes = configAjustes[tipo];
    if (!ajustes) return valor;
    
    let valorAjustado = valor;
    
    // Aplicar inflator (aumento percentual)
    if (ajustes.inflator && ajustes.inflator > 0) {
      valorAjustado = valorAjustado * (1 + (ajustes.inflator / 100));
    }
    
    // Aplicar deflator (redução percentual)
    if (ajustes.deflator && ajustes.deflator > 0) {
      valorAjustado = valorAjustado * (1 - (ajustes.deflator / 100));
    }
    
    return Math.round(valorAjustado * 100) / 100;
  };

  // Função para calcular valor baseado no tipo de item
  const calcularValorItem = (dados) => {
    let valorBase = 0;
    const ajustes = configAjustes;
    
    switch (dados.tipo) {
      case 'MATERIAL':
        valorBase = parseFloat(dados.valor_unitario) || 0;
        return aplicarAjuste(valorBase * (dados.quantidade || 1), 'materiais');
        
      case 'MEDICAMENTO':
        valorBase = parseFloat(dados.valor_unitario) || 0;
        return aplicarAjuste(valorBase * (dados.quantidade || 1), 'medicamentos');
        
      case 'OPME':
        valorBase = parseFloat(dados.valor_unitario) || 0;
        return aplicarAjuste(valorBase * (dados.quantidade || 1), 'opme');
        
      case 'CONSULTA':
      case 'PROCEDIMENTO':
      case 'CIRURGIA':
      case 'EXAME':
        return calcularValorTabela(dados);
        
      default:
        return parseFloat(dados.valor) || 0;
    }
  };

  // Função para calcular valor baseado na tabela
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
        const valorUCO = config.valor_uco;
        
        let honorario = valorPorte;
        if (dados.auxiliar_1) honorario += honorario * (config.perc_aux_1 / 100);
        if (dados.auxiliar_2) honorario += honorario * (config.perc_aux_2 / 100);
        
        return honorario + (uco * valorUCO);
        
      case 'BRASINDICE':
      case 'SIMPRO':
        const pontos = parseFloat(dados.pontos) || 0;
        return pontos * config.valor_ponto;
        
      default:
        return parseFloat(dados.valor) || 0;
    }
  };

  const handleCalcular = () => {
    let valorCalculado;
    
    if (formData.tipo === 'MATERIAL' || formData.tipo === 'MEDICAMENTO' || formData.tipo === 'OPME') {
      valorCalculado = calcularValorItem(formData);
      setFormData(prev => ({ 
        ...prev, 
        valor_total: valorCalculado.toFixed(2),
        valor: valorCalculado.toFixed(2)
      }));
    } else {
      valorCalculado = calcularValorTabela(formData);
      setFormData(prev => ({ ...prev, valor: valorCalculado.toFixed(2) }));
    }
    
    toast.info(`Valor calculado: R$ ${valorCalculado.toFixed(2)}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.codigo || !formData.nome) {
      toast.error('Código e nome são obrigatórios');
      return;
    }

    const valorCalculado = 
      formData.tipo === 'MATERIAL' || formData.tipo === 'MEDICAMENTO' || formData.tipo === 'OPME'
        ? calcularValorItem(formData)
        : calcularValorTabela(formData);

    const procedimentoData = {
      codigo_tuss: formData.codigo,
      nome: formData.nome,
      tipo: formData.tipo,
      grupo: formData.grupo,
      valor_sugerido: valorCalculado,
      tabela: formData.tabela,
      convenio_id: convenioSelecionado?.id || null,
      dados_adicionais: {
        ch: formData.ch,
        porte: formData.porte,
        uco: formData.uco,
        pontos: formData.pontos,
        auxiliar_1: formData.auxiliar_1,
        auxiliar_2: formData.auxiliar_2,
        auxiliar_3: formData.auxiliar_3,
        filme: formData.filme,
        quantidade: formData.quantidade,
        unidade: formData.unidade,
        valor_unitario: formData.valor_unitario,
        observacoes: formData.observacoes
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
      await carregarDados();
      setShowModal(false);
      setEditing(null);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar procedimento:', error);
      toast.error('Erro ao salvar procedimento');
    }
  };

  const resetForm = () => {
    setFormData({
      codigo: '', nome: '', tipo: 'PROCEDIMENTO', grupo: '',
      tabela: 'TUSS', valor: '', ch: '', porte: '', uco: '', pontos: '',
      auxiliar_1: false, auxiliar_2: false, auxiliar_3: false, filme: false,
      quantidade: 1, unidade: 'UN', valor_unitario: '', valor_total: '', observacoes: ''
    });
  };

  const getCorTipo = (tipo) => {
    const item = TIPOS_ITEM.find(t => t.value === tipo);
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

  const filtered = procedimentos.filter(p => {
    if (convenioSelecionado && p.convenio_id && p.convenio_id !== convenioSelecionado.id) {
      return false;
    }
    if (!convenioSelecionado && p.convenio_id) {
      return false;
    }
    
    if (aba === 'tuss' && p.tabela !== 'TUSS') return false;
    if (aba === 'cbhpm' && p.tabela !== 'CBHPM') return false;
    if (aba === 'amb' && !p.tabela?.startsWith('AMB')) return false;
    if (aba === 'materiais' && !['MATERIAL', 'MEDICAMENTO', 'OPME'].includes(p.tipo)) return false;
    
    return p.codigo_tuss?.toLowerCase().includes(searchTerm.toLowerCase()) || 
           p.nome?.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Procedimentos
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Cadastro de procedimentos, materiais, medicamentos e OPME
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowAjustesModal(true)} 
            className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-3 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-all duration-200"
            title="Configurar ajustes de materiais e medicamentos"
          >
            <ChartBarIcon className="w-4 h-4" />
            Ajustes
          </button>
          <button 
            onClick={() => setShowConfigModal(true)} 
            className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
            title="Configurar tabelas"
          >
            <Cog6ToothIcon className="w-4 h-4" />
            Configurar
          </button>
          <button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg">
            <PlusIcon className="w-4 h-4" /> Novo Item
          </button>
        </div>
      </div>

      {/* Cards de resumo de ajustes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Materiais</p>
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {configAjustes.materiais?.inflator > 0 && `+${configAjustes.materiais.inflator}%`}
                {configAjustes.materiais?.deflator > 0 && `-${configAjustes.materiais.deflator}%`}
                {(!configAjustes.materiais?.inflator && !configAjustes.materiais?.deflator) && 'Sem ajuste'}
              </p>
            </div>
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Medicamentos</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                {configAjustes.medicamentos?.inflator > 0 && `+${configAjustes.medicamentos.inflator}%`}
                {configAjustes.medicamentos?.deflator > 0 && `-${configAjustes.medicamentos.deflator}%`}
                {(!configAjustes.medicamentos?.inflator && !configAjustes.medicamentos?.deflator) && 'Sem ajuste'}
              </p>
            </div>
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">OPME</p>
              <p className="text-lg font-bold text-pink-600 dark:text-pink-400">
                {configAjustes.opme?.inflator > 0 && `+${configAjustes.opme.inflator}%`}
                {configAjustes.opme?.deflator > 0 && `-${configAjustes.opme.deflator}%`}
                {(!configAjustes.opme?.inflator && !configAjustes.opme?.deflator) && 'Sem ajuste'}
              </p>
            </div>
            <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Seleção de Convênio */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
          <BuildingOfficeIcon className="w-4 h-4" />
          Convênio / Tabela
        </label>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setConvenioSelecionado(null)} className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${!convenioSelecionado ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
            Tabela Padrão
          </button>
          {convenios.filter(c => c.ativo).map(c => (
            <button key={c.id} onClick={() => setConvenioSelecionado(c)} className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${convenioSelecionado?.id === c.id ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
              {c.razao_social}
            </button>
          ))}
        </div>
        {convenioSelecionado && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">
            ✏️ Editando valores específicos para o convênio: {convenioSelecionado.razao_social}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <button onClick={() => setAba('tuss')} className={`px-4 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap ${aba === 'tuss' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>TUSS</button>
        <button onClick={() => setAba('cbhpm')} className={`px-4 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap ${aba === 'cbhpm' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>CBHPM</button>
        <button onClick={() => setAba('amb')} className={`px-4 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap ${aba === 'amb' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>AMB (90/92/96/99)</button>
        <button onClick={() => setAba('materiais')} className={`px-4 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap ${aba === 'materiais' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>Materiais/Medicamentos</button>
        <button onClick={() => setAba('outras')} className={`px-4 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap ${aba === 'outras' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>Outras Tabelas</button>
      </div>

      {/* Busca */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 mb-4">
        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input type="text" placeholder="Buscar por código ou nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border-0 bg-transparent rounded-lg px-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tabela</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor Padrão</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor Convênio</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.map((p) => {
                const valorPadrao = p.valor_sugerido || 0;
                const valorConvenio = p.valor_convenio || null;
                return (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">{p.codigo_tuss}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">{p.nome}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getCorTipo(p.tipo)}`}>
                        {p.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{p.tabela || '-'}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">R$ {valorPadrao.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      {valorConvenio ? (
                        <span className="font-semibold text-green-600 dark:text-green-400">R$ {valorConvenio.toFixed(2)}</span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => { setEditing(p); setFormData({...p, valor_convenio: p.valor_convenio || '', valor_sugerido: p.valor_sugerido || ''}); setShowModal(true); }} className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Editar">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Excluir">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="px-4 py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Nenhum item encontrado
          </div>
        )}
      </div>

      {/* Modal de Cadastro/Edição - versão simplificada */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                      <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700">
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
                  
                  {/* Botão Calcular */}
                  <button type="button" onClick={handleCalcular} className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2">
                    <CalculatorIcon className="w-4 h-4" />
                    Calcular Valor
                  </button>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Calculado (R$)</label>
                    <input type="number" step="0.01" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-100 dark:bg-gray-600 font-mono font-bold" />
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
                    {configAjustes[tipoAjusteAtual]?.inflator > 0 && configAjustes[tipoAjusteAtual]?.deflator > 0 && 
                      ` Efeito líquido: ${configAjustes[tipoAjusteAtual].inflator - configAjustes[tipoAjusteAtual].deflator}%`}
                  </p>
                </div>
                
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button onClick={() => setShowAjustesModal(false)} className="px-4 py-2 border rounded-lg text-sm font-medium">Cancelar</button>
                  <button onClick={() => salvarConfiguracoesAjustes(configAjustes)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Salvar Configurações</button>
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
                <button 
                  onClick={() => setShowConfigModal(false)} 
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
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
              
              {/* Configuração AMB 90/92 */}
              {(tabelaConfigAtual === 'AMB90' || tabelaConfigAtual === 'AMB92') && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Valor CH Honorários Médicos (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={configTabelas[tabelaConfigAtual]?.hm_ch || 0}
                        onChange={(e) => setConfigTabelas({
                          ...configTabelas,
                          [tabelaConfigAtual]: {
                            ...configTabelas[tabelaConfigAtual],
                            hm_ch: parseFloat(e.target.value)
                          }
                        })}
                        className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700"
                      />
                      <p className="text-xs text-gray-500 mt-1">Valor do CH para consultas, cirurgias e procedimentos</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Valor CH SADT (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={configTabelas[tabelaConfigAtual]?.sadt_ch || 0}
                        onChange={(e) => setConfigTabelas({
                          ...configTabelas,
                          [tabelaConfigAtual]: {
                            ...configTabelas[tabelaConfigAtual],
                            sadt_ch: parseFloat(e.target.value)
                          }
                        })}
                        className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700"
                      />
                      <p className="text-xs text-gray-500 mt-1">Valor do CH para exames e terapias</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        1º Auxiliar (%)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={configTabelas[tabelaConfigAtual]?.perc_aux_1 || 30}
                        onChange={(e) => setConfigTabelas({
                          ...configTabelas,
                          [tabelaConfigAtual]: {
                            ...configTabelas[tabelaConfigAtual],
                            perc_aux_1: parseFloat(e.target.value)
                          }
                        })}
                        className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        2º Auxiliar (%)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={configTabelas[tabelaConfigAtual]?.perc_aux_2 || 20}
                        onChange={(e) => setConfigTabelas({
                          ...configTabelas,
                          [tabelaConfigAtual]: {
                            ...configTabelas[tabelaConfigAtual],
                            perc_aux_2: parseFloat(e.target.value)
                          }
                        })}
                        className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        3º Auxiliar (%)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={configTabelas[tabelaConfigAtual]?.perc_aux_3 || 15}
                        onChange={(e) => setConfigTabelas({
                          ...configTabelas,
                          [tabelaConfigAtual]: {
                            ...configTabelas[tabelaConfigAtual],
                            perc_aux_3: parseFloat(e.target.value)
                          }
                        })}
                        className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Valor do Filme (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={configTabelas[tabelaConfigAtual]?.valor_filme || 20}
                      onChange={(e) => setConfigTabelas({
                        ...configTabelas,
                        [tabelaConfigAtual]: {
                          ...configTabelas[tabelaConfigAtual],
                          valor_filme: parseFloat(e.target.value)
                        }
                      })}
                      className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700"
                    />
                  </div>
                </div>
              )}
              
              {/* Configuração AMB 96/99 (valores fixos) */}
              {(tabelaConfigAtual === 'AMB96' || tabelaConfigAtual === 'AMB99') && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Consulta (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={configTabelas[tabelaConfigAtual]?.consulta || 80}
                        onChange={(e) => setConfigTabelas({
                          ...configTabelas,
                          [tabelaConfigAtual]: {
                            ...configTabelas[tabelaConfigAtual],
                            consulta: parseFloat(e.target.value)
                          }
                        })}
                        className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Exame (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={configTabelas[tabelaConfigAtual]?.exame || 45}
                        onChange={(e) => setConfigTabelas({
                          ...configTabelas,
                          [tabelaConfigAtual]: {
                            ...configTabelas[tabelaConfigAtual],
                            exame: parseFloat(e.target.value)
                          }
                        })}
                        className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Cirurgia Pequeno Porte (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={configTabelas[tabelaConfigAtual]?.cirurgia_pequeno || 250}
                        onChange={(e) => setConfigTabelas({
                          ...configTabelas,
                          [tabelaConfigAtual]: {
                            ...configTabelas[tabelaConfigAtual],
                            cirurgia_pequeno: parseFloat(e.target.value)
                          }
                        })}
                        className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Cirurgia Médio Porte (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={configTabelas[tabelaConfigAtual]?.cirurgia_medio || 500}
                        onChange={(e) => setConfigTabelas({
                          ...configTabelas,
                          [tabelaConfigAtual]: {
                            ...configTabelas[tabelaConfigAtual],
                            cirurgia_medio: parseFloat(e.target.value)
                          }
                        })}
                        className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Cirurgia Grande Porte (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={configTabelas[tabelaConfigAtual]?.cirurgia_grande || 800}
                        onChange={(e) => setConfigTabelas({
                          ...configTabelas,
                          [tabelaConfigAtual]: {
                            ...configTabelas[tabelaConfigAtual],
                            cirurgia_grande: parseFloat(e.target.value)
                          }
                        })}
                        className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Anestesia (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={configTabelas[tabelaConfigAtual]?.anestesia || 150}
                      onChange={(e) => setConfigTabelas({
                        ...configTabelas,
                        [tabelaConfigAtual]: {
                          ...configTabelas[tabelaConfigAtual],
                          anestesia: parseFloat(e.target.value)
                        }
                      })}
                      className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700"
                    />
                  </div>
                </div>
              )}
              
              {/* Configuração CBHPM */}
              {tabelaConfigAtual === 'CBHPM' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Valor UCO (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={configTabelas.CBHPM?.valor_uco || 10}
                        onChange={(e) => setConfigTabelas({
                          ...configTabelas,
                          CBHPM: {
                            ...configTabelas.CBHPM,
                            valor_uco: parseFloat(e.target.value)
                          }
                        })}
                        className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Valor Porte Base (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={configTabelas.CBHPM?.valor_porte_1 || 80}
                        onChange={(e) => setConfigTabelas({
                          ...configTabelas,
                          CBHPM: {
                            ...configTabelas.CBHPM,
                            valor_porte_1: parseFloat(e.target.value)
                          }
                        })}
                        className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Auxiliar 1 (%)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={configTabelas.CBHPM?.perc_aux_1 || 30}
                        onChange={(e) => setConfigTabelas({
                          ...configTabelas,
                          CBHPM: {
                            ...configTabelas.CBHPM,
                            perc_aux_1: parseFloat(e.target.value)
                          }
                        })}
                        className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Auxiliar 2 (%)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={configTabelas.CBHPM?.perc_aux_2 || 20}
                        onChange={(e) => setConfigTabelas({
                          ...configTabelas,
                          CBHPM: {
                            ...configTabelas.CBHPM,
                            perc_aux_2: parseFloat(e.target.value)
                          }
                        })}
                        className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Auxiliar 3 (%)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={configTabelas.CBHPM?.perc_aux_3 || 15}
                        onChange={(e) => setConfigTabelas({
                          ...configTabelas,
                          CBHPM: {
                            ...configTabelas.CBHPM,
                            perc_aux_3: parseFloat(e.target.value)
                          }
                        })}
                        className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Configuração Brasíndice / SIMPRO */}
              {(tabelaConfigAtual === 'BRASINDICE' || tabelaConfigAtual === 'SIMPRO') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Valor do Ponto (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={configTabelas[tabelaConfigAtual]?.valor_ponto || (tabelaConfigAtual === 'BRASINDICE' ? 0.80 : 0.90)}
                    onChange={(e) => setConfigTabelas({
                      ...configTabelas,
                      [tabelaConfigAtual]: {
                        ...configTabelas[tabelaConfigAtual],
                        valor_ponto: parseFloat(e.target.value)
                      }
                    })}
                    className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Valor de cada ponto para cálculo do procedimento: Valor = Pontos × Valor do Ponto
                  </p>
                </div>
              )}
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button 
                  onClick={() => setShowConfigModal(false)} 
                  className="px-4 py-2 border rounded-lg text-sm font-medium"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => salvarConfiguracoesTabelas(configTabelas)} 
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium shadow-md"
                >
                  Salvar Configurações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}      
    </div>
  );
}
