import { useEffect, useMemo, useState } from 'react';
import { CheckCircleIcon, ClipboardDocumentListIcon, PlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import { useUnidade } from '../contexts/UnidadeContext';
import { applyUnidadeToPayload } from '../services/unidadesService';
import { buildTodayAdministrations, normalizeSchedule, validatePrescriptionItem } from '../lib/prescriptionRules';

const emptyItem = { tipo: 'medicamento', descricao: '', dose: '', via: '', frequencia: '', horarios: '', se_necessario: false, orientacoes: '' };

export default function PrescricaoEnfermagem() {
  const { unidadeAtualId } = useUnidade();
  const [loading, setLoading] = useState(true);
  const [internacoes, setInternacoes] = useState([]);
  const [prescricoes, setPrescricoes] = useState([]);
  const [itens, setItens] = useState([]);
  const [checagens, setChecagens] = useState([]);
  const [internacaoId, setInternacaoId] = useState('');
  const [prescricaoId, setPrescricaoId] = useState('');
  const [itemForm, setItemForm] = useState(emptyItem);
  const [saving, setSaving] = useState(false);

  const carregar = async () => {
    setLoading(true);
    try {
      const [admissions, prescriptions, prescriptionItems, administrations] = await Promise.all([
        supabase.from('internacoes').select('id,numero_internacao,paciente_id,leito_id,pacientes(nome),leitos(codigo)').eq('status', 'ativa').order('data_entrada'),
        supabase.from('prescricoes_hospitalares').select('*').order('created_at', { ascending: false }),
        supabase.from('prescricao_hospitalar_itens').select('*').eq('status', 'ativo').order('created_at'),
        supabase.from('administracoes_hospitalares').select('*').gte('horario_previsto', `${new Date().toISOString().slice(0, 10)}T00:00:00`).order('horario_previsto')
      ]);
      for (const response of [admissions, prescriptions, prescriptionItems, administrations]) if (response.error) throw response.error;
      setInternacoes(admissions.data || []);
      setPrescricoes(prescriptions.data || []);
      setItens(prescriptionItems.data || []);
      setChecagens(administrations.data || []);
      if (!internacaoId && admissions.data?.length) setInternacaoId(admissions.data[0].id);
    } catch (error) {
      console.error('Erro ao carregar prescrição:', error);
      toast.error(error.code === '42P01' ? 'Execute a migração 20260822_prescricao_enfermagem.sql no Supabase.' : 'Não foi possível carregar as prescrições.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, [unidadeAtualId]);

  const prescricoesInternacao = useMemo(
    () => prescricoes.filter(item => item.internacao_id === internacaoId),
    [prescricoes, internacaoId]
  );
  useEffect(() => {
    const ativa = prescricoesInternacao.find(item => item.status === 'ativa') || prescricoesInternacao[0];
    setPrescricaoId(ativa?.id || '');
  }, [internacaoId, prescricoes]);

  const itensAtuais = itens.filter(item => item.prescricao_id === prescricaoId);
  const agenda = buildTodayAdministrations(itens.filter(item => prescricoes.find(p => p.id === item.prescricao_id && p.internacao_id === internacaoId && p.status === 'ativa')));
  const checagemPorHorario = new Map(checagens.map(item => [`${item.prescricao_item_id}|${item.horario_previsto.slice(0, 16)}`, item]));

  const novaPrescricao = async () => {
    if (!internacaoId) return toast.error('Selecione uma internação ativa.');
    const internacao = internacoes.find(item => item.id === internacaoId);
    const { data, error } = await supabase.from('prescricoes_hospitalares').insert(applyUnidadeToPayload({
      internacao_id: internacaoId,
      medico_id: null,
      status: 'rascunho'
    }, unidadeAtualId)).select().single();
    if (error) return toast.error(error.message);
    setPrescricoes(current => [data, ...current]);
    setPrescricaoId(data.id);
    toast.success(`Prescrição criada para ${internacao?.pacientes?.nome}.`);
  };

  const adicionarItem = async event => {
    event.preventDefault();
    if (!prescricaoId) return toast.error('Crie ou selecione uma prescrição.');
    const prescription = prescricoes.find(item => item.id === prescricaoId);
    if (prescription?.status !== 'rascunho') return toast.error('Somente prescrições em rascunho podem ser editadas.');
    const validation = validatePrescriptionItem(itemForm);
    if (validation) return toast.error(validation);
    setSaving(true);
    const { data, error } = await supabase.from('prescricao_hospitalar_itens').insert(applyUnidadeToPayload({
      ...itemForm,
      prescricao_id: prescricaoId,
      horarios: normalizeSchedule(itemForm.horarios),
      dose: itemForm.dose || null,
      via: itemForm.via || null,
      frequencia: itemForm.frequencia || null,
      orientacoes: itemForm.orientacoes || null
    }, unidadeAtualId)).select().single();
    setSaving(false);
    if (error) return toast.error(error.message);
    setItens(current => [...current, data]);
    setItemForm(emptyItem);
    toast.success('Item incluído na prescrição.');
  };

  const ativar = async () => {
    const { error } = await supabase.rpc('ativar_prescricao_hospitalar', { p_prescricao_id: prescricaoId });
    if (error) return toast.error(error.message);
    toast.success('Prescrição assinada e ativada.');
    carregar();
  };

  const checar = async (scheduled, status) => {
    const observation = status === 'administrado' ? null : window.prompt('Informe a justificativa clínica:');
    if (status !== 'administrado' && !observation) return;
    const { error } = await supabase.rpc('checar_administracao_hospitalar', {
      p_item_id: scheduled.item.id,
      p_horario_previsto: scheduled.horarioPrevisto,
      p_status: status,
      p_profissional_id: null,
      p_observacao: observation
    });
    if (error) return toast.error(error.message);
    toast.success(status === 'administrado' ? 'Administração checada.' : 'Ocorrência registrada.');
    carregar();
  };

  if (loading) return <div className="flex h-72 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" /></div>;

  return <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900 md:p-6">
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Prescrição e Enfermagem</h1><p className="text-sm text-gray-500">Prescrição eletrônica, aprazamento e checagem de administração à beira-leito.</p></div>
        <button onClick={novaPrescricao} disabled={!internacaoId} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><PlusIcon className="h-4 w-4" />Nova prescrição</button>
      </header>

      <section className="grid gap-4 rounded-2xl border bg-white p-5 dark:border-gray-700 dark:bg-gray-800 lg:grid-cols-2">
        <label className="text-sm font-medium dark:text-gray-200">Internação ativa<select value={internacaoId} onChange={event => setInternacaoId(event.target.value)} className="mt-1 w-full rounded-xl border p-3 dark:border-gray-600 dark:bg-gray-700"><option value="">Selecione</option>{internacoes.map(item => <option key={item.id} value={item.id}>{item.pacientes?.nome} · {item.leitos?.codigo} · {item.numero_internacao}</option>)}</select></label>
        <label className="text-sm font-medium dark:text-gray-200">Prescrição<select value={prescricaoId} onChange={event => setPrescricaoId(event.target.value)} className="mt-1 w-full rounded-xl border p-3 dark:border-gray-600 dark:bg-gray-700"><option value="">Selecione ou crie</option>{prescricoesInternacao.map(item => <option key={item.id} value={item.id}>{new Date(`${item.data_prescricao}T00:00:00`).toLocaleDateString('pt-BR')} · {item.status}</option>)}</select></label>
      </section>

      <div className="grid gap-6 xl:grid-cols-5">
        <section className="rounded-2xl border bg-white p-5 dark:border-gray-700 dark:bg-gray-800 xl:col-span-3">
          <div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 font-semibold dark:text-white"><ClipboardDocumentListIcon className="h-5 w-5 text-blue-600" />Itens prescritos</h2>{prescricoes.find(item => item.id === prescricaoId)?.status === 'rascunho' && itensAtuais.length > 0 && <button onClick={ativar} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">Assinar e ativar</button>}</div>
          <div className="space-y-3">{itensAtuais.map(item => <article key={item.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"><div className="flex justify-between gap-3"><div><span className="text-xs font-semibold uppercase text-blue-600">{item.tipo}</span><h3 className="font-semibold dark:text-white">{item.descricao}</h3><p className="text-sm text-gray-500">{[item.dose, item.via, item.frequencia].filter(Boolean).join(' · ') || 'Sem complementos'}</p></div><div className="text-right text-xs text-gray-500">{item.se_necessario ? 'Se necessário' : item.horarios.join(' · ')}</div></div></article>)}{!itensAtuais.length && <p className="py-8 text-center text-sm text-gray-500">Nenhum item nesta prescrição.</p>}</div>

          {prescricoes.find(item => item.id === prescricaoId)?.status === 'rascunho' && <form onSubmit={adicionarItem} className="mt-6 grid gap-3 border-t pt-5 dark:border-gray-700 md:grid-cols-2">
            <select value={itemForm.tipo} onChange={event => setItemForm({...itemForm, tipo: event.target.value})} className="rounded-xl border p-3 dark:bg-gray-700"><option value="medicamento">Medicamento</option><option value="dieta">Dieta</option><option value="cuidado">Cuidado</option><option value="procedimento">Procedimento</option></select>
            <input value={itemForm.descricao} onChange={event => setItemForm({...itemForm, descricao: event.target.value})} placeholder="Descrição *" className="rounded-xl border p-3 dark:bg-gray-700" />
            <input value={itemForm.dose} onChange={event => setItemForm({...itemForm, dose: event.target.value})} placeholder="Dose (ex.: 500 mg)" className="rounded-xl border p-3 dark:bg-gray-700" />
            <input value={itemForm.via} onChange={event => setItemForm({...itemForm, via: event.target.value})} placeholder="Via (VO, EV, IM...)" className="rounded-xl border p-3 dark:bg-gray-700" />
            <input value={itemForm.frequencia} onChange={event => setItemForm({...itemForm, frequencia: event.target.value})} placeholder="Frequência (ex.: 8/8h)" className="rounded-xl border p-3 dark:bg-gray-700" />
            <input value={itemForm.horarios} onChange={event => setItemForm({...itemForm, horarios: event.target.value})} placeholder="Horários (06:00, 14:00, 22:00)" className="rounded-xl border p-3 dark:bg-gray-700" />
            <label className="flex items-center gap-2 text-sm dark:text-gray-200"><input type="checkbox" checked={itemForm.se_necessario} onChange={event => setItemForm({...itemForm, se_necessario: event.target.checked})} />Se necessário</label>
            <button disabled={saving} className="rounded-xl bg-blue-600 p-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Salvando...' : 'Adicionar item'}</button>
          </form>}
        </section>

        <section className="rounded-2xl border bg-white p-5 dark:border-gray-700 dark:bg-gray-800 xl:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 font-semibold dark:text-white"><CheckCircleIcon className="h-5 w-5 text-emerald-600" />Agenda de hoje</h2>
          <div className="space-y-3">{agenda.map(scheduled => { const key = `${scheduled.item.id}|${scheduled.horarioPrevisto.slice(0, 16)}`; const checked = checagemPorHorario.get(key); return <article key={key} className={`rounded-xl border p-4 ${checked ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20' : 'border-gray-200 dark:border-gray-700'}`}><div className="flex justify-between gap-2"><div><strong className="text-lg dark:text-white">{scheduled.time}</strong><p className="text-sm font-medium dark:text-gray-200">{scheduled.item.descricao}</p><p className="text-xs text-gray-500">{scheduled.item.dose} {scheduled.item.via}</p></div>{checked && <span className="h-fit rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">{checked.status}</span>}</div>{!checked && <div className="mt-3 flex gap-2"><button onClick={() => checar(scheduled, 'administrado')} className="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white">Administrado</button><button onClick={() => checar(scheduled, 'nao_administrado')} className="flex-1 rounded-lg bg-red-50 py-2 text-xs font-semibold text-red-700">Não administrado</button></div>}</article>})}{!agenda.length && <p className="py-8 text-center text-sm text-gray-500">Não há horários ativos para esta internação.</p>}</div>
        </section>
      </div>
    </div>
  </div>;
}
