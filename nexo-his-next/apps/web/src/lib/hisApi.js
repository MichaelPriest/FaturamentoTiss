import { normalizePatientSearch, shouldRefreshSession } from './hisApiRules';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isHisApiConfigured = Boolean(url && anonKey);

function authHeaders() {
  const accessToken = sessionStorage.getItem('nexo_access_token');
  return { apikey: anonKey, Authorization: `Bearer ${accessToken || anonKey}`, 'Content-Type': 'application/json' };
}

export function getStoredSession() {
  const token = sessionStorage.getItem('nexo_access_token');
  const refreshToken = sessionStorage.getItem('nexo_refresh_token');
  const expiresAt = Number(sessionStorage.getItem('nexo_expires_at') || 0);
  const user = JSON.parse(sessionStorage.getItem('nexo_user') || 'null');
  return token ? { token, refreshToken, expiresAt, user } : null;
}

function storeSession(payload) {
  const expiresAt = Date.now() + Math.max(0, Number(payload.expires_in || 3600) - 30) * 1000;
  sessionStorage.setItem('nexo_access_token', payload.access_token);
  if (payload.refresh_token) sessionStorage.setItem('nexo_refresh_token', payload.refresh_token);
  sessionStorage.setItem('nexo_expires_at', String(expiresAt));
  if (payload.user) sessionStorage.setItem('nexo_user', JSON.stringify(payload.user));
  return { token: payload.access_token, refreshToken: payload.refresh_token, expiresAt, user: payload.user || JSON.parse(sessionStorage.getItem('nexo_user') || 'null') };
}

export async function signIn(email, password) {
  if (!isHisApiConfigured) throw new Error('Ambiente de dados reais não configurado.');
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { apikey: anonKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error_description || payload.msg || 'Credenciais inválidas.');
  return storeSession(payload);
}

let refreshPromise;
export async function refreshSession() {
  if (refreshPromise) return refreshPromise;
  const refreshToken = sessionStorage.getItem('nexo_refresh_token');
  if (!refreshToken) throw new Error('Sua sessão expirou. Entre novamente.');
  refreshPromise = fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST', headers: { apikey: anonKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: refreshToken })
  }).then(async response => {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error_description || payload.msg || 'Não foi possível renovar a sessão.');
    return storeSession(payload);
  }).finally(() => { refreshPromise = null; });
  return refreshPromise;
}

export function signOut() {
  sessionStorage.removeItem('nexo_access_token');
  sessionStorage.removeItem('nexo_refresh_token');
  sessionStorage.removeItem('nexo_expires_at');
  sessionStorage.removeItem('nexo_user');
}

export async function loadCurrentProfile() {
  const session=getStoredSession();
  if(!session?.user?.id) throw new Error('Usuário autenticado sem identificador.');
  const path=`usuarios?id=eq.${encodeURIComponent(session.user.id)}&select=id,nome,role,setor_acesso,nivel_acesso,unidades(nome,cnes)&limit=1`;
  let {data}=await request(path);
  if(!data[0]) {
    await request('rpc/garantir_meu_perfil',{method:'POST',body:{}});
    ({data}=await request(path));
  }
  if(!data[0]) throw new Error('Não foi possível preparar o perfil institucional. Entre novamente ou contate o administrador.');
  return data[0];
}

function expireSession() {
  signOut();
  window.dispatchEvent(new CustomEvent('nexo:session-expired'));
}

