export function normalizePatientSearch(term) {
  return String(term || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[%*,()]/g, '').trim().slice(0, 80);
}

export function canAdvanceReception(current, next) {
  const flow = ['AGENDADO', 'CHEGOU', 'TRIAGEM', 'EM_ATENDIMENTO', 'FINALIZADO'];
  return flow.indexOf(next) === flow.indexOf(current) + 1;
}
