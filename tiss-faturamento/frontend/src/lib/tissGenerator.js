import CryptoJS from 'crypto-js';

// Configuração global (carregada do localStorage)
let configGlobal = null;

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

/**
 * Gera um número aleatório com apenas dígitos
 */
function gerarNumeroAleatorio(tamanho) {
  let numero = '';
  for (let i = 0; i < tamanho; i++) {
    numero += Math.floor(Math.random() * 10);
  }
  return numero;
}

/**
 * Gera número de guia do prestador (APENAS NÚMEROS)
 */
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

/**
 * Gera número de lote com apenas números
 */
function gerarNumeroLote() {
  return '3' + gerarNumeroAleatorio(4) + gerarNumeroAleatorio(4) + gerarNumeroAleatorio(4);
}

/**
 * Formata hora no padrão HH:MM:SS
 */
function formatarHora(hora) {
  if (!hora) return '00:00:00';
  // Se já estiver no formato HH:MM:SS
  if (hora.includes(':')) {
    const partes = hora.split(':');
    while (partes.length < 3) partes.push('00');
    return `${partes[0].padStart(2, '0')}:${partes[1].padStart(2, '0')}:${partes[2].padStart(2, '0')}`;
  }
  // Se for apenas números (HHMMSS)
  if (hora.length === 6) {
    return `${hora.substring(0, 2)}:${hora.substring(2, 4)}:${hora.substring(4, 6)}`;
  }
  // Se for apenas hora e minuto (HHMM)
  if (hora.length === 4) {
    return `${hora.substring(0, 2)}:${hora.substring(2, 4)}:00`;
  }
  return '00:00:00';
}

/**
 * Gera XML TISS 4.02.00 completo no formato ANS
 */
