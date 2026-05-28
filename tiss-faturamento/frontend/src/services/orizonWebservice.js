import CryptoJS from 'crypto-js';

const TISS_NS = 'http://www.ans.gov.br/padroes/tiss/schemas';
const SOAP_NS = 'http://schemas.xmlsoap.org/soap/envelope/';

export const ORIZON_ENDPOINTS = {
  homologacao: {
    loteGuias: 'https://wsp.hom.orizonbrasil.com.br:6281/fature/tiss/v40300/tissLoteGuias',
    statusProtocolo: 'https://wsp.hom.orizonbrasil.com.br:6281/fature/tiss/v40300/tissSolicitacaoStatusProtocolo',
    cancelaGuia: 'https://wsp.hom.orizonbrasil.com.br:6281/tiss/v40300/tissCancelaGuia',
    comprovantes: 'https://wsp.hom.orizonbrasil.com.br:6280/wsGeraPDF/wsGerarProtocolo',
    demonstrativos: 'https://wsp.hom.orizonbrasil.com.br:6281/fature/tiss/v40300/tissSolicitaDemonstrativo',
    recursoGlosa: 'https://wsp.hom.orizonbrasil.com.br:6281/tiss/v40300/tissEnviaRecursoGlosa',
    statusRecurso: 'https://wsp.hom.orizonbrasil.com.br:6281/tiss/v40300/tissSolicitaStatusRecurso',
    documentos: 'https://tiss-hml-documentos.orizon.com.br/EnvioDocumentosV40300.asmx'
  },
  producao: {
    loteGuias: 'https://wsp.orizonbrasil.com.br:6281/fature/tiss/v40300/tissLoteGuias',
    statusProtocolo: 'https://wsp.orizonbrasil.com.br:6281/fature/tiss/v40300/tissSolicitacaoStatusProtocolo',
    cancelaGuia: 'https://wsp.orizonbrasil.com.br:6281/tiss/v40300/tissCancelaGuia',
    comprovantes: 'https://wsp.orizonbrasil.com.br:6290/gerapdf/wsGerarProtocolo',
    demonstrativos: 'https://wsp.orizonbrasil.com.br:6281/tiss/v40300/tissSolicitaDemonstrativo',
    recursoGlosa: 'https://wsp.orizonbrasil.com.br:6281/tiss/v40300/tissEnviaRecursoGlosa',
    statusRecurso: 'https://wsp.orizonbrasil.com.br:6281/tiss/v40300/tissSolicitaStatusRecurso',
    documentos: 'https://tiss-documentos.orizon.com.br/EnvioDocumentosV40300.asmx'
  }
};

export function normalizarAmbiente(ambiente) {
  return ambiente === 'producao' ? 'producao' : 'homologacao';
}

export function obterEndpointOrizon(ambiente, servico) {
  const env = normalizarAmbiente(ambiente);
  return ORIZON_ENDPOINTS[env][servico];
}

function escapeXML(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&apos;', '"': '&quot;'
  }[char]));
}

export function hashSenhaOrizon(senha) {
  const valor = String(senha || '').trim();
  if (/^[a-f0-9]{32}$/i.test(valor)) return valor.toLowerCase();
  return CryptoJS.MD5(valor).toString();
}

function extrairTag(xml, tag) {
  const match = xml.match(new RegExp(`<(?:\\w+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${tag}>`, 'i'));
  return match?.[1]?.trim() || '';
}

function trocarPrefixoAns(xml) {
  return xml
    .replace(/<\/?ans:/g, (match) => match.replace('ans:', 'sch:'))
    .replace(/xmlns:ans="[^"]*"/g, '')
    .replace(/xmlns:xsi="[^"]*"/g, '')
    .replace(/xsi:schemaLocation="[^"]*"/g, '')
    .replace(/<\?xml[^>]*>\s*/i, '');
}

