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
  ArchiveBoxIcon
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
      const [atendimentosRes, conveniosRes, prestadoresRes, procedimentosRes] = await Promise.all([
        supabase.from('atendimentos').select('*').eq('status', 'pendente').order('created_at', { ascending: false }),
        supabase.from('convenios').select('*').eq('ativo', true).order('razao_social'),
        supabase.from('prestadores').select('*').order('nome'),
        supabase.from('procedimentos').select('*').order('nome')
      ]);

      if (atendimentosRes.error) throw atendimentosRes.error;
      if (conveniosRes.error) throw conveniosRes.error;
      if (prestadoresRes.error) throw prestadoresRes.error;
      if (procedimentosRes.error) throw procedimentosRes.error;

      setAtendimentos(atendimentosRes.data || []);
      setConvenios(conveniosRes.data || []);
      setPrestadores(prestadoresRes.data || []);
      setProcedimentos(procedimentosRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
      setAtendimentos([]);
      setConvenios([]);
      setPrestadores([]);
      setProcedimentos([]);
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

  const atualizarTodosImpostos = useCallback((baseCalculo) => {
    const impostos = calcularImpostos(
      baseCalculo,
      dadosFatura.aliquotaISS,
      dadosFatura.aliquotaIBS,
      dadosFatura.aliquotaCBS,
      dadosFatura.aliquotaIR,
      dadosFatura.aliquotaCSLL,
      dadosFatura.aliquotaPIS,
      dadosFatura.aliquotaCOFINS
    );
    setDadosFatura(prev => ({
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
    }));
  }, [dadosFatura.aliquotaISS, dadosFatura.aliquotaIBS, dadosFatura.aliquotaCBS, 
      dadosFatura.aliquotaIR, dadosFatura.aliquotaCSLL, dadosFatura.aliquotaPIS, 
      dadosFatura.aliquotaCOFINS]);

  const atualizarAliquota = (campo, valor) => {
    const novaAliquota = parseFloat(valor) || 0;
    setDadosFatura(prev => ({ ...prev, [campo]: novaAliquota }));
    const impostos = calcularImpostos(
      dadosFatura.baseCalculo,
      campo === 'aliquotaISS' ? novaAliquota : dadosFatura.aliquotaISS,
      campo === 'aliquotaIBS' ? novaAliquota : dadosFatura.aliquotaIBS,
      campo === 'aliquotaCBS' ? novaAliquota : dadosFatura.aliquotaCBS,
      campo === 'aliquotaIR' ? novaAliquota : dadosFatura.aliquotaIR,
      campo === 'aliquotaCSLL' ? novaAliquota : dadosFatura.aliquotaCSLL,
      campo === 'aliquotaPIS' ? novaAliquota : dadosFatura.aliquotaPIS,
      campo === 'aliquotaCOFINS' ? novaAliquota : dadosFatura.aliquotaCOFINS
    );
    setDadosFatura(prev => ({
      ...prev,
      [campo]: novaAliquota,
      valorISS: impostos.iss,
      valorIBS: impostos.ibs,
      valorCBS: impostos.cbs,
      valorIR: impostos.ir,
      valorCSLL: impostos.csll,
      valorPIS: impostos.pis,
      valorCOFINS: impostos.cofins,
      valorLiquido: impostos.valorLiquido
    }));
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

  const pendentes = Array.isArray(atendimentos) ? atendimentos.filter(a => a.status === 'pendente') : [];
  const todosAtendimentos = [...pendentes, ...(Array.isArray(atendimentos) ? atendimentos.filter(a => bloqueados.includes(a.id) && a.status === 'pendente') : [])];
  
  const pendentesFiltrados = useMemo(() => {
    let filtrados = [...todosAtendimentos];
    
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
  }, [todosAtendimentos, filtroConvenio, filtroEspecialidade, filtroPrestador, filtroTipoAtendimento, ordem, ordemDirecao]);

  const pendentesPorConvenio = useMemo(() => {
    return pendentesFiltrados.reduce((acc, a) => {
      const convenioId = a.paciente_convenio_id;
      if (!acc[convenioId]) acc[convenioId] = [];
      acc[convenioId].push(a);
      return acc;
    }, {});
  }, [pendentesFiltrados]);

  const previewData = useMemo(() => {
    if (selecionados.length === 0) return null;
    const atendimentosSelecionados = pendentes.filter(a => selecionados.includes(a.id));
    const valorTotal = atendimentosSelecionados.reduce((sum, a) => sum + (a.valor_total || 0), 0);
    const numeroLote = gerarNumeroLote();
    setNumeroLotePreview(numeroLote);
    
    return {
      atendimentos: atendimentosSelecionados,
      valorTotal,
      quantidade: atendimentosSelecionados.length,
      numeroLote: numeroLote,
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

  const totalSelecionados = selecionados.length;
  const totalPendentes = pendentes.length;
  const valorTotalPendente = pendentes.reduce((sum, a) => sum + (a.valor_total || 0), 0);

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
    const ids = pendentesFiltrados.filter(a => !bloqueados.includes(a.id)).map(a => a.id);
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

  const handleSelectAllConvenio = (convenioId, convenioAtendimentos) => {
    const ids = convenioAtendimentos.filter(a => !bloqueados.includes(a.id)).map(a => a.id);
    const selecionadosCount = ids.filter(id => selecionados.includes(id)).length;
    
    if (selecionadosCount === ids.length) {
      setSelecionados(selecionados.filter(id => !ids.includes(id)));
    } else {
      if (selecionados.length + ids.length <= MAX_GUIAS_POR_LOTE) {
        setSelecionados([...selecionados, ...ids]);
      } else {
        toast.warning(`Limite de ${MAX_GUIAS_POR_LOTE} guias por lote`);
      }
    }
  };

  const abrirPrevia = () => {
    if (selecionados.length === 0) {
      toast.error('Selecione pelo menos uma guia para faturar');
      return;
    }
    if (previewData) {
      atualizarTodosImpostos(previewData.valorTotal);
      setShowPreviaModal(true);
    }
  };

  const imprimirRelacao = () => {
    if (!previewData) return;
    
    const printWindow = window.open('', '_blank');
    let conteudo = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relação de Faturamento</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1, h2 { text-align: center; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th { background-color: #2563eb; color: white; padding: 10px; text-align: left; }
          td { border: 1px solid #ddd; padding: 8px; }
          .total { font-weight: bold; text-align: right; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h1>Sistema de Faturamento TISS</h1>
        <h2>Relação de Guias para Faturamento</h2>
        <p><strong>Data da relação:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Número do Lote:</strong> ${previewData.numeroLote}</p>
        <p><strong>Total de guias:</strong> ${previewData.quantidade}</p>
        <p><strong>Valor total:</strong> R$ ${previewData.valorTotal.toFixed(2)}</p>
    `;

    Object.entries(previewData.conveniosAgrupados).forEach(([convenioId, data]) => {
      conteudo += `
        <h3>Convênio: ${data.convenio?.razao_social || 'Desconhecido'}</h3>
        <table>
          <thead>
            <tr><th>Nº Guia</th><th>Nº Guia Operadora</th><th>Senha</th><th>Data</th><th>Paciente</th><th>Carteira</th><th>Profissional</th><th>Valor</th></tr>
          </thead>
          <tbody>
      `;
      data.atendimentos.forEach(a => {
        conteudo += `
          <tr>
            <td>${a.numero_guia_prestador || '-'}</td>
            <td>${a.numero_guia_operadora || '-'}</td>
            <td>${a.senha_autorizacao || '-'}</td>
            <td>${a.data_atendimento || '-'}</td>
            <td>${a.paciente_nome || '-'}</td>
            <td>${a.numero_carteira || '-'}</td>
            <td>${a.prestador_nome || '-'}</td>
            <td style="text-align: right;">R$ ${(a.valor_total || 0).toFixed(2)}</td>
          </tr>
        `;
      });
      conteudo += `
          </tbody>
          <tfoot><tr><td colspan="7" class="total">Total:</td><td class="total">R$ ${data.valorTotal.toFixed(2)}</td></tr></tfoot>
        </table>
      `;
    });

    conteudo += `<div class="footer"><p>Sistema de Faturamento TISS</p></div><script>window.onload = function() { window.print(); window.close(); };</script></body></html>`;
    printWindow.document.write(conteudo);
    printWindow.document.close();
  };

  const confirmarGeracaoLote = async () => {
    if (!previewData) return;

    setGerando(true);
    setShowPreviaModal(false);

    try {
      const atendimentosPorConvenio = previewData.conveniosAgrupados;
      let seq = sequencialGlobal;
      const lotesGerados = [];
      
      for (const [convenioId, data] of Object.entries(atendimentosPorConvenio)) {
        const convenio = data.convenio;
        
        if (!convenio || !convenio.codigo_prestador) {
          toast.error(`Convênio ${convenio?.razao_social || 'Desconhecido'} não possui código de prestador`);
          continue;
        }

        const numeroLote = previewData.numeroLote;
        
        const guias = data.atendimentos.map(atendimento => ({
          ...converterAtendimentoParaTISS(atendimento, convenio),
          codigoPrestadorExecutante: convenio.codigo_prestador,
          versao: versaoTISS
        }));

        const xml = gerarXMLTISS({
          versao: versaoTISS,
          sequencialTransacao: seq.toString().padStart(4, '0'),
          codigoPrestadorNaOperadora: convenio.codigo_prestador,
          registroANS: convenio.registro_ans,
          numeroLote: numeroLote,
          guias: guias,
          convenio: convenio
        });

        const nomeArquivo = `${numeroLote}_${convenio.registro_ans}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xml`;

        const novoLote = {
          convenio_id: parseInt(convenioId),
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
            aliquota_ibs: dadosFatura.aliquotaIBS,
            valor_ibs: dadosFatura.valorIBS,
            aliquota_cbs: dadosFatura.aliquotaCBS,
            valor_cbs: dadosFatura.valorCBS,
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
        
        await supabase.from('lotes_faturamento').insert([novoLote]);
        lotesGerados.push(novoLote);
        
        await registrarLog('GERACAO_LOTE', novoLote, `Lote gerado com ${data.atendimentos.length} guias`);
        
        const ids = data.atendimentos.map(a => a.id);
        await supabase
          .from('atendimentos')
          .update({ 
            status: 'faturado', 
            fatura_lote: numeroLote,
            data_faturamento: new Date().toISOString(),
            updated_at: new Date().toISOString() 
          })
          .in('id', ids);
        
        const novosBloqueados = bloqueados.filter(id => !ids.includes(id));
        setBloqueados(novosBloqueados);
        await salvarBloqueados(novosBloqueados);
        
        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nomeArquivo;
        a.click();
        URL.revokeObjectURL(url);
        
        seq++;
      }

      await atualizarSequencial(seq);
      setSequencialGlobal(seq);
      await carregarLotes();
      await carregarDados();
      
      setSelecionados([]);
      
      toast.success(`${lotesGerados.length} lote(s) gerado(s) com sucesso!`);
      
      if (confirm('Deseja imprimir a relação das guias faturadas?')) {
        setTimeout(() => imprimirRelacao(), 500);
      }
    } catch (error) {
      console.error('Erro ao gerar lote:', error);
      toast.error('Erro ao gerar lote');
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
    if (!confirm(`Cancelar o lote ${lote.numero_lote}? As guias serão reabertas.`)) return;
    
    setGerando(true);
    
    try {
      await supabase
        .from('atendimentos')
        .update({ 
          status: 'pendente', 
          fatura_lote: null,
          data_faturamento: null,
          updated_at: new Date().toISOString() 
        })
        .in('id', lote.guias_ids || []);
      
      await registrarLog('CANCELAMENTO_LOTE', lote, `Lote cancelado. Guias reabertas.`);
      
      await supabase
        .from('lotes_faturamento')
        .delete()
        .eq('id', lote.id);
      
      await carregarLotes();
      await carregarDados();
      toast.success('Lote cancelado e guias reabertas!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao cancelar lote');
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
  // EFECTS
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
                onClick={abrirPrevia} 
                disabled={gerando} 
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg"
              >
                <ReceiptPercentIcon className="w-4 h-4" />
                Faturar Selecionados ({totalSelecionados}/{MAX_GUIAS_POR_LOTE})
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center">
              <div><p className="text-xs text-gray-500 dark:text-gray-400">Total Pendentes</p><p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{totalPendentes}</p></div>
              <ClockIcon className="w-8 h-8 text-yellow-500 opacity-50" />
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
              <div><p className="text-xs text-gray-500 dark:text-gray-400">Valor Pendente</p><p className="text-2xl font-bold text-purple-600 dark:text-purple-400">R$ {valorTotalPendente.toFixed(2)}</p></div>
              <CurrencyDollarIcon className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center">
              <div><p className="text-xs text-gray-500 dark:text-gray-400">Próx. Sequencial</p><p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{sequencialGlobal}</p></div>
              <ArrowPathIcon className="w-8 h-8 text-cyan-500 opacity-50" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <div className="space-y-4">
          {Object.entries(pendentesPorConvenio).map(([convenioId, convenioAtendimentos], index) => {
            const convenio = convenios.find(c => c.id === parseInt(convenioId));
            if (!convenio) return null;
            const selecionadosCount = convenioAtendimentos.filter(a => selecionados.includes(a.id)).length;
            const totalConvenio = convenioAtendimentos.reduce((sum, a) => sum + (a.valor_total || 0), 0);
            
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
                            checked={selecionadosCount === convenioAtendimentos.filter(a => !bloqueados.includes(a.id)).length} 
                            onChange={() => {
                              const ids = convenioAtendimentos.filter(a => !bloqueados.includes(a.id)).map(a => a.id);
                              if (selecionadosCount === ids.length) {
                                setSelecionados(selecionados.filter(id => !ids.includes(id)));
                              } else {
                                if (selecionados.length + ids.length <= MAX_GUIAS_POR_LOTE) {
                                  setSelecionados([...selecionados, ...ids]);
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
                        <th className="px-4 py-3 text-center w-24">Ações</th>
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
                            <button onClick={() => toggleBloqueio(a.id)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title={bloqueados.includes(a.id) ? 'Desbloquear' : 'Bloquear'}>
                              {bloqueados.includes(a.id) ? <LockOpenIcon className="w-4 h-4 text-green-500" /> : <LockClosedIcon className="w-4 h-4 text-orange-500" />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 dark:bg-gray-700/50">
                      <tr className="border-t">
                        <td colSpan="8" className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Total do Convênio:</td>
                        <td className="px-4 py-3 text-right font-bold text-blue-600 dark:text-blue-400">R$ {totalConvenio.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        {totalPendentes === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-12 text-center">
            <CheckIcon className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
            <p className="text-gray-500 dark:text-gray-400">Nenhum atendimento pendente de faturamento</p>
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
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 w-48">Ações</th>
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
                          <button onClick={() => cancelarLote(g)} disabled={gerando} className="p-1 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Cancelar Lote">
                            <XCircleIcon className="w-4 h-4" />
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
                          <span className={`px-2 py-1 rounded-full text-xs ${log.acao === 'GERACAO_LOTE' ? 'bg-green-100 text-green-700' : log.acao === 'CANCELAMENTO_LOTE' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {log.acao === 'GERACAO_LOTE' ? 'Geração' : log.acao === 'CANCELAMENTO_LOTE' ? 'Cancelamento' : 'Regeneração'}
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

        {/* Modal de Prévia e Faturamento */}
        {showPreviaModal && previewData && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Prévia do Faturamento</h3>
                  <button onClick={() => setShowPreviaModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><XMarkIcon className="w-5 h-5" /></button>
                </div>
              </div>
              
              <div className="p-5 space-y-6">
                {/* Resumo dos Selecionados */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3">Resumo dos Agendamentos Selecionados</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total de Guias</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{previewData.quantidade}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Valor Total</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">R$ {previewData.valorTotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Convênios</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{Object.keys(previewData.conveniosAgrupados).length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Nº do Lote</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 font-mono">{previewData.numeroLote}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={imprimirRelacao} className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">
                      <PrinterIcon className="w-4 h-4" /> Imprimir Relação
                    </button>
                  </div>
                </div>

                {/* Detalhes por Convênio */}
                {Object.entries(previewData.conveniosAgrupados).map(([convenioId, data], index) => (
                  <div key={`preview-convenio-${convenioId}-${index}`} className="border rounded-xl overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 border-b">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-800 dark:text-white">{data.convenio?.razao_social || 'Desconhecido'}</span>
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">R$ {data.valorTotal.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Nº Guia</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Nº Guia Operadora</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Senha</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Data</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Paciente</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Carteira</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Valor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {data.atendimentos.map(a => (
                            <tr key={a.id}>
                              <td className="px-3 py-2 text-xs font-mono text-blue-600">{a.numero_guia_prestador || '-'}</td>
                              <td className="px-3 py-2 text-xs font-mono text-gray-600">{a.numero_guia_operadora || '-'}</td>
                              <td className="px-3 py-2 text-xs font-mono text-gray-600">{a.senha_autorizacao || '-'}</td>
                              <td className="px-3 py-2 text-xs text-gray-500">{a.data_atendimento || '-'}</td>
                              <td className="px-3 py-2 text-xs text-gray-800">{a.paciente_nome || '-'}</td>
                              <td className="px-3 py-2 text-xs text-gray-600">{a.numero_carteira || '-'}</td>
                              <td className="px-3 py-2 text-xs text-right font-semibold text-gray-700">R$ {(a.valor_total || 0).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}

                {/* Dados da Nota Fiscal */}
                <div className="border rounded-xl p-4">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <BanknotesIcon className="w-5 h-5" /> Dados da Nota Fiscal / Faturamento
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Competência</label>
                      <input type="month" value={dadosFatura.competencia} onChange={e => setDadosFatura({...dadosFatura, competencia: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Fechamento</label>
                      <input type="date" value={dadosFatura.dataFechamento} onChange={e => setDadosFatura({...dadosFatura, dataFechamento: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Previsão de Pagamento</label>
                      <input type="date" value={dadosFatura.dataPrevisaoPagamento} onChange={e => setDadosFatura({...dadosFatura, dataPrevisaoPagamento: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h5 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">Impostos e Deduções</h5>
                    <div className="grid grid-cols-2 md:grid-cols-8 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500">Base Cálculo</label>
                        <input type="number" step="0.01" value={dadosFatura.baseCalculo} onChange={(e) => atualizarTodosImpostos(parseFloat(e.target.value) || 0)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">ISS (%)</label>
                        <input type="number" step="0.01" value={dadosFatura.aliquotaISS} onChange={(e) => atualizarAliquota('aliquotaISS', e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">IBS (%)</label>
                        <input type="number" step="0.01" value={dadosFatura.aliquotaIBS} onChange={(e) => atualizarAliquota('aliquotaIBS', e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">CBS (%)</label>
                        <input type="number" step="0.01" value={dadosFatura.aliquotaCBS} onChange={(e) => atualizarAliquota('aliquotaCBS', e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">IR (%)</label>
                        <input type="number" step="0.01" value={dadosFatura.aliquotaIR} onChange={(e) => atualizarAliquota('aliquotaIR', e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">CSLL (%)</label>
                        <input type="number" step="0.01" value={dadosFatura.aliquotaCSLL} onChange={(e) => atualizarAliquota('aliquotaCSLL', e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">PIS (%)</label>
                        <input type="number" step="0.01" value={dadosFatura.aliquotaPIS} onChange={(e) => atualizarAliquota('aliquotaPIS', e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">COFINS (%)</label>
                        <input type="number" step="0.01" value={dadosFatura.aliquotaCOFINS} onChange={(e) => atualizarAliquota('aliquotaCOFINS', e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm focus:outline-none" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                      <div><label className="block text-xs text-gray-500">Valor ISS</label><input type="text" value={dadosFatura.valorISS.toFixed(2)} disabled className="w-full bg-gray-100 dark:bg-gray-600 border rounded-lg px-2 py-1 text-sm" /></div>
                      <div><label className="block text-xs text-gray-500">Valor IBS</label><input type="text" value={dadosFatura.valorIBS.toFixed(2)} disabled className="w-full bg-gray-100 dark:bg-gray-600 border rounded-lg px-2 py-1 text-sm" /></div>
                      <div><label className="block text-xs text-gray-500">Valor CBS</label><input type="text" value={dadosFatura.valorCBS.toFixed(2)} disabled className="w-full bg-gray-100 dark:bg-gray-600 border rounded-lg px-2 py-1 text-sm" /></div>
                      <div><label className="block text-xs text-gray-500">Valor IR</label><input type="text" value={dadosFatura.valorIR.toFixed(2)} disabled className="w-full bg-gray-100 dark:bg-gray-600 border rounded-lg px-2 py-1 text-sm" /></div>
                      <div><label className="block text-xs text-gray-500">Valor CSLL</label><input type="text" value={dadosFatura.valorCSLL.toFixed(2)} disabled className="w-full bg-gray-100 dark:bg-gray-600 border rounded-lg px-2 py-1 text-sm" /></div>
                      <div><label className="block text-xs text-gray-500">Valor PIS</label><input type="text" value={dadosFatura.valorPIS.toFixed(2)} disabled className="w-full bg-gray-100 dark:bg-gray-600 border rounded-lg px-2 py-1 text-sm" /></div>
                      <div><label className="block text-xs text-gray-500">Valor COFINS</label><input type="text" value={dadosFatura.valorCOFINS.toFixed(2)} disabled className="w-full bg-gray-100 dark:bg-gray-600 border rounded-lg px-2 py-1 text-sm" /></div>
                      <div><label className="block text-xs text-gray-500">Valor Líquido</label><input type="text" value={dadosFatura.valorLiquido.toFixed(2)} disabled className="w-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-2 py-1 text-sm font-bold text-green-700 dark:text-green-400" /></div>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                    <textarea rows="2" value={dadosFatura.observacoes} onChange={e => setDadosFatura({...dadosFatura, observacoes: e.target.value})} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" placeholder="Informações adicionais da fatura..." />
                  </div>
                </div>
              </div>
              
              <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button onClick={() => setShowPreviaModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
                <button onClick={confirmarGeracaoLote} disabled={gerando} className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium shadow-md flex items-center gap-2 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50">
                  {gerando ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <PaperAirplaneIcon className="w-4 h-4" />}
                  Confirmar e Gerar Lote
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
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">XML do Lote - {selectedLote.numero_lote}</h3>
                  <button onClick={() => setShowLoteModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><XMarkIcon className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div><span className="text-xs text-gray-500 dark:text-gray-400">Convênio:</span> <span className="text-sm font-medium">{selectedLote.convenio_nome}</span></div>
                  <div><span className="text-xs text-gray-500 dark:text-gray-400">Nº Lote:</span> <span className="text-sm font-mono">{selectedLote.numero_lote}</span></div>
                  <div><span className="text-xs text-gray-500 dark:text-gray-400">Data:</span> <span className="text-sm">{selectedLote.data_envio}</span></div>
                  <div><span className="text-xs text-gray-500 dark:text-gray-400">Guias:</span> <span className="text-sm font-bold">{selectedLote.quantidade_guias}</span></div>
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
                  <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">{selectedLote.xml_content}</pre>
                </div>
                <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button onClick={() => { const blob = new Blob([selectedLote.xml_content], { type: 'application/xml' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${selectedLote.numero_lote}.xml`; a.click(); URL.revokeObjectURL(url); toast.success('XML baixado!'); }} className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg">Baixar XML</button>
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
            <li>• <strong>Guias bloqueadas</strong> aparecem com fundo laranja e não podem ser faturadas</li>
            <li>• Use os botões de bloqueio/desbloqueio para controlar quais guias entrarão no faturamento</li>
            <li>• Após faturar, as guias ficam bloqueadas e não podem ser alteradas no módulo de atendimentos</li>
            <li>• Para reabrir as guias, cancele o lote no histórico</li>
            <li>• Use "Gerar por Nº Lote" para regenerar o XML de um lote específico</li>
            <li>• Cancelar um lote move o registro para o histórico de logs e remove da lista principal</li>
            <li>• Limite máximo de <strong>{MAX_GUIAS_POR_LOTE} guias por lote</strong></li>
            <li>• O número do lote é gerado automaticamente no momento da baixa da fatura</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
