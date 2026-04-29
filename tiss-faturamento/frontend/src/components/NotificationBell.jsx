import { useState, useEffect } from 'react';
import { BellIcon, CheckCircleIcon, XCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { supabase, TABLES, isSupabaseAvailable } from '../lib/supabaseClient';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    carregarNotificacoes();
    const interval = setInterval(carregarNotificacoes, 30000);
    return () => clearInterval(interval);
  }, []);

  const carregarNotificacoes = async () => {
    try {
      let notifs = [];
      
      if (isSupabaseAvailable()) {
        const { data, error } = await supabase
          .from(TABLES.NOTIFICACOES)
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          notifs = data;
        }
      }
      
      if (notifs.length === 0) {
        const stored = localStorage.getItem('notifications');
        if (stored) {
          notifs = JSON.parse(stored);
        } else {
          notifs = [{
            id: 1,
            titulo: 'Bem-vindo ao TISS Faturamento',
            mensagem: 'Sistema pronto para uso. Comece cadastrando seus convênios.',
            tipo: 'success',
            lido: false,
            created_at: new Date().toISOString()
          }];
        }
      }
      
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.lido).length);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  const marcarComoLido = async (id) => {
    try {
      if (isSupabaseAvailable()) {
        await supabase
          .from(TABLES.NOTIFICACOES)
          .update({ lido: true })
          .eq('id', id);
      }
      
      const updated = notifications.map(n => 
        n.id === id ? { ...n, lido: true } : n
      );
      localStorage.setItem('notifications', JSON.stringify(updated));
      setNotifications(updated);
      setUnreadCount(updated.filter(n => !n.lido).length);
    } catch (error) {
      console.error('Erro ao marcar como lido:', error);
    }
  };

  const marcarTodosComoLidos = async () => {
    try {
      if (isSupabaseAvailable()) {
        await supabase
          .from(TABLES.NOTIFICACOES)
          .update({ lido: true })
          .neq('lido', true);
      }
      
      const updated = notifications.map(n => ({ ...n, lido: true }));
      localStorage.setItem('notifications', JSON.stringify(updated));
      setNotifications(updated);
      setUnreadCount(0);
    } catch (error) {
      console.error('Erro ao marcar todos como lidos:', error);
    }
  };

  const getIcon = (tipo) => {
    switch(tipo) {
      case 'success': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'warning': return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      default: return <ClockIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 relative"
      >
        <BellIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-800 dark:text-white">Notificações</h3>
              {unreadCount > 0 && (
                <button
                  onClick={marcarTodosComoLidos}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <BellIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma notificação</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${!notif.lido ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                    onClick={() => marcarComoLido(notif.id)}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        {getIcon(notif.tipo)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-white">
                          {notif.titulo}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {notif.mensagem}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          {format(new Date(notif.created_at || notif.data), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                      {!notif.lido && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
