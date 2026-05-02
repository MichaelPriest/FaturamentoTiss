import { useState, useEffect, useMemo, useCallback } from 'react';
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
  BanknotesIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  LockClosedIcon,
  LockOpenIcon,
  UserGroupIcon,
  CalendarIcon,
  XCircleIcon,
  PrinterIcon,
  ArchiveBoxIcon,
  PlayIcon,
  StopIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { supabase } from '../lib/supabaseClient';
import { gerarXMLTISS, converterAtendimentoParaTISS, setVersao } from '../lib/tissGenerator';

const MAX_GUIAS_POR_LOTE = 100;

export default function Faturamento() {
  const [atendimentos, setAtendimentos] = useState([]);
  const [convenios, setConvenios] = useState([]);
  const [prestadores, setPrestadores] = useState([]);
  const [procedimentos, setProcedimentos] = useState([]);
  const [selecionados, setSelecionados] = useState([]);
  const [bloqueados, setBloqueados] = useState([]);
  const [gerando, setGerando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guiasGeradas, setGuiasGeradas] = useState([]);
  const [filtroConvenio, setFiltroConvenio] = useState('todos');
  const [filtroEspecialidade, setFiltroEspecialidade] = useState('todos');
  const [filtroPrestador, setFiltroPrestador] = useState('todos');
  const [filtroTipoAtendimento, setFiltroTipoAtendimento] = useState('todos');
  const [ordem, setOrdem] = useState('guia');
  const [ordemDirecao, setOrdemDirecao] = useState('asc');
  const [versaoTISS, setVersaoTISS] = useState('4.03.00');
  const [showLoteModal, setShowLoteModal] = useState(false);
  const [showPreviaModal, setShowPreviaModal] = useState(false);
  const [showFiltrosAvancados, setShowFiltrosAvancados] = useState(false);
  const [showHistoricoLogs, setShowHistoricoLogs] = useState(false);
  const [showGerarPorLote, setShowGerarPorLote] = useState(false);
  const [selectedLote, setSelectedLote] = useState(null);
  const [sequencialGlobal, setSequencialGlobal] = useState(1);
  const [logsLotes, setLogsLotes] = useState([]);
  const [numeroLoteBusca, setNumeroLoteBusca] = useState('');
  const [loteEncontrado, setLoteEncontrado] = useState(null);
  const [numeroLotePreview, setNumeroLotePreview] = useState('');
  
  const [dadosFatura, setDadosFatura] = useState({
    competencia: format(new Date(), 'yyyy-MM'),
    dataFechamento: format(new Date(), 'yyyy-MM-dd'),
    dataPrevisaoPagamento: '',
    baseCalculo: 0,
    aliquotaISS: 5,
    valorISS: 0,
    aliquotaIBS: 0,
    valorIBS: 0,
    aliquotaCBS: 0,
    valorCBS: 0,
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

  // ============================================
  // FUNÇÕES DE CARREGAMENTO
  // ============================================

  const carregarSequencial = async () => {
    try {
      const { data } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'sequencial_faturamento')
        .maybeSingle();
      
      if (data?.valor) {
        setSequencialGlobal(parseInt(data.valor));
      }
    } catch (error) {
      console.error('Erro ao carregar sequencial:', error);
    }
  };

  const carregarBloqueados = async () => {
    try {
      const { data } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'guias_bloqueadas')
        .maybeSingle();
      
      if (data?.valor) {
        const bloqueadosList = JSON.parse(data.valor);
        setBloqueados(Array.isArray(bloqueadosList) ? bloqueadosList : []);
      } else {
        setBloqueados([]);
      }
    } catch (error) {
      console.error('Erro ao carregar bloqueados:', error);
      setBloqueados([]);
    }
  };

  const carregarLogs = async () => {
    try {
      const { data } = await supabase
        .from('logs_faturamento')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setLogsLotes(data || []);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      setLogsLotes([]);
    }
  };

  const carregarDados = async () => {
    try {
      // Carregar APENAS atendimentos com status 'faturado'
      const { data } = await supabase
        .from('atendimentos')
        .select('*')
        .eq('status', 'faturado')
        .order('created_at', { ascending: false });
      
      console.log('Atendimentos FATURADOS carregados:', data?.length);
      
      setAtendimentos(data || []);
      
      const [conveniosRes, prestadoresRes, procedimentosRes] = await Promise.all([
        supabase.from('convenios').select('*').eq('ativo', true).order('razao_social'),
        supabase.from('prestadores').select('*').order('nome'),
        supabase.from('procedimentos').select('*').order('nome')
      ]);
  
      if (conveniosRes.error) throw conveniosRes.error;
      if (prestadoresRes.error) throw prestadoresRes.error;
      if (procedimentosRes.error) throw procedimentosRes.error;
  
      setConvenios(conveniosRes.data || []);
      setPrestadores(prestadoresRes.data || []);
      setProcedimentos(procedimentosRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
      setAtendimentos([]);
    }
  };

  const carregarVersao = async () => {
    try {
      const { data } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'versao_tiss')
        .maybeSingle();
      if (data?.valor) setVersaoTISS(data.valor);
    } catch (error) {
      console.error('Erro ao carregar versão:', error);
    }
  };

  const carregarLotes = async () => {
    try {
      const { data } = await supabase
        .from('lotes_faturamento')
        .select('*')
        .order('created_at', { ascending: false });
      setGuiasGeradas(data || []);
    } catch (error) {
      console.error('Erro ao carregar lotes:', error);
      setGuiasGeradas([]);
    }
  };

  // ============================================
  // FUNÇÕES DE UTILIDADE
  // ============================================

  const gerarNumeroLote = () => {
    const data = new Date();
    const ano = data.getFullYear().toString().slice(-2);
    const mes = (data.getMonth() + 1).toString().padStart(2, '0');
    const dia = data.getDate().toString().padStart(2, '0');
    const seq = sequencialGlobal.toString().padStart(6, '0');
    return `${ano}${mes}${dia}${seq}`;
  };

  const calcularImpostos = (baseCalculo, aliquotaISS, aliquotaIBS, aliquotaCBS, aliquotaIR, aliquotaCSLL, aliquotaPIS, aliquotaCOFINS) => {
    const iss = (baseCalculo * aliquotaISS) / 100;
    const ibs = (baseCalculo * aliquotaIBS) / 100;
    const cbs = (baseCalculo * aliquotaCBS) / 100;
    const ir = (baseCalculo * aliquotaIR) / 100;
    const csll = (baseCalculo * aliquotaCSLL) / 100;
    const pis = (baseCalculo * aliquotaPIS) / 100;
    const cofins = (baseCalculo * aliquotaCOFINS) / 100;
    const totalImpostos = iss + ibs + cbs + ir + csll + pis + cofins;
    const valorLiquido = baseCalculo - totalImpostos;
    return { iss, ibs, cbs, ir, csll, pis, cofins, totalImpostos, valorLiquido };
  };

  const atualizarTodosImpostos = (baseCalculo) => {
    setDadosFatura(prev => {
      const impostos = calcularImpostos(
        baseCalculo,
        prev.aliquotaISS,
        prev.aliquotaIBS,
        prev.aliquotaCBS,
        prev.aliquotaIR,
        prev.aliquotaCSLL,
        prev.aliquotaPIS,
        prev.aliquotaCOFINS
      );
      return {
        ...prev,
        baseCalculo: baseCalculo,
        valorISS: impostos.iss,
        valorIBS: impostos.ibs,
        valorCBS: impostos.cbs,
        valorIR: impostos.ir,
        valorCSLL: impostos.csll,
        valorPIS: impostos.pis,
        valorCOFINS: impostos.cofins,
        valorLiquido: impostos.valorLiquido
      };
    });
  };

  const atualizarAliquota = (campo, valor) => {
    const novaAliquota = parseFloat(valor) || 0;
    
    setDadosFatura(prev => {
      const novosDados = { ...prev, [campo]: novaAliquota };
      const impostos = calcularImpostos(
        novosDados.baseCalculo,
        campo === 'aliquotaISS' ? novaAliquota : novosDados.aliquotaISS,
        campo === 'aliquotaIBS' ? novaAliquota : novosDados.aliquotaIBS,
        campo === 'aliquotaCBS' ? novaAliquota : novosDados.aliquotaCBS,
        campo === 'aliquotaIR' ? novaAliquota : novosDados.aliquotaIR,
        campo === 'aliquotaCSLL' ? novaAliquota : novosDados.aliquotaCSLL,
        campo === 'aliquotaPIS' ? novaAliquota : novosDados.aliquotaPIS,
        campo === 'aliquotaCOFINS' ? novaAliquota : novosDados.aliquotaCOFINS
      );
      return {
        ...novosDados,
        valorISS: impostos.iss,
        valorIBS: impostos.ibs,
        valorCBS: impostos.cbs,
        valorIR: impostos.ir,
        valorCSLL: impostos.csll,
        valorPIS: impostos.pis,
        valorCOFINS: impostos.cofins,
        valorLiquido: impostos.valorLiquido
      };
    });
  };

  const salvarBloqueados = async (bloqueadosList) => {
    try {
      await supabase
        .from('configuracoes')
        .upsert([
          {
            chave: 'guias_bloqueadas',
            valor: JSON.stringify(bloqueadosList),
            descricao: 'Lista de guias bloqueadas para faturamento',
            updated_at: new Date().toISOString()
          }
        ], { onConflict: 'chave' });
    } catch (error) {
      console.error('Erro ao salvar bloqueados:', error);
    }
  };

  const atualizarSequencial = async (novoSequencial) => {
    try {
      await supabase
        .from('configuracoes')
        .upsert([
          {
            chave: 'sequencial_faturamento',
            valor: novoSequencial.toString(),
            descricao: 'Sequencial para faturamento TISS',
            updated_at: new Date().toISOString()
          }
        ], { onConflict: 'chave' });
    } catch (error) {
      console.error('Erro ao atualizar sequencial:', error);
    }
  };

  const registrarLog = async (acao, lote, detalhes) => {
    try {
      await supabase
        .from('logs_faturamento')
        .insert({
          acao,
          numero_lote: lote.numero_lote,
          convenio_nome: lote.convenio_nome,
          quantidade_guias: lote.quantidade_guias,
          valor_total: lote.dados_fatura?.base_calculo,
          detalhes,
          usuario: 'sistema',
          created_at: new Date().toISOString()
        });
      await carregarLogs();
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  };

  // ============================================
  // FUNÇÕES DE FILTRAGEM E SELEÇÃO
  // ============================================

  const atendimentosFiltrados = useMemo(() => {
    let filtrados = [...atendimentos];
    
    if (filtroConvenio !== 'todos') {
      filtrados = filtrados.filter(a => a.paciente_convenio_id === parseInt(filtroConvenio));
    }
    if (filtroEspecialidade !== 'todos') {
      filtrados = filtrados.filter(a => a.prestador_especialidade === filtroEspecialidade);
    }
    if (filtroPrestador !== 'todos') {
      filtrados = filtrados.filter(a => a.prestador_id === parseInt(filtroPrestador));
    }
    if (filtroTipoAtendimento !== 'todos') {
      filtrados = filtrados.filter(a => a.tipo_atendimento === filtroTipoAtendimento);
    }
    
    filtrados.sort((a, b) => {
      let valorA, valorB;
      switch(ordem) {
        case 'guia':
          valorA = a.numero_guia_prestador || '';
          valorB = b.numero_guia_prestador || '';
          break;
        case 'alfabetica':
          valorA = a.paciente_nome || '';
          valorB = b.paciente_nome || '';
          break;
        case 'atendimento':
          valorA = a.data_atendimento || '';
          valorB = b.data_atendimento || '';
          break;
        case 'valor':
          valorA = a.valor_total || 0;
          valorB = b.valor_total || 0;
          break;
        default:
          valorA = a.numero_guia_prestador || '';
          valorB = b.numero_guia_prestador || '';
      }
      if (ordemDirecao === 'asc') {
        return valorA > valorB ? 1 : -1;
      } else {
        return valorA < valorB ? 1 : -1;
      }
    });
    
    return filtrados;
  }, [atendimentos, filtroConvenio, filtroEspecialidade, filtroPrestador, filtroTipoAtendimento, ordem, ordemDirecao]);

  const atendimentosPorConvenio = useMemo(() => {
    return atendimentosFiltrados.reduce((acc, a) => {
      const convenioId = a.paciente_convenio_id;
      if (!acc[convenioId]) acc[convenioId] = [];
      acc[convenioId].push(a);
      return acc;
    }, {});
  }, [atendimentosFiltrados]);

  const totalSelecionados = selecionados.length;
  const totalFaturados = atendimentos.length;
  const valorTotalFaturado = atendimentos.reduce((sum, a) => sum + (a.valor_total || 0), 0);

  // ============================================
  // FUNÇÕES DE INTERAÇÃO
  // ============================================

  const toggleBloqueio = async (id) => {
    let novosBloqueados;
    if (bloqueados.includes(id)) {
      novosBloqueados = bloqueados.filter(b => b !== id);
      toast.info('Guia desbloqueada');
    } else {
      novosBloqueados = [...bloqueados, id];
      toast.info('Guia bloqueada');
    }
    setBloqueados(novosBloqueados);
    await salvarBloqueados(novosBloqueados);
  };

  const selecionarTodos = () => {
    const ids = atendimentosFiltrados.filter(a => !bloqueados.includes(a.id)).map(a => a.id);
    setSelecionados(ids);
  };

  const desmarcarTodos = () => {
    setSelecionados([]);
  };

  const selecionarBloqueados = () => {
    setSelecionados(bloqueados);
  };

  const handleSelectItem = (id) => {
    if (selecionados.includes(id)) {
      setSelecionados(selecionados.filter(i => i !== id));
    } else {
      if (selecionados.length < MAX_GUIAS_POR_LOTE) {
        setSelecionados([...selecionados, id]);
      } else {
        toast.warning(`Limite de ${MAX_GUIAS_POR_LOTE} guias por lote`);
      }
    }
  };

  // ============================================
  // FUNÇÃO PARA FINALIZAR GUIAS FATURADAS
  // ============================================

  const finalizarGuiasSelecionadas = async () => {
    if (selecionados.length === 0) {
      toast.error('Selecione pelo menos uma guia para finalizar');
      return;
    }
    
    if (!confirm(`Finalizar ${selecionados.length} guia(s) faturada(s)? Isso irá bloquear a edição permanentemente.`)) return;
    
    setGerando(true);
    
    try {
      // Atualizar as guias para status 'finalizado'
      const { error: updateError } = await supabase
        .from('atendimentos')
        .update({ 
          status: 'finalizado',
          updated_at: new Date().toISOString() 
        })
        .in('id', selecionados);
      
      if (updateError) throw updateError;
      
      // Registrar log das guias finalizadas
      const loteInfo = {
        numero_lote: 'FINALIZACAO_DIRETA',
        convenio_nome: 'Múltiplos Convênios',
        quantidade_guias: selecionados.length,
        dados_fatura: { base_calculo: 0 }
      };
      
      await registrarLog('FINALIZACAO_LOTE', loteInfo, `${selecionados.length} guias finalizadas diretamente. IDs: ${selecionados.join(', ')}`);
      
      await carregarDados();
      setSelecionados([]);
      
      toast.success(`${selecionados.length} guia(s) finalizada(s) e bloqueada(s) para edição!`);
    } catch (error) {
      console.error('Erro ao finalizar guias:', error);
      toast.error('Erro ao finalizar guias: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setGerando(false);
    }
  };

  const buscarLoteParaRegenerar = async () => {
    if (!numeroLoteBusca) {
      toast.error('Digite o número do lote');
      return;
    }
    
    try {
      const { data } = await supabase
        .from('lotes_faturamento')
        .select('*')
        .eq('numero_lote', numeroLoteBusca)
        .maybeSingle();
      
      if (data) {
        setLoteEncontrado(data);
        toast.success('Lote encontrado!');
      } else {
        setLoteEncontrado(null);
        toast.error('Lote não encontrado');
      }
    } catch (error) {
      console.error('Erro ao buscar lote:', error);
      toast.error('Erro ao buscar lote');
    }
  };

  const regenerarPorNumeroLote = async () => {
    if (!loteEncontrado) return;
    
    if (!confirm(`Regenerar o lote ${loteEncontrado.numero_lote}? Isso irá recriar o XML com os dados atuais.`)) return;
    
    setGerando(true);
    
    try {
      const { data: atendimentosOriginais } = await supabase
        .from('atendimentos')
        .select('*')
        .in('id', loteEncontrado.guias_ids || []);

      const convenio = convenios.find(c => c.id === loteEncontrado.convenio_id);
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
        numeroLote: loteEncontrado.numero_lote,
        guias: novasGuias,
        convenio: convenio
      });

      const nomeArquivo = `${loteEncontrado.numero_lote}_${convenio.registro_ans}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xml`;

      const novoLote = {
        ...loteEncontrado,
        id: undefined,
        data_envio: format(new Date(), 'yyyy-MM-dd'),
        xml_content: xml,
        regenerado: true,
        regenerado_de: loteEncontrado.numero_lote,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await supabase.from('lotes_faturamento').insert([novoLote]);
      await registrarLog('REGENERACAO_XML', novoLote, `XML regenerado para o lote ${loteEncontrado.numero_lote}`);
      await carregarLotes();

      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nomeArquivo;
      a.click();
      URL.revokeObjectURL(url);
      
      setShowGerarPorLote(false);
      setNumeroLoteBusca('');
      setLoteEncontrado(null);
      toast.success(`XML do lote ${loteEncontrado.numero_lote} regenerado!`);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao regenerar lote');
    } finally {
      setGerando(false);
    }
  };

  const regenerarLote = async (lote) => {
    if (!confirm(`Regenerar o XML do lote ${lote.numero_lote}?`)) return;
    setGerando(true);

    try {
      const { data: atendimentosOriginais } = await supabase
        .from('atendimentos')
        .select('*')
        .in('id', lote.guias_ids || []);

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
      
      await supabase.from('lotes_faturamento').insert([novoLote]);
      await registrarLog('REGENERACAO_XML', novoLote, `XML regenerado para o lote ${lote.numero_lote}`);
      await carregarLotes();

      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nomeArquivo;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success(`XML do lote ${lote.numero_lote} regenerado!`);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao regenerar lote');
    } finally {
      setGerando(false);
    }
  };

  const cancelarLote = async (lote) => {
    if (!confirm(`Cancelar o lote ${lote.numero_lote}? As guias serão reabertas com status "pendente".`)) return;
    
    setGerando(true);
    
    try {
      const guiasIds = lote.guias_ids || [];
      
      if (guiasIds.length === 0) {
        toast.error('Nenhuma guia encontrada neste lote');
        setGerando(false);
        return;
      }
      
      const { error: updateError } = await supabase
        .from('atendimentos')
        .update({ 
          status: 'pendente', 
          fatura_lote: null,
          data_faturamento: null,
          updated_at: new Date().toISOString() 
        })
        .in('id', guiasIds);
      
      if (updateError) throw updateError;
      
      await registrarLog('CANCELAMENTO_LOTE', lote, `Lote cancelado. ${guiasIds.length} guias reabertas com status "pendente".`);
      
      const { error: deleteError } = await supabase
        .from('lotes_faturamento')
        .delete()
        .eq('id', lote.id);
      
      if (deleteError) throw deleteError;
      
      await carregarLotes();
      await carregarDados();
      toast.success(`${guiasIds.length} guia(s) reaberta(s) com status "pendente"!`);
    } catch (error) {
      console.error('Erro ao cancelar lote:', error);
      toast.error('Erro ao cancelar lote: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setGerando(false);
    }
  };
  
  const finalizarLote = async (lote) => {
    if (!confirm(`Finalizar o lote ${lote.numero_lote}? As guias serão bloqueadas para edição permanente.`)) return;
    
    setGerando(true);
    
    try {
      const guiasIds = lote.guias_ids || [];
      
      if (guiasIds.length === 0) {
        toast.error('Nenhuma guia encontrada neste lote');
        setGerando(false);
        return;
      }
      
      const { error: updateError } = await supabase
        .from('atendimentos')
        .update({ 
          status: 'finalizado',
          updated_at: new Date().toISOString() 
        })
        .in('id', guiasIds);
      
      if (updateError) throw updateError;
      
      await registrarLog('FINALIZACAO_LOTE', lote, `Lote finalizado. ${guiasIds.length} guias bloqueadas para edição.`);
      
      const { error: updateLoteError } = await supabase
        .from('lotes_faturamento')
        .update({ 
          status: 'finalizado',
          updated_at: new Date().toISOString() 
        })
        .eq('id', lote.id);
      
      if (updateLoteError) throw updateLoteError;
      
      await carregarLotes();
      await carregarDados();
      toast.success(`${guiasIds.length} guia(s) finalizada(s) e bloqueada(s) para edição!`);
    } catch (error) {
      console.error('Erro ao finalizar lote:', error);
      toast.error('Erro ao finalizar lote: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setGerando(false);
    }
  };

  const gerarXMLporLote = (lote) => {
    const blob = new Blob([lote.xml_content], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lote.numero_lote}.xml`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('XML baixado!');
  };

  const visualizarLote = (lote) => {
    setSelectedLote(lote);
    setShowLoteModal(true);
  };

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    const carregarTodosDados = async () => {
      setLoading(true);
      try {
        await Promise.all([
          carregarDados(),
          carregarVersao(),
          carregarLotes(),
          carregarSequencial(),
          carregarBloqueados(),
          carregarLogs()
        ]);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };
    
    carregarTodosDados();
  }, []);

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
              Finalização de Guias Faturadas
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Finalize guias faturadas para bloquear edição permanente
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
            <button 
              onClick={() => setShowGerarPorLote(!showGerarPorLote)} 
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition-all"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              Gerar por Nº Lote
            </button>
            <button 
              onClick={() => setShowHistoricoLogs(!showHistoricoLogs)} 
              className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
            >
              <ArchiveBoxIcon className="w-4 h-4" />
              {showHistoricoLogs ? 'Ocultar Logs' : 'Ver Logs'}
            </button>
            {totalSelecionados > 0 && (
              <button 
                onClick={finalizarGuiasSelecionadas} 
                disabled={gerando} 
                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
              >
                <LockClosedIcon className="w-4 h-4" />
                Finalizar Selecionados ({totalSelecionados})
              </button>
            )}
          </div>
        </div>

        {/* Modal de Gerar por Número do Lote */}
        {showGerarPorLote && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 mb-6 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-800 dark:text-white">Gerar XML por Número do Lote</h3>
              <button onClick={() => setShowGerarPorLote(false)} className="text-gray-500 hover:text-gray-700"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Digite o número do lote"
                value={numeroLoteBusca}
                onChange={(e) => setNumeroLoteBusca(e.target.value)}
                className="flex-1 border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
              />
              <button onClick={buscarLoteParaRegenerar} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Buscar</button>
            </div>
            {loteEncontrado && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div><span className="text-gray-500">Nº Lote:</span> <span className="font-mono font-bold">{loteEncontrado.numero_lote}</span></div>
                  <div><span className="text-gray-500">Convênio:</span> {loteEncontrado.convenio_nome}</div>
                  <div><span className="text-gray-500">Data:</span> {loteEncontrado.data_envio}</div>
                  <div><span className="text-gray-500">Guias:</span> {loteEncontrado.quantidade_guias}</div>
                </div>
                <button onClick={regenerarPorNumeroLote} disabled={gerando} className="mt-3 bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-700 w-full">Regenerar XML deste Lote</button>
              </div>
            )}
          </div>
        )}

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center">
              <div><p className="text-xs text-gray-500 dark:text-gray-400">Total Faturados</p><p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalFaturados}</p></div>
              <CheckIcon className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center">
              <div><p className="text-xs text-gray-500 dark:text-gray-400">Selecionados</p><p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalSelecionados}</p></div>
              <CheckIcon className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center">
              <div><p className="text-xs text-gray-500 dark:text-gray-400">Bloqueados</p><p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{bloqueados.length}</p></div>
              <LockClosedIcon className="w-8 h-8 text-orange-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center">
              <div><p className="text-xs text-gray-500 dark:text-gray-400">Valor Total</p><p className="text-2xl font-bold text-purple-600 dark:text-purple-400">R$ {valorTotalFaturado.toFixed(2)}</p></div>
              <CurrencyDollarIcon className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Botões de Ação Rápida */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={selecionarTodos} className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm hover:from-blue-600 hover:to-blue-700 transition-all">Selecionar Todos (Não Bloqueados)</button>
          <button onClick={desmarcarTodos} className="px-3 py-1.5 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-all">Desmarcar Todos</button>
          <button onClick={selecionarBloqueados} className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition-all">Selecionar Bloqueados</button>
          <button onClick={() => setShowFiltrosAvancados(!showFiltrosAvancados)} className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">
            <FunnelIcon className="w-4 h-4" /> Filtros Avançados
          </button>
        </div>

        {/* Filtros Avançados */}
        {showFiltrosAvancados && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 mb-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Convênio</label>
                <select value={filtroConvenio} onChange={(e) => setFiltroConvenio(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option value="todos">Todos</option>
                  {convenios.map(c => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Especialidade</label>
                <select value={filtroEspecialidade} onChange={(e) => setFiltroEspecialidade(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option value="todos">Todas</option>
                  {[...new Set(prestadores.map(p => p.especialidade))].filter(Boolean).map(esp => (
                    <option key={esp} value={esp}>{esp}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Profissional</label>
                <select value={filtroPrestador} onChange={(e) => setFiltroPrestador(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option value="todos">Todos</option>
                  {prestadores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Ordenar por</label>
                <div className="flex gap-2">
                  <select value={ordem} onChange={(e) => setOrdem(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="guia">Nº Guia</option>
                    <option value="alfabetica">Ordem Alfabética</option>
                    <option value="atendimento">Data Atendimento</option>
                    <option value="valor">Valor</option>
                  </select>
                  <button onClick={() => setOrdemDirecao(ordemDirecao === 'asc' ? 'desc' : 'asc')} className="p-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    {ordemDirecao === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de atendimentos por convênio */}
        {Object.entries(atendimentosPorConvenio).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(atendimentosPorConvenio).map(([convenioId, convenioAtendimentos], index) => {
              const convenio = convenios.find(c => c.id === parseInt(convenioId));
              if (!convenio) return null;
              const selecionadosCount = convenioAtendimentos.filter(a => selecionados.includes(a.id)).length;
              const totalConvenio = convenioAtendimentos.reduce((sum, a) => sum + (a.valor_total || 0), 0);
              const idsConvenio = convenioAtendimentos.filter(a => !bloqueados.includes(a.id)).map(a => a.id);
              
              return (
                <div key={convenio.id || `convenio-${convenioId}-${index}`} className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700/50 flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <BuildingOfficeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="font-semibold text-gray-800 dark:text-white">{convenio.razao_social}</span>
                      <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">Código: {convenio.codigo_prestador}</span>
                      <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">ANS: {convenio.registro_ans}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total: R$ {totalConvenio.toFixed(2)}</span>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full">{selecionadosCount}/{convenioAtendimentos.length} selecionados</span>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                          <th className="px-4 py-3 text-left w-8">
                            <input 
                              type="checkbox" 
                              checked={selecionadosCount === idsConvenio.length && idsConvenio.length > 0} 
                              onChange={() => {
                                if (selecionadosCount === idsConvenio.length) {
                                  setSelecionados(selecionados.filter(id => !idsConvenio.includes(id)));
                                } else {
                                  if (selecionados.length + idsConvenio.length <= MAX_GUIAS_POR_LOTE) {
                                    setSelecionados([...selecionados, ...idsConvenio]);
                                  } else {
                                    toast.warning(`Limite de ${MAX_GUIAS_POR_LOTE} guias por lote`);
                                  }
                                }
                              }} 
                              className="rounded w-4 h-4 text-blue-600 focus:ring-blue-500" 
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Nº Guia</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Nº Guia Operadora</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Senha</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Data</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Paciente</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Carteira</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Profissional</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Valor</th>
                          <th className="px-4 py-3 text-center w-28">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {convenioAtendimentos.map((a) => (
                          <tr key={a.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${bloqueados.includes(a.id) ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}>
                            <td className="px-4 py-3">
                              <input 
                                type="checkbox" 
                                checked={selecionados.includes(a.id)} 
                                onChange={() => handleSelectItem(a.id)} 
                                disabled={bloqueados.includes(a.id)} 
                                className="rounded w-4 h-4 text-blue-600 focus:ring-blue-500 disabled:opacity-50" 
                              />
                            </td>
                            <td className="px-4 py-3 text-xs font-mono text-blue-600 dark:text-blue-400 font-medium">{a.numero_guia_prestador || '-'}</td>
                            <td className="px-4 py-3 text-xs font-mono text-gray-600 dark:text-gray-400">{a.numero_guia_operadora || '-'}</td>
                            <td className="px-4 py-3 text-xs font-mono text-gray-600 dark:text-gray-400">{a.senha_autorizacao || '-'}</td>
                            <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{a.data_atendimento || (a.itens && a.itens[0]?.data_execucao) || '-'}</td>
                            <td className="px-4 py-3 text-xs font-medium text-gray-800 dark:text-white">{a.paciente_nome || '-'}</td>
                            <td className="px-4 py-3 text-xs font-mono text-gray-600 dark:text-gray-400">{a.numero_carteira || '-'}</td>
                            <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{a.prestador_nome || '-'}</td>
                            <td className="px-4 py-3 text-xs font-semibold text-right text-gray-700 dark:text-gray-300">R$ {(a.valor_total || 0).toFixed(2)}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex gap-1 justify-center">
                                <button onClick={() => visualizarLote({...a, xml_content: a.xml_content || 'XML não disponível'})} className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Visualizar">
                                  <EyeIcon className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => toggleBloqueio(a.id)} 
                                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" 
                                  title={bloqueados.includes(a.id) ? 'Desbloquear' : 'Bloquear'}
                                >
                                  {bloqueados.includes(a.id) ? <LockOpenIcon className="w-4 h-4 text-green-500" /> : <LockClosedIcon className="w-4 h-4 text-orange-500" />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 dark:bg-gray-700/50">
                        <tr className="border-t">
                          <td colSpan="8" className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Total do Convênio:</td>
                          <td className="px-4 py-3 text-right font-bold text-blue-600 dark:text-blue-400">R$ {totalConvenio.toFixed(2)}</td>
                          <td className="px-4 py-3"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-12 text-center">
            <CheckIcon className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
            <p className="text-gray-500 dark:text-gray-400">Nenhuma guia faturada encontrada</p>
            <p className="text-xs text-gray-400 mt-2">As guias aparecerão aqui após serem faturadas no módulo de Atendimentos</p>
          </div>
        )}

        {/* Histórico de Lotes */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Lotes Gerados</h3>
            <button onClick={carregarLotes} className="text-blue-600 dark:text-blue-400 text-sm flex items-center gap-1 hover:text-blue-700 transition-colors"><ArrowPathIcon className="w-4 h-4" /> Atualizar</button>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Convênio</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Nº Lote</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Guias</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Valor</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 w-56">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {guiasGeradas.map((g) => (
                    <tr key={g.id || `lote-${g.numero_lote}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{g.convenio_nome}</td>
                      <td className="px-4 py-3 text-xs font-mono text-blue-600 dark:text-blue-400 font-medium">{g.numero_lote}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{g.data_envio}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{g.quantidade_guias}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300">R$ {(g.dados_fatura?.base_calculo || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-1 justify-center flex-wrap">
                          <button onClick={() => visualizarLote(g)} className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Visualizar XML">
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => gerarXMLporLote(g)} className="p-1 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors" title="Baixar XML">
                            <DocumentArrowDownIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => regenerarLote(g)} disabled={gerando} className="p-1 rounded-lg text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors" title="Regenerar XML">
                            <ArrowPathIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => cancelarLote(g)} disabled={gerando} className="p-1 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Cancelar Lote (Reabrir Guias)">
                            <XCircleIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => finalizarLote(g)} disabled={gerando} className="p-1 rounded-lg text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors" title="Finalizar Lote (Bloquear Edição)">
                            <LockClosedIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {guiasGeradas.length === 0 && (
                    <tr key="no-lotes-row">
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

        {/* Histórico de Logs */}
        {showHistoricoLogs && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Histórico de Logs</h3>
              <button onClick={carregarLogs} className="text-blue-600 dark:text-blue-400 text-sm flex items-center gap-1"><ArrowPathIcon className="w-4 h-4" /> Atualizar</button>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Data/Hora</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Ação</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Nº Lote</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Convênio</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Guias</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Valor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Detalhes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {logsLotes.map((log) => (
                      <tr key={log.id || `log-${log.created_at}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs">
                          <span className={`px-2 py-1 rounded-full text-xs ${log.acao === 'GERACAO_LOTE' ? 'bg-green-100 text-green-700' : log.acao === 'CANCELAMENTO_LOTE' ? 'bg-red-100 text-red-700' : log.acao === 'FINALIZACAO_LOTE' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {log.acao === 'GERACAO_LOTE' ? 'Geração' : log.acao === 'CANCELAMENTO_LOTE' ? 'Cancelamento' : log.acao === 'FINALIZACAO_LOTE' ? 'Finalização' : 'Regeneração'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-blue-600">{log.numero_lote}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{log.convenio_nome}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{log.quantidade_guias}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-gray-700">R$ {(log.valor_total || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{log.detalhes}</td>
                      </tr>
                    ))}
                    {logsLotes.length === 0 && (
                      <tr key="no-logs-row">
                        <td colSpan="7" className="px-4 py-12 text-center text-gray-500">Nenhum log encontrado</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Visualização do XML */}
        {showLoteModal && selectedLote && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">XML do Lote / Guia</h3>
                  <button onClick={() => setShowLoteModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><XMarkIcon className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div><span className="text-xs text-gray-500 dark:text-gray-400">Número:</span> <span className="text-sm font-mono font-medium">{selectedLote.numero_lote || selectedLote.numero_guia_prestador}</span></div>
                  <div><span className="text-xs text-gray-500 dark:text-gray-400">Convênio:</span> <span className="text-sm font-medium">{selectedLote.convenio_nome || selectedLote.paciente_convenio_nome}</span></div>
                  <div><span className="text-xs text-gray-500 dark:text-gray-400">Data:</span> <span className="text-sm">{selectedLote.data_envio || selectedLote.data_atendimento}</span></div>
                  <div><span className="text-xs text-gray-500 dark:text-gray-400">Guias:</span> <span className="text-sm font-bold">{selectedLote.quantidade_guias || 1}</span></div>
                </div>
                {selectedLote.dados_fatura && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <div><span className="text-xs text-gray-500">Competência:</span> <span className="text-sm">{selectedLote.dados_fatura.competencia}</span></div>
                    <div><span className="text-xs text-gray-500">Fechamento:</span> <span className="text-sm">{selectedLote.dados_fatura.data_fechamento}</span></div>
                    <div><span className="text-xs text-gray-500">Valor Líquido:</span> <span className="text-sm font-bold text-green-600">R$ {(selectedLote.dados_fatura.valor_liquido || 0).toFixed(2)}</span></div>
                    <div><span className="text-xs text-gray-500">Previsão Pagto:</span> <span className="text-sm">{selectedLote.dados_fatura.data_previsao_pagamento || '-'}</span></div>
                  </div>
                )}
                <div className="bg-gray-900 rounded-xl p-4 overflow-auto max-h-96">
                  <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">{selectedLote.xml_content || 'XML não disponível para esta guia'}</pre>
                </div>
                <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button onClick={() => { if(selectedLote.xml_content) { const blob = new Blob([selectedLote.xml_content], { type: 'application/xml' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${selectedLote.numero_lote || selectedLote.numero_guia_prestador}.xml`; a.click(); URL.revokeObjectURL(url); toast.success('XML baixado!'); } else { toast.error('XML não disponível'); } }} className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg">Baixar XML</button>
                  <button onClick={() => setShowLoteModal(false)} className="px-4 py-2 border rounded-lg">Fechar</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instruções */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">📋 Informações</h4>
          <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
            <li>• Esta página exibe <strong>apenas guias com status "faturado"</strong></li>
            <li>• Use os botões de bloqueio/desbloqueio para controlar quais guias serão finalizadas</li>
            <li>• <strong>Finalizar uma guia</strong> altera o status para "finalizado" e bloqueia a edição permanentemente</li>
            <li>• <strong>Cancelar um lote</strong> reabre as guias com status "pendente" permitindo edição</li>
            <li>• Guias bloqueadas aparecem com fundo laranja</li>
            <li>• Use "Gerar por Nº Lote" para regenerar o XML de um lote específico</li>
            <li>• O faturamento das guias (geração de XML) é feito no módulo de Atendimentos</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
