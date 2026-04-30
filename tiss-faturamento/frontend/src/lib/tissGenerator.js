import CryptoJS from 'crypto-js';

// ============================================
// VERSÕES SUPORTADAS DO PADRÃO TISS
// ============================================
export const VERSAO_TISS = {
  '4.01.00': '4.01.00',
  '4.02.00': '4.02.00',
  '4.03.00': '4.03.00'
};

// Configuração global
let configGlobal = null;
let versaoAtual = VERSAO_TISS['4.03.00'];

export function setConfig(config) {
  configGlobal = config;
}

export function getConfig() {
  if (!configGlobal) {
    const stored = localStorage.getItem('config_sistema');
    if (stored) configGlobal = JSON.parse(stored);
  }
  return configGlobal;
}

export function setVersao(versao) {
  if (Object.values(VERSAO_TISS).includes(versao)) {
    versaoAtual = versao;
  }
}

export function getVersao() {
  return versaoAtual;
}

// ============================================
// TABELAS ANS (mapeamentos)
// ============================================

const INDICADOR_ACIDENTE = {
  '0': '0', '1': '1', '2': '2', '9': '9'
};

const TIPO_ATENDIMENTO = {
  '01': '01', '02': '02', '03': '03', '04': '04',
  '08': '08', '09': '09', '10': '10', '13': '13', '23': '23'
};

const REGIME_ATENDIMENTO = {
  '01': '01', '02': '02', '03': '03', '04': '04', '05': '05'
};

const CARATER_ATENDIMENTO = {
  '1': '1', '2': '2'
};

const TIPO_CONSULTA = {
  '1': '1', '2': '2', '3': '3', '4': '4'
};

const TIPO_GUIA = {
  'SP_SADT': 'SP_SADT',
  'SP_HONOR': 'SP_HONOR'
};

const GRAU_PARTICIPACAO = {
  '00': '00', '01': '01', '02': '02', '03': '03', '04': '04',
  '05': '05', '06': '06', '07': '07', '12': '12', '13': '13'
};

const mapaConselhos = {
  'CRM': '06', 'CRO': '08', 'CRF': '03', 'COREN': '02',
  'CREFITO': '05', 'CRP': '09', 'CRBio': '11', 'CRN': '07',
  'CREF': '13', 'CRA': '10', 'CRESS': '01',
  '06': '06', '08': '08', '03': '03', '02': '02',
  '05': '05', '09': '09', '11': '11', '07': '07',
  '13': '13', '10': '10', '01': '01'
};

const mapaUFs = {
  'RO': '11', 'AC': '12', 'AM': '13', 'RR': '14', 'PA': '15',
  'AP': '16', 'TO': '17', 'MA': '21', 'MT': '51', 'MS': '50',
  'MG': '31', 'ES': '32', 'RJ': '33', 'SP': '35', 'PR': '41',
  'SC': '42', 'RS': '43', 'BA': '29', 'SE': '28', 'AL': '27',
  'PE': '26', 'PB': '25', 'RN': '24', 'CE': '23', 'PI': '22',
  'GO': '52', 'DF': '53',
  '35': '35', '33': '33', '31': '31', '41': '41', '42': '42',
  '43': '43', '53': '53', '29': '29', '26': '26', '23': '23'
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
  if (!valor) return '12';
  return GRAU_PARTICIPACAO[valor] || '12';
}

function gerarNumeroAleatorio(tamanho) {
  let numero = '';
  for (let i = 0; i < tamanho; i++) {
    numero += Math.floor(Math.random() * 10).toString();
  }
  return numero;
}

function formatarHora(hora) {
  if (!hora) return '00:00:00';
  if (hora.includes(':')) {
    const partes = hora.split(':');
    const horas = partes[0].padStart(2, '0');
    const minutos = (partes[1] || '00').padStart(2, '0');
    const segundos = (partes[2] || '00').padStart(2, '0');
    return horas + ':' + minutos + ':' + segundos;
  }
  if (hora.length === 6) {
    return hora.substring(0, 2) + ':' + hora.substring(2, 4) + ':' + hora.substring(4, 6);
  }
  if (hora.length === 4) {
    return hora.substring(0, 2) + ':' + hora.substring(2, 4) + ':00';
  }
  return '00:00:00';
}

