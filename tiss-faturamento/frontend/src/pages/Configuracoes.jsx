import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { setConfig as setTissConfig } from '../lib/tissGenerator';
import { supabase } from '../lib/supabaseClient';
import { useUnidade } from '../contexts/UnidadeContext';
import { TODAS_UNIDADES_ID, applyUnidadeToPayload, filterByUnidade } from '../services/unidadesService';
import { 
  BuildingOfficeIcon, 
  CheckCircleIcon, 
  ArrowPathIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  UserIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

// Lista de UFs com siglas
const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const DEFAULT_CONFIG = {
  nome_empresa: 'Minha Clínica',
  nome_contratado: 'MINHA CLÍNICA LTDA',
  cnpj: '',
  cnes: '',
  conselho_clinica: '06',
  uf_clinica: 'SP',
  cbos_clinica: '225125',
  logo_base64: ''
};

export default function Configuracoes() {
  const { unidadeAtualId, unidadeAtual } = useUnidade();
  const configKey = unidadeAtualId && unidadeAtualId !== TODAS_UNIDADES_ID ? `config_clinica_${unidadeAtualId}` : 'config_clinica';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  
  const [usuarios, setUsuarios] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    email: '',
    senha: '',
    nome: '',
    role: 'usuario'
  });
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false);

  useEffect(() => {
    carregarDados();
  }, [unidadeAtualId]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Carregar configurações da clínica
      const { data: configData, error: configError } = await supabase
        .from('configuracoes')
        .select('*')
        .eq('chave', configKey)
        .maybeSingle();

      if (configError) throw configError;
      
      if (configData && configData.valor) {
        const parsedConfig = JSON.parse(configData.valor);
        setConfig({ ...DEFAULT_CONFIG, ...parsedConfig });
        setTissConfig(parsedConfig);
      } else {
        setConfig(DEFAULT_CONFIG);
        setTissConfig(DEFAULT_CONFIG);
      }

      // Carregar usuários
      await carregarUsuarios();
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const converterLogoParaBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleLogoClinicaChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem válida para o logo da clínica.');
      return;
    }

    if (file.size > 1024 * 1024) {
      toast.error('O logo da clínica deve ter no máximo 1MB.');
      return;
    }

    try {
      const base64 = await converterLogoParaBase64(file);
      setConfig(prev => ({ ...prev, logo_base64: base64 }));
      toast.success('Logo carregado. Clique em Salvar para gravar nas configurações.');
    } catch (error) {
      console.error('Erro ao carregar logo da clínica:', error);
      toast.error('Erro ao carregar logo da clínica.');
    }
  };

  const carregarUsuarios = async () => {
    setCarregandoUsuarios(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsuarios(filterByUnidade(data || [], unidadeAtualId));
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setCarregandoUsuarios(false);
    }
  };

  const salvarConfiguracoes = async () => {
    if (!config.nome_contratado) {
      toast.error('Nome do contratado (clínica/hospital) é obrigatório');
      return;
    }

    setSaving(true);
    try {
      // Verificar se já existe a configuração
      const { data: existing, error: checkError } = await supabase
        .from('configuracoes')
        .select('chave')
        .eq('chave', configKey)
        .maybeSingle();

      if (checkError) throw checkError;

      let error;
      if (existing) {
        const { error: updateError } = await supabase
          .from('configuracoes')
          .update({
            valor: JSON.stringify({ ...config, unidade_id: unidadeAtualId }),
            updated_at: new Date().toISOString()
          })
          .eq('chave', configKey);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('configuracoes')
          .insert([applyUnidadeToPayload({
            chave: configKey,
            valor: JSON.stringify({ ...config, unidade_id: unidadeAtualId }),
            descricao: `Configurações da clínica${unidadeAtual?.nome ? ` - ${unidadeAtual.nome}` : ''}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, unidadeAtualId)]);
        error = insertError;
      }

      if (error) throw error;

      localStorage.setItem(configKey, JSON.stringify(config));
      setTissConfig(config);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const criarUsuario = async () => {
    if (!userForm.email || !userForm.senha || !userForm.nome) {
      toast.error('Preencha todos os campos');
      return;
    }

    setSaving(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userForm.email,
        password: userForm.senha,
        options: {
          data: {
            nome: userForm.nome,
            role: userForm.role
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: dbError } = await supabase
          .from('usuarios')
          .insert({
            id: authData.user.id,
            email: userForm.email,
            nome: userForm.nome,
            role: userForm.role,
            ativo: true,
            created_at: new Date().toISOString(),
            unidade_id: unidadeAtualId !== TODAS_UNIDADES_ID ? unidadeAtualId : null
          });

        if (dbError) throw dbError;

        toast.success('Usuário criado com sucesso!');
        setShowUserModal(false);
        resetUserForm();
        await carregarUsuarios();
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      toast.error(error.message || 'Erro ao criar usuário');
    } finally {
      setSaving(false);
    }
  };

  const atualizarUsuario = async () => {
    if (!userForm.nome) {
      toast.error('Nome é obrigatório');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          nome: userForm.nome,
          role: userForm.role,
          updated_at: new Date().toISOString(),
          unidade_id: unidadeAtualId !== TODAS_UNIDADES_ID ? unidadeAtualId : null
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      if (userForm.senha) {
        const { error: authError } = await supabase.auth.updateUser({
          password: userForm.senha
        });
        if (authError) throw authError;
      }

      toast.success('Usuário atualizado com sucesso!');
      setShowUserModal(false);
      resetUserForm();
      await carregarUsuarios();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error(error.message || 'Erro ao atualizar usuário');
    } finally {
      setSaving(false);
    }
  };

  const excluirUsuario = async (usuario) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${usuario.nome}?`)) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ ativo: false, updated_at: new Date().toISOString(), unidade_id: unidadeAtualId !== TODAS_UNIDADES_ID ? unidadeAtualId : null })
        .eq('id', usuario.id);

      if (error) throw error;

      toast.success('Usuário desativado com sucesso!');
      await carregarUsuarios();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast.error('Erro ao excluir usuário');
    } finally {
      setSaving(false);
    }
  };

  const resetUserForm = () => {
    setEditingUser(null);
    setUserForm({
      email: '',
      senha: '',
      nome: '',
      role: 'usuario'
    });
  };

  const abrirModalUsuario = (usuario = null) => {
    if (usuario) {
      setEditingUser(usuario);
      setUserForm({
        email: usuario.email,
        senha: '',
        nome: usuario.nome,
        role: usuario.role
      });
    } else {
      resetUserForm();
    }
    setShowUserModal(true);
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
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Configurações da Clínica
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Configure os dados da clínica/hospital para a unidade selecionada
            </p>
          </div>
          <button
            onClick={carregarDados}
            className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Recarregar
          </button>
        </div>

        {/* Configurações da Clínica */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center gap-2">
              <BuildingOfficeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-gray-800 dark:text-white">Dados da Clínica / Hospital</h3>
            </div>
          </div>
          
          <div className="p-5">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome da Clínica/Hospital *
                </label>
                <input 
                  type="text" 
                  value={config.nome_contratado} 
                  onChange={e => setConfig({...config, nome_contratado: e.target.value.toUpperCase()})} 
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                  required 
                />
              </div>

              <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-gray-50 dark:bg-gray-700/30">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="w-28 h-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center overflow-hidden">
                    {config.logo_base64 ? (
                      <img src={config.logo_base64} alt="Logo da clínica" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <PhotoIcon className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo da Clínica</label>
                    <input type="file" accept="image/*" onChange={handleLogoClinicaChange} className="block w-full text-sm text-gray-600 dark:text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-300" />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PNG/JPG até 1MB. O logo será usado nas impressões da clínica e contas faturadas.</p>
                  </div>
                  {config.logo_base64 && (
                    <button type="button" onClick={() => setConfig({...config, logo_base64: ''})} className="px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                      Remover logo
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CNPJ</label>
                  <input 
                    type="text" 
                    value={config.cnpj} 
                    onChange={e => setConfig({...config, cnpj: e.target.value})} 
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CNES</label>
                  <input 
                    type="text" 
                    value={config.cnes} 
                    onChange={e => setConfig({...config, cnes: e.target.value})} 
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                    placeholder="0000000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conselho</label>
                  <select 
                    value={config.conselho_clinica} 
                    onChange={e => setConfig({...config, conselho_clinica: e.target.value})} 
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  >
                    <option value="06">CRM - Conselho Regional de Medicina</option>
                    <option value="08">CRO - Conselho Regional de Odontologia</option>
                    <option value="03">CRF - Conselho Regional de Farmácia</option>
                    <option value="02">COREN - Conselho de Enfermagem</option>
                    <option value="05">CREFITO - Conselho de Fisioterapia</option>
                    <option value="09">CRP - Conselho de Psicologia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">UF</label>
                  <select 
                    value={config.uf_clinica} 
                    onChange={e => setConfig({...config, uf_clinica: e.target.value})} 
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  >
                    {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CBOS</label>
                  <input 
                    type="text" 
                    value={config.cbos_clinica} 
                    onChange={e => setConfig({...config, cbos_clinica: e.target.value})} 
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                    placeholder="225125"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">Código Brasileiro de Ocupações (CBO) da clínica</p>
            </div>
          </div>
        </div>

        {/* Usuários do Sistema */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="font-semibold text-gray-800 dark:text-white">Usuários do Sistema</h3>
            </div>
            <button
              onClick={() => abrirModalUsuario()}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
            >
              <PlusIcon className="w-4 h-4" />
              Novo Usuário
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">E-mail</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Perfil</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Criado em</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {carregandoUsuarios ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : usuarios.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      Nenhum usuário cadastrado
                    </td>
                  </tr>
                ) : (
                  usuarios.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">{usuario.nome}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{usuario.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          usuario.role === 'admin' 
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' 
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        }`}>
                          {usuario.role === 'admin' ? 'Administrador' : 'Usuário'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          usuario.ativo !== false
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          {usuario.ativo !== false ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(usuario.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-1 justify-center">
                          <button 
                            onClick={() => abrirModalUsuario(usuario)} 
                            className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            title="Editar"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => excluirUsuario(usuario)} 
                            className="p-1 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Excluir"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={salvarConfiguracoes}
            disabled={saving}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Salvando...
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-4 h-4" />
                Salvar Configurações
              </>
            )}
          </button>
        </div>

        {/* Modal de Usuário */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                    {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                  </h3>
                  <button 
                    onClick={() => setShowUserModal(false)} 
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="p-5">
                <div className="space-y-4">
                  {!editingUser && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail *</label>
                      <input 
                        type="email" 
                        value={userForm.email} 
                        onChange={e => setUserForm({...userForm, email: e.target.value})} 
                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                        placeholder="usuario@exemplo.com"
                        required 
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome *</label>
                    <input 
                      type="text" 
                      value={userForm.nome} 
                      onChange={e => setUserForm({...userForm, nome: e.target.value})} 
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                      required 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {editingUser ? 'Nova Senha (opcional)' : 'Senha *'}
                    </label>
                    <input 
                      type="password" 
                      value={userForm.senha} 
                      onChange={e => setUserForm({...userForm, senha: e.target.value})} 
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                      placeholder={editingUser ? 'Deixe em branco para manter a atual' : '********'}
                      required={!editingUser}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Perfil de Acesso</label>
                    <select 
                      value={userForm.role} 
                      onChange={e => setUserForm({...userForm, role: e.target.value})} 
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    >
                      <option value="admin">Administrador - Acesso total</option>
                      <option value="usuario">Usuário - Acesso restrito</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowUserModal(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={editingUser ? atualizarUsuario : criarUsuario}
                    disabled={saving}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md flex items-center gap-2"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <CheckCircleIcon className="w-4 h-4" />
                    )}
                    {editingUser ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
