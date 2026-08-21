export const TRIAGE_LEVELS = {
  vermelho: { label: 'Emergência', targetMinutes: 0, order: 1 },
  laranja: { label: 'Muito urgente', targetMinutes: 10, order: 2 },
  amarelo: { label: 'Urgente', targetMinutes: 60, order: 3 },
  verde: { label: 'Pouco urgente', targetMinutes: 120, order: 4 },
  azul: { label: 'Não urgente', targetMinutes: 240, order: 5 }
};

const inRange = (value, min, max) => value === '' || value == null || (Number(value) >= min && Number(value) <= max);

export function validateVitals(vitals) {
  if (!inRange(vitals.pressao_sistolica, 30, 300) || !inRange(vitals.pressao_diastolica, 20, 200)) return 'Pressão arterial fora do intervalo aceito.';
  if (!inRange(vitals.frequencia_cardiaca, 20, 300)) return 'Frequência cardíaca fora do intervalo aceito.';
  if (!inRange(vitals.frequencia_respiratoria, 4, 80)) return 'Frequência respiratória fora do intervalo aceito.';
  if (!inRange(vitals.saturacao, 30, 100)) return 'Saturação fora do intervalo aceito.';
  if (!inRange(vitals.temperatura, 25, 45)) return 'Temperatura fora do intervalo aceito.';
  if (!inRange(vitals.escala_dor, 0, 10)) return 'A escala de dor deve estar entre 0 e 10.';
  return null;
}

export function getTriageTiming(priority, classifiedAt, now = new Date()) {
  const level = TRIAGE_LEVELS[priority] || TRIAGE_LEVELS.azul;
  const elapsedMinutes = Math.max(0, Math.floor((now.getTime() - new Date(classifiedAt).getTime()) / 60000));
  return { ...level, elapsedMinutes, overdue: elapsedMinutes > level.targetMinutes };
}

export function sortTriageQueue(items) {
  return [...items].sort((a, b) => {
    const priority = (TRIAGE_LEVELS[a.prioridade]?.order || 99) - (TRIAGE_LEVELS[b.prioridade]?.order || 99);
    return priority || new Date(a.classificado_em) - new Date(b.classificado_em);
  });
}
