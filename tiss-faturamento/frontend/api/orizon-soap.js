import https from 'node:https';
import { promises as dns } from 'node:dns';
import net from 'node:net';
import zlib from 'node:zlib';

const MAX_ENVELOPE_BYTES = 2 * 1024 * 1024;
const MAX_RESPONSE_BYTES = 10 * 1024 * 1024;

function getBody(req) {
  if (typeof req.body !== 'string') return req.body || {};
  try { return JSON.parse(req.body); } catch { return {}; }
}

function isPrivateIp(address) {
  if (net.isIPv4(address)) {
    const [a, b] = address.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  const value = address.toLowerCase();
  return value === '::1' || value === '::' || value.startsWith('fc') || value.startsWith('fd') || value.startsWith('fe8') || value.startsWith('fe9') || value.startsWith('fea') || value.startsWith('feb') || value.startsWith('::ffff:127.') || value.startsWith('::ffff:10.') || value.startsWith('::ffff:192.168.');
}

async function validarEndpoint(endpoint) {
  const url = new URL(endpoint);
  if (url.protocol !== 'https:') throw new Error('Somente endpoints HTTPS são permitidos.');
  if (url.username || url.password) throw new Error('Credenciais não são permitidas na URL.');

  const allowedHosts = String(process.env.ORIZON_ALLOWED_HOSTS || 'wsp.hom.orizonbrasil.com.br,wsp.orizonbrasil.com.br,tiss-hml-documentos.orizon.com.br,tiss-documentos.orizon.com.br')
    .split(',').map((host) => host.trim().toLowerCase()).filter(Boolean);
  if (!allowedHosts.length || !allowedHosts.includes(url.hostname.toLowerCase())) {
    throw new Error('O domínio do WebService não está autorizado no servidor.');
  }

  const addresses = await dns.lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) {
    throw new Error('O endpoint resolve para uma rede não permitida.');
  }
  return url;
}

async function autenticar(req) {
  const authorization = req.headers.authorization || '';
  if (!authorization.startsWith('Bearer ')) return false;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) throw new Error('Autenticação do servidor não configurada.');

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { authorization, apikey: anonKey },
    signal: AbortSignal.timeout(10000)
  });
  return response.ok;
}

function decodeResponse(buffer, encoding = '') {
  const normalized = String(encoding).toLowerCase();
  if (normalized.includes('gzip')) return zlib.gunzipSync(buffer).toString('utf8');
  if (normalized.includes('deflate')) return zlib.inflateSync(buffer).toString('utf8');
  if (normalized.includes('br')) return zlib.brotliDecompressSync(buffer).toString('utf8');
  return buffer.toString('utf8');
}

function enviarSoap(url, body, headers) {
  return new Promise((resolve, reject) => {
    const request = https.request({
      protocol: 'https:', hostname: url.hostname, port: url.port || 443,
      path: `${url.pathname}${url.search}`, method: 'POST', headers, timeout: 60000,
      rejectUnauthorized: process.env.ORIZON_TLS_REJECT_UNAUTHORIZED !== 'false',
      pfx: process.env.ORIZON_CLIENT_PFX_BASE64 ? Buffer.from(process.env.ORIZON_CLIENT_PFX_BASE64, 'base64') : undefined,
      passphrase: process.env.ORIZON_CLIENT_PFX_PASSPHRASE || undefined
    }, (response) => {
      const chunks = [];
      let received = 0;
      response.on('data', (chunk) => {
        received += chunk.length;
        if (received > MAX_RESPONSE_BYTES) {
          response.destroy(new Error('Resposta do WebService excede o limite permitido.'));
          return;
        }
        chunks.push(chunk);
      });
      response.on('end', () => resolve({
        ok: response.statusCode >= 200 && response.statusCode < 300,
        status: response.statusCode,
        statusText: response.statusMessage,
        contentEncoding: response.headers['content-encoding'] || '',
        text: decodeResponse(Buffer.concat(chunks), response.headers['content-encoding'])
      }));
    });
    request.on('timeout', () => request.destroy(new Error('Tempo limite ao comunicar com o WebService.')));
    request.on('error', reject);
    request.end(body);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  try {
    if (!await autenticar(req)) return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
    const { endpoint, envelope, gzip = true, soapAction = '' } = getBody(req);
    if (!endpoint || typeof envelope !== 'string') return res.status(400).json({ error: 'Endpoint e envelope SOAP são obrigatórios.' });
    if (Buffer.byteLength(envelope, 'utf8') > MAX_ENVELOPE_BYTES) return res.status(413).json({ error: 'Envelope SOAP excede o limite de 2 MB.' });

    const url = await validarEndpoint(endpoint);
    const body = gzip ? zlib.gzipSync(Buffer.from(envelope, 'utf8')) : Buffer.from(envelope, 'utf8');
    const headers = { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: String(soapAction), 'Content-Length': body.length };
    if (gzip) headers['Content-Encoding'] = 'gzip';
    return res.status(200).json(await enviarSoap(url, body, headers));
  } catch (error) {
    const isValidation = error instanceof TypeError || /permitid|autorizado|HTTPS|URL/.test(error.message);
    return res.status(isValidation ? 400 : 502).json({ ok: false, error: error.message || 'Falha ao comunicar com o WebService.' });
  }
};
