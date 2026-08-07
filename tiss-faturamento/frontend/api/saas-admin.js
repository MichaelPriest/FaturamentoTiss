const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  || process.env.SUPABASE_SECRET_KEY
  || process.env.SUPABASE_SERVICE_KEY
  || process.env.SB_SECRET_KEY;

function requireConfiguration() {
  const missing = [];
  if (!SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!ANON_KEY) missing.push('SUPABASE_ANON_KEY');
  if (!SERVICE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_SECRET_KEY');
  if (missing.length) {
    throw Object.assign(new Error(`API SaaS não configurada no servidor. Variáveis ausentes: ${missing.join(', ')}. Configure-as também no ambiente Preview da Vercel e faça um novo deploy.`), {
      status: 503,
      code: 'SAAS_ENV_MISSING',
      missing
    });
  }
}

async function supabaseRequest(path, { method = 'GET', body, prefer } = {}) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: {
      apikey: SERVICE_KEY,
      authorization: `Bearer ${SERVICE_KEY}`,
      'content-type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw Object.assign(new Error(payload?.message || payload?.msg || payload?.error_description || 'Falha na operação administrativa.'), { status: response.status });
  }
  return payload;
}

async function authenticateSaasAdmin(req) {
  const authorization = req.headers.authorization || '';
  if (!authorization.startsWith('Bearer ')) return false;
  const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: ANON_KEY, authorization },
    signal: AbortSignal.timeout(10000)
  });
  if (!userResponse.ok) return false;
  const user = await userResponse.json();
  const rows = await supabaseRequest(`/rest/v1/saas_administradores?usuario_id=eq.${encodeURIComponent(user.id)}&select=usuario_id`);
  return rows.length > 0 ? user : null;
}

const cleanText = (value, max = 255) => String(value || '').trim().slice(0, max);
const requireUuid = (value, field) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''))) {
    throw Object.assign(new Error(`${field} inválido.`), { status: 400 });
  }
  return value;
};

async function bootstrap() {
  const [empresas, unidades, usuarios, acessos] = await Promise.all([
    supabaseRequest('/rest/v1/empresas?select=*&order=nome.asc'),
    supabaseRequest('/rest/v1/unidades?select=*&order=nome.asc'),
    supabaseRequest('/rest/v1/usuarios?select=id,email,nome,role,ativo,empresa_id,unidade_id,created_at&order=nome.asc'),
    supabaseRequest('/rest/v1/usuario_unidades?select=usuario_id,unidade_id,empresa_id,padrao,ativo')
  ]);
  return { empresas, unidades, usuarios, acessos };
}

async function saveEmpresa(payload) {
  const data = {
    nome: cleanText(payload.nome), documento: cleanText(payload.documento, 30) || null,
    ativo: payload.ativo !== false, updated_at: new Date().toISOString()
  };
  if (!data.nome) throw Object.assign(new Error('Nome da empresa é obrigatório.'), { status: 400 });
  if (payload.id) {
    requireUuid(payload.id, 'Empresa');
    return supabaseRequest(`/rest/v1/empresas?id=eq.${payload.id}`, { method: 'PATCH', body: data, prefer: 'return=representation' });
  }
  return supabaseRequest('/rest/v1/empresas', { method: 'POST', body: data, prefer: 'return=representation' });
}

async function saveUnidade(payload) {
  const data = {
    empresa_id: requireUuid(payload.empresa_id, 'Empresa'), nome: cleanText(payload.nome),
    codigo: cleanText(payload.codigo, 50) || null, cnpj: cleanText(payload.cnpj, 20) || null,
    cnes: cleanText(payload.cnes, 20) || null, ativo: payload.ativo !== false,
    updated_at: new Date().toISOString()
  };
  if (!data.nome) throw Object.assign(new Error('Nome da unidade é obrigatório.'), { status: 400 });
  if (payload.id) {
    requireUuid(payload.id, 'Unidade');
    return supabaseRequest(`/rest/v1/unidades?id=eq.${payload.id}`, { method: 'PATCH', body: data, prefer: 'return=representation' });
  }
  return supabaseRequest('/rest/v1/unidades', { method: 'POST', body: data, prefer: 'return=representation' });
}

async function validateUnits(empresaId, unidadeIds) {
  const ids = unidadeIds.map(encodeURIComponent).join(',');
  const rows = await supabaseRequest(`/rest/v1/unidades?id=in.(${ids})&empresa_id=eq.${empresaId}&select=id`);
  if (rows.length !== unidadeIds.length) {
    throw Object.assign(new Error('Uma ou mais unidades não pertencem à empresa selecionada.'), { status: 400 });
  }
}

