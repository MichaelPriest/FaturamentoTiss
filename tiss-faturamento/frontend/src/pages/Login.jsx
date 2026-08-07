// src/pages/Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { SunIcon, MoonIcon, CurrencyDollarIcon, KeyIcon, EnvelopeIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase, logAuthState } from '../lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryCooldown, setRecoveryCooldown] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState(null);
  const { darkMode, toggleDarkMode } = useTheme();
  const { signIn, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 [LoginPage] Verificando autenticação inicial...');
      await logAuthState();
      
      if (isAuthenticated) {
        console.log('✅ [LoginPage] Usuário já autenticado, redirecionando...');
        navigate('/', { replace: true });
      }
    };
    
    checkAuth();
  }, [isAuthenticated, navigate]);

  // Efeito para gerenciar o cooldown do timer
  useEffect(() => {
    if (recoveryCooldown > 0) {
      const timer = setTimeout(() => {
        setRecoveryCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [recoveryCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Digite seu email');
      return;
    }
    
    if (!senha.trim()) {
      toast.error('Digite sua senha');
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await signIn(email.trim(), senha);
      if (!result || typeof result.success !== 'boolean') {
        throw new Error('O serviço de autenticação retornou uma resposta inválida. Atualize a página e tente novamente.');
      }
      
      if (result.success) {
        console.log('✅ [LoginPage] Login bem-sucedido!');
        toast.success('Login realizado com sucesso!');
        navigate('/', { replace: true });
      } else {
        const loginError = result.error || 'Não foi possível autenticar. Verifique a configuração do ambiente.';
        console.error('❌ [LoginPage] Falha no login:', loginError);
        
        if (loginError.includes('Invalid login credentials')) {
          toast.error('Email ou senha inválidos');
        } else if (loginError.includes('Email not confirmed')) {
          toast.error('Email não confirmado. Verifique sua caixa de entrada.');
        } else {
          toast.error(loginError);
        }
      }
    } catch (error) {
      console.error('❌ [LoginPage] Erro:', error);
      toast.error(error.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleRecoveryPassword = async (e) => {
    e.preventDefault();
    
    // Verificar cooldown
    if (recoveryCooldown > 0) {
      toast.error(`Aguarde ${recoveryCooldown} segundos antes de tentar novamente`);
      return;
    }
    
    // Verificar última tentativa (1 minuto mínimo entre tentativas)
    if (lastAttemptTime && (Date.now() - lastAttemptTime) < 60000) {
      const segundosRestantes = Math.ceil((60000 - (Date.now() - lastAttemptTime)) / 1000);
      toast.error(`Aguarde ${segundosRestantes} segundos antes de tentar novamente`);
      return;
    }
    
    if (!recoveryEmail.trim()) {
      toast.error('Digite seu email para recuperar a senha');
      return;
    }
    
    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recoveryEmail)) {
      toast.error('Digite um email válido');
      return;
    }
    
    setRecoveryLoading(true);
    setLastAttemptTime(Date.now());
    
    try {
      console.log('🔐 [LoginPage] Enviando recuperação de senha para:', recoveryEmail);
      
      const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        console.error('❌ [LoginPage] Erro na recuperação:', error);
        
        if (error.message?.includes('rate limit')) {
          toast.error('Muitas tentativas. Aguarde 1 hora antes de tentar novamente.');
          setRecoveryCooldown(3600); // 1 hora de cooldown
        } else if (error.message?.includes('User not found')) {
          toast.error('Email não encontrado no sistema');
        } else {
          toast.error(error.message || 'Erro ao enviar email de recuperação');
        }
        return;
      }
      
      console.log('✅ [LoginPage] Email de recuperação enviado com sucesso!');
      toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
      
      // Fechar modal e limpar email
      setShowRecoveryModal(false);
      setRecoveryEmail('');
      
      // Iniciar cooldown de 60 segundos
      setRecoveryCooldown(60);
      
    } catch (error) {
      console.error('❌ [LoginPage] Erro:', error);
      toast.error('Erro ao enviar email de recuperação');
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="absolute top-4 right-4 flex gap-2">
        <button 
          onClick={toggleDarkMode} 
          className="p-2 rounded-xl bg-white/10 backdrop-blur-lg hover:bg-white/20 transition-all duration-200"
          title="Alternar tema"
        >
          {darkMode ? <SunIcon className="w-5 h-5 text-yellow-400" /> : <MoonIcon className="w-5 h-5 text-white" />}
        </button>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <CurrencyDollarIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">TISS Faturamento</h1>
          <p className="text-blue-200 text-sm">Sistema de Faturamento TISS 4.03.00</p>
        </div>

        <div className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white dark:text-gray-300 mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-blue-300 dark:text-gray-400" />
                </div>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full pl-10 pr-3 py-3 bg-white/20 dark:bg-gray-700/50 border border-white/30 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent text-white dark:text-white placeholder-blue-200 dark:placeholder-gray-400" 
                  placeholder="seu@email.com" 
                  required 
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white dark:text-gray-300 mb-2">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyIcon className="h-5 w-5 text-blue-300 dark:text-gray-400" />
                </div>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={senha} 
                  onChange={(e) => setSenha(e.target.value)} 
                  className="w-full pl-10 pr-10 py-3 bg-white/20 dark:bg-gray-700/50 border border-white/30 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent text-white dark:text-white placeholder-blue-200 dark:placeholder-gray-400" 
                  placeholder="********" 
                  required 
                  autoComplete="current-password" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-blue-300 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-blue-300 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowRecoveryModal(true)}
                className="text-sm text-blue-200 hover:text-white transition-colors"
              >
                Esqueci minha senha
              </button>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Entrando...
                </>
              ) : (
                'Entrar no Sistema'
              )}
            </button>
          </form>

          <div className="mt-6 p-3 bg-white/10 dark:bg-gray-700/30 rounded-xl">
            <p className="text-xs text-blue-200 dark:text-gray-400 text-center">
              Sistema de Faturamento TISS - Padrão ANS 4.03.00
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Recuperação de Senha */}
      {showRecoveryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                Recuperar Senha
              </h3>
              <button 
                onClick={() => {
                  setShowRecoveryModal(false);
                  setRecoveryEmail('');
                }} 
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleRecoveryPassword} className="p-5">
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Digite seu email cadastrado para receber um link de recuperação de senha.
                </p>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  placeholder="seu@email.com"
                  required
                  autoFocus
                />
              </div>
              
              {recoveryCooldown > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 text-center">
                    ⏱️ Aguarde {recoveryCooldown} segundos antes de tentar novamente
                  </p>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRecoveryModal(false);
                    setRecoveryEmail('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={recoveryLoading || recoveryCooldown > 0}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {recoveryLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Enviando...
                    </>
                  ) : (
                    'Enviar Link'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
