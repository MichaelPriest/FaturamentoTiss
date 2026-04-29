import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
import PrivateRoute from './components/PrivateRoute';

import { setConfig } from './lib/tissGenerator';

function AppContent() {
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

  if (!usuario) {
    return <Login onLogin={(logged) => {
      if (logged) {
        const sessao = localStorage.getItem('tiss_sessao');
        if (sessao) setUsuario(JSON.parse(sessao).usuario);
      }
    }} />;
  }

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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login onLogin={() => {}} />} />
        <Route path="/*" element={
          <PrivateRoute>
            <AppContent />
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
