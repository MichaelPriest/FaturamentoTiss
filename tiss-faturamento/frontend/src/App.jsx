import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { 
  HomeIcon, BuildingOfficeIcon, UsersIcon, UserGroupIcon, 
  ClipboardDocumentListIcon, CalendarIcon, CurrencyDollarIcon,
  ChartBarIcon, ExclamationTriangleIcon, DocumentTextIcon,
  Cog6ToothIcon, Bars3Icon, XMarkIcon, ArrowRightOnRectangleIcon,
  ChevronLeftIcon, ChevronRightIcon, SunIcon, MoonIcon
} from '@heroicons/react/24/outline';

import Dashboard from './pages/Dashboard';
import Convenios from './pages/Convenios';
import Pacientes from './pages/Pacientes';
import Prestadores from './pages/Prestadores';
import Procedimentos from './pages/Procedimentos';
import Atendimentos from './pages/Atendimentos';
import Faturamento from './pages/Faturamento';
import Glosas from './pages/Glosas';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';
import NotificationBell from './components/NotificationBell';

import { setConfig } from './lib/tissGenerator';
import { supabase, isSupabaseAvailable, checkSupabaseConnection } from './lib/supabaseClient';

// Serviço de autenticação
const authService = {
  async login(email, senha) {
    // Se Supabase estiver disponível, busca na tabela usuarios
    if (isSupabaseAvailable()) {
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('email', email)
          .eq('ativo', true)
          .single();
        
        if (error) throw error;
        
        // Verificar senha (em produção, use hash)
        if (data && data.senha === senha) {
          // Atualizar último acesso
          await supabase
            .from('usuarios')
            .update({ ultimo_acesso: new Date().toISOString() })
            .eq('id', data.id);
          
          return { success: true, usuario: { nome: data.nome, perfil: data.perfil, email: data.email } };
        }
        return { success: false, error: 'Credenciais inválidas' };
      } catch (error) {
        console.error('Erro no login Supabase:', error);
        // Fallback para credencial fixa
        return verificarCredencialFixa(email, senha);
      }
    } else {
      // Fallback para credencial fixa
      return verificarCredencialFixa(email, senha);
    }
  }
};

const verificarCredencialFixa = (email, senha) => {
  const USUARIO_VALIDO = {
    email: 'michael.raimundo@bloomy.com.br',
    senha: 'C@de367336',
    nome: 'Michael Raimundo',
    perfil: 'Administrador'
  };
  
  if (email === USUARIO_VALIDO.email && senha === USUARIO_VALIDO.senha) {
    return { success: true, usuario: { nome: USUARIO_VALIDO.nome, perfil: USUARIO_VALIDO.perfil, email: USUARIO_VALIDO.email } };
  }
  return { success: false, error: 'Credenciais inválidas' };
};

