import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftIcon, CheckCircleIcon, LinkIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import { useUnidade } from '../contexts/UnidadeContext';
import { applyUnidadeToPayload, filterByUnidade } from '../services/unidadesService';
import WebserviceConfigForm, { WEBSERVICE_DEFAULT_CONFIG } from '../components/WebserviceConfigForm';

export default function WebserviceConfig() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { unidadeAtualId } = useUnidade();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [convenios, setConvenios] = useState([]);
  const [convenioSelecionado, setConvenioSelecionado] = useState(null);
  const [configOriginal, setConfigOriginal] = useState({});
  const [config, setConfig] = useState(WEBSERVICE_DEFAULT_CONFIG);
  const [convenioData, setConvenioData] = useState({ ambiente: 'homologacao', url_webservice: '' });

  const convenioId = useMemo(() => {
    const parsed = parseInt(id, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }, [id]);

  useEffect(() => {
    carregarConvenios();
  }, [unidadeAtualId]);

  useEffect(() => {
    if (convenios.length === 0) return;
    const selecionado = convenioId
      ? convenios.find(c => c.id === convenioId)
      : convenios[0];

    if (selecionado) selecionarConvenio(selecionado);
  }, [convenios, convenioId]);

  const carregarConvenios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('convenios')
        .select('*')
        .order('razao_social', { ascending: true });

      if (error) throw error;
      setConvenios(filterByUnidade(data || [], unidadeAtualId));
    } catch (error) {
      console.error('Erro ao carregar convênios:', error);
      toast.error('Erro ao carregar convênios');
    } finally {
      setLoading(false);
    }
  };

  const selecionarConvenio = async (convenio) => {
    setConvenioSelecionado(convenio);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('convenios_config')
        .select('*')
        .eq('convenio_id', convenio.id)
        .maybeSingle();

      if (error) throw error;

      const parsed = data?.configuracoes ? JSON.parse(data.configuracoes) : {};
      setConfigOriginal(parsed);
      setConfig({
        ...WEBSERVICE_DEFAULT_CONFIG,
        ...parsed,
        ambiente_orizon: parsed.ambiente_orizon || convenio.ambiente || 'homologacao',
        url_webservice: parsed.url_webservice || convenio.url_webservice || ''
      });
      setConvenioData({
        ambiente: convenio.ambiente || parsed.ambiente_orizon || 'homologacao',
        url_webservice: convenio.url_webservice || parsed.url_webservice || ''
      });
    } catch (error) {
      console.error('Erro ao carregar configuração do webservice:', error);
      toast.error('Erro ao carregar configuração do webservice');
    } finally {
      setLoading(false);
    }
  };

  const salvar = async () => {
    if (!convenioSelecionado) return;

    setSaving(true);
    try {
      const configuracoes = {
        ...configOriginal,
        ...config,
        forma_envio: config.webservice_provider === 'manual' ? 'manual' : 'webservice'
      };

      const { error: convenioError } = await supabase
        .from('convenios')
        .update(applyUnidadeToPayload({
          ambiente: convenioData.ambiente || config.ambiente_orizon,
          url_webservice: config.url_webservice || convenioData.url_webservice,
          updated_at: new Date().toISOString()
        }, unidadeAtualId))
        .eq('id', convenioSelecionado.id);

      if (convenioError) throw convenioError;

      const { error: configError } = await supabase
        .from('convenios_config')
        .upsert(applyUnidadeToPayload({
          convenio_id: convenioSelecionado.id,
          configuracoes: JSON.stringify(configuracoes),
          updated_at: new Date().toISOString()
        }, unidadeAtualId), { onConflict: 'convenio_id' });

      if (configError) throw configError;

      setConfigOriginal(configuracoes);
      toast.success('Configuração do WebService salva com sucesso!');
      await carregarConvenios();
    } catch (error) {
      console.error('Erro ao salvar configuração do webservice:', error);
      toast.error('Erro ao salvar configuração do WebService');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/convenios')} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <LinkIcon className="w-6 h-6 text-blue-600" /> Configuração de WebService
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Cadastre endpoints e credenciais para qualquer convênio.</p>
            </div>
          </div>
          <button
            onClick={salvar}
            disabled={saving || !convenioSelecionado}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <CheckCircleIcon className="w-5 h-5" />}
            Salvar
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 mb-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Convênio</label>
          <select
            value={convenioSelecionado?.id || ''}
            onChange={e => {
              const convenio = convenios.find(c => c.id === parseInt(e.target.value, 10));
              if (convenio) selecionarConvenio(convenio);
            }}
            className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="" disabled>Selecione um convênio...</option>
            {convenios.map(convenio => (
              <option key={convenio.id} value={convenio.id}>{convenio.razao_social} - ANS {convenio.registro_ans || 'sem ANS'}</option>
            ))}
          </select>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : convenioSelecionado ? (
            <WebserviceConfigForm
              config={config}
              setConfig={setConfig}
              convenioData={convenioData}
              setConvenioData={setConvenioData}
            />
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">Nenhum convênio disponível para configurar.</p>
          )}
        </div>
      </div>
    </div>
  );
}