function escapeXML(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

export function gerarXMLTISS(dados) {
  const config = getConfig();
  const versao = dados.versao || versaoAtual;
  
  const sequencialTransacao = dados.sequencialTransacao || gerarNumeroAleatorio(4);
  const dataRegistroTransacao = dados.dataRegistroTransacao || new Date().toISOString().split('T')[0];
  const horaRegistroTransacao = dados.horaRegistroTransacao || new Date().toLocaleTimeString('pt-BR', { hour12: false });
  const codigoPrestadorNaOperadora = dados.codigoPrestadorNaOperadora || '';
  const registroANS = dados.registroANS || '';
  const numeroLote = dados.numeroLote || ('LOTE' + Date.now().toString());
  const guias = dados.guias || [];

  let guiasXML = '';
  for (let i = 0; i < guias.length; i++) {
    guiasXML += gerarGuiaSPSADT(guias[i], registroANS, config, versao);
  }

  let xml = '<?xml version="1.0" encoding="ISO-8859-1"?>\n';
  xml += '<ans:mensagemTISS xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.ans.gov.br/padroes/tiss/schemas tissV4_03_00.xsd">\n';
  xml += '  <ans:cabecalho>\n';
  xml += '    <ans:identificacaoTransacao>\n';
  xml += '      <ans:tipoTransacao>ENVIO_LOTE_GUIAS</ans:tipoTransacao>\n';
  xml += '      <ans:sequencialTransacao>' + sequencialTransacao + '</ans:sequencialTransacao>\n';
  xml += '      <ans:dataRegistroTransacao>' + dataRegistroTransacao + '</ans:dataRegistroTransacao>\n';
  xml += '      <ans:horaRegistroTransacao>' + horaRegistroTransacao + '</ans:horaRegistroTransacao>\n';
  xml += '    </ans:identificacaoTransacao>\n';
  xml += '    <ans:origem>\n';
  xml += '      <ans:identificacaoPrestador>\n';
  xml += '        <ans:codigoPrestadorNaOperadora>' + escapeXML(codigoPrestadorNaOperadora) + '</ans:codigoPrestadorNaOperadora>\n';
  xml += '      </ans:identificacaoPrestador>\n';
  xml += '    </ans:origem>\n';
  xml += '    <ans:destino>\n';
  xml += '      <ans:registroANS>' + escapeXML(registroANS) + '</ans:registroANS>\n';
  xml += '    </ans:destino>\n';
  xml += '    <ans:Padrao>' + versao + '</ans:Padrao>\n';
  xml += '  </ans:cabecalho>\n';
  xml += '  <ans:prestadorParaOperadora>\n';
  xml += '    <ans:loteGuias>\n';
  xml += '      <ans:numeroLote>' + escapeXML(numeroLote) + '</ans:numeroLote>\n';
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
  
  const caraterAtendimento = guia.carater_atendimento || '1';
  const tipoAtendimento = guia.tipo_atendimento || '04';
  const indicacaoAcidente = guia.indicacao_acidente || '9';
  const tipoConsulta = guia.tipo_consulta || '1';
  const regimeAtendimento = guia.regime_atendimento || '01';
  const coberturaEspecial = guia.cobertura_especial || '';
  const saudeOcupacional = guia.saude_ocupacional || '';

  const cnpjContratado = (config && config.cnpj) ? config.cnpj.replace(/\D/g, '') : '20384928000205';
  const nomeContratadoSolicitante = (config && config.nome_contratado) ? config.nome_contratado.toUpperCase() : 'CLINICA NAO CONFIGURADA';
  const cnesExecutante = (config && config.cnes) ? config.cnes : '0000000';
  const conselhoClinica = getCodigoConselho((config && config.conselho_clinica) ? config.conselho_clinica : '06');
  const ufClinica = getCodigoUF((config && config.uf_clinica) ? config.uf_clinica : 'SP');
  const cbosClinica = (config && config.cbos_clinica) ? config.cbos_clinica : '225125';

  let procedimentosXML = '';
  let valorTotalGeral = 0;
  
  for (let idx = 0; idx < itens.length; idx++) {
    const item = itens[idx];
    const sequencialItem = (idx + 1).toString();
    const dataExecucao = item.data_execucao || dataSolicitacao;
    const horaInicial = formatarHora(item.hora_inicial);
    const horaFinal = formatarHora(item.hora_final);
    
    const prestadorNome = item.prestador_nome || item.nome_profissional || 'PROFISSIONAL';
    const prestadorConselho = getCodigoConselho(item.prestador_conselho || item.conselho || '06');
    const prestadorNumeroConselho = item.prestador_numero_conselho || item.numero_conselho || '00000';
    const prestadorUF = getCodigoUF(item.prestador_uf_conselho || item.uf_conselho || 'SP');
    const prestadorCBOS = item.prestador_cbos || item.cbos || '225125';
    const prestadorCPF = item.prestador_cpf || item.cpf || '00000000000';
    const grauParticipacao = getGrauParticipacao(item.grau_participacao || '12');
    
    const codigoProcedimento = item.codigo || item.codigo_procedimento || item.procedimento_codigo || '00000000';
    const nomeProcedimento = item.nome || item.nome_procedimento || item.procedimento_nome || 'PROCEDIMENTO';
    const tabelaReferencia = item.tabela_referencia || '22';
    const quantidade = (item.quantidade || 1).toString();
    const valorUnitario = parseFloat(item.valor_unitario || 0).toFixed(2);
    const valorTotal = parseFloat(item.valor_total || 0).toFixed(2);
    
    valorTotalGeral += parseFloat(valorTotal);
    
    procedimentosXML += '            <ans:procedimentoExecutado>\n';
    procedimentosXML += '              <ans:sequencialItem>' + sequencialItem + '</ans:sequencialItem>\n';
    procedimentosXML += '              <ans:dataExecucao>' + dataExecucao + '</ans:dataExecucao>\n';
    procedimentosXML += '              <ans:horaInicial>' + horaInicial + '</ans:horaInicial>\n';
    procedimentosXML += '              <ans:horaFinal>' + horaFinal + '</ans:horaFinal>\n';
    procedimentosXML += '              <ans:procedimento>\n';
    procedimentosXML += '                <ans:codigoTabela>' + tabelaReferencia + '</ans:codigoTabela>\n';
    procedimentosXML += '                <ans:codigoProcedimento>' + escapeXML(codigoProcedimento) + '</ans:codigoProcedimento>\n';
    procedimentosXML += '                <ans:descricaoProcedimento>' + escapeXML(nomeProcedimento) + '</ans:descricaoProcedimento>\n';
    procedimentosXML += '              </ans:procedimento>\n';
    procedimentosXML += '              <ans:quantidadeExecutada>' + quantidade + '</ans:quantidadeExecutada>\n';
    procedimentosXML += '              <ans:valorUnitario>' + valorUnitario + '</ans:valorUnitario>\n';
    procedimentosXML += '              <ans:valorTotal>' + valorTotal + '</ans:valorTotal>\n';
    procedimentosXML += '              <ans:equipeSadt>\n';
    procedimentosXML += '                <ans:grauPart>' + grauParticipacao + '</ans:grauPart>\n';
    procedimentosXML += '                <ans:codProfissional>\n';
    procedimentosXML += '                  <ans:cpfContratado>' + prestadorCPF + '</ans:cpfContratado>\n';
    procedimentosXML += '                </ans:codProfissional>\n';
    procedimentosXML += '                <ans:nomeProf>' + escapeXML(prestadorNome) + '</ans:nomeProf>\n';
    procedimentosXML += '                <ans:conselho>' + prestadorConselho + '</ans:conselho>\n';
    procedimentosXML += '                <ans:numeroConselhoProfissional>' + prestadorNumeroConselho + '</ans:numeroConselhoProfissional>\n';
    procedimentosXML += '                <ans:UF>' + prestadorUF + '</ans:UF>\n';
    procedimentosXML += '                <ans:CBOS>' + prestadorCBOS + '</ans:CBOS>\n';
    procedimentosXML += '              </ans:equipeSadt>\n';
    procedimentosXML += '            </ans:procedimentoExecutado>\n';
  }

  const valorTotalFormatado = valorTotalGeral.toFixed(2);
  const caraterValue = CARATER_ATENDIMENTO[caraterAtendimento] || '1';
  const tipoAtendimentoValue = TIPO_ATENDIMENTO[tipoAtendimento] || '04';
  const indicadorAcidenteValue = INDICADOR_ACIDENTE[indicacaoAcidente] || '9';
  const tipoConsultaValue = TIPO_CONSULTA[tipoConsulta] || '1';
  const regimeAtendimentoValue = REGIME_ATENDIMENTO[regimeAtendimento] || '01';

  let guiaXML = '        <ans:guiaSP-SADT>\n';
  guiaXML += '          <ans:cabecalhoGuia>\n';
  guiaXML += '            <ans:registroANS>' + escapeXML(registroANS) + '</ans:registroANS>\n';
  guiaXML += '            <ans:numeroGuiaPrestador>' + escapeXML(numeroGuiaPrestador) + '</ans:numeroGuiaPrestador>\n';
  guiaXML += '          </ans:cabecalhoGuia>\n';
  
  if (numeroGuiaOperadora || dataAutorizacao || senha) {
    guiaXML += '          <ans:dadosAutorizacao>\n';
    if (numeroGuiaOperadora) {
      guiaXML += '            <ans:numeroGuiaOperadora>' + numeroGuiaOperadora + '</ans:numeroGuiaOperadora>\n';
    }
    guiaXML += '            <ans:dataAutorizacao>' + dataAutorizacao + '</ans:dataAutorizacao>\n';
    if (senha) {
      guiaXML += '            <ans:senha>' + senha + '</ans:senha>\n';
    }
    if (dataValidadeSenha) {
      guiaXML += '            <ans:dataValidadeSenha>' + dataValidadeSenha + '</ans:dataValidadeSenha>\n';
    }
    guiaXML += '          </ans:dadosAutorizacao>\n';
  }
  
  guiaXML += '          <ans:dadosBeneficiario>\n';
  guiaXML += '            <ans:numeroCarteira>' + escapeXML(numeroCarteira) + '</ans:numeroCarteira>\n';
  guiaXML += '            <ans:atendimentoRN>N</ans:atendimentoRN>\n';
  guiaXML += '          </ans:dadosBeneficiario>\n';
  
  guiaXML += '          <ans:dadosSolicitante>\n';
  guiaXML += '            <ans:contratadoSolicitante>\n';
  guiaXML += '              <ans:cnpjContratado>' + cnpjContratado + '</ans:cnpjContratado>\n';
  guiaXML += '            </ans:contratadoSolicitante>\n';
  guiaXML += '            <ans:nomeContratadoSolicitante>' + escapeXML(nomeContratadoSolicitante) + '</ans:nomeContratadoSolicitante>\n';
  guiaXML += '            <ans:profissionalSolicitante>\n';
  guiaXML += '              <ans:nomeProfissional>' + escapeXML(nomeProfissionalSolicitante) + '</ans:nomeProfissional>\n';
  guiaXML += '              <ans:conselhoProfissional>' + conselhoClinica + '</ans:conselhoProfissional>\n';
  guiaXML += '              <ans:numeroConselhoProfissional>' + numeroConselhoProfissionalSolicitante + '</ans:numeroConselhoProfissional>\n';
  guiaXML += '              <ans:UF>' + ufClinica + '</ans:UF>\n';
  guiaXML += '              <ans:CBOS>' + cbosClinica + '</ans:CBOS>\n';
  guiaXML += '            </ans:profissionalSolicitante>\n';
  guiaXML += '          </ans:dadosSolicitante>\n';
  
  guiaXML += '          <ans:dadosSolicitacao>\n';
  guiaXML += '            <ans:dataSolicitacao>' + dataSolicitacao + '</ans:dataSolicitacao>\n';
  guiaXML += '            <ans:caraterAtendimento>' + caraterValue + '</ans:caraterAtendimento>\n';
  guiaXML += '          </ans:dadosSolicitacao>\n';
  
  guiaXML += '          <ans:dadosExecutante>\n';
  guiaXML += '            <ans:contratadoExecutante>\n';
  guiaXML += '              <ans:codigoPrestadorNaOperadora>' + escapeXML(codigoPrestadorExecutante) + '</ans:codigoPrestadorNaOperadora>\n';
  guiaXML += '            </ans:contratadoExecutante>\n';
  guiaXML += '            <ans:CNES>' + cnesExecutante + '</ans:CNES>\n';
  guiaXML += '          </ans:dadosExecutante>\n';
  
  guiaXML += '          <ans:dadosAtendimento>\n';
  guiaXML += '            <ans:tipoAtendimento>' + tipoAtendimentoValue + '</ans:tipoAtendimento>\n';
  guiaXML += '            <ans:indicacaoAcidente>' + indicadorAcidenteValue + '</ans:indicacaoAcidente>\n';
  guiaXML += '            <ans:tipoConsulta>' + tipoConsultaValue + '</ans:tipoConsulta>\n';
  if (coberturaEspecial) {
    guiaXML += '            <ans:coberturaEspecial>' + coberturaEspecial + '</ans:coberturaEspecial>\n';
  }
  guiaXML += '            <ans:regimeAtendimento>' + regimeAtendimentoValue + '</ans:regimeAtendimento>\n';
  if (saudeOcupacional) {
    guiaXML += '            <ans:saudeOcupacional>' + saudeOcupacional + '</ans:saudeOcupacional>\n';
  }
  guiaXML += '          </ans:dadosAtendimento>\n';
  
  guiaXML += '          <ans:procedimentosExecutados>\n';
  guiaXML += procedimentosXML;
  guiaXML += '          </ans:procedimentosExecutados>\n';
  
  guiaXML += '          <ans:valorTotal>\n';
  guiaXML += '            <ans:valorProcedimentos>' + valorTotalFormatado + '</ans:valorProcedimentos>\n';
  guiaXML += '            <ans:valorTotalGeral>' + valorTotalFormatado + '</ans:valorTotalGeral>\n';
  guiaXML += '          </ans:valorTotal>\n';
  guiaXML += '        </ans:guiaSP-SADT>\n';

  return guiaXML;
}

export function converterAtendimentoParaTISS(atendimento, convenio) {
  const config = getConfig();
  const numeroCarteira = atendimento.numero_carteira || '000000000';
  const primeiroItem = (atendimento.itens && atendimento.itens.length > 0) ? atendimento.itens[0] : null;
  
  const itensConvertidos = [];
  if (atendimento.itens && atendimento.itens.length > 0) {
    for (let i = 0; i < atendimento.itens.length; i++) {
      const item = atendimento.itens[i];
      itensConvertidos.push({
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
        prestador_cpf: item.prestador_cpf || '00000000000',
        prestador_conselho: item.prestador_conselho || 'CRM',
        prestador_numero_conselho: item.prestador_numero_conselho || '00000',
        prestador_uf_conselho: item.prestador_uf_conselho || 'SP',
        prestador_cbos: item.prestador_cbos || '225125',
        grau_participacao: item.grau_participacao || '12'
      });
    }
  }
  
  return {
    codigoPrestadorExecutante: (convenio && convenio.codigo_prestador) ? convenio.codigo_prestador : (config && config.codigo_prestador ? config.codigo_prestador : '002535718'),
    numeroCarteira: numeroCarteira,
    nomeBeneficiario: atendimento.paciente_nome || 'PACIENTE',
    numero_guia_operadora: atendimento.numero_guia_operadora || '',
    data_autorizacao: atendimento.data_autorizacao || '',
    data_validade_senha: atendimento.data_validade_senha || '',
    senha_autorizacao: atendimento.senha_autorizacao || '',
    dataSolicitacao: atendimento.data_solicitacao || atendimento.data_atendimento || new Date().toISOString().split('T')[0],
    numero_guia_prestador: atendimento.numero_guia_prestador || ('G' + Date.now().toString()),
    nomeProfissionalSolicitante: atendimento.profissional_solicitante || (primeiroItem ? primeiroItem.prestador_nome : 'PROFISSIONAL'),
    numeroConselhoProfissionalSolicitante: atendimento.numero_conselho_solicitante || (primeiroItem ? primeiroItem.prestador_numero_conselho : '00000'),
    carater_atendimento: atendimento.carater_atendimento || '1',
    tipo_atendimento: atendimento.tipo_atendimento || '04',
    indicacao_acidente: atendimento.indicacao_acidente || '9',
    tipo_consulta: atendimento.tipo_consulta || '1',
    regime_atendimento: atendimento.regime_atendimento || '01',
    cobertura_especial: atendimento.cobertura_especial || '',
    saude_ocupacional: atendimento.saude_ocupacional || '',
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
    codigoPrestadorExecutante: (config && config.codigo_prestador) ? config.codigo_prestador : '002535718',
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
    codigoPrestadorNaOperadora: (config && config.codigo_prestador) ? config.codigo_prestador : '20.384.928/0002-05',
    registroANS: (config && config.registro_ans) ? config.registro_ans : '421928',
    numeroLote: 'LOTE' + Date.now().toString(),
    guias: guias
  });
}
