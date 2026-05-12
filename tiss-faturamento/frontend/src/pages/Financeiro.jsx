import { useState, useEffect, useMemo } from 'react';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  CalendarIcon,
  PlusCircleIcon,
  MinusCircleIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ArrowUpTrayIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CreditCardIcon,
  CalculatorIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabaseClient';
import { useUnidade } from '../contexts/UnidadeContext';
import { applyUnidadeToPayload, filterByUnidade } from '../services/unidadesService';

export default function Financeiro() {
  const { unidadeAtualId } = useUnidade();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Dados
  const [contasReceber, setContasReceber] = useState([]);
  const [contasPagar, setContasPagar] = useState([]);
  const [fluxoCaixa, setFluxoCaixa] = useState([]);
  const [notasFiscais, setNotasFiscais] = useState([]);
  const [convenios, setConvenios] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [conciliacoes, setConciliacoes] = useState([]);

  // Modals
  const [showContaReceberModal, setShowContaReceberModal] = useState(false);
  const [showContaPagarModal, setShowContaPagarModal] = useState(false);
  const [showNotaFiscalModal, setShowNotaFiscalModal] = useState(false);
  const [showRecebimentoModal, setShowRecebimentoModal] = useState(false);
  const [showPagamentoModal, setShowPagamentoModal] = useState(false);
  const [showConciliacaoModal, setShowConciliacaoModal] = useState(false);
  const [showAnexoModal, setShowAnexoModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingNota, setEditingNota] = useState(null);

  // Forms
  const [novaContaReceber, setNovaContaReceber] = useState({
    descricao: '',
    numero_lote: '',
    valor_total: 0,
    data_emissao: format(new Date(), 'yyyy-MM-dd'),
    data_vencimento: '',
    data_previsao_pagamento: '',
    status: 'pendente',
    tipo: 'faturamento',
    observacoes: ''
  });

  const [novaContaPagar, setNovaContaPagar] = useState({
    descricao: '',
    fornecedor: '',
    categoria: 'operacional',
    valor_total: 0,
    data_emissao: format(new Date(), 'yyyy-MM-dd'),
    data_vencimento: '',
    status: 'pendente',
    observacoes: ''
  });

  const [notaFiscal, setNotaFiscal] = useState({
    numero_nota: '',
    numero_lote: '',
    convenio_id: null,
    competencia: format(new Date(), 'yyyy-MM'),
    data_emissao: format(new Date(), 'yyyy-MM-dd'),
    data_previsao_pagamento: '',
    valor_total: 0,
    base_calculo: 0,
    aliquota_iss: 5,
    valor_iss: 0,
    aliquota_ibs: 0,
    valor_ibs: 0,
    aliquota_cbs: 0,
    valor_cbs: 0,
    aliquota_ir: 1.5,
    valor_ir: 0,
    aliquota_csll: 1,
    valor_csll: 0,
    aliquota_pis: 0.65,
    valor_pis: 0,
    aliquota_cofins: 3,
    valor_cofins: 0,
    valor_liquido: 0,
    status: 'emitida',
    observacoes: ''
  });

  const [valorRecebimento, setValorRecebimento] = useState(0);
  const [dataRecebimento, setDataRecebimento] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [valorPagamento, setValorPagamento] = useState(0);
  const [dataPagamento, setDataPagamento] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formaPagamento, setFormaPagamento] = useState('PIX');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [contaBancaria, setContaBancaria] = useState('');

  // Filtros
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [mesSelecionado, setMesSelecionado] = useState(format(new Date(), 'yyyy-MM'));
  const [busca, setBusca] = useState('');
  const [filtroConvenio, setFiltroConvenio] = useState('todos');

  // Anexos
  const [anexos, setAnexos] = useState([]);
  const [novoAnexoUrl, setNovoAnexoUrl] = useState('');
  const [novoAnexoNome, setNovoAnexoNome] = useState('');

  useEffect(() => {
    carregarDados();
  }, [unidadeAtualId]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [
        receberRes, pagarRes, fluxoRes, notasRes,
        conveniosRes, lotesRes, conciliacoesRes
      ] = await Promise.all([
        supabase.from('contas_receber').select('*').order('data_vencimento', { ascending: true }),
        supabase.from('contas_pagar').select('*').order('data_vencimento', { ascending: true }),
        supabase.from('fluxo_caixa').select('*').order('data', { ascending: false }),
        supabase.from('notas_fiscais').select('*').order('created_at', { ascending: false }),
        supabase.from('convenios').select('id, razao_social').eq('ativo', true),
        supabase.from('lotes_faturamento').select('numero_lote, convenio_nome, dados_fatura, guias_ids').order('created_at', { ascending: false }),
        supabase.from('conciliacao_bancaria').select('*').order('data', { ascending: false })
      ]);

      setContasReceber(filterByUnidade(receberRes.data || [], unidadeAtualId));
      setContasPagar(filterByUnidade(pagarRes.data || [], unidadeAtualId));
      setFluxoCaixa(filterByUnidade(fluxoRes.data || [], unidadeAtualId));
      setNotasFiscais(filterByUnidade(notasRes.data || [], unidadeAtualId));
      setConvenios(filterByUnidade(conveniosRes.data || [], unidadeAtualId));
      setLotes(filterByUnidade(lotesRes.data || [], unidadeAtualId));
      setConciliacoes(filterByUnidade(conciliacoesRes.data || [], unidadeAtualId));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  };

  // ===== CÁLCULOS DA NOTA FISCAL =====
  const calcularImpostosNF = (baseCalculo, aliquotaISS, aliquotaIBS, aliquotaCBS, aliquotaIR, aliquotaCSLL, aliquotaPIS, aliquotaCOFINS) => {
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

  const atualizarNotaFiscal = (campo, valor) => {
    setNotaFiscal(prev => {
      const novosDados = { ...prev, [campo]: parseFloat(valor) || 0 };
      if (['base_calculo', 'aliquota_iss', 'aliquota_ibs', 'aliquota_cbs', 'aliquota_ir', 'aliquota_csll', 'aliquota_pis', 'aliquota_cofins'].includes(campo)) {
        const impostos = calcularImpostosNF(
          campo === 'base_calculo' ? novosDados.base_calculo : prev.base_calculo,
          campo === 'aliquota_iss' ? novosDados.aliquota_iss : prev.aliquota_iss,
          campo === 'aliquota_ibs' ? novosDados.aliquota_ibs : prev.aliquota_ibs,
          campo === 'aliquota_cbs' ? novosDados.aliquota_cbs : prev.aliquota_cbs,
          campo === 'aliquota_ir' ? novosDados.aliquota_ir : prev.aliquota_ir,
          campo === 'aliquota_csll' ? novosDados.aliquota_csll : prev.aliquota_csll,
          campo === 'aliquota_pis' ? novosDados.aliquota_pis : prev.aliquota_pis,
          campo === 'aliquota_cofins' ? novosDados.aliquota_cofins : prev.aliquota_cofins
        );
        return { ...novosDados, valor_iss: impostos.iss, valor_ibs: impostos.ibs, valor_cbs: impostos.cbs, valor_ir: impostos.ir, valor_csll: impostos.csll, valor_pis: impostos.pis, valor_cofins: impostos.cofins, valor_liquido: impostos.valorLiquido };
      }
      return novosDados;
    });
  };

  // ===== CONTAS A RECEBER =====
  const handleAddContaReceber = async () => {
    if (!novaContaReceber.descricao || novaContaReceber.valor_total <= 0) {
      toast.error('Preencha descrição e valor');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('contas_receber')
        .insert([applyUnidadeToPayload({ ...novaContaReceber, created_at: new Date().toISOString() }, unidadeAtualId)])
        .select()
        .single();

      if (error) throw error;

      setContasReceber([data, ...contasReceber]);
      toast.success('Conta a receber registrada!');
      setShowContaReceberModal(false);
      setNovaContaReceber({
        descricao: '', numero_lote: '', valor_total: 0,
        data_emissao: format(new Date(), 'yyyy-MM-dd'), data_vencimento: '',
        data_previsao_pagamento: '', status: 'pendente', tipo: 'faturamento', observacoes: ''
      });
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao registrar conta');
    }
  };

  const handleReceber = async () => {
    if (!selectedItem || valorRecebimento <= 0) return;

    try {
      // Registrar recebimento
      const { error } = await supabase
        .from('contas_receber')
        .update({
          valor_recebido: valorRecebimento,
          data_recebimento: dataRecebimento,
          status: valorRecebimento >= selectedItem.valor_total ? 'recebido' : 'parcial',
          forma_pagamento: formaPagamento,
          numero_documento: numeroDocumento,
          conta_bancaria: contaBancaria,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedItem.id);

      if (error) throw error;

      // Atualizar nota fiscal se vinculada
      if (selectedItem.nota_fiscal_id && valorRecebimento >= selectedItem.valor_total) {
        await supabase
          .from('notas_fiscais')
          .update({ status: 'paga', updated_at: new Date().toISOString() })
          .eq('id', selectedItem.nota_fiscal_id);
      }

      // Registrar no fluxo de caixa
      await supabase.from('fluxo_caixa').insert([applyUnidadeToPayload({
        tipo: 'entrada',
        descricao: `Recebimento: ${selectedItem.descricao}`,
        valor: valorRecebimento,
        data: dataRecebimento,
        conta_id: selectedItem.id,
        origem: 'conta_receber',
        created_at: new Date().toISOString()
      }, unidadeAtualId)]);

      await carregarDados();
      toast.success('Recebimento registrado!');
      setShowRecebimentoModal(false);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao registrar recebimento');
    }
  };

  // ===== CONTAS A PAGAR =====
  const handleAddContaPagar = async () => {
    if (!novaContaPagar.descricao || novaContaPagar.valor_total <= 0) {
      toast.error('Preencha descrição e valor');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('contas_pagar')
        .insert([applyUnidadeToPayload({ ...novaContaPagar, created_at: new Date().toISOString() }, unidadeAtualId)])
        .select()
        .single();

      if (error) throw error;

      setContasPagar([data, ...contasPagar]);
      toast.success('Conta a pagar registrada!');
      setShowContaPagarModal(false);
      setNovaContaPagar({
        descricao: '', fornecedor: '', categoria: 'operacional', valor_total: 0,
        data_emissao: format(new Date(), 'yyyy-MM-dd'), data_vencimento: '',
        status: 'pendente', observacoes: ''
      });
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao registrar conta');
    }
  };

  const handlePagar = async () => {
    if (!selectedItem || valorPagamento <= 0) return;

    try {
      const { error } = await supabase
        .from('contas_pagar')
        .update({
          valor_pago: valorPagamento,
          data_pagamento: dataPagamento,
          status: valorPagamento >= selectedItem.valor_total ? 'pago' : 'parcial',
          forma_pagamento: formaPagamento,
          numero_documento: numeroDocumento,
          conta_bancaria: contaBancaria,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedItem.id);

      if (error) throw error;

      await supabase.from('fluxo_caixa').insert([applyUnidadeToPayload({
        tipo: 'saida',
        descricao: `Pagamento: ${selectedItem.descricao}`,
        valor: valorPagamento,
        data: dataPagamento,
        conta_id: selectedItem.id,
        origem: 'conta_pagar',
        created_at: new Date().toISOString()
      }, unidadeAtualId)]);

      await carregarDados();
      toast.success('Pagamento registrado!');
      setShowPagamentoModal(false);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao registrar pagamento');
    }
  };

  // ===== NOTAS FISCAIS =====
  const handleSaveNotaFiscal = async () => {
    try {
      const impostos = calcularImpostosNF(
        notaFiscal.base_calculo,
        notaFiscal.aliquota_iss, notaFiscal.aliquota_ibs, notaFiscal.aliquota_cbs,
        notaFiscal.aliquota_ir, notaFiscal.aliquota_csll, notaFiscal.aliquota_pis, notaFiscal.aliquota_cofins
      );

      const dadosNF = {
        ...notaFiscal,
        valor_iss: impostos.iss,
        valor_ibs: impostos.ibs,
        valor_cbs: impostos.cbs,
        valor_ir: impostos.ir,
        valor_csll: impostos.csll,
        valor_pis: impostos.pis,
        valor_cofins: impostos.cofins,
        valor_liquido: impostos.valorLiquido,
        anexos: JSON.stringify(anexos),
        updated_at: new Date().toISOString()
      };

      const { error } = editingNota
        ? await supabase.from('notas_fiscais').update(dadosNF).eq('id', editingNota.id)
        : await supabase.from('notas_fiscais').insert([applyUnidadeToPayload(dadosNF, unidadeAtualId)]);

      if (error) throw error;

      await carregarDados();
      toast.success(editingNota ? 'Nota fiscal atualizada!' : 'Nota fiscal criada!');
      setShowNotaFiscalModal(false);
      setEditingNota(null);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao salvar nota fiscal');
    }
  };

   // Função para buscar dados do lote e preencher nota fiscal
  const buscarDadosLote = async (numeroLote) => {
    if (!numeroLote) return;

    try {
      // Buscar lote
      const { data: lote } = await supabase
        .from('lotes_faturamento')
        .select('*')
        .eq('numero_lote', numeroLote)
        .maybeSingle();

      if (lote) {
        // Buscar convênio
        const { data: convenio } = await supabase
          .from('convenios')
          .select('razao_social')
          .eq('id', lote.convenio_id)
          .maybeSingle();

        // Buscar guias do lote para obter especialidades
        const { data: guias } = await supabase
          .from('atendimentos')
          .select('itens')
          .in('id', lote.guias_ids || []);

        // Extrair especialidades dos itens
        const especialidades = new Set();
        if (guias) {
          guias.forEach(guia => {
            try {
              const itens = typeof guia.itens === 'string' ? JSON.parse(guia.itens) : guia.itens;
              if (Array.isArray(itens)) {
                itens.forEach(item => {
                  if (item.prestador_cbos) {
                    especialidades.add(CBOS_MAP[item.prestador_cbos] || item.prestador_cbos);
                  }
                });
              }
            } catch (e) {}
          });
        }

        // Preencher dados da nota fiscal
        setNotaFiscal(prev => ({
          ...prev,
          numero_lote: lote.numero_lote,
          convenio_id: lote.convenio_id,
          convenio_nome: convenio?.razao_social || '',
          competencia: lote.dados_fatura?.competencia || prev.competencia,
          data_emissao: lote.dados_fatura?.data_fechamento || lote.data_envio || prev.data_emissao,
          data_previsao_pagamento: lote.dados_fatura?.data_previsao_pagamento || prev.data_previsao_pagamento,
          valor_total: lote.dados_fatura?.base_calculo || 0,
          base_calculo: lote.dados_fatura?.base_calculo || 0,
          aliquota_iss: lote.dados_fatura?.aliquota_iss || 5,
          valor_iss: lote.dados_fatura?.valor_iss || 0,
          aliquota_ibs: lote.dados_fatura?.aliquota_ibs || 0,
          valor_ibs: lote.dados_fatura?.valor_ibs || 0,
          aliquota_cbs: lote.dados_fatura?.aliquota_cbs || 0,
          valor_cbs: lote.dados_fatura?.valor_cbs || 0,
          aliquota_ir: lote.dados_fatura?.aliquota_ir || 1.5,
          valor_ir: lote.dados_fatura?.valor_ir || 0,
          aliquota_csll: lote.dados_fatura?.aliquota_csll || 1,
          valor_csll: lote.dados_fatura?.valor_csll || 0,
          aliquota_pis: lote.dados_fatura?.aliquota_pis || 0.65,
          valor_pis: lote.dados_fatura?.valor_pis || 0,
          aliquota_cofins: lote.dados_fatura?.aliquota_cofins || 3,
          valor_cofins: lote.dados_fatura?.valor_cofins || 0,
          valor_liquido: lote.dados_fatura?.valor_liquido || 0,
          observacoes: lote.dados_fatura?.observacoes || prev.observacoes,
          quantidade_guias: lote.quantidade_guias || lote.guias_ids?.length || 0,
          especialidades: Array.from(especialidades).join(', ')
        }));

        toast.success(`Lote ${numeroLote} localizado! Dados preenchidos automaticamente.`);
      } else {
        toast.error('Lote não encontrado');
      }
    } catch (error) {
      console.error('Erro ao buscar lote:', error);
      toast.error('Erro ao buscar dados do lote');
    }
  };

  const editarNotaFiscal = (nf) => {
      setEditingNota(nf);
      setNotaFiscal({
        numero_nota: nf.numero_nota || '',
        numero_lote: nf.numero_lote || '',
        convenio_id: nf.convenio_id,
        convenio_nome: nf.convenio_nome || '',
        competencia: nf.competencia || '',
        data_emissao: nf.data_emissao || '',
        data_previsao_pagamento: nf.data_previsao_pagamento || '',
        valor_total: nf.valor_total || 0,
        base_calculo: nf.base_calculo || 0,
        aliquota_iss: nf.aliquota_iss || 5,
        valor_iss: nf.valor_iss || 0,
        aliquota_ibs: nf.aliquota_ibs || 0,
        valor_ibs: nf.valor_ibs || 0,
        aliquota_cbs: nf.aliquota_cbs || 0,
        valor_cbs: nf.valor_cbs || 0,
        aliquota_ir: nf.aliquota_ir || 1.5,
        valor_ir: nf.valor_ir || 0,
        aliquota_csll: nf.aliquota_csll || 1,
        valor_csll: nf.valor_csll || 0,
        aliquota_pis: nf.aliquota_pis || 0.65,
        valor_pis: nf.valor_pis || 0,
        aliquota_cofins: nf.aliquota_cofins || 3,
        valor_cofins: nf.valor_cofins || 0,
        valor_liquido: nf.valor_liquido || 0,
        status: nf.status || 'emitida',
        observacoes: nf.observacoes || '',
        quantidade_guias: nf.quantidade_guias || 0
      });

      // Carregar anexos
      setAnexos(typeof nf.anexos === 'string' ? JSON.parse(nf.anexos || '[]') : (nf.anexos || []));

      // Se tem número de lote, buscar dados automaticamente
      if (nf.numero_lote) {
        buscarDadosLote(nf.numero_lote);
      }

      setShowNotaFiscalModal(true);
    };

  const addAnexo = () => {
    if (novoAnexoUrl && novoAnexoNome) {
      setAnexos([...anexos, { nome: novoAnexoNome, url: novoAnexoUrl, data: format(new Date(), 'yyyy-MM-dd HH:mm') }]);
      setNovoAnexoUrl('');
      setNovoAnexoNome('');
    }
  };

  const removeAnexo = (index) => {
    setAnexos(anexos.filter((_, i) => i !== index));
  };

  // ===== CONCILIAÇÃO BANCÁRIA =====
  const handleAddConciliacao = async () => {
    try {
      await supabase.from('conciliacao_bancaria').insert([applyUnidadeToPayload({
        conta_bancaria: contaBancaria,
        data: dataRecebimento,
        descricao: `Conciliação manual`,
        valor: valorRecebimento,
        tipo: 'credito',
        conciliado: true,
        observacoes: 'Lançamento manual',
        created_at: new Date().toISOString()
      }, unidadeAtualId)]);
      await carregarDados();
      toast.success('Conciliação registrada!');
      setShowConciliacaoModal(false);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao registrar conciliação');
    }
  };

  // ===== FILTROS E ESTATÍSTICAS =====
  const receberFiltradas = useMemo(() => {
    let resultado = [...contasReceber];

    if (filtroStatus === 'vencidas') {
      resultado = resultado.filter(c => c.status === 'pendente' && new Date(c.data_vencimento) < new Date());
    } else if (filtroStatus !== 'todos') {
      resultado = resultado.filter(c => c.status === filtroStatus);
    }

    if (filtroConvenio !== 'todos') {
      resultado = resultado.filter(c => c.convenio_id === parseInt(filtroConvenio));
    }

    if (busca.trim()) {
      const termo = busca.toLowerCase();
      resultado = resultado.filter(c =>
        (c.descricao && c.descricao.toLowerCase().includes(termo)) ||
        (c.numero_lote && c.numero_lote.toLowerCase().includes(termo))
      );
    }

    return resultado;
  }, [contasReceber, filtroStatus, filtroConvenio, busca]);

  const pagarFiltradas = useMemo(() => {
    let resultado = [...contasPagar];

    if (filtroStatus === 'vencidas') {
      resultado = resultado.filter(c => c.status === 'pendente' && new Date(c.data_vencimento) < new Date());
    } else if (filtroStatus !== 'todos') {
      resultado = resultado.filter(c => c.status === filtroStatus);
    }

    if (busca.trim()) {
      const termo = busca.toLowerCase();
      resultado = resultado.filter(c =>
        (c.descricao && c.descricao.toLowerCase().includes(termo)) ||
        (c.fornecedor && c.fornecedor.toLowerCase().includes(termo))
      );
    }

    return resultado;
  }, [contasPagar, filtroStatus, busca]);

  const fluxoDoMes = useMemo(() => {
    const inicio = startOfMonth(new Date(mesSelecionado + '-01'));
    const fim = endOfMonth(inicio);
    return fluxoCaixa.filter(f => {
      const data = new Date(f.data + 'T00:00:00');
      return data >= inicio && data <= fim;
    });
  }, [fluxoCaixa, mesSelecionado]);

  const stats = useMemo(() => {
    const totalReceber = contasReceber.filter(c => c.status !== 'cancelado').reduce((s, c) => s + (c.valor_total || 0), 0);
    const totalRecebido = contasReceber.filter(c => c.status === 'recebido').reduce((s, c) => s + (c.valor_recebido || 0), 0);
    const totalPagar = contasPagar.filter(c => c.status !== 'cancelado').reduce((s, c) => s + (c.valor_total || 0), 0);
    const totalPago = contasPagar.filter(c => c.status === 'pago').reduce((s, c) => s + (c.valor_pago || 0), 0);
    const totalEntradas = fluxoCaixa.filter(f => f.tipo === 'entrada').reduce((s, f) => s + (f.valor || 0), 0);
    const totalSaidas = fluxoCaixa.filter(f => f.tipo === 'saida').reduce((s, f) => s + (f.valor || 0), 0);
    const vencidasReceber = contasReceber.filter(c => c.status === 'pendente' && new Date(c.data_vencimento) < new Date());
    const vencidasPagar = contasPagar.filter(c => c.status === 'pendente' && new Date(c.data_vencimento) < new Date());

    return {
      totalReceber,
      totalRecebido,
      totalPagar,
      totalPago,
      saldoGeral: totalEntradas - totalSaidas,
      vencidasReceber: vencidasReceber.length,
      vencidasPagar: vencidasPagar.length,
      valorVencidoReceber: vencidasReceber.reduce((s, c) => s + (c.valor_total || 0), 0),
      valorVencidoPagar: vencidasPagar.reduce((s, c) => s + (c.valor_total || 0), 0),
      totalNotasFiscais: notasFiscais.length,
      notasPendentes: notasFiscais.filter(n => n.status === 'pendente' || n.status === 'emitida').length
    };
  }, [contasReceber, contasPagar, fluxoCaixa, notasFiscais]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const statusBadge = (status) => {
    const configs = {
      'pendente': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      'vencido': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      'recebido': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'parcial': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'pago': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'cancelado': 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
      'emitida': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'paga': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    };
    return configs[status] || configs['pendente'];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <ArrowPathIcon className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Financeiro</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Contas a receber, pagar, notas fiscais e fluxo de caixa
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { setEditingNota(null); setNotaFiscal({
              numero_nota: '', numero_lote: '', convenio_id: null,
              competencia: format(new Date(), 'yyyy-MM'), data_emissao: format(new Date(), 'yyyy-MM-dd'),
              data_previsao_pagamento: '', valor_total: 0, base_calculo: 0,
              aliquota_iss: 5, valor_iss: 0, aliquota_ibs: 0, valor_ibs: 0,
              aliquota_cbs: 0, valor_cbs: 0, aliquota_ir: 1.5, valor_ir: 0,
              aliquota_csll: 1, valor_csll: 0, aliquota_pis: 0.65, valor_pis: 0,
              aliquota_cofins: 3, valor_cofins: 0, valor_liquido: 0,
              status: 'emitida', observacoes: ''
            }); setAnexos([]); setShowNotaFiscalModal(true); }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition-all">
              <DocumentTextIcon className="w-4 h-4" /> Nota Fiscal
            </button>
            <button onClick={() => setShowContaPagarModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition-all">
              <MinusCircleIcon className="w-4 h-4" /> Conta a Pagar
            </button>
            <button onClick={() => setShowContaReceberModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition-all">
              <PlusCircleIcon className="w-4 h-4" /> Conta a Receber
            </button>
            <button onClick={carregarDados}
              className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-300 transition-all">
              <ArrowPathIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          {[
            { label: 'A Receber', value: formatCurrency(stats.totalReceber), icon: ArrowTrendingUpIcon, color: 'text-blue-600' },
            { label: 'Recebido', value: formatCurrency(stats.totalRecebido), icon: CheckCircleIcon, color: 'text-green-600' },
            { label: 'A Pagar', value: formatCurrency(stats.totalPagar), icon: ArrowTrendingDownIcon, color: 'text-red-600' },
            { label: 'Pago', value: formatCurrency(stats.totalPago), icon: CheckCircleIcon, color: 'text-emerald-600' },
            { label: 'Saldo', value: formatCurrency(stats.saldoGeral), icon: CalculatorIcon, color: stats.saldoGeral >= 0 ? 'text-green-600' : 'text-red-600' },
            { label: 'Vencidas', value: stats.vencidasReceber, icon: ExclamationTriangleIcon, color: 'text-red-500' },
          ].map((card, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
                  <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
                </div>
                <card.icon className={`w-6 h-6 ${card.color} opacity-50`} />
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: 'dashboard', label: 'Dashboard', icon: ChartBarIcon },
            { key: 'receber', label: 'Contas a Receber', icon: ArrowTrendingUpIcon },
            { key: 'pagar', label: 'Contas a Pagar', icon: ArrowTrendingDownIcon },
            { key: 'notas', label: 'Notas Fiscais', icon: DocumentTextIcon },
            { key: 'fluxo', label: 'Fluxo de Caixa', icon: BanknotesIcon },
            { key: 'conciliacao', label: 'Conciliação', icon: ClipboardDocumentCheckIcon },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* ===== CONTEÚDO DAS TABS ===== */}

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resumo Receber */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border p-6">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <ArrowTrendingUpIcon className="w-5 h-5 text-blue-600" />
                Resumo Contas a Receber
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Pendentes', value: contasReceber.filter(c => c.status === 'pendente').length, color: 'text-yellow-600' },
                  { label: 'Vencidas', value: stats.vencidasReceber, extra: formatCurrency(stats.valorVencidoReceber), color: 'text-red-600' },
                  { label: 'Recebidas', value: contasReceber.filter(c => c.status === 'recebido').length, color: 'text-green-600' },
                  { label: 'Valor Total a Receber', value: formatCurrency(stats.totalReceber), color: 'text-blue-600' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                    <span className={`font-bold ${item.color}`}>
                      {item.value} {item.extra && <span className="text-xs ml-2">({item.extra})</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumo Pagar */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border p-6">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <ArrowTrendingDownIcon className="w-5 h-5 text-red-600" />
                Resumo Contas a Pagar
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Pendentes', value: contasPagar.filter(c => c.status === 'pendente').length, color: 'text-yellow-600' },
                  { label: 'Vencidas', value: stats.vencidasPagar, extra: formatCurrency(stats.valorVencidoPagar), color: 'text-red-600' },
                  { label: 'Pagas', value: contasPagar.filter(c => c.status === 'pago').length, color: 'text-green-600' },
                  { label: 'Valor Total a Pagar', value: formatCurrency(stats.totalPagar), color: 'text-red-600' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                    <span className={`font-bold ${item.color}`}>
                      {item.value} {item.extra && <span className="text-xs ml-2">({item.extra})</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notas Fiscais */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border p-6 col-span-1 lg:col-span-2">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Últimas Notas Fiscais</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs">Nº Nota</th>
                      <th className="px-3 py-2 text-left text-xs">Lote</th>
                      <th className="px-3 py-2 text-left text-xs">Competência</th>
                      <th className="px-3 py-2 text-right text-xs">Valor Total</th>
                      <th className="px-3 py-2 text-right text-xs">Valor Líquido</th>
                      <th className="px-3 py-2 text-left text-xs">Status</th>
                      <th className="px-3 py-2 text-left text-xs">Previsão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {notasFiscais.slice(0, 5).map(nf => (
                      <tr key={nf.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-3 py-2 text-xs font-mono font-bold">{nf.numero_nota}</td>
                        <td className="px-3 py-2 text-xs font-mono">{nf.numero_lote || '-'}</td>
                        <td className="px-3 py-2 text-xs">{nf.competencia || '-'}</td>
                        <td className="px-3 py-2 text-xs text-right font-semibold">{formatCurrency(nf.valor_total)}</td>
                        <td className="px-3 py-2 text-xs text-right font-semibold text-green-600">{formatCurrency(nf.valor_liquido)}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${statusBadge(nf.status)}`}>{nf.status}</span>
                        </td>
                        <td className="px-3 py-2 text-xs">{nf.data_previsao_pagamento ? format(new Date(nf.data_previsao_pagamento + 'T00:00:00'), 'dd/MM/yyyy') : '-'}</td>
                      </tr>
                    ))}
                    {notasFiscais.length === 0 && (
                      <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">Nenhuma nota fiscal</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Contas a Receber */}
        {activeTab === 'receber' && (
          <>
            <div className="flex flex-wrap gap-2 mb-4 items-center">
              <FunnelIcon className="w-4 h-4 text-gray-500" />
              {['todos', 'pendente', 'vencidas', 'recebido', 'parcial'].map(s => (
                <button key={s} onClick={() => setFiltroStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${filtroStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
              <select value={filtroConvenio} onChange={(e) => setFiltroConvenio(e.target.value)}
                className="ml-auto border rounded-lg px-3 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="todos">Todos Convênios</option>
                {convenios.map(c => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
              </select>
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)}
                  className="pl-9 pr-3 py-1.5 border rounded-lg text-sm dark:bg-gray-700 dark:text-white w-48" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs">Descrição</th>
                    <th className="px-4 py-3 text-left text-xs">Lote</th>
                    <th className="px-4 py-3 text-left text-xs">NF</th>
                    <th className="px-4 py-3 text-right text-xs">Valor Total</th>
                    <th className="px-4 py-3 text-right text-xs">Recebido</th>
                    <th className="px-4 py-3 text-right text-xs">Glosa</th>
                    <th className="px-4 py-3 text-left text-xs">Vencimento</th>
                    <th className="px-4 py-3 text-left text-xs">Previsão Pagto</th>
                    <th className="px-4 py-3 text-left text-xs">Status</th>
                    <th className="px-4 py-3 text-center text-xs">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {receberFiltradas.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-xs font-medium text-gray-800 dark:text-white max-w-xs truncate">{c.descricao}</td>
                      <td className="px-4 py-3 text-xs font-mono">{c.numero_lote || '-'}</td>
                      <td className="px-4 py-3 text-xs font-mono">
                        {notasFiscais.find(n => n.id === c.nota_fiscal_id)?.numero_nota || '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-right font-semibold">{formatCurrency(c.valor_total)}</td>
                      <td className="px-4 py-3 text-xs text-right text-green-600">{formatCurrency(c.valor_recebido || 0)}</td>
                      <td className="px-4 py-3 text-xs text-right text-red-600">{formatCurrency(c.valor_glosa || 0)}</td>
                      <td className="px-4 py-3 text-xs">{c.data_vencimento ? format(new Date(c.data_vencimento + 'T00:00:00'), 'dd/MM/yyyy') : '-'}</td>
                      <td className="px-4 py-3 text-xs">{c.data_previsao_pagamento ? format(new Date(c.data_previsao_pagamento + 'T00:00:00'), 'dd/MM/yyyy') : '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${statusBadge(c.status)}`}>{c.status}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-1 justify-center">
                          {(c.status === 'pendente' || c.status === 'parcial') && (
                            <button onClick={() => {
                              setSelectedItem(c);
                              setValorRecebimento(c.valor_total - (c.valor_recebido || 0));
                              setDataRecebimento(format(new Date(), 'yyyy-MM-dd'));
                              setFormaPagamento('PIX');
                              setNumeroDocumento('');
                              setContaBancaria('');
                              setShowRecebimentoModal(true);
                            }} className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">
                              Receber
                            </button>
                          )}
                          {c.nota_fiscal_id && (
                            <button onClick={() => editarNotaFiscal(notasFiscais.find(n => n.id === c.nota_fiscal_id))}
                              className="p-1 rounded-lg text-blue-600 hover:bg-blue-50" title="Ver NF">
                              <EyeIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {receberFiltradas.length === 0 && (
                    <tr><td colSpan="10" className="px-4 py-12 text-center text-gray-500">Nenhuma conta encontrada</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Contas a Pagar */}
        {activeTab === 'pagar' && (
          <>
            <div className="flex flex-wrap gap-2 mb-4 items-center">
              <FunnelIcon className="w-4 h-4 text-gray-500" />
              {['todos', 'pendente', 'vencidas', 'pago', 'parcial'].map(s => (
                <button key={s} onClick={() => setFiltroStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${filtroStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
              <div className="relative ml-auto">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)}
                  className="pl-9 pr-3 py-1.5 border rounded-lg text-sm dark:bg-gray-700 dark:text-white w-48" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs">Descrição</th>
                    <th className="px-4 py-3 text-left text-xs">Fornecedor</th>
                    <th className="px-4 py-3 text-left text-xs">Categoria</th>
                    <th className="px-4 py-3 text-right text-xs">Valor Total</th>
                    <th className="px-4 py-3 text-right text-xs">Pago</th>
                    <th className="px-4 py-3 text-left text-xs">Vencimento</th>
                    <th className="px-4 py-3 text-left text-xs">Status</th>
                    <th className="px-4 py-3 text-center text-xs">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {pagarFiltradas.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-xs font-medium text-gray-800 dark:text-white">{c.descricao}</td>
                      <td className="px-4 py-3 text-xs">{c.fornecedor || '-'}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700">{c.categoria}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-right font-semibold text-red-600">{formatCurrency(c.valor_total)}</td>
                      <td className="px-4 py-3 text-xs text-right text-green-600">{formatCurrency(c.valor_pago || 0)}</td>
                      <td className="px-4 py-3 text-xs">{c.data_vencimento ? format(new Date(c.data_vencimento + 'T00:00:00'), 'dd/MM/yyyy') : '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${statusBadge(c.status)}`}>{c.status}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {(c.status === 'pendente' || c.status === 'parcial') && (
                          <button onClick={() => {
                            setSelectedItem(c);
                            setValorPagamento(c.valor_total - (c.valor_pago || 0));
                            setDataPagamento(format(new Date(), 'yyyy-MM-dd'));
                            setFormaPagamento('PIX');
                            setNumeroDocumento('');
                            setContaBancaria('');
                            setShowPagamentoModal(true);
                          }} className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">
                            Pagar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {pagarFiltradas.length === 0 && (
                    <tr><td colSpan="8" className="px-4 py-12 text-center text-gray-500">Nenhuma conta encontrada</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Notas Fiscais */}
        {activeTab === 'notas' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs">Nº Nota</th>
                  <th className="px-4 py-3 text-left text-xs">Lote</th>
                  <th className="px-4 py-3 text-left text-xs">Competência</th>
                  <th className="px-4 py-3 text-left text-xs">Convênio</th>
                  <th className="px-4 py-3 text-right text-xs">Valor Total</th>
                  <th className="px-4 py-3 text-right text-xs">ISS</th>
                  <th className="px-4 py-3 text-right text-xs">Líquido</th>
                  <th className="px-4 py-3 text-left text-xs">Previsão</th>
                  <th className="px-4 py-3 text-left text-xs">Status</th>
                  <th className="px-4 py-3 text-center text-xs">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {notasFiscais.map(nf => (
                  <tr key={nf.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-xs font-mono font-bold text-blue-600">{nf.numero_nota}</td>
                    <td className="px-4 py-3 text-xs font-mono">{nf.numero_lote || '-'}</td>
                    <td className="px-4 py-3 text-xs">{nf.competencia || '-'}</td>
                    <td className="px-4 py-3 text-xs">{convenios.find(c => c.id === nf.convenio_id)?.razao_social || '-'}</td>
                    <td className="px-4 py-3 text-xs text-right font-semibold">{formatCurrency(nf.valor_total)}</td>
                    <td className="px-4 py-3 text-xs text-right text-gray-600">{formatCurrency(nf.valor_iss)}</td>
                    <td className="px-4 py-3 text-xs text-right font-bold text-green-600">{formatCurrency(nf.valor_liquido)}</td>
                    <td className="px-4 py-3 text-xs">{nf.data_previsao_pagamento ? format(new Date(nf.data_previsao_pagamento + 'T00:00:00'), 'dd/MM/yyyy') : '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${statusBadge(nf.status)}`}>{nf.status}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => editarNotaFiscal(nf)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50" title="Editar">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {notasFiscais.length === 0 && (
                  <tr><td colSpan="10" className="px-4 py-12 text-center text-gray-500">Nenhuma nota fiscal</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Fluxo de Caixa */}
        {activeTab === 'fluxo' && (
          <>
            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm text-gray-500 dark:text-gray-400">Mês:</label>
              <input type="month" value={mesSelecionado} onChange={(e) => setMesSelecionado(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Entradas', value: formatCurrency(fluxoDoMes.filter(f => f.tipo === 'entrada').reduce((s, f) => s + (f.valor || 0), 0)), color: 'text-green-600', icon: ArrowTrendingUpIcon },
                { label: 'Saídas', value: formatCurrency(fluxoDoMes.filter(f => f.tipo === 'saida').reduce((s, f) => s + (f.valor || 0), 0)), color: 'text-red-600', icon: ArrowTrendingDownIcon },
                { label: 'Saldo do Mês', value: formatCurrency(fluxoDoMes.reduce((s, f) => s + (f.tipo === 'entrada' ? (f.valor || 0) : -(f.valor || 0)), 0)), color: 'text-blue-600', icon: CalculatorIcon },
              ].map((item, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">{item.label}</p>
                      <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                    </div>
                    <item.icon className={`w-8 h-8 ${item.color} opacity-30`} />
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs">Data</th>
                    <th className="px-4 py-3 text-left text-xs">Descrição</th>
                    <th className="px-4 py-3 text-left text-xs">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs">Origem</th>
                    <th className="px-4 py-3 text-right text-xs">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {fluxoDoMes.map(f => (
                    <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-xs">{format(new Date(f.data + 'T00:00:00'), 'dd/MM/yyyy')}</td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-800 dark:text-white">{f.descricao}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${f.tipo === 'entrada' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                          {f.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">{f.origem || '-'}</td>
                      <td className={`px-4 py-3 text-xs text-right font-semibold ${f.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                        {f.tipo === 'entrada' ? '+' : '-'} {formatCurrency(f.valor)}
                      </td>
                    </tr>
                  ))}
                  {fluxoDoMes.length === 0 && (
                    <tr><td colSpan="5" className="px-4 py-12 text-center text-gray-500">Nenhum lançamento neste mês</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Conciliação */}
        {activeTab === 'conciliacao' && (
          <>
            <div className="flex justify-end mb-4">
              <button onClick={() => setShowConciliacaoModal(true)}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700">
                + Nova Conciliação
              </button>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs">Data</th>
                    <th className="px-4 py-3 text-left text-xs">Conta</th>
                    <th className="px-4 py-3 text-left text-xs">Descrição</th>
                    <th className="px-4 py-3 text-left text-xs">Tipo</th>
                    <th className="px-4 py-3 text-right text-xs">Valor</th>
                    <th className="px-4 py-3 text-center text-xs">Conciliado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {conciliacoes.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-xs">{format(new Date(c.data + 'T00:00:00'), 'dd/MM/yyyy')}</td>
                      <td className="px-4 py-3 text-xs font-mono">{c.conta_bancaria || '-'}</td>
                      <td className="px-4 py-3 text-xs">{c.descricao}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className={`px-2 py-1 rounded-full text-xs ${c.tipo === 'credito' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {c.tipo === 'credito' ? 'Crédito' : 'Débito'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-right font-semibold">{formatCurrency(c.valor)}</td>
                      <td className="px-4 py-3 text-center">
                        {c.conciliado ?
                          <CheckCircleIcon className="w-5 h-5 text-green-500 mx-auto" /> :
                          <ClockIcon className="w-5 h-5 text-yellow-500 mx-auto" />
                        }
                      </td>
                    </tr>
                  ))}
                  {conciliacoes.length === 0 && (
                    <tr><td colSpan="6" className="px-4 py-12 text-center text-gray-500">Nenhuma conciliação</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ===== MODALS ===== */}

        {/* Modal: Conta a Receber */}
        {showContaReceberModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
              <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Nova Conta a Receber</h3>
                <button onClick={() => setShowContaReceberModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Descrição *</label>
                  <input type="text" value={novaContaReceber.descricao} onChange={(e) => setNovaContaReceber({...novaContaReceber, descricao: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nº Lote</label>
                  <select value={novaContaReceber.numero_lote} onChange={(e) => setNovaContaReceber({...novaContaReceber, numero_lote: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="">Selecione...</option>
                    {lotes.map(l => <option key={l.numero_lote} value={l.numero_lote}>{l.numero_lote} - {l.convenio_nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Valor *</label>
                  <input type="number" step="0.01" value={novaContaReceber.valor_total} onChange={(e) => setNovaContaReceber({...novaContaReceber, valor_total: parseFloat(e.target.value) || 0})}
                    className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Emissão</label>
                    <input type="date" value={novaContaReceber.data_emissao} onChange={(e) => setNovaContaReceber({...novaContaReceber, data_emissao: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Vencimento</label>
                    <input type="date" value={novaContaReceber.data_vencimento} onChange={(e) => setNovaContaReceber({...novaContaReceber, data_vencimento: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Previsão de Pagamento</label>
                  <input type="date" value={novaContaReceber.data_previsao_pagamento} onChange={(e) => setNovaContaReceber({...novaContaReceber, data_previsao_pagamento: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Observações</label>
                  <textarea rows="2" value={novaContaReceber.observacoes} onChange={(e) => setNovaContaReceber({...novaContaReceber, observacoes: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
              </div>
              <div className="p-5 border-t dark:border-gray-700 flex justify-end gap-3">
                <button onClick={() => setShowContaReceberModal(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
                <button onClick={handleAddContaReceber} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Salvar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Conta a Pagar */}
        {showContaPagarModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
              <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Nova Conta a Pagar</h3>
                <button onClick={() => setShowContaPagarModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Descrição *</label>
                  <input type="text" value={novaContaPagar.descricao} onChange={(e) => setNovaContaPagar({...novaContaPagar, descricao: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Fornecedor</label>
                  <input type="text" value={novaContaPagar.fornecedor} onChange={(e) => setNovaContaPagar({...novaContaPagar, fornecedor: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Categoria</label>
                  <select value={novaContaPagar.categoria} onChange={(e) => setNovaContaPagar({...novaContaPagar, categoria: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="prestador">Prestador</option>
                    <option value="operacional">Operacional</option>
                    <option value="imposto">Imposto</option>
                    <option value="aluguel">Aluguel</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Valor *</label>
                  <input type="number" step="0.01" value={novaContaPagar.valor_total} onChange={(e) => setNovaContaPagar({...novaContaPagar, valor_total: parseFloat(e.target.value) || 0})}
                    className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Emissão</label>
                    <input type="date" value={novaContaPagar.data_emissao} onChange={(e) => setNovaContaPagar({...novaContaPagar, data_emissao: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Vencimento</label>
                    <input type="date" value={novaContaPagar.data_vencimento} onChange={(e) => setNovaContaPagar({...novaContaPagar, data_vencimento: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Observações</label>
                  <textarea rows="2" value={novaContaPagar.observacoes} onChange={(e) => setNovaContaPagar({...novaContaPagar, observacoes: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
              </div>
              <div className="p-5 border-t dark:border-gray-700 flex justify-end gap-3">
                <button onClick={() => setShowContaPagarModal(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
                <button onClick={handleAddContaPagar} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Salvar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Nota Fiscal */}
        {showNotaFiscalModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                  {editingNota ? 'Editar Nota Fiscal' : 'Nova Nota Fiscal'}
                </h3>
                <button
                  onClick={() => { setShowNotaFiscalModal(false); setEditingNota(null); }}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <XCircleIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-5 space-y-6">
                {/* Seção: Localizar Lote */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                    <MagnifyingGlassIcon className="w-5 h-5" />
                    Localizar Lote do Faturamento
                  </h4>
                  <div className="flex gap-2">
                    <select
                      value={notaFiscal.numero_lote}
                      onChange={(e) => {
                        const loteSelecionado = e.target.value;
                        setNotaFiscal(prev => ({ ...prev, numero_lote: loteSelecionado }));
                        if (loteSelecionado) {
                          buscarDadosLote(loteSelecionado);
                        }
                      }}
                      className="flex-1 border-2 border-blue-300 dark:border-blue-700 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="">🔍 Selecione um lote para preencher automaticamente...</option>
                        {lotes.map(l => {
                          // Formatar data com segurança
                          let dataFormatada = 'Sem data';
                          try {
                            if (l.data_envio) {
                              const data = new Date(l.data_envio);
                              if (!isNaN(data.getTime())) {
                                dataFormatada = format(data, 'dd/MM/yyyy');
                              }
                            }
                          } catch (e) {
                            console.warn('Data inválida:', l.data_envio);
                          }

                          return (
                            <option key={l.numero_lote} value={l.numero_lote}>
                              📦 {l.numero_lote} | {l.convenio_nome} | {dataFormatada} | {l.quantidade_guias || l.guias_ids?.length || 0} guias
                            </option>
                          );
                        })}
                    </select>
                    <button
                      onClick={() => notaFiscal.numero_lote && buscarDadosLote(notaFiscal.numero_lote)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                      Atualizar Dados
                    </button>
                  </div>
                  {notaFiscal.numero_lote && notaFiscal.convenio_nome && (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full flex items-center gap-1">
                        <BuildingOfficeIcon className="w-3 h-3" />
                        {notaFiscal.convenio_nome}
                      </span>
                      <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full flex items-center gap-1">
                        <DocumentTextIcon className="w-3 h-3" />
                        {notaFiscal.quantidade_guias || 0} guias
                      </span>
                      {notaFiscal.especialidades && (
                        <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-1 rounded-full flex items-center gap-1">
                          <UserGroupIcon className="w-3 h-3" />
                          {notaFiscal.especialidades}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Dados da Nota Fiscal */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                      Nº Nota Fiscal <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={notaFiscal.numero_nota}
                      onChange={(e) => setNotaFiscal({...notaFiscal, numero_nota: e.target.value})}
                      placeholder="NF-0001"
                      className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nº Lote</label>
                    <input
                      type="text"
                      value={notaFiscal.numero_lote}
                      disabled
                      className="w-full bg-gray-100 dark:bg-gray-600 border-2 border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Competência</label>
                    <input
                      type="month"
                      value={notaFiscal.competencia}
                      onChange={(e) => setNotaFiscal({...notaFiscal, competencia: e.target.value})}
                      className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                      Status
                    </label>
                    <select
                      value={notaFiscal.status}
                      onChange={(e) => setNotaFiscal({...notaFiscal, status: e.target.value})}
                      className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="pendente">📋 Pendente</option>
                      <option value="emitida">✅ Emitida</option>
                      <option value="paga">💰 Paga</option>
                      <option value="cancelada">❌ Cancelada</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Data Emissão</label>
                    <input
                      type="date"
                      value={notaFiscal.data_emissao}
                      onChange={(e) => setNotaFiscal({...notaFiscal, data_emissao: e.target.value})}
                      className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Previsão Pagamento</label>
                    <input
                      type="date"
                      value={notaFiscal.data_previsao_pagamento}
                      onChange={(e) => setNotaFiscal({...notaFiscal, data_previsao_pagamento: e.target.value})}
                      className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Convênio</label>
                    <select
                      value={notaFiscal.convenio_id || ''}
                      onChange={(e) => setNotaFiscal({...notaFiscal, convenio_id: e.target.value ? parseInt(e.target.value) : null})}
                      className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="">Selecione um convênio...</option>
                      {convenios.map(c => (
                        <option key={c.id} value={c.id}>{c.razao_social}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Valores e Impostos */}
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <CalculatorIcon className="w-5 h-5 text-purple-600" />
                    Impostos e Deduções
                  </h4>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="col-span-2 md:col-span-4">
                      <label className="block text-sm font-medium mb-1 dark:text-gray-300">Base de Cálculo</label>
                      <input
                        type="number"
                        step="0.01"
                        value={notaFiscal.base_calculo}
                        onChange={(e) => atualizarNotaFiscal('base_calculo', e.target.value)}
                        className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-bold text-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">ISS (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={notaFiscal.aliquota_iss}
                        onChange={(e) => atualizarNotaFiscal('aliquota_iss', e.target.value)}
                        className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">IR (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={notaFiscal.aliquota_ir}
                        onChange={(e) => atualizarNotaFiscal('aliquota_ir', e.target.value)}
                        className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">CSLL (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={notaFiscal.aliquota_csll}
                        onChange={(e) => atualizarNotaFiscal('aliquota_csll', e.target.value)}
                        className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">PIS (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={notaFiscal.aliquota_pis}
                        onChange={(e) => atualizarNotaFiscal('aliquota_pis', e.target.value)}
                        className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">COFINS (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={notaFiscal.aliquota_cofins}
                        onChange={(e) => atualizarNotaFiscal('aliquota_cofins', e.target.value)}
                        className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">IBS (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={notaFiscal.aliquota_ibs}
                        onChange={(e) => atualizarNotaFiscal('aliquota_ibs', e.target.value)}
                        className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">CBS (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={notaFiscal.aliquota_cbs}
                        onChange={(e) => atualizarNotaFiscal('aliquota_cbs', e.target.value)}
                        className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Resultados dos impostos */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Valor Total</label>
                      <input
                        type="text"
                        value={formatCurrency(notaFiscal.valor_total)}
                        disabled
                        className="w-full bg-gray-100 dark:bg-gray-600 border-2 border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-bold text-gray-700 dark:text-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Valor ISS</label>
                      <input
                        type="text"
                        value={formatCurrency(notaFiscal.valor_iss)}
                        disabled
                        className="w-full bg-gray-100 dark:bg-gray-600 border-2 border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Total Impostos</label>
                      <input
                        type="text"
                        value={formatCurrency(
                          (notaFiscal.valor_iss || 0) +
                          (notaFiscal.valor_ibs || 0) +
                          (notaFiscal.valor_cbs || 0) +
                          (notaFiscal.valor_ir || 0) +
                          (notaFiscal.valor_csll || 0) +
                          (notaFiscal.valor_pis || 0) +
                          (notaFiscal.valor_cofins || 0)
                        )}
                        disabled
                        className="w-full bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg px-3 py-2 text-sm font-bold text-red-600 dark:text-red-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Valor Líquido</label>
                      <input
                        type="text"
                        value={formatCurrency(notaFiscal.valor_liquido)}
                        disabled
                        className="w-full bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg px-3 py-2 text-sm font-bold text-green-700 dark:text-green-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Anexos */}
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                    <ArrowUpTrayIcon className="w-5 h-5 text-orange-600" />
                    Anexos
                  </h4>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="Nome do documento"
                      value={novoAnexoNome}
                      onChange={(e) => setNovoAnexoNome(e.target.value)}
                      className="flex-1 border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    />
                    <input
                      type="text"
                      placeholder="URL ou link do arquivo"
                      value={novoAnexoUrl}
                      onChange={(e) => setNovoAnexoUrl(e.target.value)}
                      className="flex-[2] border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    />
                    <button
                      onClick={addAnexo}
                      disabled={!novoAnexoNome || !novoAnexoUrl}
                      className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1 transition-all"
                    >
                      <PlusCircleIcon className="w-4 h-4" />
                      Adicionar
                    </button>
                  </div>

                  {anexos.length > 0 && (
                    <div className="space-y-2">
                      {anexos.map((anexo, i) => (
                        <div key={i} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border dark:border-gray-700 hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3">
                            <DocumentTextIcon className="w-5 h-5 text-blue-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-800 dark:text-white">{anexo.nome}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{anexo.url}</p>
                            </div>
                            <span className="text-xs text-gray-400">{anexo.data}</span>
                          </div>
                          <button
                            onClick={() => removeAnexo(i)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors"
                          >
                            <XCircleIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Observações</label>
                  <textarea
                    rows="3"
                    value={notaFiscal.observacoes}
                    onChange={(e) => setNotaFiscal({...notaFiscal, observacoes: e.target.value})}
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                    placeholder="Observações sobre esta nota fiscal..."
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t dark:border-gray-700 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-gray-800">
                <button
                  onClick={() => { setShowNotaFiscalModal(false); setEditingNota(null); }}
                  className="px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveNotaFiscal}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  {editingNota ? 'Atualizar Nota Fiscal' : 'Salvar Nota Fiscal'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Recebimento */}
        {showRecebimentoModal && selectedItem && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm">
              <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Registrar Recebimento</h3>
                <button onClick={() => setShowRecebimentoModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-sm font-medium">{selectedItem.descricao}</p>
                  <p className="text-xs text-gray-500 mt-1">Valor total: {formatCurrency(selectedItem.valor_total)}</p>
                  <p className="text-xs text-gray-500">Já recebido: {formatCurrency(selectedItem.valor_recebido || 0)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Valor a Receber</label>
                  <input type="number" step="0.01" value={valorRecebimento} onChange={(e) => setValorRecebimento(parseFloat(e.target.value) || 0)}
                    className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Data Recebimento</label>
                  <input type="date" value={dataRecebimento} onChange={(e) => setDataRecebimento(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Forma Pagamento</label>
                  <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="PIX">PIX</option>
                    <option value="Transferência">Transferência</option>
                    <option value="Boleto">Boleto</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cartão">Cartão</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nº Documento</label>
                  <input type="text" value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Conta Bancária</label>
                  <input type="text" value={contaBancaria} onChange={(e) => setContaBancaria(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
              </div>
              <div className="p-5 border-t dark:border-gray-700 flex justify-end gap-3">
                <button onClick={() => setShowRecebimentoModal(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
                <button onClick={handleReceber} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Confirmar Recebimento</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Pagamento */}
        {showPagamentoModal && selectedItem && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm">
              <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Registrar Pagamento</h3>
                <button onClick={() => setShowPagamentoModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-sm font-medium">{selectedItem.descricao}</p>
                  <p className="text-xs text-gray-500 mt-1">Valor total: {formatCurrency(selectedItem.valor_total)}</p>
                  <p className="text-xs text-gray-500">Já pago: {formatCurrency(selectedItem.valor_pago || 0)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Valor a Pagar</label>
                  <input type="number" step="0.01" value={valorPagamento} onChange={(e) => setValorPagamento(parseFloat(e.target.value) || 0)}
                    className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Data Pagamento</label>
                  <input type="date" value={dataPagamento} onChange={(e) => setDataPagamento(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Forma Pagamento</label>
                  <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="PIX">PIX</option>
                    <option value="Transferência">Transferência</option>
                    <option value="Boleto">Boleto</option>
                    <option value="Dinheiro">Dinheiro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nº Documento</label>
                  <input type="text" value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
              </div>
              <div className="p-5 border-t dark:border-gray-700 flex justify-end gap-3">
                <button onClick={() => setShowPagamentoModal(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
                <button onClick={handlePagar} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Confirmar Pagamento</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Conciliação */}
        {showConciliacaoModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm">
              <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Nova Conciliação</h3>
                <button onClick={() => setShowConciliacaoModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Conta Bancária</label>
                  <input type="text" value={contaBancaria} onChange={(e) => setContaBancaria(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Data</label>
                  <input type="date" value={dataRecebimento} onChange={(e) => setDataRecebimento(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Valor</label>
                  <input type="number" step="0.01" value={valorRecebimento} onChange={(e) => setValorRecebimento(parseFloat(e.target.value) || 0)}
                    className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
              </div>
              <div className="p-5 border-t dark:border-gray-700 flex justify-end gap-3">
                <button onClick={() => setShowConciliacaoModal(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
                <button onClick={handleAddConciliacao} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Salvar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
