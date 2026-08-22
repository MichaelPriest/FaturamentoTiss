const digits = (value, limit) => String(value ?? '').replace(/\D/g, '').slice(0, limit);

export const maskCPF = value => digits(value, 11)
  .replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
export const maskCNPJ = value => digits(value, 14)
  .replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2');
export const maskCEP = value => digits(value, 8).replace(/^(\d{5})(\d)/, '$1-$2');
export const maskPhone = value => {
  const number = digits(value, 11);
  return number.length <= 10
    ? number.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
    : number.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
};
export const maskRG = value => digits(value, 10).replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
export const maskANS = value => digits(value, 6);
export const unmask = value => String(value ?? '').replace(/\D/g, '');
