import { useState, useEffect, useMemo } from 'react';
import { 
  DocumentArrowDownIcon, ChartBarIcon, 
  TableCellsIcon, DocumentTextIcon, 
  PrinterIcon, CalendarIcon,
  BuildingOfficeIcon, CurrencyDollarIcon,
  UserGroupIcon, ClipboardDocumentListIcon,
  CheckCircleIcon, ClockIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format, subDays, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { supabase } from '../lib/supabaseClient';

// Funções auxiliares para exportação
const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    toast.error('Não há dados para exportar');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [];
  csvRows.push(headers.join(';'));
  
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
  
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.success('CSV gerado com sucesso!');
};

const exportToHTML = (data, title, filename) => {
  if (!data || data.length === 0) {
    toast.error('Não há dados para exportar');
    return;
  }

  const headers = Object.keys(data[0]);
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #2563eb; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th { background-color: #2563eb; color: white; padding: 10px; text-align: left; }
        td { border: 1px solid #ddd; padding: 8px; }
        tr:nth-child(even) { background-color: #f9fafb; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p><strong>Gerado em:</strong> ${new Date().toLocaleString()}</p>
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="footer">
        <p>Sistema de Faturamento TISS - Relatório gerado automaticamente</p>
      </div>
    </body>
    </html>
  `;
  
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.html`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.success('HTML gerado com sucesso!');
};

export default function Relatorios() {
  const [atendimentos, setAtendimentos] = useState([]);
  const [convenios, setConvenios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroConvenio, setFiltroConvenio] = useState('todos');
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [tipoRelatorio, setTipoRelatorio] = useState('faturamento');
  const [formatoExportacao, setFormatoExportacao] = useState('csv');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Carregar atendimentos
      const { data: atendimentosData, error: atendimentosError } = await supabase
        .from('atendimentos')
        .select('*')
        .order('created_at', { ascending: false });

      if (atendimentosError) throw atendimentosError;

      // Carregar convênios
      const { data: conveniosData, error: conveniosError } = await supabase
        .from('convenios')
        .select('*')
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

  const aplicarFiltros = (dados) => {
    let filtrados = [...dados];
    
    // Filtro por status
    if (filtroStatus !== 'todos') {
      filtrados = filtrados.filter(a => a.status === filtroStatus);
    }
    
    // Filtro por convênio
    if (filtroConvenio !== 'todos') {
      filtrados = filtrados.filter(a => a.paciente_convenio_id === parseInt(filtroConvenio));
    }
    
    // Filtro por período
    if (filtroPeriodo !== 'todos') {
      const hoje = new Date();
      hoje.setHours(23, 59, 59, 999);
      
      switch(filtroPeriodo) {
        case 'hoje':
          const inicioHoje = new Date();
          inicioHoje.setHours(0, 0, 0, 0);
          filtrados = filtrados.filter(a => {
            const data = a.data_atendimento || (a.itens && a.itens[0]?.data_execucao);
            if (!data) return false;
            return new Date(data) >= inicioHoje && new Date(data) <= hoje;
          });
          break;
        case 'semana':
          const inicioSemana = subDays(hoje, 7);
          filtrados = filtrados.filter(a => {
            const data = a.data_atendimento || (a.itens && a.itens[0]?.data_execucao);
            if (!data) return false;
            return new Date(data) >= inicioSemana;
          });
          break;
        case 'mes':
          const inicioMes = startOfMonth(hoje);
          filtrados = filtrados.filter(a => {
            const data = a.data_atendimento || (a.itens && a.itens[0]?.data_execucao);
            if (!data) return false;
            return new Date(data) >= inicioMes;
          });
          break;
        case 'personalizado':
          if (dataInicio && dataFim) {
            const inicio = new Date(dataInicio);
            inicio.setHours(0, 0, 0, 0);
            const fim = new Date(dataFim);
            fim.setHours(23, 59, 59, 999);
            filtrados = filtrados.filter(a => {
              const data = a.data_atendimento || (a.itens && a.itens[0]?.data_execucao);
              if (!data) return false;
              return new Date(data) >= inicio && new Date(data) <= fim;
            });
          }
          break;
      }
    }
    
    return filtrados;
  };

  const faturadoPorConvenio = (dados) => {
    const resultado = {};
    dados.forEach(a => {
      const nome = a.paciente_convenio_nome || 'Sem convênio';
      resultado[nome] = (resultado[nome] || 0) + (a.valor_total || 0);
    });
    // Ordenar por valor decrescente
    return Object.fromEntries(
      Object.entries(resultado).sort((a, b) => b[1] - a[1])
    );
  };

  const faturadoPorPrestador = (dados) => {
    const resultado = {};
    dados.forEach(a => {
      if (a.itens && a.itens.length > 0) {
        a.itens.forEach(item => {
          const nome = item.prestador_nome || 'Não informado';
          resultado[nome] = (resultado[nome] || 0) + (item.valor_total || 0);
        });
      } else {
        const nome = a.prestador_nome || 'Não informado';
        resultado[nome] = (resultado[nome] || 0) + (a.valor_total || 0);
      }
    });
    // Ordenar por valor decrescente
    return Object.fromEntries(
      Object.entries(resultado).sort((a, b) => b[1] - a[1])
    );
  };

  const faturadoPorProcedimento = (dados) => {
    const resultado = {};
    dados.forEach(a => {
      if (a.itens && a.itens.length > 0) {
        a.itens.forEach(item => {
          const nome = item.nome || item.procedimento_nome || 'Não informado';
          resultado[nome] = (resultado[nome] || 0) + (item.valor_total || 0);
        });
      } else {
        const nome = a.procedimento_nome || 'Não informado';
        resultado[nome] = (resultado[nome] || 0) + (a.valor_total || 0);
      }
    });
    // Ordenar por valor decrescente
    return Object.fromEntries(
      Object.entries(resultado).sort((a, b) => b[1] - a[1])
    );
  };

  const dadosFiltrados = useMemo(() => aplicarFiltros(atendimentos), [atendimentos, filtroConvenio, filtroPeriodo, dataInicio, dataFim, filtroStatus]);
  
  const totalFaturado = dadosFiltrados.reduce((sum, a) => sum + (a.valor_total || 0), 0);
  const totalAtendimentos = dadosFiltrados.length;
  const ticketMedio = totalAtendimentos > 0 ? totalFaturado / totalAtendimentos : 0;
  const faturadoPorConvenioData = faturadoPorConvenio(dadosFiltrados);
  const faturadoPorPrestadorData = faturadoPorPrestador(dadosFiltrados);
  const faturadoPorProcedimentoData = faturadoPorProcedimento(dadosFiltrados);

  const gerarDadosFaturamento = () => {
    return [
      { Indicador: 'Total Faturado', Valor: `R$ ${totalFaturado.toFixed(2)}` },
      { Indicador: 'Total de Atendimentos', Valor: totalAtendimentos },
      { Indicador: 'Ticket Médio', Valor: `R$ ${ticketMedio.toFixed(2)}` },
      ...Object.entries(faturadoPorConvenioData).map(([conv, valor]) => ({
        Indicador: `Faturamento - ${conv}`,
        Valor: `R$ ${valor.toFixed(2)}`
      })),
      ...Object.entries(faturadoPorPrestadorData).map(([prest, valor]) => ({
        Indicador: `Produção - ${prest}`,
        Valor: `R$ ${valor.toFixed(2)}`
      }))
    ];
  };

  const gerarDadosProducao = () => {
    const dados = [];
    dadosFiltrados.forEach((a, idx) => {
      if (a.itens && a.itens.length > 0) {
        a.itens.forEach((item, itemIdx) => {
          dados.push({
            '#': `${idx + 1}.${itemIdx + 1}`,
            Data: item.data_execucao || a.data_atendimento || '-',
            Paciente: a.paciente_nome,
            Carteira: a.numero_carteira,
            Convênio: a.paciente_convenio_nome || '-',
            Prestador: item.prestador_nome || '-',
            Procedimento: item.nome || item.procedimento_nome || '-',
            Quantidade: item.quantidade || 1,
            'Valor Unitário': `R$ ${(item.valor_unitario || 0).toFixed(2)}`,
            'Valor Total': `R$ ${(item.valor_total || 0).toFixed(2)}`,
            Status: a.status
          });
        });
      } else {
        dados.push({
          '#': idx + 1,
          Data: a.data_atendimento || '-',
          Paciente: a.paciente_nome,
          Carteira: a.numero_carteira,
          Convênio: a.paciente_convenio_nome || '-',
          Prestador: a.prestador_nome || '-',
          Procedimento: a.procedimento_nome || '-',
          Quantidade: a.quantidade || 1,
          'Valor Unitário': `R$ ${(a.valor_unitario || 0).toFixed(2)}`,
          'Valor Total': `R$ ${(a.valor_total || 0).toFixed(2)}`,
          Status: a.status
        });
      }
    });
    return dados;
  };

  const gerarRelatorio = () => {
    if (dadosFiltrados.length === 0) {
      toast.error('Não há dados para gerar o relatório no período selecionado');
      return;
    }

    const dataAtual = format(new Date(), 'yyyyMMdd_HHmmss');
    const nomeArquivo = `relatorio_${tipoRelatorio}_${dataAtual}`;

    if (tipoRelatorio === 'faturamento') {
      const dados = gerarDadosFaturamento();
      if (formatoExportacao === 'csv') {
        exportToCSV(dados, nomeArquivo);
      } else if (formatoExportacao === 'html') {
        exportToHTML(dados, 'Relatório de Faturamento TISS', nomeArquivo);
      }
    } else if (tipoRelatorio === 'producao') {
      const dados = gerarDadosProducao();
      if (formatoExportacao === 'csv') {
        exportToCSV(dados, nomeArquivo);
      } else if (formatoExportacao === 'html') {
        exportToHTML(dados, 'Relatório de Produção TISS', nomeArquivo);
      }
    }
  };

  const imprimirRelatorio = () => {
    if (dadosFiltrados.length === 0) {
      toast.error('Não há dados para imprimir');
      return;
    }

    const printWindow = window.open('', '_blank');
    let htmlContent = `<!DOCTYPE html>
      <html>
      <head>
        <title>Relatório TISS Faturamento</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #2563eb; }
          h2 { color: #333; margin-top: 20px; }
          table { border-collapse: collapse; width: 100%; margin: 20px 0; }
          th { background-color: #2563eb; color: white; padding: 10px; text-align: left; }
          td { border: 1px solid #ddd; padding: 8px; }
          .header { text-align: center; margin-bottom: 30px; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          @media print {
            body { margin: 0; padding: 10px; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Sistema de Faturamento TISS</h1>
          <h2>${tipoRelatorio === 'faturamento' ? 'Relatório de Faturamento' : 'Relatório de Produção'}</h2>
          <p><strong>Gerado em:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Período:</strong> ${filtroPeriodo === 'personalizado' ? `${dataInicio} a ${dataFim}` : filtroPeriodo === 'hoje' ? 'Hoje' : filtroPeriodo === 'semana' ? 'Últimos 7 dias' : filtroPeriodo === 'mes' ? 'Este mês' : 'Todos os períodos'}</p>
        </div>`;

    if (tipoRelatorio === 'faturamento') {
      htmlContent += `
        <h3>Resumo Financeiro</h3>
        <table>
          <tr><th>Indicador</th><th>Valor</th></tr>
          <tr><td>Total Faturado</td><td>R$ ${totalFaturado.toFixed(2)}</td></tr>
          <tr><td>Total de Atendimentos</td><td>${totalAtendimentos}</td></tr>
          <tr><td>Ticket Médio</td><td>R$ ${ticketMedio.toFixed(2)}</td></tr>
        </table>
        
        <h3>Faturamento por Convênio</h3>
        <table>
          <tr><th>Convênio</th><th>Valor Faturado</th></tr>
          ${Object.entries(faturadoPorConvenioData).map(([conv, valor]) => `
            <tr><td>${conv}</td><td>R$ ${valor.toFixed(2)}</td></tr>
          `).join('')}
        </table>
        
        <h3>Produção por Prestador</h3>
        <table>
          <tr><th>Prestador</th><th>Valor Produzido</th></tr>
          ${Object.entries(faturadoPorPrestadorData).map(([prest, valor]) => `
            <tr><td>${prest}</td><td>R$ ${valor.toFixed(2)}</td></tr>
          `).join('')}
        </table>
      `;
    } else {
      htmlContent += `
        <table>
          <thead>
            <tr>
              <th>#</th><th>Data</th><th>Paciente</th><th>Carteira</th>
              <th>Convênio</th><th>Prestador</th><th>Procedimento</th>
              <th>Qtd</th><th>Valor</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${dadosFiltrados.map((a, idx) => {
              if (a.itens && a.itens.length > 0) {
                return a.itens.map((item, itemIdx) => `
                  <tr>
                    <td>${idx + 1}.${itemIdx + 1}</td>
                    <td>${item.data_execucao || a.data_atendimento || '-'}</td>
                    <td>${a.paciente_nome}</td>
                    <td>${a.numero_carteira}</td>
                    <td>${a.paciente_convenio_nome || '-'}</td>
                    <td>${item.prestador_nome || '-'}</td>
                    <td>${item.nome || item.procedimento_nome || '-'}</td>
                    <td>${item.quantidade || 1}</td>
                    <td>R$ ${(item.valor_total || 0).toFixed(2)}</td>
                    <td>${a.status === 'faturado' ? 'Faturado' : 'Pendente'}</td>
                  </tr>
                `).join('');
              } else {
                return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${a.data_atendimento || '-'}</td>
                    <td>${a.paciente_nome}</td>
                    <td>${a.numero_carteira}</td>
                    <td>${a.paciente_convenio_nome || '-'}</td>
                    <td>${a.prestador_nome || '-'}</td>
                    <td>${a.procedimento_nome || '-'}</td>
                    <td>${a.quantidade || 1}</td>
                    <td>R$ ${(a.valor_total || 0).toFixed(2)}</td>
                    <td>${a.status === 'faturado' ? 'Faturado' : 'Pendente'}</td>
                  </tr>
                `;
              }
            }).join('')}
          </tbody>
        </table>
      `;
    }

    htmlContent += `
        <div class="footer">
          <p>Sistema de Faturamento TISS - Relatório gerado automaticamente</p>
        </div>
        <script>window.onload = function() { window.print(); };</script>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Relatórios
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Análise de faturamento e produção do sistema
            </p>
          </div>
          <button
            onClick={carregarDados}
            className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Recarregar
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Status</label>
              <select 
                value={filtroStatus} 
                onChange={(e) => setFiltroStatus(e.target.value)} 
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              >
                <option value="todos">Todos os status</option>
                <option value="pendente">Pendentes</option>
                <option value="faturado">Faturados</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Convênio</label>
              <select 
                value={filtroConvenio} 
                onChange={(e) => setFiltroConvenio(e.target.value)} 
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              >
                <option value="todos">Todos os convênios</option>
                {convenios.map(c => (
                  <option key={c.id} value={c.id}>{c.razao_social}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Período</label>
              <select 
                value={filtroPeriodo} 
                onChange={(e) => setFiltroPeriodo(e.target.value)} 
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              >
                <option value="todos">Todos os períodos</option>
                <option value="hoje">Hoje</option>
                <option value="semana">Últimos 7 dias</option>
                <option value="mes">Este mês</option>
                <option value="personalizado">Personalizado</option>
              </select>
            </div>
            {filtroPeriodo === 'personalizado' && (
              <>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Data Início</label>
                  <input 
                    type="date" 
                    value={dataInicio} 
                    onChange={(e) => setDataInicio(e.target.value)} 
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Data Fim</label>
                  <input 
                    type="date" 
                    value={dataFim} 
                    onChange={(e) => setDataFim(e.target.value)} 
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Cards resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Faturado</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">R$ {totalFaturado.toFixed(2)}</p>
              </div>
              <CurrencyDollarIcon className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Atendimentos</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalAtendimentos}</p>
              </div>
              <ClipboardDocumentListIcon className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Ticket Médio</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">R$ {ticketMedio.toFixed(2)}</p>
              </div>
              <ChartBarIcon className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Convênios</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{Object.keys(faturadoPorConvenioData).length}</p>
              </div>
              <BuildingOfficeIcon className="w-8 h-8 text-orange-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Tipo de Relatório e Formato */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Relatório</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  value="faturamento" 
                  checked={tipoRelatorio === 'faturamento'} 
                  onChange={(e) => setTipoRelatorio(e.target.value)} 
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Faturamento</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  value="producao" 
                  checked={tipoRelatorio === 'producao'} 
                  onChange={(e) => setTipoRelatorio(e.target.value)} 
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Produção Detalhada</span>
              </label>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Formato de Exportação</label>
            <div className="flex gap-4 flex-wrap">
              <label className="flex items-center gap-1 cursor-pointer">
                <input 
                  type="radio" 
                  value="csv" 
                  checked={formatoExportacao === 'csv'} 
                  onChange={(e) => setFormatoExportacao(e.target.value)} 
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">CSV</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input 
                  type="radio" 
                  value="html" 
                  checked={formatoExportacao === 'html'} 
                  onChange={(e) => setFormatoExportacao(e.target.value)} 
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">HTML</span>
              </label>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button 
            onClick={gerarRelatorio} 
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 rounded-xl text-sm hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            Exportar Relatório ({formatoExportacao.toUpperCase()})
          </button>

          <button 
            onClick={imprimirRelatorio} 
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl text-sm hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
          >
            <PrinterIcon className="w-5 h-5" />
            Imprimir Relatório
          </button>
        </div>

        {/* Preview do relatório */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <h3 className="font-semibold text-gray-800 dark:text-white">Preview do Relatório</h3>
          </div>
          <div className="overflow-x-auto p-4">
            {dadosFiltrados.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 dark:text-gray-500">
                  <ChartBarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Nenhum dado encontrado para o período selecionado</p>
                </div>
              </div>
            ) : tipoRelatorio === 'faturamento' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Faturado</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">R$ {totalFaturado.toFixed(2)}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Atendimentos</p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{totalAtendimentos}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Ticket Médio</p>
                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400">R$ {ticketMedio.toFixed(2)}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-2 text-gray-700 dark:text-gray-300">Faturamento por Convênio</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {Object.entries(faturadoPorConvenioData).map(([conv, valor]) => (
                      <div key={conv} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{conv}</span>
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">R$ {valor.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2 text-gray-700 dark:text-gray-300">Produção por Prestador</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {Object.entries(faturadoPorPrestadorData).slice(0, 10).map(([prest, valor]) => (
                      <div key={prest} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{prest}</span>
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">R$ {valor.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Paciente</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Convênio</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Prestador</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Procedimento</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {dadosFiltrados.slice(0, 10).map((a) => {
                      const primeiroItem = a.itens && a.itens.length > 0 ? a.itens[0] : null;
                      return (
                        <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                            {primeiroItem?.data_execucao || a.data_atendimento || '-'}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-800 dark:text-gray-200">{a.paciente_nome}</td>
                          <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{a.paciente_convenio_nome || '-'}</td>
                          <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{primeiroItem?.prestador_nome || a.prestador_nome || '-'}</td>
                          <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{primeiroItem?.nome || a.procedimento_nome || '-'}</td>
                          <td className="px-3 py-2 text-xs text-right font-semibold text-gray-700 dark:text-gray-300">
                            R$ {(primeiroItem?.valor_total || a.valor_total || 0).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              a.status === 'faturado' 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            }`}>
                              {a.status === 'faturado' ? 'Faturado' : 'Pendente'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {dadosFiltrados.length > 10 && (
                  <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                    + {dadosFiltrados.length - 10} registros. Exporte o relatório completo.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
