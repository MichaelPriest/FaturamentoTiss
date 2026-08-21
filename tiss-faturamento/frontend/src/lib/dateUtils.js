import { format } from 'date-fns';

export function parseDateWithoutTimezone(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const dateOnly = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  return new Date(value);
}

export function formatDateOnly(value, fallback = '') {
  if (!value) return fallback;
  const parsed = parseDateWithoutTimezone(value);
  return Number.isNaN(parsed?.getTime()) ? String(value) : format(parsed, 'dd/MM/yyyy');
}