function inserirLoginSenhaNoCabecalho(cabecalhoXML, login, senhaMD5) {
  const credenciais = `\n    <sch:loginSenhaPrestador>\n      <sch:loginPrestador>${escapeXML(login)}</sch:loginPrestador>\n      <sch:senhaPrestador>${escapeXML(senhaMD5)}</sch:senhaPrestador>\n    </sch:loginSenhaPrestador>`;

  if (/<(?:\w+:)?loginSenhaPrestador[\s>]/i.test(cabecalhoXML)) {
    return cabecalhoXML.replace(
      /<(?:\w+:)?loginSenhaPrestador[\s\S]*?<\/(?:\w+:)?loginSenhaPrestador>/i,
      credenciais.trim()
    );
  }

  return cabecalhoXML.replace(/<\/(?:\w+:)?cabecalho>/i, `${credenciais}\n  </sch:cabecalho>`);
}

export function montarEnvelopeLoteGuias(xmlTiss, credenciais) {
  const cabecalho = trocarPrefixoAns(extrairTag(xmlTiss, 'cabecalho'));
  const loteGuias = trocarPrefixoAns(extrairTag(xmlTiss, 'loteGuias'));
  const hash = extrairTag(xmlTiss, 'hash');
  const cabecalhoComLogin = inserirLoginSenhaNoCabecalho(`<sch:cabecalho>${cabecalho}</sch:cabecalho>`, credenciais.login, credenciais.senhaMD5);

  return `<soapenv:Envelope xmlns:soapenv="${SOAP_NS}" xmlns:sch="${TISS_NS}" xmlns:xd="http://www.w3.org/2000/09/xmldsig#">
  <soapenv:Header/>
  <soapenv:Body>
    <sch:loteGuiasWS>
      ${cabecalhoComLogin}
      <sch:loteGuias>${loteGuias}</sch:loteGuias>
      <sch:hash>${escapeXML(hash)}</sch:hash>
    </sch:loteGuiasWS>
  </soapenv:Body>
</soapenv:Envelope>`;
}

export function montarEnvelopeStatusProtocolo({ codigoPrestador, registroANS, numeroProtocolo, login, senhaMD5, sequencial = 1 }) {
  const now = new Date();
  const data = now.toISOString().slice(0, 10);
  const hora = now.toTimeString().slice(0, 8);
  const corpoSemHash = `<sch:solicitacaoStatusProtocoloWS>
      <sch:cabecalho>
        <sch:identificacaoTransacao>
          <sch:tipoTransacao>SOLIC_STATUS_PROTOCOLO</sch:tipoTransacao>
          <sch:sequencialTransacao>${escapeXML(sequencial)}</sch:sequencialTransacao>
          <sch:dataRegistroTransacao>${data}</sch:dataRegistroTransacao>
          <sch:horaRegistroTransacao>${hora}</sch:horaRegistroTransacao>
        </sch:identificacaoTransacao>
        <sch:origem><sch:identificacaoPrestador><sch:codigoPrestadorNaOperadora>${escapeXML(codigoPrestador)}</sch:codigoPrestadorNaOperadora></sch:identificacaoPrestador></sch:origem>
        <sch:destino><sch:registroANS>${escapeXML(registroANS)}</sch:registroANS></sch:destino>
        <sch:Padrao>4.03.00</sch:Padrao>
        <sch:loginSenhaPrestador><sch:loginPrestador>${escapeXML(login)}</sch:loginPrestador><sch:senhaPrestador>${escapeXML(senhaMD5)}</sch:senhaPrestador></sch:loginSenhaPrestador>
      </sch:cabecalho>
      <sch:solicitacaoStatusProtocolo>
        <sch:dadosPrestador><sch:codigoPrestadorNaOperadora>${escapeXML(codigoPrestador)}</sch:codigoPrestadorNaOperadora></sch:dadosPrestador>
        <sch:numeroProtocolo>${escapeXML(numeroProtocolo)}</sch:numeroProtocolo>
      </sch:solicitacaoStatusProtocolo>`;
  const hash = CryptoJS.SHA1(corpoSemHash.replace(/\s+/g, '').replace(/sch:/g, '')).toString().toUpperCase();

  return `<soapenv:Envelope xmlns:soapenv="${SOAP_NS}" xmlns:sch="${TISS_NS}" xmlns:xd="http://www.w3.org/2000/09/xmldsig#">
  <soapenv:Header/>
  <soapenv:Body>
    ${corpoSemHash}
      <sch:hash>${hash}</sch:hash>
    </sch:solicitacaoStatusProtocoloWS>
  </soapenv:Body>
</soapenv:Envelope>`;
}

