import { useState, useEffect, useMemo } from 'react';
import { 
  EyeIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  DocumentArrowDownIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { supabase } from '../lib/supabaseClient';

export default function Glosas() {
  const [glosas, setGlosas] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [busca, setBusca] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedGlosa, setSelectedGlosa] = useState(null);
  const [showNovaGlosaModal, setShowNovaGlosaModal] = useState(false);
  const [novaGlosa, setNovaGlosa] = useState({
    numero_lote: '',
    numero_guia: '',
    paciente_nome: '',
    valor_glosado: 0,
    valor_total: 0,
    motivo: '',
    codigo_glosa: '',
    data_glosa: format(new Date(), 'yyyy-MM-dd'),
    observacoes: ''
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [glosasRes, lotesRes] = await Promise.all([
        supabase.from('glosas').select('*').order('created_at', { ascending: false }),
        supabase.from('lotes_faturamento').select('numero_lote, convenio_nome').order('created_at', { ascending: false })
      ]);

      if (glosasRes.error) throw glosasRes.error;
      if (lotesRes.error) throw lotesRes.error;

      setGlosas(glosasRes.data || []);
      setLotes(lotesRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar glosas:', error);
      toast.error('Erro ao carregar dados de glosas');
      setGlosas([]);
      setLotes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNovaGlosa = async () => {
    if (!novaGlosa.numero_guia || !novaGlosa.motivo || novaGlosa.valor_glosado <= 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('glosas')
        .insert([{
          ...novaGlosa,
          status: 'aberta',
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
        numero_guia: '',
        paciente_nome: '',
        valor_glosado: 0,
        valor_total: 0,
        motivo: '',
        codigo_glosa: '',
        data_glosa: format(new Date(), 'yyyy-MM-dd'),
        observacoes: ''
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
        updated_at: new Date().toISOString()
      };

      if (novoStatus === 'acatada') {
        updates.data_resolucao = format(new Date(), 'yyyy-MM-dd');
      } else if (novoStatus === 'negada') {
        updates.data_resolucao = format(new Date(), 'yyyy-MM-dd');
      }

      const { error } = await supabase
        .from('glosas')
        .update(updates)
        .eq('id', glosa.id);

      if (error) throw error;

      setGlosas(glosas.map(g => 
        g.id === glosa.id 
          ? { ...g, ...updates }
          : g
      ));
      toast.success(`Glosa ${novoStatus === 'acatada' ? 'acatada' : 'negada'}!`);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleVisualizar = (glosa) => {
    setSelectedGlosa(glosa);
    setShowModal(true);
  };

  // Filtragem e busca
  const glosasFiltradas = useMemo(() => {
    let resultado = [...glosas];

    // Filtro por status
    if (filtro !== 'todas') {
      resultado = resultado.filter(g => g.status === filtro);
    }

    // Busca textual
    if (busca.trim()) {
      const termo = busca.toLowerCase();
      resultado = resultado.filter(g =>
        (g.numero_guia && g.numero_guia.toLowerCase().includes(termo)) ||
        (g.numero_lote && g.numero_lote.toLowerCase().includes(termo)) ||
        (g.paciente_nome && g.paciente_nome.toLowerCase().includes(termo)) ||
        (g.motivo && g.motivo.toLowerCase().includes(termo))
      );
    }

    return resultado;
  }, [glosas, filtro, busca]);

  // Estatísticas
  const stats = useMemo(() => {
    const abertas = glosas.filter(g => g.status === 'aberta');
    const recursos = glosas.filter(g => g.status === 'recurso_enviado');
    const acatadas = glosas.filter(g => g.status === 'acatada');
    const negadas = glosas.filter(g => g.status === 'negada');

    const valorGlosado = glosas.reduce((sum, g) => sum + (g.valor_glosado || 0), 0);
    const valorRecuperado = acatadas.reduce((sum, g) => sum + (g.valor_glosado || 0), 0);

    return {
      total: glosas.length,
      abertas: abertas.length,
      recursos: recursos.length,
      acatadas: acatadas.length,
      negadas: negadas.length,
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
              Gestão de glosas e acompanhamento de recursos
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowNovaGlosaModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition-all"
            >
              <ExclamationTriangleIcon className="w-4 h-4" />
              Registrar Glosa
            </button>
            <button
              onClick={carregarDados}
              className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Atualizar
            </button>
          </div>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Glosas</p>
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{stats.total}</p>
              </div>
              <DocumentTextIcon className="w-8 h-8 text-gray-400 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Abertas</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.abertas}</p>
              </div>
              <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Valor Glosado</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">R$ {stats.valorGlosado.toFixed(2)}</p>
              </div>
              <BanknotesIcon className="w-8 h-8 text-red-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Taxa Recuperação</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.taxaRecuperacao.toFixed(1)}%</p>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Filtros e busca */}
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <FunnelIcon className="w-4 h-4 text-gray-500" />
          <button
            onClick={() => setFiltro('todas')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${filtro === 'todas' ? 'bg-gray-700 dark:bg-gray-300 text-white dark:text-gray-800 shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
            Todas ({stats.total})
          </button>
          <button
            onClick={() => setFiltro('aberta')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${filtro === 'aberta' ? 'bg-yellow-600 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
            Abertas ({stats.abertas})
          </button>
          <button
            onClick={() => setFiltro('recurso_enviado')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${filtro === 'recurso_enviado' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
            Recursos ({stats.recursos})
          </button>
          <button
            onClick={() => setFiltro('acatada')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${filtro === 'acatada' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
            Acatadas ({stats.acatadas})
          </button>
          <button
            onClick={() => setFiltro('negada')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${filtro === 'negada' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
            Negadas ({stats.negadas})
          </button>
          <div className="flex-1" />
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar glosas..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
        </div>

        {/* Tabela de glosas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Nº Guia</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Nº Lote</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Paciente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Data Glosa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Motivo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 w-40">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {glosasFiltradas.map((g) => {
                  const statusConfig = getStatusBadge(g.status);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <tr key={g.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-blue-600 dark:text-blue-400 font-medium">{g.numero_guia || '-'}</td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-600 dark:text-gray-400">{g.numero_lote || '-'}</td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-800 dark:text-white">{g.paciente_nome || '-'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{g.data_glosa || '-'}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-red-600 dark:text-red-400">R$ {(g.valor_glosado || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 max-w-xs truncate">{g.motivo || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => handleVisualizar(g)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            title="Visualizar"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          {g.status === 'aberta' && (
                            <button
                              onClick={() => handleEnviarRecurso(g)}
                              className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                            >
                              Enviar Recurso
                            </button>
                          )}
                          {g.status === 'recurso_enviado' && (
                            <>
                              <button
                                onClick={() => handleAtualizarStatus(g, 'acatada')}
                                className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                title="Acatar"
                              >
                                <CheckCircleIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleAtualizarStatus(g, 'negada')}
                                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Negar"
                              >
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
                    <td colSpan="8" className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                      <CheckCircleIcon className="w-12 h-12 mx-auto mb-3 text-green-400 opacity-50" />
                      {busca ? 'Nenhuma glosa encontrada para esta busca' : 'Nenhuma glosa registrada'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de visualização */}
        {showModal && selectedGlosa && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
              <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Detalhes da Glosa</h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Nº Guia</p>
                    <p className="font-mono font-bold text-gray-800 dark:text-white">{selectedGlosa.numero_guia || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Nº Lote</p>
                    <p className="font-mono text-gray-800 dark:text-white">{selectedGlosa.numero_lote || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Paciente</p>
                    <p className="text-gray-800 dark:text-white">{selectedGlosa.paciente_nome || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Data da Glosa</p>
                    <p className="text-gray-800 dark:text-white">{selectedGlosa.data_glosa || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Valor Glosado</p>
                    <p className="font-bold text-red-600">R$ {(selectedGlosa.valor_glosado || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Valor Total</p>
                    <p className="text-gray-800 dark:text-white">R$ {(selectedGlosa.valor_total || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Código da Glosa</p>
                    <p className="font-mono text-gray-800 dark:text-white">{selectedGlosa.codigo_glosa || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedGlosa.status).bg} ${getStatusBadge(selectedGlosa.status).text}`}>
                      {getStatusBadge(selectedGlosa.status).label}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Motivo</p>
                  <p className="text-sm text-gray-800 dark:text-white mt-1">{selectedGlosa.motivo || '-'}</p>
                </div>
                {selectedGlosa.observacoes && (
                  <div>
                    <p className="text-xs text-gray-500">Observações</p>
                    <p className="text-sm text-gray-800 dark:text-white mt-1">{selectedGlosa.observacoes}</p>
                  </div>
                )}
                {selectedGlosa.data_recurso && (
                  <div>
                    <p className="text-xs text-gray-500">Data do Recurso</p>
                    <p className="text-gray-800 dark:text-white">{selectedGlosa.data_recurso}</p>
                  </div>
                )}
              </div>
              <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm">Fechar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de nova glosa */}
        {showNovaGlosaModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Registrar Nova Glosa</h3>
                <button onClick={() => setShowNovaGlosaModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nº do Lote</label>
                    <select
                      value={novaGlosa.numero_lote}
                      onChange={(e) => setNovaGlosa({...novaGlosa, numero_lote: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">Selecione...</option>
                      {lotes.map(l => (
                        <option key={l.numero_lote} value={l.numero_lote}>{l.numero_lote} - {l.convenio_nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nº Guia *</label>
                    <input
                      type="text"
                      value={novaGlosa.numero_guia}
                      onChange={(e) => setNovaGlosa({...novaGlosa, numero_guia: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Número da guia"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paciente</label>
                    <input
                      type="text"
                      value={novaGlosa.paciente_nome}
                      onChange={(e) => setNovaGlosa({...novaGlosa, paciente_nome: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Nome do paciente"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data da Glosa</label>
                    <input
                      type="date"
                      value={novaGlosa.data_glosa}
                      onChange={(e) => setNovaGlosa({...novaGlosa, data_glosa: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Total</label>
                    <input
                      type="number"
                      step="0.01"
                      value={novaGlosa.valor_total}
                      onChange={(e) => setNovaGlosa({...novaGlosa, valor_total: parseFloat(e.target.value) || 0})}
                      className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Glosado *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={novaGlosa.valor_glosado}
                      onChange={(e) => setNovaGlosa({...novaGlosa, valor_glosado: parseFloat(e.target.value) || 0})}
                      className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código da Glosa</label>
                    <input
                      type="text"
                      value={novaGlosa.codigo_glosa}
                      onChange={(e) => setNovaGlosa({...novaGlosa, codigo_glosa: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Código TISS"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motivo da Glosa *</label>
                  <textarea
                    rows="3"
                    value={novaGlosa.motivo}
                    onChange={(e) => setNovaGlosa({...novaGlosa, motivo: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Descreva o motivo da glosa..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                  <textarea
                    rows="2"
                    value={novaGlosa.observacoes}
                    onChange={(e) => setNovaGlosa({...novaGlosa, observacoes: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Observações adicionais..."
                  />
                </div>
              </div>
              <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button
                  onClick={() => setShowNovaGlosaModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleNovaGlosa}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                >
                  Registrar Glosa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
