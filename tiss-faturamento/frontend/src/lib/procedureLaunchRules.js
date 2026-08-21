export function resolveProcedureValue(item = {}, convenio = {}) {
  const valorBase = Number(item.valor_convenio ?? item.valor_sugerido ?? 0);
  const multiplicador = Number(convenio?.multiplicador ?? 1);
  return valorBase * multiplicador;
}

export function getAuthorizationBalance(authorizedItem, restoredQuantity = 0) {
  if (!authorizedItem) return null;
  return Number(authorizedItem.quantidade_autorizada ?? 0)
    - Number(authorizedItem.quantidade_utilizada ?? 0)
    + Number(restoredQuantity ?? 0);
}

export function validateAuthorizedQuantity({ authorizedItem, quantity, restoredQuantity = 0 }) {
  const normalizedQuantity = Number(quantity);
  if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
    return { pode: false, mensagem: 'Informe uma quantidade maior que zero.', pendente: false, saldo: 0 };
  }

  if (!authorizedItem) {
    return {
      pode: true,
      mensagem: 'Este procedimento não está autorizado. Será marcado como pendente.',
      pendente: true,
      saldo: null
    };
  }

  const saldo = getAuthorizationBalance(authorizedItem, restoredQuantity);
  if (normalizedQuantity > saldo) {
    return {
      pode: false,
      mensagem: `Quantidade excede o saldo autorizado! Saldo disponível: ${saldo}`,
      pendente: false,
      saldo
    };
  }

  return { pode: true, mensagem: '', pendente: false, saldo };
}

export function validateExecutionPeriod({ dataExecucao, horaInicial, horaFinal }) {
  if (!dataExecucao) return 'Informe a data de execução.';
  if (horaInicial && horaFinal && horaFinal < horaInicial) {
    return 'A hora final não pode ser anterior à hora inicial.';
  }
  return '';
}

export function normalizeProcedureSearch(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
