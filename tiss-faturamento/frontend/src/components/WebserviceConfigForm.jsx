import { obterEndpointOrizon } from '../services/orizonWebservice';

export const WEBSERVICE_DEFAULT_CONFIG = {
  webservice_provider: 'orizon',
  ambiente_orizon: 'homologacao',
  url_webservice: '',
  url_status_protocolo_orizon: '',
  usuario_webservice: '',
  senha_webservice: '',
  chave_transmissao_orizon: '',
  certificado_serial_orizon: '',
  certificado_obrigatorio: false,
  retorno_automatico: false,
  observacoes_webservice: ''
};

export function aplicarEndpointsPadraoOrizon(config, ambiente = 'homologacao') {
  return {
    ...config,
    webservice_provider: 'orizon',
    ambiente_orizon: ambiente,
    url_webservice: obterEndpointOrizon(ambiente, 'loteGuias'),
    url_status_protocolo_orizon: obterEndpointOrizon(ambiente, 'statusProtocolo')
  };
}

export default function WebserviceConfigForm({ config, setConfig, convenioData, setConvenioData }) {
  const form = { ...WEBSERVICE_DEFAULT_CONFIG, ...(config || {}) };
  const isOrizon = form.webservice_provider === 'orizon';

  const atualizarCampo = (campo, valor) => {
    setConfig(prev => ({ ...prev, [campo]: valor }));
  };

  const aplicarEndpoints = (ambiente = form.ambiente_orizon || convenioData?.ambiente || 'homologacao') => {
    const atualizada = aplicarEndpointsPadraoOrizon(form, ambiente);
    setConfig(prev => ({ ...prev, ...atualizada }));
    setConvenioData?.(prev => ({
      ...prev,
      ambiente,
      url_webservice: atualizada.url_webservice
    }));
  };

  const alterarAmbiente = (ambiente) => {
    atualizarCampo('ambiente_orizon', ambiente);
    setConvenioData?.(prev => ({ ...prev, ambiente }));
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          Configure os endpoints exatamente como fornecidos para este convênio. Cada convênio pode ter URLs próprias para envio, status e demais métodos; para Orizon, a chave é enviada em MD5 automaticamente quando necessário.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Integrador / WebService</label>
          <select
            value={form.webservice_provider}
            onChange={e => atualizarCampo('webservice_provider', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="orizon">Orizon TISS 4.03.00</option>
            <option value="tiss_generico">TISS / SOAP Genérico</option>
            <option value="portal">Portal do Convênio</option>
            <option value="manual">Manual / Sem WebService</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ambiente</label>
          <select
            value={form.ambiente_orizon}
            onChange={e => alterarAmbiente(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="homologacao">Homologação</option>
            <option value="producao">Produção</option>
          </select>
        </div>

        {isOrizon && (
          <div className="md:col-span-2 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              Use os endpoints específicos informados pela operadora/Orizon para este convênio. O botão ao lado é apenas um modelo inicial e pode precisar ser alterado.
            </p>
            <button type="button" onClick={() => aplicarEndpoints()} className="bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-yellow-700 whitespace-nowrap">
              Preencher modelo Orizon
            </button>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Endpoint deste convênio - Envio Lote Guias</label>
          <input
            type="text"
            value={form.url_webservice}
            onChange={e => {
              atualizarCampo('url_webservice', e.target.value);
              setConvenioData?.(prev => ({ ...prev, url_webservice: e.target.value }));
            }}
            className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
            placeholder="Cole a URL fornecida para este convênio"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Endpoint deste convênio - Status Protocolo</label>
          <input
            type="text"
            value={form.url_status_protocolo_orizon}
            onChange={e => atualizarCampo('url_status_protocolo_orizon', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
            placeholder="Cole a URL de status fornecida para este convênio"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Login / Usuário WebService</label>
          <input
            type="text"
            value={form.usuario_webservice}
            onChange={e => atualizarCampo('usuario_webservice', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
            autoComplete="off"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chave/Senha de transmissão</label>
          <input
            type="password"
            value={form.senha_webservice}
            onChange={e => setConfig(prev => ({
              ...prev,
              senha_webservice: e.target.value,
              chave_transmissao_orizon: e.target.value
            }))}
            className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
            placeholder="Será enviada como MD5 quando Orizon"
            autoComplete="new-password"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nº de série do certificado</label>
          <input
            type="text"
            value={form.certificado_serial_orizon}
            onChange={e => atualizarCampo('certificado_serial_orizon', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
            placeholder="Opcional / ICP-Brasil"
          />
        </div>

        <div className="flex items-center gap-2 h-full pt-6">
          <input
            type="checkbox"
            checked={form.certificado_obrigatorio}
            onChange={e => atualizarCampo('certificado_obrigatorio', e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600"
          />
          <label className="text-sm text-gray-700 dark:text-gray-300">Exige certificado digital na transmissão</label>
        </div>

        <div className="flex items-center gap-2 h-full pt-2">
          <input
            type="checkbox"
            checked={form.retorno_automatico}
            onChange={e => atualizarCampo('retorno_automatico', e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600"
          />
          <label className="text-sm text-gray-700 dark:text-gray-300">Consultar retorno/status automaticamente</label>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
          <textarea
            rows="3"
            value={form.observacoes_webservice}
            onChange={e => atualizarCampo('observacoes_webservice', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
            placeholder="Informe particularidades do convênio, certificado, homologação ou contato operacional."
          />
        </div>
      </div>
    </div>
  );
}
