import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { 
  HomeIcon, BuildingOfficeIcon, UsersIcon, UserGroupIcon, 
  ClipboardDocumentListIcon, CalendarIcon, CurrencyDollarIcon,
  ChartBarIcon, ExclamationTriangleIcon, DocumentTextIcon,
  Cog6ToothIcon, Bars3Icon, XMarkIcon, ArrowRightOnRectangleIcon
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
import Login from './pages/Login';

import { setConfig } from './lib/tissGenerator';

// Componente Principal com o conteúdo do sistema
function MainApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Carregar configuração do sistema
    const storedConfig = localStorage.getItem('config_sistema');
    if (storedConfig) {
      setConfig(JSON.parse(storedConfig));
    }
    
    // Verificar sessão
    const sessao = localStorage.getItem('tiss_sessao');
    if (sessao) {
      const sessaoData = JSON.parse(sessao);
      if (sessaoData.logado) {
        setUsuario(sessaoData.usuario);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('tiss_sessao');
    setUsuario(null);
    toast.success('Logout realizado com sucesso!');
    navigate('/login');
  };

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: HomeIcon },
    { id: 'convenios', name: 'Convênios', icon: BuildingOfficeIcon },
    { id: 'pacientes', name: 'Pacientes', icon: UsersIcon },
    { id: 'prestadores', name: 'Prestadores', icon: UserGroupIcon },
    { id: 'procedimentos', name: 'Procedimentos', icon: ClipboardDocumentListIcon },
    { id: 'atendimentos', name: 'Atendimentos', icon: CalendarIcon },
    { id: 'faturamento', name: 'Faturamento', icon: CurrencyDollarIcon },
    { id: 'glosas', name: 'Glosas', icon: ExclamationTriangleIcon },
    { id: 'relatorios', name: 'Relatórios', icon: ChartBarIcon },
    { id: 'configuracoes', name: 'Configurações', icon: Cog6ToothIcon },
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" richColors />
      
      {/* Sidebar Desktop */}
      <aside className={`fixed left-0 top-0 h-full bg-white shadow-lg transition-all duration-300 z-20 hidden lg:block ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        <div className="flex items-center justify-between p-4 border-b">
          {sidebarOpen && <h1 className="text-xl font-bold text-blue-600">TISS Faturamento</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100">
            <Bars3Icon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
              ${activeTab === item.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}
              ${!sidebarOpen ? 'justify-center' : ''}`} title={!sidebarOpen ? item.name : ''}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.name}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'} ml-0`}>
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="flex justify-between items-center px-6 py-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 lg:hidden">
                <Bars3Icon className="w-6 h-6 text-gray-600" />
              </button>
              <h2 className="text-xl font-semibold text-gray-800">
                {menuItems.find(i => i.id === activeTab)?.name}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">{usuario?.nome}</span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-400 text-xs">{usuario?.perfil}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition-colors text-sm"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </header>
        <div className="p-6">{renderContent()}</div>
      </main>

      {/* Mobile Sidebar */}
      {mobileSidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />}
      <aside className={`fixed left-0 top-0 h-full w-72 bg-white shadow-lg z-40 transition-transform duration-300 lg:hidden ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-bold text-blue-600">TISS Faturamento</h1>
          <button onClick={() => setMobileSidebarOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
              ${activeTab === item.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}>
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </button>
          ))}
        </nav>
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
  const navigate = useNavigate();

  const USUARIO_VALIDO = {
    email: 'michael.raimundo@bloomy.com.br',
    senha: 'C@de367336',
    nome: 'Michael Raimundo',
    perfil: 'Administrador'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    if (email === USUARIO_VALIDO.email && senha === USUARIO_VALIDO.senha) {
      const sessao = {
        usuario: USUARIO_VALIDO,
        logado: true,
        data_hora: new Date().toISOString()
      };
      localStorage.setItem('tiss_sessao', JSON.stringify(sessao));
      toast.success(`Bem-vindo, ${USUARIO_VALIDO.nome}!`);
      if (onLogin) onLogin(true);
      navigate('/');
    } else {
      toast.error('Email ou senha incorretos!');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">TISS Faturamento</h1>
          <p className="text-gray-500 text-sm mt-1">Sistema de Faturamento TISS 4.03.00</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="michael.raimundo@bloomy.com.br"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="********"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 text-center">
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
        <Route path="/*" element={
          isLoggedIn ? <MainApp /> : <Navigate to="/login" replace />
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
