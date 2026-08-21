const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isHisApiConfigured = Boolean(url && anonKey);

function authHeaders() {
  const accessToken = sessionStorage.getItem('nexo_access_token');
  return { apikey: anonKey, Authorization: `Bearer ${accessToken || anonKey}`, 'Content-Type': 'application/json' };
}

async function request(path, { count = false } = {}) {
  if (!isHisApiConfigured) throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  const response = await fetch(`${url}/rest/v1/${path}`, { headers: { ...authHeaders(), ...(count ? { Prefer: 'count=exact' } : {}) } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Falha ao consultar dados (${response.status}).`);
  }
  return { data: await response.json(), count: Number(response.headers.get('content-range')?.split('/')[1] || 0) };
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
  const clean = String(term || '').trim().replace(/[%*,()]/g, '');
  if (clean.length < 2) return [];
  const encoded = encodeURIComponent(`*${clean}*`);
  const { data } = await request(`pacientes?select=id,nome,cpf,data_nascimento&or=(nome.ilike.${encoded},cpf.ilike.${encoded})&order=nome.asc&limit=10`);
  return data;
}
