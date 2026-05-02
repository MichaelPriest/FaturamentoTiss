import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, BuildingOfficeIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { conveniosService } from '../services/supabaseService';
import { useTheme } from '../contexts/ThemeContext';

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

export default function Convenios() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [convenios, setConvenios] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState('dados');
  const [formData, setFormData] = useState({
    registro_ans: '',
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    tabela_padrao: 'TUSS',
    prazo_envio_dias: 30,
    ativo: true,
    codigo_prestador: '',
    senha_prestador: '',
    cnes: '',
    ambiente: 'homologacao',
    url_webservice: '',
    tipo_tabela: 'TUSS',
    multiplicador: 1.00,
    coparticipacao: false,
    percentual_coparticipacao: 0,
    proximo_numero_guia: 1000000,
    ultimo_numero_guia: 999999,
    versao_tiss: '4.03.00'
  });

  useEffect(() => {
    carregarConvenios();
  }, []);

  const carregarConvenios = async () => {
    setLoading(true);
    try {
      const data = await conveniosService.listar();
      setConvenios(data);
    } catch (error) {
      console.error('Erro ao carregar convênios:', error);
      toast.error('Erro ao carregar convênios');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.registro_ans || !formData.razao_social) {
      toast.error('Registro ANS e Razão Social são obrigatórios');
      return;
    }
    if (!formData.codigo_prestador) {
      toast.error('Código do prestador é obrigatório');
      return;
    }

    try {
      if (editing) {
        await conveniosService.atualizar(editing.id, formData);
        toast.success('Convênio atualizado com sucesso!');
      } else {
        await conveniosService.criar(formData);
        toast.success('Convênio cadastrado com sucesso!');
      }
      await carregarConvenios();
      setShowModal(false);
      setEditing(null);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar convênio:', error);
      toast.error('Erro ao salvar convênio');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir este convênio?')) {
      try {
        await conveniosService.deletar(id);
        toast.success('Convênio excluído com sucesso!');
        await carregarConvenios();
      } catch (error) {
        console.error('Erro ao excluir convênio:', error);
        toast.error('Erro ao excluir convênio');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      registro_ans: '', razao_social: '', nome_fantasia: '', cnpj: '',
      tabela_padrao: 'TUSS', prazo_envio_dias: 30, ativo: true,
      codigo_prestador: '', senha_prestador: '', cnes: '',
      ambiente: 'homologacao', url_webservice: '',
      tipo_tabela: 'TUSS', multiplicador: 1.00, coparticipacao: false,
      percentual_coparticipacao: 0, proximo_numero_guia: 1000000, 
      ultimo_numero_guia: 999999, versao_tiss: '4.03.00'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Carregando convênios...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Convênios / Operadoras
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Gerencie os convênios e operadoras de saúde
          </p>
        </div>
        <button 
          onClick={() => { setEditing(null); resetForm(); setShowModal(true); }} 
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg"
        >
          <PlusIcon className="w-4 h-4" /> Novo Convênio
        </button>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total de Convênios</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{convenios.length}</p>
            </div>
            <BuildingOfficeIcon className="w-8 h-8 text-blue-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Ativos</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{convenios.filter(c => c.ativo).length}</p>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Inativos</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{convenios.filter(c => !c.ativo).length}</p>
            </div>
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Ambiente Produção</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{convenios.filter(c => c.ambiente === 'producao').length}</p>
            </div>
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Tabela de Convênios */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Registro ANS</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Razão Social</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código Prestador</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Versão TISS</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ambiente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {convenios.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-gray-900 dark:text-gray-100">{c.registro_ans}</td>
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">{c.razao_social}</td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-600 dark:text-gray-400">{c.codigo_prestador || '-'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{c.versao_tiss || '4.03.00'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.ambiente === 'producao' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'}`}>
                      {c.ambiente === 'producao' ? 'Produção' : 'Homologação'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.ativo ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                      {c.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <button 
                        onClick={() => { setEditing(c); setFormData({...c, versao_tiss: c.versao_tiss || '4.03.00'}); setAba('dados'); setShowModal(true); }} 
                        className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        title="Editar"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => navigate(`/convenio-config/${c.id}`)} 
                        className="p-1 rounded-lg text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                        title="Configurações Avançadas"
                      >
                        <Cog6ToothIcon className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(c.id)} 
                        className="p-1 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Excluir"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {convenios.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                    <BuildingOfficeIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    Nenhum convênio cadastrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                {editing ? 'Editar Convênio' : 'Novo Convênio'}
              </h3>
            </div>
            
            <div className="p-5">
              {/* Tabs */}
              <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-5 overflow-x-auto">
                <button 
                  onClick={() => setAba('dados')} 
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 whitespace-nowrap ${aba === 'dados' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  Dados
                </button>
                <button 
                  onClick={() => setAba('prestador')} 
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 whitespace-nowrap ${aba === 'prestador' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  Prestador
                </button>
                <button 
                  onClick={() => setAba('guias')} 
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 whitespace-nowrap ${aba === 'guias' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  Numeração Guias
                </button>
                <button 
                  onClick={() => setAba('financeiro')} 
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 whitespace-nowrap ${aba === 'financeiro' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  Financeiro
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Aba Dados */}
                {aba === 'dados' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Registro ANS *</label>
                      <input type="text" value={formData.registro_ans} onChange={e => setFormData({...formData, registro_ans: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Razão Social *</label>
                      <input type="text" value={formData.razao_social} onChange={e => setFormData({...formData, razao_social: e.target.value.toUpperCase()})} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Fantasia</label>
                      <input type="text" value={formData.nome_fantasia} onChange={e => setFormData({...formData, nome_fantasia: e.target.value.toUpperCase()})} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CNPJ</label>
                      <input type="text" value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" placeholder="00.000.000/0000-00" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ambiente</label>
                        <select value={formData.ambiente} onChange={e => setFormData({...formData, ambiente: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                          <option value="homologacao">🏗️ Homologação (Testes)</option>
                          <option value="producao">🚀 Produção</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL WebService</label>
                        <input type="text" value={formData.url_webservice} onChange={e => setFormData({...formData, url_webservice: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" placeholder="https://..." />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={formData.ativo} onChange={e => setFormData({...formData, ativo: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600" />
                      <label className="text-sm text-gray-700 dark:text-gray-300">Convênio Ativo</label>
                    </div>
                  </div>
                )}

                {/* Aba Prestador */}
                {aba === 'prestador' && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <p className="text-xs text-blue-700 dark:text-blue-300">⚠️ Dados específicos para este convênio. Cada convênio pode ter um código de prestador diferente e versão TISS própria.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código do Prestador na Operadora *</label>
                      <input type="text" value={formData.codigo_prestador} onChange={e => setFormData({...formData, codigo_prestador: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha do Prestador</label>
                      <input type="password" value={formData.senha_prestador} onChange={e => setFormData({...formData, senha_prestador: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CNES</label>
                      <input type="text" value={formData.cnes} onChange={e => setFormData({...formData, cnes: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" placeholder="0000000" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Versão do Padrão TISS</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['4.01.00', '4.02.00', '4.03.00'].map((versao) => (
                          <button key={versao} type="button" onClick={() => setFormData({...formData, versao_tiss: versao})} className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${formData.versao_tiss === versao ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                            TISS {versao}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Aba Numeração Guias */}
                {aba === 'guias' && (
                  <div className="space-y-4">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">📋 Defina o número inicial para a sequência de guias deste convênio.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Próximo Número da Guia</label>
                        <input type="number" value={formData.proximo_numero_guia} onChange={e => setFormData({...formData, proximo_numero_guia: parseInt(e.target.value)})} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Último Número (Limite)</label>
                        <input type="number" value={formData.ultimo_numero_guia} onChange={e => setFormData({...formData, ultimo_numero_guia: parseInt(e.target.value)})} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Aba Financeiro */}
                {aba === 'financeiro' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Tabela</label>
                      <select value={formData.tipo_tabela} onChange={e => setFormData({...formData, tipo_tabela: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                        <option value="TUSS">Tabela TUSS</option>
                        <option value="CBHPM">Tabela CBHPM</option>
                        <option value="PROPRIA">Tabela Própria</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Multiplicador de valores (%)</label>
                      <input type="number" step="0.01" value={formData.multiplicador} onChange={e => setFormData({...formData, multiplicador: parseFloat(e.target.value)})} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={formData.coparticipacao} onChange={e => setFormData({...formData, coparticipacao: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600" />
                      <label className="text-sm text-gray-700 dark:text-gray-300">Possui coparticipação</label>
                    </div>
                    {formData.coparticipacao && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Percentual de coparticipação (%)</label>
                        <input type="number" step="1" value={formData.percentual_coparticipacao} onChange={e => setFormData({...formData, percentual_coparticipacao: parseFloat(e.target.value)})} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md">{editing ? 'Atualizar' : 'Salvar'} Convênio</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
