import { useEffect, useMemo, useState } from 'react';
import { ClockIcon, HeartIcon, PlusIcon, UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import { useUnidade } from '../contexts/UnidadeContext';
import { applyUnidadeToPayload } from '../services/unidadesService';
import { getTriageTiming, sortTriageQueue, TRIAGE_LEVELS, validateVitals } from '../lib/triageRules';

const priorityStyles = {
  vermelho: 'border-red-400 bg-red-50 text-red-800', laranja: 'border-orange-400 bg-orange-50 text-orange-800',
  amarelo: 'border-yellow-400 bg-yellow-50 text-yellow-800', verde: 'border-emerald-400 bg-emerald-50 text-emerald-800',
  azul: 'border-blue-400 bg-blue-50 text-blue-800'
};
const emptyForm = {
  paciente_id: '', prioridade: 'verde', queixa_principal: '', inicio_sintomas: '', alergias: '', medicamentos_uso: '',
  pressao_sistolica: '', pressao_diastolica: '', frequencia_cardiaca: '', frequencia_respiratoria: '',
  saturacao: '', temperatura: '', glicemia: '', escala_dor: '', observacoes: ''
};
const numericFields = ['pressao_sistolica','pressao_diastolica','frequencia_cardiaca','frequencia_respiratoria','saturacao','temperatura','glicemia','escala_dor'];

export default function ProntoAtendimento() {
  const { unidadeAtualId } = useUnidade();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [triages, setTriages] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(new Date());

  const load = async () => {
    setLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [patientsResponse, triageResponse] = await Promise.all([
      supabase.from('pacientes').select('id,nome,cpf,data_nascimento').order('nome'),
      supabase.from('classificacoes_risco').select('*,pacientes(nome,cpf,data_nascimento)').gte('classificado_em', today.toISOString()).order('classificado_em')
    ]);
    if (patientsResponse.error || triageResponse.error) {
      const error = patientsResponse.error || triageResponse.error;
      toast.error(error.code === '42P01' ? 'Execute a migração 20260823_pronto_atendimento.sql no Supabase.' : 'Não foi possível carregar o pronto atendimento.');
    } else {
      setPatients(patientsResponse.data || []);
      setTriages(triageResponse.data || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [unidadeAtualId]);
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(timer); }, []);

  const activeQueue = useMemo(() => sortTriageQueue(triages.filter(item => ['aguardando','chamado','em_atendimento'].includes(item.status))), [triages]);
  const filteredQueue = activeQueue.filter(item => item.pacientes?.nome?.toLowerCase().includes(search.toLowerCase()) || item.queixa_principal.toLowerCase().includes(search.toLowerCase()));
  const metrics = {
    waiting: triages.filter(item => item.status === 'aguardando').length,
    attending: triages.filter(item => ['chamado','em_atendimento'].includes(item.status)).length,
    urgent: triages.filter(item => ['vermelho','laranja'].includes(item.prioridade) && !['finalizado','evasao'].includes(item.status)).length,
    overdue: activeQueue.filter(item => getTriageTiming(item.prioridade, item.classificado_em, now).overdue).length
  };

  const submit = async event => {
    event.preventDefault();
    if (!form.paciente_id || !form.queixa_principal.trim()) return toast.error('Informe paciente e queixa principal.');
    const vitalError = validateVitals(form);
    if (vitalError) return toast.error(vitalError);
    setSaving(true);
    const payload = { ...form, queixa_principal: form.queixa_principal.trim() };
    numericFields.forEach(field => { payload[field] = form[field] === '' ? null : Number(form[field]); });
    const { error } = await supabase.from('classificacoes_risco').insert(applyUnidadeToPayload(payload, unidadeAtualId));
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('Classificação registrada e paciente incluído na fila.');
    setForm(emptyForm); setShowForm(false); load();
  };

  const changeStatus = async (id, status) => {
    const { error } = await supabase.rpc('atualizar_status_classificacao', { p_classificacao_id: id, p_status: status });
    if (error) return toast.error(error.message);
    toast.success(status === 'em_atendimento' ? 'Atendimento iniciado.' : status === 'finalizado' ? 'Atendimento finalizado.' : 'Paciente chamado.');
    load();
  };

  if (loading) return <div className="flex h-72 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-cyan-600" /></div>;

  return <div className="min-h-screen bg-slate-50 p-4 dark:bg-gray-950 md:p-6"><div className="mx-auto max-w-7xl space-y-6">
    <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center"><div><span className="text-xs font-bold uppercase tracking-widest text-cyan-600">Assistência · Porta de entrada</span><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pronto Atendimento</h1><p className="text-sm text-slate-500">Classificação de risco, sinais vitais e acompanhamento da fila assistencial.</p></div><button onClick={() => setShowForm(true)} className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-700"><PlusIcon className="h-5 w-5" />Nova classificação</button></header>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Aguardando" value={metrics.waiting} detail="Na fila assistencial" color="text-blue-600" /><Metric label="Em atendimento" value={metrics.attending} detail="Chamados ou atendidos" color="text-emerald-600" /><Metric label="Alta prioridade" value={metrics.urgent} detail="Vermelho ou laranja" color="text-red-600" /><Metric label="Tempo excedido" value={metrics.overdue} detail="Acima do tempo-alvo" color="text-orange-600" /></section>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"><div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 dark:border-gray-800 sm:flex-row sm:items-center"><div><h2 className="flex items-center gap-2 font-bold dark:text-white"><UserGroupIcon className="h-5 w-5 text-cyan-600" />Fila assistencial</h2><p className="text-xs text-slate-500">Ordenada por prioridade e horário de classificação</p></div><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar paciente ou queixa" className="rounded-xl border border-slate-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800" /></div>
      <div className="divide-y divide-slate-100 dark:divide-gray-800">{filteredQueue.map(item => { const timing = getTriageTiming(item.prioridade,item.classificado_em,now); return <article key={item.id} className="grid gap-4 p-5 lg:grid-cols-[1.2fr_2fr_1fr_auto] lg:items-center"><div className="flex items-center gap-3"><span className={`h-11 w-2 rounded-full border ${priorityStyles[item.prioridade]}`} /><div><strong className="block text-sm dark:text-white">{item.pacientes?.nome}</strong><span className="text-xs text-slate-500">{TRIAGE_LEVELS[item.prioridade].label} · Dor {item.escala_dor ?? '-'}/10</span></div></div><div><p className="text-sm font-medium text-slate-700 dark:text-gray-200">{item.queixa_principal}</p><p className="mt-1 text-xs text-slate-500">PA {item.pressao_sistolica || '-'}/{item.pressao_diastolica || '-'} · FC {item.frequencia_cardiaca || '-'} · SpO₂ {item.saturacao || '-'}% · Temp. {item.temperatura || '-'}°C</p></div><div className={`flex items-center gap-2 text-sm font-semibold ${timing.overdue?'text-red-600':'text-slate-600 dark:text-gray-300'}`}><ClockIcon className="h-5 w-5" />{timing.elapsedMinutes} min <span className="text-xs font-normal">/ alvo {timing.targetMinutes} min</span></div><div className="flex gap-2">{item.status==='aguardando'&&<button onClick={() => changeStatus(item.id,'chamado')} className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">Chamar</button>}{item.status==='chamado'&&<button onClick={() => changeStatus(item.id,'em_atendimento')} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">Iniciar</button>}{item.status==='em_atendimento'&&<button onClick={() => changeStatus(item.id,'finalizado')} className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white">Finalizar</button>}</div></article>; })}{!filteredQueue.length&&<p className="p-10 text-center text-sm text-slate-500">Nenhum paciente aguardando atendimento.</p>}</div>
    </section>
  </div>

  {showForm&&<div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-4"><div className="mx-auto my-6 max-w-4xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900"><div className="mb-6 flex items-start justify-between"><div><h2 className="text-xl font-bold dark:text-white">Classificação de risco</h2><p className="text-sm text-slate-500">A prioridade deve ser definida por profissional habilitado conforme protocolo institucional.</p></div><button onClick={() => setShowForm(false)}><XMarkIcon className="h-6 w-6" /></button></div><form onSubmit={submit} className="space-y-6"><section className="grid gap-4 md:grid-cols-2"><Field label="Paciente"><select value={form.paciente_id} onChange={event => setForm({...form,paciente_id:event.target.value})} required className="input"><option value="">Selecione</option>{patients.map(patient => <option key={patient.id} value={patient.id}>{patient.nome} · {patient.cpf || 'CPF não informado'}</option>)}</select></Field><Field label="Prioridade clínica"><select value={form.prioridade} onChange={event => setForm({...form,prioridade:event.target.value})} className="input">{Object.entries(TRIAGE_LEVELS).map(([id,level]) => <option key={id} value={id}>{id.toUpperCase()} · {level.label} · alvo {level.targetMinutes} min</option>)}</select></Field><Field label="Queixa principal" wide><textarea value={form.queixa_principal} onChange={event => setForm({...form,queixa_principal:event.target.value})} rows="3" required className="input" /></Field><Field label="Início dos sintomas"><input value={form.inicio_sintomas} onChange={event => setForm({...form,inicio_sintomas:event.target.value})} className="input" /></Field><Field label="Alergias"><input value={form.alergias} onChange={event => setForm({...form,alergias:event.target.value})} className="input" /></Field></section><section><h3 className="mb-3 flex items-center gap-2 font-bold dark:text-white"><HeartIcon className="h-5 w-5 text-red-500" />Sinais vitais</h3><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Number label="PA sistólica" field="pressao_sistolica" form={form} setForm={setForm} /><Number label="PA diastólica" field="pressao_diastolica" form={form} setForm={setForm} /><Number label="Frequência cardíaca" field="frequencia_cardiaca" form={form} setForm={setForm} /><Number label="Frequência respiratória" field="frequencia_respiratoria" form={form} setForm={setForm} /><Number label="Saturação (%)" field="saturacao" form={form} setForm={setForm} step="0.1" /><Number label="Temperatura (°C)" field="temperatura" form={form} setForm={setForm} step="0.1" /><Number label="Glicemia" field="glicemia" form={form} setForm={setForm} step="0.1" /><Number label="Dor (0 a 10)" field="escala_dor" form={form} setForm={setForm} /></div></section><button disabled={saving} className="w-full rounded-xl bg-cyan-600 p-3 font-semibold text-white disabled:opacity-50">{saving?'Registrando...':'Concluir classificação e incluir na fila'}</button></form></div></div>}
  </div>;
}

function Metric({label,value,detail,color}) { return <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p><p className="text-xs text-slate-400">{detail}</p></article>; }
function Field({label,wide,children}) { return <label className={`text-sm font-medium dark:text-gray-200 ${wide?'md:col-span-2':''}`}>{label}{children}</label>; }
function Number({label,field,form,setForm,step='1'}) { return <label className="text-xs font-medium text-slate-600 dark:text-gray-300">{label}<input type="number" step={step} value={form[field]} onChange={event => setForm({...form,[field]:event.target.value})} className="input" /></label>; }
