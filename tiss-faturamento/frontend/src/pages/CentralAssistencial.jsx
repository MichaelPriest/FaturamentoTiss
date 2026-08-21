import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BeakerIcon, BuildingOffice2Icon, CalendarDaysIcon, ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon, IdentificationIcon, ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useUnidade } from '../contexts/UnidadeContext';
import { getUserWorkspace } from '../lib/sectorWorkspaces';
import { buildPatientJourney, getPatientAlerts } from '../lib/patientJourney';
import { supabase } from '../lib/supabaseClient';
import SearchableSelect from '../components/SearchableSelect';
import ProntoAtendimento from './ProntoAtendimento';
import OperacaoHospitalar from './OperacaoHospitalar';
import PrescricaoEnfermagem from './PrescricaoEnfermagem';
import ApoioDiagnostico from './ApoioDiagnostico';
import CentroCirurgico from './CentroCirurgico';

const areas = [
  { id: 'pronto', label: 'Pronto atendimento', icon: ShieldCheckIcon, component: ProntoAtendimento, sectors: ['recepcao','assistencial'] },
  { id: 'internacao', label: 'Internação e leitos', icon: BuildingOffice2Icon, component: OperacaoHospitalar, sectors: ['assistencial','farmacia'] },
  { id: 'prescricao', label: 'Prescrição e enfermagem', icon: ClipboardDocumentCheckIcon, component: PrescricaoEnfermagem, sectors: ['assistencial','farmacia'] },
  { id: 'diagnostico', label: 'Laboratório e imagem', icon: BeakerIcon, component: ApoioDiagnostico, sectors: ['assistencial','diagnostico'] },
  { id: 'cirurgico', label: 'Centro cirúrgico', icon: CalendarDaysIcon, component: CentroCirurgico, sectors: ['assistencial'] }
];

