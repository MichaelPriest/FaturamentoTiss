import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { 
  HomeIcon, BuildingOfficeIcon, UsersIcon, UserGroupIcon, 
  ClipboardDocumentListIcon, CalendarIcon, CurrencyDollarIcon,
  ChartBarIcon, ExclamationTriangleIcon, Cog6ToothIcon, 
  Bars3Icon, XMarkIcon, ArrowRightOnRectangleIcon,
  ChevronLeftIcon, ChevronRightIcon, SunIcon, MoonIcon,
  CalendarDaysIcon, FolderIcon, ChevronDownIcon, ChevronUpIcon,
  HomeModernIcon, BanknotesIcon, ClipboardDocumentCheckIcon, BuildingOffice2Icon, BellAlertIcon,
  UserCircleIcon, MegaphoneIcon, TvIcon
} from '@heroicons/react/24/outline';

import Dashboard from './pages/Dashboard';
import Convenios from './pages/Convenios';
import ConvenioConfig from './pages/ConvenioConfig';
import WebserviceConfig from './pages/WebserviceConfig';
import Pacientes from './pages/Pacientes';
import Prestadores from './pages/Prestadores';
import Procedimentos from './pages/Procedimentos';
import Atendimentos from './pages/Atendimentos';
import Autorizacoes from './pages/Autorizacoes';
import Faturamento from './pages/Faturamento';
import Glosas from './pages/Glosas';
import Financeiro from './pages/Financeiro';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';
import Notificacoes from './pages/Notificacoes';
import NotificationBell from './components/NotificationBell';
import UnidadeSelector from './components/UnidadeSelector';
import Agendamentos from './pages/Agendamentos';
import Prontuario from './pages/Prontuario';
import Salas from './pages/Salas';
import Ocupacao from './pages/Ocupacao';
import ChamadosRegistro from './pages/ChamadosRegistro';
import ChamadosPainel from './pages/ChamadosPainel';
import Unidades from './pages/Unidades';
import LoginPage from './pages/Login';
import Perfil from './pages/Perfil';
import ResetPassword from './pages/ResetPassword';

import { setConfig } from './lib/tissGenerator';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UnidadeProvider } from './contexts/UnidadeContext';
import { NotificationsProvider } from './contexts/NotificationsContext';

const TAB_ROUTES = new Set([
  'dashboard',
  'convenios',
  'pacientes',
  'prestadores',
  'procedimentos',
  'salas',
  'unidades',
  'atendimentos',
  'agendamentos',
  'ocupacao',
  'autorizacoes',
  'faturamento',
  'glosas',
  'financeiro',
  'relatorios',
  'perfil',
  'notificacoes',
  'chamados',
  'chamados-painel',
  'configuracoes'
]);

const getTabFromPath = (pathname) => {
  const firstSegment = pathname.split('/').filter(Boolean)[0];
  
  // Mapeamento especial para as rotas de chamados
  if (pathname === '/chamados/painel') return 'chamados-painel';
  if (pathname === '/chamados/registro') return 'chamados';
  
  return firstSegment && TAB_ROUTES.has(firstSegment) ? firstSegment : 'dashboard';
};

const getPathForTab = (tabId) => {
  if (tabId === 'dashboard') return '/';
  if (tabId === 'chamados') return '/chamados/registro';
  if (tabId === 'chamados-painel') return '/chamados/painel';
  return `/${tabId}`;
};

// Componente de Proteção de Rota
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function ProtectedApp() {
  return (
    <ProtectedRoute>
      <UnidadeProvider>
        <NotificationsProvider>
          <MainApp />
        </NotificationsProvider>
      </UnidadeProvider>
    </ProtectedRoute>
  );
}

