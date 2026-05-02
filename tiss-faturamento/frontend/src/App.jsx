import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { 
  HomeIcon, BuildingOfficeIcon, UsersIcon, UserGroupIcon, 
  ClipboardDocumentListIcon, CalendarIcon, CurrencyDollarIcon,
  ChartBarIcon, ExclamationTriangleIcon, DocumentTextIcon,
  Cog6ToothIcon, Bars3Icon, XMarkIcon, ArrowRightOnRectangleIcon,
  ChevronLeftIcon, ChevronRightIcon, SunIcon, MoonIcon,
  CalendarDaysIcon, FolderIcon, ChevronDownIcon, ChevronUpIcon,
  HomeModernIcon
} from '@heroicons/react/24/outline';

import Dashboard from './pages/Dashboard';
import Convenios from './pages/Convenios';
import ConvenioConfig from './pages/ConvenioConfig';
import Pacientes from './pages/Pacientes';
import Prestadores from './pages/Prestadores';
import Procedimentos from './pages/Procedimentos';
import Atendimentos from './pages/Atendimentos';
import Faturamento from './pages/Faturamento';
import Glosas from './pages/Glosas';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';
import NotificationBell from './components/NotificationBell';
import Agendamentos from './pages/Agendamentos';
import Prontuario from './pages/Prontuario';
import Salas from './pages/Salas';
import LoginPage from './pages/Login';

import { setConfig } from './lib/tissGenerator';
import { supabase, checkSupabaseConnection, TABLES } from './lib/supabaseClient';

// Context para o tema
const ThemeContext = createContext({ darkMode: false, toggleDarkMode: () => {} });
export const useTheme = () => useContext(ThemeContext);

// Context para autenticação
const AuthContext = createContext({ user: null, loading: true, signOut: () => {}, isAuthenticated: false });
export const useAuth = () => useContext(AuthContext);

