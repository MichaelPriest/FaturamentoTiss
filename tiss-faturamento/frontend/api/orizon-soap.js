import zlib from 'node:zlib';


function getBody(req) {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body || {};
}

function isEndpointPermitido(endpoint) {
  try {
    const url = new URL(endpoint);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { endpoint, envelope, gzip = true, soapAction = '' } = getBody(req);

  if (!endpoint || !envelope) {
    return res.status(400).json({ error: 'Endpoint e envelope SOAP são obrigatórios.' });
  }

  if (!isEndpointPermitido(endpoint)) {
    return res.status(400).json({ error: 'Endpoint inválido. Informe uma URL http(s) válida para o convênio.' });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const body = gzip ? zlib.gzipSync(Buffer.from(envelope, 'utf8')) : envelope;
    const headers = {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: soapAction
    };
    if (gzip) headers['Content-Encoding'] = 'gzip';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal
    });

    const text = await response.text();
    return res.status(response.ok ? 200 : response.status).json({
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      text
    });
  } catch (error) {
    const isAbort = error?.name === 'AbortError';
    return res.status(isAbort ? 504 : 502).json({
      error: isAbort
        ? 'Tempo limite ao comunicar com o WebService do convênio.'
        : 'Falha de rede ao comunicar com o WebService do convênio pelo proxy do servidor.',
      detail: error?.message || String(error),
      code: error?.code || error?.cause?.code || null
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
