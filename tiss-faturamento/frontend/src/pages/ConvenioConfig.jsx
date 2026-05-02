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
  PencilIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  BanknotesIcon,
  DocumentArrowUpIcon,
  ScaleIcon,
  PhotoIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import { useTheme } from '../contexts/ThemeContext';

// Lista de especialidades disponíveis
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

// Tipos de cobrança
const TIPOS_COBRANCA = [
  { value: 'procedimento', label: 'Por Procedimento' },
  { value: 'pacote', label: 'Pacote' },
  { value: 'diaria', label: 'Diária' },
  { value: 'consulta', label: 'Consulta' }
];

// Formas de envio
const FORMAS_ENVIO = [
  { value: 'tiss_xml', label: 'TISS XML' },
  { value: 'portal', label: 'Portal (Orizon)' },
  { value: 'manual', label: 'Manual' },
  { value: 'webservice', label: 'Webservice' }
];

// Tipos de guia
const TIPOS_GUIA = [
  { value: 'sp_sadt', label: 'SP/SADT' },
  { value: 'internacao', label: 'Internação' },
  { value: 'honorario', label: 'Honorário' }
];

// Tipos de documentos obrigatórios
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
  const { darkMode } = useTheme(); // MOVI PARA DENTRO DO COMPONENTE
  
  const [convenios, setConvenios] = useState([]);
  const [convenioSelecionado, setConvenioSelecionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aba, setAba] = useState('cadastrais');
  const [showRegraModal, setShowRegraModal] = useState(false);
  const [editingRegra, setEditingRegra] = useState(null);
  const [showGlosaModal, setShowGlosaModal] = useState(false);

  // Configurações do convênio
  const [config, setConfig] = useState({
    // 1. Dados cadastrais
    nome: '',
    cnpj: '',
    codigo_interno: '',
    tipo: 'convenio',
    telefone: '',
    email: '',
    endereco: '',
    cidade: '',
    estado: 'SP',
    status: 'ativo',
    
    // 2. Regras de faturamento
    tipo_cobranca: 'procedimento',
    forma_envio: 'tiss_xml',
    exige_autorizacao_previa: false,
    tipo_guia: 'sp_sadt',
    permite_faturamento_parcial: false,
    
    // 3. Tabelas e valores
    tabela_utilizada: 'TUSS',
    percentual_ajuste: 100,
    multiplicador_urgencia: 1.0,
    multiplicador_eletivo: 1.0,
    
    // 4. Regras por especialidade
    regras_especialidade: [],
    
    // 5. Documentação
    documentos_obrigatorios: [],
    formatos_aceitos: ['PDF', 'JPEG', 'PNG'],
    
    // 6. Prazos e financeiro
    prazo_envio_dias: 30,
    prazo_pagamento_dias: 60,
    tipo_pagamento: 'fixo',
    prazo_reapresentacao_glosa: 30,
    
    // 7. Integrações
    url_webservice: '',
    usuário_webservice: '',
    senha_webservice: '',
    retorno_automatico: false,
    
    // 8. Regras por profissional
    regras_profissional: [],
    
    // 9. Planos
    planos: [],
    
    // 10. Glosas
    glosas_comuns: [],
    evitar_glosa_automatica: false,
    parametros_reapresentacao: '',
    
    // 11. Relatórios
    notificar_faturamento: false,
    notificar_glosa: false,
    
    // 12. Configurações avançadas
    multi_estabelecimento: false,
    regras_por_unidade: [],
    versionar_contratos: false
  });

  // Nova regra de especialidade
  const [novaRegra, setNovaRegra] = useState({
    especialidade_id: '',
    limite_quantidade_mensal: null,
    valor_diferenciado: null,
    exige_autorizacao: false
  });

  // Nova glosa
  const [novaGlosa, setNovaGlosa] = useState({
    codigo: '',
    descricao: '',
    tipo: 'glosa',
    evitar_automaticamente: false
  });

  // Novo plano
  const [novoPlano, setNovoPlano] = useState({
    nome: '',
    codigo: '',
    cobertura: '',
    regras_especificas: ''
  });

  useEffect(() => {
    carregarConvenios();
  }, []);

  const carregarConvenios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('convenios')
        .select('*')
        .order('razao_social', { ascending: true });
      
      if (error) throw error;
      setConvenios(data || []);
      
      if (data && data.length > 0 && !convenioSelecionado) {
        selecionarConvenio(data[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar convênios:', error);
      toast.error('Erro ao carregar convênios');
    } finally {
      setLoading(false);
    }
  };

  // Resto do código continua igual...
  const selecionarConvenio = async (convenio) => {
    setConvenioSelecionado(convenio);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('convenios_config')
        .select('*')
        .eq('convenio_id', convenio.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data && data.configuracoes) {
        setConfig(JSON.parse(data.configuracoes));
      } else {
        setConfig({
          ...config,
          nome: convenio.razao_social,
          cnpj: convenio.cnpj || '',
          codigo_interno: convenio.codigo_prestador || ''
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const salvarConfiguracoes = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('convenios_config')
        .upsert({
          convenio_id: convenioSelecionado.id,
          configuracoes: JSON.stringify(config),
          updated_at: new Date().toISOString()
        }, { onConflict: 'convenio_id' });
      
      if (error) throw error;
      toast.success('Configurações salvas com sucesso!');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Resto do JSX continua igual...
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Configurações Avançadas de Convênios
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Configure regras de faturamento, tabelas, prazos e integrações
            </p>
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
            Salvar Configurações
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
            {/* Tabs - manter igual */}
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

            {/* Restante do conteúdo das abas (manter o mesmo código) */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              {/* Aqui vai o conteúdo de cada aba - igual ao que você já tem */}
              <p className="text-gray-500">Conteúdo da aba {aba}</p>
            </div>
          </>
        )}
      </div>

      {/* Modais - manter igual */}
      {showRegraModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Nova Regra por Especialidade</h3>
              <button onClick={() => setShowRegraModal(false)}><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <select value={novaRegra.especialidade_id} onChange={e => setNovaRegra({...novaRegra, especialidade_id: e.target.value})} className="w-full border rounded-lg px-3 py-2">
                <option value="">Selecione a especialidade...</option>
                {ESPECIALIDADES.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </select>
              <input type="number" placeholder="Limite de quantidade mensal (opcional)" value={novaRegra.limite_quantidade_mensal} onChange={e => setNovaRegra({...novaRegra, limite_quantidade_mensal: parseInt(e.target.value)})} className="w-full border rounded-lg px-3 py-2" />
              <input type="number" step="0.01" placeholder="Valor diferenciado (opcional)" value={novaRegra.valor_diferenciado} onChange={e => setNovaRegra({...novaRegra, valor_diferenciado: parseFloat(e.target.value)})} className="w-full border rounded-lg px-3 py-2" />
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={novaRegra.exige_autorizacao} onChange={e => setNovaRegra({...novaRegra, exige_autorizacao: e.target.checked})} className="w-4 h-4" />
                <label>Exige autorização prévia</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowRegraModal(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
              <button onClick={adicionarRegraEspecialidade} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Adicionar</button>
            </div>
          </div>
        </div>
      )}

      {showGlosaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Novo Motivo de Glosa</h3>
              <button onClick={() => setShowGlosaModal(false)}><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Código da Glosa" value={novaGlosa.codigo} onChange={e => setNovaGlosa({...novaGlosa, codigo: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
              <input type="text" placeholder="Descrição" value={novaGlosa.descricao} onChange={e => setNovaGlosa({...novaGlosa, descricao: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={novaGlosa.evitar_automaticamente} onChange={e => setNovaGlosa({...novaGlosa, evitar_automaticamente: e.target.checked})} className="w-4 h-4" />
                <label>Evitar automaticamente</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowGlosaModal(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
              <button onClick={adicionarGlosa} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Adicionar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