export function gerarXMLTISS(dados) {
  const config = getConfig();
  
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
    guiasXML += gerarGuiaSPSADT(guia, index + 1, registroANS, config, convenio);
  });

  let xml = `<?xml version="1.0" encoding="ISO-8859-1"?>
<ans:mensagemTISS xsi:schemaLocation="http://www.ans.gov.br/padroes/tiss/schemas/tissV4_01_00.xsd" xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
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
    <ans:Padrao>4.01.00</ans:Padrao>
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

/**
 * Gera uma guia SP/SADT com múltiplos procedimentos
 */
function gerarGuiaSPSADT(guia, sequencial, registroANS, config, convenio) {
  const {
    numeroCarteira,
    nomeBeneficiario,
    dataSolicitacao = new Date().toISOString().split('T')[0],
    numero_guia_operadora,
    data_autorizacao,
    senha_autorizacao,
    codigoPrestadorExecutante,
    nomeProfissionalSolicitante,
    numeroConselhoProfissionalSolicitante,
    itens
  } = guia;

  // Dados da clínica/hospital
  const cnpjContratado = config?.cnpj ? config.cnpj.replace(/\D/g, '') : '20384928000205';
  const nomeContratadoSolicitante = (config?.nome_contratado || 'CLINICA NAO CONFIGURADA').toUpperCase();
  const cnesExecutante = config?.cnes || '0000000';
  
  // Dados fixos da estrutura
  const conselhoProfissionalSolicitante = '06';
  const ufConselhoSolicitante = '35';
  const cbosSolicitante = '225125';
  const tipoAtendimento = '04';
  const indicacaoAcidente = '9';
  const tipoConsulta = '4';
  const regimeAtendimento = '04';
  const caraterAtendimento = '2';

  const numeroGuiaPrestador = guia.numero_guia_prestador || gerarNumeroGuiaPrestador(convenio);
  const numeroGuiaOperadora = numero_guia_operadora || gerarNumeroAleatorio(10);
  const dataAutorizacao = data_autorizacao || dataSolicitacao;
  const senha = senha_autorizacao || gerarNumeroAleatorio(9);

  // GERAR MÚLTIPLOS PROCEDIMENTOS COM HORÁRIO NO FORMATO CORRETO
  let procedimentosXML = '';
  
  if (itens && itens.length > 0) {
    itens.forEach((item, idx) => {
      const sequencialItem = idx + 1;
      const dataExecucao = item.data_execucao || dataSolicitacao;
      // Formatar hora no padrão HH:MM:SS
      const horaInicial = formatarHora(item.hora_inicial);
      const horaFinal = formatarHora(item.hora_final);
      
      const prestadorNome = item.prestador_nome || 'PROFISSIONAL';
      const prestadorConselho = item.prestador_conselho || '06';
      const prestadorNumeroConselho = item.prestador_numero_conselho || '00000';
      const prestadorUF = item.prestador_uf_conselho || '35';
      const prestadorCBOS = item.prestador_cbos || '225125';
      const prestadorCPF = item.prestador_cpf || '00000000000';
      const grauParticipacao = item.grau_participacao || '12';
      
      procedimentosXML += `
            <ans:procedimentoExecutado>
              <ans:sequencialItem>${sequencialItem}</ans:sequencialItem>
              <ans:dataExecucao>${dataExecucao}</ans:dataExecucao>
              <ans:horaInicial>${horaInicial}</ans:horaInicial>
              <ans:horaFinal>${horaFinal}</ans:horaFinal>
              <ans:procedimento>
                <ans:codigoTabela>${item.codigoTabela || '98'}</ans:codigoTabela>
                <ans:codigoProcedimento>${item.procedimento_codigo}</ans:codigoProcedimento>
                <ans:descricaoProcedimento>${item.procedimento_nome}</ans:descricaoProcedimento>
              </ans:procedimento>
              <ans:quantidadeExecutada>${item.quantidade || 1}</ans:quantidadeExecutada>
              <ans:viaAcesso>1</ans:viaAcesso>
              <ans:tecnicaUtilizada>1</ans:tecnicaUtilizada>
              <ans:reducaoAcrescimo>1.00</ans:reducaoAcrescimo>
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

  return `        <ans:guiaSP-SADT>
          <ans:cabecalhoGuia>
            <ans:registroANS>${registroANS}</ans:registroANS>
            <ans:numeroGuiaPrestador>${numeroGuiaPrestador}</ans:numeroGuiaPrestador>
          </ans:cabecalhoGuia>
          <ans:dadosAutorizacao>
            <ans:numeroGuiaOperadora>${numeroGuiaOperadora}</ans:numeroGuiaOperadora>
            <ans:dataAutorizacao>${dataAutorizacao}</ans:dataAutorizacao>
            <ans:senha>${senha}</ans:senha>
          </ans:dadosAutorizacao>
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
              <ans:conselhoProfissional>${conselhoProfissionalSolicitante}</ans:conselhoProfissional>
              <ans:numeroConselhoProfissional>${numeroConselhoProfissionalSolicitante || '00000'}</ans:numeroConselhoProfissional>
              <ans:UF>${ufConselhoSolicitante}</ans:UF>
              <ans:CBOS>${cbosSolicitante}</ans:CBOS>
            </ans:profissionalSolicitante>
          </ans:dadosSolicitante>
          <ans:dadosSolicitacao>
            <ans:dataSolicitacao>${dataSolicitacao}</ans:dataSolicitacao>
            <ans:caraterAtendimento>${caraterAtendimento}</ans:caraterAtendimento>
          </ans:dadosSolicitacao>
          <ans:dadosExecutante>
            <ans:contratadoExecutante>
              <ans:codigoPrestadorNaOperadora>${codigoPrestadorExecutante}</ans:codigoPrestadorNaOperadora>
            </ans:contratadoExecutante>
            <ans:CNES>${cnesExecutante}</ans:CNES>
          </ans:dadosExecutante>
          <ans:dadosAtendimento>
            <ans:tipoAtendimento>${tipoAtendimento}</ans:tipoAtendimento>
            <ans:indicacaoAcidente>9</ans:indicacaoAcidente>
            <ans:tipoConsulta>4</ans:tipoConsulta>
            <ans:regimeAtendimento>${regimeAtendimento}</ans:regimeAtendimento>
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

/**
 * Converte atendimento para o formato de guia TISS
 */
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
    senha_autorizacao: atendimento.senha_autorizacao || '',
    dataSolicitacao: atendimento.data_atendimento || new Date().toISOString().split('T')[0],
    numero_guia_prestador: atendimento.numero_guia_prestador || '',
    nomeProfissionalSolicitante: primeiroItem?.prestador_nome || atendimento.prestador_nome || 'PROFISSIONAL',
    numeroConselhoProfissionalSolicitante: primeiroItem?.prestador_numero_conselho || atendimento.prestador_numero_conselho || '00000',
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
          prestador_nome: item.prestador_nome || 'PROFISSIONAL',
          prestador_cpf: item.prestador_cpf || '00000000000',
          prestador_conselho: item.prestador_conselho || '06',
          prestador_numero_conselho: item.prestador_numero_conselho || '00000',
          prestador_uf_conselho: item.prestador_uf_conselho || '35',
          prestador_cbos: item.prestador_cbos || '225125',
          grau_participacao: item.grau_participacao || '12'
        }))
      : []
  };
}