async function request(path, { count = false, method = 'GET', body, prefer } = {}, allowRefresh = true) {
  if (!isHisApiConfigured) throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  const expiresAt = Number(sessionStorage.getItem('nexo_expires_at') || 0);
  if (allowRefresh && shouldRefreshSession(expiresAt)) {
    try { await refreshSession(); } catch (error) { expireSession(); throw error; }
  }
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: { ...authHeaders(), ...((count || prefer) ? { Prefer: prefer || 'count=exact' } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  if (response.status === 401 && allowRefresh) {
    try { await refreshSession(); return request(path, { count, method, body, prefer }, false); }
    catch (error) { expireSession(); throw error; }
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Falha ao consultar dados (${response.status}).`);
  }
  return { data: await response.json(), count: Number(response.headers.get('content-range')?.split('/')[1] || 0) };
}

export async function loadReceptionQueue() {
  const { data } = await request('atendimentos?select=id,paciente_id,tipo,status,prioridade,data_chegada,observacoes,modalidade_pagamento,convenio_id,numero_carteirinha,pacientes(id,nome,cpf,data_nascimento)&status=in.(AGENDADO,CHEGOU)&order=data_chegada.asc&limit=100');
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

export async function loadInsurers() {
  const {data}=await request('convenios?select=id,razao_social,registro_ans&order=razao_social.asc');
  return data;
}

export async function registerCompleteArrival(form) {
  const patientFields=['nome','nome_social','cpf','data_nascimento','sexo','nome_mae','telefone','email','cep','logradouro','numero','complemento','bairro','cidade','uf'];
  const paciente=Object.fromEntries(patientFields.map(field=>[field,form[field]||'']));
  const atendimento={tipo:form.tipo,prioridade:form.prioridade,observacoes:form.observacoes,modalidade_pagamento:form.modalidade_pagamento,convenio_id:form.convenio_id,numero_carteirinha:form.numero_carteirinha,validade_carteirinha:form.validade_carteirinha};
  const {data}=await request('rpc/registrar_chegada_completa',{method:'POST',body:{p_paciente:paciente,p_atendimento:atendimento}});
  return data;
}

export async function advanceReception(id, status) {
  const { data } = await request('rpc/avancar_atendimento', { method: 'POST', body: { p_atendimento_id: id, p_novo_status: status } });
  return data;
}

export async function loadTriageQueue() {
  const { data } = await request('atendimentos?select=id,numero_atendimento,status,prioridade,tipo,setor,local_atendimento,data_chegada,modalidade_pagamento,numero_carteirinha,plano,numero_guia,senha_autorizacao,validade_autorizacao,origem_paciente,motivo_atendimento,pacientes(id,nome,nome_social,cpf,data_nascimento,sexo,responsavel_nome,foto_url,alergias,doencas_cronicas,medicamentos_continuos,alertas_clinicos),unidades(nome),convenios(razao_social),prestadores(nome,conselho,numero_conselho),triagens(id,classificacao,queixa_principal,pressao_sistolica,pressao_diastolica,frequencia_cardiaca,saturacao,temperatura,escala_dor,observacoes,realizada_em)&status=in.(CHEGOU,TRIAGEM)&order=data_chegada.asc&limit=100');
  return data;
}

export async function registerTriage(form) {
  const payload={p_atendimento_id:form.atendimento_id,p_classificacao:form.classificacao,p_queixa:form.queixa_principal.trim(),p_sistolica:form.pressao_sistolica===''?null:Number(form.pressao_sistolica),p_diastolica:form.pressao_diastolica===''?null:Number(form.pressao_diastolica),p_fc:form.frequencia_cardiaca===''?null:Number(form.frequencia_cardiaca),p_saturacao:form.saturacao===''?null:Number(form.saturacao),p_temperatura:form.temperatura===''?null:Number(form.temperatura),p_dor:form.escala_dor===''?null:Number(form.escala_dor),p_observacoes:form.observacoes||null};
  const { data }=await request('rpc/concluir_triagem_e_encaminhar',{method:'POST',body:payload});
  return data;
}

export async function loadClinicalQueue() {
  const {data}=await request('atendimentos?select=id,numero_atendimento,status,prioridade,tipo,setor,local_atendimento,data_chegada,modalidade_pagamento,numero_carteirinha,plano,numero_guia,senha_autorizacao,validade_autorizacao,origem_paciente,motivo_atendimento,pacientes(id,nome,nome_social,cpf,data_nascimento,sexo,responsavel_nome,foto_url,alergias,doencas_cronicas,medicamentos_continuos,alertas_clinicos),unidades(nome),convenios(razao_social),prestadores(nome,conselho,numero_conselho),triagens(classificacao,queixa_principal,pressao_sistolica,pressao_diastolica,frequencia_cardiaca,saturacao,temperatura,escala_dor,observacoes,realizada_em)&status=eq.EM_ATENDIMENTO&order=updated_at.asc&limit=100');
  return data;
}

export async function loadClinicalMeasurements(atendimentoId) {
  if(!atendimentoId) return [];
  const {data}=await request(`medicoes_clinicas?select=*&atendimento_id=eq.${encodeURIComponent(atendimentoId)}&order=created_at.desc&limit=20`);
  return data;
}

export async function registerClinicalMeasurement(atendimentoId,measurement) {
  const body={atendimento_id:atendimentoId,...Object.fromEntries(Object.entries(measurement).map(([key,value])=>[key,value===''?null:Number(value)]))};
  const {data}=await request('medicoes_clinicas?select=*',{method:'POST',body,prefer:'return=representation'});
  return data[0];
}

export async function loadClinicalSupport(atendimentoId) {
  const id=encodeURIComponent(atendimentoId);
  const [diagnoses,requests,documents,status,account]=await Promise.all([
    request(`atendimento_diagnosticos?select=*&atendimento_id=eq.${id}&order=created_at.desc`),
    request(`solicitacoes_assistenciais?select=*&atendimento_id=eq.${id}&order=created_at.desc`),
    request(`documentos_medicos?select=*&atendimento_id=eq.${id}&order=created_at.desc`),
    request(`atendimentos_status_historico?select=*&atendimento_id=eq.${id}&order=created_at.desc`),
    request(`conta_hospitalar_itens?select=*&atendimento_id=eq.${id}&order=created_at.desc`)
  ]);
  return {diagnosticos:diagnoses.data,solicitacoes:requests.data,documentos:documents.data,status:status.data,conta:account.data};
}

export async function registerAttendanceDiagnosis(atendimentoId,form) {
  const {data}=await request('rpc/registrar_diagnostico_atendimento',{method:'POST',body:{p_atendimento_id:atendimentoId,p_cid10:form.cid10,p_descricao:form.descricao,p_tipo:form.tipo,p_situacao:form.situacao,p_infectocontagioso:form.infectocontagioso}});
  return data;
}

export async function registerCareRequest(atendimentoId,form) {
  const {data}=await request('rpc/registrar_solicitacao_assistencial',{method:'POST',body:{p_atendimento_id:atendimentoId,p_tipo:form.tipo,p_descricao:form.descricao,p_codigo_tuss:form.codigo_tuss||null,p_quantidade:Number(form.quantidade||1),p_indicacao:form.indicacao||null,p_cid10:form.cid10||null,p_urgencia:form.urgencia,p_requer_autorizacao:form.requer_autorizacao,p_senha:form.senha||null,p_valor_unitario:Number(form.valor_unitario||0)}});
  return data;
}

export async function loadClinicalRecord(atendimentoId) {
  if(!atendimentoId) return [];
  const {data}=await request(`evolucoes_clinicas?select=id,subjetivo,objetivo,avaliacao,plano,cid10,prescricao,exames_solicitados,orientacoes,desfecho,created_at&atendimento_id=eq.${encodeURIComponent(atendimentoId)}&order=created_at.desc&limit=20`);
  return data;
}

export async function registerClinicalEvolution(form) {
  const {data}=await request('rpc/registrar_atendimento_clinico',{method:'POST',body:{p_atendimento_id:form.atendimento_id,p_subjetivo:form.subjetivo.trim(),p_objetivo:form.objetivo.trim(),p_avaliacao:form.avaliacao.trim(),p_plano:form.plano.trim(),p_cid10:form.cid10.trim()||null,p_prescricao:form.prescricao.trim()||null,p_exames:form.exames_solicitados.trim()||null,p_orientacoes:form.orientacoes.trim()||null,p_desfecho:form.desfecho,p_finalizar:form.finalizar,p_prioridade_farmacia:form.prioridade_farmacia,p_emitir_atestado:form.emitir_atestado,p_dias_atestado:form.dias_atestado===''?null:Number(form.dias_atestado),p_texto_atestado:form.texto_atestado.trim()||null,p_reavaliar_em:form.reavaliar_em?new Date(form.reavaliar_em).toISOString():null}});
  return data;
}

export async function loadPharmacyQueue() {
  const {data}=await request('solicitacoes_farmacia?select=id,conteudo,prioridade,status,solicitado_em,pacientes(id,nome)&status=in.(PENDENTE,EM_SEPARACAO)&order=prioridade.desc,solicitado_em.asc&limit=100');
  return data;
}

export async function updatePharmacyRequest(id,status) {
  const body={status,...(status==='DISPENSADA'?{dispensado_em:new Date().toISOString()}:{})};
  const {data}=await request(`solicitacoes_farmacia?id=eq.${encodeURIComponent(id)}&select=*`,{method:'PATCH',body,prefer:'return=representation'});
  return data[0];
}

export async function loadOperationalDashboard() {
  const [patients, admissions, accounts, glosas, receptions] = await Promise.all([
    request('pacientes?select=id,nome,cpf,data_nascimento&order=nome.asc&limit=20', { count: true }),
    request('internacoes?select=id,paciente_id,status,data_entrada&status=eq.ativa&order=data_entrada.desc&limit=20', { count: true }),
    request('contas_hospitalares?select=id,valor_total_liquido,situacao&situacao=in.(ABERTA,FECHADA)&limit=1000', { count: true }),
    request('glosas_financeiras?select=id,valor_glosado,prazo_recurso,situacao&situacao=eq.PENDENTE&order=prazo_recurso.asc&limit=1000', { count: true }),
    request('atendimentos?select=id,status&status=in.(AGENDADO,CHEGOU,TRIAGEM,EM_ATENDIMENTO)&limit=1000',{count:true})
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
    glosas: glosas.data,
    receptionSummary: receptions.data.reduce((summary,item)=>({...summary,[item.status]:(summary[item.status]||0)+1}),{})
  };
}

export async function searchPatients(term) {
  const clean = normalizePatientSearch(term);
  if (clean.length < 2) return [];
  const encoded = encodeURIComponent(`*${clean}*`);
  const { data } = await request(`pacientes?select=id,nome,cpf,data_nascimento&or=(nome.ilike.${encoded},cpf.ilike.${encoded})&order=nome.asc&limit=10`);
  return data;
}
