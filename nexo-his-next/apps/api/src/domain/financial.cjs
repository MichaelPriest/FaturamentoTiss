'use strict';

const MONEY_SCALE = 100n;

function moneyToCents(value, field = 'valor') {
  const normalized = String(value ?? '0').trim().replace(',', '.');
  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) throw Object.assign(new Error(`${field} deve possuir no máximo duas casas decimais.`), { status: 400 });
  const negative = normalized.startsWith('-');
  const [integer, fraction = ''] = normalized.replace('-', '').split('.');
  const cents = BigInt(integer) * MONEY_SCALE + BigInt(fraction.padEnd(2, '0'));
  return negative ? -cents : cents;
}

function centsToMoney(cents) {
  const value = BigInt(cents);
  const sign = value < 0n ? '-' : '';
  const absolute = value < 0n ? -value : value;
  return `${sign}${absolute / MONEY_SCALE}.${String(absolute % MONEY_SCALE).padStart(2, '0')}`;
}

function calculateAccountTotals(items, discount = '0') {
  const gross = items.reduce((total, item) => total + moneyToCents(item.valor_total, 'valor_total'), 0n);
  const discountCents = moneyToCents(discount, 'desconto');
  if (discountCents < 0n || discountCents > gross) throw Object.assign(new Error('Desconto não pode ser negativo ou superior ao valor bruto.'), { status: 400 });
  return { bruto: centsToMoney(gross), desconto: centsToMoney(discountCents), liquido: centsToMoney(gross - discountCents) };
}

function validateAppeal({ prazo_recurso, justificativa, anexos = [] }) {
  const deadline = new Date(`${prazo_recurso}T23:59:59.999Z`);
  if (!prazo_recurso || Number.isNaN(deadline.getTime())) throw Object.assign(new Error('Prazo de recurso inválido.'), { status: 400 });
  if (deadline < new Date()) throw Object.assign(new Error('Prazo para recurso expirado.'), { status: 422 });
  if (String(justificativa || '').trim().length < 20) throw Object.assign(new Error('Informe justificativa técnica com pelo menos 20 caracteres.'), { status: 400 });
  const types = new Set(anexos.map((item) => typeof item === 'string' ? '' : item.tipo));
  const missing = ['prontuario', 'guia', 'laudo'].filter((type) => !types.has(type));
  if (missing.length) throw Object.assign(new Error(`Anexos obrigatórios ausentes: ${missing.join(', ')}.`), { status: 400 });
}

function assertSafeReturnXml(xml) {
  const text = String(xml || '');
  if (!text.trim() || text.length > 10 * 1024 * 1024) throw Object.assign(new Error('XML vazio ou acima do limite de 10 MB.'), { status: 413 });
  if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw Object.assign(new Error('DTD e entidades externas não são permitidas.'), { status: 400 });
  return text;
}

module.exports = { moneyToCents, centsToMoney, calculateAccountTotals, validateAppeal, assertSafeReturnXml };
