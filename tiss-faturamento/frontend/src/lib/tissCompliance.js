export const SUPPORTED_TISS_VERSIONS = Object.freeze(['4.01.00','4.02.00','4.03.00']);
export const DEFAULT_TISS_VERSION = '4.03.00';

export function normalizeTissVersion(value) {
  const version = String(value || '').trim();
  if (!/^\d+\.\d{2}\.\d{2}$/.test(version)) return null;
  return version;
}

export function resolveTissVersion({ explicitVersion, convenio, config } = {}) {
  const resolved = normalizeTissVersion(explicitVersion)
    || normalizeTissVersion(convenio?.versao_tiss)
    || normalizeTissVersion(config?.versao_tiss)
    || DEFAULT_TISS_VERSION;
  if (!SUPPORTED_TISS_VERSIONS.includes(resolved)) throw new Error(`Versão TISS ${resolved} ainda não homologada pelo sistema.`);
  return resolved;
}

export function validateTissTransmissionContext({ version, registroANS, codigoPrestador, numeroCarteira, procedimentos = [] } = {}) {
  const errors = [];
  if (!normalizeTissVersion(version) || !SUPPORTED_TISS_VERSIONS.includes(version)) errors.push('Versão TISS inválida ou não homologada.');
  if (!String(registroANS || '').trim()) errors.push('Registro ANS é obrigatório.');
  if (!String(codigoPrestador || '').trim()) errors.push('Código do prestador é obrigatório.');
  if (!String(numeroCarteira || '').trim()) errors.push('Carteira do beneficiário é obrigatória.');
  if (!procedimentos.length) errors.push('Informe ao menos um procedimento.');
  if (procedimentos.some(item => !String(item.codigo || item.codigo_procedimento || '').trim())) errors.push('Todos os procedimentos devem possuir código.');
  return errors;
}
