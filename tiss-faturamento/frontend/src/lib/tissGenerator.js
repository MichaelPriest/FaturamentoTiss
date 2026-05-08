import CryptoJS from 'crypto-js';
import { supabase } from './supabaseClient';

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

// ============================================
// FUNÇÕES DE CONFIGURAÇÃO (BUSCA DO SUPABASE)
// ============================================
export async function carregarConfigDoBanco() {
  try {
    const { data, error } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'config_sistema')
      .single();
    
    if (error) throw error;
    if (data && data.valor) {
      configGlobal = typeof data.valor === 'string' ? JSON.parse(data.valor) : data.valor;
      console.log('✅ Configuração carregada do banco:', configGlobal);
    }
    return configGlobal;
  } catch (error) {
    console.error('Erro ao carregar configuração do banco:', error);
    return null;
  }
}

export async function setConfigFromDB() {
  return await carregarConfigDoBanco();
}

export function setConfig(config) { 
  configGlobal = config; 
}

export function getConfig() {
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
// TABELAS ANS (DOMÍNIOS)
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
const UNIDADE_MEDIDA = {
  '001': '001', '002': '002', '003': '003', '004': '004', '005': '005', '006': '006',
  '007': '007', '008': '008', '009': '009', '010': '010', '011': '011', '012': '012',
  '013': '013', '014': '014', '015': '015', '016': '016', '017': '017', '018': '018',
  '019': '019', '020': '020', '021': '021', '022': '022', '023': '023', '024': '024',
  '025': '025', '026': '026', '027': '027', '028': '028', '029': '029', '030': '030',
  '031': '031', '032': '032', '033': '033', '034': '034', '035': '035', '036': '036',
  '037': '037', '038': '038', '039': '039', '040': '040', '041': '041', '042': '042',
  '043': '043', '044': '044', '045': '045', '046': '046', '047': '047', '048': '048',
  '049': '049', '050': '050', '051': '051', '052': '052', '053': '053', '054': '054',
  '055': '055', '056': '056', '057': '057', '058': '058', '059': '059', '060': '060', '061': '061'
};

const TABELA_DESPESA = {
  '18': 'diaria_gas',
  '19': 'material',
  '20': 'medicamento',
  '05': 'procedimento',
  '12': 'procedimento',
  '22': 'procedimento',
  '00': 'procedimento',
  '98': 'procedimento'
};

const BRADESCO_ANS = ['005711', '421715'];

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

function getGrauParticipacao(valor, registroANS) {
  if (registroANS && BRADESCO_ANS.includes(registroANS)) {
    return '00';
  }
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

function getUnidadeMedida(valor) {
  return UNIDADE_MEDIDA[valor] || '036';
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

function limitarDescricao(descricao, maxLength = 150) {
  if (!descricao) return '';
  if (descricao.length <= maxLength) return descricao;
  return descricao.substring(0, maxLength).trim();
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

// ============================================
// GERAÇÃO DO XML PRINCIPAL COM HASH SHA-1
// ============================================
export async function gerarXMLTISS(dados) {
  // Carregar configuração do banco se não estiver na memória
  if (!configGlobal) {
    await carregarConfigDoBanco();
  }
  
  const config = getConfig();
  const versao = dados.versao || versaoAtual;
  const sequencialTransacao = dados.sequencialTransacao || getProximoSequencialTransacao();
  const dataRegistroTransacao = dados.dataRegistroTransacao || new Date().toISOString().split('T')[0];
  const horaRegistroTransacao = dados.horaRegistroTransacao || new Date().toLocaleTimeString('pt-BR', { hour12: false });
  const registroANS = dados.registroANS || '';
  const numeroLote = dados.numeroLote || ('LOTE' + Date.now().toString());
  const guias = dados.guias || [];

  let cnpjPrestador = (config?.cnpj || dados.cnpjPrestador || '').replace(/\D/g, '');
  if (cnpjPrestador && cnpjPrestador.length < 14) cnpjPrestador = cnpjPrestador.padStart(14, '0');

  let guiasXML = '';
  for (const guia of guias) {
    guiasXML += gerarGuiaSPSADT(guia, registroANS, config, versao);
  }

  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
  let xmlComHashVazio = xmlHeader;
  xmlComHashVazio += '<ans:mensagemTISS xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.ans.gov.br/padroes/tiss/schemas tissV4_03_00.xsd">\n';
  xmlComHashVazio += '  <ans:cabecalho>\n';
  xmlComHashVazio += '    <ans:identificacaoTransacao>\n';
  xmlComHashVazio += `      <ans:tipoTransacao>ENVIO_LOTE_GUIAS</ans:tipoTransacao>\n`;
  xmlComHashVazio += `      <ans:sequencialTransacao>${sequencialTransacao}</ans:sequencialTransacao>\n`;
  xmlComHashVazio += `      <ans:dataRegistroTransacao>${dataRegistroTransacao}</ans:dataRegistroTransacao>\n`;
  xmlComHashVazio += `      <ans:horaRegistroTransacao>${horaRegistroTransacao}</ans:horaRegistroTransacao>\n`;
  xmlComHashVazio += '    </ans:identificacaoTransacao>\n';
  xmlComHashVazio += '    <ans:origem>\n';
  xmlComHashVazio += '      <ans:identificacaoPrestador>\n';
  if (dados.codigoPrestadorNaOperadora) {
    xmlComHashVazio += `        <ans:codigoPrestadorNaOperadora>${escapeXML(dados.codigoPrestadorNaOperadora)}</ans:codigoPrestadorNaOperadora>\n`;
  } else if (cnpjPrestador) {
    xmlComHashVazio += `        <ans:CNPJ>${cnpjPrestador}</ans:CNPJ>\n`;
  } else {
    xmlComHashVazio += `        <ans:CNPJ>00000000000000</ans:CNPJ>\n`;
  }
  xmlComHashVazio += '      </ans:identificacaoPrestador>\n';
  xmlComHashVazio += '    </ans:origem>\n';
  xmlComHashVazio += '    <ans:destino>\n';
  xmlComHashVazio += `      <ans:registroANS>${escapeXML(registroANS)}</ans:registroANS>\n`;
  xmlComHashVazio += '    </ans:destino>\n';
  xmlComHashVazio += `    <ans:Padrao>${versao}</ans:Padrao>\n`;
  xmlComHashVazio += '  </ans:cabecalho>\n';
  xmlComHashVazio += '  <ans:prestadorParaOperadora>\n';
  xmlComHashVazio += '    <ans:loteGuias>\n';
  xmlComHashVazio += `      <ans:numeroLote>${escapeXML(numeroLote)}</ans:numeroLote>\n`;
  xmlComHashVazio += '      <ans:guiasTISS>\n';
  xmlComHashVazio += guiasXML;
  xmlComHashVazio += '      </ans:guiasTISS>\n';
  xmlComHashVazio += '    </ans:loteGuias>\n';
  xmlComHashVazio += '  </ans:prestadorParaOperadora>\n';
  xmlComHashVazio += '  <ans:epilogo>\n';
  xmlComHashVazio += '    <ans:hash></ans:hash>\n';
  xmlComHashVazio += '  </ans:epilogo>\n';
  xmlComHashVazio += '</ans:mensagemTISS>';

  // Calcular SHA-1
  let xmlParaHash = xmlComHashVazio
    .replace(/\n/g, '')
    .replace(/\r/g, '')
    .replace(/>\s+</g, '><');
  
  xmlParaHash = xmlParaHash
    .replace(/xmlns:ans="[^"]*"/g, '')
    .replace(/xmlns:xsi="[^"]*"/g, '')
    .replace(/xsi:schemaLocation="[^"]*"/g, '');
  
  xmlParaHash = xmlParaHash.replace('<ans:hash></ans:hash>', '');
  xmlParaHash = xmlParaHash.replace(/ans:/g, '');
  
  const hash = CryptoJS.SHA1(xmlParaHash).toString().toUpperCase();

  const xmlFinal = xmlComHashVazio.replace('<ans:hash></ans:hash>', `<ans:hash>${hash}</ans:hash>`);

  return xmlFinal;
}

// ============================================
// GERAÇÃO DA GUIA SP-SADT
// ============================================
function gerarGuiaSPSADT(guia, registroANS, config, versao) {
  const numeroCarteira = guia.numeroCarteira || '000000000';
  const dataSolicitacao = guia.dataSolicitacao || new Date().toISOString().split('T')[0];
  const numeroGuiaPrestador = guia.numero_guia_prestador || ('G' + Date.now().toString());
  const numeroGuiaOperadora = guia.numero_guia_operadora || '';
  const guiaPrincipal = guia.guia_principal || '';
  const dataAutorizacao = guia.data_autorizacao || dataSolicitacao;
  const senha = guia.senha_autorizacao || '';
  const dataValidadeSenha = guia.data_validade_senha || '';
  const nomeProfissionalSolicitante = guia.nomeProfissionalSolicitante || 'PROFISSIONAL';
  const numeroConselhoProfissionalSolicitante = guia.numeroConselhoProfissionalSolicitante || '00000';

  const caraterAtendimento = CARATER_ATENDIMENTO[guia.carater_atendimento] || '1';
  const tipoAtendimento = TIPO_ATENDIMENTO[guia.tipo_atendimento] || '04';
  const indicacaoAcidente = INDICADOR_ACIDENTE[guia.indicacao_acidente] || '9';
  const tipoConsulta = TIPO_CONSULTA[guia.tipo_consulta] || '1';
  const regimeAtendimento = REGIME_ATENDIMENTO[guia.regime_atendimento] || '01';
  const coberturaEspecial = getCoberturaEspecial(guia.cobertura_especial);
  const saudeOcupacional = getSaudeOcupacional(guia.saude_ocupacional);
  const indicacaoClinica = guia.indicacao_clinica || '';
  const motivoEncerramento = getMotivoEncerramento(guia.motivo_encerramento);

  // Dados do contratado solicitante (config)
  let cnpjContratado = (config?.cnpj || '20384928000124').replace(/\D/g, '');
  if (cnpjContratado.length < 14) cnpjContratado = cnpjContratado.padStart(14, '0');
  const nomeContratadoSolicitante = (config?.nome_contratado || 'HOSPITAL EXEMPLO').toUpperCase();
  
  // ✅ CORREÇÃO: Buscar CNES da configuração
  let cnesExecutante = '0000000';
  if (config?.cnes) {
    cnesExecutante = String(config.cnes).replace(/\D/g, '').padStart(7, '0').slice(0, 7);
  }
  
  const conselhoClinica = getCodigoConselho(config?.conselho_clinica || '06');
  const ufClinica = getCodigoUF(config?.uf_clinica || 'SP');
  const cbosClinica = config?.cbos_clinica || '225125';

  const codigoExecutante = guia.codigoPrestadorExecutante || '';
  const itens = guia.itens || [];

  const procedimentos = [];
  const outrasDespesas = [];

  for (const item of itens) {
    let tabela = item.tabela_referencia || item.tabela || '22';
    tabela = String(tabela).trim();
    const codDespesa = getCodigoDespesa(item.codigo_despesa);
    const quantidade = Number(item.quantidade || 1);
    const valorUnitario = Number(item.valor_unitario || 0);
    const valorTotal = quantidade * valorUnitario;
    const dataExecucao = item.data_execucao || dataSolicitacao;
    const horaInicial = formatarHora(item.hora_inicial || '00:00:00');
    const horaFinal = formatarHora(item.hora_final || '00:00:00');
    
    const descricaoProcedimento = limitarDescricao(item.nome || item.nome_procedimento || 'PROCEDIMENTO', 150);

    const tipoDespesa = TABELA_DESPESA[tabela];
    const isProcedimento = tipoDespesa === 'procedimento';
    const isDespesa = (tabela === '18' || tabela === '19' || tabela === '20') && codDespesa !== '';

    if (isProcedimento) {
      procedimentos.push({
        dataExecucao,
        horaInicial,
        horaFinal,
        codigoTabela: tabela,
        codigoProcedimento: item.codigo || item.codigo_procedimento || '00000000',
        descricaoProcedimento,
        quantidade,
        viaAcesso: item.viaAcesso || '1',
        tecnicaUtilizada: item.tecnicaUtilizada || '1',
        reducaoAcrescimo: (item.reducao_acrescimo || '1.00').toString(),
        valorUnitario,
        valorTotal,
        grauParticipacao: getGrauParticipacao(item.grau_participacao, registroANS),
        prestadorCPF: (item.prestador_cpf || '00000000000').replace(/\D/g, '').slice(0, 11),
        prestadorNome: item.prestador_nome || item.nome_profissional || 'PROFISSIONAL',
        prestadorConselho: getCodigoConselho(item.prestador_conselho || item.conselho),
        prestadorNumeroConselho: item.prestador_numero_conselho || item.numero_conselho || '00000',
        prestadorUF: getCodigoUF(item.prestador_uf_conselho || item.uf_conselho),
        prestadorCBOS: item.prestador_cbos || item.cbos || '225125'
      });
    } else if (isDespesa) {
      outrasDespesas.push({
        codigoDespesa: codDespesa,
        servico: {
          dataExecucao,
          horaInicial,
          horaFinal,
          codigoTabela: tabela,
          codigoProcedimento: item.codigo || item.codigo_procedimento || '00000000',
          quantidade,
          unidadeMedida: getUnidadeMedida(item.unidade_medida),
          reducaoAcrescimo: (item.reducao_acrescimo || '1.00').toString(),
          valorUnitario,
          valorTotal,
          descricaoProcedimento
        }
      });
    }
  }

  let valorProcedimentos = 0;
  let valorDiarias = 0;
  let valorTaxasAlugueis = 0;
  let valorMateriais = 0;
  let valorMedicamentos = 0;
  let valorOPME = 0;
  let valorGasesMedicinais = 0;

  function acumular(codigoDespesa, valor, tabela) {
    switch (codigoDespesa) {
      case '01':
        if (tabela === '18') valorGasesMedicinais += valor;
        else valorDiarias += valor;
        break;
      case '02': valorMedicamentos += valor; break;
      case '03': valorMateriais += valor; break;
      case '05': valorDiarias += valor; break;
      case '07': valorTaxasAlugueis += valor; break;
      case '08': valorOPME += valor; break;
      default: break;
    }
  }

  for (const proc of procedimentos) {
    valorProcedimentos += proc.valorTotal;
  }
  for (const desp of outrasDespesas) {
    acumular(desp.codigoDespesa, desp.servico.valorTotal, desp.servico.codigoTabela);
  }

  const valorTotalGeral = valorProcedimentos + valorDiarias + valorTaxasAlugueis +
                          valorMateriais + valorMedicamentos + valorOPME + valorGasesMedicinais;

  let sequencialGlobal = 1;

  let procedimentosXML = '';
  for (const proc of procedimentos) {
    procedimentosXML += '            <ans:procedimentoExecutado>\n';
    procedimentosXML += `              <ans:sequencialItem>${sequencialGlobal++}</ans:sequencialItem>\n`;
    procedimentosXML += `              <ans:dataExecucao>${proc.dataExecucao}</ans:dataExecucao>\n`;
    procedimentosXML += `              <ans:horaInicial>${proc.horaInicial}</ans:horaInicial>\n`;
    procedimentosXML += `              <ans:horaFinal>${proc.horaFinal}</ans:horaFinal>\n`;
    procedimentosXML += '              <ans:procedimento>\n';
    procedimentosXML += `                <ans:codigoTabela>${proc.codigoTabela}</ans:codigoTabela>\n`;
    procedimentosXML += `                <ans:codigoProcedimento>${escapeXML(proc.codigoProcedimento)}</ans:codigoProcedimento>\n`;
    procedimentosXML += `                <ans:descricaoProcedimento>${escapeXML(proc.descricaoProcedimento)}</ans:descricaoProcedimento>\n`;
    procedimentosXML += '              </ans:procedimento>\n';
    procedimentosXML += `              <ans:quantidadeExecutada>${proc.quantidade}</ans:quantidadeExecutada>\n`;
    procedimentosXML += `              <ans:viaAcesso>${proc.viaAcesso}</ans:viaAcesso>\n`;
    procedimentosXML += `              <ans:tecnicaUtilizada>${proc.tecnicaUtilizada}</ans:tecnicaUtilizada>\n`;
    procedimentosXML += `              <ans:reducaoAcrescimo>${proc.reducaoAcrescimo}</ans:reducaoAcrescimo>\n`;
    procedimentosXML += `              <ans:valorUnitario>${proc.valorUnitario.toFixed(2)}</ans:valorUnitario>\n`;
    procedimentosXML += `              <ans:valorTotal>${proc.valorTotal.toFixed(2)}</ans:valorTotal>\n`;
    procedimentosXML += '              <ans:equipeSadt>\n';
    procedimentosXML += `                <ans:grauPart>${proc.grauParticipacao}</ans:grauPart>\n`;
    procedimentosXML += '                <ans:codProfissional>\n';
    procedimentosXML += `                  <ans:cpfContratado>${proc.prestadorCPF}</ans:cpfContratado>\n`;
    procedimentosXML += '                </ans:codProfissional>\n';
    procedimentosXML += `                <ans:nomeProf>${escapeXML(proc.prestadorNome)}</ans:nomeProf>\n`;
    procedimentosXML += `                <ans:conselho>${proc.prestadorConselho}</ans:conselho>\n`;
    procedimentosXML += `                <ans:numeroConselhoProfissional>${escapeXML(proc.prestadorNumeroConselho)}</ans:numeroConselhoProfissional>\n`;
    procedimentosXML += `                <ans:UF>${proc.prestadorUF}</ans:UF>\n`;
    procedimentosXML += `                <ans:CBOS>${proc.prestadorCBOS}</ans:CBOS>\n`;
    procedimentosXML += '              </ans:equipeSadt>\n';
    procedimentosXML += '            </ans:procedimentoExecutado>\n';
  }

  let outrasDespesasXML = '';
  if (outrasDespesas.length > 0) {
    const despesasPorCodigo = new Map();
    for (const desp of outrasDespesas) {
      if (!despesasPorCodigo.has(desp.codigoDespesa)) {
        despesasPorCodigo.set(desp.codigoDespesa, []);
      }
      despesasPorCodigo.get(desp.codigoDespesa).push(desp.servico);
    }
    outrasDespesasXML = '          <ans:outrasDespesas>\n';
    for (const [codDespesa, servicos] of despesasPorCodigo.entries()) {
      outrasDespesasXML += '            <ans:despesa>\n';
      outrasDespesasXML += `              <ans:sequencialItem>${sequencialGlobal++}</ans:sequencialItem>\n`;
      outrasDespesasXML += `              <ans:codigoDespesa>${codDespesa}</ans:codigoDespesa>\n`;
      for (const serv of servicos) {
        outrasDespesasXML += '              <ans:servicosExecutados>\n';
        outrasDespesasXML += `                <ans:dataExecucao>${serv.dataExecucao}</ans:dataExecucao>\n`;
        outrasDespesasXML += `                <ans:horaInicial>${serv.horaInicial}</ans:horaInicial>\n`;
        outrasDespesasXML += `                <ans:horaFinal>${serv.horaFinal}</ans:horaFinal>\n`;
        outrasDespesasXML += `                <ans:codigoTabela>${serv.codigoTabela}</ans:codigoTabela>\n`;
        outrasDespesasXML += `                <ans:codigoProcedimento>${escapeXML(serv.codigoProcedimento)}</ans:codigoProcedimento>\n`;
        outrasDespesasXML += `                <ans:quantidadeExecutada>${serv.quantidade}</ans:quantidadeExecutada>\n`;
        outrasDespesasXML += `                <ans:unidadeMedida>${serv.unidadeMedida}</ans:unidadeMedida>\n`;
        outrasDespesasXML += `                <ans:reducaoAcrescimo>${serv.reducaoAcrescimo}</ans:reducaoAcrescimo>\n`;
        outrasDespesasXML += `                <ans:valorUnitario>${serv.valorUnitario.toFixed(2)}</ans:valorUnitario>\n`;
        outrasDespesasXML += `                <ans:valorTotal>${serv.valorTotal.toFixed(2)}</ans:valorTotal>\n`;
        outrasDespesasXML += `                <ans:descricaoProcedimento>${escapeXML(serv.descricaoProcedimento)}</ans:descricaoProcedimento>\n`;
        outrasDespesasXML += '              </ans:servicosExecutados>\n';
      }
      outrasDespesasXML += '            </ans:despesa>\n';
    }
    outrasDespesasXML += '          </ans:outrasDespesas>\n';
  }

  let guiaXML = '        <ans:guiaSP-SADT>\n';
  guiaXML += '          <ans:cabecalhoGuia>\n';
  guiaXML += `            <ans:registroANS>${escapeXML(registroANS)}</ans:registroANS>\n`;
  guiaXML += `            <ans:numeroGuiaPrestador>${escapeXML(numeroGuiaPrestador)}</ans:numeroGuiaPrestador>\n`;
  if (guiaPrincipal) guiaXML += `            <ans:guiaPrincipal>${escapeXML(guiaPrincipal)}</ans:guiaPrincipal>\n`;
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
  if (codigoExecutante) {
    guiaXML += `              <ans:codigoPrestadorNaOperadora>${escapeXML(codigoExecutante)}</ans:codigoPrestadorNaOperadora>\n`;
  } else {
    guiaXML += `              <ans:cnpjContratado>${cnpjContratado}</ans:cnpjContratado>\n`;
  }
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

  if (procedimentosXML) {
    guiaXML += '          <ans:procedimentosExecutados>\n';
    guiaXML += procedimentosXML;
    guiaXML += '          </ans:procedimentosExecutados>\n';
  }

  guiaXML += outrasDespesasXML;

  guiaXML += '          <ans:valorTotal>\n';
  guiaXML += `            <ans:valorProcedimentos>${valorProcedimentos.toFixed(2)}</ans:valorProcedimentos>\n`;
  guiaXML += `            <ans:valorDiarias>${valorDiarias.toFixed(2)}</ans:valorDiarias>\n`;
  guiaXML += `            <ans:valorTaxasAlugueis>${valorTaxasAlugueis.toFixed(2)}</ans:valorTaxasAlugueis>\n`;
  guiaXML += `            <ans:valorMateriais>${valorMateriais.toFixed(2)}</ans:valorMateriais>\n`;
  guiaXML += `            <ans:valorMedicamentos>${valorMedicamentos.toFixed(2)}</ans:valorMedicamentos>\n`;
  guiaXML += `            <ans:valorOPME>${valorOPME.toFixed(2)}</ans:valorOPME>\n`;
  guiaXML += `            <ans:valorGasesMedicinais>${valorGasesMedicinais.toFixed(2)}</ans:valorGasesMedicinais>\n`;
  guiaXML += `            <ans:valorTotalGeral>${valorTotalGeral.toFixed(2)}</ans:valorTotalGeral>\n`;
  guiaXML += '          </ans:valorTotal>\n';

  guiaXML += '        </ans:guiaSP-SADT>\n';
  return guiaXML;
}

// ============================================
// FUNÇÃO AUXILIAR PARA CONVERSÃO DE ATENDIMENTO
// ============================================
export async function converterAtendimentoParaTISS(atendimento, convenio) {
  // Carregar configuração do banco se não estiver na memória
  if (!configGlobal) {
    await carregarConfigDoBanco();
  }
  
  const config = getConfig();
  const numeroCarteira = atendimento.numero_carteira || '000000000';
  const primeiroItem = atendimento.itens?.[0] || null;
  const registroANS = convenio?.registro_ans || '';
  const isBradesco = registroANS && BRADESCO_ANS.includes(registroANS);

  const itensConvertidos = (atendimento.itens || []).map(item => ({
    codigo: item.codigo || item.codigo_procedimento || '00000000',
    nome: limitarDescricao(item.nome || item.nome_procedimento || 'PROCEDIMENTO', 150),
    quantidade: item.quantidade || 1,
    valor_unitario: parseFloat(item.valor_unitario || 0),
    valor_total: parseFloat(item.valor_total || 0),
    data_execucao: item.data_execucao || atendimento.data_atendimento,
    hora_inicial: item.hora_inicial || '00:00:00',
    hora_final: item.hora_final || '00:00:00',
    tabela_referencia: item.tabela_referencia || '22',
    codigo_despesa: item.codigo_despesa || '',
    unidade_medida: item.unidade_medida || '036',
    reducao_acrescimo: item.reducao_acrescimo || '1.00',
    prestador_nome: item.prestador_nome || 'PROFISSIONAL',
    prestador_cpf: (item.prestador_cpf || '00000000000').replace(/\D/g, ''),
    prestador_conselho: item.prestador_conselho || 'CRM',
    prestador_numero_conselho: item.prestador_numero_conselho || '00000',
    prestador_uf_conselho: item.prestador_uf_conselho || 'SP',
    prestador_cbos: item.prestador_cbos || '225125',
    grau_participacao: isBradesco ? '00' : (item.grau_participacao || '12')
  }));

  // ✅ Buscar CNES da configuração
  let cnesExecutante = '0000000';
  if (config?.cnes) {
    cnesExecutante = String(config.cnes).replace(/\D/g, '').padStart(7, '0').slice(0, 7);
  }

  return {
    codigoPrestadorExecutante: convenio?.codigo_prestador || config?.codigo_prestador || '002535718',
    numeroCarteira,
    numero_guia_operadora: atendimento.numero_guia_operadora || '',
    guia_principal: atendimento.guia_principal || '',
    data_autorizacao: atendimento.data_autorizacao || '',
    data_validade_senha: atendimento.data_validade_senha || '',
    senha_autorizacao: atendimento.senha_autorizacao || '',
    dataSolicitacao: atendimento.data_solicitacao || atendimento.data_atendimento || new Date().toISOString().split('T')[0],
    numero_guia_prestador: atendimento.numero_guia_prestador || ('G' + Date.now().toString()),
    nomeProfissionalSolicitante: atendimento.profissional_solicitante || primeiroItem?.prestador_nome || 'PROFISSIONAL',
    numeroConselhoProfissionalSolicitante: atendimento.numero_conselho_solicitante || primeiroItem?.prestador_numero_conselho || '00000',
    carater_atendimento: atendimento.carater_atendimento || '1',
    tipo_atendimento: atendimento.tipo_atendimento || '04',
    indicacao_acidente: atendimento.indicacao_acidente || '9',
    tipo_consulta: atendimento.tipo_consulta || '1',
    regime_atendimento: atendimento.regime_atendimento || '01',
    cobertura_especial: atendimento.cobertura_especial || '',
    saude_ocupacional: atendimento.saude_ocupacional || '',
    indicacao_clinica: atendimento.indicacao_clinica || '',
    motivo_encerramento: atendimento.motivo_encerramento || '',
    itens: itensConvertidos,
    cnes: cnesExecutante
  };
}

// ============================================
// FUNÇÃO PARA INICIALIZAR O MÓDULO
// ============================================
export async function initTISS() {
  await carregarConfigDoBanco();
  console.log('✅ Módulo TISS inicializado');
  return configGlobal;
}
