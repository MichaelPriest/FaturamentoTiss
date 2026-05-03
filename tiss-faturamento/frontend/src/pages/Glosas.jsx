import { useState, useEffect, useMemo } from 'react';
import {
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  BanknotesIcon,
  ArrowUpTrayIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  ClipboardDocumentListIcon  // <-- usar este no lugar
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { supabase } from '../lib/supabaseClient';

// Mapa CBOS (mesmo do faturamento)
const CBOS_MAP = {
  "225125": "Médico clínico",
  "225133": "Médico psiquiatra",
  "239425": "Psicopedagogo",
  "251510": "Psicólogo clínico",
  "251545": "Neuropsicólogo",
  "223505": "Enfermeiro",
  "223605": "Fisioterapeuta geral",
  "223710": "Nutricionista",
  "223810": "Fonoaudiólogo",
  "223905": "Terapeuta ocupacional",
  "999999": "CBO desconhecido"
};

export default function Glosas() {
  const [glosas, setGlosas] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [busca, setBusca] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [showNovaGlosaModal, setShowNovaGlosaModal] = useState(false);
  const [showImportarXML, setShowImportarXML] = useState(false);
  const [showLoteGuias, setShowLoteGuias] = useState(false);
  
  const [selectedGlosa, setSelectedGlosa] = useState(null);
  const [selectedLote, setSelectedLote] = useState(null);
  const [guiasDoLote, setGuiasDoLote] = useState([]);
  const [carregandoGuias, setCarregandoGuias] = useState(false);
  
  const [novaGlosa, setNovaGlosa] = useState({
    numero_lote: '',
    numero_guia_prestador: '',
    numero_guia_operadora: '',
    senha: '',
    numero_carteira: '',
    paciente_nome: '',
    valor_glosado: 0,
    valor_informado: 0,
    motivo_glosa: '',
    tipo_glosa: '',
    data_glosa: format(new Date(), 'yyyy-MM-dd'),
    status: 'aberta'
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [glosasRes, lotesRes] = await Promise.all([
        supabase.from('glosas').select('*').order('created_at', { ascending: false }),
        supabase.from('lotes_faturamento').select('numero_lote, convenio_nome, data_envio, guias_ids').order('created_at', { ascending: false })
      ]);

      if (glosasRes.error) throw glosasRes.error;
      if (lotesRes.error) throw lotesRes.error;

      setGlosas(glosasRes.data || []);
      setLotes(lotesRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const carregarGuiasDoLote = async (numeroLote) => {
    setCarregandoGuias(true);
    try {
      const lote = lotes.find(l => l.numero_lote === numeroLote);
      if (!lote || !lote.guias_ids || lote.guias_ids.length === 0) {
        setGuiasDoLote([]);
        toast.warning('Nenhuma guia encontrada neste lote');
        setShowLoteGuias(true);
        setSelectedLote(lote);
        return;
      }

      const { data, error } = await supabase
        .from('atendimentos')
        .select('*')
        .in('id', lote.guias_ids);

      if (error) throw error;
      
      // Enriquece os dados com informações do CBO
      const guiasEnriquecidas = (data || []).map(guia => ({
        ...guia,
        profissional_exibicao: getProfissionalExibicao(guia)
      }));
      
      setGuiasDoLote(guiasEnriquecidas);
      setSelectedLote(lote);
      setShowLoteGuias(true);
    } catch (error) {
      console.error('Erro ao carregar guias:', error);
      toast.error('Erro ao carregar guias do lote');
    } finally {
      setCarregandoGuias(false);
    }
  };

  const getProfissionalExibicao = (atendimento) => {
    let nome = '-';
    let cbosDescricao = '';
    try {
      const itens = typeof atendimento.itens === 'string' ? JSON.parse(atendimento.itens) : atendimento.itens;
      if (Array.isArray(itens) && itens.length > 0) {
        nome = itens[0].prestador_nome || '-';
        const cbos = itens[0].prestador_cbos;
        if (cbos && CBOS_MAP[cbos]) cbosDescricao = CBOS_MAP[cbos];
      }
    } catch (e) {}
    return cbosDescricao ? `${nome} / ${cbosDescricao}` : nome;
  };

  const selecionarGuiaParaGlosa = (guia) => {
    setNovaGlosa({
      ...novaGlosa,
      numero_guia_prestador: guia.numero_guia_prestador || '',
      numero_guia_operadora: guia.numero_guia_operadora || '',
      senha: guia.senha_autorizacao || '',
      numero_carteira: guia.numero_carteira || '',
      paciente_nome: guia.paciente_nome || '',
      valor_informado: guia.valor_total || 0,
      numero_lote: selectedLote?.numero_lote || ''
    });
    setShowLoteGuias(false);
  };

  const handleRegistrarGlosa = async () => {
    if (!novaGlosa.numero_guia_prestador || novaGlosa.valor_glosado <= 0) {
      toast.error('Preencha o número da guia e o valor glosado');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('glosas')
        .insert([{
          ...novaGlosa,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setGlosas([data, ...glosas]);
      toast.success('Glosa registrada com sucesso!');
      setShowNovaGlosaModal(false);
      setNovaGlosa({
        numero_lote: '',
        numero_guia_prestador: '',
        numero_guia_operadora: '',
        senha: '',
        numero_carteira: '',
        paciente_nome: '',
        valor_glosado: 0,
        valor_informado: 0,
        motivo_glosa: '',
        tipo_glosa: '',
        data_glosa: format(new Date(), 'yyyy-MM-dd'),
        status: 'aberta'
      });
    } catch (error) {
      console.error('Erro ao registrar glosa:', error);
      toast.error('Erro ao registrar glosa');
    }
  };

  const handleEnviarRecurso = async (glosa) => {
    try {
      const { error } = await supabase
        .from('glosas')
        .update({
          status: 'recurso_enviado',
          data_recurso: format(new Date(), 'yyyy-MM-dd'),
          updated_at: new Date().toISOString()
        })
        .eq('id', glosa.id);

      if (error) throw error;

      setGlosas(glosas.map(g => 
        g.id === glosa.id 
          ? { ...g, status: 'recurso_enviado', data_recurso: format(new Date(), 'yyyy-MM-dd') }
          : g
      ));
      toast.success('Recurso enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar recurso:', error);
      toast.error('Erro ao enviar recurso');
    }
  };

  const handleAtualizarStatus = async (glosa, novoStatus) => {
    try {
      const updates = {
        status: novoStatus,
        data_resolucao: format(new Date(), 'yyyy-MM-dd'),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('glosas')
        .update(updates)
        .eq('id', glosa.id);

      if (error) throw error;

      setGlosas(glosas.map(g => g.id === glosa.id ? { ...g, ...updates } : g));
      toast.success(`Glosa ${novoStatus === 'acatada' ? 'acatada' : 'negada'}!`);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleImportarXML = async () => {
    if (!xmlContent.trim()) {
      toast.error('Cole o conteúdo do XML');
      return;
    }

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      
      // Verificar se é um XML TISS válido
      const relacoesGuias = xmlDoc.getElementsByTagName('relacaoGuias');
      if (relacoesGuias.length === 0) {
        // Tentar com namespace
        const relacoesGuiasNS = xmlDoc.getElementsByTagNameNS('*', 'relacaoGuias');
        if (relacoesGuiasNS.length === 0) {
          toast.error('XML inválido: não encontrou relacaoGuias');
          return;
        }
      }

      const relacoes = relacoesGuias.length > 0 ? relacoesGuias : xmlDoc.getElementsByTagNameNS('*', 'relacaoGuias');
      let importadas = 0;

      for (const relacao of relacoes) {
        const numeroGuiaPrestador = relacao.getElementsByTagName('numeroGuiaPrestador')[0]?.textContent || '';
        const numeroGuiaOperadora = relacao.getElementsByTagName('numeroGuiaOperadora')[0]?.textContent || '';
        const senha = relacao.getElementsByTagName('senha')[0]?.textContent || '';
        const numeroCarteira = relacao.getElementsByTagName('numeroCarteira')[0]?.textContent || '';
        const situacaoGuia = relacao.getElementsByTagName('situacaoGuia')[0]?.textContent || '';
        const valorGlosaGuia = parseFloat(relacao.getElementsByTagName('valorGlosaGuia')[0]?.textContent || '0');

        // Buscar detalhes das glosas
        const detalhes = relacao.getElementsByTagName('detalhesGuia');
        
        if (detalhes.length > 0 && valorGlosaGuia > 0) {
          for (const detalhe of detalhes) {
            const relacaoGlosa = detalhe.getElementsByTagName('relacaoGlosa');
            if (relacaoGlosa.length > 0) {
              const sequencialItem = parseInt(detalhe.getElementsByTagName('sequencialItem')[0]?.textContent || '1');
              const dataRealizacao = detalhe.getElementsByTagName('dataRealizacao')[0]?.textContent || '';
              const codigoProcedimento = detalhe.getElementsByTagName('codigoProcedimento')[0]?.textContent || '';
              const descricaoProcedimento = detalhe.getElementsByTagName('descricaoProcedimento')[0]?.textContent || '';
              const valorInformado = parseFloat(detalhe.getElementsByTagName('valorInformado')[0]?.textContent || '0');
              const valorProcessado = parseFloat(detalhe.getElementsByTagName('valorProcessado')[0]?.textContent || '0');
              const valorGlosa = parseFloat(relacaoGlosa[0].getElementsByTagName('valorGlosa')[0]?.textContent || '0');
              const tipoGlosa = relacaoGlosa[0].getElementsByTagName('tipoGlosa')[0]?.textContent || '';

              await supabase.from('glosas').insert([{
                numero_lote: '',
                numero_guia_prestador: numeroGuiaPrestador,
                numero_guia_operadora: numeroGuiaOperadora,
                senha,
                numero_carteira: numeroCarteira,
                situacao_guia: situacaoGuia,
                sequencial_item: sequencialItem,
                data_realizacao: dataRealizacao || null,
                codigo_procedimento: codigoProcedimento,
                descricao_procedimento: descricaoProcedimento,
                valor_informado: valorInformado,
                valor_processado: valorProcessado,
                valor_glosado: valorGlosa,
                valor_glosa_guia: valorGlosaGuia,
                tipo_glosa: tipoGlosa,
                status: 'aberta',
                data_glosa: format(new Date(), 'yyyy-MM-dd'),
                origem: 'xml_importado'
              }]);

              importadas++;
            }
          }
        }
      }

      await carregarDados();
      setShowImportarXML(false);
      setXmlContent('');
      toast.success(`${importadas} glosas importadas do XML!`);
    } catch (error) {
      console.error('Erro ao importar XML:', error);
      toast.error('Erro ao processar o XML');
    }
  };

  const glosasFiltradas = useMemo(() => {
    let resultado = [...glosas];
    if (filtro !== 'todas') resultado = resultado.filter(g => g.status === filtro);
    if (busca.trim()) {
      const termo = busca.toLowerCase();
      resultado = resultado.filter(g =>
        (g.numero_guia_prestador && g.numero_guia_prestador.toLowerCase().includes(termo)) ||
        (g.numero_lote && g.numero_lote.toLowerCase().includes(termo)) ||
        (g.paciente_nome && g.paciente_nome.toLowerCase().includes(termo))
      );
    }
    return resultado;
  }, [glosas, filtro, busca]);

  const stats = useMemo(() => {
    const abertas = glosas.filter(g => g.status === 'aberta');
    const valorGlosado = glosas.reduce((sum, g) => sum + (g.valor_glosado || 0), 0);
    const valorRecuperado = glosas.filter(g => g.status === 'acatada').reduce((sum, g) => sum + (g.valor_glosado || 0), 0);
    return {
      total: glosas.length,
      abertas: abertas.length,
      recursos: glosas.filter(g => g.status === 'recurso_enviado').length,
      acatadas: glosas.filter(g => g.status === 'acatada').length,
      negadas: glosas.filter(g => g.status === 'negada').length,
      valorGlosado,
      valorRecuperado,
      taxaRecuperacao: valorGlosado > 0 ? (valorRecuperado / valorGlosado) * 100 : 0
    };
  }, [glosas]);

  const getStatusBadge = (status) => {
    const configs = {
      'aberta': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', label: 'Aberta', icon: ExclamationTriangleIcon },
      'recurso_enviado': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Recurso Enviado', icon: DocumentArrowDownIcon },
      'acatada': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Acatada', icon: CheckCircleIcon },
      'negada': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Negada', icon: XCircleIcon },
    };
    return configs[status] || configs['aberta'];
  };

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
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Glosas e Recursos
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Gestão de glosas, importação de XML e acompanhamento de recursos
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => carregarGuiasDoLote('')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition-all"
            >
              <DocumentMagnifyingGlassIcon className="w-4 h-4" />
              Ver Guias do Lote
            </button>
            <button
              onClick={() => setShowImportarXML(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition-all"
            >
              <ArrowUpTrayIcon className="w-4 h-4" />
              Importar XML
            </button>
            <button
              onClick={() => setShowNovaGlosaModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition-all"
            >
              <ExclamationTriangleIcon className="w-4 h-4" />
              Registrar Glosa
            </button>
            <button
              onClick={carregarDados}
              className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-300 transition-all"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Atualizar
            </button>
          </div>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
            <p className="text-xs text-gray-500">Total Glosas</p>
            <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
            <p className="text-xs text-gray-500">Abertas</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.abertas}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
            <p className="text-xs text-gray-500">Valor Glosado</p>
            <p className="text-2xl font-bold text-red-600">R$ {stats.valorGlosado.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
            <p className="text-xs text-gray-500">Taxa Recuperação</p>
            <p className="text-2xl font-bold text-green-600">{stats.taxaRecuperacao.toFixed(1)}%</p>
          </div>
        </div>

        {/* Filtros e busca */}
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <FunnelIcon className="w-4 h-4 text-gray-500" />
          {[
            { key: 'todas', label: 'Todas', count: stats.total },
            { key: 'aberta', label: 'Abertas', count: stats.abertas },
            { key: 'recurso_enviado', label: 'Recursos', count: stats.recursos },
            { key: 'acatada', label: 'Acatadas', count: stats.acatadas },
            { key: 'negada', label: 'Negadas', count: stats.negadas },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                filtro === f.key
                  ? 'bg-gray-700 text-white shadow-md'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
          <div className="flex-1" />
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por guia, lote ou paciente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9 pr-3 py-1.5 border rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white w-72"
            />
          </div>
        </div>

        {/* Tabela de glosas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Nº Guia</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Paciente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Procedimento</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Valor Glosado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Origem</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 w-40">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {glosasFiltradas.map((g) => {
                  const statusConfig = getStatusBadge(g.status);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <tr key={g.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-xs font-mono text-blue-600">{g.numero_guia_prestador || '-'}</td>
                      <td className="px-4 py-3 text-xs">{g.paciente_nome || '-'}</td>
                      <td className="px-4 py-3 text-xs max-w-xs truncate">{g.descricao_procedimento || g.motivo_glosa || '-'}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-red-600">R$ {(g.valor_glosado || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs font-mono">{g.tipo_glosa || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusConfig.bg} ${statusConfig.text}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {g.origem === 'xml_importado' ? '📄 XML' : '✏️ Manual'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => { setSelectedGlosa(g); setShowModal(true); }} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50" title="Visualizar">
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          {g.status === 'aberta' && (
                            <button onClick={() => handleEnviarRecurso(g)} className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">
                              Enviar Recurso
                            </button>
                          )}
                          {g.status === 'recurso_enviado' && (
                            <>
                              <button onClick={() => handleAtualizarStatus(g, 'acatada')} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50" title="Acatar">
                                <CheckCircleIcon className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleAtualizarStatus(g, 'negada')} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50" title="Negar">
                                <XCircleIcon className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {glosasFiltradas.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center text-gray-500">
                      <CheckCircleIcon className="w-12 h-12 mx-auto mb-3 text-green-400 opacity-50" />
                      {busca ? 'Nenhuma glosa encontrada' : 'Nenhuma glosa registrada'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Selecionar Lote para ver Guias */}
        {showLoteGuias && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[85vh] overflow-y-auto">
              <div className="p-5 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  Guias do Lote {selectedLote?.numero_lote || ''}
                  {selectedLote && <span className="text-sm text-gray-500 ml-2">- {selectedLote.convenio_nome}</span>}
                </h3>
                <button onClick={() => setShowLoteGuias(false)} className="p-2 rounded-lg hover:bg-gray-100">
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Seleção de lote */}
              {!selectedLote && (
                <div className="p-5">
                  <label className="block text-sm font-medium mb-2">Selecione o Lote</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2"
                    onChange={(e) => carregarGuiasDoLote(e.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>Selecione um lote...</option>
                    {lotes.map(l => (
                      <option key={l.numero_lote} value={l.numero_lote}>
                        {l.numero_lote} - {l.convenio_nome} ({l.data_envio})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Lista de guias */}
              {selectedLote && (
                <div className="p-5">
                  {carregandoGuias ? (
                    <div className="text-center py-8">
                      <ArrowPathIcon className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Carregando guias...</p>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs">Nº Guia</th>
                          <th className="px-3 py-2 text-left text-xs">Paciente</th>
                          <th className="px-3 py-2 text-left text-xs">Carteira</th>
                          <th className="px-3 py-2 text-left text-xs">Profissional</th>
                          <th className="px-3 py-2 text-right text-xs">Valor</th>
                          <th className="px-3 py-2 text-center text-xs w-24">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {guiasDoLote.map(guia => (
                          <tr key={guia.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-xs font-mono text-blue-600">{guia.numero_guia_prestador}</td>
                            <td className="px-3 py-2 text-xs">{guia.paciente_nome}</td>
                            <td className="px-3 py-2 text-xs font-mono">{guia.numero_carteira}</td>
                            <td className="px-3 py-2 text-xs">{guia.profissional_exibicao}</td>
                            <td className="px-3 py-2 text-xs text-right font-semibold">R$ {(guia.valor_total || 0).toFixed(2)}</td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => selecionarGuiaParaGlosa(guia)}
                                className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                              >
                                Glosar
                              </button>
                            </td>
                          </tr>
                        ))}
                        {guiasDoLote.length === 0 && (
                          <tr>
                            <td colSpan="6" className="px-4 py-8 text-center text-gray-500">Nenhuma guia encontrada</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: Visualizar Glosa */}
        {showModal && selectedGlosa && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
              <div className="p-5 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold">Detalhes da Glosa</h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-gray-500">Nº Guia</p><p className="font-mono font-bold">{selectedGlosa.numero_guia_prestador || '-'}</p></div>
                  <div><p className="text-xs text-gray-500">Nº Lote</p><p className="font-mono">{selectedGlosa.numero_lote || '-'}</p></div>
                  <div><p className="text-xs text-gray-500">Paciente</p><p>{selectedGlosa.paciente_nome || '-'}</p></div>
                  <div><p className="text-xs text-gray-500">Carteira</p><p className="font-mono">{selectedGlosa.numero_carteira || '-'}</p></div>
                  <div><p className="text-xs text-gray-500">Valor Glosado</p><p className="font-bold text-red-600">R$ {(selectedGlosa.valor_glosado || 0).toFixed(2)}</p></div>
                  <div><p className="text-xs text-gray-500">Tipo Glosa</p><p className="font-mono">{selectedGlosa.tipo_glosa || '-'}</p></div>
                  <div><p className="text-xs text-gray-500">Status</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusBadge(selectedGlosa.status).bg} ${getStatusBadge(selectedGlosa.status).text}`}>
                      {getStatusBadge(selectedGlosa.status).label}
                    </span>
                  </div>
                  <div><p className="text-xs text-gray-500">Origem</p><p>{selectedGlosa.origem === 'xml_importado' ? 'XML Importado' : 'Manual'}</p></div>
                </div>
                {selectedGlosa.descricao_procedimento && (
                  <div><p className="text-xs text-gray-500">Procedimento</p><p className="text-sm">{selectedGlosa.descricao_procedimento}</p></div>
                )}
                <div><p className="text-xs text-gray-500">Motivo</p><p className="text-sm">{selectedGlosa.motivo_glosa || '-'}</p></div>
              </div>
              <div className="p-5 border-t flex justify-end">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Fechar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Nova Glosa Manual */}
        {showNovaGlosaModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
              <div className="p-5 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold">Registrar Nova Glosa</h3>
                <button onClick={() => setShowNovaGlosaModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nº Guia Prestador *</label>
                    <input type="text" value={novaGlosa.numero_guia_prestador} onChange={(e) => setNovaGlosa({...novaGlosa, numero_guia_prestador: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nº Guia Operadora</label>
                    <input type="text" value={novaGlosa.numero_guia_operadora} onChange={(e) => setNovaGlosa({...novaGlosa, numero_guia_operadora: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Paciente</label>
                    <input type="text" value={novaGlosa.paciente_nome} onChange={(e) => setNovaGlosa({...novaGlosa, paciente_nome: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nº Carteira</label>
                    <input type="text" value={novaGlosa.numero_carteira} onChange={(e) => setNovaGlosa({...novaGlosa, numero_carteira: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Valor Glosado *</label>
                    <input type="number" step="0.01" value={novaGlosa.valor_glosado} onChange={(e) => setNovaGlosa({...novaGlosa, valor_glosado: parseFloat(e.target.value) || 0})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tipo Glosa</label>
                    <input type="text" value={novaGlosa.tipo_glosa} onChange={(e) => setNovaGlosa({...novaGlosa, tipo_glosa: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" placeholder="Ex: 1010" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Motivo da Glosa</label>
                  <textarea rows="3" value={novaGlosa.motivo_glosa} onChange={(e) => setNovaGlosa({...novaGlosa, motivo_glosa: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700" placeholder="Descreva o motivo..." />
                </div>
              </div>
              <div className="p-5 border-t flex justify-end gap-3">
                <button onClick={() => setShowNovaGlosaModal(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
                <button onClick={handleRegistrarGlosa} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Registrar Glosa</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Importar XML */}
        {showImportarXML && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
              <div className="p-5 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold">Importar XML de Demonstrativo de Glosas</h3>
                <button onClick={() => setShowImportarXML(false)} className="p-2 rounded-lg hover:bg-gray-100">
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-500">
                  Cole o conteúdo do arquivo XML de demonstrativo de análise de contas (TISS).
                </p>
                <textarea
                  rows={15}
                  value={xmlContent}
                  onChange={(e) => setXmlContent(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm font-mono dark:bg-gray-700 dark:text-white"
                  placeholder="Cole o XML aqui..."
                />
              </div>
              <div className="p-5 border-t flex justify-end gap-3">
                <button onClick={() => setShowImportarXML(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
                <button onClick={handleImportarXML} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Importar Glosas
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
