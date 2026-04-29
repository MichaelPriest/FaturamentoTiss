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

// Tabela 39 - Grau de Participação
const GRAU_PARTICIPACAO = {
  '00': '00', '01': '01', '02': '02', '03': '03', '04': '04',
  '05': '05', '06': '06', '07': '07', '08': '08', '09': '09',
  '10': '10', '11': '11', '12': '12', '13': '13'
};

// Tabela 36 - Indicador de Acidente
const INDICADOR_ACIDENTE = {
  '0': '0', '1': '1', '2': '2', '9': '9'
};

// Tabela 50 - Tipo de Atendimento
const TIPO_ATENDIMENTO = {
  '01': '01', '02': '02', '03': '03', '04': '04',
  '08': '08', '09': '09', '10': '10', '13': '13', '23': '23'
};

// Tabela 26 - Regime de Atendimento
const REGIME_ATENDIMENTO = {
  '01': '01', '02': '02', '03': '03', '04': '04', '05': '05'
};

// Tabela 53 - Caráter do Atendimento
const CARATER_ATENDIMENTO = {
  '1': '1', '2': '2'
};

// Tabela 52 - Tipo de Consulta (CORRIGIDO - estava faltando)
const TIPO_CONSULTA = {
  '1': '1',   // Primeira Consulta
  '2': '2',   // Seguimento / Retorno
  '3': '3',   // Pré-Natal
  '4': '4'    // Por encaminhamento
};

// Tabela 34 - Motivo de Saída da Internação (apenas para óbito)
const MOTIVO_ENCERRAMENTO = {
  '41': '41', // Óbito com declaração de óbito fornecida pelo médico assistente
  '42': '42', // Óbito com declaração de Óbito fornecida pelo IML
  '43': '43'  // Óbito com declaração de Óbito fornecida pelo SVO
};

// Mapeamento de conselhos para códigos ANS
const mapaConselhos = {
  'CRM': '06', 'CRO': '08', 'CRF': '03', 'COREN': '02',
  'CREFITO': '05', 'CRP': '09', 'CRBio': '11', 'CRN': '07',
  'CREF': '13', 'CRA': '10', 'CRESS': '01'
};

// Mapeamento de UFs para códigos ANS
const mapaUFs = {
  'RO': '11', 'AC': '12', 'AM': '13', 'RR': '14', 'PA': '15',
  'AP': '16', 'TO': '17', 'MA': '21', 'MT': '51', 'MS': '50',
  'MG': '31', 'ES': '32', 'RJ': '33', 'SP': '35', 'PR': '41',
  'SC': '42', 'RS': '43', 'BA': '29', 'SE': '28', 'AL': '27',
  'PE': '26', 'PB': '25', 'RN': '24', 'CE': '23', 'PI': '22',
  'GO': '52', 'DF': '53'
};

function getCodigoConselho(sigla) {
  return mapaConselhos[sigla] || '06';
}

function getCodigoUF(uf) {
  return mapaUFs[uf.toUpperCase()] || '35';
}

function gerarNumeroAleatorio(tamanho) {
  let numero = '';
  for (let i = 0; i < tamanho; i++) {
    numero += Math.floor(Math.random() * 10);
  }
  return numero;
}

function gerarNumeroGuiaPrestador(convenio) {
  if (convenio && convenio.proximo_numero_guia) {
    const numero = convenio.proximo_numero_guia;
    const conveniosAtualizados = JSON.parse(localStorage.getItem('convenios') || '[]').map(c => 
      c.id === convenio.id ? { ...c, proximo_numero_guia: numero + 1 } : c
    );
    localStorage.setItem('convenios', JSON.stringify(conveniosAtualizados));
    return numero.toString();
  }
  return Date.now().toString();
}

function gerarNumeroLote() {
  return '3' + gerarNumeroAleatorio(4) + gerarNumeroAleatorio(4) + gerarNumeroAleatorio(4);
}

function formatarHora(hora) {
  if (!hora) return '00:00:00';
  if (hora.includes(':')) {
    const partes = hora.split(':');
    while (partes.length < 3) partes.push('00');
    return `${partes[0].padStart(2, '0')}:${partes[1].padStart(2, '0')}:${partes[2].padStart(2, '0')}`;
  }
  if (hora.length === 6) {
    return `${hora.substring(0, 2)}:${hora.substring(2, 4)}:${hora.substring(4, 6)}`;
  }
  if (hora.length === 4) {
    return `${hora.substring(0, 2)}:${hora.substring(2, 4)}:00`;
  }
  return '00:00:00';
}

