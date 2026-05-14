import { useMemo, useState } from 'react';
import {
  ArchiveBoxIcon,
  BellIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  TrashIcon,
  XCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useNotifications } from '../contexts/NotificationsContext';
import { useUnidade } from '../contexts/UnidadeContext';

const initialForm = {
  titulo: '',
  mensagem: '',
  tipo: 'info',
  categoria: 'sistema',
  prioridade: 'normal',
  link: '',
  unidade_id: ''
};

export default function Notificacoes() {
  const [showModal, setShowModal] = useState(false);
  const [filtro, setFiltro] = useState('todas');
  const [formData, setFormData] = useState(initialForm);
  const {
    notifications,
    unreadCount,
    createNotification,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    refreshNotifications
  } = useNotifications();
  const { unidades, unidadeAtualId } = useUnidade();

  const notificacoesFiltradas = useMemo(() => {
    if (filtro === 'nao_lidas') return notifications.filter((notification) => !notification.lido);
    if (filtro === 'alta') return notifications.filter((notification) => notification.prioridade === 'alta');
    return notifications;
  }, [filtro, notifications]);

  const resumo = useMemo(() => ({
    total: notifications.length,
    naoLidas: unreadCount,
    alta: notifications.filter((notification) => notification.prioridade === 'alta').length,
    sistema: notifications.filter((notification) => notification.categoria === 'sistema').length,
    acoes: notifications.filter((notification) => notification.categoria === 'acao').length
  }), [notifications, unreadCount]);

  const getIcon = (tipo) => {
    switch (tipo) {
      case 'success': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'warning': return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      default: return <ClockIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const resetForm = () => {
    setFormData(initialForm);
    setShowModal(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.titulo.trim() || !formData.mensagem.trim()) {
      toast.error('Título e mensagem são obrigatórios');
      return;
    }

    await createNotification({
      ...formData,
      titulo: formData.titulo.trim(),
      mensagem: formData.mensagem.trim(),
      link: formData.link.trim() || null,
      unidade_id: formData.unidade_id || null
    });
    resetForm();
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Notificações
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Central de avisos, alertas e eventos do sistema por unidade
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={refreshNotifications}
              className="px-4 py-2 rounded-xl text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Atualizar
            </button>
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 rounded-xl text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              Marcar lidas
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm flex items-center justify-center gap-2 hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg"
            >
              <PlusIcon className="w-4 h-4" />
              Nova Notificação
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: resumo.total, color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Não lidas', value: resumo.naoLidas, color: 'text-red-600 dark:text-red-400' },
            { label: 'Alta prioridade', value: resumo.alta, color: 'text-yellow-600 dark:text-yellow-400' },
            { label: 'Ações', value: resumo.acoes, color: 'text-green-600 dark:text-green-400' }
          ].map((card) => (
            <div key={card.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
              <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2">
              <BellIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-gray-800 dark:text-white">Caixa de notificações</h3>
            </div>
            <select
              value={filtro}
              onChange={(event) => setFiltro(event.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todas">Todas</option>
              <option value="nao_lidas">Não lidas</option>
              <option value="alta">Alta prioridade</option>
            </select>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notificacoesFiltradas.length === 0 ? (
              <div className="p-10 text-center text-gray-500 dark:text-gray-400">
                <BellIcon className="w-14 h-14 mx-auto mb-3 opacity-50" />
                <p>Nenhuma notificação encontrada</p>
              </div>
            ) : (
              notificacoesFiltradas.map((notification) => (
                <div key={notification.id} className={`p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!notification.lido ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">{getIcon(notification.tipo)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-800 dark:text-white">{notification.titulo}</h4>
                        {!notification.lido && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase">{notification.categoria}</span>
                        {notification.prioridade === 'alta' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">Alta prioridade</span>}
                        {notification.acao && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 uppercase">{notification.acao}</span>}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{notification.mensagem}</p>
                      <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>{notification.created_at ? format(new Date(notification.created_at), 'dd/MM/yyyy HH:mm') : ''}</span>
                        <span>{unidades.find((unidade) => unidade.id === notification.unidade_id)?.nome || (notification.unidade_id ? 'Unidade informada' : 'Todas as unidades')}</span>
                        {notification.origem_tabela && <span>Origem: {notification.origem_tabela}{notification.origem_id ? ` #${notification.origem_id}` : ''}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-1">
                      <button
                        onClick={() => notification.lido ? markAsUnread(notification.id) : markAsRead(notification.id)}
                        className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        title={notification.lido ? 'Marcar como não lida' : 'Marcar como lida'}
                      >
                        <CheckCircleIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => archiveNotification(notification.id)} className="p-2 rounded-lg text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors" title="Arquivar">
                        <ArchiveBoxIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteNotification(notification.id)} className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Excluir">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="border-b border-gray-200 dark:border-gray-700 p-5 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Nova Notificação</h3>
              <button type="button" onClick={resetForm} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título *</label>
                <input value={formData.titulo} onChange={(event) => setFormData({ ...formData, titulo: event.target.value })} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mensagem *</label>
                <textarea value={formData.mensagem} onChange={(event) => setFormData({ ...formData, mensagem: event.target.value })} rows="4" className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                  <select value={formData.tipo} onChange={(event) => setFormData({ ...formData, tipo: event.target.value })} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
                    <option value="info">Informação</option>
                    <option value="success">Sucesso</option>
                    <option value="warning">Alerta</option>
                    <option value="error">Erro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                  <select value={formData.categoria} onChange={(event) => setFormData({ ...formData, categoria: event.target.value })} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
                    <option value="sistema">Sistema</option>
                    <option value="faturamento">Faturamento</option>
                    <option value="financeiro">Financeiro</option>
                    <option value="agenda">Agenda</option>
                    <option value="cadastro">Cadastro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prioridade</label>
                  <select value={formData.prioridade} onChange={(event) => setFormData({ ...formData, prioridade: event.target.value })} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unidade</label>
                  <select value={formData.unidade_id || ''} onChange={(event) => setFormData({ ...formData, unidade_id: event.target.value })} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
                    <option value="">Todas / unidade atual</option>
                    {unidades.map((unidade) => <option key={unidade.id} value={unidade.id}>{unidade.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link opcional</label>
                  <input value={formData.link} onChange={(event) => setFormData({ ...formData, link: event.target.value })} placeholder="/faturamento" className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 p-5 rounded-b-2xl flex justify-end gap-3">
              <button type="button" onClick={resetForm} className="px-4 py-2 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Cancelar</button>
              <button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg">Criar notificação</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