// Componente Principal
function MainApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    carregarConfiguracoes();
    aplicarTema();
  }, []);

  const carregarConfiguracoes = () => {
    const storedConfig = localStorage.getItem('config_sistema');
    if (storedConfig) {
      setConfig(JSON.parse(storedConfig));
    }
    
    const sessao = localStorage.getItem('tiss_sessao');
    if (sessao) {
      const sessaoData = JSON.parse(sessao);
      if (sessaoData.logado) {
        setUsuario(sessaoData.usuario);
      }
    }
  };

  const aplicarTema = () => {
    const savedDarkMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedDarkMode === 'true' || (savedDarkMode === null && prefersDark);
    
    setDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      toast.success('Modo escuro ativado');
    } else {
      document.documentElement.classList.remove('dark');
      toast.success('Modo claro ativado');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tiss_sessao');
    setUsuario(null);
    toast.success('Logout realizado com sucesso!');
    navigate('/login');
  };

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: HomeIcon, color: 'from-blue-500 to-blue-600' },
    { id: 'convenios', name: 'Convênios', icon: BuildingOfficeIcon, color: 'from-purple-500 to-purple-600' },
    { id: 'pacientes', name: 'Pacientes', icon: UsersIcon, color: 'from-green-500 to-green-600' },
    { id: 'prestadores', name: 'Prestadores', icon: UserGroupIcon, color: 'from-teal-500 to-teal-600' },
    { id: 'procedimentos', name: 'Procedimentos', icon: ClipboardDocumentListIcon, color: 'from-orange-500 to-orange-600' },
    { id: 'atendimentos', name: 'Atendimentos', icon: CalendarIcon, color: 'from-pink-500 to-pink-600' },
    { id: 'faturamento', name: 'Faturamento', icon: CurrencyDollarIcon, color: 'from-emerald-500 to-emerald-600' },
    { id: 'glosas', name: 'Glosas', icon: ExclamationTriangleIcon, color: 'from-red-500 to-red-600' },
    { id: 'relatorios', name: 'Relatórios', icon: ChartBarIcon, color: 'from-indigo-500 to-indigo-600' },
    { id: 'configuracoes', name: 'Configurações', icon: Cog6ToothIcon, color: 'from-gray-500 to-gray-600' },
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'convenios': return <Convenios />;
      case 'pacientes': return <Pacientes />;
      case 'prestadores': return <Prestadores />;
      case 'procedimentos': return <Procedimentos />;
      case 'atendimentos': return <Atendimentos />;
      case 'faturamento': return <Faturamento />;
      case 'glosas': return <Glosas />;
      case 'relatorios': return <Relatorios />;
      case 'configuracoes': return <Configuracoes />;
      default: return <Dashboard />;
    }
  };

  const currentMenuItem = menuItems.find(i => i.id === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <Toaster position="top-right" richColors />
      
      {/* Sidebar Desktop */}
      <aside className={`fixed left-0 top-0 h-full bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 shadow-2xl transition-all duration-300 z-20 hidden lg:block ${sidebarOpen ? 'w-72' : 'w-20'}`}>
        <div className="flex items-center justify-between p-5 border-b border-gray-700/50">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <CurrencyDollarIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">TISS Faturamento</h1>
                <p className="text-xs text-gray-400">Sistema TISS 4.03.00</p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto shadow-lg">
              <CurrencyDollarIcon className="w-5 h-5 text-white" />
            </div>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-2 rounded-xl hover:bg-gray-700/50 transition-all duration-200 text-gray-400 hover:text-white"
          >
            {sidebarOpen ? <ChevronLeftIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
          </button>
        </div>

        {sidebarOpen && usuario && (
          <div className="mx-4 mt-6 p-3 bg-gradient-to-r from-gray-800 to-gray-750 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {usuario.nome?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{usuario.nome}</p>
                <p className="text-xs text-gray-400">{usuario.perfil}</p>
              </div>
            </div>
          </div>
        )}

        <nav className="p-4 space-y-1.5 mt-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? `bg-gradient-to-r ${item.color} text-white shadow-lg` 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }
                  ${!sidebarOpen ? 'justify-center' : ''}
                `}
                title={!sidebarOpen ? item.name : ''}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'group-hover:text-white'}`} />
                {sidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
                {isActive && sidebarOpen && <div className="ml-auto w-1.5 h-6 bg-white rounded-full opacity-60"></div>}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700/50">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-400 hover:text-red-400 hover:bg-red-500/10 ${!sidebarOpen ? 'justify-center' : ''}`}
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Sair do Sistema</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-72' : 'lg:ml-20'} ml-0`}>
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-center px-6 py-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setMobileSidebarOpen(true)} 
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden transition-all duration-200"
              >
                <Bars3Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  {menuItems.find(i => i.id === activeTab)?.name}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {currentMenuItem?.name === 'Dashboard' && 'Visão geral do sistema'}
                  {currentMenuItem?.name === 'Faturamento' && 'Geração e envio de lotes TISS'}
                  {currentMenuItem?.name === 'Atendimentos' && 'Registro de atendimentos e guias'}
                  {currentMenuItem?.name === 'Relatórios' && 'Análise de dados e métricas'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
              >
                {darkMode ? (
                  <SunIcon className="w-5 h-5 text-yellow-500" />
                ) : (
                  <MoonIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>

              <NotificationBell />

              <div className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-700">
                <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white font-semibold text-sm">
                    {usuario?.nome?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{usuario?.nome || 'Usuário'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{usuario?.perfil || 'Perfil'}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="hidden sm:flex items-center gap-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors text-sm"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          </div>
        </header>
        
        <div className="p-6">{renderContent()}</div>
      </main>

      {/* Mobile Sidebar */}
      {mobileSidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />}
      <aside className={`fixed left-0 top-0 h-full w-80 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 shadow-2xl z-40 transition-transform duration-300 lg:hidden ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-5 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <CurrencyDollarIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">TISS Faturamento</h1>
              <p className="text-xs text-gray-400">Sistema TISS 4.03.00</p>
            </div>
          </div>
          <button onClick={() => setMobileSidebarOpen(false)} className="p-2 rounded-xl hover:bg-gray-700/50">
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {usuario && (
          <div className="mx-4 mt-6 p-3 bg-gradient-to-r from-gray-800 to-gray-750 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {usuario.nome?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{usuario.nome}</p>
                <p className="text-xs text-gray-400">{usuario.perfil}</p>
              </div>
            </div>
          </div>
        )}

        <nav className="p-4 space-y-1.5 mt-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? `bg-gradient-to-r ${item.color} text-white shadow-lg` : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700/50">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-400 hover:text-red-400 hover:bg-red-500/10">
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span className="text-sm">Sair do Sistema</span>
          </button>
        </div>
      </aside>
    </div>
  );
}

// Componente de Login
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    const shouldBeDark = savedDarkMode === 'true';
    setDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await authService.login(email, senha);

    if (result.success) {
      const sessao = {
        usuario: result.usuario,
        logado: true,
        data_hora: new Date().toISOString()
      };
      localStorage.setItem('tiss_sessao', JSON.stringify(sessao));
      toast.success(`Bem-vindo, ${result.usuario.nome}!`);
      if (onLogin) onLogin(true);
      navigate('/');
    } else {
      toast.error(result.error || 'Email ou senha incorretos!');
    }
    setLoading(false);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl bg-white/10 backdrop-blur-lg hover:bg-white/20 transition-all duration-200"
        >
          {darkMode ? (
            <SunIcon className="w-5 h-5 text-yellow-400" />
          ) : (
            <MoonIcon className="w-5 h-5 text-white" />
          )}
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
                  placeholder="michael.raimundo@bloomy.com.br"
                  required
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

// Componente principal com as rotas
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const sessao = localStorage.getItem('tiss_sessao');
    if (sessao) {
      const sessaoData = JSON.parse(sessao);
      if (sessaoData.logado) {
        setIsLoggedIn(true);
      }
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={setIsLoggedIn} />} />
        <Route path="/*" element={isLoggedIn ? <MainApp /> : <Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
