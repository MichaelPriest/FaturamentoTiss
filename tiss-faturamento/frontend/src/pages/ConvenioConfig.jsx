import { useState, useEffect } from 'react';
import { 
  BuildingOfficeIcon, 
  CurrencyDollarIcon, 
  DocumentTextIcon, 
  ShieldCheckIcon, 
  PaperClipIcon, 
  CalendarIcon, 
  LinkIcon, 
  UserGroupIcon, 
  FolderIcon, 
  ExclamationTriangleIcon, 
  ChartBarIcon, 
  Cog6ToothIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import { useUnidade } from '../contexts/UnidadeContext';
import { applyUnidadeToPayload, filterByUnidade } from '../services/unidadesService';
import { useNavigate } from 'react-router-dom';

const ESPECIALIDADES = [
  { id: 14, nome: 'Psicologia' },
  { id: 15, nome: 'Neuropsicologia' },
  { id: 16, nome: 'Psicopedagogia' },
  { id: 17, nome: 'Fonoaudiologia' },
  { id: 18, nome: 'Fisioterapia' },
  { id: 19, nome: 'Psicomotricidade' },
  { id: 32, nome: 'Terapia Ocupacional' },
  { id: 21, nome: 'Musicoterapia' },
  { id: 22, nome: 'Nutrição' },
  { id: 24, nome: 'Educação Física' }
];

const TIPOS_COBRANCA = [
  { value: 'procedimento', label: 'Por Procedimento' },
  { value: 'pacote', label: 'Pacote' },
  { value: 'diaria', label: 'Diária' },
  { value: 'consulta', label: 'Consulta' }
];

const FORMAS_ENVIO = [
  { value: 'tiss_xml', label: 'TISS XML' },
  { value: 'portal', label: 'Portal (Orizon)' },
  { value: 'manual', label: 'Manual' },
  { value: 'webservice', label: 'Webservice' }
];

const TIPOS_GUIA = [
  { value: 'sp_sadt', label: 'SP/SADT' },
  { value: 'internacao', label: 'Internação' },
  { value: 'honorario', label: 'Honorário' }
];

const TIPOS_DOCUMENTOS = [
  { value: 'pedido_medico', label: 'Pedido Médico' },
  { value: 'laudo', label: 'Laudo' },
  { value: 'relatorio', label: 'Relatório' },
  { value: 'atestado', label: 'Atestado' },
  { value: 'prescricao', label: 'Prescrição' },
  { value: 'exame_imagem', label: 'Exame de Imagem' },
  { value: 'termo_consentimento', label: 'Termo de Consentimento' }
];

export default function ConvenioConfig() {
  const { unidadeAtualId } = useUnidade();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [convenios, setConvenios] = useState([]);
  const [convenioSelecionado, setConvenioSelecionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aba, setAba] = useState('cadastrais');
  const [showRegraModal, setShowRegraModal] = useState(false);
  const [showGlosaModal, setShowGlosaModal] = useState(false);

  // Dados do convênio (básicos)
  const [convenioData, setConvenioData] = useState({
    registro_ans: '',
    razao_social: '',
    cnpj: '',
    codigo_prestador: '',
    cnes: '',
    versao_tiss: '4.03.00',
    proximo_numero_guia: 1000000,
    ultimo_numero_guia: 999999,
    ambiente: 'homologacao',
    url_webservice: ''
  });

  // Configurações estendidas (avançadas)
  const [config, setConfig] = useState({
    nome: '',
    tipo_cobranca: 'procedimento',
    forma_envio: 'tiss_xml',
    exige_autorizacao_previa: false,
    tipo_guia: 'sp_sadt',
    permite_faturamento_parcial: false,
    tabela_utilizada: 'TUSS',
    percentual_ajuste: 100,
    multiplicador_urgencia: 1.0,
    multiplicador_eletivo: 1.0,
    multiplo_escala: false,
    regras_especialidade: [],
    documentos_obrigatorios: [],
    formatos_aceitos: ['PDF', 'JPEG', 'PNG'],
    prazo_envio_dias: 30,
    prazo_pagamento_dias: 60,
    tipo_pagamento: 'fixo',
    prazo_reapresentacao_glosa: 30,
    url_webservice: '',
    usuario_webservice: '',
    senha_webservice: '',
    retorno_automatico: false,
    regras_profissional: [],
    planos: [],
    glosas_comuns: [],
    evitar_glosa_automatica: false,
    parametros_reapresentacao: '',
    notificar_faturamento: false,
    notificar_glosa: false,
    multi_estabelecimento: false,
    regras_por_unidade: [],
    versionar_contratos: false
  });

  const [novaRegra, setNovaRegra] = useState({
    especialidade_id: '',
    limite_quantidade_mensal: null,
    valor_diferenciado: null,
    exige_autorizacao: false
  });

  const [novaGlosa, setNovaGlosa] = useState({
    codigo: '',
    descricao: '',
    tipo: 'glosa',
    evitar_automaticamente: false
  });

  const [novoPlano, setNovoPlano] = useState({
    nome: '',
    codigo: '',
    cobertura: '',
    regras_especificas: ''
  });

  useEffect(() => {
    carregarConvenios();
  }, [unidadeAtualId]);

  const carregarConvenios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('convenios')
        .select('*')
        .order('razao_social', { ascending: true });
      
      if (error) throw error;
      const conveniosFiltrados = filterByUnidade(data || [], unidadeAtualId);
      setConvenios(conveniosFiltrados);
      
      const id = window.location.pathname.split('/').pop();
      if (id && conveniosFiltrados) {
        const encontrado = conveniosFiltrados.find(c => c.id === parseInt(id));
        if (encontrado) {
          selecionarConvenio(encontrado);
        }
      } else if (conveniosFiltrados && conveniosFiltrados.length > 0) {
        selecionarConvenio(conveniosFiltrados[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar convênios:', error);
      toast.error('Erro ao carregar convênios');
    } finally {
      setLoading(false);
    }
  };

  const selecionarConvenio = async (convenio) => {
    setConvenioSelecionado(convenio);
    setLoading(true);
    try {
      // Carrega os dados básicos do convênio (tabela convenios)
      setConvenioData({
        registro_ans: convenio.registro_ans || '',
        razao_social: convenio.razao_social || '',
        cnpj: convenio.cnpj || '',
        codigo_prestador: convenio.codigo_prestador || '',
        cnes: convenio.cnes || '',
        versao_tiss: convenio.versao_tiss || '4.03.00',
        proximo_numero_guia: convenio.proximo_numero_guia || 1000000,
        ultimo_numero_guia: convenio.ultimo_numero_guia || 999999,
        ambiente: convenio.ambiente || 'homologacao',
        url_webservice: convenio.url_webservice || ''
      });

      // Carrega as configurações avançadas (tabela convenios_config)
      const { data, error } = await supabase
        .from('convenios_config')
        .select('*')
        .eq('convenio_id', convenio.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data && data.configuracoes) {
        const parsed = JSON.parse(data.configuracoes);
        setConfig(prev => ({
          ...prev,
          ...parsed,
          nome: parsed.nome || convenio.razao_social
        }));
      } else {
        setConfig(prev => ({
          ...prev,
          nome: convenio.razao_social,
          url_webservice: convenio.url_webservice || '',
          prazo_envio_dias: convenio.prazo_envio_dias || 30
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const salvarConfiguracoes = async () => {
    if (!convenioSelecionado) return;
    
    setSaving(true);
    try {
      // 1. Atualiza os dados básicos na tabela convenios
      const { error: updateError } = await supabase
        .from('convenios')
        .update(applyUnidadeToPayload({
          registro_ans: convenioData.registro_ans,
          razao_social: convenioData.razao_social,
          cnpj: convenioData.cnpj,
          codigo_prestador: convenioData.codigo_prestador,
          cnes: convenioData.cnes,
          versao_tiss: convenioData.versao_tiss,
          proximo_numero_guia: convenioData.proximo_numero_guia,
          ultimo_numero_guia: convenioData.ultimo_numero_guia,
          ambiente: convenioData.ambiente,
          url_webservice: convenioData.url_webservice,
          updated_at: new Date().toISOString()
        }, unidadeAtualId))
        .eq('id', convenioSelecionado.id);
      
      if (updateError) throw updateError;

      // 2. Atualiza as configurações avançadas
      const { error: configError } = await supabase
        .from('convenios_config')
        .upsert(applyUnidadeToPayload({
          convenio_id: convenioSelecionado.id,
          configuracoes: JSON.stringify(config),
          updated_at: new Date().toISOString()
        }, unidadeAtualId), { onConflict: 'convenio_id' });
      
      if (configError) throw configError;
      
      toast.success('Configurações salvas com sucesso!');
      
      // Recarrega o convênio para atualizar a seleção
      const { data: updatedConvenio } = await supabase
        .from('convenios')
        .select('*')
        .eq('id', convenioSelecionado.id)
        .single();
      if (updatedConvenio) {
        selecionarConvenio(updatedConvenio);
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const adicionarRegraEspecialidade = () => {
    if (!novaRegra.especialidade_id) {
      toast.error('Selecione uma especialidade');
      return;
    }
    const especialidade = ESPECIALIDADES.find(e => e.id === parseInt(novaRegra.especialidade_id));
    setConfig({
      ...config,
      regras_especialidade: [...config.regras_especialidade, {
        ...novaRegra,
        id: Date.now(),
        especialidade_nome: especialidade?.nome
      }]
    });
    setNovaRegra({
      especialidade_id: '',
      limite_quantidade_mensal: null,
      valor_diferenciado: null,
      exige_autorizacao: false
    });
    setShowRegraModal(false);
  };

  const removerRegraEspecialidade = (id) => {
    setConfig({
      ...config,
      regras_especialidade: config.regras_especialidade.filter(r => r.id !== id)
    });
  };

  const adicionarGlosa = () => {
    if (!novaGlosa.codigo || !novaGlosa.descricao) {
      toast.error('Preencha código e descrição da glosa');
      return;
    }
    setConfig({
      ...config,
      glosas_comuns: [...config.glosas_comuns, { ...novaGlosa, id: Date.now() }]
    });
    setNovaGlosa({
      codigo: '',
      descricao: '',
      tipo: 'glosa',
      evitar_automaticamente: false
    });
    setShowGlosaModal(false);
  };

  const removerGlosa = (id) => {
    setConfig({
      ...config,
      glosas_comuns: config.glosas_comuns.filter(g => g.id !== id)
    });
  };

  const adicionarPlano = () => {
    if (!novoPlano.nome) {
      toast.error('Nome do plano é obrigatório');
      return;
    }
    setConfig({
      ...config,
      planos: [...config.planos, { ...novoPlano, id: Date.now() }]
    });
    setNovoPlano({ nome: '', codigo: '', cobertura: '', regras_especificas: '' });
  };

  const removerPlano = (id) => {
    setConfig({
      ...config,
      planos: config.planos.filter(p => p.id !== id)
    });
  };

  const toggleDocumento = (doc) => {
    if (config.documentos_obrigatorios.includes(doc)) {
      setConfig({
        ...config,
        documentos_obrigatorios: config.documentos_obrigatorios.filter(d => d !== doc)
      });
    } else {
      setConfig({
        ...config,
        documentos_obrigatorios: [...config.documentos_obrigatorios, doc]
      });
    }
  };

  const handleVoltar = () => {
    navigate('/convenios');
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
              onClick={handleVoltar}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
              title="Voltar para Convênios"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Configurações Avançadas
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Configure regras de faturamento, tabelas, prazos e integrações
              </p>
            </div>
          </div>
          <button
            onClick={salvarConfiguracoes}
            disabled={saving}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <CheckCircleIcon className="w-4 h-4" />
            )}
            Salvar Todas as Configurações
          </button>
        </div>

        {/* Seleção de Convênio */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <BuildingOfficeIcon className="w-4 h-4" />
            Convênio / Operadora
          </label>
          <div className="flex flex-wrap gap-2">
            {convenios.map(c => (
              <button
                key={c.id}
                onClick={() => selecionarConvenio(c)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  convenioSelecionado?.id === c.id
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {c.razao_social}
              </button>
            ))}
          </div>
        </div>

        {convenioSelecionado && (
          <>
            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto pb-1">
              {[
                { id: 'cadastrais', nome: '📋 Dados Cadastrais', icon: BuildingOfficeIcon },
                { id: 'faturamento', nome: '💰 Regras de Faturamento', icon: CurrencyDollarIcon },
                { id: 'tabelas', nome: '📊 Tabelas e Valores', icon: DocumentTextIcon },
                { id: 'regras', nome: '🧠 Regras Inteligentes', icon: ShieldCheckIcon },
                { id: 'documentos', nome: '📎 Documentação', icon: PaperClipIcon },
                { id: 'prazos', nome: '📅 Prazos e Financeiro', icon: CalendarIcon },
                { id: 'integracoes', nome: '🔄 Integrações', icon: LinkIcon },
                { id: 'profissionais', nome: '👥 Regras por Profissional', icon: UserGroupIcon },
                { id: 'planos', nome: '🧾 Planos', icon: FolderIcon },
                { id: 'glosas', nome: '🚨 Controle de Glosas', icon: ExclamationTriangleIcon },
                { id: 'relatorios', nome: '📈 Relatórios', icon: ChartBarIcon },
                { id: 'avancado', nome: '⚙️ Avançado', icon: Cog6ToothIcon }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setAba(tab.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                    aba === tab.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.nome}
                </button>
              ))}
            </div>

            {/* Conteúdo das Abas */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              
              {/* 1. Dados Cadastrais - sincronizado com a tabela convenios */}
              {aba === 'cadastrais' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-4">📋 Dados Cadastrais do Convênio</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Registro ANS</label>
                      <input type="text" value={convenioData.registro_ans} onChange={e => setConvenioData({...convenioData, registro_ans: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Razão Social</label>
                      <input type="text" value={convenioData.razao_social} onChange={e => setConvenioData({...convenioData, razao_social: e.target.value.toUpperCase()})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CNPJ</label>
                      <input type="text" value={convenioData.cnpj} onChange={e => setConvenioData({...convenioData, cnpj: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código do Prestador</label>
                      <input type="text" value={convenioData.codigo_prestador} onChange={e => setConvenioData({...convenioData, codigo_prestador: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CNES</label>
                      <input type="text" value={convenioData.cnes} onChange={e => setConvenioData({...convenioData, cnes: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Versão TISS</label>
                      <select value={convenioData.versao_tiss} onChange={e => setConvenioData({...convenioData, versao_tiss: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600">
                        <option value="4.01.00">4.01.00</option>
                        <option value="4.02.00">4.02.00</option>
                        <option value="4.03.00">4.03.00</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ambiente</label>
                      <select value={convenioData.ambiente} onChange={e => setConvenioData({...convenioData, ambiente: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600">
                        <option value="homologacao">Homologação</option>
                        <option value="producao">Produção</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL do WebService</label>
                      <input type="text" value={convenioData.url_webservice} onChange={e => setConvenioData({...convenioData, url_webservice: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" placeholder="https://..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Próximo Número da Guia</label>
                      <input type="number" value={convenioData.proximo_numero_guia} onChange={e => setConvenioData({...convenioData, proximo_numero_guia: parseInt(e.target.value)})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Último Número (Limite)</label>
                      <input type="number" value={convenioData.ultimo_numero_guia} onChange={e => setConvenioData({...convenioData, ultimo_numero_guia: parseInt(e.target.value)})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Regras de Faturamento */}
              {aba === 'faturamento' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-4">💰 Regras de Faturamento</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Cobrança</label>
                      <select value={config.tipo_cobranca} onChange={e => setConfig({...config, tipo_cobranca: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600">
                        {TIPOS_COBRANCA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Forma de Envio</label>
                      <select value={config.forma_envio} onChange={e => setConfig({...config, forma_envio: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600">
                        {FORMAS_ENVIO.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Guia</label>
                      <select value={config.tipo_guia} onChange={e => setConfig({...config, tipo_guia: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600">
                        {TIPOS_GUIA.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-2 h-full pt-6">
                      <input type="checkbox" checked={config.exige_autorizacao_previa} onChange={e => setConfig({...config, exige_autorizacao_previa: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                      <label className="text-sm text-gray-700 dark:text-gray-300">Exige autorização prévia?</label>
                    </div>
                    <div className="flex items-center gap-2 h-full">
                      <input type="checkbox" checked={config.permite_faturamento_parcial} onChange={e => setConfig({...config, permite_faturamento_parcial: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                      <label className="text-sm text-gray-700 dark:text-gray-300">Permite faturamento parcial?</label>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Tabelas e Valores */}
              {aba === 'tabelas' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-4">📊 Tabelas e Valores</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tabela Utilizada</label>
                      <select value={config.tabela_utilizada} onChange={e => setConfig({...config, tabela_utilizada: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600">
                        <option value="TUSS">TUSS</option>
                        <option value="CBHPM">CBHPM</option>
                        <option value="AMB">AMB</option>
                        <option value="PROPRIA">Própria</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Percentual de Ajuste (%)</label>
                      <input type="number" value={config.percentual_ajuste} onChange={e => setConfig({...config, percentual_ajuste: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" />
                      <p className="text-xs text-gray-500 mt-1">Ex: 80 = 80%, 120 = +20%</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Multiplicador - Urgência</label>
                      <input type="number" step="0.1" value={config.multiplicador_urgencia} onChange={e => setConfig({...config, multiplicador_urgencia: parseFloat(e.target.value)})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Multiplicador - Eletivo</label>
                      <input type="number" step="0.1" value={config.multiplicador_eletivo} onChange={e => setConfig({...config, multiplicador_eletivo: parseFloat(e.target.value)})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" />
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Regras Inteligentes */}
              {aba === 'regras' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800 dark:text-white">🧠 Regras por Especialidade</h3>
                    <button onClick={() => setShowRegraModal(true)} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 hover:bg-blue-700">
                      <PlusIcon className="w-4 h-4" /> Adicionar Regra
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                          <th className="px-3 py-2 text-left">Especialidade</th>
                          <th className="px-3 py-2 text-left">Limite Mensal</th>
                          <th className="px-3 py-2 text-left">Valor Diferenciado</th>
                          <th className="px-3 py-2 text-center">Autorização</th>
                          <th className="px-3 py-2 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {config.regras_especialidade.map(regra => (
                          <tr key={regra.id} className="border-t border-gray-200 dark:border-gray-700">
                            <td className="px-3 py-2">{regra.especialidade_nome}</td>
                            <td className="px-3 py-2">{regra.limite_quantidade_mensal || 'Ilimitado'}</td>
                            <td className="px-3 py-2">{regra.valor_diferenciado ? `R$ ${regra.valor_diferenciado}` : 'Padrão'}</td>
                            <td className="px-3 py-2 text-center">{regra.exige_autorizacao ? 'Sim' : 'Não'}</td>
                            <td className="px-3 py-2 text-center">
                              <button onClick={() => removerRegraEspecialidade(regra.id)} className="text-red-600 hover:text-red-800">
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bloqueios e Validações</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                        <span className="text-sm">Bloquear procedimentos incompatíveis com idade/sexo</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                        <span className="text-sm">Validar documentação obrigatória antes do envio</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                        <span className="text-sm">Notificar quando atingir limite de procedimentos</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Documentação e Anexos */}
              {aba === 'documentos' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-4">📎 Documentos Obrigatórios</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {TIPOS_DOCUMENTOS.map(doc => (
                      <label key={doc.value} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                        <input type="checkbox" checked={config.documentos_obrigatorios.includes(doc.value)} onChange={() => toggleDocumento(doc.value)} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                        <span className="text-sm">{doc.label}</span>
                      </label>
                    ))}
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Formatos Aceitos</label>
                    <div className="flex flex-wrap gap-4">
                      {['PDF', 'JPEG', 'PNG', 'TIFF'].map(fmt => (
                        <label key={fmt} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={config.formatos_aceitos.includes(fmt)} onChange={e => {
                            if (e.target.checked) setConfig({...config, formatos_aceitos: [...config.formatos_aceitos, fmt]});
                            else setConfig({...config, formatos_aceitos: config.formatos_aceitos.filter(f => f !== fmt)});
                          }} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                          <span className="text-sm">{fmt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 6. Prazos e Financeiro */}
              {aba === 'prazos' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-4">📅 Prazos e Financeiro</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prazo de Envio (dias)</label>
                      <input type="number" value={config.prazo_envio_dias} onChange={e => setConfig({...config, prazo_envio_dias: parseInt(e.target.value)})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prazo de Pagamento (dias)</label>
                      <input type="number" value={config.prazo_pagamento_dias} onChange={e => setConfig({...config, prazo_pagamento_dias: parseInt(e.target.value)})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Pagamento</label>
                      <select value={config.tipo_pagamento} onChange={e => setConfig({...config, tipo_pagamento: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700">
                        <option value="fixo">Fixo</option>
                        <option value="producao">Produção</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prazo para Reapresentação de Glosa (dias)</label>
                      <input type="number" value={config.prazo_reapresentacao_glosa} onChange={e => setConfig({...config, prazo_reapresentacao_glosa: parseInt(e.target.value)})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" />
                    </div>
                  </div>
                </div>
              )}

              {/* 7. Integrações */}
              {aba === 'integracoes' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-4">🔄 Integrações</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL do WebService</label>
                      <input type="text" value={config.url_webservice} onChange={e => setConfig({...config, url_webservice: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" placeholder="https://..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Usuário do WebService</label>
                      <input type="text" value={config.usuario_webservice} onChange={e => setConfig({...config, usuario_webservice: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha do WebService</label>
                      <input type="password" value={config.senha_webservice} onChange={e => setConfig({...config, senha_webservice: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" />
                    </div>
                    <div className="flex items-center gap-2 h-full pt-6">
                      <input type="checkbox" checked={config.retorno_automatico} onChange={e => setConfig({...config, retorno_automatico: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                      <label className="text-sm text-gray-700 dark:text-gray-300">Retorno automático de status</label>
                    </div>
                  </div>
                </div>
              )}

              {/* 8. Regras por Profissional */}
              {aba === 'profissionais' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-4">👥 Regras por Profissional</h3>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">⚠️ Configure percentuais de repasse e regras específicas por profissional na página de Prestadores.</p>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Para configurar regras por profissional, acesse o módulo de <strong>Prestadores</strong>.
                  </div>
                </div>
              )}

              {/* 9. Planos */}
              {aba === 'planos' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800 dark:text-white">🧾 Planos do Convênio</h3>
                    <button onClick={adicionarPlano} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 hover:bg-blue-700">
                      <PlusIcon className="w-4 h-4" /> Adicionar Plano
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Nome do Plano" value={novoPlano.nome} onChange={e => setNovoPlano({...novoPlano, nome: e.target.value})} className="flex-1 border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" />
                    <input type="text" placeholder="Código" value={novoPlano.codigo} onChange={e => setNovoPlano({...novoPlano, codigo: e.target.value})} className="w-32 border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" />
                    <button onClick={adicionarPlano} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">+</button>
                  </div>
                  {config.planos.map(plano => (
                    <div key={plano.id} className="flex justify-between items-center border p-3 rounded-lg dark:border-gray-700">
                      <div>
                        <span className="font-medium">{plano.nome}</span>
                        {plano.codigo && <span className="text-xs text-gray-500 ml-2">Cód: {plano.codigo}</span>}
                      </div>
                      <button onClick={() => removerPlano(plano.id)} className="text-red-600 hover:text-red-800">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 10. Controle de Glosas */}
              {aba === 'glosas' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800 dark:text-white">🚨 Motivos de Glosa Comuns</h3>
                    <button onClick={() => setShowGlosaModal(true)} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 hover:bg-blue-700">
                      <PlusIcon className="w-4 h-4" /> Adicionar Glosa
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                          <th className="px-3 py-2 text-left">Código</th>
                          <th className="px-3 py-2 text-left">Descrição</th>
                          <th className="px-3 py-2 text-center">Evitar Automaticamente</th>
                          <th className="px-3 py-2 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {config.glosas_comuns.map(glosa => (
                          <tr key={glosa.id} className="border-t border-gray-200 dark:border-gray-700">
                            <td className="px-3 py-2">{glosa.codigo}</td>
                            <td className="px-3 py-2">{glosa.descricao}</td>
                            <td className="px-3 py-2 text-center">{glosa.evitar_automaticamente ? 'Sim' : 'Não'}</td>
                            <td className="px-3 py-2 text-center">
                              <button onClick={() => removerGlosa(glosa.id)} className="text-red-600 hover:text-red-800">
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <input type="checkbox" checked={config.evitar_glosa_automatica} onChange={e => setConfig({...config, evitar_glosa_automatica: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                    <label className="text-sm text-gray-700 dark:text-gray-300">Aplicar regras para evitar glosa automaticamente</label>
                  </div>
                </div>
              )}

              {/* 11. Relatórios */}
              {aba === 'relatorios' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-4">📈 Relatórios e Auditoria</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={config.notificar_faturamento} onChange={e => setConfig({...config, notificar_faturamento: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                      <label className="text-sm text-gray-700 dark:text-gray-300">Notificar novos faturamentos</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={config.notificar_glosa} onChange={e => setConfig({...config, notificar_glosa: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                      <label className="text-sm text-gray-700 dark:text-gray-300">Notificar quando houver glosa</label>
                    </div>
                  </div>
                </div>
              )}

              {/* 12. Configurações Avançadas */}
              {aba === 'avancado' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-4">⚙️ Configurações Avançadas</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={config.multi_estabelecimento} onChange={e => setConfig({...config, multi_estabelecimento: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                      <label className="text-sm text-gray-700 dark:text-gray-300">Multi-estabelecimento</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={config.versionar_contratos} onChange={e => setConfig({...config, versionar_contratos: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                      <label className="text-sm text-gray-700 dark:text-gray-300">Versionar contratos</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={config.multiplo_escala} onChange={e => setConfig({...config, multiplo_escala: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                      <label className="text-sm text-gray-700 dark:text-gray-300">Utilizar múltipla escala (diferentes tabelas por procedimento)</label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal de Regra por Especialidade */}
      {showRegraModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Nova Regra por Especialidade</h3>
              <button onClick={() => setShowRegraModal(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <select value={novaRegra.especialidade_id} onChange={e => setNovaRegra({...novaRegra, especialidade_id: e.target.value})} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600">
                <option value="">Selecione a especialidade...</option>
                {ESPECIALIDADES.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </select>
              <input type="number" placeholder="Limite de quantidade mensal (opcional)" value={novaRegra.limite_quantidade_mensal} onChange={e => setNovaRegra({...novaRegra, limite_quantidade_mensal: parseInt(e.target.value)})} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600" />
              <input type="number" step="0.01" placeholder="Valor diferenciado (opcional)" value={novaRegra.valor_diferenciado} onChange={e => setNovaRegra({...novaRegra, valor_diferenciado: parseFloat(e.target.value)})} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600" />
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={novaRegra.exige_autorizacao} onChange={e => setNovaRegra({...novaRegra, exige_autorizacao: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                <label className="text-sm text-gray-700 dark:text-gray-300">Exige autorização prévia</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowRegraModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancelar</button>
              <button onClick={adicionarRegraEspecialidade} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Adicionar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Glosa */}
      {showGlosaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Novo Motivo de Glosa</h3>
              <button onClick={() => setShowGlosaModal(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Código da Glosa" value={novaGlosa.codigo} onChange={e => setNovaGlosa({...novaGlosa, codigo: e.target.value})} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600" />
              <input type="text" placeholder="Descrição" value={novaGlosa.descricao} onChange={e => setNovaGlosa({...novaGlosa, descricao: e.target.value})} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600" />
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={novaGlosa.evitar_automaticamente} onChange={e => setNovaGlosa({...novaGlosa, evitar_automaticamente: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                <label className="text-sm text-gray-700 dark:text-gray-300">Evitar automaticamente</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowGlosaModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancelar</button>
              <button onClick={adicionarGlosa} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Adicionar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
