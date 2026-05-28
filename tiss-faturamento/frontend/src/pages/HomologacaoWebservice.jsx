import { useEffect, useMemo, useState } from 'react';
import { BeakerIcon, CheckCircleIcon, ExclamationTriangleIcon, LinkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import { useUnidade } from '../contexts/UnidadeContext';
import { filterByUnidade } from '../services/unidadesService';
import { WEBSERVICE_DEFAULT_CONFIG, aplicarEndpointsPadraoOrizon } from '../components/WebserviceConfigForm';
import { consultarStatusProtocoloOrizon, enviarLoteGuiasOrizon } from '../services/orizonWebservice';

const XML_EXEMPLO = `<?xml version="1.0" encoding="UTF-8"?>
<ans:mensagemTISS xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas">
  <ans:cabecalho>
    <ans:identificacaoTransacao>
      <ans:tipoTransacao>ENVIO_LOTE_GUIAS</ans:tipoTransacao>
      <ans:sequencialTransacao>1</ans:sequencialTransacao>
      <ans:dataRegistroTransacao>2026-05-28</ans:dataRegistroTransacao>
      <ans:horaRegistroTransacao>10:00:00</ans:horaRegistroTransacao>
    </ans:identificacaoTransacao>
    <ans:origem><ans:identificacaoPrestador><ans:codigoPrestadorNaOperadora>CODIGO_PRESTADOR</ans:codigoPrestadorNaOperadora></ans:identificacaoPrestador></ans:origem>
    <ans:destino><ans:registroANS>REGISTRO_ANS</ans:registroANS></ans:destino>
    <ans:Padrao>4.03.00</ans:Padrao>
  </ans:cabecalho>
  <ans:prestadorParaOperadora>
    <ans:loteGuias>
      <ans:numeroLote>1</ans:numeroLote>
      <ans:guiasTISS></ans:guiasTISS>
    </ans:loteGuias>
  </ans:prestadorParaOperadora>
  <ans:epilogo><ans:hash></ans:hash></ans:epilogo>
</ans:mensagemTISS>`;

function mascarar(valor) {
  if (!valor) return '-';
  if (valor.length <= 6) return '••••';
  return `${valor.slice(0, 2)}••••${valor.slice(-2)}`;
}

export default function HomologacaoWebservice() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { unidadeAtualId } = useUnidade();
  const [loading, setLoading] = useState(true);
  const [executando, setExecutando] = useState(false);
  const [convenios, setConvenios] = useState([]);
  const [convenioSelecionado, setConvenioSelecionado] = useState(null);
  const [config, setConfig] = useState(WEBSERVICE_DEFAULT_CONFIG);
  const [numeroProtocolo, setNumeroProtocolo] = useState('99999999');
  const [xmlTeste, setXmlTeste] = useState(XML_EXEMPLO);
  const [resultado, setResultado] = useState(null);

  const configHomologacao = useMemo(() => {
    if (config.url_webservice || config.url_status_protocolo_orizon) return config;
    return aplicarEndpointsPadraoOrizon(config, 'homologacao');
  }, [config]);

  useEffect(() => {
    carregarConvenios();
  }, [unidadeAtualId]);

  const carregarConvenios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('convenios')
        .select('*')
        .order('razao_social', { ascending: true });

      if (error) throw error;
      const lista = filterByUnidade(data || [], unidadeAtualId);
      setConvenios(lista);
      if (lista.length > 0) await selecionarConvenio(lista[0]);
    } catch (error) {
      console.error('Erro ao carregar convênios para homologação:', error);
      toast.error('Erro ao carregar convênios');
    } finally {
      setLoading(false);
    }
  };

  const selecionarConvenio = async (convenio) => {
    setConvenioSelecionado(convenio);
    setResultado(null);
    try {
      const { data, error } = await supabase
        .from('convenios_config')
        .select('*')
        .eq('convenio_id', convenio.id)
        .maybeSingle();

      if (error) throw error;
      const parsed = data?.configuracoes ? JSON.parse(data.configuracoes) : {};
      setConfig({
        ...WEBSERVICE_DEFAULT_CONFIG,
        ...parsed,
        ambiente_orizon: 'homologacao',
        url_webservice: parsed.url_webservice || convenio.url_webservice || '',
        usuario_webservice: parsed.usuario_webservice || '',
        senha_webservice: parsed.senha_webservice || parsed.chave_transmissao_orizon || convenio.senha_prestador || ''
      });
      setXmlTeste(XML_EXEMPLO
        .replace('CODIGO_PRESTADOR', convenio.codigo_prestador || 'CODIGO_PRESTADOR')
        .replace('REGISTRO_ANS', convenio.registro_ans || 'REGISTRO_ANS'));
    } catch (error) {
      console.error('Erro ao carregar configuração do convênio:', error);
      toast.error('Erro ao carregar configuração do convênio');
    }
  };

  const validarConfiguracao = (tipo) => {
    if (!convenioSelecionado) throw new Error('Selecione um convênio para homologação.');
    if (!configHomologacao.usuario_webservice || !configHomologacao.senha_webservice) {
      throw new Error('Informe login e chave/senha na página WebService do convênio antes de testar.');
    }
    if (tipo === 'status' && !configHomologacao.url_status_protocolo_orizon) {
      throw new Error('Informe o endpoint de status de homologação do convênio.');
    }
    if (tipo === 'lote' && !configHomologacao.url_webservice) {
      throw new Error('Informe o endpoint de envio de lote de homologação do convênio.');
    }
    if (!convenioSelecionado.codigo_prestador || !convenioSelecionado.registro_ans) {
      throw new Error('Convênio precisa de código de prestador e registro ANS para montar a mensagem de teste.');
    }
  };

  const registrarResultado = ({ sucesso, tipo, endpoint, resposta, erro }) => {
    setResultado({
      sucesso,
      tipo,
      endpoint,
      resposta,
      erro,
      data: new Date().toISOString()
    });
  };

  const testarStatus = async () => {
    setExecutando(true);
    try {
      validarConfiguracao('status');
      const resposta = await consultarStatusProtocoloOrizon({
        endpoint: configHomologacao.url_status_protocolo_orizon,
        codigoPrestador: convenioSelecionado.codigo_prestador,
        registroANS: convenioSelecionado.registro_ans,
        numeroProtocolo,
        login: configHomologacao.usuario_webservice,
        senha: configHomologacao.senha_webservice,
        proxyUrl: configHomologacao.proxy_url_webservice
      });

      registrarResultado({
        sucesso: resposta.sucesso,
        tipo: 'Consulta de status de protocolo',
        endpoint: configHomologacao.url_status_protocolo_orizon,
        resposta
      });
      toast[resposta.sucesso ? 'success' : 'warning']('Teste de status executado. Verifique o retorno.');
    } catch (error) {
      registrarResultado({
        sucesso: false,
        tipo: 'Consulta de status de protocolo',
        endpoint: configHomologacao.url_status_protocolo_orizon,
        erro: error.message
      });
      toast.error(`Falha no teste de homologação: ${error.message}`, { duration: 12000 });
    } finally {
      setExecutando(false);
    }
  };

  const enviarXmlTeste = async () => {
    setExecutando(true);
    try {
      validarConfiguracao('lote');
      const resposta = await enviarLoteGuiasOrizon({
        endpoint: configHomologacao.url_webservice,
        xmlTiss: xmlTeste,
        login: configHomologacao.usuario_webservice,
        senha: configHomologacao.senha_webservice,
        proxyUrl: configHomologacao.proxy_url_webservice
      });

      registrarResultado({
        sucesso: resposta.sucesso,
        tipo: 'Envio de lote XML de homologação',
        endpoint: configHomologacao.url_webservice,
        resposta
      });
      toast[resposta.sucesso ? 'success' : 'warning']('Envio de XML de teste executado. Verifique o retorno.');
    } catch (error) {
      registrarResultado({
        sucesso: false,
        tipo: 'Envio de lote XML de homologação',
        endpoint: configHomologacao.url_webservice,
        erro: error.message
      });
      toast.error(`Falha no envio de teste: ${error.message}`, { duration: 12000 });
    } finally {
      setExecutando(false);
    }
  };

  const endpointLote = configHomologacao.url_webservice || '-';
  const endpointStatus = configHomologacao.url_status_protocolo_orizon || '-';

  return (
    <div className={`space-y-6 ${darkMode ? 'dark' : ''}`}>
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <BeakerIcon className="w-9 h-9" />
          <div>
            <h2 className="text-2xl font-bold">Homologação WebService TISS</h2>
            <p className="text-blue-100 text-sm">Teste endpoints, credenciais, proxy e retorno da Orizon antes de enviar lotes reais.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2"><LinkIcon className="w-5 h-5 text-blue-600" /> Convênio em teste</h3>
          {loading ? (
            <div className="py-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
          ) : (
            <select
              value={convenioSelecionado?.id || ''}
              onChange={e => {
                const convenio = convenios.find(c => c.id === parseInt(e.target.value, 10));
                if (convenio) selecionarConvenio(convenio);
              }}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="" disabled>Selecione...</option>
              {convenios.map(convenio => (
                <option key={convenio.id} value={convenio.id}>{convenio.razao_social}</option>
              ))}
            </select>
          )}

          <div className="text-xs space-y-2 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <p><strong>Ambiente:</strong> Homologação</p>
            <p><strong>Código prestador:</strong> {convenioSelecionado?.codigo_prestador || '-'}</p>
            <p><strong>Registro ANS:</strong> {convenioSelecionado?.registro_ans || '-'}</p>
            <p><strong>Login:</strong> {configHomologacao.usuario_webservice || '-'}</p>
            <p><strong>Chave:</strong> {mascarar(configHomologacao.senha_webservice)}</p>
            <p><strong>Proxy:</strong> {configHomologacao.proxy_url_webservice || '/api/orizon-soap'}</p>
          </div>

          <button
            onClick={() => convenioSelecionado && navigate(`/convenio-webservice/${convenioSelecionado.id}`)}
            disabled={!convenioSelecionado}
            className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Configurar WebService do convênio
          </button>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">Endpoint envio lote</p>
              <p className="break-all text-gray-600 dark:text-gray-300">{endpointLote}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">Endpoint status protocolo</p>
              <p className="break-all text-gray-600 dark:text-gray-300">{endpointStatus}</p>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-gray-800 dark:text-white">1. Teste rápido: consulta de status</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Use um protocolo real de homologação quando disponível. Com protocolo fictício, o teste ainda ajuda a identificar conexão, credenciais e SOAP Fault.</p>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={numeroProtocolo}
                onChange={e => setNumeroProtocolo(e.target.value)}
                className="flex-1 border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Número de protocolo de homologação"
              />
              <button
                onClick={testarStatus}
                disabled={executando}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {executando ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <CheckCircleIcon className="w-5 h-5" />}
                Testar status
              </button>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-gray-800 dark:text-white">2. Envio XML de homologação</h3>
            <p className="text-xs text-amber-700 dark:text-amber-300">Cole um XML TISS válido de homologação. Não use dados reais de pacientes nesta tela.</p>
            <textarea
              rows="12"
              value={xmlTeste}
              onChange={e => setXmlTeste(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-xs font-mono dark:bg-gray-900 dark:border-gray-700 dark:text-green-300"
            />
            <button
              onClick={enviarXmlTeste}
              disabled={executando}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {executando ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <PaperAirplaneIcon className="w-5 h-5" />}
              Enviar XML de teste
            </button>
          </div>
        </div>
      </div>

      {resultado && (
        <div className={`rounded-xl border p-5 shadow-sm ${resultado.sucesso ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
          <div className="flex items-center gap-2 mb-3">
            {resultado.sucesso ? <CheckCircleIcon className="w-6 h-6 text-green-600" /> : <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />}
            <h3 className="font-semibold text-gray-800 dark:text-white">Resultado: {resultado.tipo}</h3>
          </div>
          <div className="text-xs text-gray-700 dark:text-gray-200 space-y-1 mb-3">
            <p><strong>Data:</strong> {new Date(resultado.data).toLocaleString('pt-BR')}</p>
            <p><strong>Endpoint:</strong> <span className="break-all">{resultado.endpoint}</span></p>
            {resultado.erro && <p><strong>Erro:</strong> {resultado.erro}</p>}
          </div>
          <pre className="bg-gray-900 text-green-300 text-xs rounded-lg p-4 overflow-auto max-h-96 whitespace-pre-wrap">
            {JSON.stringify(resultado.resposta || { erro: resultado.erro }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
