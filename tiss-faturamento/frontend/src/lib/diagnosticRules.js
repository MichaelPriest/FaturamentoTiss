export const DIAGNOSTIC_STATUS = {
  solicitado: { label: 'Solicitado', next: 'coletado' },
  coletado: { label: 'Coletado', next: 'em_processamento' },
  em_processamento: { label: 'Em processamento', next: 'laudo_disponivel' },
  laudo_disponivel: { label: 'Laudo disponível', next: null },
  cancelado: { label: 'Cancelado', next: null }
};

export function validateDiagnosticRequest(request) {
  if (!request?.paciente_id) return 'Selecione o paciente.';
  if (!request?.exame_id) return 'Selecione o exame.';
  if (request.prioridade === 'emergencia' && !String(request.indicacao_clinica || '').trim()) return 'Informe a indicação clínica para pedidos de emergência.';
  return null;
}

export function isDiagnosticDelayed(request, now = new Date()) {
  if (['laudo_disponivel','cancelado'].includes(request.status)) return false;
  const deadline = new Date(request.solicitado_em).getTime() + Number(request.exames_catalogo?.prazo_horas || 24) * 3600000;
  return now.getTime() > deadline;
}

export function sortDiagnosticQueue(requests) {
  const priority = { emergencia: 1, urgente: 2, rotina: 3 };
  return [...requests].sort((a,b) => (priority[a.prioridade] || 9) - (priority[b.prioridade] || 9) || new Date(a.solicitado_em) - new Date(b.solicitado_em));
}
