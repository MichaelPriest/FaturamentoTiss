// src/components/ImpressaoGuiaTISS.jsx
import React from 'react';
import { format } from 'date-fns';

// Mapeamento de códigos para labels
const TIPO_ATENDIMENTO_MAP = {
  '01': 'Remoção',
  '02': 'Pequena Cirurgia',
  '03': 'Outras Terapias',
  '04': 'Consulta',
  '08': 'Quimioterapia',
  '09': 'Radioterapia',
  '10': 'Terapia Renal Substitutiva (TRS)',
  '13': 'Pequenos atendimentos',
  '23': 'Exame'
};

const INDICADOR_ACIDENTE_MAP = {
  '0': 'Acidente de Trabalho',
  '1': 'Acidente de Trânsito',
  '2': 'Outros Acidentes',
  '9': 'Não Acidente'
};

const TIPO_CONSULTA_MAP = {
  '1': 'Primeira Consulta',
  '2': 'Seguimento',
  '3': 'Pré-Natal',
  '4': 'Cura/Última Consulta'
};

const MOTIVO_ENCERRAMENTO_MAP = {
  '11': 'Alta Curado',
  '12': 'Alta Melhorado',
  '14': 'Alta a Pedido',
  '31': 'Transferido',
  '41': 'Óbito'
};

const GRAU_PARTICIPACAO_MAP = {
  '00': 'Cirurgião',
  '01': '1º Auxiliar',
  '02': '2º Auxiliar',
  '03': '3º Auxiliar',
  '04': '4º Auxiliar',
  '05': 'Instrumentador',
  '06': 'Anestesista',
  '07': 'Auxiliar de Anestesista',
  '12': 'Clínico',
  '13': 'Intensivista'
};

const CONSELHO_MAP = {
  '06': 'CRM',
  '08': 'CRO',
  '03': 'CRF',
  '02': 'COREN',
  '05': 'CREFITO',
  '09': 'CRP',
  '07': 'CRN'
};

const VIA_ACESSO_MAP = {
  '1': 'Única',
  '2': 'Mesma Via',
  '3': 'Diferentes Vias'
};

const TECNICA_MAP = {
  '1': 'Convencional',
  '2': 'Vídeo',
  '3': 'Robótica'
};

// Divide os itens em múltiplas páginas
const dividirEmPaginas = (itens) => {
  const MAX_PROCEDIMENTOS_POR_PAGINA = 7;
  const paginas = [];
  
  for (let i = 0; i < itens.length; i += MAX_PROCEDIMENTOS_POR_PAGINA) {
    paginas.push({
      numero_pagina: paginas.length + 1,
      itens: itens.slice(i, i + MAX_PROCEDIMENTOS_POR_PAGINA),
      total_paginas: Math.ceil(itens.length / MAX_PROCEDIMENTOS_POR_PAGINA)
    });
  }
  
  if (paginas.length === 0) {
    paginas.push({
      numero_pagina: 1,
      itens: [],
      total_paginas: 1
    });
  }
  
  return paginas;
};

