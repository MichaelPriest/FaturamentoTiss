export const SURGERY_FLOW = {
  agendada: { label: 'Agendada', next: 'confirmada' }, confirmada: { label: 'Confirmada', next: 'em_preparo' },
  em_preparo: { label: 'Em preparo', next: 'em_cirurgia' }, em_cirurgia: { label: 'Em cirurgia', next: 'recuperacao' },
  recuperacao: { label: 'Recuperação', next: 'concluida' }, concluida: { label: 'Concluída', next: null }, cancelada: { label: 'Cancelada', next: null }
};
export const REQUIRED_PREOPERATIVE_CHECKS = ['identidade_confirmada','procedimento_confirmado','sitio_confirmado','consentimento_confirmado','alergias_revisadas','risco_via_aerea_revisado','profilaxia_confirmada','materiais_confirmados'];

export function validateSurgery(surgery) {
  if (!surgery?.paciente_id || !surgery?.procedimento?.trim() || !surgery?.sala?.trim() || !surgery?.inicio_previsto) return 'Preencha paciente, procedimento, sala e início previsto.';
  if (surgery.fim_previsto && new Date(surgery.fim_previsto) <= new Date(surgery.inicio_previsto)) return 'O término previsto deve ser posterior ao início.';
  return null;
}
export function isPreoperativeChecklistComplete(checklist={}) { return REQUIRED_PREOPERATIVE_CHECKS.every(field=>checklist[field]===true); }
export function hasSurgeryRoomConflict(candidate, surgeries) { const start=new Date(candidate.inicio_previsto),end=new Date(candidate.fim_previsto||start.getTime()+3600000);return surgeries.some(item=>(candidate.id==null||item.id!==candidate.id)&&item.sala.trim().toLowerCase()===candidate.sala.trim().toLowerCase()&&!['cancelada','concluida'].includes(item.status)&&start<new Date(item.fim_previsto||new Date(item.inicio_previsto).getTime()+3600000)&&end>new Date(item.inicio_previsto)); }
