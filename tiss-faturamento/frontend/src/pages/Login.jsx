import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { SunIcon, MoonIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase, logAuthState } from '../lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const { darkMode, toggleDarkMode } = useTheme();
  const { signIn, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 [LoginPage] Verificando autenticação inicial...');
      await logAuthState();
      
      if (isAuthenticated) {
        console.log('✅ [LoginPage] Usuário já autenticado, redirecionando...');
        navigate('/');
      }
    };
    
    checkAuth();
  }, [isAuthenticated, navigate]);

  // Limpar debug info após 10 segundos
  useEffect(() => {
    if (debugInfo) {
      const timer = setTimeout(() => setDebugInfo(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [debugInfo]);

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
    setDebugInfo({ stage: 'Iniciando login...', email });
    
    console.log('🔐 [LoginPage] Tentando login com:', email);
    
    try {
      // Tentar login via contexto de autenticação
      const result = await signIn(email, senha);
      
      if (result.success) {
        console.log('✅ [LoginPage] Login bem-sucedido!');
        setDebugInfo({ stage: 'Login bem-sucedido!', email: result.user?.email });
        
        // Aguardar um momento para garantir que o estado seja atualizado
        setTimeout(() => {
          navigate('/');
        }, 500);
      } else {
        console.error('❌ [LoginPage] Falha no login:', result.error);
        setDebugInfo({ stage: 'Falha no login', error: result.error });
        toast.error(result.error || 'Email ou senha inválidos');
      }
    } catch (error) {
      console.error('❌ [LoginPage] Erro durante login:', error);
      setDebugInfo({ stage: 'Erro', error: error.message });
      toast.error(error.message || 'Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para tentar login direto com Supabase (debug)
  const handleDirectLogin = async () => {
    if (!email || !senha) {
      toast.error('Preencha email e senha primeiro');
      return;
    }
    
    setLoading(true);
    console.log('🔐 [LoginPage] Tentando login direto com Supabase...');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha
      });
      
      if (error) {
        console.error('❌ [LoginPage] Erro no login direto:', error);
        setDebugInfo({ stage: 'Login direto falhou', error: error.message });
        toast.error(`Erro: ${error.message}`);
      } else {
        console.log('✅ [LoginPage] Login direto bem-sucedido!');
        console.log('👤 Usuário:', data.user.email);
        console.log('🔑 Token:', data.session?.access_token?.substring(0, 50) + '...');
        
        setDebugInfo({
          stage: 'Login direto bem-sucedido!',
          email: data.user.email,
          userId: data.user.id,
          token: data.session?.access_token?.substring(0, 30) + '...'
        });
        
        toast.success('Login direto realizado com sucesso!');
        
        // Verificar sessão após login
        await logAuthState();
        
        // Redirecionar
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      }
    } catch (error) {
      console.error('❌ [LoginPage] Erro:', error);
      setDebugInfo({ stage: 'Erro', error: error.message });
      toast.error(error.message);
    } finally {
      setLoading(false);
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
                  <svg className="h-5 w-5 text-blue-300 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
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
                  <svg className="h-5 w-5 text-blue-300 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
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

          {/* Botão de debug para login direto */}
          <div className="mt-4">
            <button
              type="button"
              onClick={handleDirectLogin}
              disabled={loading}
              className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl text-sm transition-all duration-200 disabled:opacity-50"
            >
              🔧 Debug: Login Direto
            </button>
          </div>

          {/* Painel de debug */}
          {debugInfo && (
            <div className="mt-4 p-3 bg-black/50 backdrop-blur-sm rounded-xl">
              <p className="text-xs text-green-300 font-mono break-all">
                <strong>Debug:</strong><br />
                Estágio: {debugInfo.stage}<br />
                {debugInfo.email && <>Email: {debugInfo.email}<br /></>}
                {debugInfo.userId && <>User ID: {debugInfo.userId}<br /></>}
                {debugInfo.token && <>Token: {debugInfo.token}<br /></>}
                {debugInfo.error && <>Erro: {debugInfo.error}</>}
              </p>
            </div>
          )}

          <div className="mt-6 p-3 bg-white/10 dark:bg-gray-700/30 rounded-xl">
            <p className="text-xs text-blue-200 dark:text-gray-400 text-center">
              Sistema de Faturamento TISS - Padrão ANS 4.03.00
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
