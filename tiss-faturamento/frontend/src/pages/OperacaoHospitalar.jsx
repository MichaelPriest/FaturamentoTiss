import { useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon, BeakerIcon, BuildingOffice2Icon, CubeIcon, HomeModernIcon,
  PlusIcon, UserGroupIcon, XMarkIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import { useUnidade } from '../contexts/UnidadeContext';
import { applyUnidadeToPayload } from '../services/unidadesService';

const tabs = [
  { id: 'visao', label: 'Visão operacional', icon: BuildingOffice2Icon },
  { id: 'leitos', label: 'Leitos', icon: HomeModernIcon },
  { id: 'internacoes', label: 'Internações', icon: UserGroupIcon },
  { id: 'estoque', label: 'Estoque e farmácia', icon: CubeIcon }
];
const bedStyles = {
  livre: 'bg-emerald-50 text-emerald-700 border-emerald-200', ocupado: 'bg-red-50 text-red-700 border-red-200',
  reservado: 'bg-blue-50 text-blue-700 border-blue-200', higienizacao: 'bg-amber-50 text-amber-700 border-amber-200',
  manutencao: 'bg-gray-100 text-gray-600 border-gray-200', bloqueado: 'bg-slate-100 text-slate-600 border-slate-200'
};
const emptyAdmission = { paciente_id: '', leito_id: '', medico_id: '', diagnostico: '' };
const emptyStock = { nome: '', codigo: '', categoria: 'material', unidade_medida: 'UN', estoque_atual: 0, estoque_minimo: 0, lote: '', validade: '' };
const emptyBed = { codigo: '', setor: '', tipo: 'enfermaria' };

export default function OperacaoHospitalar() {
  const { unidadeAtualId } = useUnidade();
  const [tab, setTab] = useState('visao');
  const [loading, setLoading] = useState(true);
  const [leitos, setLeitos] = useState([]);
  const [setores, setSetores] = useState([]);
  const [internacoes, setInternacoes] = useState([]);
  const [estoque, setEstoque] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [prestadores, setPrestadores] = useState([]);
  const [showAdmission, setShowAdmission] = useState(false);
  const [showStock, setShowStock] = useState(false);
  const [showBed, setShowBed] = useState(false);
  const [admission, setAdmission] = useState(emptyAdmission);
  const [stockForm, setStockForm] = useState(emptyStock);
  const [bedForm, setBedForm] = useState(emptyBed);

  const carregar = async () => {
    setLoading(true);
    try {
      const [beds, sectors, admissions, items, patients, professionals] = await Promise.all([
        supabase.from('leitos').select('*, setores_hospitalares(nome)').order('codigo'),
        supabase.from('setores_hospitalares').select('*').eq('ativo', true).order('nome'),
        supabase.from('internacoes').select('*, pacientes(nome), leitos(codigo), prestadores(nome)').order('data_entrada', { ascending: false }),
        supabase.from('estoque_itens').select('*').eq('ativo', true).order('nome'),
        supabase.from('pacientes').select('id,nome').order('nome'),
        supabase.from('prestadores').select('id,nome').eq('ativo', true).order('nome')
      ]);
      for (const response of [beds, sectors, admissions, items, patients, professionals]) if (response.error) throw response.error;
      setLeitos(beds.data || []); setSetores(sectors.data || []); setInternacoes(admissions.data || []); setEstoque(items.data || []);
      setPacientes(patients.data || []); setPrestadores(professionals.data || []);
    } catch (error) {
      console.error('Erro ao carregar operação hospitalar:', error);
      toast.error(error.code === '42P01' ? 'Execute a migração 20260821_operacao_hospitalar.sql no Supabase.' : 'Não foi possível carregar a operação hospitalar.');
    } finally { setLoading(false); }
  };
  useEffect(() => { carregar(); }, [unidadeAtualId]);

  const metricas = useMemo(() => ({
    total: leitos.filter(item => item.ativo).length,
    ocupados: leitos.filter(item => item.status === 'ocupado').length,
    livres: leitos.filter(item => item.status === 'livre').length,
    internados: internacoes.filter(item => item.status === 'ativa').length,
    estoqueCritico: estoque.filter(item => Number(item.estoque_atual) <= Number(item.estoque_minimo)).length,
    validadeProxima: estoque.filter(item => item.validade && new Date(`${item.validade}T00:00:00`) <= new Date(Date.now() + 30 * 86400000)).length
  }), [leitos, internacoes, estoque]);

  const internar = async event => {
    event.preventDefault();
    try {
      const { error } = await supabase.rpc('registrar_internacao', {
        p_paciente_id: Number(admission.paciente_id), p_leito_id: admission.leito_id,
        p_medico_id: admission.medico_id ? Number(admission.medico_id) : null, p_diagnostico: admission.diagnostico || null
      });
      if (error) throw error;
      toast.success('Internação registrada e leito ocupado.'); setShowAdmission(false); setAdmission(emptyAdmission); await carregar();
    } catch (error) { toast.error(error.message || 'Erro ao registrar internação.'); }
  };

  const cadastrarEstoque = async event => {
    event.preventDefault();
    try {
      const { error } = await supabase.from('estoque_itens').insert(applyUnidadeToPayload({
        ...stockForm, estoque_atual: Number(stockForm.estoque_atual), estoque_minimo: Number(stockForm.estoque_minimo), validade: stockForm.validade || null
      }, unidadeAtualId));
      if (error) throw error;
      toast.success('Item cadastrado no estoque.'); setShowStock(false); setStockForm(emptyStock); await carregar();
    } catch (error) { toast.error(error.message || 'Erro ao cadastrar item.'); }
  };

  const cadastrarLeito = async event => {
    event.preventDefault();
    try {
      let setor = setores.find(item => item.nome.toLowerCase() === bedForm.setor.trim().toLowerCase());
      if (!setor) {
        const response = await supabase.from('setores_hospitalares').insert(applyUnidadeToPayload({ nome: bedForm.setor.trim(), tipo: 'internacao' }, unidadeAtualId)).select().single();
        if (response.error) throw response.error;
        setor = response.data;
      }
      const { error } = await supabase.from('leitos').insert(applyUnidadeToPayload({ codigo: bedForm.codigo.trim(), tipo: bedForm.tipo, setor_id: setor.id }, unidadeAtualId));
      if (error) throw error;
      toast.success('Leito cadastrado.'); setShowBed(false); setBedForm(emptyBed); await carregar();
    } catch (error) { toast.error(error.message || 'Erro ao cadastrar leito.'); }
  };

  const registrarAlta = async internacao => {
    if (!window.confirm(`Confirmar alta de ${internacao.pacientes?.nome || 'paciente'}?`)) return;
    const { error } = await supabase.rpc('registrar_alta', { p_internacao_id: internacao.id, p_status: 'alta' });
    if (error) return toast.error(error.message);
    toast.success('Alta registrada; leito encaminhado para higienização.'); carregar();
  };

  const movimentar = async (item, tipo) => {
    const valor = window.prompt(`Quantidade para ${tipo === 'entrada' ? 'entrada' : 'saída'} de ${item.nome}:`);
    if (!valor) return;
    const quantidade = Number(valor.replace(',', '.'));
    if (!Number.isFinite(quantidade) || quantidade <= 0) return toast.error('Informe uma quantidade válida.');
    const { error } = await supabase.rpc('registrar_movimento_estoque', { p_item_id: item.id, p_tipo: tipo, p_quantidade: quantidade, p_motivo: 'Movimentação operacional' });
    if (error) return toast.error(error.message);
    toast.success('Estoque atualizado.'); carregar();
  };

  const card = (label, value, color, detail) => <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"><p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p><p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p><p className="mt-1 text-xs text-gray-400">{detail}</p></div>;
  if (loading) return <div className="flex h-72 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" /></div>;

  return <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900 md:p-6">
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center"><div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Central de Operação Hospitalar</h1><p className="mt-1 text-sm text-gray-500">Internações, leitos, suprimentos e alertas assistenciais em uma única visão.</p></div><button onClick={carregar} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"><ArrowPathIcon className="h-4 w-4" />Atualizar central</button></div>
      <div className="mb-6 flex gap-2 overflow-x-auto border-b border-gray-200 pb-2 dark:border-gray-700">{tabs.map(item => { const Icon=item.icon; return <button key={item.id} onClick={()=>setTab(item.id)} className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ${tab===item.id?'bg-blue-600 text-white':'bg-white text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}><Icon className="h-4 w-4" />{item.label}</button>; })}</div>

      {tab==='visao' && <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">{card('Leitos',metricas.total,'text-slate-700','Capacidade ativa')}{card('Ocupados',metricas.ocupados,'text-red-600','Em atendimento')}{card('Livres',metricas.livres,'text-emerald-600','Disponíveis agora')}{card('Internados',metricas.internados,'text-blue-600','Internações ativas')}{card('Estoque crítico',metricas.estoqueCritico,'text-orange-600','Abaixo do mínimo')}{card('Vencimento',metricas.validadeProxima,'text-purple-600','Próximos 30 dias')}</div><div className="mt-6 grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border bg-white p-5 dark:border-gray-700 dark:bg-gray-800"><h2 className="mb-4 font-semibold dark:text-white">Ocupação por leito</h2><div className="space-y-2">{leitos.slice(0,8).map(b=><div key={b.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-3 dark:bg-gray-700/50"><span className="text-sm font-medium dark:text-white">{b.codigo} · {b.setores_hospitalares?.nome||'Sem setor'}</span><span className={`rounded-full border px-2 py-1 text-xs ${bedStyles[b.status]}`}>{b.status}</span></div>)}</div></section><section className="rounded-2xl border bg-white p-5 dark:border-gray-700 dark:bg-gray-800"><h2 className="mb-4 font-semibold dark:text-white">Alertas de suprimentos</h2><div className="space-y-2">{estoque.filter(i=>Number(i.estoque_atual)<=Number(i.estoque_minimo)).slice(0,8).map(i=><div key={i.id} className="flex justify-between rounded-xl bg-orange-50 p-3 text-sm text-orange-800"><span>{i.nome}</span><strong>{i.estoque_atual} {i.unidade_medida}</strong></div>)}{metricas.estoqueCritico===0&&<p className="text-sm text-gray-500">Nenhum item abaixo do estoque mínimo.</p>}</div></section></div></>}

      {tab==='leitos' && <><div className="mb-4 flex justify-end"><button onClick={()=>setShowBed(true)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white"><PlusIcon className="h-4 w-4"/>Novo leito</button></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{leitos.map(b=><article key={b.id} className="rounded-2xl border bg-white p-5 dark:border-gray-700 dark:bg-gray-800"><div className="flex justify-between"><HomeModernIcon className="h-7 w-7 text-blue-600"/><span className={`rounded-full border px-2 py-1 text-xs ${bedStyles[b.status]}`}>{b.status}</span></div><h3 className="mt-4 text-xl font-bold dark:text-white">{b.codigo}</h3><p className="text-sm text-gray-500">{b.setores_hospitalares?.nome||'Setor não informado'} · {b.tipo}</p></article>)}</div></>}

      {tab==='internacoes' && <><div className="mb-4 flex justify-end"><button onClick={()=>setShowAdmission(true)} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white"><PlusIcon className="h-4 w-4"/>Nova internação</button></div><div className="overflow-hidden rounded-2xl border bg-white dark:border-gray-700 dark:bg-gray-800"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-700"><tr><th className="p-3">Internação</th><th className="p-3">Paciente</th><th className="p-3">Leito</th><th className="p-3">Médico</th><th className="p-3">Entrada</th><th className="p-3">Status</th><th className="p-3">Ação</th></tr></thead><tbody>{internacoes.map(i=><tr key={i.id} className="border-t dark:border-gray-700"><td className="p-3 font-mono">{i.numero_internacao}</td><td className="p-3 font-medium dark:text-white">{i.pacientes?.nome||'-'}</td><td className="p-3">{i.leitos?.codigo||'-'}</td><td className="p-3">{i.prestadores?.nome||'-'}</td><td className="p-3">{new Date(i.data_entrada).toLocaleString('pt-BR')}</td><td className="p-3"><span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">{i.status}</span></td><td className="p-3">{i.status==='ativa'&&<button onClick={()=>registrarAlta(i)} className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">Registrar alta</button>}</td></tr>)}</tbody></table></div></div></>}

      {tab==='estoque' && <><div className="mb-4 flex justify-end"><button onClick={()=>setShowStock(true)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white"><PlusIcon className="h-4 w-4"/>Novo item</button></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{estoque.map(i=>{const critico=Number(i.estoque_atual)<=Number(i.estoque_minimo);return <article key={i.id} className={`rounded-2xl border bg-white p-5 dark:bg-gray-800 ${critico?'border-orange-300':'border-gray-200 dark:border-gray-700'}`}><div className="flex justify-between"><div className="flex items-center gap-2"><BeakerIcon className="h-6 w-6 text-blue-600"/><span className="text-xs uppercase text-gray-400">{i.categoria}</span></div>{critico&&<span className="rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-700">Reposição</span>}</div><h3 className="mt-3 font-semibold dark:text-white">{i.nome}</h3><p className="text-xs text-gray-400">{i.codigo||'Sem código'} {i.lote?`· Lote ${i.lote}`:''}</p><p className="mt-4 text-2xl font-bold dark:text-white">{i.estoque_atual} <span className="text-sm font-normal text-gray-400">{i.unidade_medida}</span></p><p className="text-xs text-gray-400">Mínimo: {i.estoque_minimo}</p><div className="mt-4 flex gap-2"><button onClick={()=>movimentar(i,'entrada')} className="flex-1 rounded-lg bg-emerald-50 py-2 text-xs font-medium text-emerald-700">Entrada</button><button onClick={()=>movimentar(i,'saida')} className="flex-1 rounded-lg bg-red-50 py-2 text-xs font-medium text-red-700">Saída</button></div></article>})}</div></>}
    </div>

    {showAdmission&&<Modal title="Nova internação" close={()=>setShowAdmission(false)}><form onSubmit={internar} className="space-y-4"><Select label="Paciente" value={admission.paciente_id} set={v=>setAdmission({...admission,paciente_id:v})} options={pacientes} required/><Select label="Leito disponível" value={admission.leito_id} set={v=>setAdmission({...admission,leito_id:v})} options={leitos.filter(l=>l.status==='livre').map(l=>({id:l.id,nome:`${l.codigo} · ${l.setores_hospitalares?.nome||'Sem setor'}`}))} required/><Select label="Médico responsável" value={admission.medico_id} set={v=>setAdmission({...admission,medico_id:v})} options={prestadores}/><label className="block text-sm">Diagnóstico/hipótese<textarea value={admission.diagnostico} onChange={e=>setAdmission({...admission,diagnostico:e.target.value})} className="mt-1 w-full rounded-xl border p-3 dark:bg-gray-700" rows="3"/></label><Submit label="Registrar internação"/></form></Modal>}
    {showStock&&<Modal title="Novo item de estoque" close={()=>setShowStock(false)}><form onSubmit={cadastrarEstoque} className="grid gap-4 md:grid-cols-2"><Input label="Nome" value={stockForm.nome} set={v=>setStockForm({...stockForm,nome:v})} required/><Input label="Código" value={stockForm.codigo} set={v=>setStockForm({...stockForm,codigo:v})}/><Input label="Unidade" value={stockForm.unidade_medida} set={v=>setStockForm({...stockForm,unidade_medida:v})}/><Input label="Lote" value={stockForm.lote} set={v=>setStockForm({...stockForm,lote:v})}/><Input label="Saldo inicial" type="number" value={stockForm.estoque_atual} set={v=>setStockForm({...stockForm,estoque_atual:v})}/><Input label="Estoque mínimo" type="number" value={stockForm.estoque_minimo} set={v=>setStockForm({...stockForm,estoque_minimo:v})}/><Input label="Validade" type="date" value={stockForm.validade} set={v=>setStockForm({...stockForm,validade:v})}/><div className="md:col-span-2"><Submit label="Cadastrar item"/></div></form></Modal>}
    {showBed&&<Modal title="Novo leito" close={()=>setShowBed(false)}><form onSubmit={cadastrarLeito} className="space-y-4"><Input label="Código do leito" value={bedForm.codigo} set={v=>setBedForm({...bedForm,codigo:v})} required/><Input label="Setor" value={bedForm.setor} set={v=>setBedForm({...bedForm,setor:v})} required/><label className="block text-sm dark:text-gray-200">Tipo<select value={bedForm.tipo} onChange={e=>setBedForm({...bedForm,tipo:e.target.value})} className="mt-1 w-full rounded-xl border p-3 dark:bg-gray-700"><option value="enfermaria">Enfermaria</option><option value="apartamento">Apartamento</option><option value="uti">UTI</option><option value="observacao">Observação</option></select></label><Submit label="Cadastrar leito"/></form></Modal>}
  </div>;
}

function Modal({title,close,children}) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800"><div className="mb-5 flex justify-between"><h2 className="text-lg font-semibold dark:text-white">{title}</h2><button onClick={close}><XMarkIcon className="h-5 w-5"/></button></div>{children}</div></div>; }
function Input({label,value,set,type='text',required}) { return <label className="block text-sm dark:text-gray-200">{label}<input type={type} value={value} onChange={e=>set(e.target.value)} required={required} className="mt-1 w-full rounded-xl border border-gray-300 p-3 dark:border-gray-600 dark:bg-gray-700"/></label>; }
function Select({label,value,set,options,required}) { return <label className="block text-sm dark:text-gray-200">{label}<select value={value} onChange={e=>set(e.target.value)} required={required} className="mt-1 w-full rounded-xl border border-gray-300 p-3 dark:border-gray-600 dark:bg-gray-700"><option value="">Selecione</option>{options.map(o=><option key={o.id} value={o.id}>{o.nome}</option>)}</select></label>; }
function Submit({label}) { return <button type="submit" className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">{label}</button>; }