/**
 * Gera XML TISS conforme versão especificada
 */
export function gerarXMLTISS(dados) {
  const config = getConfig();
  const versao = dados.versao || versaoAtual;
  
  const {
    tipoTransacao = 'ENVIO_LOTE_GUIAS',
    sequencialTransacao = gerarNumeroAleatorio(4),
    dataRegistroTransacao = new Date().toISOString().split('T')[0],
    horaRegistroTransacao = new Date().toLocaleTimeString('pt-BR', { hour12: false }),
    codigoPrestadorNaOperadora,
    registroANS,
    numeroLote = gerarNumeroLote(),
    guias,
    convenio
  } = dados;

  let guiasXML = '';
  guias.forEach((guia, index) => {
    guiasXML += gerarGuiaSPSADT(guia, index + 1, registroANS, config, convenio, versao);
  });

  let xml = `<?xml version="1.0" encoding="ISO-8859-1"?>
<ans:mensagemTISS xsi:schemaLocation="http://www.ans.gov.br/padroes/tiss/schemas/tissV${versao.replace(/\./g, '_')}.xsd" xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <ans:cabecalho>
    <ans:identificacaoTransacao>
      <ans:tipoTransacao>${tipoTransacao}</ans:tipoTransacao>
      <ans:sequencialTransacao>${sequencialTransacao}</ans:sequencialTransacao>
      <ans:dataRegistroTransacao>${dataRegistroTransacao}</ans:dataRegistroTransacao>
      <ans:horaRegistroTransacao>${horaRegistroTransacao}</ans:horaRegistroTransacao>
    </ans:identificacaoTransacao>
    <ans:origem>
      <ans:identificacaoPrestador>
        <ans:codigoPrestadorNaOperadora>${codigoPrestadorNaOperadora}</ans:codigoPrestadorNaOperadora>
      </ans:identificacaoPrestador>
    </ans:origem>
    <ans:destino>
      <ans:registroANS>${registroANS}</ans:registroANS>
    </ans:destino>
    <ans:Padrao>${versao}</ans:Padrao>
  </ans:cabecalho>
  <ans:prestadorParaOperadora>
    <ans:loteGuias>
      <ans:numeroLote>${numeroLote}</ans:numeroLote>
      <ans:guiasTISS>
${guiasXML}
      </ans:guiasTISS>
    </ans:loteGuias>
  </ans:prestadorParaOperadora>
  <ans:epilogo>
    <ans:hash>HASH_TEMP</ans:hash>
  </ans:epilogo>
</ans:mensagemTISS>`;

  const xmlSemHash = xml.replace('HASH_TEMP', '');
  const hash = CryptoJS.MD5(xmlSemHash).toString().toUpperCase();
  xml = xml.replace('HASH_TEMP', hash);

  return xml;
}

