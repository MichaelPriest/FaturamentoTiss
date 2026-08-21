const digits = (value, limit) => String(value ?? '').replace(/\D/g, '').slice(0, limit);

export const unmask = value => String(value ?? '').replace(/\D/g, '');

export const maskCpf = value => digits(value, 11)
  .replace(/^(\d{3})(\d)/, '$1.$2')
  .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
  .replace(/(\d{3})(\d{1,2})$/, '$1-$2');

export const maskCnpj = value => digits(value, 14)
  .replace(/^(\d{2})(\d)/, '$1.$2')
  .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
  .replace(/\.(\d{3})(\d)/, '.$1/$2')
  .replace(/(\d{4})(\d{1,2})$/, '$1-$2');

export const maskPhone = value => {
  const valueDigits = digits(value, 11);
  return valueDigits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(valueDigits.length === 11 ? /(\d{5})(\d{1,4})$/ : /(\d{4})(\d{1,4})$/, '$1-$2');
};

export const maskCep = value => digits(value, 8).replace(/^(\d{5})(\d)/, '$1-$2');
export const maskAns = value => digits(value, 6);
export const maskCnes = value => digits(value, 7);

