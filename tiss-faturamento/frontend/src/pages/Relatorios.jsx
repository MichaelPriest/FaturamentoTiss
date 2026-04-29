import { useState, useEffect } from 'react';
import { 
  DocumentArrowDownIcon, ChartBarIcon, 
  TableCellsIcon, DocumentTextIcon, 
  PrinterIcon, CalendarIcon,
  BuildingOfficeIcon, CurrencyDollarIcon,
  UserGroupIcon, ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

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
  const [prestadores, setPrestadores] = useState([]);
  const [procedimentos, setProcedimentos] = useState([]);
  const [filtroConvenio, setFiltroConvenio] = useState('todos');
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [tipoRelatorio, setTipoRelatorio] = useState('faturamento');
  const [formatoExportacao, setFormatoExportacao] = useState('csv');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = () => {
    const storedAtendimentos = localStorage.getItem('atendimentos');
    const storedConvenios = localStorage.getItem('convenios');
    const storedPrestadores = localStorage.getItem('prestadores');
    const storedProcedimentos = localStorage.getItem('procedimentos');
    
    if (storedAtendimentos) setAtendimentos(JSON.parse(storedAtendimentos));
    if (storedConvenios) setConvenios(JSON.parse(storedConvenios));
    if (storedPrestadores) setPrestadores(JSON.parse(storedPrestadores));
    if (storedProcedimentos) setProcedimentos(JSON.parse(storedProcedimentos));
  };

  const aplicarFiltros = (dados) => {
    let filtrados = [...dados];
    
    // Filtro por convênio
    if (filtroConvenio !== 'todos') {
      filtrados = filtrados.filter(a => a.paciente_convenio_id === parseInt(filtroConvenio));
    }
    
    // Filtro por período
    if (filtroPeriodo !== 'todos') {
      const hoje = new Date();
      const inicio = new Date();
      
      switch(filtroPeriodo) {
        case 'hoje':
          inicio.setHours(0, 0, 0, 0);
          filtrados = filtrados.filter(a => new Date(a.data_atendimento) >= inicio);
          break;
        case 'semana':
          inicio.setDate(hoje.getDate() - 7);
          filtrados = filtrados.filter(a => new Date(a.data_atendimento) >= inicio);
          break;
        case 'mes':
          filtrados = filtrados.filter(a => new Date(a.data_atendimento) >= startOfMonth(hoje));
          break;
        case 'personalizado':
          if (dataInicio && dataFim) {
            filtrados = filtrados.filter(a => 
              new Date(a.data_atendimento) >= new Date(dataInicio) && 
              new Date(a.data_atendimento) <= new Date(dataFim)
            );
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
    return resultado;
  };

  const faturadoPorPrestador = (dados) => {
    const resultado = {};
    dados.forEach(a => {
      const nome = a.prestador_nome || 'Não informado';
      resultado[nome] = (resultado[nome] || 0) + (a.valor_total || 0);
    });
    return resultado;
  };

  const faturadoPorProcedimento = (dados) => {
    const resultado = {};
    dados.forEach(a => {
      const nome = a.procedimento_nome || 'Não informado';
      resultado[nome] = (resultado[nome] || 0) + (a.valor_total || 0);
    });
    return resultado;
  };

  const dadosFiltrados = aplicarFiltros(atendimentos);
  
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
    return dadosFiltrados.map((a, idx) => ({
      '#': idx + 1,
      Data: a.data_atendimento,
      Paciente: a.paciente_nome,
      Carteira: a.numero_carteira,
      Convênio: a.paciente_convenio_nome || '-',
      Prestador: a.prestador_nome,
      Procedimento: a.procedimento_nome,
      Quantidade: a.quantidade || 1,
      'Valor Unitário': `R$ ${(a.valor_unitario || 0).toFixed(2)}`,
      'Valor Total': `R$ ${(a.valor_total || 0).toFixed(2)}`,
      Status: a.status
    }));
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
    let htmlContent = `
      <!DOCTYPE html>
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
          <p><strong>Período:</strong> ${filtroPeriodo === 'personalizado' ? `${dataInicio} a ${dataFim}` : filtroPeriodo}</p>
        </div>
    `;

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
          <td><th>Prestador</th><th>Valor Produzido</th></tr>
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
              <th>Qtd</th><th>Valor</th>
            </tr>
          </thead>
          <tbody>
            ${dadosFiltrados.map((a, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${a.data_atendimento}</td>
                <td>${a.paciente_nome}</td>
                <td>${a.numero_carteira}</td>
                <td>${a.paciente_convenio_nome || '-'}</td>
                <td>${a.prestador_nome}</td>
                <td>${a.procedimento_nome}</td>
                <td>${a.quantidade || 1}</td>
                <td>R$ ${(a.valor_total || 0).toFixed(2)}</td>
              </tr>
            `).join('')}
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

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Relatórios</h2>

      {/* Filtros */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Convênio</label>
            <select 
              value={filtroConvenio} 
              onChange={(e) => setFiltroConvenio(e.target.value)} 
              className="w-full border rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="todos">Todos os convênios</option>
              {convenios.map(c => (
                <option key={c.id} value={c.id}>{c.razao_social}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Período</label>
            <select 
              value={filtroPeriodo} 
              onChange={(e) => setFiltroPeriodo(e.target.value)} 
              className="w-full border rounded-lg px-3 py-1.5 text-sm"
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
                <label className="block text-xs text-gray-500 mb-1">Data Início</label>
                <input 
                  type="date" 
                  value={dataInicio} 
                  onChange={(e) => setDataInicio(e.target.value)} 
                  className="w-full border rounded-lg px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Data Fim</label>
                <input 
                  type="date" 
                  value={dataFim} 
                  onChange={(e) => setDataFim(e.target.value)} 
                  className="w-full border rounded-lg px-3 py-1.5 text-sm"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Faturado</p>
              <p className="text-2xl font-bold text-green-600">R$ {totalFaturado.toFixed(2)}</p>
            </div>
            <CurrencyDollarIcon className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Atendimentos</p>
              <p className="text-2xl font-bold text-blue-600">{totalAtendimentos}</p>
            </div>
            <ClipboardDocumentListIcon className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Ticket Médio</p>
              <p className="text-2xl font-bold text-purple-600">R$ {ticketMedio.toFixed(2)}</p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-purple-200" />
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Convênios</p>
              <p className="text-2xl font-bold text-orange-600">{Object.keys(faturadoPorConvenioData).length}</p>
            </div>
            <BuildingOfficeIcon className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Tipo de Relatório e Formato */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Relatório</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input 
                type="radio" 
                value="faturamento" 
                checked={tipoRelatorio === 'faturamento'} 
                onChange={(e) => setTipoRelatorio(e.target.value)} 
                className="w-4 h-4"
              />
              <span className="text-sm">Faturamento</span>
            </label>
            <label className="flex items-center gap-2">
              <input 
                type="radio" 
                value="producao" 
                checked={tipoRelatorio === 'producao'} 
                onChange={(e) => setTipoRelatorio(e.target.value)} 
                className="w-4 h-4"
              />
              <span className="text-sm">Produção Detalhada</span>
            </label>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Formato de Exportação</label>
          <div className="flex gap-4 flex-wrap">
            <label className="flex items-center gap-1">
              <input 
                type="radio" 
                value="csv" 
                checked={formatoExportacao === 'csv'} 
                onChange={(e) => setFormatoExportacao(e.target.value)} 
                className="w-4 h-4"
              />
              <span className="text-sm">CSV</span>
            </label>
            <label className="flex items-center gap-1">
              <input 
                type="radio" 
                value="html" 
                checked={formatoExportacao === 'html'} 
                onChange={(e) => setFormatoExportacao(e.target.value)} 
                className="w-4 h-4"
              />
              <span className="text-sm">HTML</span>
            </label>
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <ChartBarIcon className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold">Exportar Relatório</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">Exportar dados nos formatos CSV ou HTML</p>
          <button 
            onClick={gerarRelatorio} 
            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition-colors w-full flex items-center justify-center gap-2"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
            Exportar ({formatoExportacao.toUpperCase()})
          </button>
        </div>

        <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <PrinterIcon className="w-6 h-6 text-green-600" />
            <h3 className="font-semibold">Imprimir Relatório</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">Visualizar e imprimir relatório formatado</p>
          <button 
            onClick={imprimirRelatorio} 
            className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-700 transition-colors w-full flex items-center justify-center gap-2"
          >
            <PrinterIcon className="w-4 h-4" />
            Imprimir
          </button>
        </div>

        <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <TableCellsIcon className="w-6 h-6 text-purple-600" />
            <h3 className="font-semibold">Dados em Tela</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            {totalAtendimentos} registros encontrados
          </p>
          <div className="text-sm text-gray-600">
            <p>• {Object.keys(faturadoPorConvenioData).length} convênios</p>
            <p>• {Object.keys(faturadoPorPrestadorData).length} prestadores</p>
          </div>
        </div>
      </div>

      {/* Preview do relatório */}
      <div className="mt-6 bg-white rounded-lg border overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-800">Preview do Relatório</h3>
        </div>
        <div className="overflow-x-auto p-4">
          {tipoRelatorio === 'faturamento' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Total Faturado</p>
                  <p className="text-lg font-bold text-green-600">R$ {totalFaturado.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Atendimentos</p>
                  <p className="text-lg font-bold text-blue-600">{totalAtendimentos}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Ticket Médio</p>
                  <p className="text-lg font-bold text-purple-600">R$ {ticketMedio.toFixed(2)}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2">Faturamento por Convênio</h4>
                <div className="space-y-2">
                  {Object.entries(faturadoPorConvenioData).map(([conv, valor]) => (
                    <div key={conv} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">{conv}</span>
                      <span className="text-sm font-semibold text-green-600">R$ {valor.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">Data</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">Paciente</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">Convênio</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">Procedimento</th>
                    <th className="px-3 py-2 text-right text-xs text-gray-500">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {dadosFiltrados.slice(0, 10).map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-xs">{a.data_atendimento}</td>
                      <td className="px-3 py-2 text-xs">{a.paciente_nome}</td>
                      <td className="px-3 py-2 text-xs">{a.paciente_convenio_nome || '-'}</td>
                      <td className="px-3 py-2 text-xs">{a.procedimento_nome}</td>
                      <td className="px-3 py-2 text-xs text-right">R$ {a.valor_total?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {dadosFiltrados.length > 10 && (
                <p className="text-center text-xs text-gray-500 mt-2">
                  + {dadosFiltrados.length - 10} registros
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
