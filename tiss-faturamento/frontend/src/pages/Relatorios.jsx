import { useState, useEffect, useMemo } from 'react';
import {
  DocumentArrowDownIcon, ChartBarIcon,
  TableCellsIcon, DocumentTextIcon,
  PrinterIcon, CalendarIcon,
  BuildingOfficeIcon, CurrencyDollarIcon,
  UserGroupIcon, ClipboardDocumentListIcon,
  ClipboardDocumentCheckIcon, ClipboardDocumentIcon,
  CheckCircleIcon, ClockIcon, BanknotesIcon,
  ReceiptPercentIcon, PresentationChartLineIcon, ArrowPathIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, subDays, subMonths } from 'date-fns';
import { supabase } from '../lib/supabaseClient';
import { useUnidade } from '../contexts/UnidadeContext';
import { filterByUnidade } from '../services/unidadesService';

// ============================================
// FUNÇÕES DE EXPORTAÇÃO
// ============================================
const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    toast.error('Não há dados para exportar');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(';')];

  for (const row of data) {
    const values = headers.map(header => {
      let value = row[header] || '';
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(';'));
  }

  const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success('CSV exportado com sucesso!');
};

const exportToHTML = (data, title, filename) => {
  if (!data || data.length === 0) {
    toast.error('Não há dados para exportar');
    return;
  }

  const headers = Object.keys(data[0]);
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
    <style>body{font-family:Arial;margin:20px}h1{color:#2563eb}table{border-collapse:collapse;width:100%;margin-top:20px}
    th{background:#2563eb;color:#fff;padding:10px;text-align:left}td{border:1px solid #ddd;padding:8px}
    tr:nth-child(even){background:#f9fafb}.footer{margin-top:20px;font-size:12px;color:#666;text-align:center}
    @media print{body{margin:0;padding:10px}button{display:none}}</style></head><body>
    <h1>${title}</h1><p><strong>Gerado em:</strong> ${new Date().toLocaleString()}</p>
    <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>
    ${data.map(row => `<tr>${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}</tr>`).join('')}
    </tbody></table><div class="footer"><p>Sistema de Faturamento TISS</p></div></body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${filename}.html`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success('HTML exportado com sucesso!');
};


const moeda = (valor = 0) => `R$ ${Number(valor || 0).toFixed(2)}`;
const percentual = (valor = 0) => `${Number(valor || 0).toFixed(2)}%`;

const getRelatorioLabel = (tipo) => ({
  faturamento: 'Faturamento consolidado',
  financeiro: 'Financeiro consolidado',
  atendimentos: 'Atendimentos / Produção',
  glosas: 'Glosas e recursos',
  notas: 'Notas fiscais / Faturamento'
}[tipo] || 'Relatório');

export default function Relatorios() {
  const { unidadeAtualId } = useUnidade();
  const [loading, setLoading] = useState(true);
  const [tipoRelatorio, setTipoRelatorio] = useState('faturamento');
  const [formatoExportacao, setFormatoExportacao] = useState('csv');
  const [filtroPeriodo, setFiltroPeriodo] = useState('mes');
  const [dataInicio, setDataInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [filtroConvenio, setFiltroConvenio] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  // Dados
  const [atendimentos, setAtendimentos] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [notasFiscais, setNotasFiscais] = useState([]);
  const [contasReceber, setContasReceber] = useState([]);
  const [contasPagar, setContasPagar] = useState([]);
  const [glosas, setGlosas] = useState([]);
  const [fluxoCaixa, setFluxoCaixa] = useState([]);
  const [convenios, setConvenios] = useState([]);

  useEffect(() => {
    carregarDados();
  }, [unidadeAtualId]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [
        atendimentosRes, lotesRes, notasRes, receberRes,
        pagarRes, glosasRes, fluxoRes, conveniosRes
      ] = await Promise.all([
        supabase.from('atendimentos').select('*').order('created_at', { ascending: false }),
        supabase.from('lotes_faturamento').select('*').order('created_at', { ascending: false }),
        supabase.from('notas_fiscais').select('*').order('created_at', { ascending: false }),
        supabase.from('contas_receber').select('*').order('data_vencimento', { ascending: true }),
        supabase.from('contas_pagar').select('*').order('data_vencimento', { ascending: true }),
        supabase.from('glosas').select('*').order('created_at', { ascending: false }),
        supabase.from('fluxo_caixa').select('*').order('data', { ascending: false }),
        supabase.from('convenios').select('id, razao_social, unidade_id').eq('ativo', true).order('razao_social')
      ]);

      setAtendimentos(filterByUnidade(atendimentosRes.data || [], unidadeAtualId));
      setLotes(filterByUnidade(lotesRes.data || [], unidadeAtualId));
      setNotasFiscais(filterByUnidade(notasRes.data || [], unidadeAtualId));
      setContasReceber(filterByUnidade(receberRes.data || [], unidadeAtualId));
      setContasPagar(filterByUnidade(pagarRes.data || [], unidadeAtualId));
      setGlosas(filterByUnidade(glosasRes.data || [], unidadeAtualId));
      setFluxoCaixa(filterByUnidade(fluxoRes.data || [], unidadeAtualId));
      setConvenios(filterByUnidade(conveniosRes.data || [], unidadeAtualId));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const getPeriodoFiltro = () => {
    if (filtroPeriodo === 'personalizado') {
      return { inicio: new Date(dataInicio + 'T00:00:00'), fim: new Date(dataFim + 'T23:59:59') };
    }
    const hoje = new Date();
    switch (filtroPeriodo) {
      case 'hoje':
        return { inicio: new Date(hoje.setHours(0, 0, 0, 0)), fim: new Date(hoje.setHours(23, 59, 59, 999)) };
      case 'semana':
        return { inicio: subDays(new Date(), 7), fim: new Date() };
      case 'mes':
        return { inicio: startOfMonth(new Date()), fim: endOfMonth(new Date()) };
      case 'trimestre':
        return { inicio: subMonths(new Date(), 3), fim: new Date() };
      case 'ano':
        return { inicio: new Date(new Date().getFullYear(), 0, 1), fim: new Date() };
      default:
        return { inicio: new Date(2020, 0, 1), fim: new Date() };
    }
  };

  const filtrarPorData = (dados, campoData = 'created_at') => {
    const { inicio, fim } = getPeriodoFiltro();
    return dados.filter(item => {
      const dataItem = item[campoData] || item.data_emissao || item.data_atendimento || item.data;
      if (!dataItem) return true;
      const data = new Date(dataItem);
      return data >= inicio && data <= fim;
    });
  };

  // Dados filtrados
  const atendimentosFiltrados = useMemo(() => {
    let dados = filtrarPorData(atendimentos, 'data_atendimento');
    if (filtroConvenio !== 'todos') dados = dados.filter(a => a.paciente_convenio_id === parseInt(filtroConvenio));
    if (filtroStatus !== 'todos') dados = dados.filter(a => a.status === filtroStatus);
    return dados;
  }, [atendimentos, filtroPeriodo, dataInicio, dataFim, filtroConvenio, filtroStatus]);

  const lotesFiltrados = useMemo(() => filtrarPorData(lotes), [lotes, filtroPeriodo, dataInicio, dataFim]);
  const notasFiltradas = useMemo(() => filtrarPorData(notasFiscais, 'data_emissao'), [notasFiscais, filtroPeriodo, dataInicio, dataFim]);
  const glosasFiltradas = useMemo(() => filtrarPorData(glosas), [glosas, filtroPeriodo, dataInicio, dataFim]);
  const contasReceberFiltradas = useMemo(() => filtrarPorData(contasReceber, 'data_vencimento'), [contasReceber, filtroPeriodo, dataInicio, dataFim]);
  const contasPagarFiltradas = useMemo(() => filtrarPorData(contasPagar, 'data_vencimento'), [contasPagar, filtroPeriodo, dataInicio, dataFim]);
  const fluxoFiltrado = useMemo(() => filtrarPorData(fluxoCaixa, 'data'), [fluxoCaixa, filtroPeriodo, dataInicio, dataFim]);

  // ===== ESTATÍSTICAS =====
  const stats = useMemo(() => {
    const totalFaturado = atendimentosFiltrados.reduce((s, a) => s + (a.valor_total || 0), 0);
    const totalLotes = lotesFiltrados.length;
    const totalNotas = notasFiltradas.length;
    const totalGlosas = glosasFiltradas.reduce((s, g) => s + (g.valor_glosado || 0), 0);
    const totalReceber = contasReceberFiltradas.reduce((s, c) => s + (c.valor_total || c.valor || 0), 0);
    const totalRecebido = contasReceberFiltradas
      .filter(c => c.status === 'recebido')
      .reduce((s, c) => s + (c.valor_recebido || c.valor_total || c.valor || 0), 0);
    const totalPagar = contasPagarFiltradas.reduce((s, c) => s + (c.valor_total || c.valor || 0), 0);
    const totalPago = contasPagarFiltradas
      .filter(c => c.status === 'pago')
      .reduce((s, c) => s + (c.valor_pago || c.valor_total || c.valor || 0), 0);
    const saldoFluxo = fluxoFiltrado.reduce((s, f) => s + (f.tipo === 'entrada' ? (f.valor || 0) : -(f.valor || 0)), 0);
    const valorLiquido = totalFaturado - totalGlosas;
    const taxaGlosa = totalFaturado > 0 ? (totalGlosas / totalFaturado) * 100 : 0;

    return {
      totalFaturado, totalLotes, totalNotas, totalGlosas,
      totalReceber, totalRecebido, totalPagar, totalPago, saldoFluxo,
      valorLiquido, taxaGlosa,
      totalAtendimentos: atendimentosFiltrados.length,
      ticketMedio: atendimentosFiltrados.length > 0 ? totalFaturado / atendimentosFiltrados.length : 0
    };
  }, [atendimentosFiltrados, lotesFiltrados, notasFiltradas, glosasFiltradas, contasReceberFiltradas, contasPagarFiltradas, fluxoFiltrado]);

  const faturamentoPorConvenio = useMemo(() => {
    const map = {};
    atendimentosFiltrados.forEach(a => {
      const nome = a.paciente_convenio_nome || 'Sem convênio';
      map[nome] = (map[nome] || 0) + (a.valor_total || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [atendimentosFiltrados]);

  const glosasPorTipo = useMemo(() => {
    const map = {};
    glosasFiltradas.forEach(g => {
      const tipo = g.tipo_glosa || 'Não informado';
      map[tipo] = (map[tipo] || 0) + (g.valor_glosado || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [glosasFiltradas]);

  // ===== GERAÇÃO DE RELATÓRIOS =====
  const gerarDadosFaturamento = () => {
    return [
      { Indicador: 'Total Faturado', Valor: moeda(stats.totalFaturado) },
      { Indicador: 'Total de Atendimentos', Valor: stats.totalAtendimentos },
      { Indicador: 'Ticket Médio', Valor: moeda(stats.ticketMedio) },
      { Indicador: 'Total de Lotes', Valor: stats.totalLotes },
      { Indicador: 'Total de Notas Fiscais', Valor: stats.totalNotas },
      { Indicador: 'Total Glosado', Valor: `${moeda(stats.totalGlosas)} (${percentual(stats.taxaGlosa)})` },
      { Indicador: 'Total Recebido', Valor: moeda(stats.totalRecebido) },
      { Indicador: 'Total Pago', Valor: moeda(stats.totalPago) },
      { Indicador: 'Saldo Fluxo de Caixa', Valor: moeda(stats.saldoFluxo) },
      { Indicador: 'Valor Líquido após Glosas', Valor: moeda(stats.valorLiquido) },
      {},
      { Indicador: '--- FATURAMENTO POR CONVÊNIO ---', Valor: '' },
      ...faturamentoPorConvenio.map(([conv, valor]) => ({
        Indicador: conv, Valor: moeda(valor)
      })),
      {},
      { Indicador: '--- GLOSAS POR TIPO ---', Valor: '' },
      ...glosasPorTipo.map(([tipo, valor]) => ({
        Indicador: `Tipo ${tipo}`, Valor: moeda(valor)
      }))
    ];
  };

  const gerarDadosFinanceiro = () => {
    const receberPendente = contasReceberFiltradas.filter(c => c.status !== 'recebido');
    const receberRecebido = contasReceberFiltradas.filter(c => c.status === 'recebido');
    const pagarPendente = contasPagarFiltradas.filter(c => c.status !== 'pago');
    const pagarPago = contasPagarFiltradas.filter(c => c.status === 'pago');
    return [
      { Categoria: 'Contas a Receber (pendentes)', Quantidade: receberPendente.length, Valor: moeda(receberPendente.reduce((s, c) => s + (c.valor_total || c.valor || 0), 0)) },
      { Categoria: 'Contas a Receber (recebidas)', Quantidade: receberRecebido.length, Valor: moeda(receberRecebido.reduce((s, c) => s + (c.valor_recebido || c.valor_total || c.valor || 0), 0)) },
      { Categoria: 'Contas a Pagar (pendentes)', Quantidade: pagarPendente.length, Valor: moeda(pagarPendente.reduce((s, c) => s + (c.valor_total || c.valor || 0), 0)) },
      { Categoria: 'Contas a Pagar (pagas)', Quantidade: pagarPago.length, Valor: moeda(pagarPago.reduce((s, c) => s + (c.valor_pago || c.valor_total || c.valor || 0), 0)) },
      { Categoria: 'Entradas (fluxo de caixa)', Quantidade: fluxoFiltrado.filter(f => f.tipo === 'entrada').length, Valor: moeda(fluxoFiltrado.filter(f => f.tipo === 'entrada').reduce((s, f) => s + (f.valor || 0), 0)) },
      { Categoria: 'Saídas (fluxo de caixa)', Quantidade: fluxoFiltrado.filter(f => f.tipo === 'saida').length, Valor: moeda(fluxoFiltrado.filter(f => f.tipo === 'saida').reduce((s, f) => s + (f.valor || 0), 0)) },
      { Categoria: 'Saldo Líquido', Quantidade: '-', Valor: moeda(stats.saldoFluxo) }
    ];
  };

  const gerarDadosGlosas = () => glosasFiltradas.map(g => ({
    Data: g.data_glosa || g.created_at || '-',
    Paciente: g.paciente_nome || g.beneficiario || '-',
    Convênio: g.convenio_nome || g.paciente_convenio_nome || '-',
    Guia: g.numero_guia || g.numero_guia_prestador || '-',
    Tipo: g.tipo_glosa || '-',
    Motivo: g.motivo || g.descricao || g.observacao || '-',
    'Valor Glosado': moeda(g.valor_glosado || g.valor || 0),
    Status: g.status || '-'
  }));

  const gerarDadosNotas = () => notasFiltradas.map(n => ({
    Emissão: n.data_emissao || n.created_at || '-',
    Número: n.numero_nota || n.numero_nf || '-',
    Convênio: n.convenio_nome || n.tomador || '-',
    Lote: n.numero_lote || n.lote_id || '-',
    'Valor Bruto': moeda(n.valor_bruto || n.valor_total || 0),
    'Valor Líquido': moeda(n.valor_liquido || n.valor_total || 0),
    Status: n.status || '-'
  }));

  const gerarRelatorio = () => {
    const dataAtual = format(new Date(), 'yyyyMMdd_HHmmss');
    const nomeArquivo = `relatorio_${tipoRelatorio}_${dataAtual}`;

    let dados;
    if (tipoRelatorio === 'faturamento') {
      dados = gerarDadosFaturamento();
    } else if (tipoRelatorio === 'financeiro') {
      dados = gerarDadosFinanceiro();
    } else if (tipoRelatorio === 'glosas') {
      dados = gerarDadosGlosas();
    } else if (tipoRelatorio === 'notas') {
      dados = gerarDadosNotas();
    } else {
      dados = atendimentosFiltrados.map(a => ({
        Data: a.data_atendimento || '-',
        Paciente: a.paciente_nome || '-',
        CPF: a.cpf || '-',
        Convênio: a.paciente_convenio_nome || '-',
        Carteira: a.numero_carteira || '-',
        Guia: a.numero_guia_prestador || '-',
        Autorização: a.senha_autorizacao || a.numero_guia_operadora || '-',
        'Valor Total': moeda(a.valor_total || 0),
        Status: a.status || '-'
      }));
    }

    if (dados.length === 0) {
      toast.error('Não há dados para exportar no período selecionado');
      return;
    }

    if (formatoExportacao === 'csv') {
      exportToCSV(dados, nomeArquivo);
    } else {
      exportToHTML(dados, 'Relatório TISS', nomeArquivo);
    }
  };

  const imprimirRelatorio = () => {
    const printWindow = window.open('', '_blank');
    const dadosDetalhados = tipoRelatorio === 'faturamento'
      ? gerarDadosFaturamento()
      : tipoRelatorio === 'financeiro'
        ? gerarDadosFinanceiro()
        : tipoRelatorio === 'glosas'
          ? gerarDadosGlosas()
          : tipoRelatorio === 'notas'
            ? gerarDadosNotas()
            : atendimentosFiltrados.map(a => ({
                Data: a.data_atendimento || '-',
                Paciente: a.paciente_nome || '-',
                CPF: a.cpf || '-',
                Convênio: a.paciente_convenio_nome || '-',
                Carteira: a.numero_carteira || '-',
                Guia: a.numero_guia_prestador || '-',
                Autorização: a.senha_autorizacao || a.numero_guia_operadora || '-',
                'Valor Total': moeda(a.valor_total || 0),
                Status: a.status || '-'
              }));
    const headersDetalhe = Object.keys(dadosDetalhados[0] || {});
    const tabelaDetalhe = headersDetalhe.length ? `
      <h3>Detalhamento</h3>
      <table><thead><tr>${headersDetalhe.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>
      ${dadosDetalhados.map(row => `<tr>${headersDetalhe.map(h => `<td>${row[h] || ''}</td>`).join('')}</tr>`).join('')}
      </tbody></table>` : '<p>Sem dados detalhados para o período.</p>';
    let conteudo = `
      <!DOCTYPE html><html><head><title>Relatório</title>
      <style>body{font-family:Arial;margin:20px}h1{color:#2563eb}h2{color:#333;margin-top:20px}
      table{border-collapse:collapse;width:100%;margin:20px 0}th{background:#2563eb;color:#fff;padding:10px;text-align:left}
      td{border:1px solid #ddd;padding:8px}.footer{margin-top:30px;font-size:12px;color:#666;text-align:center}
      @media print{button{display:none}}</style></head><body>
      <h1>Sistema de Faturamento TISS</h1>
      <h2>${getRelatorioLabel(tipoRelatorio)}</h2>
      <p><strong>Gerado em:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Período:</strong> ${getPeriodoFiltro().inicio.toLocaleDateString()} a ${getPeriodoFiltro().fim.toLocaleDateString()}</p>
      <hr>
      <h3>Resumo</h3>
      <table><tr><th>Indicador</th><th>Valor</th></tr>
      <tr><td>Total Faturado</td><td>${moeda(stats.totalFaturado)}</td></tr>
      <tr><td>Total Atendimentos</td><td>${stats.totalAtendimentos}</td></tr>
      <tr><td>Ticket Médio</td><td>${moeda(stats.ticketMedio)}</td></tr>
      <tr><td>Total Lotes</td><td>${stats.totalLotes}</td></tr>
      <tr><td>Notas Fiscais</td><td>${stats.totalNotas}</td></tr>
      <tr><td>Valor Glosado</td><td>${moeda(stats.totalGlosas)} (${percentual(stats.taxaGlosa)})</td></tr>
      <tr><td>Total Recebido</td><td>${moeda(stats.totalRecebido)}</td></tr>
      <tr><td>Total Pago</td><td>${moeda(stats.totalPago)}</td></tr>
      <tr><td>Saldo Fluxo</td><td>${moeda(stats.saldoFluxo)}</td></tr><tr><td>Valor Líquido após Glosas</td><td>${moeda(stats.valorLiquido)}</td></tr>
      </table>
      ${tabelaDetalhe}
      <div class="footer">Sistema de Faturamento TISS</div>
      <script>window.onload=function(){window.print()}</script></body></html>`;

    printWindow.document.write(conteudo);
    printWindow.document.close();
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
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Relatórios</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Análise de faturamento, financeiro e produção</p>
          </div>
          <button onClick={carregarDados} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-300 transition-all">
            <ArrowPathIcon className="w-4 h-4" /> Atualizar
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 mb-6">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Filtros</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Período</label>
              <select value={filtroPeriodo} onChange={(e) => setFiltroPeriodo(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="hoje">Hoje</option>
                <option value="semana">Últimos 7 dias</option>
                <option value="mes">Este mês</option>
                <option value="trimestre">Último trimestre</option>
                <option value="ano">Este ano</option>
                <option value="todos">Todos</option>
                <option value="personalizado">Personalizado</option>
              </select>
            </div>
            {filtroPeriodo === 'personalizado' && (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Data Início</label>
                  <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Data Fim</label>
                  <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Convênio</label>
              <select value={filtroConvenio} onChange={(e) => setFiltroConvenio(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="todos">Todos</option>
                {convenios.map(c => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="todos">Todos</option>
                <option value="faturado">Faturado</option>
                <option value="finalizada">Finalizado</option>
                <option value="pendente">Pendente</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cards resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Faturado', value: moeda(stats.totalFaturado), color: 'text-green-600', icon: CurrencyDollarIcon },
            { label: 'Atendimentos', value: stats.totalAtendimentos, color: 'text-blue-600', icon: ClipboardDocumentCheckIcon },
            { label: 'Ticket Médio', value: moeda(stats.ticketMedio), color: 'text-purple-600', icon: PresentationChartLineIcon },
            { label: 'Lotes Gerados', value: stats.totalLotes, color: 'text-orange-600', icon: ClipboardDocumentIcon },
            { label: 'Notas Fiscais', value: stats.totalNotas, color: 'text-indigo-600', icon: BanknotesIcon },
            { label: 'Valor Glosado', value: `${moeda(stats.totalGlosas)} (${percentual(stats.taxaGlosa)})`, color: 'text-red-600', icon: ReceiptPercentIcon },
            { label: 'Líquido pós-glosa', value: moeda(stats.valorLiquido), color: 'text-teal-600', icon: CheckCircleIcon },
            { label: 'Total Recebido', value: moeda(stats.totalRecebido), color: 'text-emerald-600', icon: CheckCircleIcon },
            { label: 'Saldo Fluxo', value: moeda(stats.saldoFluxo), color: stats.saldoFluxo >= 0 ? 'text-cyan-600' : 'text-red-600', icon: CurrencyDollarIcon },
          ].map((card, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
                  <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
                </div>
                <card.icon className={`w-7 h-7 ${card.color} opacity-30`} />
              </div>
            </div>
          ))}
        </div>

        {/* Tipo de Relatório e Exportação */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Relatório</label>
            <div className="flex gap-4 flex-wrap">
              {['faturamento', 'financeiro', 'atendimentos', 'glosas', 'notas'].map(tipo => (
                <label key={tipo} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={tipo} checked={tipoRelatorio === tipo} onChange={(e) => setTipoRelatorio(e.target.value)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{getRelatorioLabel(tipo)}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Formato</label>
            <div className="flex gap-4">
              {['csv', 'html'].map(fmt => (
                <label key={fmt} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={fmt} checked={formatoExportacao === fmt} onChange={(e) => setFormatoExportacao(e.target.value)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 uppercase">{fmt}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button onClick={gerarRelatorio} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 rounded-xl text-sm hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2">
            <DocumentArrowDownIcon className="w-5 h-5" />
            Exportar ({formatoExportacao.toUpperCase()})
          </button>
          <button onClick={imprimirRelatorio} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl text-sm hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2">
            <PrinterIcon className="w-5 h-5" />
            Imprimir
          </button>
        </div>

        {/* Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
          <div className="p-4 border-b bg-gray-50 dark:bg-gray-700/50">
            <h3 className="font-semibold text-gray-800 dark:text-white">Preview</h3>
          </div>
          <div className="p-4">
            {/* Resumo do faturamento por convênio */}
            <div className="mb-6">
              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">Faturamento por Convênio</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {faturamentoPorConvenio.slice(0, 5).map(([conv, valor]) => (
                  <div key={conv} className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{conv}</span>
                    <span className="font-semibold text-green-600">R$ {valor.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumo de glosas */}
            <div>
              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">Glosas por Tipo</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {glosasPorTipo.slice(0, 5).map(([tipo, valor]) => (
                  <div key={tipo} className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Tipo {tipo}</span>
                    <span className="font-semibold text-red-600">R$ {valor.toFixed(2)}</span>
                  </div>
                ))}
                {glosasPorTipo.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">Nenhuma glosa no período</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