async function compactarGzip(texto) {
  if (typeof CompressionStream === 'undefined') {
    return { body: texto, gzip: false };
  }

  const stream = new Blob([texto]).stream().pipeThrough(new CompressionStream('gzip'));
  const buffer = await new Response(stream).arrayBuffer();
  return { body: buffer, gzip: true };
}

async function enviarSOAP(endpoint, envelope, opcoes = {}) {
  const { body, gzip } = opcoes.gzip === false ? { body: envelope, gzip: false } : await compactarGzip(envelope);
  const headers = {
    'Content-Type': 'text/xml; charset=utf-8',
    SOAPAction: opcoes.soapAction || ''
  };
  if (gzip) headers['Content-Encoding'] = 'gzip';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
  }
  return text;
}

function parseSoapFault(xml) {
  const fault = extrairTag(xml, 'faultstring') || extrairTag(xml, 'tissFault');
  return fault ? fault.replace(/\s+/g, ' ').trim() : '';
}

export function interpretarProtocoloRecebimento(xmlResposta) {
  const fault = parseSoapFault(xmlResposta);
  if (fault) return { sucesso: false, erro: fault, xmlResposta };

  return {
    sucesso: true,
    numeroProtocolo: extrairTag(xmlResposta, 'numeroProtocolo'),
    numeroLote: extrairTag(xmlResposta, 'numeroLote'),
    valorTotalProtocolo: extrairTag(xmlResposta, 'valorTotalProtocolo'),
    xmlResposta
  };
}

export function interpretarSituacaoProtocolo(xmlResposta) {
  const fault = parseSoapFault(xmlResposta);
  if (fault) return { sucesso: false, erro: fault, xmlResposta };

  return {
    sucesso: true,
    statusProtocolo: extrairTag(xmlResposta, 'statusProtocolo'),
    numeroProtocolo: extrairTag(xmlResposta, 'numeroProtocolo'),
    numeroLote: extrairTag(xmlResposta, 'numeroLote'),
    valorProcessado: extrairTag(xmlResposta, 'valorProcessado'),
    valorGlosa: extrairTag(xmlResposta, 'valorGlosa'),
    valorLiberado: extrairTag(xmlResposta, 'valorLiberado'),
    xmlResposta
  };
}

export async function enviarLoteGuiasOrizon({ endpoint, xmlTiss, login, senha, gzip = true }) {
  const senhaMD5 = hashSenhaOrizon(senha);
  const envelope = montarEnvelopeLoteGuias(xmlTiss, { login, senhaMD5 });
  const xmlResposta = await enviarSOAP(endpoint, envelope, { gzip });
  return interpretarProtocoloRecebimento(xmlResposta);
}

export async function consultarStatusProtocoloOrizon({ endpoint, codigoPrestador, registroANS, numeroProtocolo, login, senha, gzip = true }) {
  const senhaMD5 = hashSenhaOrizon(senha);
  const envelope = montarEnvelopeStatusProtocolo({ codigoPrestador, registroANS, numeroProtocolo, login, senhaMD5 });
  const xmlResposta = await enviarSOAP(endpoint, envelope, { gzip });
  return interpretarSituacaoProtocolo(xmlResposta);
}

export const STATUS_PROTOCOLO_ORIZON = {
  '1': 'Recebido',
  '2': 'Em análise',
  '4': 'Encerrado sem pagamento',
  '7': 'Não localizado',
  '9': 'Processado pela operadora'
};
