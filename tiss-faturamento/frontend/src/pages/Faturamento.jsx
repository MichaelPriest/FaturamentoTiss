import { useState, useEffect, useMemo } from 'react';
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
  DocumentPlusIcon,
  ReceiptPercentIcon,
  CalendarDaysIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { supabase } from '../lib/supabaseClient';
import { gerarXMLTISS, converterAtendimentoParaTISS, setVersao, VERSAO_TISS } from '../lib/tissGenerator';

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
  const [showPreviaModal, setShowPreviaModal] = useState(false);
  const [selectedLote, setSelectedLote] = useState(null);
  
  const [dadosFatura, setDadosFatura] = useState({
    competencia: format(new Date(), 'yyyy-MM'),
    dataFechamento: format(new Date(), 'yyyy-MM-dd'),
    dataPrevisaoPagamento: '',
    baseCalculo: 0,
    aliquotaISS: 5,
    valorISS: 0,
    aliquotaIR: 1.5,
    valorIR: 0,
    aliquotaCSLL: 1,
    valorCSLL: 0,
    aliquotaPIS: 0.65,
    valorPIS: 0,
    aliquotaCOFINS: 3,
    valorCOFINS: 0,
    valorLiquido: 0,
    observacoes: ''
  });

  useEffect(() => {
    carregarDados();
    carregarVersao();
    carregarLotes();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const { data: atendimentosData, error: atendimentosError } = await supabase
        .from('atendimentos')
        .select('*')
        .eq('status', 'pendente')
        .order('created_at', { ascending: false });

      if (atendimentosError) throw atendimentosError;

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

  // Gerar número do lote (12 dígitos)
  const gerarNumeroLote = (convenioId, sequencial = null) => {
    const data = new Date();
    const ano = data.getFullYear().toString().slice(-2);
    const mes = (data.getMonth() + 1).toString().padStart(2, '0');
    const dia = data.getDate().toString().padStart(2, '0');
    const seq = (sequencial || Math.floor(Math.random() * 10000)).toString().padStart(6, '0');
    return `${ano}${mes}${dia}${seq}`;
  };

  // Calcular impostos
  const calcularImpostos = (baseCalculo, aliquotaISS, aliquotaIR, aliquotaCSLL, aliquotaPIS, aliquotaCOFINS) => {
    const iss = (baseCalculo * aliquotaISS) / 100;
    const ir = (baseCalculo * aliquotaIR) / 100;
    const csll = (baseCalculo * aliquotaCSLL) / 100;
    const pis = (baseCalculo * aliquotaPIS) / 100;
    const cofins = (baseCalculo * aliquotaCOFINS) / 100;
    const totalImpostos = iss + ir + csll + pis + cofins;
    const valorLiquido = baseCalculo - totalImpostos;

    return { iss, ir, csll, pis, cofins, totalImpostos, valorLiquido };
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

  const previewData = useMemo(() => {
    if (selecionados.length === 0) return null;
    
    const atendimentosSelecionados = pendentes.filter(a => selecionados.includes(a.id));
    const valorTotal = atendimentosSelecionados.reduce((sum, a) => sum + (a.valor_total || 0), 0);
    
    return {
      atendimentos: atendimentosSelecionados,
      valorTotal,
      quantidade: atendimentosSelecionados.length,
      conveniosAgrupados: atendimentosSelecionados.reduce((acc, a) => {
        const convenioId = a.paciente_convenio_id;
        if (!acc[convenioId]) {
          acc[convenioId] = {
            convenio: convenios.find(c => c.id === convenioId),
            atendimentos: [],
            valorTotal: 0
          };
        }
        acc[convenioId].atendimentos.push(a);
        acc[convenioId].valorTotal += (a.valor_total || 0);
        return acc;
      }, {})
    };
  }, [selecionados, pendentes, convenios]);

  const abrirPreviaFatura = () => {
    if (selecionados.length === 0) {
      toast.error('Selecione pelo menos uma guia para faturar');
      return;
    }
    // Atualizar base de cálculo e impostos
    const valorTotal = previewData?.valorTotal || 0;
    const impostos = calcularImpostos(
      valorTotal,
      dadosFatura.aliquotaISS,
      dadosFatura.aliquotaIR,
      dadosFatura.aliquotaCSLL,
      dadosFatura.aliquotaPIS,
      dadosFatura.aliquotaCOFINS
    );
    setDadosFatura(prev => ({
      ...prev,
      baseCalculo: valorTotal,
      valorISS: impostos.iss,
      valorIR: impostos.ir,
      valorCSLL: impostos.csll,
      valorPIS: impostos.pis,
      valorCOFINS: impostos.cofins,
      valorLiquido: impostos.valorLiquido
    }));
    setShowPreviaModal(true);
  };

  const atualizarAliquota = (campo, valor) => {
    const novaAliquota = parseFloat(valor) || 0;
    const novosDados = { ...dadosFatura, [campo]: novaAliquota };
    const impostos = calcularImpostos(
      dadosFatura.baseCalculo,
      campo === 'aliquotaISS' ? novaAliquota : dadosFatura.aliquotaISS,
      campo === 'aliquotaIR' ? novaAliquota : dadosFatura.aliquotaIR,
      campo === 'aliquotaCSLL' ? novaAliquota : dadosFatura.aliquotaCSLL,
      campo === 'aliquotaPIS' ? novaAliquota : dadosFatura.aliquotaPIS,
      campo === 'aliquotaCOFINS' ? novaAliquota : dadosFatura.aliquotaCOFINS
    );
    setDadosFatura({
      ...novosDados,
      valorISS: impostos.iss,
      valorIR: impostos.ir,
      valorCSLL: impostos.csll,
      valorPIS: impostos.pis,
      valorCOFINS: impostos.cofins,
      valorLiquido: impostos.valorLiquido
    });
  };

  const atualizarBaseCalculo = (valor) => {
    const novaBase = parseFloat(valor) || 0;
    const impostos = calcularImpostos(
      novaBase,
      dadosFatura.aliquotaISS,
      dadosFatura.aliquotaIR,
      dadosFatura.aliquotaCSLL,
      dadosFatura.aliquotaPIS,
      dadosFatura.aliquotaCOFINS
    );
    setDadosFatura({
      ...dadosFatura,
      baseCalculo: novaBase,
      valorISS: impostos.iss,
      valorIR: impostos.ir,
      valorCSLL: impostos.csll,
      valorPIS: impostos.pis,
      valorCOFINS: impostos.cofins,
      valorLiquido: impostos.valorLiquido
    });
  };

  const confirmarGeracaoLote = async () => {
    if (!previewData) return;

    setGerando(true);
    setShowPreviaModal(false);

    try {
      const atendimentosPorConvenio = previewData.conveniosAgrupados;
      let sequencialTransacao = 1;
      
      for (const [convenioId, data] of Object.entries(atendimentosPorConvenio)) {
        const convenio = data.convenio;
        
        if (!convenio.codigo_prestador) {
          toast.error(`Convênio ${convenio.razao_social} não possui código de prestador configurado`);
          continue;
        }

        const numeroLote = gerarNumeroLote(convenioId, sequencialTransacao);
        
        const guias = data.atendimentos.map(atendimento => ({
          ...converterAtendimentoParaTISS(atendimento, convenio),
          codigoPrestadorExecutante: convenio.codigo_prestador,
          versao: versaoTISS
        }));

        const xml = gerarXMLTISS({
          versao: versaoTISS,
          sequencialTransacao: sequencialTransacao.toString().padStart(4, '0'),
          codigoPrestadorNaOperadora: convenio.codigo_prestador,
          registroANS: convenio.registro_ans,
          numeroLote: numeroLote,
          guias: guias,
          convenio: convenio
        });

        const nomeArquivo = `${numeroLote}_${convenio.registro_ans}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xml`;

        const novoLote = {
          convenio_id: convenioId,
          convenio_nome: convenio.razao_social,
          numero_lote: numeroLote,
          data_envio: format(new Date(), 'yyyy-MM-dd'),
          quantidade_guias: data.atendimentos.length,
          guias_ids: data.atendimentos.map(a => a.id),
          xml_content: xml,
          status: 'faturado',
          versao: versaoTISS,
          dados_fatura: {
            competencia: dadosFatura.competencia,
            data_fechamento: dadosFatura.dataFechamento,
            data_previsao_pagamento: dadosFatura.dataPrevisaoPagamento,
            base_calculo: dadosFatura.baseCalculo,
            aliquota_iss: dadosFatura.aliquotaISS,
            valor_iss: dadosFatura.valorISS,
            aliquota_ir: dadosFatura.aliquotaIR,
            valor_ir: dadosFatura.valorIR,
            aliquota_csll: dadosFatura.aliquotaCSLL,
            valor_csll: dadosFatura.valorCSLL,
            aliquota_pis: dadosFatura.aliquotaPIS,
            valor_pis: dadosFatura.valorPIS,
            aliquota_cofins: dadosFatura.aliquotaCOFINS,
            valor_cofins: dadosFatura.valorCOFINS,
            valor_liquido: dadosFatura.valorLiquido,
            observacoes: dadosFatura.observacoes
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        await salvarLote(novoLote);

        const ids = data.atendimentos.map(a => a.id);
        await atualizarStatusAtendimentos(ids, 'faturado');

        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nomeArquivo;
        a.click();
        URL.revokeObjectURL(url);

        sequencialTransacao++;
      }

      await carregarLotes();
      await carregarDados();
      setSelecionados([]);
      
      toast.success(`Lote(s) gerado(s) com sucesso!`);
    } catch (error) {
      console.error('Erro ao gerar lote:', error);
      toast.error('Erro ao gerar lote');
    } finally {
      setGerando(false);
    }
  };

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

  const regenerarLote = async (lote) => {
    if (!confirm(`Deseja regenerar o lote ${lote.numero_lote}? Isso irá recriar o XML.`)) {
      return;
    }

    setGerando(true);
    
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
      numeroLote: lote.numero_lote,
      guias: novasGuias,
      convenio: convenio
    });

    const nomeArquivo = `${lote.numero_lote}_${convenio.registro_ans}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xml`;

    const novoLote = {
      ...lote,
      id: undefined,
      data_envio: format(new Date(), 'yyyy-MM-dd'),
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
    a.download = nomeArquivo;
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
                onClick={abrirPreviaFatura} 
                disabled={gerando} 
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg"
              >
                <ReceiptPercentIcon className="w-4 h-4" />
                Faturar Selecionados ({totalSelecionados}/{MAX_GUIAS_POR_LOTE})
              </button>
            )}
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-500 dark:text-gray-400">Total Pendentes</p><p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{totalPendentes}</p></div>
              <ClockIcon className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-500 dark:text-gray-400">Convênios com Pendência</p><p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{Object.keys(pendentesPorConvenio).length}</p></div>
              <BuildingOfficeIcon className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-500 dark:text-gray-400">Lotes Gerados</p><p className="text-2xl font-bold text-green-600 dark:text-green-400">{guiasGeradas.length}</p></div>
              <DocumentPlusIcon className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-500 dark:text-gray-400">Valor Pendente</p><p className="text-2xl font-bold text-purple-600 dark:text-purple-400">R$ {valorTotalPendente.toFixed(2)}</p></div>
              <CurrencyDollarIcon className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Seletor de Convênio */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setFiltroConvenio('todos')} className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all duration-200 ${filtroConvenio === 'todos' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
            Todos ({totalPendentes})
          </button>
          {convenios.map(c => {
            const count = pendentes.filter(a => a.paciente_convenio_id === c.id).length;
            if (count === 0) return null;
            return (
              <button key={c.id} onClick={() => setFiltroConvenio(c.id.toString())} className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all duration-200 ${filtroConvenio === c.id.toString() ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
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
                      <input type="checkbox" checked={selecionadosCount === convenioAtendimentos.length && convenioAtendimentos.length > 0} onChange={() => handleSelectAll(parseInt(convenioId), convenioAtendimentos)} className="rounded w-4 h-4 text-blue-600 focus:ring-blue-500" />
                      <BuildingOfficeIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <span className="font-semibold text-sm text-gray-800 dark:text-white">{convenio.razao_social}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Código: {convenio.codigo_prestador || 'Não configurado'}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">ANS: {convenio.registro_ans || 'Não configurado'}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{selecionadosCount} selecionados</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                          <th className="px-4 py-3 text-left w-8"></th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nº Guia</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Paciente</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Carteira</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Guia Operadora</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Senha</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {convenioAtendimentos.map((a) => (
                          <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-4 py-3">
                              <input type="checkbox" checked={selecionados.includes(a.id)} onChange={() => handleSelectItem(a.id)} disabled={!selecionados.includes(a.id) && selecionados.length >= MAX_GUIAS_POR_LOTE} className="rounded w-4 h-4 text-blue-600 focus:ring-blue-500" />
                             </td>
                            <td className="px-4 py-3 text-xs font-mono text-gray-600 dark:text-gray-400">{a.numero_guia_prestador}</td>
                            <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{a.data_atendimento || (a.itens && a.itens[0]?.data_execucao) || '-'}</td>
                            <td className="px-4 py-3 text-xs text-gray-800 dark:text-gray-200">{a.paciente_nome}</td>
                            <td className="px-4 py-3 text-xs font-mono text-gray-600 dark:text-gray-400">{a.numero_carteira}</td>
                            <td className="px-4 py-3 text-xs font-mono text-gray-600 dark:text-gray-400">{a.numero_guia_operadora || '-'}</td>
                            <td className="px-4 py-3 text-xs font-mono text-gray-600 dark:text-gray-400">{a.senha_autorizacao || '-'}</td>
                            <td className="px-4 py-3 text-xs font-semibold text-right text-gray-700 dark:text-gray-300">R$ {a.valor_total?.toFixed(2) || '0,00'}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 dark:bg-gray-700/50">
                        <tr className="border-t">
                          <td colSpan="7" className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Total do Convênio:</td>
                          <td className="px-4 py-3 text-right font-bold text-blue-600 dark:text-blue-400">
                            R$ {convenioAtendimentos.reduce((sum, a) => sum + (a.valor_total || 0), 0).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            })}
        </div>

        {totalPendentes === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <CheckIcon className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhum atendimento pendente de faturamento</p>
          </div>
        )}

        {/* Histórico de lotes gerados */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Histórico de Lotes Gerados</h3>
            <button onClick={carregarLotes} className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor</th>
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
                      <td className="px-4 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300">R$ {(g.dados_fatura?.base_calculo || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{g.versao || '4.03.00'}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => visualizarLote(g)} className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors" title="Visualizar XML">
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => { const blob = new Blob([g.xml_content], { type: 'application/xml' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${g.numero_lote}.xml`; a.click(); URL.revokeObjectURL(url); toast.success('XML baixado!'); }} className="p-1 rounded-lg text-green-600 hover:bg-green-50 transition-colors" title="Baixar XML">
                            <DocumentArrowDownIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => regenerarLote(g)} disabled={gerando} className="p-1 rounded-lg text-yellow-600 hover:bg-yellow-50 transition-colors" title="Regenerar Lote">
                            <ArrowPathIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => excluirLote(g)} className="p-1 rounded-lg text-red-600 hover:bg-red-50 transition-colors" title="Excluir Lote">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {guiasGeradas.length === 0 && (
                    <tr><td colSpan="7" className="px-4 py-12 text-center text-gray-500 text-sm">Nenhum lote gerado ainda</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal de Prévia da Fatura */}
        {showPreviaModal && previewData && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Prévia do Faturamento</h3>
                  <button onClick={() => setShowPreviaModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><XMarkIcon className="w-5 h-5" /></button>
                </div>
              </div>
              
              <div className="p-5 space-y-6">
                {/* Resumo dos Selecionados */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3">Resumo dos Agendamentos Selecionados</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><p className="text-xs text-gray-500">Total de Guias</p><p className="text-2xl font-bold text-blue-600">{previewData.quantidade}</p></div>
                    <div><p className="text-xs text-gray-500">Valor Total</p><p className="text-2xl font-bold text-green-600">R$ {previewData.valorTotal.toFixed(2)}</p></div>
                    <div><p className="text-xs text-gray-500">Convênios</p><p className="text-2xl font-bold text-purple-600">{Object.keys(previewData.conveniosAgrupados).length}</p></div>
                    <div><p className="text-xs text-gray-500">Limite por Lote</p><p className="text-2xl font-bold text-orange-600">{MAX_GUIAS_POR_LOTE}</p></div>
                  </div>
                </div>

                {/* Detalhes por Convênio */}
                {Object.entries(previewData.conveniosAgrupados).map(([convenioId, data]) => (
                  <div key={convenioId} className="border rounded-xl overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 border-b">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{data.convenio?.razao_social}</span>
                        <span className="text-sm font-bold text-green-600">R$ {data.valorTotal.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                          <tr><th className="px-3 py-2 text-left text-xs">Nº Guia</th><th className="px-3 py-2 text-left text-xs">Data</th><th className="px-3 py-2 text-left text-xs">Paciente</th><th className="px-3 py-2 text-left text-xs">Carteira</th><th className="px-3 py-2 text-left text-xs">Guia Operadora</th><th className="px-3 py-2 text-left text-xs">Senha</th><th className="px-3 py-2 text-right text-xs">Valor</th></tr>
                        </thead>
                        <tbody className="divide-y">
                          {data.atendimentos.map(a => (
                            <tr key={a.id} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-xs font-mono">{a.numero_guia_prestador}</td>
                              <td className="px-3 py-2 text-xs">{a.data_atendimento || (a.itens && a.itens[0]?.data_execucao) || '-'}</td>
                              <td className="px-3 py-2 text-xs">{a.paciente_nome}</td>
                              <td className="px-3 py-2 text-xs">{a.numero_carteira}</td>
                              <td className="px-3 py-2 text-xs">{a.numero_guia_operadora || '-'}</td>
                              <td className="px-3 py-2 text-xs">{a.senha_autorizacao || '-'}</td>
                              <td className="px-3 py-2 text-xs text-right font-semibold">R$ {a.valor_total?.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}

                {/* Dados da Nota Fiscal */}
                <div className="border rounded-xl p-4">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><BanknotesIcon className="w-5 h-5" /> Dados da Nota Fiscal / Faturamento</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Competência</label><input type="month" value={dadosFatura.competencia} onChange={e => setDadosFatura({...dadosFatura, competencia: e.target.value})} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600" /></div>
                    <div><label className="block text-sm font-medium mb-1">Data de Fechamento</label><input type="date" value={dadosFatura.dataFechamento} onChange={e => setDadosFatura({...dadosFatura, dataFechamento: e.target.value})} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600" /></div>
                    <div><label className="block text-sm font-medium mb-1">Previsão de Pagamento</label><input type="date" value={dadosFatura.dataPrevisaoPagamento} onChange={e => setDadosFatura({...dadosFatura, dataPrevisaoPagamento: e.target.value})} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600" /></div>
                  </div>
                  
                  <div className="mt-4"><h5 className="font-medium text-sm mb-2">Impostos e Deduções</h5>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div><label className="block text-xs text-gray-500">Base de Cálculo</label><input type="number" step="0.01" value={dadosFatura.baseCalculo} onChange={e => { const val = parseFloat(e.target.value); setDadosFatura({...dadosFatura, baseCalculo: val}); const imp = calcularImpostos(val); setDadosFatura(prev => ({...prev, ...imp})); }} className="w-full border rounded-lg px-2 py-1 text-sm" /></div>
                      <div><label className="block text-xs text-gray-500">ISS (%)</label><input type="number" step="0.01" value={dadosFatura.aliquotaISS} onChange={e => { const val = parseFloat(e.target.value); setDadosFatura({...dadosFatura, aliquotaISS: val}); const imp = calcularImpostos(dadosFatura.baseCalculo); setDadosFatura(prev => ({...prev, ...imp})); }} className="w-full border rounded-lg px-2 py-1 text-sm" /></div>
                      <div><label className="block text-xs text-gray-500">IR (%)</label><input type="number" step="0.01" value={dadosFatura.aliquotaIR} onChange={e => { const val = parseFloat(e.target.value); setDadosFatura({...dadosFatura, aliquotaIR: val}); const imp = calcularImpostos(dadosFatura.baseCalculo); setDadosFatura(prev => ({...prev, ...imp})); }} className="w-full border rounded-lg px-2 py-1 text-sm" /></div>
                      <div><label className="block text-xs text-gray-500">CSLL (%)</label><input type="number" step="0.01" value={dadosFatura.aliquotaCSLL} onChange={e => { const val = parseFloat(e.target.value); setDadosFatura({...dadosFatura, aliquotaCSLL: val}); const imp = calcularImpostos(dadosFatura.baseCalculo); setDadosFatura(prev => ({...prev, ...imp})); }} className="w-full border rounded-lg px-2 py-1 text-sm" /></div>
                      <div><label className="block text-xs text-gray-500">PIS (%)</label><input type="number" step="0.01" value={dadosFatura.aliquotaPIS} onChange={e => { const val = parseFloat(e.target.value); setDadosFatura({...dadosFatura, aliquotaPIS: val}); const imp = calcularImpostos(dadosFatura.baseCalculo); setDadosFatura(prev => ({...prev, ...imp})); }} className="w-full border rounded-lg px-2 py-1 text-sm" /></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                      <div><label className="block text-xs text-gray-500">Valor ISS</label><input type="text" value={dadosFatura.valorISS.toFixed(2)} disabled className="w-full border rounded-lg px-2 py-1 text-sm bg-gray-50" /></div>
                      <div><label className="block text-xs text-gray-500">Valor IR</label><input type="text" value={dadosFatura.valorIR.toFixed(2)} disabled className="w-full border rounded-lg px-2 py-1 text-sm bg-gray-50" /></div>
                      <div><label className="block text-xs text-gray-500">Valor CSLL</label><input type="text" value={dadosFatura.valorCSLL.toFixed(2)} disabled className="w-full border rounded-lg px-2 py-1 text-sm bg-gray-50" /></div>
                      <div><label className="block text-xs text-gray-500">Valor PIS</label><input type="text" value={dadosFatura.valorPIS.toFixed(2)} disabled className="w-full border rounded-lg px-2 py-1 text-sm bg-gray-50" /></div>
                      <div><label className="block text-xs text-gray-500">Valor COFINS</label><input type="text" value={dadosFatura.valorCOFINS.toFixed(2)} disabled className="w-full border rounded-lg px-2 py-1 text-sm bg-gray-50" /></div>
                      <div><label className="block text-xs text-gray-500">Valor Líquido</label><input type="text" value={dadosFatura.valorLiquido.toFixed(2)} disabled className="w-full border rounded-lg px-2 py-1 text-sm bg-green-50 font-bold" /></div>
                    </div>
                  </div>
                  <div className="mt-3"><label className="block text-sm font-medium mb-1">Observações</label><textarea rows="2" value={dadosFatura.observacoes} onChange={e => setDadosFatura({...dadosFatura, observacoes: e.target.value})} className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600" placeholder="Informações adicionais da fatura..." /></div>
                </div>
              </div>
              
              <div className="p-5 border-t flex justify-end gap-3">
                <button onClick={() => setShowPreviaModal(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
                <button onClick={confirmarGeracaoLote} disabled={gerando} className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium shadow-md flex items-center gap-2">
                  {gerando ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <PaperAirplaneIcon className="w-4 h-4" />}
                  Gerar Lote(s) e XML
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Visualização do XML */}
        {showLoteModal && selectedLote && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5">
                <div className="flex justify-between items-center"><h3 className="text-xl font-semibold">XML do Lote - {selectedLote.numero_lote}</h3><button onClick={() => setShowLoteModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><XMarkIcon className="w-5 h-5" /></button></div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 p-4 bg-gray-50 rounded-xl">
                  <div><span className="text-xs text-gray-500">Convênio:</span> <span className="text-sm font-medium">{selectedLote.convenio_nome}</span></div>
                  <div><span className="text-xs text-gray-500">Nº Lote:</span> <span className="text-sm font-mono">{selectedLote.numero_lote}</span></div>
                  <div><span className="text-xs text-gray-500">Data:</span> <span className="text-sm">{selectedLote.data_envio}</span></div>
                  <div><span className="text-xs text-gray-500">Guias:</span> <span className="text-sm font-bold">{selectedLote.quantidade_guias}</span></div>
                </div>
                {selectedLote.dados_fatura && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 p-4 bg-green-50 rounded-xl">
                    <div><span className="text-xs text-gray-500">Competência:</span> <span className="text-sm">{selectedLote.dados_fatura.competencia}</span></div>
                    <div><span className="text-xs text-gray-500">Fechamento:</span> <span className="text-sm">{selectedLote.dados_fatura.data_fechamento}</span></div>
                    <div><span className="text-xs text-gray-500">Valor Líquido:</span> <span className="text-sm font-bold text-green-600">R$ {selectedLote.dados_fatura.valor_liquido?.toFixed(2)}</span></div>
                    <div><span className="text-xs text-gray-500">Previsão Pagto:</span> <span className="text-sm">{selectedLote.dados_fatura.data_previsao_pagamento || '-'}</span></div>
                  </div>
                )}
                <div className="bg-gray-900 rounded-xl p-4 overflow-auto max-h-96"><pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">{selectedLote.xml_content}</pre></div>
                <div className="flex justify-end gap-3 mt-5 pt-4 border-t">
                  <button onClick={() => { const blob = new Blob([selectedLote.xml_content], { type: 'application/xml' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${selectedLote.numero_lote}.xml`; a.click(); URL.revokeObjectURL(url); toast.success('XML baixado!'); }} className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg">Baixar XML</button>
                  <button onClick={() => setShowLoteModal(false)} className="px-4 py-2 border rounded-lg">Fechar</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