function gerarGuiaSPSADT(guia, sequencial, registroANS, config, convenio, versao) {
  const {
    numeroCarteira,
    nomeBeneficiario,
    dataSolicitacao = new Date().toISOString().split('T')[0],
    numero_guia_operadora,
    data_autorizacao,
    senha_autorizacao,
    data_validade_senha = '',
    codigoPrestadorExecutante,
    nomeProfissionalSolicitante,
    numeroConselhoProfissionalSolicitante,
    itens,
    // Campos específicos do atendimento (com valores padrão)
    carater_atendimento = '1',
    tipo_atendimento = '04',
    indicacao_acidente = '9',
    tipo_consulta = '1',
    regime_atendimento = '01',
    cobertura_especial = '',
    saude_ocupacional = ''
  } = guia;

  const cnpjContratado = config?.cnpj ? config.cnpj.replace(/\D/g, '') : '20384928000205';
  const nomeContratadoSolicitante = (config?.nome_contratado || 'CLINICA NAO CONFIGURADA').toUpperCase();
  const cnesExecutante = config?.cnes || '0000000';
  const conselhoClinica = config?.conselho_clinica || '06';
  const ufClinica = getCodigoUF(config?.uf_clinica || 'SP');
  const cbosClinica = config?.cbos_clinica || '225125';

  const numeroGuiaPrestador = guia.numero_guia_prestador || gerarNumeroGuiaPrestador(convenio);
  const numeroGuiaOperadora = numero_guia_operadora || gerarNumeroAleatorio(10);
  const dataAutorizacao = data_autorizacao || dataSolicitacao;
  const senha = senha_autorizacao || gerarNumeroAleatorio(9);

  let procedimentosXML = '';
  
  if (itens && itens.length > 0) {
    itens.forEach((item, idx) => {
      const sequencialItem = idx + 1;
      const dataExecucao = item.data_execucao || dataSolicitacao;
      const horaInicial = formatarHora(item.hora_inicial);
      const horaFinal = formatarHora(item.hora_final);
      
      const prestadorNome = item.prestador_nome || 'PROFISSIONAL';
      const prestadorConselho = getCodigoConselho(item.prestador_conselho);
      const prestadorNumeroConselho = item.prestador_numero_conselho || '00000';
      const prestadorUF = getCodigoUF(item.prestador_uf_conselho);
      const prestadorCBOS = item.prestador_cbos || '225125';
      const prestadorCPF = item.prestador_cpf || '00000000000';
      const grauParticipacao = item.grau_participacao || '00';
      
      procedimentosXML += `
            <ans:procedimentoExecutado>
              <ans:sequencialItem>${sequencialItem}</ans:sequencialItem>
              <ans:dataExecucao>${dataExecucao}</ans:dataExecucao>
              <ans:horaInicial>${horaInicial}</ans:horaInicial>
              <ans:horaFinal>${horaFinal}</ans:horaFinal>
              <ans:procedimento>
                <ans:codigoTabela>${item.tabela_referencia || '22'}</ans:codigoTabela>
                <ans:codigoProcedimento>${item.procedimento_codigo}</ans:codigoProcedimento>
                <ans:descricaoProcedimento>${item.procedimento_nome}</ans:descricaoProcedimento>
              </ans:procedimento>
              <ans:quantidadeExecutada>${item.quantidade || 1}</ans:quantidadeExecutada>
              <ans:viaAcesso>1</ans:viaAcesso>
              <ans:tecnicaUtilizada>1</ans:tecnicaUtilizada>
              <ans:reducaoAcrescimo>${item.fator_reducao_acrescimo || '1.00'}</ans:reducaoAcrescimo>
              <ans:valorUnitario>${item.valor_unitario}</ans:valorUnitario>
              <ans:valorTotal>${item.valor_total}</ans:valorTotal>
              <ans:equipeSadt>
                <ans:grauPart>${grauParticipacao}</ans:grauPart>
                <ans:codProfissional>
                  <ans:cpfContratado>${prestadorCPF}</ans:cpfContratado>
                </ans:codProfissional>
                <ans:nomeProf>${prestadorNome}</ans:nomeProf>
                <ans:conselho>${prestadorConselho}</ans:conselho>
                <ans:numeroConselhoProfissional>${prestadorNumeroConselho}</ans:numeroConselhoProfissional>
                <ans:UF>${prestadorUF}</ans:UF>
                <ans:CBOS>${prestadorCBOS}</ans:CBOS>
              </ans:equipeSadt>
            </ans:procedimentoExecutado>`;
    });
  }

  const valorTotal = itens ? itens.reduce((sum, item) => sum + (parseFloat(item.valor_total) || 0), 0) : 0;

  // Versão 4.03.00 tem suporte a novos campos
  const hasCoberturaEspecial = versao >= VERSAO_TISS['4.00.00'];
  const hasSaudeOcupacional = versao >= VERSAO_TISS['4.00.00'];
  const hasDataValidadeSenha = versao >= VERSAO_TISS['4.00.00'];

  const dadosAutorizacao = `
          <ans:dadosAutorizacao>
            <ans:numeroGuiaOperadora>${numeroGuiaOperadora}</ans:numeroGuiaOperadora>
            <ans:dataAutorizacao>${dataAutorizacao}</ans:dataAutorizacao>
            ${hasDataValidadeSenha && data_validade_senha ? `<ans:dataValidadeSenha>${data_validade_senha}</ans:dataValidadeSenha>` : ''}
            <ans:senha>${senha}</ans:senha>
          </ans:dadosAutorizacao>`;

  const coberturaEspecialXML = hasCoberturaEspecial && cobertura_especial ? 
    `<ans:coberturaEspecial>${cobertura_especial}</ans:coberturaEspecial>` : '';

  const saudeOcupacionalXML = hasSaudeOcupacional && saude_ocupacional ? 
    `<ans:saudeOcupacional>${saude_ocupacional}</ans:saudeOcupacional>` : '';

  // Usar os mapeamentos corretos
  const caraterValue = CARATER_ATENDIMENTO[carater_atendimento] || '1';
  const tipoAtendimentoValue = TIPO_ATENDIMENTO[tipo_atendimento] || '04';
  const indicadorAcidenteValue = INDICADOR_ACIDENTE[indicacao_acidente] || '9';
  const tipoConsultaValue = TIPO_CONSULTA[tipo_consulta] || '1';
  const regimeAtendimentoValue = REGIME_ATENDIMENTO[regime_atendimento] || '01';

  return `        <ans:guiaSP-SADT>
          <ans:cabecalhoGuia>
            <ans:registroANS>${registroANS}</ans:registroANS>
            <ans:numeroGuiaPrestador>${numeroGuiaPrestador}</ans:numeroGuiaPrestador>
          </ans:cabecalhoGuia>
          ${dadosAutorizacao}
          <ans:dadosBeneficiario>
            <ans:numeroCarteira>${numeroCarteira || '000000000'}</ans:numeroCarteira>
            <ans:atendimentoRN>N</ans:atendimentoRN>
          </ans:dadosBeneficiario>
          <ans:dadosSolicitante>
            <ans:contratadoSolicitante>
              <ans:cnpjContratado>${cnpjContratado}</ans:cnpjContratado>
            </ans:contratadoSolicitante>
            <ans:nomeContratadoSolicitante>${nomeContratadoSolicitante}</ans:nomeContratadoSolicitante>
            <ans:profissionalSolicitante>
              <ans:nomeProfissional>${nomeProfissionalSolicitante || 'PROFISSIONAL'}</ans:nomeProfissional>
              <ans:conselhoProfissional>${conselhoClinica}</ans:conselhoProfissional>
              <ans:numeroConselhoProfissional>${numeroConselhoProfissionalSolicitante || '00000'}</ans:numeroConselhoProfissional>
              <ans:UF>${ufClinica}</ans:UF>
              <ans:CBOS>${cbosClinica}</ans:CBOS>
            </ans:profissionalSolicitante>
          </ans:dadosSolicitante>
          <ans:dadosSolicitacao>
            <ans:dataSolicitacao>${dataSolicitacao}</ans:dataSolicitacao>
            <ans:caraterAtendimento>${caraterValue}</ans:caraterAtendimento>
          </ans:dadosSolicitacao>
          <ans:dadosExecutante>
            <ans:contratadoExecutante>
              <ans:codigoPrestadorNaOperadora>${codigoPrestadorExecutante}</ans:codigoPrestadorNaOperadora>
            </ans:contratadoExecutante>
            <ans:CNES>${cnesExecutante}</ans:CNES>
          </ans:dadosExecutante>
          <ans:dadosAtendimento>
            <ans:tipoAtendimento>${tipoAtendimentoValue}</ans:tipoAtendimento>
            <ans:indicacaoAcidente>${indicadorAcidenteValue}</ans:indicacaoAcidente>
            <ans:tipoConsulta>${tipoConsultaValue}</ans:tipoConsulta>
            ${coberturaEspecialXML}
            <ans:regimeAtendimento>${regimeAtendimentoValue}</ans:regimeAtendimento>
            ${saudeOcupacionalXML}
          </ans:dadosAtendimento>
          <ans:procedimentosExecutados>
${procedimentosXML}
          </ans:procedimentosExecutados>
          <ans:valorTotal>
            <ans:valorProcedimentos>${valorTotal.toFixed(2)}</ans:valorProcedimentos>
            <ans:valorDiarias>0.00</ans:valorDiarias>
            <ans:valorTaxasAlugueis>0.00</ans:valorTaxasAlugueis>
            <ans:valorMateriais>0.00</ans:valorMateriais>
            <ans:valorMedicamentos>0.00</ans:valorMedicamentos>
            <ans:valorOPME>0.00</ans:valorOPME>
            <ans:valorGasesMedicinais>0.00</ans:valorGasesMedicinais>
            <ans:valorTotalGeral>${valorTotal.toFixed(2)}</ans:valorTotalGeral>
          </ans:valorTotal>
        </ans:guiaSP-SADT>`;
}