// Gera o CSS para impressão A4 paisagem
const gerarCSS = () => {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      background: white;
      margin: 0;
      padding: 0;
    }
    
    /* Container para impressão */
    .print-container {
      width: 100%;
      background: white;
    }
    
    /* Cada página da guia */
    .guia-page {
      width: 297mm;
      min-height: 210mm;
      margin: 0 auto;
      background: white;
      position: relative;
      page-break-after: always;
      break-after: page;
      box-shadow: 0 0 5px rgba(0,0,0,0.1);
    }
    
    .guia-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    
    .guia-container {
      width: 100%;
      height: 100%;
      padding: 8mm;
      background: white;
    }
    
    /* Grid System */
    .grid {
      display: grid;
      gap: 0;
      width: 100%;
    }
    
    .grid-2 { grid-template-columns: repeat(2, 1fr); }
    .grid-3 { grid-template-columns: repeat(3, 1fr); }
    .grid-4 { grid-template-columns: repeat(4, 1fr); }
    .grid-5 { grid-template-columns: repeat(5, 1fr); }
    .grid-6 { grid-template-columns: repeat(6, 1fr); }
    .grid-8 { grid-template-columns: repeat(8, 1fr); }
    
    .titulo-principal {
      font-size: 11pt;
      font-weight: bold;
      text-align: center;
      text-transform: uppercase;
      line-height: 1.3;
    }
    
    .titulo-secao {
      font-size: 9pt;
      font-weight: bold;
      background: #e0e0e0;
      padding: 4px 6px;
      margin-top: 6px;
      margin-bottom: 0;
      border: 1px solid #000;
      border-bottom: none;
    }
    
    .campo {
      padding: 4px 6px;
      border: 1px solid #000;
      font-size: 8pt;
      line-height: 1.3;
      word-break: break-word;
    }
    
    .numero-campo {
      font-size: 6pt;
      font-weight: bold;
      margin-right: 4px;
    }
    
    .tabela-wrapper {
      overflow-x: auto;
      margin: 0;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7pt;
    }
    
    th, td {
      border: 1px solid #000;
      padding: 3px 4px;
      vertical-align: top;
    }
    
    th {
      background: #e8e8e8;
      font-weight: bold;
      text-align: center;
    }
    
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    
    .assinatura {
      display: flex;
      justify-content: space-between;
      margin-top: 15px;
      gap: 20px;
    }
    
    .assinatura-item {
      text-align: center;
      flex: 1;
      font-size: 7pt;
    }
    
    .linha-assinatura {
      border-top: 1px solid #000;
      padding-top: 4px;
      margin-top: 25px;
      margin-bottom: 5px;
    }
    
    .rodape {
      margin-top: 10px;
      padding-top: 5px;
      border-top: 1px solid #ccc;
      font-size: 6pt;
      text-align: center;
    }
    
    .continuacao {
      margin-top: 20px;
    }
    
    .pagina-info {
      font-size: 8pt;
      margin-top: 3px;
      color: #333;
      font-weight: normal;
    }
    
    .aviso-continuacao {
      background: #ffffcc;
      text-align: center;
      padding: 8px;
      border: 1px solid #000;
      font-size: 9pt;
      font-weight: bold;
    }
    
    /* Configuração específica para impressão */
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      
      .guia-page {
        margin: 0;
        padding: 0;
        box-shadow: none;
        page-break-after: always;
      }
      
      .guia-container {
        padding: 10mm;
      }
      
      th, .titulo-secao { 
        background: #e8e8e8 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      @page {
        size: A4 landscape;
        margin: 0;
      }
    }
  `;
};

// Gera o HTML de uma única página
const gerarPaginaGuia = (atendimento, convenio, configClinica, paginaAtual, totalPaginas, itensPagina) => {
  const totalTodosItens = (atendimento.itens || []).reduce((sum, item) => sum + (item.valor_total || 0), 0);
  const numeroGuiaOriginal = atendimento.numero_guia_prestador || '1000000';
  const ehUltimaPagina = paginaAtual === totalPaginas;

  return `
    <div class="guia-page">
      <div class="guia-container">
        <!-- CABEÇALHO -->
        <div class="grid grid-3" style="margin-bottom: 6px;">
          <div class="campo">
            <div style="font-size: 8pt; font-weight: bold;">${configClinica.nome_empresa || '_________________________'}</div>
            <div style="font-size: 7pt;">CNPJ: ${configClinica.cnpj || '______________'}</div>
            <div style="font-size: 7pt;">CNES: ${configClinica.cnes || '_______'}</div>
          </div>
          <div class="campo text-center">
            <div class="titulo-principal">GUIA DE SERVIÇO PROFISSIONAL /</div>
            <div class="titulo-principal">SERVIÇO AUXILIAR DE DIAGNÓSTICO E TERAPIA</div>
            <div style="font-size: 9pt; font-weight: bold;">SP/SADT</div>
            ${totalPaginas > 1 ? `<div class="pagina-info"><strong>Página ${paginaAtual} de ${totalPaginas}</strong></div>` : ''}
          </div>
          <div class="campo text-right">
            <div style="font-size: 7pt;">Nº DA GUIA</div>
            <div style="font-size: 16pt; font-weight: bold;">${numeroGuiaOriginal}</div>
            <div style="font-size: 6pt;">Versão TISS: ${atendimento.versao_tiss || '4.03.00'}</div>
          </div>
        </div>
        
        <!-- 1 - REGISTRO ANS / AUTORIZAÇÃO -->
        <div class="titulo-secao">1 - REGISTRO ANS / AUTORIZAÇÃO</div>
        <div class="grid grid-5" style="border: 1px solid #000; border-top: none;">
          <div class="campo"><span class="numero-campo">01</span> REGISTRO ANS<br>${convenio?.registro_ans || '_______________'}</div>
          <div class="campo"><span class="numero-campo">02</span> Nº GUIA PRINCIPAL<br>${atendimento.guia_principal || '_________________'}</div>
          <div class="campo"><span class="numero-campo">03</span> DATA AUTORIZAÇÃO<br>${atendimento.data_autorizacao ? format(new Date(atendimento.data_autorizacao), 'dd/MM/yyyy') : '___/___/_____'}</div>
          <div class="campo"><span class="numero-campo">04</span> SENHA<br>${atendimento.senha_autorizacao || '_______________'}</div>
          <div class="campo"><span class="numero-campo">05</span> VALIDADE DA SENHA<br>${atendimento.data_validade_senha ? format(new Date(atendimento.data_validade_senha), 'dd/MM/yyyy') : '___/___/_____'}</div>
        </div>
        <div class="grid grid-2">
          <div class="campo"><span class="numero-campo">06</span> Nº GUIA OPERADORA<br>${atendimento.numero_guia_operadora || '_____________________________'}</div>
          <div class="campo"></div>
        </div>
        
        <!-- 2 - DADOS DO BENEFICIÁRIO -->
        <div class="titulo-secao">2 - DADOS DO BENEFICIÁRIO</div>
        <div class="grid grid-6" style="border: 1px solid #000; border-top: none;">
          <div class="campo"><span class="numero-campo">07</span> Nº CARTEIRA<br>${atendimento.numero_carteira || '_________________________'}</div>
          <div class="campo"><span class="numero-campo">08</span> VALIDADE<br>${atendimento.validade_carteira || '___/___/_____'}</div>
          <div class="campo"><span class="numero-campo">09</span> NOME<br><strong>${atendimento.paciente_nome || '________________________________________'}</strong></div>
          <div class="campo"><span class="numero-campo">10</span> CNS<br>${atendimento.cns || '_______________________________'}</div>
          <div class="campo"><span class="numero-campo">11</span> ATENDIMENTO RN<br>${atendimento.atendimento_rn === 'S' ? '[X] SIM' : '[ ] SIM / [ ] NÃO'}</div>
          <div class="campo"><span class="numero-campo">12</span> DATA NASCIMENTO<br>${atendimento.data_nascimento || '___/___/_____'}</div>
        </div>
        
        <!-- 3 - DADOS DO CONTRATADO SOLICITANTE -->
        <div class="titulo-secao">3 - DADOS DO CONTRATADO SOLICITANTE</div>
        <div class="grid grid-2" style="border: 1px solid #000; border-top: none;">
          <div class="campo"><span class="numero-campo">13</span> NOME DO CONTRATADO<br>${atendimento.nome_contratado || configClinica.nome_contratado || '________________________________________'}</div>
          <div class="campo"><span class="numero-campo">14</span> CÓDIGO NA OPERADORA<br>${atendimento.codigo_operadora || convenio?.codigo_prestador || '_______________'}</div>
        </div>
        <div class="grid grid-6" style="border: 1px solid #000; border-top: none;">
          <div class="campo"><span class="numero-campo">15</span> PROFISSIONAL<br>${atendimento.profissional_solicitante || '________________________________________'}</div>
          <div class="campo"><span class="numero-campo">16</span> CONSELHO<br>${CONSELHO_MAP[atendimento.conselho_solicitante] || '_____'}</div>
          <div class="campo"><span class="numero-campo">17</span> Nº CONSELHO<br>${atendimento.numero_conselho_solicitante || '_______________'}</div>
          <div class="campo"><span class="numero-campo">18</span> UF<br>${atendimento.uf_solicitante || '___'}</div>
          <div class="campo"><span class="numero-campo">19</span> CBO<br>${atendimento.cbos_solicitante || '________'}</div>
          <div class="campo"><span class="numero-campo">20</span> ASSINATURA<br>_________________________</div>
        </div>
        
        <!-- 4 - SOLICITAÇÃO / PROCEDIMENTOS -->
        <div class="titulo-secao">4 - SOLICITAÇÃO / PROCEDIMENTOS</div>
        <table style="width: 100%;">
          <thead>
            <tr><th width="10">Seq</th><th width="20">Tabela</th><th width="30">Código</th><th>Descrição</th><th width="15">Qtd Sol.</th><th width="15">Qtd Aut.</th></tr>
          </thead>
          <tbody>
            ${atendimento.itens_autorizados && atendimento.itens_autorizados.length > 0 ? 
              atendimento.itens_autorizados.slice(0, 5).map((item, idx) => `
                <tr><td class="text-center">${idx+1}</td><td class="text-center">${item.tabela_referencia || '22'}</td><td class="text-center">${item.codigo || '-'}</td><td class="text-left">${item.nome || '-'}</td><td class="text-center">${item.quantidade_solicitada || '-'}</td><td class="text-center">${item.quantidade_autorizada || 0}</td></tr>
              `).join('') : 
              '<tr><td colspan="6" style="height: 50px; text-align: center;">Nenhum procedimento solicitado</td></tr>'
            }
          </tbody>
        </table>
        
        <!-- 5 - DADOS DO CONTRATADO EXECUTANTE -->
        <div class="titulo-secao">5 - DADOS DO CONTRATADO EXECUTANTE</div>
        <div class="grid grid-3" style="border: 1px solid #000; border-top: none;">
          <div class="campo"><span class="numero-campo">24</span> CÓDIGO OPERADORA<br>${atendimento.codigo_operadora_executante || convenio?.codigo_prestador || '_______________'}</div>
          <div class="campo"><span class="numero-campo">25</span> NOME DO CONTRATADO<br>${atendimento.nome_contratado_executante || configClinica.nome_contratado || '________________________________________'}</div>
          <div class="campo"><span class="numero-campo">26</span> CNES<br>${configClinica.cnes || atendimento.cnes || '_______'}</div>
        </div>
        
        <!-- 6 - DADOS DO ATENDIMENTO -->
        <div class="titulo-secao">6 - DADOS DO ATENDIMENTO</div>
        <div class="grid grid-4" style="border: 1px solid #000; border-top: none;">
          <div class="campo"><span class="numero-campo">27</span> TIPO ATENDIMENTO<br>${TIPO_ATENDIMENTO_MAP[atendimento.tipo_atendimento] || atendimento.tipo_atendimento || '________'}</div>
          <div class="campo"><span class="numero-campo">28</span> INDICAÇÃO ACIDENTE<br>${INDICADOR_ACIDENTE_MAP[atendimento.indicacao_acidente] || atendimento.indicacao_acidente || '________'}</div>
          <div class="campo"><span class="numero-campo">29</span> TIPO CONSULTA<br>${TIPO_CONSULTA_MAP[atendimento.tipo_consulta] || atendimento.tipo_consulta || '________'}</div>
          <div class="campo"><span class="numero-campo">30</span> MOTIVO ENCERRAMENTO<br>${MOTIVO_ENCERRAMENTO_MAP[atendimento.motivo_encerramento] || atendimento.motivo_encerramento || '________'}</div>
        </div>
        
        <!-- 7 - EXECUÇÃO / PROCEDIMENTOS REALIZADOS -->
        <div class="titulo-secao">7 - EXECUÇÃO / PROCEDIMENTOS REALIZADOS</div>
        <div class="tabela-wrapper">
          <table style="width: 100%;">
            <thead>
              <tr>
                <th width="5">Seq</th>
                <th width="10">Data</th>
                <th width="8">H.Ini</th>
                <th width="8">H.Fim</th>
                <th width="10">Tabela</th>
                <th width="12">Código</th>
                <th>Descrição</th>
                <th width="6">Qtd</th>
                <th width="8">Via</th>
                <th width="8">Téc</th>
                <th width="12">Valor Unit</th>
                <th width="12">Valor Total</th>
              </tr>
            </thead>
            <tbody>
              ${itensPagina.map((item, idx) => `
                <tr>
                  <td class="text-center">${((paginaAtual - 1) * 7) + idx + 1}</td>
                  <td class="text-center">${item.data_execucao || '___/___/___'}</td>
                  <td class="text-center">${item.hora_inicial || '__:__'}</td>
                  <td class="text-center">${item.hora_final || '__:__'}</td>
                  <td class="text-center">${item.tabela_referencia || '22'}</td>
                  <td class="text-center">${item.codigo || '_______'}</td>
                  <td class="text-left">${(item.nome || '_________________________________________________').substring(0, 50)}</td>
                  <td class="text-center">${item.quantidade || 1}</td>
                  <td class="text-center">${VIA_ACESSO_MAP[item.viaAcesso] || item.viaAcesso || '_'}</td>
                  <td class="text-center">${TECNICA_MAP[item.tecnicaUtilizada] || item.tecnicaUtilizada || '_'}</td>
                  <td class="text-right">R$ ${(item.valor_unitario || 0).toFixed(2)}</td>
                  <td class="text-right">R$ ${(item.valor_total || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
              ${itensPagina.length === 0 ? 
                '<tr><td colspan="12" style="height: 80px; text-align: center;">Nenhum procedimento registrado nesta página</td></tr>' : 
                ''}
            </tbody>
          </table>
        </div>
        
        <!-- 8 - IDENTIFICAÇÃO DOS PROFISSIONAIS EXECUTANTES -->
        <div class="titulo-secao">8 - IDENTIFICAÇÃO DOS PROFISSIONAIS EXECUTANTES</div>
        <div class="tabela-wrapper">
          <table style="width: 100%;">
            <thead>
              <tr>
                <th width="5">Seq</th>
                <th width="12">Grau Part.</th>
                <th width="15">CPF</th>
                <th>Nome</th>
                <th width="8">Cons.</th>
                <th width="15">Nº Conselho</th>
                <th width="6">UF</th>
                <th width="12">CBO</th>
              </tr>
            </thead>
            <tbody>
              ${itensPagina.map((item, idx) => `
                <tr>
                  <td class="text-center">${((paginaAtual - 1) * 7) + idx + 1}</td>
                  <td class="text-center">${GRAU_PARTICIPACAO_MAP[item.grau_participacao] || item.grau_participacao || '___'}</td>
                  <td class="text-center">${item.prestador_cpf || '_______________'}</td>
                  <td class="text-left">${(item.prestador_nome || '________________________________________').substring(0, 40)}</td>
                  <td class="text-center">${CONSELHO_MAP[item.prestador_conselho] || item.prestador_conselho || '___'}</td>
                  <td class="text-center">${item.prestador_numero_conselho || '_______________'}</td>
                  <td class="text-center">${item.prestador_uf_conselho || '___'}</td>
                  <td class="text-center">${item.prestador_cbos || '________'}</td>
                </tr>
              `).join('')}
              ${itensPagina.length === 0 ?
                '<tr><td colspan="8" style="height: 60px; text-align: center;">Nenhum profissional registrado nesta página</td></tr>' :
                ''}
            </tbody>
          </table>
        </div>
        
        ${ehUltimaPagina ? `
          <!-- 9 - VALORES TOTAIS -->
          <div class="titulo-secao">9 - VALORES TOTAIS (R$)</div>
          <div class="grid grid-8" style="border: 1px solid #000; border-top: none;">
            <div class="campo"><span class="numero-campo">31</span> Procedimentos<br><strong>R$ ${totalTodosItens.toFixed(2)}</strong></div>
            <div class="campo"><span class="numero-campo">32</span> Taxas/Aluguéis<br>R$ 0,00</div>
            <div class="campo"><span class="numero-campo">33</span> Materiais<br>R$ 0,00</div>
            <div class="campo"><span class="numero-campo">34</span> OPME<br>R$ 0,00</div>
            <div class="campo"><span class="numero-campo">35</span> Medicamentos<br>R$ 0,00</div>
            <div class="campo"><span class="numero-campo">36</span> Gases<br>R$ 0,00</div>
            <div class="campo"><span class="numero-campo">37</span> TOTAL GERAL<br><strong style="font-size: 10pt;">R$ ${totalTodosItens.toFixed(2)}</strong></div>
            <div class="campo"><span class="numero-campo">38</span> FORMA PAGTO<br>_______________</div>
          </div>
          
          <!-- 10 - OBSERVAÇÕES / ASSINATURAS -->
          <div class="titulo-secao">10 - OBSERVAÇÕES / ASSINATURAS</div>
          <div class="campo" style="min-height: 50px;">
            ${atendimento.observacao || '_________________________________________________________________'}
          </div>
          
          <div class="assinatura">
            <div class="assinatura-item"><div class="linha-assinatura"></div>ASSINATURA DO RESPONSÁVEL</div>
            <div class="assinatura-item"><div class="linha-assinatura"></div>ASSINATURA DO BENEFICIÁRIO</div>
            <div class="assinatura-item"><div class="linha-assinatura"></div>ASSINATURA DO CONTRATADO</div>
          </div>
        ` : `
          <div class="continuacao">
            <div class="aviso-continuacao">
              ► CONTINUA NA PRÓXIMA PÁGINA ◄<br>
              Guia: ${numeroGuiaOriginal} - Página ${paginaAtual + 1} de ${totalPaginas}
            </div>
          </div>
        `}
        
        <div class="rodape">
          Documento gerado eletronicamente - Sistema de Faturamento TISS - ${new Date().toLocaleString('pt-BR')}
        </div>
      </div>
    </div>
  `;
};

// Gera HTML completo com múltiplas páginas
export const gerarHTMLGuiaTISSOficial = (atendimento, convenio, configClinica = {}) => {
  const itens = atendimento.itens || [];
  const paginas = dividirEmPaginas(itens);
  const css = gerarCSS();
  
  const paginasHTML = paginas.map((pagina) => 
    gerarPaginaGuia(atendimento, convenio, configClinica, pagina.numero_pagina, pagina.total_paginas, pagina.itens)
  );
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>GUIA SP/SADT - ${atendimento.numero_guia_prestador || '1000000'}</title>
  <style>${css}</style>
</head>
<body>
  <div class="print-container">
    ${paginasHTML.join('')}
  </div>
</body>
</html>`;
};

// Função para imprimir uma única guia
export const imprimirGuiaTISSOficial = (atendimento, convenio, configClinica = {}) => {
  const html = gerarHTMLGuiaTISSOficial(atendimento, convenio, configClinica);
  const printWindow = window.open('', '_blank', 'width=1200,height=800');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    
    // Aguarda o carregamento do conteúdo para imprimir
    printWindow.onload = () => {
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    };
  } else {
    alert('Por favor, permita pop-ups para imprimir a guia.');
  }
};

// Função para imprimir múltiplas guias (lote)
export const imprimirMultiplasGuiasTISS = (guias, convenio, configClinica = {}) => {
  if (!guias || guias.length === 0) {
    alert('Nenhuma guia selecionada para impressão.');
    return;
  }
  
  const css = gerarCSS();
  let htmlCompleto = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Múltiplas Guias TISS - Lote de ${guias.length} guia(s)</title>
  <style>${css}</style>
  <style>
    .separador-guias {
      page-break-before: always;
      break-before: page;
    }
    .separador-guias:first-child {
      page-break-before: avoid;
      break-before: avoid;
    }
  </style>
</head>
<body>
  <div class="print-container">`;
  
  guias.forEach((guia, index) => {
    const guiaHtml = gerarHTMLGuiaTISSOficial(guia, convenio, configClinica);
    const bodyMatch = guiaHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : '';
    
    // Remove o print-container para evitar duplicação
    const contentWithoutContainer = bodyContent.replace(/<div class="print-container">/, '').replace('</div>', '');
    
    if (index > 0) {
      htmlCompleto += '<div class="separador-guias"></div>';
    }
    htmlCompleto += contentWithoutContainer;
  });
  
  htmlCompleto += `
  </div>
</body>
</html>`;
  
  const printWindow = window.open('', '_blank', 'width=1200,height=800');
  if (printWindow) {
    printWindow.document.write(htmlCompleto);
    printWindow.document.close();
    printWindow.focus();
    
    printWindow.onload = () => {
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    };
  } else {
    alert('Por favor, permita pop-ups para imprimir as guias em lote.');
  }
};
