import { useState, useEffect } from 'react';
import { 
  PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, 
  BuildingOfficeIcon, XMarkIcon, Cog6ToothIcon, CalculatorIcon, 
  ChartBarIcon, ArchiveBoxIcon, CurrencyDollarIcon, 
  DocumentTextIcon, BeakerIcon, HeartIcon,
  ChevronDownIcon, ChevronUpIcon, InformationCircleIcon,
  AdjustmentsHorizontalIcon, TableCellsIcon, 
  ShieldCheckIcon, BoltIcon, AcademicCapIcon,
  PresentationChartLineIcon, BanknotesIcon,
  ClipboardDocumentListIcon, FolderPlusIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { procedimentosService, conveniosService } from '../services/supabaseService';
import { useTheme } from '../contexts/ThemeContext';

// ============================================
// UNIDADES DE MEDIDA - PADRÃO TISS (Tabela 60)
// ============================================
const UNIDADES_MEDIDA = [
  { value: '001', label: 'AMP - Ampola' },
  { value: '002', label: 'BUI - Bilhões de Unidades Internacionais' },
  { value: '003', label: 'BG - Bisnaga' },
  { value: '004', label: 'BOLS - Bolsa' },
  { value: '005', label: 'CX - Caixa' },
  { value: '006', label: 'CAP - Cápsula' },
  { value: '007', label: 'CARP - Carpule' },
  { value: '008', label: 'COM - Comprimido' },
  { value: '009', label: 'DOSE - Dose' },
  { value: '010', label: 'DRG - Drágea' },
  { value: '011', label: 'ENV - Envelope' },
  { value: '012', label: 'FLAC - Flaconete' },
  { value: '013', label: 'FR - Frasco' },
  { value: '014', label: 'FA - Frasco Ampola' },
  { value: '015', label: 'GAL - Galão' },
  { value: '016', label: 'GLOB - Glóbulo' },
  { value: '017', label: 'GTS - Gotas' },
  { value: '018', label: 'G - Grama' },
  { value: '019', label: 'L - Litro' },
  { value: '020', label: 'MCG - Microgramas' },
  { value: '021', label: 'MUI - Milhões de Unidades Internacionais' },
  { value: '022', label: 'MG - Miligrama' },
  { value: '023', label: 'ML - Mililitro' },
  { value: '024', label: 'OVL - Óvulo' },
  { value: '025', label: 'PAS - Pastilha' },
  { value: '026', label: 'LT - Lata' },
  { value: '027', label: 'PER - Pérola' },
  { value: '028', label: 'PIL - Pílula' },
  { value: '029', label: 'PT - Pote' },
  { value: '030', label: 'KG - Quilograma' },
  { value: '031', label: 'SER - Seringa' },
  { value: '032', label: 'SUP - Supositório' },
  { value: '033', label: 'TABLE - Tablete' },
  { value: '034', label: 'TUB - Tubete' },
  { value: '035', label: 'TB - Tubo' },
  { value: '036', label: 'UN - Unidade' },
  { value: '037', label: 'UI - Unidade Internacional' },
  { value: '038', label: 'CM - Centímetro' },
  { value: '039', label: 'CONJ - Conjunto' },
  { value: '040', label: 'KIT - Kit' },
  { value: '041', label: 'MÇ - Maço' },
  { value: '042', label: 'M - Metro' },
  { value: '043', label: 'PC - Pacote' },
  { value: '044', label: 'PÇ - Peça' },
  { value: '045', label: 'RL - Rolo' },
  { value: '046', label: 'GY - Gray' },
  { value: '047', label: 'CGY - Centigray' },
  { value: '048', label: 'PAR - Par' },
  { value: '049', label: 'ADES - Adesivo Transdérmico' },
  { value: '050', label: 'COM EFEV - Comprimido Efervescente' },
  { value: '051', label: 'COM MST - Comprimido Mastigável' },
  { value: '052', label: 'SACHE - Sachê' }
];

const TIPOS_ITEM = [
  { value: 'PROCEDIMENTO', label: 'Procedimento', icon: '🔧', color: 'blue' },
  { value: 'CONSULTA', label: 'Consulta', icon: '👨‍⚕️', color: 'green' },
  { value: 'EXAME', label: 'Exame', icon: '🔬', color: 'cyan' },
  { value: 'CIRURGIA', label: 'Cirurgia', icon: '🏥', color: 'purple' },
  { value: 'MATERIAL', label: 'Material', icon: '📦', color: 'orange' },
  { value: 'MEDICAMENTO', label: 'Medicamento', icon: '💊', color: 'red' },
  { value: 'OPME', label: 'OPME', icon: '🔩', color: 'pink' },
  { value: 'DIARIA', label: 'Diária', icon: '📅', color: 'yellow' },
  { value: 'TAXA', label: 'Taxa', icon: '💰', color: 'gray' }
];

const TABELAS_CALCULO = [
  { id: 'padrao', nome: 'Tabela Padrão', descricao: 'Valores sugeridos pelo sistema', icon: '📋' },
  { id: 'convenios', nome: 'Convênios', descricao: 'Valores específicos por convênio', icon: '🏢' }
];

export default function Procedimentos() {
  const { darkMode } = useTheme();
  const [procedimentos, setProcedimentos] = useState([]);
  const [convenios, setConvenios] = useState([]);
  const [convenioSelecionado, setConvenioSelecionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('tabela_padrao');
  const [expandedItems, setExpandedItems] = useState({});

  const [formData, setFormData] = useState({
    codigo: '', nome: '', tipo: 'PROCEDIMENTO', descricao: '',
    valor_referencia: '', valor_ajustado: '', unidade: '036',
    quantidade: 1, ch: '', porte: '', uco: '', pontos: '',
    grupo: '', subgrupo: '', observacoes: ''
  });

  useEffect(() => {
    carregarDados();
  }, []);

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
      toast.error('Erro ao excluir');
    }
  };

  const calcularValor = (dados) => {
    let valor = 0;
    switch (dados.tipo) {
      case 'MATERIAL':
      case 'MEDICAMENTO':
      case 'OPME':
        valor = (parseFloat(dados.valor_referencia) || 0) * (dados.quantidade || 1);
        break;
      case 'CONSULTA':
        valor = parseFloat(dados.valor_referencia) || 0;
        break;
      case 'EXAME':
        valor = parseFloat(dados.valor_referencia) || 0;
        break;
      default:
        valor = parseFloat(dados.valor_referencia) || 0;
    }
    return valor;
  };

  const handleCalcular = () => {
    const valor = calcularValor(formData);
    setFormData(prev => ({ ...prev, valor_ajustado: valor.toFixed(2) }));
    toast.info(`Valor calculado: R$ ${valor.toFixed(2)}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.codigo || !formData.nome) {
      toast.error('Código e nome são obrigatórios');
      return;
    }

    const valorCalculado = calcularValor(formData);
    const procedimentoData = {
      codigo_tuss: formData.codigo,
      nome: formData.nome,
      tipo: formData.tipo,
      grupo: formData.grupo,
      valor_sugerido: valorCalculado,
      tabela: 'TUSS',
      convenio_id: abaAtiva === 'convenios' ? convenioSelecionado?.id : null,
      dados_adicionais: {
        ch: formData.ch, porte: formData.porte, uco: formData.uco, pontos: formData.pontos,
        quantidade: formData.quantidade, unidade: formData.unidade,
        valor_referencia: formData.valor_referencia,
        observacoes: formData.observacoes, subgrupo: formData.subgrupo
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
      toast.error('Erro ao salvar procedimento');
    }
  };

  const resetForm = () => {
    setFormData({
      codigo: '', nome: '', tipo: 'PROCEDIMENTO', descricao: '',
      valor_referencia: '', valor_ajustado: '', unidade: '036',
      quantidade: 1, ch: '', porte: '', uco: '', pontos: '',
      grupo: '', subgrupo: '', observacoes: ''
    });
  };

  const getColorByType = (tipo) => {
    const colors = {
      PROCEDIMENTO: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      CONSULTA: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      EXAME: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
      CIRURGIA: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      MATERIAL: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      MEDICAMENTO: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      OPME: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300'
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filtered = procedimentos.filter(p => {
    if (abaAtiva === 'convenios' && p.convenio_id !== convenioSelecionado?.id) return false;
    if (abaAtiva === 'tabela_padrao' && p.convenio_id !== null) return false;
    return p.codigo_tuss?.toLowerCase().includes(searchTerm.toLowerCase()) || 
           p.nome?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalItens = filtered.length;
  const valorTotalCalc = filtered.reduce((sum, p) => sum + (p.valor_sugerido || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Carregando procedimentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header com gradiente */}
          <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 shadow-xl">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Tabela de Procedimentos</h1>
                  <p className="text-indigo-100">Gerencie procedimentos, materiais, medicamentos e OPME</p>
                </div>
                <button 
                  onClick={() => { setEditing(null); resetForm(); setShowModal(true); }} 
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-white hover:bg-white/30 transition-all duration-200"
                >
                  <PlusIcon className="w-4 h-4" />
                  Novo Procedimento
                </button>
              </div>
            </div>
          </div>

          {/* Abas principais */}
          <div className="flex gap-2 mb-6 bg-white dark:bg-gray-800 rounded-xl p-1 shadow-sm">
            {TABELAS_CALCULO.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setAbaAtiva(tab.id); setConvenioSelecionado(null); }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                  abaAtiva === tab.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                {tab.nome}
                <span className="text-xs opacity-75">{tab.descricao}</span>
              </button>
            ))}
          </div>

          {/* Seletor de Convênio (só aparece na aba convênios) */}
          {abaAtiva === 'convenios' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <BuildingOfficeIcon className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Convênio</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {convenios.filter(c => c.ativo).map(c => (
                  <button
                    key={c.id}
                    onClick={() => setConvenioSelecionado(c)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      convenioSelecionado?.id === c.id
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {c.razao_social}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Busca e filtros */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6 shadow-sm">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por código ou nome do procedimento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>
          </div>

          {/* Cards de resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Total de Itens</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{totalItens}</p>
                </div>
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                  <ClipboardDocumentListIcon className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Valor Total</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">R$ {valorTotalCalc.toFixed(2)}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <BanknotesIcon className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Convênio</p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white mt-1 truncate">
                    {abaAtiva === 'convenios' && convenioSelecionado ? convenioSelecionado.razao_social : 'Tabela Padrão'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <BuildingOfficeIcon className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de procedimentos */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-8"></th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor (R$)</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filtered.map((p) => {
                    const isExpanded = expandedItems[p.id];
                    const tipoItem = TIPOS_ITEM.find(t => t.value === p.tipo);
                    return (
                      <>
                        <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                          <td className="px-4 py-3">
                            <button onClick={() => toggleExpand(p.id)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                              {isExpanded ? <ChevronUpIcon className="w-4 h-4 text-gray-400" /> : <ChevronDownIcon className="w-4 h-4 text-gray-400" />}
                            </button>
                          </td>
                          <td className="px-4 py-3 font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400">{p.codigo_tuss}</td>
                          <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">{p.nome}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getColorByType(p.tipo)}`}>
                              <span>{tipoItem?.icon}</span>
                              {p.tipo}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              R$ {(p.valor_sugerido || 0).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditing(p); setFormData({...p, valor_referencia: p.valor_sugerido}); setShowModal(true); }} className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-gray-50 dark:bg-gray-700/30">
                            <td colSpan="6" className="px-4 py-3">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                {p.dados_adicionais?.ch && <div><span className="text-xs text-gray-500">CH:</span> <span className="font-mono">{p.dados_adicionais.ch}</span></div>}
                                {p.dados_adicionais?.porte && <div><span className="text-xs text-gray-500">Porte:</span> <span>{p.dados_adicionais.porte}</span></div>}
                                {p.dados_adicionais?.uco && <div><span className="text-xs text-gray-500">UCO:</span> <span>{p.dados_adicionais.uco}</span></div>}
                                {p.dados_adicionais?.pontos && <div><span className="text-xs text-gray-500">Pontos:</span> <span>{p.dados_adicionais.pontos}</span></div>}
                                {p.dados_adicionais?.quantidade && p.tipo !== 'PROCEDIMENTO' && (
                                  <div><span className="text-xs text-gray-500">Quantidade:</span> <span>{p.dados_adicionais.quantidade} {UNIDADES_MEDIDA.find(u => u.value === p.dados_adicionais.unidade)?.label || ''}</span></div>
                                )}
                                {p.grupo && <div><span className="text-xs text-gray-500">Grupo:</span> <span>{p.grupo}</span></div>}
                                {p.dados_adicionais?.observacoes && (
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
              <div className="text-center py-12">
                <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">Nenhum procedimento encontrado</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                  {editing ? 'Editar Procedimento' : 'Novo Procedimento'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-5">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo *</label>
                    <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700">
                      {TIPOS_ITEM.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código *</label>
                    <input type="text" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm font-mono dark:bg-gray-700" required />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome *</label>
                  <input type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" required />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grupo</label>
                    <input type="text" value={formData.grupo} onChange={e => setFormData({...formData, grupo: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subgrupo</label>
                    <input type="text" value={formData.subgrupo} onChange={e => setFormData({...formData, subgrupo: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" />
                  </div>
                </div>
                
                {/* Campos específicos por tipo */}
                {(formData.tipo === 'MATERIAL' || formData.tipo === 'MEDICAMENTO' || formData.tipo === 'OPME') && (
                  <div className="grid grid-cols-3 gap-4 mb-4">
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
                      <input type="number" step="0.01" value={formData.valor_referencia} onChange={e => setFormData({...formData, valor_referencia: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" />
                    </div>
                  </div>
                )}
                
                {/* Valor para outros tipos */}
                {!['MATERIAL', 'MEDICAMENTO', 'OPME'].includes(formData.tipo) && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor de Referência (R$)</label>
                    <input type="number" step="0.01" value={formData.valor_referencia} onChange={e => setFormData({...formData, valor_referencia: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" />
                  </div>
                )}
                
                <button type="button" onClick={handleCalcular} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 mb-4">
                  <CalculatorIcon className="w-4 h-4" />
                  Calcular Valor
                </button>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Calculado (R$)</label>
                  <input type="number" step="0.01" value={formData.valor_ajustado} readOnly className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 font-mono font-bold text-green-600 dark:text-green-400" />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                  <textarea rows="3" value={formData.observacoes} onChange={e => setFormData({...formData, observacoes: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" />
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm font-medium">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-medium shadow-md">
                    {editing ? 'Atualizar' : 'Salvar'}
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