async function createUser(payload) {
  const empresaId = requireUuid(payload.empresa_id, 'Empresa');
  const unidadeIds = [...new Set(payload.unidade_ids || [])].map((id) => requireUuid(id, 'Unidade'));
  if (!unidadeIds.length) throw Object.assign(new Error('Selecione pelo menos uma unidade.'), { status: 400 });
  await validateUnits(empresaId, unidadeIds);
  const email = cleanText(payload.email).toLowerCase();
  const password = String(payload.password || '');
  if (!email || password.length < 8) throw Object.assign(new Error('Informe e-mail e senha com pelo menos 8 caracteres.'), { status: 400 });

  const authUser = await supabaseRequest('/auth/v1/admin/users', {
    method: 'POST', body: { email, password, email_confirm: true, user_metadata: { nome: cleanText(payload.nome) } }
  });
  try {
    const defaultUnit = unidadeIds.includes(payload.unidade_padrao_id) ? payload.unidade_padrao_id : unidadeIds[0];
    await supabaseRequest('/rest/v1/usuarios', {
      method: 'POST', prefer: 'return=minimal', body: {
        id: authUser.id, email, nome: cleanText(payload.nome) || email.split('@')[0],
        role: payload.role === 'admin' ? 'admin' : 'usuario', ativo: true,
        empresa_id: empresaId, unidade_id: defaultUnit, updated_at: new Date().toISOString()
      }
    });
    await supabaseRequest('/rest/v1/usuario_unidades', {
      method: 'POST', prefer: 'return=minimal',
      body: unidadeIds.map((unidadeId) => ({ usuario_id: authUser.id, unidade_id: unidadeId, empresa_id: empresaId, padrao: unidadeId === defaultUnit }))
    });
    return { id: authUser.id };
  } catch (error) {
    await supabaseRequest(`/auth/v1/admin/users/${authUser.id}`, { method: 'DELETE' }).catch(() => {});
    throw error;
  }
}

async function updateUser(payload) {
  const userId = requireUuid(payload.id, 'Usuário');
  const empresaId = requireUuid(payload.empresa_id, 'Empresa');
  const unidadeIds = [...new Set(payload.unidade_ids || [])].map((id) => requireUuid(id, 'Unidade'));
  if (!unidadeIds.length) throw Object.assign(new Error('Selecione pelo menos uma unidade.'), { status: 400 });
  await validateUnits(empresaId, unidadeIds);
  const defaultUnit = unidadeIds.includes(payload.unidade_padrao_id) ? payload.unidade_padrao_id : unidadeIds[0];
  if (payload.password && String(payload.password).length < 8) {
    throw Object.assign(new Error('A nova senha deve ter pelo menos 8 caracteres.'), { status: 400 });
  }

  const [oldUser] = await supabaseRequest(`/rest/v1/usuarios?id=eq.${userId}&select=nome,role,ativo,empresa_id,unidade_id`);
  const oldAccess = await supabaseRequest(`/rest/v1/usuario_unidades?usuario_id=eq.${userId}&select=usuario_id,unidade_id,empresa_id,padrao,ativo`);
  if (!oldUser) throw Object.assign(new Error('Usuário não encontrado.'), { status: 404 });

  await supabaseRequest(`/rest/v1/usuarios?id=eq.${userId}`, {
    method: 'PATCH', prefer: 'return=minimal', body: {
      nome: cleanText(payload.nome), role: payload.role === 'admin' ? 'admin' : 'usuario',
      ativo: payload.ativo !== false, empresa_id: empresaId, unidade_id: defaultUnit,
      updated_at: new Date().toISOString()
    }
  });
  try {
    await supabaseRequest(`/rest/v1/usuario_unidades?usuario_id=eq.${userId}`, { method: 'DELETE', prefer: 'return=minimal' });
    await supabaseRequest('/rest/v1/usuario_unidades', {
      method: 'POST', prefer: 'return=minimal',
      body: unidadeIds.map((unidadeId) => ({ usuario_id: userId, unidade_id: unidadeId, empresa_id: empresaId, padrao: unidadeId === defaultUnit }))
    });
  } catch (error) {
    await supabaseRequest(`/rest/v1/usuarios?id=eq.${userId}`, { method: 'PATCH', body: oldUser, prefer: 'return=minimal' }).catch(() => {});
    if (oldAccess.length) await supabaseRequest('/rest/v1/usuario_unidades', { method: 'POST', body: oldAccess, prefer: 'return=minimal' }).catch(() => {});
    throw error;
  }
  if (payload.password) {
    await supabaseRequest(`/auth/v1/admin/users/${userId}`, { method: 'PUT', body: { password: payload.password } });
  }
  return { id: userId };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  try {
    requireConfiguration();
    const admin = await authenticateSaasAdmin(req);
    if (!admin) return res.status(403).json({ error: 'Acesso exclusivo do administrador SaaS.' });
    const { action, payload = {} } = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    let data;
    if (action === 'bootstrap') data = await bootstrap();
    else if (action === 'save_empresa') data = await saveEmpresa(payload);
    else if (action === 'save_unidade') data = await saveUnidade(payload);
    else if (action === 'create_user') data = await createUser(payload);
    else if (action === 'update_user') data = await updateUser(payload);
    else throw Object.assign(new Error('Ação administrativa inválida.'), { status: 400 });
    if (action !== 'bootstrap') {
      const safePayload = { ...payload };
      delete safePayload.password;
      await supabaseRequest('/rest/v1/saas_auditoria', {
        method: 'POST', prefer: 'return=minimal',
        body: { administrador_id: admin.id, acao: action, entidade_id: String(payload.id || data?.id || data?.[0]?.id || ''), detalhes: safePayload }
      }).catch((auditError) => console.error('[saas-admin:audit]', auditError.message));
    }
    return res.status(200).json({ data });
  } catch (error) {
    console.error('[saas-admin]', error.message);
    return res.status(error.status || 500).json({
      error: error.message || 'Erro interno no painel SaaS.',
      code: error.code || 'SAAS_ADMIN_ERROR',
      missing: error.missing || undefined
    });
  }
};
