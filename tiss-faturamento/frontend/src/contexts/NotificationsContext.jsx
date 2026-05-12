import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { notificacoesService } from '../services/notificacoesService';
import { useUnidade } from './UnidadeContext';

const NotificationsContext = createContext({
  notifications: [],
  unreadCount: 0,
  loadingNotifications: false,
  refreshNotifications: async () => {},
  createNotification: async () => {},
  markAsRead: async () => {},
  markAsUnread: async () => {},
  markAllAsRead: async () => {},
  archiveNotification: async () => {},
  deleteNotification: async () => {}
});

export function NotificationsProvider({ children }) {
  const { unidadeAtualId } = useUnidade();
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.lido).length,
    [notifications]
  );

  const refreshNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const data = await notificacoesService.listar({ unidadeId: unidadeAtualId });
      setNotifications(data);
      return data;
    } catch (error) {
      console.error('Erro ao atualizar notificações:', error);
      return [];
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    refreshNotifications();
  }, [unidadeAtualId]);

  useEffect(() => {
    const unsubscribe = notificacoesService.subscribe(refreshNotifications);
    const interval = setInterval(refreshNotifications, 30000);

    return () => {
      unsubscribe?.();
      clearInterval(interval);
    };
  }, [unidadeAtualId]);

  const createNotification = async (notification, { silent = false } = {}) => {
    const created = await notificacoesService.criar(notification);
    await refreshNotifications();
    if (created && !silent) toast.success('Notificação criada');
    return created;
  };

  const markAsRead = async (id) => {
    await notificacoesService.marcarLido(id);
    await refreshNotifications();
  };

  const markAsUnread = async (id) => {
    await notificacoesService.marcarNaoLido(id);
    await refreshNotifications();
  };

  const markAllAsRead = async () => {
    await notificacoesService.marcarTodosComoLidos({ unidadeId: unidadeAtualId });
    await refreshNotifications();
  };

  const archiveNotification = async (id) => {
    await notificacoesService.arquivar(id);
    await refreshNotifications();
  };

  const deleteNotification = async (id) => {
    await notificacoesService.excluir(id);
    await refreshNotifications();
  };

  return (
    <NotificationsContext.Provider value={{
      notifications,
      unreadCount,
      loadingNotifications,
      refreshNotifications,
      createNotification,
      markAsRead,
      markAsUnread,
      markAllAsRead,
      archiveNotification,
      deleteNotification
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);