// Componente Principal do App (logado)
function MainApp() {
  const [activeTab, setActiveTab] = useState(() => getTabFromPath(window.location.pathname));
  const [visitedTabs, setVisitedTabs] = useState(() => new Set([getTabFromPath(window.location.pathname)]));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState({
    principal: true,
    cadastros: false,
    agenda: false,
    autorizacoes: false,
    faturamento: false,
    financeiro: false,
    relatorios: false,
    chamados: false,
    notificacoes: false
  });
  const { darkMode, toggleDarkMode } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());

  // Verificar se é rota de prontuário ou convenio-config
  const isSpecialRoute = location.pathname.includes('/prontuario/') || location.pathname.includes('/convenio-config/') || location.pathname.includes('/convenio-webservice');

  // Verificar se é rota fullscreen (Painel de Chamadas)
  const isFullscreenRoute = location.pathname === '/chamados/painel';

  useEffect(() => {
    if (!isSpecialRoute && !isFullscreenRoute) {
      const nextTab = getTabFromPath(location.pathname);
      setActiveTab(nextTab);
      openGroupForItem(nextTab);
    }
  }, [location.pathname, isSpecialRoute, isFullscreenRoute]);

  useEffect(() => {
    setVisitedTabs((prev) => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const storedConfig = localStorage.getItem('config_sistema');
    if (storedConfig) {
      setConfig(JSON.parse(storedConfig));
    }
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const toggleGroup = (group) => {
    setOpenGroups(prev => {
      const allClosed = {};
      Object.keys(prev).forEach(key => {
        allClosed[key] = false;
      });
      allClosed[group] = !prev[group];
      return allClosed;
    });
  };

  const openGroupForItem = (itemId) => {
    const groupId = findGroupByItemId(itemId);
    if (groupId) {
      setOpenGroups(prev => {
        const allClosed = {};
        Object.keys(prev).forEach(key => {
          allClosed[key] = false;
        });
        allClosed[groupId] = true;
        return allClosed;
      });
    }
  };

  const findGroupByItemId = (itemId) => {
    for (const group of menuGroups) {
      if (group.items.some(item => item.id === itemId)) {
        return group.id;
      }
    }
    return null;
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
        { id: 'salas', name: 'Salas', icon: HomeModernIcon, color: 'from-teal-500 to-teal-600' },
        { id: 'unidades', name: 'Unidades', icon: BuildingOffice2Icon, color: 'from-sky-500 to-sky-600' }
      ]
    },
    {
      id: 'agenda', name: 'Agenda', icon: CalendarDaysIcon,
      items: [
        { id: 'agendamentos', name: 'Agendamentos', icon: CalendarIcon, color: 'from-cyan-500 to-cyan-600' },
        { id: 'ocupacao', name: 'Mapa de Ocupação', icon: HomeModernIcon, color: 'from-violet-500 to-violet-600' },
        { id: 'atendimentos', name: 'Atendimentos', icon: ClipboardDocumentListIcon, color: 'from-pink-500 to-pink-600' }
      ]
    },
    {
      id: 'autorizacoes', name: 'Autorizações', icon: ClipboardDocumentCheckIcon,
      items: [
        { id: 'autorizacoes', name: 'Autorizações TISS', icon: ClipboardDocumentCheckIcon, color: 'from-indigo-500 to-indigo-600' }
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
      id: 'financeiro', name: 'Financeiro', icon: BanknotesIcon,
      items: [
        { id: 'financeiro', name: 'Financeiro', icon: BanknotesIcon, color: 'from-amber-500 to-amber-600' }
      ]
    },
    {
      id: 'relatorios', name: 'Relatórios', icon: ChartBarIcon,
      items: [{ id: 'relatorios', name: 'Relatórios', icon: ChartBarIcon, color: 'from-indigo-500 to-indigo-600' }]
    },
    {
      id: 'chamados', name: 'Chamadas', icon: MegaphoneIcon,
      items: [
        { id: 'chamados', name: 'Recepção / Registro', icon: ClipboardDocumentCheckIcon, color: 'from-green-500 to-green-600' },
        { id: 'chamados-painel', name: 'Painel de Chamadas', icon: TvIcon, color: 'from-blue-500 to-blue-600' }
      ]
    },
    {
      id: 'configuracoes', name: 'Configurações', icon: Cog6ToothIcon,
      items: [
        { id: 'perfil', name: 'Meu Perfil', icon: UserCircleIcon, color: 'from-blue-500 to-blue-600' },
        { id: 'notificacoes', name: 'Notificações', icon: BellAlertIcon, color: 'from-rose-500 to-rose-600' },
        { id: 'configuracoes', name: 'Configurações', icon: Cog6ToothIcon, color: 'from-gray-500 to-gray-600' }
      ]
    }
  ];

  const renderTabContent = (tabId) => {
    switch(tabId) {
      case 'dashboard': return <Dashboard />;
      case 'convenios': return <Convenios />;
      case 'pacientes': return <Pacientes />;
      case 'prestadores': return <Prestadores />;
      case 'procedimentos': return <Procedimentos />;
      case 'salas': return <Salas />;
      case 'unidades': return <Unidades />;
      case 'atendimentos': return <Atendimentos />;
      case 'agendamentos': return <Agendamentos />;
      case 'ocupacao': return <Ocupacao />;
      case 'autorizacoes': return <Autorizacoes />;
      case 'faturamento': return <Faturamento />;
      case 'glosas': return <Glosas />;
      case 'financeiro': return <Financeiro />;
      case 'relatorios': return <Relatorios />;
      case 'perfil': return <Perfil />;
      case 'notificacoes': return <Notificacoes />;
      case 'chamados': return <ChamadosRegistro />;
      case 'chamados-painel': return <ChamadosPainel />;
      case 'configuracoes': return <Configuracoes />;
      default: return <Dashboard />;
    }
  };

  const renderContent = () => {
    const pathname = location.pathname;

    if (pathname.includes('/prontuario/')) return <Prontuario />;
    if (pathname.includes('/convenio-config/')) return <ConvenioConfig />;
    if (pathname.includes('/convenio-webservice')) return <WebserviceConfig />;

    return renderTabContent(activeTab);
  };

  const getPageTitle = () => {
    const pathname = location.pathname;
    if (pathname.includes('/prontuario/')) return 'Prontuário Eletrônico';
    if (pathname.includes('/convenio-config/')) return 'Configurações Avançadas do Convênio';
    if (pathname.includes('/convenio-webservice')) return 'Configuração de WebService';
    
    if (activeTab === 'chamados') return 'Recepção / Registro';
    if (activeTab === 'chamados-painel') return 'Painel de Chamadas';
    
    const found = menuGroups.flatMap(g => g.items).find(i => i.id === activeTab);
    return found?.name || 'Dashboard';
  };

  const getPageSubtitle = () => {
    const pathname = location.pathname;
    if (pathname.includes('/prontuario/')) return 'Atendimento médico e registro clínico';
    if (pathname.includes('/convenio-config/')) return 'Regras de faturamento, prazos, glosas e integrações';
    if (pathname.includes('/convenio-webservice')) return 'Endpoints, credenciais e certificado por convênio';
    
    const subtitles = {
      dashboard: 'Visão geral do sistema',
      autorizacoes: 'Gerenciamento de autorizações de procedimentos pelos convênios',
      faturamento: 'Geração e envio de lotes TISS',
      atendimentos: 'Registro de atendimentos e guias',
      agendamentos: 'Gerenciamento de agenda e consultas',
      ocupacao: 'Mapa de salas, horários e disponibilidade',
      financeiro: 'Contas a receber, pagar e fluxo de caixa',
      glosas: 'Gestão de glosas e recursos',
      relatorios: 'Análise de dados e métricas',
      salas: 'Gerenciamento de salas da clínica',
      unidades: 'Cadastro de filiais, clínicas e unidades de atendimento',
      perfil: 'Gerencie suas informações pessoais e senha',
      notificacoes: 'Central de avisos, alertas e eventos por unidade',
      chamados: 'Adicione pacientes à fila para atendimento',
      'chamados-painel': 'Painel público de chamadas estilo hospitalar',
      configuracoes: 'Configurações do sistema e usuários'
    };
    return subtitles[activeTab] || 'Cadastro e gerenciamento de dados';
  };

  const nomeUsuario = user?.nome?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário';
  const userPhoto = user?.foto;
  const formattedDate = currentDateTime.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const formattedTime = currentDateTime.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // Se for rota fullscreen (Painel de Chamadas), renderiza sem sidebar e header
  if (isFullscreenRoute) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Toaster position="top-right" richColors />
        <div className="p-0">
          <ChamadosPainel />
        </div>
      </div>
    );
  }

  // Se for rota especial (prontuario ou convenio-config), não mostra sidebar
  if (isSpecialRoute) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Toaster position="top-right" richColors />
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    );
  }

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

        <nav className="p-4 space-y-2 mt-4 overflow-y-auto max-h-[calc(100vh-100px)]">
          {menuGroups.map((group) => (
            <div key={group.id} className="space-y-1">
              {sidebarOpen && (
                <button 
                  onClick={() => toggleGroup(group.id)} 
                  className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <group.icon className="w-3 h-3" />
                    <span>{group.name}</span>
                  </div>
                  {openGroups[group.id] ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
                </button>
              )}
              {(sidebarOpen ? openGroups[group.id] : true) && (
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          openGroupForItem(item.id);
                          navigate(getPathForTab(item.id));
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                          isActive 
                            ? `bg-gradient-to-r ${item.color} text-white shadow-lg` 
                            : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                        } ${!sidebarOpen ? 'justify-center' : ''}`}
                        title={!sidebarOpen ? item.name : ''}
                      >
                        <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'group-hover:text-white'}`} />
                        {sidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

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
              <UnidadeSelector />
              <div className="hidden md:flex flex-col items-end px-3 py-1.5 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 capitalize">{formattedDate}</span>
                <span className="font-mono text-sm font-semibold text-gray-800 dark:text-gray-100 tabular-nums">{formattedTime}</span>
              </div>
              <button onClick={toggleDarkMode} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200">
                {darkMode ? <SunIcon className="w-5 h-5 text-yellow-500" /> : <MoonIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
              </button>
              <NotificationBell />
              <button
                onClick={() => {
                  setActiveTab('perfil');
                  openGroupForItem('perfil');
                  navigate(getPathForTab('perfil'));
                }}
                className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-700 hover:opacity-80 transition-opacity"
                title="Meu Perfil"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-md ring-2 ring-white dark:ring-gray-800">
                  {userPhoto ? (
                    <img src={userPhoto} alt={user?.nome || nomeUsuario} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-semibold text-sm">{nomeUsuario.substring(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.nome || nomeUsuario}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role === 'admin' ? 'Administrador' : 'Usuário'}</p>
                </div>
              </button>
              <button onClick={handleLogout} className="hidden sm:flex items-center gap-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors text-sm">
                <ArrowRightOnRectangleIcon className="w-4 h-4" /><span>Sair</span>
              </button>
            </div>
          </div>
        </header>
        <div className="p-6">
          {Array.from(visitedTabs).map((tabId) => (
            <div key={tabId} className={tabId === activeTab ? 'block' : 'hidden'}>
              {renderTabContent(tabId)}
            </div>
          ))}
        </div>
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
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">{nomeUsuario.substring(0, 2).toUpperCase()}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{user?.nome || nomeUsuario}</p>
              <p className="text-xs text-gray-400">{user?.role === 'admin' ? 'Administrador' : 'Usuário'}</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2 mt-4 overflow-y-auto max-h-[calc(100vh-180px)]">
          {menuGroups.map((group) => (
            <div key={group.id} className="space-y-1">
              <button 
                onClick={() => toggleGroup(group.id)} 
                className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                <div className="flex items-center gap-2">
                  <group.icon className="w-3 h-3" />
                  <span>{group.name}</span>
                </div>
                {openGroups[group.id] ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
              </button>
              {openGroups[group.id] && (
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { 
                          setActiveTab(item.id); 
                          setMobileSidebarOpen(false);
                          openGroupForItem(item.id);
                          navigate(getPathForTab(item.id));
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${isActive ? `bg-gradient-to-r ${item.color} text-white shadow-lg` : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
                      >
                        <Icon className="w-5 h-5" /><span className="text-sm font-medium">{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
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
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/prontuario/:id" element={<ProtectedApp />} />
            <Route path="/convenio-config/:id" element={<ProtectedApp />} />
            <Route path="/convenio-webservice" element={<ProtectedApp />} />
            <Route path="/convenio-webservice/:id" element={<ProtectedApp />} />
            <Route path="/chamados/registro" element={<ProtectedApp />} />
            <Route path="/chamados/painel" element={<ProtectedApp />} />
            <Route path="/*" element={<ProtectedApp />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