export default function CentralAssistencial() {
  const { user } = useAuth();
  const { unidadeAtualId, unidadeAtual } = useUnidade();
  const workspace = getUserWorkspace(user);
  const [params, setParams] = useSearchParams();
  const [patients, setPatients] = useState([]);
  const [journeyData, setJourneyData] = useState({});
  const [loadingContext, setLoadingContext] = useState(false);
  const availableAreas = useMemo(
    () => workspace.id === 'todos' ? areas : areas.filter(area => area.sectors.includes(workspace.id)),
    [workspace.id]
  );
  const requestedArea = params.get('area');
  const patientId = params.get('paciente') || '';
  const activeArea = availableAreas.find(area => area.id === requestedArea) || availableAreas[0];
  const selectedPatient = patients.find(patient => String(patient.id) === String(patientId));
  const journey = useMemo(() => buildPatientJourney(journeyData), [journeyData]);
  const alerts = useMemo(() => getPatientAlerts(journeyData), [journeyData]);

  const updateParams = values => setParams(current => {
    const next = new URLSearchParams(current);
    Object.entries(values).forEach(([key,value]) => value ? next.set(key,value) : next.delete(key));
    return next;
  });

  useEffect(() => {
    supabase.from('pacientes').select('id,nome,cpf,data_nascimento').order('nome').then(({data}) => setPatients(data || []));
  }, [unidadeAtualId]);

  useEffect(() => {
    if (!patientId) { setJourneyData({}); return; }
    let active = true;
    const loadContext = async () => {
      setLoadingContext(true);
      const results = await Promise.all([
        supabase.from('agendamentos').select('id,data_agendamento,status').eq('paciente_id',patientId).order('data_agendamento',{ascending:false}).limit(10),
        supabase.from('classificacoes_risco').select('id,prioridade,status,classificado_em').eq('paciente_id',patientId).order('classificado_em',{ascending:false}).limit(10),
        supabase.from('atendimentos').select('id,status,created_at').eq('paciente_id',patientId).order('created_at',{ascending:false}).limit(10),
        supabase.from('internacoes').select('id,status,data_entrada,data_saida,leitos(codigo)').eq('paciente_id',patientId).order('data_entrada',{ascending:false}).limit(10),
        supabase.from('solicitacoes_exames').select('id,status,prioridade,solicitado_em,exames_catalogo(nome)').eq('paciente_id',patientId).order('solicitado_em',{ascending:false}).limit(10),
        supabase.from('cirurgias').select('id,status,inicio_previsto,procedimento').eq('paciente_id',patientId).order('inicio_previsto',{ascending:false}).limit(10)
      ]);
      if (!active) return;
      setJourneyData({ agendamentos:results[0].data||[],triagens:results[1].data||[],atendimentos:results[2].data||[],internacoes:results[3].data||[],exames:results[4].data||[],cirurgias:results[5].data||[] });
      setLoadingContext(false);
    };
    loadContext();
    return () => { active=false; };
  }, [patientId, unidadeAtualId]);

  useEffect(() => {
    if (activeArea && requestedArea !== activeArea.id) updateParams({ area: activeArea.id });
  }, [activeArea?.id, requestedArea, setParams]);

  if (!activeArea) return <div className="rounded-2xl border bg-white p-10 text-center text-sm text-slate-500">Nenhuma área assistencial disponível para este perfil.</div>;
  const ActiveComponent = activeArea.component;

  return <div className="space-y-4">
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 text-white shadow-lg dark:border-gray-800">
      <div className="grid gap-5 p-5 lg:grid-cols-[minmax(280px,0.8fr)_2fr] lg:items-end">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Contexto do paciente · {unidadeAtual?.nome||'Unidade atual'}</p><SearchableSelect label="Localizar paciente" value={patientId} onChange={value=>updateParams({paciente:value})} options={patients} getLabel={patient=>`${patient.nome} · ${patient.cpf||'CPF não informado'}`} placeholder="Digite nome ou CPF..."/></div>
        {selectedPatient?<div><div className="flex flex-wrap items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/20"><IdentificationIcon className="h-6 w-6 text-cyan-300"/></span><div><h2 className="text-xl font-bold">{selectedPatient.nome}</h2><p className="text-xs text-slate-300">CPF {selectedPatient.cpf||'não informado'} · Nascimento {selectedPatient.data_nascimento?new Date(`${selectedPatient.data_nascimento}T00:00:00`).toLocaleDateString('pt-BR'):'não informado'}</p></div>{loadingContext&&<span className="text-xs text-cyan-300">Atualizando jornada...</span>}</div><div className="mt-4 grid grid-cols-3 gap-2 md:grid-cols-6">{journey.map((stage,index)=><div key={stage.id} className={`relative rounded-lg border px-2 py-2 text-center text-[11px] font-semibold ${stage.status==='active'?'border-cyan-300 bg-cyan-500/20 text-cyan-100':stage.status==='completed'?'border-emerald-500/30 bg-emerald-500/10 text-emerald-200':'border-white/10 text-slate-500'}`}><span className="mb-1 block text-[9px]">{stage.status==='completed'?'✓':index+1}</span>{stage.label}</div>)}</div></div>:<div className="rounded-xl border border-dashed border-white/20 p-5 text-sm text-slate-300">Selecione um paciente para visualizar a jornada completa da recepção à alta.</div>}
      </div>
      {alerts.length>0&&<div className="flex flex-wrap gap-2 border-t border-white/10 bg-red-950/30 px-5 py-3">{alerts.map(alert=><span key={alert.text} className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${alert.level==='critical'?'bg-red-500/20 text-red-200':alert.level==='warning'?'bg-amber-500/20 text-amber-200':'bg-blue-500/20 text-blue-200'}`}><ExclamationTriangleIcon className="h-4 w-4"/>{alert.text}</span>)}</div>}
    </section>
    <div className="sticky top-[73px] z-[8] rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/95"><div className="flex gap-2 overflow-x-auto">{availableAreas.map(area => { const Icon=area.icon; return <button key={area.id} onClick={() => updateParams({area:area.id})} className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${activeArea.id===area.id?'bg-cyan-600 text-white shadow-md':'text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-800'}`}><Icon className="h-5 w-5"/>{area.label}</button>; })}</div></div>
    <ActiveComponent patientId={patientId} />
  </div>;
}
