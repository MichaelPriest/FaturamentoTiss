// src/pages/Perfil.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase, logAuthState } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { 
  UserIcon, 
  EnvelopeIcon, 
  KeyIcon, 
  CheckCircleIcon, 
  ArrowPathIcon,
  PencilIcon,
  XMarkIcon,
  ShieldCheckIcon,
  CalendarIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

export default function Perfil() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [perfil, setPerfil] = useState({
    nome: '',
    email: '',
    role: 'usuario',
    created_at: '',
    ultimo_acesso: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    senha_atual: '',
    nova_senha: '',
    confirmar_senha: ''
  });

  const [clinica, setClinica] = useState({
    nome_contratado: '',
    cnpj: '',
    cnes: ''
  });

  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    carregarPerfil();
  }, []);

  const carregarPerfil = async () => {
    setLoading(true);
    try {
      console.log('🔍 Carregando perfil do usuário...');
      await logAuthState();
      
      // Verificar sessão atual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (!session) {
        console.error('❌ Usuário não autenticado');
        toast.error('Sessão expirada. Faça login novamente.');
        navigate('/login');
        return;
      }
      
      const userId = session.user.id;
      const userEmail = session.user.email;
      
      console.log('👤 User ID:', userId);
      console.log('📧 Email:', userEmail);
      
      // Salvar ID da sessão para exibição
      setSessionId(userId.substring(0, 8) + '...');
      
      // Buscar dados do usuário na tabela 'usuarios'
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (userError && userError.code !== 'PGRST116') {
        console.error('Erro ao buscar usuário:', userError);
      }
      
      if (userData) {
        setPerfil({
          nome: userData.nome || '',
          email: userData.email || userEmail,
          role: userData.role || 'usuario',
          created_at: userData.created_at || new Date().toISOString(),
          ultimo_acesso: session.user.last_sign_in_at || userData.updated_at || new Date().toISOString()
        });
      } else {
        // Usuário não encontrado na tabela, usar dados da sessão
        setPerfil({
          nome: session.user.user_metadata?.nome || userEmail?.split('@')[0] || 'Usuário',
          email: userEmail || '',
          role: 'usuario',
          created_at: session.user.created_at || new Date().toISOString(),
          ultimo_acesso: session.user.last_sign_in_at || new Date().toISOString()
        });
      }
      
      // Carregar dados da clínica
      const { data: configData, error: configError } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'config_clinica')
        .maybeSingle();
      
      if (!configError && configData?.valor) {
        const config = JSON.parse(configData.valor);
        setClinica({
          nome_contratado: config.nome_contratado || '',
          cnpj: config.cnpj || '',
          cnes: config.cnes || ''
        });
      }
      
      console.log('✅ Perfil carregado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao carregar perfil:', error);
      toast.error('Erro ao carregar dados do perfil');
    } finally {
      setLoading(false);
    }
  };

  const atualizarPerfil = async () => {
    if (!perfil.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Sessão expirada. Faça login novamente.');
        navigate('/login');
        return;
      }
      
      // Atualizar na tabela usuarios
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({
          nome: perfil.nome,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);
      
      if (updateError && updateError.code !== 'PGRST116') {
        throw updateError;
      }
      
      // Se não existe na tabela, inserir
      if (updateError?.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('usuarios')
          .insert({
            id: session.user.id,
            email: session.user.email,
            nome: perfil.nome,
            role: 'usuario',
            ativo: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertError) throw insertError;
      }
      
      // Atualizar metadados no auth
      const { error: authError } = await supabase.auth.updateUser({
        data: { nome: perfil.nome }
      });
      
      if (authError) throw authError;
      
      toast.success('Perfil atualizado com sucesso!');
      await carregarPerfil();
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error(error.message || 'Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const alterarSenha = async () => {
    if (!passwordForm.senha_atual || !passwordForm.nova_senha || !passwordForm.confirmar_senha) {
      toast.error('Preencha todos os campos');
      return;
    }
    
    if (passwordForm.nova_senha !== passwordForm.confirmar_senha) {
      toast.error('Nova senha e confirmação não coincidem');
      return;
    }
    
    if (passwordForm.nova_senha.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setSaving(true);
    try {
      // Verificar senha atual (opcional - o Supabase faz isso automaticamente)
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.nova_senha
      });
      
      if (error) throw error;
      
      toast.success('Senha alterada com sucesso!');
      setPasswordForm({ senha_atual: '', nova_senha: '', confirmar_senha: '' });
      setShowPasswordModal(false);
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      toast.error(error.message || 'Erro ao alterar senha');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Tem certeza que deseja sair do sistema?')) {
      await signOut();
      navigate('/login');
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return { label: 'Administrador', color: 'purple' };
      case 'usuario':
        return { label: 'Usuário', color: 'blue' };
      default:
        return { label: role || 'Usuário', color: 'gray' };
    }
  };

  const roleInfo = getRoleLabel(perfil.role);

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
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Meu Perfil
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Gerencie suas informações pessoais e senha
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={carregarPerfil}
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
              title="Recarregar"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Recarregar
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all duration-200"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>

        {/* Card do Perfil */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white text-lg">{perfil.nome || 'Usuário'}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{perfil.email || '-'}</p>
              </div>
            </div>
          </div>
          
          <div className="p-5 space-y-6">
            {/* Informações Pessoais */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <PencilIcon className="w-4 h-4 text-blue-500" />
                Informações Pessoais
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome completo *
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={perfil.nome} 
                      onChange={e => setPerfil({...perfil, nome: e.target.value})} 
                      className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                      placeholder="Seu nome completo"
                    />
                    <button
                      onClick={atualizarPerfil}
                      disabled={saving}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <CheckCircleIcon className="w-4 h-4" />
                      )}
                      Salvar
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    E-mail
                  </label>
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                    <EnvelopeIcon className="w-4 h-4" />
                    {perfil.email || '-'}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    O e-mail não pode ser alterado. Entre em contato com o administrador se necessário.
                  </p>
                </div>
              </div>
            </div>

            {/* Senha */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <KeyIcon className="w-4 h-4 text-orange-500" />
                Segurança
              </h4>
              
              <button
                onClick={() => setShowPasswordModal(true)}
                className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-all duration-200 flex items-center gap-2"
              >
                <KeyIcon className="w-4 h-4" />
                Alterar Senha
              </button>
            </div>

            {/* Informações de Acesso */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <ShieldCheckIcon className="w-4 h-4 text-purple-500" />
                Informações de Acesso
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Perfil</p>
                  <p className={`text-sm font-semibold mt-1 text-${roleInfo.color}-600 dark:text-${roleInfo.color}-400`}>
                    {roleInfo.label}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Usuário desde</p>
                  <p className="text-sm font-semibold mt-1 text-gray-700 dark:text-gray-300">
                    {perfil.created_at ? new Date(perfil.created_at).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Último acesso</p>
                  <p className="text-sm font-semibold mt-1 text-gray-700 dark:text-gray-300">
                    {perfil.ultimo_acesso ? new Date(perfil.ultimo_acesso).toLocaleString('pt-BR') : '-'}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">ID do usuário</p>
                  <p className="text-xs font-mono mt-1 text-gray-500 dark:text-gray-400 truncate">
                    {sessionId || '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card da Clínica */}
        {clinica.nome_contratado && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center gap-2">
                <BuildingOfficeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-gray-800 dark:text-white">Minha Clínica</h3>
              </div>
            </div>
            
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Nome</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">{clinica.nome_contratado}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">CNPJ</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{clinica.cnpj || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">CNES</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{clinica.cnes || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Alteração de Senha */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Alterar Senha
                  </h3>
                  <button 
                    onClick={() => setShowPasswordModal(false)} 
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="p-5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Senha atual *
                    </label>
                    <input 
                      type="password" 
                      value={passwordForm.senha_atual} 
                      onChange={e => setPasswordForm({...passwordForm, senha_atual: e.target.value})} 
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                      placeholder="Digite sua senha atual"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nova senha *
                    </label>
                    <input 
                      type="password" 
                      value={passwordForm.nova_senha} 
                      onChange={e => setPasswordForm({...passwordForm, nova_senha: e.target.value})} 
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                      placeholder="Nova senha (mínimo 6 caracteres)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Confirmar nova senha *
                    </label>
                    <input 
                      type="password" 
                      value={passwordForm.confirmar_senha} 
                      onChange={e => setPasswordForm({...passwordForm, confirmar_senha: e.target.value})} 
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                      placeholder="Confirme a nova senha"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={alterarSenha}
                    disabled={saving}
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg text-sm font-medium hover:from-orange-600 hover:to-red-700 transition-all duration-200 shadow-md flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <KeyIcon className="w-4 h-4" />
                    )}
                    Alterar Senha
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
