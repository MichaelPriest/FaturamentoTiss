import { supabase, TABLES, isSupabaseAvailable } from '../lib/supabaseClient';
import { applyUnidadeToPayload, filterByUnidade, getStoredUnidadeId, isTodasUnidades } from './unidadesService';

const NOTIFICACOES_STORAGE_KEY = TABLES.NOTIFICACOES;

const getFallback = () => {
  const stored = localStorage.getItem(NOTIFICACOES_STORAGE_KEY);
  if (stored) return JSON.parse(stored);

  const welcome = [{
    id: Date.now(),
    titulo: 'Bem-vindo ao TISS Faturamento',
    mensagem: 'Sistema pronto para uso. Selecione uma unidade e acompanhe os eventos pelo painel de notificações.',
    tipo: 'success',
    categoria: 'sistema',
    prioridade: 'normal',
    lido: false,
    arquivada: false,
    unidade_id: null,
    created_at: new Date().toISOString()
  }];
  localStorage.setItem(NOTIFICACOES_STORAGE_KEY, JSON.stringify(welcome));
  return welcome;
};

const setFallback = (notificacoes) => {
  localStorage.setItem(NOTIFICACOES_STORAGE_KEY, JSON.stringify(notificacoes));
};

const normalizeNotification = (notificacao = {}) => ({
  titulo: notificacao.titulo || 'Notificação',
  mensagem: notificacao.mensagem || '',
  tipo: notificacao.tipo || 'info',
  categoria: notificacao.categoria || 'sistema',
  prioridade: notificacao.prioridade || 'normal',
  link: notificacao.link || null,
  lido: notificacao.lido ?? false,
  arquivada: notificacao.arquivada ?? false,
  usuario_id: notificacao.usuario_id || null,
  unidade_id: notificacao.unidade_id ?? null,
  metadata: notificacao.metadata || {},
  created_at: notificacao.created_at || new Date().toISOString(),
  updated_at: new Date().toISOString()
});

const scopeFallback = (notificacoes, unidadeId = getStoredUnidadeId()) => {
  const visiveis = notificacoes.filter((notificacao) => notificacao.arquivada !== true);
  if (isTodasUnidades(unidadeId)) return visiveis;
  return visiveis.filter((notificacao) => !notificacao.unidade_id || notificacao.unidade_id === unidadeId);
};

export const notificacoesService = {
  async listar({ incluirArquivadas = false, unidadeId = getStoredUnidadeId(), limite = 100 } = {}) {
    if (!isSupabaseAvailable()) {
      const notificacoes = getFallback();
      const filtradas = incluirArquivadas ? filterByUnidade(notificacoes, unidadeId) : scopeFallback(notificacoes, unidadeId);
      return filtradas.slice(0, limite);
    }

    try {
      let query = supabase
        .from(TABLES.NOTIFICACOES)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limite);

      if (!incluirArquivadas) query = query.neq('arquivada', true);
      if (!isTodasUnidades(unidadeId)) query = query.or(`unidade_id.eq.${unidadeId},unidade_id.is.null`);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao listar notificações:', error);
      const notificacoes = getFallback();
      const filtradas = incluirArquivadas ? filterByUnidade(notificacoes, unidadeId) : scopeFallback(notificacoes, unidadeId);
      return filtradas.slice(0, limite);
    }
  },

  async criar(notificacao) {
    const normalized = normalizeNotification(notificacao);
    const payload = applyUnidadeToPayload(normalized, notificacao.unidade_id ? notificacao.unidade_id : getStoredUnidadeId());

    if (!isSupabaseAvailable()) {
      const notificacoes = getFallback();
      const novaNotificacao = { ...payload, id: Date.now() };
      setFallback([novaNotificacao, ...notificacoes]);
      window.dispatchEvent(new CustomEvent('notifications:changed'));
      return novaNotificacao;
    }

    try {
      const { data, error } = await supabase
        .from(TABLES.NOTIFICACOES)
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      window.dispatchEvent(new CustomEvent('notifications:changed'));
      return data;
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      const notificacoes = getFallback();
      const novaNotificacao = { ...payload, id: Date.now() };
      setFallback([novaNotificacao, ...notificacoes]);
      window.dispatchEvent(new CustomEvent('notifications:changed'));
      return novaNotificacao;
    }
  },

  async atualizar(id, updates) {
    const payload = { ...updates, updated_at: new Date().toISOString() };

    if (!isSupabaseAvailable()) {
      const notificacoes = getFallback().map((notificacao) => notificacao.id === id ? { ...notificacao, ...payload } : notificacao);
      setFallback(notificacoes);
      window.dispatchEvent(new CustomEvent('notifications:changed'));
      return true;
    }

    try {
      const { error } = await supabase.from(TABLES.NOTIFICACOES).update(payload).eq('id', id);
      if (error) throw error;
      window.dispatchEvent(new CustomEvent('notifications:changed'));
      return true;
    } catch (error) {
      console.error('Erro ao atualizar notificação:', error);
      return false;
    }
  },

  marcarLido(id) {
    return this.atualizar(id, { lido: true, lido_em: new Date().toISOString() });
  },

  marcarNaoLido(id) {
    return this.atualizar(id, { lido: false, lido_em: null });
  },

  async marcarTodosComoLidos({ unidadeId = getStoredUnidadeId() } = {}) {
    const notificacoes = await this.listar({ unidadeId });
    await Promise.all(notificacoes.filter((notificacao) => !notificacao.lido).map((notificacao) => this.marcarLido(notificacao.id)));
    return true;
  },

  arquivar(id) {
    return this.atualizar(id, { arquivada: true });
  },

  async excluir(id) {
    if (!isSupabaseAvailable()) {
      setFallback(getFallback().filter((notificacao) => notificacao.id !== id));
      window.dispatchEvent(new CustomEvent('notifications:changed'));
      return true;
    }

    try {
      const { error } = await supabase.from(TABLES.NOTIFICACOES).delete().eq('id', id);
      if (error) throw error;
      window.dispatchEvent(new CustomEvent('notifications:changed'));
      return true;
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
      return false;
    }
  },

  subscribe(callback) {
    if (!isSupabaseAvailable()) {
      const handler = () => callback();
      window.addEventListener('notifications:changed', handler);
      return () => window.removeEventListener('notifications:changed', handler);
    }

    const channel = supabase
      .channel('notificacoes-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.NOTIFICACOES }, callback)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }
};
