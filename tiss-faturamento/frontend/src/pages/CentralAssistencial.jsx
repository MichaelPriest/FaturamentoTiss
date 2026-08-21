import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BeakerIcon, BuildingOffice2Icon, CalendarDaysIcon, ClipboardDocumentCheckIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { getUserWorkspace } from '../lib/sectorWorkspaces';
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
  const workspace = getUserWorkspace(user);
  const [params, setParams] = useSearchParams();
  const availableAreas = useMemo(
    () => workspace.id === 'todos' ? areas : areas.filter(area => area.sectors.includes(workspace.id)),
    [workspace.id]
  );
  const requestedArea = params.get('area');
  const activeArea = availableAreas.find(area => area.id === requestedArea) || availableAreas[0];

  useEffect(() => {
    if (activeArea && requestedArea !== activeArea.id) setParams({ area: activeArea.id }, { replace: true });
  }, [activeArea?.id, requestedArea, setParams]);

  if (!activeArea) return <div className="rounded-2xl border bg-white p-10 text-center text-sm text-slate-500">Nenhuma área assistencial disponível para este perfil.</div>;
  const ActiveComponent = activeArea.component;

  return <div className="space-y-4">
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex gap-2 overflow-x-auto">{availableAreas.map(area => { const Icon=area.icon; return <button key={area.id} onClick={() => setParams({area:area.id})} className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${activeArea.id===area.id?'bg-cyan-600 text-white shadow-md':'text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-800'}`}><Icon className="h-5 w-5"/>{area.label}</button>; })}</div>
    </div>
    <ActiveComponent />
  </div>;
}