export function converterAtendimentoParaTISS(atendimento, convenio) {
  const config = getConfig();
  const numeroCarteira = atendimento.numero_carteira || '000000000';
  const primeiroItem = atendimento.itens && atendimento.itens.length > 0 ? atendimento.itens[0] : null;
  
  return {
    codigoPrestadorExecutante: convenio?.codigo_prestador || config?.codigo_prestador || '002535718',
    numeroCarteira: numeroCarteira,
    nomeBeneficiario: atendimento.paciente_nome || 'PACIENTE',
    numero_guia_operadora: atendimento.numero_guia_operadora || '',
    data_autorizacao: atendimento.data_autorizacao || '',
    data_validade_senha: atendimento.data_validade_senha || '',
    senha_autorizacao: atendimento.senha_autorizacao || '',
    dataSolicitacao: atendimento.data_solicitacao || atendimento.data_atendimento || new Date().toISOString().split('T')[0],
    numero_guia_prestador: atendimento.numero_guia_prestador || '',
    nomeProfissionalSolicitante: atendimento.profissional_solicitante || primeiroItem?.prestador_nome || 'PROFISSIONAL',
    numeroConselhoProfissionalSolicitante: atendimento.numero_conselho_solicitante || primeiroItem?.prestador_numero_conselho || '00000',
    carater_atendimento: atendimento.carater_atendimento || '1',
    tipo_atendimento: atendimento.tipo_atendimento || '04',
    indicacao_acidente: atendimento.indicacao_acidente || '9',
    tipo_consulta: atendimento.tipo_consulta || '1',
    regime_atendimento: atendimento.regime_atendimento || '01',
    cobertura_especial: atendimento.cobertura_especial || '',
    saude_ocupacional: atendimento.saude_ocupacional || '',
    itens: atendimento.itens && atendimento.itens.length > 0 
      ? atendimento.itens.map(item => ({
          procedimento_codigo: item.procedimento_codigo,
          procedimento_nome: item.procedimento_nome,
          quantidade: item.quantidade || 1,
          valor_unitario: item.valor_unitario || 0,
          valor_total: item.valor_total || 0,
          data_execucao: item.data_execucao || atendimento.data_atendimento,
          hora_inicial: item.hora_inicial || '00:00:00',
          hora_final: item.hora_final || '00:00:00',
          tabela_referencia: item.tabela_referencia || '22',
          fator_reducao_acrescimo: item.fator_reducao_acrescimo || 1.00,
          prestador_nome: item.prestador_nome || 'PROFISSIONAL',
          prestador_cpf: item.prestador_cpf || '00000000000',
          prestador_conselho: item.prestador_conselho || 'CRM',
          prestador_numero_conselho: item.prestador_numero_conselho || '00000',
          prestador_uf_conselho: item.prestador_uf_conselho || 'SP',
          prestador_cbos: item.prestador_cbos || '225125',
          grau_participacao: item.grau_participacao || '00'
        }))
      : []
  };
}

/**
 * Gera XML de exemplo para teste conforme versão
 */
export function gerarXMLExemplo(versao = '4.03.00') {
  const dataAtual = new Date().toISOString().split('T')[0];
  const config = getConfig();
  
  const guias = [
    {
      numeroGuiaPrestador: gerarNumeroAleatorio(10),
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
      procedimentos: [
        {
          codigoProcedimento: '01010101',
          descricaoProcedimento: 'CONSULTA MÉDICA',
          valorUnitario: '150.00',
          valorTotal: '150.00',
          nomeProfissional: 'PROFISSIONAL EXEMPLO',
          numeroConselhoProfissional: '12345',
          tabela_referencia: '22',
          grau_participacao: '12'
        }
      ]
    }
  ];

  return gerarXMLTISS({
    versao: versao,
    codigoPrestadorNaOperadora: config?.codigo_prestador || '20.384.928/0002-05',
    registroANS: config?.registro_ans || '421928',
    numeroLote: gerarNumeroLote(),
    guias: guias
  });
}
