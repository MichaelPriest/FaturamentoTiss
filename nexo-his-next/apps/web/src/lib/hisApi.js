import { normalizePatientSearch } from './hisApiRules';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isHisApiConfigured = Boolean(url && anonKey);

function authHeaders() {
  const accessToken = sessionStorage.getItem('nexo_access_token');
  return { apikey: anonKey, Authorization: `Bearer ${accessToken || anonKey}`, 'Content-Type': 'application/json' };
}

export function getStoredSession() {
  const token = sessionStorage.getItem('nexo_access_token');
  const user = JSON.parse(sessionStorage.getItem('nexo_user') || 'null');
  return token ? { token, user } : null;
}

export async function signIn(email, password) {
  if (!isHisApiConfigured) throw new Error('Ambiente de dados reais não configurado.');
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { apikey: anonKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error_description || payload.msg || 'Credenciais inválidas.');
  sessionStorage.setItem('nexo_access_token', payload.access_token);
  sessionStorage.setItem('nexo_user', JSON.stringify(payload.user));
  return { token: payload.access_token, user: payload.user };
}

export function signOut() {
  sessionStorage.removeItem('nexo_access_token');
  sessionStorage.removeItem('nexo_user');
}

async function request(path, { count = false, method = 'GET', body, prefer } = {}) {
  if (!isHisApiConfigured) throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: { ...authHeaders(), ...((count || prefer) ? { Prefer: prefer || 'count=exact' } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Falha ao consultar dados (${response.status}).`);
  }
  return { data: await response.json(), count: Number(response.headers.get('content-range')?.split('/')[1] || 0) };
}

export async function loadReceptionQueue() {
  const { data } = await request('atendimentos?select=id,paciente_id,tipo,status,prioridade,data_chegada,observacoes,pacientes(id,nome,cpf,data_nascimento)&status=in.(AGENDADO,CHEGOU,TRIAGEM,EM_ATENDIMENTO)&order=data_chegada.asc&limit=100');
  return data;
}

export async function createPatient(payload) {
  const { data } = await request('pacientes?select=id,nome,cpf,data_nascimento', { method: 'POST', body: payload, prefer: 'return=representation' });
  return data[0];
}

export async function createReception(payload) {
  const { data } = await request('atendimentos?select=*', { method: 'POST', body: payload, prefer: 'return=representation' });
  return data[0];
}

export async function advanceReception(id, status) {
  const { data } = await request(`atendimentos?id=eq.${encodeURIComponent(id)}&select=*`, { method: 'PATCH', body: { status, updated_at: new Date().toISOString() }, prefer: 'return=representation' });
  return data[0];
}

export async function loadOperationalDashboard() {
  const [patients, admissions, accounts, glosas] = await Promise.all([
    request('pacientes?select=id,nome,cpf,data_nascimento&order=nome.asc&limit=20', { count: true }),
    request('internacoes?select=id,paciente_id,status,data_entrada&status=eq.ativa&order=data_entrada.desc&limit=20', { count: true }),
    request('contas_hospitalares?select=id,valor_total_liquido,situacao&situacao=in.(ABERTA,FECHADA)&limit=1000', { count: true }),
    request('glosas_financeiras?select=id,valor_glosado,prazo_recurso,situacao&situacao=eq.PENDENTE&order=prazo_recurso.asc&limit=1000', { count: true })
  ]);
  const admissionByPatient = new Map(admissions.data.map(item => [String(item.paciente_id), item]));
  return {
    metrics: {
      patients: patients.count,
      admissions: admissions.count,
      openAccounts: accounts.count,
      pendingGlosas: glosas.count
    },
    patients: patients.data.map(item => ({ ...item, admission: admissionByPatient.get(String(item.id)) })),
    accounts: accounts.data,
    glosas: glosas.data
  };
}

export async function searchPatients(term) {
  const clean = normalizePatientSearch(term);
  if (clean.length < 2) return [];
  const encoded = encodeURIComponent(`*${clean}*`);
  const { data } = await request(`pacientes?select=id,nome,cpf,data_nascimento&or=(nome.ilike.${encoded},cpf.ilike.${encoded})&order=nome.asc&limit=10`);
  return data;
}
