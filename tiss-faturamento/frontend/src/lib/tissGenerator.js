import CryptoJS from 'crypto-js';

// ============================================
// VERSÕES SUPORTADAS DO PADRÃO TISS
// ============================================
export const VERSAO_TISS = {
  '4.01.00': '4.01.00',
  '4.02.00': '4.02.00',
  '4.03.00': '4.03.00'
};

let configGlobal = null;
let versaoAtual = VERSAO_TISS['4.03.00'];
let sequencialTransacaoGlobal = 1;

export function setConfig(config) { configGlobal = config; }
export function getConfig() {
  if (!configGlobal) {
    const stored = localStorage.getItem('config_sistema');
    if (stored) configGlobal = JSON.parse(stored);
  }
  return configGlobal;
}
export function setVersao(versao) {
  if (Object.values(VERSAO_TISS).includes(versao)) versaoAtual = versao;
}
export function getVersao() { return versaoAtual; }
export function getProximoSequencialTransacao() {
  const atual = sequencialTransacaoGlobal;
  sequencialTransacaoGlobal++;
  return atual.toString().padStart(4, '0');
}
export function resetSequencialTransacao() { sequencialTransacaoGlobal = 1; }
export function setSequencialTransacao(valor) { sequencialTransacaoGlobal = valor; }

// ============================================
// TABELAS ANS (domínios completos)
// ============================================
const INDICADOR_ACIDENTE = { '0': '0', '1': '1', '2': '2', '9': '9' };
const TIPO_ATENDIMENTO = { '01': '01', '02': '02', '03': '03', '04': '04', '08': '08', '09': '09', '10': '10', '13': '13', '23': '23' };
const REGIME_ATENDIMENTO = { '01': '01', '02': '02', '03': '03', '04': '04', '05': '05' };
const CARATER_ATENDIMENTO = { '1': '1', '2': '2' };
const TIPO_CONSULTA = { '1': '1', '2': '2', '3': '3', '4': '4' };
const GRAU_PARTICIPACAO = { '00': '00', '01': '01', '02': '02', '03': '03', '04': '04', '05': '05', '06': '06', '07': '07', '12': '12', '13': '13' };
const CODIGO_DESPESA = { '01': '01', '02': '02', '03': '03', '05': '05', '07': '07', '08': '08' };
const COBERTURA_ESPECIAL = { '01': '01', '02': '02', '03': '03' };
const SAUDE_OCUPACIONAL = { '01': '01', '02': '02', '03': '03', '04': '04', '05': '05', '06': '06' };
const MOTIVO_ENCERRAMENTO = {
  '11': '11', '12': '12', '14': '14', '15': '15', '16': '16', '18': '18', '19': '19',
  '21': '21', '22': '22', '23': '23', '24': '24', '25': '25', '26': '26', '27': '27', '28': '28',
  '31': '31', '32': '32', '41': '41', '42': '42', '43': '43', '51': '51', '61': '61', '62': '62',
  '63': '63', '64': '64', '65': '65', '66': '66', '67': '67'
};

const mapaConselhos = {
  'CRM': '06', 'CRO': '08', 'CRF': '03', 'COREN': '02', 'CREFITO': '05', 'CRP': '09',
  'CRBio': '11', 'CRN': '07', 'CREF': '13', 'CRA': '10', 'CRESS': '01', 'CRBM': '12',
  'CRMV': '14', 'CRTR': '15', '06': '06', '08': '08', '03': '03', '02': '02',
  '05': '05', '09': '09', '11': '11', '07': '07', '13': '13', '10': '10', '01': '01',
  '12': '12', '14': '14', '15': '15'
};

const mapaUFs = {
  'RO': '11', 'AC': '12', 'AM': '13', 'RR': '14', 'PA': '15', 'AP': '16', 'TO': '17',
  'MA': '21', 'MT': '51', 'MS': '50', 'MG': '31', 'ES': '32', 'RJ': '33', 'SP': '35',
  'PR': '41', 'SC': '42', 'RS': '43', 'BA': '29', 'SE': '28', 'AL': '27', 'PE': '26',
  'PB': '25', 'RN': '24', 'CE': '23', 'PI': '22', 'GO': '52', 'DF': '53',
  '11': '11', '12': '12', '13': '13', '14': '14', '15': '15', '16': '16', '17': '17',
  '21': '21', '51': '51', '50': '50', '31': '31', '32': '32', '33': '33', '35': '35',
  '41': '41', '42': '42', '43': '43', '29': '29', '28': '28', '27': '27', '26': '26',
  '25': '25', '24': '24', '23': '23', '22': '22', '52': '52', '53': '53'
};

