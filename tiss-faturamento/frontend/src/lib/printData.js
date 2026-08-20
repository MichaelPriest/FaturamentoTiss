export function buildContractorData({ unidade = {}, configuracao = {}, atendimento = {}, convenio = {} } = {}) {
  return {
    nome_empresa: unidade.nome || configuracao.nome_empresa || configuracao.razao_social || atendimento.nome_contratado || '',
    nome_contratado: unidade.nome || configuracao.nome_contratado || configuracao.nome_empresa || atendimento.nome_contratado || '',
    cnpj: unidade.cnpj || configuracao.cnpj || atendimento.cnpj_contratado || '',
    cnes: unidade.cnes || configuracao.cnes || atendimento.cnes || convenio.cnes || '',
    endereco: unidade.endereco || configuracao.endereco || '',
    cidade: unidade.cidade || configuracao.cidade || '',
    uf: unidade.uf || configuracao.uf || '',
    telefone: unidade.telefone || configuracao.telefone || '',
    email: unidade.email || configuracao.email || ''
  };
}

export function paginateTissGuideItems(itens = [], itensAutorizados = [], pageSize = 5) {
  const safePageSize = Math.max(1, Number(pageSize) || 5);
  const totalItens = Math.max(itens.length, itensAutorizados.length, 1);
  const paginas = [];
  for (let index = 0; index < totalItens; index += safePageSize) {
    paginas.push({
      itens: itens.slice(index, index + safePageSize),
      itensAutorizados: itensAutorizados.slice(index, index + safePageSize),
      inicio: index + 1,
      fim: Math.min(index + safePageSize, totalItens)
    });
  }
  return paginas;
}
