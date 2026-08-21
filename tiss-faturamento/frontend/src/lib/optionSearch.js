export function normalizeOptionSearch(value = '') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function filterSearchOptions(options = [], query = '', getLabel = option => option.nome || '') {
  const normalizedQuery = normalizeOptionSearch(query);
  if (!normalizedQuery) return options;
  return options.filter(option => normalizeOptionSearch(`${getLabel(option)} ${option.cpf || ''} ${option.codigo || ''}`).includes(normalizedQuery));
}