// Componente Provider do Tema
function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedDarkMode === 'true' || (savedDarkMode === null && prefersDark);
    
    setDarkMode(shouldBeDark);
    aplicarTema(shouldBeDark);
  }, []);

  const aplicarTema = (isDark) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    aplicarTema(newDarkMode);
    toast.success(newDarkMode ? 'Modo escuro ativado' : 'Modo claro ativado');
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Componente Provider de Autenticação
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSupabaseConnection();
    
    const checkSession = () => {
      const sessao = localStorage.getItem('tiss_sessao');
      if (sessao) {
        try {
          const sessaoData = JSON.parse(sessao);
          if (sessaoData.logado && sessaoData.user) {
            setUser(sessaoData.user);
          }
        } catch (e) {
          console.error('Erro ao parsear sessão:', e);
        }
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const signIn = async (email, senha) => {
    if (!supabase) {
      toast.error('Supabase não disponível');
      return { success: false };
    }
    
    try {
      const { data, error } = await supabase
        .from(TABLES.USUARIOS)
        .select('*')
        .eq('email', email)
        .eq('ativo', true)
        .single();

      if (error) {
        toast.error('Usuário não encontrado');
        return { success: false };
      }

      if (data && data.senha === senha) {
        await supabase
          .from(TABLES.USUARIOS)
          .update({ ultimo_acesso: new Date().toISOString() })
          .eq('id', data.id);

        const userData = {
          id: data.id,
          email: data.email,
          nome: data.nome,
          perfil: data.perfil
        };

        const sessao = { user: userData, logado: true, data_hora: new Date().toISOString() };
        localStorage.setItem('tiss_sessao', JSON.stringify(sessao));
        
        setUser(userData);
        toast.success(`Bem-vindo, ${data.nome}!`);
        return { success: true, user: userData };
      } else {
        toast.error('Senha incorreta!');
        return { success: false, error: 'Senha incorreta' };
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      toast.error(error.message || 'Erro ao fazer login');
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('tiss_sessao');
      setUser(null);
      toast.success('Logout realizado com sucesso');
      return { success: true };
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error(error.message || 'Erro ao fazer logout');
      return { success: false };
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Componente Principal do App (logado)
function MainApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState({
    cadastros: true,
    agenda: true,
    faturamento: true,
    relatorios: true
  });
  const { darkMode, toggleDarkMode } = useTheme();
  const { user, signOut, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    const storedConfig = localStorage.getItem('config_sistema');
    if (storedConfig) {
      setConfig(JSON.parse(storedConfig));
    }
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const toggleGroup = (group) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const menuGroups = [
    {
      id: 'principal', name: 'Principal', icon: HomeIcon,
      items: [{ id: 'dashboard', name: 'Dashboard', icon: HomeIcon, color: 'from-blue-500 to-blue-600' }]
    },
    {
      id: 'cadastros', name: 'Cadastros', icon: FolderIcon,
      items: [
        { id: 'convenios', name: 'Convênios', icon: BuildingOfficeIcon, color: 'from-purple-500 to-purple-600' },
        { id: 'pacientes', name: 'Pacientes', icon: UsersIcon, color: 'from-green-500 to-green-600' },
        { id: 'prestadores', name: 'Prestadores', icon: UserGroupIcon, color: 'from-teal-500 to-teal-600' },
        { id: 'procedimentos', name: 'Procedimentos', icon: ClipboardDocumentListIcon, color: 'from-orange-500 to-orange-600' },
        { id: 'salas', name: 'Salas', icon: HomeModernIcon, color: 'from-teal-500 to-teal-600' }
      ]
    },
    {
      id: 'agenda', name: 'Agenda', icon: CalendarDaysIcon,
      items: [
        { id: 'agendamentos', name: 'Agendamentos', icon: CalendarIcon, color: 'from-cyan-500 to-cyan-600' },
        { id: 'atendimentos', name: 'Atendimentos', icon: ClipboardDocumentListIcon, color: 'from-pink-500 to-pink-600' }
      ]
    },
    {
      id: 'faturamento', name: 'Faturamento', icon: CurrencyDollarIcon,
      items: [
        { id: 'faturamento', name: 'Lotes TISS', icon: CurrencyDollarIcon, color: 'from-emerald-500 to-emerald-600' },
        { id: 'glosas', name: 'Glosas', icon: ExclamationTriangleIcon, color: 'from-red-500 to-red-600' }
      ]
    },
    {
      id: 'relatorios', name: 'Relatórios', icon: ChartBarIcon,
      items: [{ id: 'relatorios', name: 'Relatórios', icon: ChartBarIcon, color: 'from-indigo-500 to-indigo-600' }]
    },
    {
      id: 'configuracoes', name: 'Configurações', icon: Cog6ToothIcon,
      items: [{ id: 'configuracoes', name: 'Configurações', icon: Cog6ToothIcon, color: 'from-gray-500 to-gray-600' }]
    }
  ];

  const renderContent = () => {
    const pathname = window.location.pathname;
    
    if (pathname.includes('/prontuario/')) return <Prontuario />;
    if (pathname.includes('/convenio-config/')) return <ConvenioConfig />;
    
    switch(activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'convenios': return <Convenios />;
      case 'pacientes': return <Pacientes />;
      case 'prestadores': return <Prestadores />;
      case 'procedimentos': return <Procedimentos />;
      case 'salas': return <Salas />;
      case 'atendimentos': return <Atendimentos />;
      case 'agendamentos': return <Agendamentos />;
      case 'faturamento': return <Faturamento />;
      case 'glosas': return <Glosas />;
      case 'relatorios': return <Relatorios />;
      case 'configuracoes': return <Configuracoes />;
      default: return <Dashboard />;
    }
  };

  const getPageTitle = () => {
    const pathname = window.location.pathname;
    if (pathname.includes('/prontuario/')) return 'Prontuário Eletrônico';
    if (pathname.includes('/convenio-config/')) return 'Configurações Avançadas do Convênio';
    
    const found = menuGroups.flatMap(g => g.items).find(i => i.id === activeTab);
    return found?.name || 'Dashboard';
  };

  const getPageSubtitle = () => {
    const pathname = window.location.pathname;
    if (pathname.includes('/prontuario/')) return 'Atendimento médico e registro clínico';
    if (pathname.includes('/convenio-config/')) return 'Regras de faturamento, prazos, glosas e integrações';
    
    const subtitles = {
      dashboard: 'Visão geral do sistema',
      faturamento: 'Geração e envio de lotes TISS',
      atendimentos: 'Registro de atendimentos e guias',
      agendamentos: 'Gerenciamento de agenda e consultas',
      relatorios: 'Análise de dados e métricas',
      salas: 'Gerenciamento de salas da clínica',
      configuracoes: 'Configurações do sistema e usuários'
    };
    return subtitles[activeTab] || 'Cadastro e gerenciamento de dados';
  };

  const nomeUsuario = user?.nome || 'Usuário';
  const perfilUsuario = user?.perfil || 'Perfil';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
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
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-xl hover:bg-gray-700/50 transition-all duration-200 text-gray-400 hover:text-white">
            {sidebarOpen ? <ChevronLeftIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
          </button>
        </div>

        {sidebarOpen && (
          <div className="mx-4 mt-6 p-3 bg-gradient-to-r from-gray-800 to-gray-750 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {nomeUsuario.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{nomeUsuario}</p>
                <p className="text-xs text-gray-400">{perfilUsuario}</p>
              </div>
            </div>
          </div>
        )}

        <nav className="p-4 space-y-2 mt-4 overflow-y-auto max-h-[calc(100vh-180px)]">
          {menuGroups.map((group) => (
            <div key={group.id} className="space-y-1">
              {sidebarOpen && (
                <button onClick={() => toggleGroup(group.id)} className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors">
                  <div className="flex items-center gap-2"><group.icon className="w-3 h-3" /><span>{group.name}</span></div>
                  {openGroups[group.id] ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
                </button>
              )}
              {(sidebarOpen ? openGroups[group.id] : true) && (
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    return (
                      <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${isActive ? `bg-gradient-to-r ${item.color} text-white shadow-lg` : 'text-gray-400 hover:text-white hover:bg-gray-800/50'} ${!sidebarOpen ? 'justify-center' : ''}`} title={!sidebarOpen ? item.name : ''}>
                        <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'group-hover:text-white'}`} />
                        {sidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
                        {isActive && sidebarOpen && <div className="ml-auto w-1.5 h-6 bg-white rounded-full opacity-60"></div>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700/50">
          <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-400 hover:text-red-400 hover:bg-red-500/10 ${!sidebarOpen ? 'justify-center' : ''}`}>
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
              <button onClick={() => setMobileSidebarOpen(true)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden transition-all duration-200">
                <Bars3Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">{getPageTitle()}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{getPageSubtitle()}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={toggleDarkMode} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200">
                {darkMode ? <SunIcon className="w-5 h-5 text-yellow-500" /> : <MoonIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
              </button>
              <NotificationBell />
              <div className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-700">
                <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white font-semibold text-sm">{nomeUsuario.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U'}</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{nomeUsuario}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{perfilUsuario}</p>
                </div>
                <button onClick={handleLogout} className="hidden sm:flex items-center gap-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors text-sm">
                  <ArrowRightOnRectangleIcon className="w-4 h-4" /><span>Sair</span>
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
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center"><CurrencyDollarIcon className="w-5 h-5 text-white" /></div>
            <div><h1 className="text-lg font-bold text-white">TISS Faturamento</h1><p className="text-xs text-gray-400">Sistema TISS 4.03.00</p></div>
          </div>
          <button onClick={() => setMobileSidebarOpen(false)} className="p-2 rounded-xl hover:bg-gray-700/50"><XMarkIcon className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="mx-4 mt-6 p-3 bg-gradient-to-r from-gray-800 to-gray-750 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center"><span className="text-white font-semibold text-sm">{nomeUsuario.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U'}</span></div>
            <div className="flex-1"><p className="text-sm font-medium text-white">{nomeUsuario}</p><p className="text-xs text-gray-400">{perfilUsuario}</p></div>
          </div>
        </div>

        <nav className="p-4 space-y-2 mt-4 overflow-y-auto max-h-[calc(100vh-180px)]">
          {menuGroups.map((group) => (
            <div key={group.id} className="space-y-1">
              <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider"><div className="flex items-center gap-2"><group.icon className="w-3 h-3" /><span>{group.name}</span></div></div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${isActive ? `bg-gradient-to-r ${item.color} text-white shadow-lg` : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}>
                      <Icon className="w-5 h-5" /><span className="text-sm font-medium">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700/50">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-400 hover:text-red-400 hover:bg-red-500/10">
            <ArrowRightOnRectangleIcon className="w-5 h-5" /><span className="text-sm">Sair do Sistema</span>
          </button>
        </div>
      </aside>
    </div>
  );
}

// Componente principal com as rotas
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/prontuario/:id" element={<MainApp />} />
            <Route path="/convenio-config/:id" element={<MainApp />} />
            <Route path="/*" element={<MainApp />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