function getCodigoConselho(valor) {
  if (!valor) return '06';
  const codigo = mapaConselhos[valor] || mapaConselhos[valor.toUpperCase()];
  return codigo || '06';
}

function getCodigoUF(uf) {
  if (!uf) return '35';
  const codigo = mapaUFs[uf.toUpperCase()] || mapaUFs[uf];
  return codigo || '35';
}

function getGrauParticipacao(valor) {
  return GRAU_PARTICIPACAO[valor] || '12';
}

function getCodigoDespesa(valor) {
  return CODIGO_DESPESA[valor] || '';
}

function getCoberturaEspecial(valor) {
  return COBERTURA_ESPECIAL[valor] || '';
}

function getSaudeOcupacional(valor) {
  return SAUDE_OCUPACIONAL[valor] || '';
}

function getMotivoEncerramento(valor) {
  return MOTIVO_ENCERRAMENTO[valor] || '';
}

function formatarHora(hora) {
  if (!hora) return '00:00:00';
  if (hora.includes(':')) {
    const partes = hora.split(':');
    const horas = partes[0].padStart(2, '0');
    const minutos = (partes[1] || '00').padStart(2, '0');
    const segundos = (partes[2] || '00').padStart(2, '0');
    return `${horas}:${minutos}:${segundos}`;
  }
  if (hora.length === 6) return `${hora.substring(0,2)}:${hora.substring(2,4)}:${hora.substring(4,6)}`;
  if (hora.length === 4) return `${hora.substring(0,2)}:${hora.substring(2,4)}:00`;
  return '00:00:00';
}

