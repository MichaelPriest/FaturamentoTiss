import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  DocumentArrowDownIcon, 
  PaperAirplaneIcon, 
  BuildingOfficeIcon, 
  ArrowPathIcon,
  TrashIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentPlusIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { supabase } from '../lib/supabaseClient';
import { gerarXMLTISS, converterAtendimentoParaTISS, setVersao, VERSAO_TISS } from '../lib/tissGenerator';

// Constantes para o componente
const MAX_GUIAS_POR_LOTE = 100;

export default function Faturamento() {
  const [atendimentos, setAtendimentos] = useState([]);
  const [convenios, setConvenios] = useState([]);
  const [selecionados, setSelecionados] = useState([]);
  const [gerando, setGerando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guiasGeradas, setGuiasGeradas] = useState([]);
  const [filtroConvenio, setFiltroConvenio] = useState('todos');
  const [versaoTISS, setVersaoTISS] = useState('4.03.00');
  const [showLoteModal, setShowLoteModal] = useState(false);
  const [selectedLote, setSelectedLote] = useState(null);

  useEffect(() => {
    carregarDados();
    carregarVersao();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Carregar atendimentos pendentes
      const { data: atendimentosData, error: atendimentosError } = await supabase
        .from('atendimentos')
        .select('*')
        .eq('status', 'pendente')
        .order('created_at', { ascending: false });

      if (atendimentosError) throw atendimentosError;

      // Carregar convênios
      const { data: conveniosData, error: conveniosError } = await supabase
        .from('convenios')
        .select('*')
        .eq('ativo', true)
        .order('razao_social');

      if (conveniosError) throw conveniosError;

      setAtendimentos(atendimentosData || []);
      setConvenios(conveniosData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do Supabase');
    } finally {
      setLoading(false);
    }
  };

  const carregarVersao = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'versao_tiss')
        .maybeSingle();

      if (!error && data) {
        const versao = data.valor || '4.03.00';
        setVersaoTISS(versao);
        setVersao(versao);
      }
    } catch (error) {
      console.error('Erro ao carregar versão:', error);
    }
  };

  const salvarLote = async (lote) => {
    try {
      const { data, error } = await supabase
        .from('lotes_faturamento')
        .insert([lote])
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Erro ao salvar lote:', error);
      return null;
    }
  };

  const carregarLotes = async () => {
    try {
      const { data, error } = await supabase
        .from('lotes_faturamento')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGuiasGeradas(data || []);
    } catch (error) {
      console.error('Erro ao carregar lotes:', error);
    }
  };

  const atualizarStatusAtendimentos = async (ids, status) => {
    try {
      const { error } = await supabase
        .from('atendimentos')
        .update({ status, updated_at: new Date().toISOString() })
        .in('id', ids);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      return false;
    }
  };

  const pendentes = atendimentos.filter(a => a.status === 'pendente');
  
  const pendentesPorConvenio = useMemo(() => {
    return pendentes.reduce((acc, a) => {
      const convenioId = a.paciente_convenio_id;
      if (!acc[convenioId]) acc[convenioId] = [];
      acc[convenioId].push(a);
      return acc;
    }, {});
  }, [pendentes]);

  const handleSelectAll = (convenioId, convenioAtendimentos) => {
    const ids = convenioAtendimentos.map(a => a.id);
    if (selecionados.some(id => ids.includes(id))) {
      setSelecionados(selecionados.filter(id => !ids.includes(id)));
    } else {
      if (selecionados.length + ids.length > MAX_GUIAS_POR_LOTE) {
        toast.warning(`Limite de ${MAX_GUIAS_POR_LOTE} guias por lote!`);
        const limite = MAX_GUIAS_POR_LOTE - selecionados.length;
        setSelecionados([...selecionados, ...ids.slice(0, limite)]);
      } else {
        setSelecionados([...selecionados, ...ids]);
      }
    }
  };

  const handleSelectItem = (id) => {
    if (selecionados.includes(id)) {
      setSelecionados(selecionados.filter(i => i !== id));
    } else {
      if (selecionados.length >= MAX_GUIAS_POR_LOTE) {
        toast.warning(`Limite de ${MAX_GUIAS_POR_LOTE} guias por lote atingido!`);
        return;
      }
      setSelecionados([...selecionados, id]);
    }
  };

  const gerarXMLPorConvenio = async (convenioId, atendimentosList) => {
    const convenio = convenios.find(c => c.id === convenioId);
    if (!convenio) {
      toast.error('Convênio não encontrado');
      return;
    }

    if (!convenio.codigo_prestador) {
      toast.error(`Convênio ${convenio.razao_social} não possui código de prestador configurado`);
      return;
    }

    if (atendimentosList.length > MAX_GUIAS_POR_LOTE) {
      toast.warning(`O lote tem ${atendimentosList.length} guias. O limite é ${MAX_GUIAS_POR_LOTE}. Serão geradas apenas as primeiras ${MAX_GUIAS_POR_LOTE}.`);
      atendimentosList = atendimentosList.slice(0, MAX_GUIAS_POR_LOTE);
    }

    setGerando(true);

    const guias = atendimentosList.map(atendimento => ({
      ...converterAtendimentoParaTISS(atendimento, convenio),
      codigoPrestadorExecutante: convenio.codigo_prestador,
      versao: versaoTISS
    }));

    const xml = gerarXMLTISS({
      versao: versaoTISS,
      codigoPrestadorNaOperadora: convenio.codigo_prestador,
      registroANS: convenio.registro_ans,
      guias: guias,
      convenio: convenio
    });

    const novoLote = {
      convenio_id: convenioId,
      convenio_nome: convenio.razao_social,
      numero_lote: `LOTE-${Date.now()}`,
      data_envio: new Date().toISOString().split('T')[0],
      quantidade_guias: atendimentosList.length,
      guias_ids: atendimentosList.map(a => a.id),
      xml_content: xml,
      status: 'gerado',
      versao: versaoTISS,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const loteSalvo = await salvarLote(novoLote);
    if (loteSalvo) {
      await carregarLotes();
    }

    // Atualizar status dos atendimentos
    const ids = atendimentosList.map(a => a.id);
    await atualizarStatusAtendimentos(ids, 'faturado');
    
    // Recarregar atendimentos
    await carregarDados();

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lote_${convenio.registro_ans}_${novoLote.numero_lote}.xml`;
    a.click();
    URL.revokeObjectURL(url);
    
    setSelecionados([]);
    setGerando(false);
    toast.success(`${atendimentosList.length} guia(s) do convênio ${convenio.razao_social} gerada(s)!`);
  };

  const gerarLoteSelecionado = async () => {
    if (selecionados.length === 0) {
      toast.error('Selecione pelo menos uma guia para faturar');
      return;
    }

    const atendimentosSelecionados = pendentes.filter(a => selecionados.includes(a.id));
    const agrupadosPorConvenio = atendimentosSelecionados.reduce((acc, a) => {
      const convenioId = a.paciente_convenio_id;
      if (!acc[convenioId]) acc[convenioId] = [];
      acc[convenioId].push(a);
      return acc;
    }, {});

    for (const [convenioId, lista] of Object.entries(agrupadosPorConvenio)) {
      await gerarXMLPorConvenio(parseInt(convenioId), lista);
    }
  };

  const regenerarLote = async (lote) => {
    if (!confirm(`Deseja regenerar o lote ${lote.numero_lote}? Isso irá recriar o XML.`)) {
      return;
    }

    setGerando(true);
    
    // Buscar atendimentos originais
    const { data: atendimentosOriginais, error } = await supabase
      .from('atendimentos')
      .select('*')
      .in('id', lote.guias_ids || []);

    if (error || !atendimentosOriginais || atendimentosOriginais.length === 0) {
      toast.error('Não foi possível recuperar os atendimentos originais');
      setGerando(false);
      return;
    }

    const convenio = convenios.find(c => c.id === lote.convenio_id);
    if (!convenio) {
      toast.error('Convênio não encontrado');
      setGerando(false);
      return;
    }

    const novasGuias = atendimentosOriginais.map(atendimento => ({
      ...converterAtendimentoParaTISS(atendimento, convenio),
      codigoPrestadorExecutante: convenio.codigo_prestador,
      versao: versaoTISS
    }));

    const xml = gerarXMLTISS({
      versao: versaoTISS,
      codigoPrestadorNaOperadora: convenio.codigo_prestador,
      registroANS: convenio.registro_ans,
      guias: novasGuias,
      convenio: convenio
    });

    const novoLote = {
      ...lote,
      id: undefined,
      numero_lote: `LOTE-${Date.now()}`,
      data_envio: new Date().toISOString().split('T')[0],
      xml_content: xml,
      regenerado: true,
      regenerado_de: lote.numero_lote,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await salvarLote(novoLote);
    await carregarLotes();

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lote_${convenio.registro_ans}_${novoLote.numero_lote}.xml`;
    a.click();
    URL.revokeObjectURL(url);

    setGerando(false);
    toast.success(`Lote ${lote.numero_lote} regenerado com sucesso!`);
  };

  const excluirLote = async (lote) => {
    if (!confirm(`Tem certeza que deseja excluir o lote ${lote.numero_lote}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('lotes_faturamento')
        .delete()
        .eq('id', lote.id);

      if (error) throw error;

      await carregarLotes();
      toast.success('Lote excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir lote:', error);
      toast.error('Erro ao excluir lote');
    }
  };

  const visualizarLote = (lote) => {
    setSelectedLote(lote);
    setShowLoteModal(true);
  };

  const selecionadosPorConvenio = (convenioId) => {
    return selecionados.filter(id => 
      pendentes.find(a => a.id === id && a.paciente_convenio_id === convenioId)
    ).length;
  };

  const totalSelecionados = selecionados.length;
  const totalPendentes = pendentes.length;
  const valorTotalPendente = pendentes.reduce((sum, a) => sum + (a.valor_total || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Faturamento TISS
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Geração de lotes e arquivos XML no padrão TISS
            </p>
          </div>
          <div className="flex gap-2">
            <select 
              value={versaoTISS} 
              onChange={(e) => { setVersaoTISS(e.target.value); setVersao(e.target.value); }}
              className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              <option value="4.01.00">TISS 4.01.00</option>
              <option value="4.02.00">TISS 4.02.00</option>
              <option value="4.03.00">TISS 4.03.00</option>
            </select>
            {totalSelecionados > 0 && (
              <button 
                onClick={gerarLoteSelecionado} 
                disabled={gerando} 
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
                Faturar Selecionados ({totalSelecionados}/{MAX_GUIAS_POR_LOTE})
              </button>
            )}
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{totalPendentes}</p>
              </div>
              <ClockIcon className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Convênios com Pendência</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{Object.keys(pendentesPorConvenio).length}</p>
              </div>
              <BuildingOfficeIcon className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Lotes Gerados</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{guiasGeradas.length}</p>
              </div>
              <DocumentPlusIcon className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Valor Pendente</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">R$ {valorTotalPendente.toFixed(2)}</p>
              </div>
              <CurrencyDollarIcon className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Seletor de Convênio */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button 
            onClick={() => setFiltroConvenio('todos')} 
            className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all duration-200 ${
              filtroConvenio === 'todos' 
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Todos ({totalPendentes})
          </button>
          {convenios.map(c => {
            const count = pendentes.filter(a => a.paciente_convenio_id === c.id).length;
            if (count === 0) return null;
            return (
              <button 
                key={c.id} 
                onClick={() => setFiltroConvenio(c.id.toString())} 
                className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all duration-200 ${
                  filtroConvenio === c.id.toString() 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {c.razao_social} ({count})
              </button>
            );
          })}
        </div>

        {/* Lista de atendimentos por convênio */}
        <div className="space-y-4">
          {Object.entries(pendentesPorConvenio)
            .filter(([convenioId]) => filtroConvenio === 'todos' || filtroConvenio === convenioId)
            .map(([convenioId, convenioAtendimentos]) => {
              const convenio = convenios.find(c => c.id === parseInt(convenioId));
              if (!convenio) return null;
              const selecionadosCount = selecionadosPorConvenio(parseInt(convenioId));
              
              return (
                <div key={convenioId} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={selecionadosCount === convenioAtendimentos.length && convenioAtendimentos.length > 0}
                        onChange={() => handleSelectAll(parseInt(convenioId), convenioAtendimentos)}
                        className="rounded w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <BuildingOfficeIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <span className="font-semibold text-sm text-gray-800 dark:text-white">{convenio.razao_social}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Código: {convenio.codigo_prestador || 'Não configurado'}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">ANS: {convenio.registro_ans || 'Não configurado'}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {selecionadosCount} selecionados
                      </span>
                      <button 
                        onClick={() => gerarXMLPorConvenio(parseInt(convenioId), convenioAtendimentos)} 
                        disabled={gerando} 
                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                      >
                        Faturar Tudo ({convenioAtendimentos.length})
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                          <th className="px-4 py-3 text-left w-8"></th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Paciente</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Carteira</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Procedimento</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {convenioAtendimentos.map((a) => (
                          <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-4 py-3">
                              <input 
                                type="checkbox" 
                                checked={selecionados.includes(a.id)}
                                onChange={() => handleSelectItem(a.id)}
                                disabled={!selecionados.includes(a.id) && selecionados.length >= MAX_GUIAS_POR_LOTE}
                                className="rounded w-4 h-4 text-blue-600 focus:ring-blue-500"
                              />
                             </td>
                            <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                              {a.data_atendimento || (a.itens && a.itens[0]?.data_execucao) || '-'}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-800 dark:text-gray-200">{a.paciente_nome}</td>
                            <td className="px-4 py-3 text-xs font-mono text-gray-600 dark:text-gray-400">{a.numero_carteira}</td>
                            <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                              {a.procedimento_nome || (a.itens && a.itens[0]?.nome) || '-'}
                            </td>
                            <td className="px-4 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300">
                              R$ {a.valor_total?.toFixed(2) || '0,00'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
        </div>

        {totalPendentes === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <CheckIcon className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Nenhum atendimento pendente de faturamento
            </p>
          </div>
        )}

        {/* Histórico de lotes gerados */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Histórico de Lotes Gerados</h3>
            <button 
              onClick={carregarLotes}
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
            >
              <ArrowPathIcon className="w-4 h-4" /> Atualizar
            </button>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Convênio</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nº Lote</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Guias</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Versão</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {guiasGeradas.map((g) => (
                    <tr key={g.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{g.convenio_nome}</td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-500 dark:text-gray-400">{g.numero_lote}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{g.data_envio}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{g.quantidade_guias}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{g.versao || '4.03.00'}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <button 
                            onClick={() => visualizarLote(g)} 
                            className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            title="Visualizar XML"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              const blob = new Blob([g.xml_content], { type: 'application/xml' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${g.numero_lote}.xml`;
                              a.click();
                              URL.revokeObjectURL(url);
                              toast.success('XML baixado!');
                            }} 
                            className="p-1 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                            title="Baixar XML"
                          >
                            <DocumentArrowDownIcon className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => regenerarLote(g)} 
                            disabled={gerando}
                            className="p-1 rounded-lg text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                            title="Regenerar Lote"
                          >
                            <ArrowPathIcon className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => excluirLote(g)} 
                            className="p-1 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Excluir Lote"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {guiasGeradas.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-4 py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                        <DocumentPlusIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        Nenhum lote gerado ainda
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal de Visualização do XML */}
        {showLoteModal && selectedLote && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                    XML do Lote - {selectedLote.numero_lote}
                  </h3>
                  <button 
                    onClick={() => setShowLoteModal(false)} 
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div><span className="text-xs text-gray-500 dark:text-gray-400">Convênio:</span> <span className="text-sm font-medium">{selectedLote.convenio_nome}</span></div>
                  <div><span className="text-xs text-gray-500 dark:text-gray-400">Nº Lote:</span> <span className="text-sm font-mono">{selectedLote.numero_lote}</span></div>
                  <div><span className="text-xs text-gray-500 dark:text-gray-400">Data:</span> <span className="text-sm">{selectedLote.data_envio}</span></div>
                  <div><span className="text-xs text-gray-500 dark:text-gray-400">Guias:</span> <span className="text-sm font-bold">{selectedLote.quantidade_guias}</span></div>
                </div>
                
                <div className="bg-gray-900 rounded-xl p-4 overflow-auto max-h-96">
                  <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                    {selectedLote.xml_content}
                  </pre>
                </div>
                
                <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      const blob = new Blob([selectedLote.xml_content], { type: 'application/xml' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${selectedLote.numero_lote}.xml`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success('XML baixado!');
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4 inline mr-1" />
                    Baixar XML
                  </button>
                  <button
                    onClick={() => setShowLoteModal(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instruções */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">📋 Informações</h4>
          <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
            <li>• Limite máximo de <strong>{MAX_GUIAS_POR_LOTE} guias por lote</strong></li>
            <li>• Selecione as guias desejadas e clique em "Faturar Selecionados"</li>
            <li>• O XML será gerado conforme a versão TISS selecionada</li>
            <li>• Use o botão de regenerar para recriar um lote e corrigir erros</li>
            <li>• Os lotes ficam salvos no banco de dados para consulta futura</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
