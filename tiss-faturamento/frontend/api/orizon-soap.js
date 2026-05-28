import http from 'node:http';
import https from 'node:https';
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

function montarOpcoes(endpoint, headers) {
  const url = new URL(endpoint);
  const isHttps = url.protocol === 'https:';
  const options = {
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port || (isHttps ? 443 : 80),
    path: `${url.pathname}${url.search}`,
    method: 'POST',
    headers,
    timeout: 60000
  };

  if (isHttps) {
    options.rejectUnauthorized = process.env.ORIZON_TLS_REJECT_UNAUTHORIZED !== 'false';
    if (process.env.ORIZON_CLIENT_PFX_BASE64) {
      options.pfx = Buffer.from(process.env.ORIZON_CLIENT_PFX_BASE64, 'base64');
      options.passphrase = process.env.ORIZON_CLIENT_PFX_PASSPHRASE || undefined;
    }
  }

  return { options, transport: isHttps ? https : http };
}

function enviarSoap(endpoint, body, headers) {
  return new Promise((resolve, reject) => {
    const { options, transport } = montarOpcoes(endpoint, headers);
    const request = transport.request(options, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        resolve({
          ok: response.statusCode >= 200 && response.statusCode < 300,
          status: response.statusCode,
          statusText: response.statusMessage,
          text: Buffer.concat(chunks).toString('utf8')
        });
      });
    });

    request.on('timeout', () => request.destroy(new Error('Tempo limite ao comunicar com o WebService do convênio.')));
    request.on('error', reject);
    request.write(body);
    request.end();
  });
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

  try {
    const body = gzip ? zlib.gzipSync(Buffer.from(envelope, 'utf8')) : envelope;
    const headers = {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: soapAction,
      'Content-Length': Buffer.byteLength(body)
    };
    if (gzip) headers['Content-Encoding'] = 'gzip';

    const response = await enviarSoap(endpoint, body, headers);
    return res.status(200).json(response);
  } catch (error) {
    const code = error?.code || error?.cause?.code || null;
    const detail = [code, error?.message || String(error)].filter(Boolean).join(' - ');
    return res.status(200).json({
      ok: false,
      status: 0,
      statusText: 'NETWORK_ERROR',
      error: 'Falha de rede ao comunicar com o WebService do convênio pelo proxy do servidor. Verifique certificado A1/mTLS, liberação de IP do servidor, porta do endpoint e se a URL pertence ao convênio correto.',
      detail,
      code
    });
  }
}
