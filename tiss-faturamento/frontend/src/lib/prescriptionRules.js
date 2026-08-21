const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function normalizeSchedule(value = '') {
  return [...new Set(String(value).split(/[;,\s]+/).map(item => item.trim()).filter(Boolean))].sort();
}

export function validatePrescriptionItem(item) {
  if (!String(item?.descricao || '').trim()) return 'Informe a descrição do item.';
  const schedule = normalizeSchedule(item?.horarios);
  if (!item?.se_necessario && schedule.length === 0) return 'Informe ao menos um horário ou marque “se necessário”.';
  if (schedule.some(time => !TIME_PATTERN.test(time))) return 'Use horários válidos no formato HH:MM.';
  if (item?.tipo === 'medicamento' && !String(item?.via || '').trim()) return 'Informe a via de administração.';
  return null;
}

export function buildTodayAdministrations(items, now = new Date()) {
  return items.flatMap(item => (item.horarios || []).map(time => ({
    item,
    horarioPrevisto: new Date(
      now.getFullYear(), now.getMonth(), now.getDate(),
      Number(time.slice(0, 2)), Number(time.slice(3, 5))
    ).toISOString(),
    time
  }))).sort((a, b) => a.time.localeCompare(b.time));
}
