'use strict';

const { assertSafeReturnXml, validateAppeal } = require('./_financial-domain.cjs');

const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

function fail(message, status = 400) { throw Object.assign(new Error(message), { status }); }
function uuid(value, name) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''))) fail(`${name} inválido.`);
  return value;
}
function isoDate(value, name) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) fail(`${name} inválida.`);
  return value;
}
function requestBody(req) { return typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); }

async function db(req, path, options = {}) {
  if (!URL || !ANON) fail('API financeira não configurada.', 503);
  const authorization = req.headers.authorization || '';
  if (!authorization.startsWith('Bearer ')) fail('Autenticação obrigatória.', 401);
  const response = await fetch(`${URL}/rest/v1/${path}`, {
    method: options.method || 'GET',
    headers: { apikey: ANON, authorization, 'content-type': 'application/json', ...(options.prefer ? { Prefer: options.prefer } : {}) },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: AbortSignal.timeout(30000)
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) fail(payload?.message || payload?.hint || 'Falha na operação financeira.', response.status);
  return payload;
}

async function rpc(req, name, body) { return db(req, `rpc/${name}`, { method: 'POST', body }); }

async function handlerFor(req) {
  const parsedUrl = new URL(req.url, 'http://localhost');
  const pathname = String(req.query?.route || parsedUrl.searchParams.get('route') || parsedUrl.pathname.replace(/^\/api\//, '')).replace(/^\/+/, '');
  const body = requestBody(req);
  let match;
  if (req.method === 'POST' && (match = pathname.match(/^faturamento\/gerar-conta\/([0-9]+)$/))) {
    return rpc(req, 'gerar_conta_hospitalar', { p_guia_id: Number(match[1]) });
  }
  if (req.method === 'POST' && pathname === 'faturamento/gerar-remessa') {
    return rpc(req, 'gerar_remessa_faturamento', {
      p_operadora_id: Number(body.id_operadora) || fail('Operadora inválida.'),
      p_data_inicio: isoDate(body.data_inicio, 'Data inicial'), p_data_fim: isoDate(body.data_fim, 'Data final')
    });
  }
  if (req.method === 'POST' && pathname === 'faturamento/processar-retorno') {
    assertSafeReturnXml(body.xml); // A RPC mantém parsing, conciliação e auditoria na mesma transação.
    return rpc(req, 'processar_retorno_faturamento', { p_remessa_id: uuid(body.id_remessa, 'Remessa'), p_xml: body.xml });
  }
  if (req.method === 'GET' && pathname === 'glosas') {
    const query = new URL(req.url, 'http://localhost').searchParams;
    const page = Math.max(1, Number(query.get('page')) || 1); const limit = Math.min(100, Math.max(1, Number(query.get('limit')) || 25));
    let filter = `glosas_financeiras?select=*,guias_faturamento!inner(remessa_id)&order=prazo_recurso.asc&offset=${(page - 1) * limit}&limit=${limit}`;
    if (query.get('status')) filter += `&situacao=eq.${encodeURIComponent(query.get('status'))}`;
    if (query.get('operadora')) filter += `&operadora_id=eq.${encodeURIComponent(query.get('operadora'))}`;
    return { page, limit, data: await db(req, filter) };
  }
  if (req.method === 'POST' && (match = pathname.match(/^glosas\/([0-9a-f-]+)\/recurso$/i))) {
    const glosaId = uuid(match[1], 'Glosa');
    const [glosa] = await db(req, `glosas_financeiras?id=eq.${glosaId}&select=prazo_recurso`);
    if (!glosa) fail('Glosa não encontrada.', 404);
    validateAppeal({ ...body, prazo_recurso: glosa.prazo_recurso });
    return rpc(req, 'abrir_recurso_glosa', { p_glosa_ids: [glosaId], p_justificativa: body.justificativa, p_anexos: body.anexos });
  }
  if (req.method === 'GET' && pathname === 'dashboard/financeiro') return rpc(req, 'dashboard_financeiro', {});
  if (req.method === 'GET' && pathname === 'relatorios/glosas-por-motivo') return rpc(req, 'relatorio_glosas_por_motivo', {});
  fail('Endpoint financeiro não encontrado.', 404);
}

module.exports = async function handler(req, res) {
  try { res.status(200).json({ data: await handlerFor(req) }); }
  catch (error) { res.status(error.status || 500).json({ error: error.message || 'Erro interno.' }); }
};
