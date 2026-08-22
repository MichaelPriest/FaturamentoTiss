const normalize = data => ({
  endereco: data.logradouro || data.street || '',
  bairro: data.bairro || data.neighborhood || '',
  cidade: data.localidade || data.city || '',
  estado: data.uf || data.state || ''
});

export async function consultarCEP(value, { signal } = {}) {
  const cep = String(value || '').replace(/\D/g, '');
  if (cep.length !== 8) throw new Error('Informe um CEP com 8 dígitos');
  const providers = [
    `https://brasilapi.com.br/api/cep/v1/${cep}`,
    `https://viacep.com.br/ws/${cep}/json/`
  ];
  let lastError;
  for (const url of providers) {
    try {
      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error('CEP não encontrado');
      const data = await response.json();
      if (data.erro) throw new Error('CEP não encontrado');
      return normalize(data);
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      lastError = error;
    }
  }
  throw lastError || new Error('Não foi possível consultar o CEP');
}
