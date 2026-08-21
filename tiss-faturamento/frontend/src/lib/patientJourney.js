export const PATIENT_JOURNEY_STAGES = [
  { id: 'recepcao', label: 'Recepção' }, { id: 'triagem', label: 'Triagem' },
  { id: 'atendimento', label: 'Atendimento' }, { id: 'internacao', label: 'Internação' },
  { id: 'terapeutica', label: 'Terapêutica e apoio' }, { id: 'alta', label: 'Alta' }
];

export function buildPatientJourney(data = {}) {
  const hasReception = Boolean(data.agendamentos?.length || data.atendimentos?.length || data.triagens?.length || data.internacoes?.length);
  const hasTriage = Boolean(data.triagens?.length);
  const hasCare = Boolean(data.atendimentos?.length || data.internacoes?.length);
  const activeAdmission = data.internacoes?.find(item => item.status === 'ativa');
  const closedAdmission = data.internacoes?.find(item => ['alta','transferida'].includes(item.status));
  const hasTherapy = Boolean(data.exames?.length || data.cirurgias?.length || data.prescricoes?.length);
  const values = { recepcao:hasReception,triagem:hasTriage,atendimento:hasCare,internacao:Boolean(data.internacoes?.length),terapeutica:hasTherapy,alta:Boolean(closedAdmission) };
  let active = closedAdmission ? 'alta' : activeAdmission ? 'internacao' : hasCare ? 'atendimento' : hasTriage ? 'triagem' : 'recepcao';
  if (activeAdmission && hasTherapy) active = 'terapeutica';
  return PATIENT_JOURNEY_STAGES.map(stage => ({ ...stage, status: stage.id === active ? 'active' : values[stage.id] ? 'completed' : 'pending' }));
}

export function getPatientAlerts(data = {}) {
  const alerts = [];
  if (data.triagens?.some(item => ['vermelho','laranja'].includes(item.prioridade) && !['finalizado','evasao'].includes(item.status))) alerts.push({ level:'critical', text:'Classificação de alta prioridade ativa' });
  if (data.exames?.some(item => item.status !== 'laudo_disponivel' && item.prioridade === 'emergencia')) alerts.push({ level:'warning', text:'Exame de emergência pendente' });
  if (data.internacoes?.some(item => item.status === 'ativa')) alerts.push({ level:'info', text:'Paciente com internação ativa' });
  return alerts;
}
