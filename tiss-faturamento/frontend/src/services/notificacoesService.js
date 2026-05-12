import { supabase, TABLES, isSupabaseAvailable } from '../lib/supabaseClient';
import { applyUnidadeToPayload, getStoredUnidadeId, isTodasUnidades } from './unidadesService';

const ensureSupabase = () => {
  if (!isSupabaseAvailable()) {
    throw new Error('Supabase não configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  }
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

export const notificacoesService = {
  async listar({ incluirArquivadas = false, unidadeId = getStoredUnidadeId(), limite = 100 } = {}) {
    ensureSupabase();

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
  },

  async criar(notificacao) {
    ensureSupabase();

    const normalized = normalizeNotification(notificacao);
    const payload = applyUnidadeToPayload(normalized, notificacao.unidade_id ? notificacao.unidade_id : getStoredUnidadeId());

    const { data, error } = await supabase
      .from(TABLES.NOTIFICACOES)
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async atualizar(id, updates) {
    ensureSupabase();

    const payload = { ...updates, updated_at: new Date().toISOString() };
    const { error } = await supabase.from(TABLES.NOTIFICACOES).update(payload).eq('id', id);
    if (error) throw error;
    return true;
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
    ensureSupabase();

    const { error } = await supabase.from(TABLES.NOTIFICACOES).delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  subscribe(callback) {
    if (!isSupabaseAvailable()) {
      console.error('Realtime de notificações indisponível: Supabase não configurado.');
      return () => {};
    }

    const channel = supabase
      .channel('notificacoes-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.NOTIFICACOES }, callback)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }
};
