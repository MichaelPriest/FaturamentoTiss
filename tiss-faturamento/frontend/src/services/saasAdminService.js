import { supabase } from '../lib/supabaseClient';

export async function executarAcaoSaas(action, payload = {}) {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) {
    throw new Error('Sessão expirada. Entre novamente.');
  }

  const response = await fetch('/api/saas-admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ action, payload })
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || 'Falha na administração SaaS.');
  return result?.data;
}

export const saasAdminService = {
  carregar: () => executarAcaoSaas('bootstrap'),
  salvarEmpresa: (payload) => executarAcaoSaas('save_empresa', payload),
  salvarUnidade: (payload) => executarAcaoSaas('save_unidade', payload),
  criarUsuario: (payload) => executarAcaoSaas('create_user', payload),
  atualizarUsuario: (payload) => executarAcaoSaas('update_user', payload)
};