function escapeXML(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, (m) => {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// Nova função para classificar item por tipo de tabela
function getTipoDespesa(tabelaReferencia) {
  switch (tabelaReferencia) {
    case '18': return 'diarias';
    case '19': return 'materiais';
    case '20': return 'medicamentos';
    case '22': return 'procedimentos';
    case '90': return 'pacotes';
    case '98': return 'pacotes';
    default: return 'procedimentos';
  }
}

export function gerarXMLTISS(dados) {
  const config = getConfig();
  const versao = dados.versao || versaoAtual;
  const sequencialTransacao = dados.sequencialTransacao || getProximoSequencialTransacao();
  const dataRegistroTransacao = dados.dataRegistroTransacao || new Date().toISOString().split('T')[0];
  const horaRegistroTransacao = dados.horaRegistroTransacao || new Date().toLocaleTimeString('pt-BR', { hour12: false });
  const codigoPrestadorNaOperadora = dados.codigoPrestadorNaOperadora || '';
  const registroANS = dados.registroANS || '';
  const numeroLote = dados.numeroLote || ('LOTE' + Date.now().toString());
  const guias = dados.guias || [];

  let guiasXML = '';
  for (const guia of guias) {
    guiasXML += gerarGuiaSPSADT(guia, registroANS, config, versao);
  }

  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
  let xml = xmlHeader;
  xml += '<ans:mensagemTISS xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.ans.gov.br/padroes/tiss/schemas tissV4_03_00.xsd">\n';
  xml += '  <ans:cabecalho>\n';
  xml += '    <ans:identificacaoTransacao>\n';
  xml += `      <ans:tipoTransacao>ENVIO_LOTE_GUIAS</ans:tipoTransacao>\n`;
  xml += `      <ans:sequencialTransacao>${sequencialTransacao}</ans:sequencialTransacao>\n`;
  xml += `      <ans:dataRegistroTransacao>${dataRegistroTransacao}</ans:dataRegistroTransacao>\n`;
  xml += `      <ans:horaRegistroTransacao>${horaRegistroTransacao}</ans:horaRegistroTransacao>\n`;
  xml += '    </ans:identificacaoTransacao>\n';
  xml += '    <ans:origem>\n';
  xml += '      <ans:identificacaoPrestador>\n';
  xml += `        <ans:codigoPrestadorNaOperadora>${escapeXML(codigoPrestadorNaOperadora)}</ans:codigoPrestadorNaOperadora>\n`;
  xml += '      </ans:identificacaoPrestador>\n';
  xml += '    </ans:origem>\n';
  xml += '    <ans:destino>\n';
  xml += `      <ans:registroANS>${escapeXML(registroANS)}</ans:registroANS>\n`;
  xml += '    </ans:destino>\n';
  xml += `    <ans:Padrao>${versao}</ans:Padrao>\n`;
  xml += '  </ans:cabecalho>\n';
  xml += '  <ans:prestadorParaOperadora>\n';
  xml += '    <ans:loteGuias>\n';
  xml += `      <ans:numeroLote>${escapeXML(numeroLote)}</ans:numeroLote>\n`;
  xml += '      <ans:guiasTISS>\n';
  xml += guiasXML;
  xml += '      </ans:guiasTISS>\n';
  xml += '    </ans:loteGuias>\n';
  xml += '  </ans:prestadorParaOperadora>\n';
  xml += '  <ans:epilogo>\n';
  xml += '    <ans:hash>HASH_TEMP</ans:hash>\n';
  xml += '  </ans:epilogo>\n';
  xml += '</ans:mensagemTISS>';

  const xmlSemHash = xml.replace('HASH_TEMP', '');
  const hash = CryptoJS.MD5(xmlSemHash).toString().toUpperCase();
  xml = xml.replace('HASH_TEMP', hash);

  return xml;
}

function gerarGuiaSPSADT(guia, registroANS, config, versao) {
  const numeroCarteira = guia.numeroCarteira || '000000000';
  const nomeBeneficiario = guia.nomeBeneficiario || 'BENEFICIARIO';
  const dataSolicitacao = guia.dataSolicitacao || new Date().toISOString().split('T')[0];
  const numeroGuiaPrestador = guia.numero_guia_prestador || ('G' + Date.now().toString());
  const numeroGuiaOperadora = guia.numero_guia_operadora || '';
  const dataAutorizacao = guia.data_autorizacao || dataSolicitacao;
  const senha = guia.senha_autorizacao || '';
  const dataValidadeSenha = guia.data_validade_senha || '';
  const codigoPrestadorExecutante = guia.codigoPrestadorExecutante || '';
  const nomeProfissionalSolicitante = guia.nomeProfissionalSolicitante || 'PROFISSIONAL';
  const numeroConselhoProfissionalSolicitante = guia.numeroConselhoProfissionalSolicitante || '00000';
  const itens = guia.itens || [];

  const caraterAtendimento = CARATER_ATENDIMENTO[guia.carater_atendimento] || '1';
  const tipoAtendimento = TIPO_ATENDIMENTO[guia.tipo_atendimento] || '04';
  const indicacaoAcidente = INDICADOR_ACIDENTE[guia.indicacao_acidente] || '9';
  const tipoConsulta = TIPO_CONSULTA[guia.tipo_consulta] || '1';
  const regimeAtendimento = REGIME_ATENDIMENTO[guia.regime_atendimento] || '01';
  const coberturaEspecial = getCoberturaEspecial(guia.cobertura_especial);
  const saudeOcupacional = getSaudeOcupacional(guia.saude_ocupacional);
  const indicacaoClinica = guia.indicacao_clinica || '';
  const motivoEncerramento = getMotivoEncerramento(guia.motivo_encerramento);

  const cnpjContratado = (config?.cnpj || '20384928000205').replace(/\D/g, '');
  const nomeContratadoSolicitante = (config?.nome_contratado || 'CLINICA NAO CONFIGURADA').toUpperCase();
  const cnesExecutante = config?.cnes || '0000000';
  const conselhoClinica = getCodigoConselho(config?.conselho_clinica || '06');
  const ufClinica = getCodigoUF(config?.uf_clinica || 'SP');
  const cbosClinica = config?.cbos_clinica || '225125';

  let procedimentosXML = '';
  let totalProcedimentos = 0;
  let totalMateriais = 0;
  let totalMedicamentos = 0;
  let totalDiarias = 0;
  let totalTaxas = 0;
  let totalOPME = 0;
  let totalGases = 0;

  for (let idx = 0; idx < itens.length; idx++) {
    const item = itens[idx];
    const sequencialItem = (idx + 1).toString();
    const dataExecucao = item.data_execucao || dataSolicitacao;
    const horaInicial = formatarHora(item.hora_inicial || '08:00');
    const horaFinal = formatarHora(item.hora_final || '09:00');

    const codigoProcedimento = item.codigo || item.codigo_procedimento || '00000000';
    const nomeProcedimento = item.nome || item.nome_procedimento || 'PROCEDIMENTO';
    const tabelaReferencia = item.tabela_referencia || '22';
    const quantidade = Number(item.quantidade || 1);
    const valorUnitario = Number(item.valor_unitario || 0);
    const valorTotal = quantidade * valorUnitario;

    const prestadorNome = item.prestador_nome || item.nome_profissional || 'PROFISSIONAL';
    const prestadorConselho = getCodigoConselho(item.prestador_conselho || item.conselho || '06');
    const prestadorNumeroConselho = item.prestador_numero_conselho || item.numero_conselho || '00000';
    const prestadorUF = getCodigoUF(item.prestador_uf_conselho || item.uf_conselho || 'SP');
    const prestadorCBOS = item.prestador_cbos || item.cbos || '225125';
    const prestadorCPF = (item.prestador_cpf || item.cpf || '00000000000').replace(/\D/g, '').slice(0,11);
    const grauParticipacao = getGrauParticipacao(item.grau_participacao || '12');
    const viaAcesso = item.viaAcesso || '1';
    const tecnicaUtilizada = item.tecnicaUtilizada || '1';
    const reducaoAcrescimo = '1.00';
    const codigoDespesa = getCodigoDespesa(item.codigo_despesa);

    // Acumular totais por tipo de despesa
    const tipo = getTipoDespesa(tabelaReferencia);
    switch (tipo) {
      case 'materiais': totalMateriais += valorTotal; break;
      case 'medicamentos': totalMedicamentos += valorTotal; break;
      case 'diarias': totalDiarias += valorTotal; break;
      case 'pacotes': totalTaxas += valorTotal; break;
      default: totalProcedimentos += valorTotal;
    }
    if (tabelaReferencia === '08') totalOPME += valorTotal;
    if (tabelaReferencia === '18' && codigoDespesa === '01') totalGases += valorTotal;

    procedimentosXML += '            <ans:procedimentoExecutado>\n';
    procedimentosXML += `              <ans:sequencialItem>${sequencialItem}</ans:sequencialItem>\n`;
    procedimentosXML += `              <ans:dataExecucao>${dataExecucao}</ans:dataExecucao>\n`;
    procedimentosXML += `              <ans:horaInicial>${horaInicial}</ans:horaInicial>\n`;
    procedimentosXML += `              <ans:horaFinal>${horaFinal}</ans:horaFinal>\n`;
    procedimentosXML += '              <ans:procedimento>\n';
    procedimentosXML += `                <ans:codigoTabela>${escapeXML(tabelaReferencia)}</ans:codigoTabela>\n`;
    procedimentosXML += `                <ans:codigoProcedimento>${escapeXML(codigoProcedimento)}</ans:codigoProcedimento>\n`;
    procedimentosXML += `                <ans:descricaoProcedimento>${escapeXML(nomeProcedimento)}</ans:descricaoProcedimento>\n`;
    procedimentosXML += '              </ans:procedimento>\n';
    procedimentosXML += `              <ans:quantidadeExecutada>${quantidade}</ans:quantidadeExecutada>\n`;
    procedimentosXML += `              <ans:viaAcesso>${viaAcesso}</ans:viaAcesso>\n`;
    procedimentosXML += `              <ans:tecnicaUtilizada>${tecnicaUtilizada}</ans:tecnicaUtilizada>\n`;
    procedimentosXML += `              <ans:reducaoAcrescimo>${reducaoAcrescimo}</ans:reducaoAcrescimo>\n`;
    procedimentosXML += `              <ans:valorUnitario>${valorUnitario.toFixed(2)}</ans:valorUnitario>\n`;
    procedimentosXML += `              <ans:valorTotal>${valorTotal.toFixed(2)}</ans:valorTotal>\n`;
    if (codigoDespesa) {
      procedimentosXML += `              <ans:codigoDespesa>${codigoDespesa}</ans:codigoDespesa>\n`;
    }
    procedimentosXML += '              <ans:equipeSadt>\n';
    procedimentosXML += `                <ans:grauPart>${grauParticipacao}</ans:grauPart>\n`;
    procedimentosXML += '                <ans:codProfissional>\n';
    procedimentosXML += `                  <ans:cpfContratado>${prestadorCPF}</ans:cpfContratado>\n`;
    procedimentosXML += '                </ans:codProfissional>\n';
    procedimentosXML += `                <ans:nomeProf>${escapeXML(prestadorNome)}</ans:nomeProf>\n`;
    procedimentosXML += `                <ans:conselho>${prestadorConselho}</ans:conselho>\n`;
    procedimentosXML += `                <ans:numeroConselhoProfissional>${prestadorNumeroConselho}</ans:numeroConselhoProfissional>\n`;
    procedimentosXML += `                <ans:UF>${prestadorUF}</ans:UF>\n`;
    procedimentosXML += `                <ans:CBOS>${prestadorCBOS}</ans:CBOS>\n`;
    procedimentosXML += '              </ans:equipeSadt>\n';
    procedimentosXML += '            </ans:procedimentoExecutado>\n';
  }

  const valorTotalGeral = totalProcedimentos + totalMateriais + totalMedicamentos + totalDiarias + totalTaxas + totalOPME + totalGases;

  let guiaXML = '        <ans:guiaSP-SADT>\n';
  guiaXML += '          <ans:cabecalhoGuia>\n';
  guiaXML += `            <ans:registroANS>${escapeXML(registroANS)}</ans:registroANS>\n`;
  guiaXML += `            <ans:numeroGuiaPrestador>${escapeXML(numeroGuiaPrestador)}</ans:numeroGuiaPrestador>\n`;
  guiaXML += '          </ans:cabecalhoGuia>\n';

  if (numeroGuiaOperadora || dataAutorizacao || senha) {
    guiaXML += '          <ans:dadosAutorizacao>\n';
    if (numeroGuiaOperadora) guiaXML += `            <ans:numeroGuiaOperadora>${escapeXML(numeroGuiaOperadora)}</ans:numeroGuiaOperadora>\n`;
    guiaXML += `            <ans:dataAutorizacao>${dataAutorizacao}</ans:dataAutorizacao>\n`;
    if (senha) guiaXML += `            <ans:senha>${escapeXML(senha)}</ans:senha>\n`;
    if (dataValidadeSenha) guiaXML += `            <ans:dataValidadeSenha>${dataValidadeSenha}</ans:dataValidadeSenha>\n`;
    guiaXML += '          </ans:dadosAutorizacao>\n';
  }

  guiaXML += '          <ans:dadosBeneficiario>\n';
  guiaXML += `            <ans:numeroCarteira>${escapeXML(numeroCarteira)}</ans:numeroCarteira>\n`;
  guiaXML += '            <ans:atendimentoRN>N</ans:atendimentoRN>\n';
  guiaXML += `            <ans:nomeBeneficiario>${escapeXML(nomeBeneficiario)}</ans:nomeBeneficiario>\n`;
  guiaXML += '          </ans:dadosBeneficiario>\n';

  guiaXML += '          <ans:dadosSolicitante>\n';
  guiaXML += '            <ans:contratadoSolicitante>\n';
  guiaXML += `              <ans:cnpjContratado>${cnpjContratado}</ans:cnpjContratado>\n`;
  guiaXML += '            </ans:contratadoSolicitante>\n';
  guiaXML += `            <ans:nomeContratadoSolicitante>${escapeXML(nomeContratadoSolicitante)}</ans:nomeContratadoSolicitante>\n`;
  guiaXML += '            <ans:profissionalSolicitante>\n';
  guiaXML += `              <ans:nomeProfissional>${escapeXML(nomeProfissionalSolicitante)}</ans:nomeProfissional>\n`;
  guiaXML += `              <ans:conselhoProfissional>${conselhoClinica}</ans:conselhoProfissional>\n`;
  guiaXML += `              <ans:numeroConselhoProfissional>${escapeXML(numeroConselhoProfissionalSolicitante)}</ans:numeroConselhoProfissional>\n`;
  guiaXML += `              <ans:UF>${ufClinica}</ans:UF>\n`;
  guiaXML += `              <ans:CBOS>${cbosClinica}</ans:CBOS>\n`;
  guiaXML += '            </ans:profissionalSolicitante>\n';
  guiaXML += '          </ans:dadosSolicitante>\n';

  guiaXML += '          <ans:dadosSolicitacao>\n';
  guiaXML += `            <ans:dataSolicitacao>${dataSolicitacao}</ans:dataSolicitacao>\n`;
  guiaXML += `            <ans:caraterAtendimento>${caraterAtendimento}</ans:caraterAtendimento>\n`;
  if (indicacaoClinica) guiaXML += `            <ans:indicacaoClinica>${escapeXML(indicacaoClinica)}</ans:indicacaoClinica>\n`;
  guiaXML += '          </ans:dadosSolicitacao>\n';

  guiaXML += '          <ans:dadosExecutante>\n';
  guiaXML += '            <ans:contratadoExecutante>\n';
  guiaXML += `              <ans:codigoPrestadorNaOperadora>${escapeXML(codigoPrestadorExecutante)}</ans:codigoPrestadorNaOperadora>\n`;
  guiaXML += '            </ans:contratadoExecutante>\n';
  guiaXML += `            <ans:CNES>${cnesExecutante}</ans:CNES>\n`;
  guiaXML += '          </ans:dadosExecutante>\n';

  guiaXML += '          <ans:dadosAtendimento>\n';
  guiaXML += `            <ans:tipoAtendimento>${tipoAtendimento}</ans:tipoAtendimento>\n`;
  guiaXML += `            <ans:indicacaoAcidente>${indicacaoAcidente}</ans:indicacaoAcidente>\n`;
  guiaXML += `            <ans:tipoConsulta>${tipoConsulta}</ans:tipoConsulta>\n`;
  if (coberturaEspecial) guiaXML += `            <ans:coberturaEspecial>${coberturaEspecial}</ans:coberturaEspecial>\n`;
  if (motivoEncerramento) guiaXML += `            <ans:motivoEncerramento>${motivoEncerramento}</ans:motivoEncerramento>\n`;
  guiaXML += `            <ans:regimeAtendimento>${regimeAtendimento}</ans:regimeAtendimento>\n`;
  if (saudeOcupacional) guiaXML += `            <ans:saudeOcupacional>${saudeOcupacional}</ans:saudeOcupacional>\n`;
  guiaXML += '          </ans:dadosAtendimento>\n';

  guiaXML += '          <ans:procedimentosExecutados>\n';
  guiaXML += procedimentosXML;
  guiaXML += '          </ans:procedimentosExecutados>\n';

  guiaXML += '          <ans:valorTotal>\n';
  guiaXML += `            <ans:valorProcedimentos>${totalProcedimentos.toFixed(2)}</ans:valorProcedimentos>\n`;
  if (totalMateriais > 0) guiaXML += `            <ans:valorMateriaisOPME>${totalMateriais.toFixed(2)}</ans:valorMateriaisOPME>\n`;
  if (totalMedicamentos > 0) guiaXML += `            <ans:valorMedicamentos>${totalMedicamentos.toFixed(2)}</ans:valorMedicamentos>\n`;
  if (totalDiarias > 0) guiaXML += `            <ans:valorDiarias>${totalDiarias.toFixed(2)}</ans:valorDiarias>\n`;
  if (totalTaxas > 0) guiaXML += `            <ans:valorTaxas>${totalTaxas.toFixed(2)}</ans:valorTaxas>\n`;
  if (totalOPME > 0) guiaXML += `            <ans:valorOPME>${totalOPME.toFixed(2)}</ans:valorOPME>\n`;
  if (totalGases > 0) guiaXML += `            <ans:valorGasesMedicinais>${totalGases.toFixed(2)}</ans:valorGasesMedicinais>\n`;
  guiaXML += `            <ans:valorTotalGeral>${valorTotalGeral.toFixed(2)}</ans:valorTotalGeral>\n`;
  guiaXML += '          </ans:valorTotal>\n';

  guiaXML += '        </ans:guiaSP-SADT>\n';
  return guiaXML;
}

export function converterAtendimentoParaTISS(atendimento, convenio) {
  const config = getConfig();
  const numeroCarteira = atendimento.numero_carteira || '000000000';
  const primeiroItem = atendimento.itens?.[0] || null;

  const itensConvertidos = (atendimento.itens || []).map(item => ({
    codigo: item.codigo || item.codigo_procedimento || '00000000',
    nome: item.nome || item.nome_procedimento || 'PROCEDIMENTO',
    quantidade: item.quantidade || 1,
    valor_unitario: parseFloat(item.valor_unitario || 0),
    valor_total: parseFloat(item.valor_total || 0),
    data_execucao: item.data_execucao || atendimento.data_atendimento,
    hora_inicial: item.hora_inicial || '00:00:00',
    hora_final: item.hora_final || '00:00:00',
    tabela_referencia: item.tabela_referencia || '22',
    prestador_nome: item.prestador_nome || 'PROFISSIONAL',
    prestador_cpf: (item.prestador_cpf || '00000000000').replace(/\D/g, ''),
    prestador_conselho: item.prestador_conselho || 'CRM',
    prestador_numero_conselho: item.prestador_numero_conselho || '00000',
    prestador_uf_conselho: item.prestador_uf_conselho || 'SP',
    prestador_cbos: item.prestador_cbos || '225125',
    grau_participacao: item.grau_participacao || '12',
    codigo_despesa: getCodigoDespesa(item.codigo_despesa)
  }));

  return {
    codigoPrestadorExecutante: convenio?.codigo_prestador || config?.codigo_prestador || '002535718',
    numeroCarteira,
    nomeBeneficiario: atendimento.paciente_nome || 'PACIENTE',
    numero_guia_operadora: atendimento.numero_guia_operadora || '',
    data_autorizacao: atendimento.data_autorizacao || '',
    data_validade_senha: atendimento.data_validade_senha || '',
    senha_autorizacao: atendimento.senha_autorizacao || '',
    dataSolicitacao: atendimento.data_solicitacao || atendimento.data_atendimento || new Date().toISOString().split('T')[0],
    numero_guia_prestador: atendimento.numero_guia_prestador || ('G' + Date.now().toString()),
    nomeProfissionalSolicitante: atendimento.profissional_solicitante || primeiroItem?.prestador_nome || 'PROFISSIONAL',
    numeroConselhoProfissionalSolicitante: atendimento.numero_conselho_solicitante || primeiroItem?.prestador_numero_conselho || '00000',
    carater_atendimento: CARATER_ATENDIMENTO[atendimento.carater_atendimento] || '1',
    tipo_atendimento: TIPO_ATENDIMENTO[atendimento.tipo_atendimento] || '04',
    indicacao_acidente: INDICADOR_ACIDENTE[atendimento.indicacao_acidente] || '9',
    tipo_consulta: TIPO_CONSULTA[atendimento.tipo_consulta] || '1',
    regime_atendimento: REGIME_ATENDIMENTO[atendimento.regime_atendimento] || '01',
    cobertura_especial: getCoberturaEspecial(atendimento.cobertura_especial),
    saude_ocupacional: getSaudeOcupacional(atendimento.saude_ocupacional),
    itens: itensConvertidos
  };
}

export function gerarXMLExemplo(versao) {
  const versaoFinal = versao || '4.03.00';
  const dataAtual = new Date().toISOString().split('T')[0];
  const config = getConfig();
  const guias = [{
    numero_guia_prestador: 'G' + Date.now().toString(),
    numeroCarteira: '09700020008288318',
    nomeBeneficiario: 'PACIENTE EXEMPLO',
    nomeProfissionalSolicitante: 'PROFISSIONAL EXEMPLO',
    numeroConselhoProfissionalSolicitante: '12345',
    dataSolicitacao: dataAtual,
    codigoPrestadorExecutante: config?.codigo_prestador || '002535718',
    carater_atendimento: '1',
    tipo_atendimento: '04',
    indicacao_acidente: '9',
    tipo_consulta: '1',
    regime_atendimento: '01',
    itens: [{
      codigo: '01010101',
      nome: 'CONSULTA MÉDICA',
      quantidade: 1,
      valor_unitario: 150.00,
      valor_total: 150.00,
      prestador_nome: 'PROFISSIONAL EXEMPLO',
      prestador_numero_conselho: '12345',
      tabela_referencia: '22',
      grau_participacao: '12',
      data_execucao: dataAtual
    }]
  }];
  return gerarXMLTISS({
    versao: versaoFinal,
    codigoPrestadorNaOperadora: config?.codigo_prestador || '20.384.928/0002-05',
    registroANS: config?.registro_ans || '421928',
    numeroLote: 'LOTE' + Date.now().toString(),
    guias
  });
}
