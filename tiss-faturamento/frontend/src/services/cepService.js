import { unmask } from '../lib/inputMasks';

const providers = [
  cep => fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`).then(response => {
    if (!response.ok) throw new Error('CEP não encontrado');
    return response.json();
  }).then(data => ({ endereco: data.street, bairro: data.neighborhood, cidade: data.city, estado: data.state })),
  cep => fetch(`https://viacep.com.br/ws/${cep}/json/`).then(response => {
    if (!response.ok) throw new Error('CEP não encontrado');
    return response.json();
  }).then(data => {
    if (data.erro) throw new Error('CEP não encontrado');
    return { endereco: data.logradouro, bairro: data.bairro, cidade: data.localidade, estado: data.uf };
  })
];

export async function findAddressByCep(value) {
  const cep = unmask(value);
  if (cep.length !== 8) throw new Error('Informe um CEP com 8 dígitos');
  let lastError;
  for (const provider of providers) {
    try {
      return await provider(cep);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('Serviço de CEP indisponível');
}
