// src/components/ImpressaoContaFaturada.jsx
import { format } from 'date-fns';
import { formatDateOnly, parseDateWithoutTimezone } from '../lib/dateUtils';

/* =========================================================
   CONSTANTES
========================================================= */

const STATUS_MAP = {
  'pendente': 'Aguardando Pagamento',
  'parcial': 'Parcialmente Pago',
  'pago': 'Pago',
  'cancelado': 'Cancelado',
  'faturado': 'Faturado',
  'finalizado': 'Finalizado'
};

/* =========================================================
   HELPERS
========================================================= */

const formatarData = (data) => {
  if (!data) return '';
  try {
    return format(parseDateWithoutTimezone(data), 'dd/MM/yyyy HH:mm');
  } catch {
    return data;
  }
};

const formatarDataSimples = (data) => {
  if (!data) return '';
  try {
    return formatDateOnly(data);
  } catch {
    return data;
  }
};

const moeda = (v) =>
  Number(v || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

/* =========================================================
   CSS
========================================================= */

const gerarCSS = () => `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Inter, Arial, Helvetica, sans-serif;
  background: #f1f5f9;
  color: #172033;
  font-size: 9.5pt;
}

.conta-page {
  width: 210mm;
  min-height: 297mm;
  padding: 10mm;
  margin: 0 auto;
  background: #FFF;
  page-break-after: always;
}

.conta-page:last-child {
  page-break-after: auto;
}

.document-table, .document-table > thead > tr > td, .document-table > tbody > tr > td {
  width: 100%;
  border: 0;
  padding: 0;
}

.document-table > thead { display: table-header-group; }
.document-table > tbody { display: table-row-group; }

/* CABEÇALHO */
.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10mm;
  padding-bottom: 5mm;
  align-items: center;
  border-bottom: 3px solid #1d4ed8;
}

.logo-area {
  width: 30%;
}

.logo {
  max-width: 100px;
  max-height: 60px;
  object-fit: contain;
  margin-bottom: 5px;
}

.titulo-area {
  text-align: center;
  width: 40%;
}

.titulo-principal {
  font-size: 15pt;
  font-weight: bold;
  color: #172554;
  margin-bottom: 5px;
}

.subtitulo {
  font-size: 10pt;
  color: #555;
}

.numero-area {
  text-align: right;
  width: 30%;
}

.numero-conta {
  font-size: 14pt;
  font-weight: bold;
  font-family: monospace;
}

.status-pill {
  display: inline-block;
  margin-top: 6px;
  padding: 4px 8px;
  border-radius: 999px;
  background: #dbeafe;
  color: #1e40af;
  font-size: 7.5pt;
  font-weight: bold;
}

/* INFORMAÇÕES DA CONTA */
.info-card {
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 5mm;
}

.info-header {
  background: #eff6ff;
  color: #1e3a8a;
  padding: 7px 10px;
  font-weight: bold;
  font-size: 11pt;
  border-bottom: 1px solid #dbe3ef;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
}

.info-item {
  padding: 6px 8px;
  border-right: 1px solid #e8edf5;
  border-bottom: 1px solid #e8edf5;
}

.info-item:nth-child(3n) {
  border-right: none;
}

.info-label {
  font-size: 7pt;
  color: #666;
  margin-bottom: 2px;
}

.info-valor {
  font-size: 10pt;
  font-weight: bold;
}

/* TABELA DE ITENS */
.table-container {
  margin-bottom: 8mm;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 8pt;
}

th, td {
  border: 1px solid #dbe3ef;
  padding: 6px 4px;
  vertical-align: top;
}

th {
  background: #172554;
  color: #fff;
  font-weight: bold;
  text-align: center;
}

tbody tr:nth-child(even) { background: #f8fafc; }

td {
  text-align: left;
}

.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

/* RESUMO FINANCEIRO */
.resumo-financeiro {
  margin-bottom: 8mm;
  display: flex;
  justify-content: flex-end;
}

.resumo-table {
  width: 50%;
  min-width: 200px;
}

.resumo-table tr:last-child { background: #172554; color: white; }

.resumo-table td {
  padding: 4px 8px;
}

.resumo-table tr:last-child td {
  font-weight: bold;
  border-top: 2px solid #000;
}

/* INFORMAÇÕES DO CONTRATADO */
.contratado-box {
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 5mm;
}

.contratado-header {
  background: #eff6ff;
  color: #1e3a8a;
  padding: 4px 8px;
  font-weight: bold;
  border-bottom: 1px solid #000;
}

.contratado-content {
  padding: 8px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

/* OBSERVAÇÕES */
.observacao-box {
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 8mm;
}

.observacao-header {
  background: #f8fafc;
  padding: 4px 8px;
  font-weight: bold;
  border-bottom: 1px solid #000;
}

.observacao-content {
  padding: 8px;
  min-height: 40px;
}

/* RODAPÉ */
.footer {
  margin-top: 10mm;
  padding-top: 5mm;
  border-top: 1px solid #ccc;
  text-align: center;
  font-size: 7pt;
  color: #666;
}

.page-counter::after {
  content: "Página " counter(page) " de " counter(pages);
}

@page {
  size: A4;
  margin: 5mm;
  @bottom-right {
    content: "Página " counter(page) " de " counter(pages);
    font: 7pt Arial, sans-serif;
    color: #64748b;
  }
}

@media print {
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  th { background: #172554 !important; color: #fff !important; }
  .info-header, .contratado-header { background: #eff6ff !important; }
  .observacao-header { background: #f8fafc !important; }
}
`;

/* =========================================================
   GERAR HTML DA CONTA FATURADA (SIMPLIFICADA)
========================================================= */

export const gerarHTMLContaFaturada = (dados) => {
  const {
    numero_conta = '',
    data_emissao = new Date(),
    status = 'faturado',
    
    // Dados do paciente/beneficiário
    paciente = {},
    
    // Dados do convênio
    convenio = {},

    // Dados de autorização da guia
    autorizacao = {},
    
    // Dados da clínica/prestador
    clinica = {},
    
    // Itens da conta
    itens = [],
    
    // Resumo financeiro
    subtotal = 0,
    desconto = 0,
    acrescimo = 0,
    total_geral = 0,
    
    // Observações
    observacoes = '',
    
    // Logotipo
    logo_base64 = ''
  } = dados;

  const cabecalho = `
    <div class="header">
      <div class="logo-area">
        ${logo_base64
          ? `<img src="${logo_base64}" alt="Logo" class="logo" />`
          : `<div style="font-size:10pt; font-weight:bold;">${clinica.nome_empresa || ''}</div>`
        }
        <div style="font-size:7pt;">CNPJ: ${clinica.cnpj || ''}</div>
        <div style="font-size:7pt;">CNES: ${clinica.cnes || ''}</div>
      </div>
      <div class="titulo-area">
        <div class="titulo-principal">CONTA FATURADA / ESPELHO DA CONTA</div>
        <div class="subtitulo">Demonstrativo de Serviços Prestados</div>
      </div>
      <div class="numero-area">
        <div class="numero-conta">Nº ${numero_conta}</div>
        <div style="font-size:8pt; margin-top:5px;">Emissão: ${formatarDataSimples(data_emissao)}</div>
        <span class="status-pill">${STATUS_MAP[status] || status}</span>
      </div>
    </div>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Conta Faturada - ${numero_conta}</title>
  <style>${gerarCSS()}</style>
</head>
<body>
<div class="conta-page">
<table class="document-table">
  <thead><tr><td>${cabecalho}</td></tr></thead>
  <tbody><tr><td>

  <!-- DADOS DO BENEFICIÁRIO -->
  <div class="info-card">
    <div class="info-header">DADOS DO BENEFICIÁRIO</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Nome do Paciente</div>
        <div class="info-valor">${paciente.nome || '-'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Nº Carteira</div>
        <div class="info-valor">${paciente.numero_carteira || '-'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">CPF</div>
        <div class="info-valor">${paciente.cpf || '-'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Data Nascimento</div>
        <div class="info-valor">${paciente.data_nascimento ? formatarDataSimples(paciente.data_nascimento) : '-'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Convênio</div>
        <div class="info-valor">${convenio.razao_social || 'Particular'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Registro ANS</div>
        <div class="info-valor">${convenio.registro_ans || '-'}</div>
      </div>
    </div>
  </div>

  <!-- DADOS DA AUTORIZAÇÃO -->
  <div class="info-card">
    <div class="info-header">DADOS DA AUTORIZAÇÃO</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Nº Guia Prestador</div>
        <div class="info-valor">${autorizacao.numero_guia_prestador || numero_conta || '-'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Nº Guia Operadora</div>
        <div class="info-valor">${autorizacao.numero_guia_operadora || '-'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Senha Autorização</div>
        <div class="info-valor">${autorizacao.senha_autorizacao || '-'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Data Autorização</div>
        <div class="info-valor">${autorizacao.data_autorizacao ? formatarDataSimples(autorizacao.data_autorizacao) : '-'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Validade da Senha</div>
        <div class="info-valor">${autorizacao.data_validade_senha ? formatarDataSimples(autorizacao.data_validade_senha) : '-'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Status Autorização</div>
        <div class="info-valor">${autorizacao.status_autorizacao || '-'}</div>
      </div>
    </div>
  </div>

  <!-- DADOS DO CONTRATADO (CLÍNICA) -->
  <div class="contratado-box">
    <div class="contratado-header">DADOS DO CONTRATADO</div>
    <div class="contratado-content">
      <div><strong>Nome:</strong> ${clinica.nome_contratado || clinica.nome_empresa || '-'}</div>
      <div><strong>CNPJ:</strong> ${clinica.cnpj || '-'}</div>
      <div><strong>Código Prestador:</strong> ${convenio.codigo_prestador || '-'}</div>
      <div><strong>CNES:</strong> ${clinica.cnes || convenio.cnes || '-'}</div>
      <div><strong>Endereço:</strong> ${clinica.endereco || '-'}</div>
      <div><strong>Cidade/UF:</strong> ${[clinica.cidade, clinica.uf].filter(Boolean).join(' / ') || '-'}</div>
      <div><strong>Telefone:</strong> ${clinica.telefone || '-'}</div>
      <div><strong>E-mail:</strong> ${clinica.email || '-'}</div>
    </div>
  </div>

  <!-- ITENS DA CONTA -->
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th width="5%">Seq</th>
          <th width="12%">Data Execução</th>
          <th width="12%">Código</th>
          <th width="25%">Descrição</th>
          <th width="13%">Profissional</th>
          <th width="8%">Qtd</th>
          <th width="12%">Valor Unit.</th>
          <th width="13%">Valor Total</th>
        </tr>
      </thead>
      <tbody>
        ${itens.map((item, idx) => `
          <tr>
            <td class="text-center">${idx + 1}</td>
            <td class="text-center">${formatarDataSimples(item.data_execucao) || '-'}</td>
            <td class="text-center">${item.codigo || '-'}</td>
            <td>${item.nome || '-'}</td>
            <td>${item.prestador_nome || '-'}</td>
            <td class="text-center">${item.quantidade || 1}</td>
            <td class="text-right">R$ ${moeda(item.valor_unitario)}</td>
            <td class="text-right">R$ ${moeda(item.valor_total)}</td>
          </tr>
        `).join('')}
        ${itens.length === 0 ? `
          <tr>
            <td colspan="8" style="text-align:center; padding:20px;">Nenhum item encontrado</td>
          </tr>
        ` : ''}
      </tbody>
    </table>
  </div>

  <!-- RESUMO FINANCEIRO -->
  <div class="resumo-financeiro">
    <table class="resumo-table">
      <tr>
        <td>Subtotal:</td>
        <td class="text-right">R$ ${moeda(subtotal)}</td>
      </tr>
      ${desconto > 0 ? `
      <tr>
        <td>Desconto(s):</td>
        <td class="text-right">- R$ ${moeda(desconto)}</td>
      </tr>
      ` : ''}
      ${acrescimo > 0 ? `
      <tr>
        <td>Acréscimo(s):</td>
        <td class="text-right">+ R$ ${moeda(acrescimo)}</td>
      </tr>
      ` : ''}
      <tr style="border-top:2px solid #000;">
        <td><strong>TOTAL GERAL</strong></td>
        <td class="text-right"><strong>R$ ${moeda(total_geral)}</strong></td>
      </tr>
    </table>
  </div>

  <!-- OBSERVAÇÕES -->
  ${observacoes ? `
  <div class="observacao-box">
    <div class="observacao-header">OBSERVAÇÕES</div>
    <div class="observacao-content">
      ${observacoes}
    </div>
  </div>
  ` : ''}

  <!-- RODAPÉ -->
  <div class="footer">
    <div>Documento emitido eletronicamente - Sistema de Faturamento TISS</div>
    <div>Emissão: ${formatarData(data_emissao)}</div>
    <div class="page-counter"></div>
  </div>
  </td></tr></tbody>
</table>
</div>
</body>
</html>`;
};

/* =========================================================
   IMPRIMIR CONTA FATURADA
========================================================= */

export const imprimirContaFaturada = (dados) => {
  const html = gerarHTMLContaFaturada(dados);
  
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) {
    alert('Permita popups para imprimir.');
    return;
  }
  
  win.document.write(html);
  win.document.close();
  win.focus();
  
  win.onload = () => {
    win.print();
    win.onafterprint = () => {
      win.close();
    };
  };
};

/* =========================================================
   IMPRIMIR MÚLTIPLAS CONTAS
========================================================= */

export const imprimirMultiplasContas = (contas) => {
  if (!contas?.length) {
    alert('Nenhuma conta para imprimir.');
    return;
  }
  
  let htmlFinal = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>${gerarCSS()}</style></head><body>`;
  
  contas.forEach((conta, idx) => {
    const html = gerarHTMLContaFaturada(conta);
    const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (match?.[1]) {
      htmlFinal += match[1];
      if (idx < contas.length - 1) {
        htmlFinal += '<div style="page-break-before: always;"></div>';
      }
    }
  });
  
  htmlFinal += `</body></html>`;
  
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) {
    alert('Permita popups para imprimir.');
    return;
  }
  
  win.document.write(htmlFinal);
  win.document.close();
  win.focus();
  
  win.onload = () => {
    win.print();
    win.onafterprint = () => {
      win.close();
    };
  };
};
