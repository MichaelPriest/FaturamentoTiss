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

export const gerarHTMLGuiaTISSOficial = (atendimento, convenio, configClinica = {}) => {
  const itens = atendimento.itens || [];
  const itensAutorizados = atendimento.itens_autorizados || [];
  
  // Totais
  const totalProcedimentos = itens.reduce((sum, item) => sum + (item.valor_total || 0), 0);
  const totalMateriais = 0;
  const totalMedicamentos = 0;
  const totalTaxas = 0;
  const totalOPME = 0;
  const totalGases = 0;
  const totalGeral = totalProcedimentos + totalMateriais + totalMedicamentos + totalTaxas + totalOPME + totalGases;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>GUIA SP/SADT - ${atendimento.numero_guia_prestador || '1000000'}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Helvetica', 'Arial', sans-serif;
          font-size: 10pt;
          line-height: 1.2;
          background: white;
          margin: 0;
          padding: 8px;
        }
        
        .guia-container {
          max-width: 297mm;
          width: 100%;
          margin: 0 auto;
          background: white;
          border: 1px solid #000;
          padding: 8px;
        }
        
        /* Grid System */
        .grid {
          display: grid;
          gap: 0;
        }
        
        .grid-2 { grid-template-columns: repeat(2, 1fr); }
        .grid-3 { grid-template-columns: repeat(3, 1fr); }
        .grid-4 { grid-template-columns: repeat(4, 1fr); }
        .grid-5 { grid-template-columns: repeat(5, 1fr); }
        .grid-6 { grid-template-columns: repeat(6, 1fr); }
        .grid-8 { grid-template-columns: repeat(8, 1fr); }
        
        /* Bordas */
        .borda { border: 1px solid #000; }
        .borda-top { border-top: 1px solid #000; }
        .borda-bottom { border-bottom: 1px solid #000; }
        .borda-left { border-left: 1px solid #000; }
        .borda-right { border-right: 1px solid #000; }
        
        .titulo-principal {
          font-size: 11pt;
          font-weight: bold;
          text-align: center;
          text-transform: uppercase;
        }
        
        .titulo-secao {
          font-size: 9pt;
          font-weight: bold;
          background: #e0e0e0;
          padding: 4px 6px;
          margin-top: 6px;
          border: 1px solid #000;
          border-bottom: none;
        }
        
        .campo {
          padding: 4px 6px;
          border: 1px solid #000;
        }
        
        .campo-label {
          font-size: 7pt;
          font-weight: bold;
          display: block;
          margin-bottom: 2px;
        }
        
        .campo-valor {
          font-size: 9pt;
        }
        
        .campo-valor-grande {
          font-size: 11pt;
          font-weight: bold;
        }
        
        .numero-campo {
          font-size: 6pt;
          font-weight: bold;
          margin-right: 4px;
        }
        
        /* Tabelas */
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8pt;
        }
        
        th, td {
          border: 1px solid #000;
          padding: 4px 3px;
          vertical-align: top;
        }
        
        th {
          background: #e8e8e8;
          font-weight: bold;
          text-align: center;
        }
        
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        
        /* Assinaturas */
        .assinatura {
          display: flex;
          justify-content: space-between;
          margin-top: 15px;
        }
        
        .assinatura-item {
          text-align: center;
          width: 30%;
        }
        
        .linha-assinatura {
          border-top: 1px solid #000;
          padding-top: 4px;
          margin-top: 20px;
        }
        
        .rodape {
          margin-top: 10px;
          padding-top: 8px;
          border-top: 2px solid #000;
          font-size: 6pt;
          text-align: center;
        }
        
        @media print {
          body { padding: 0; margin: 0; }
          .guia-container { border: none; padding: 5mm; }
          th, .titulo-secao { 
            background: #e8e8e8 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        
        @page {
          size: A4 landscape;
          margin: 8mm;
        }
      </style>
    </head>
    <body>
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
          </div>
          <div class="campo text-right">
            <div style="font-size: 7pt;">Nº DA GUIA</div>
            <div style="font-size: 14pt; font-weight: bold;">${atendimento.numero_guia_prestador || '1000000'}</div>
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
          <div class="campo"><span class="numero-campo">09</span> NOME<br>${atendimento.paciente_nome || '________________________________________'}</div>
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
        <table>
          <thead>
            <tr><th width="15">Seq</th><th width="30">Tabela</th><th width="45">Código</th><th>Descrição</th><th width="20">Qtd Sol.</th><th width="20">Qtd Aut.</th></tr>
          </thead>
          <tbody>
            ${itensAutorizados.length > 0 ? itensAutorizados.map((item, idx) => `
              <tr><td class="text-center">${idx+1}</td><td class="text-center">${item.tabela_referencia || '22'}</td><td class="text-center">${item.codigo || '-'}</td><td>${item.nome || '-'}</td><td class="text-center">${item.quantidade_solicitada || '-'}</td><td class="text-center">${item.quantidade_autorizada || 0}</td></tr>
            `).join('') : '<tr><td colspan="6" style="height: 80px;"></td></tr>'}
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
        <table>
          <thead><tr><th>Seq</th><th>Data</th><th>H.Ini</th><th>H.Fim</th><th>Tabela</th><th>Código</th><th>Descrição</th><th>Qtd</th><th>Via</th><th>Téc</th><th>Valor Unit</th><th>Valor Total</th></tr></thead>
          <tbody>
            ${itens.map((item, idx) => `
              <tr>
                <td class="text-center">${idx+1}</td>
                <td class="text-center">${item.data_execucao || '___/___/___'}</td>
                <td class="text-center">${item.hora_inicial || '__:__'}</td>
                <td class="text-center">${item.hora_final || '__:__'}</td>
                <td class="text-center">${item.tabela_referencia || '22'}</td>
                <td class="text-center">${item.codigo || '_______'}</td>
                <td>${item.nome || '_________________________________________________'}</td>
                <td class="text-center">${item.quantidade || 1}</td>
                <td class="text-center">${VIA_ACESSO_MAP[item.viaAcesso] || item.viaAcesso || '_'}</td>
                <td class="text-center">${TECNICA_MAP[item.tecnicaUtilizada] || item.tecnicaUtilizada || '_'}</td>
                <td class="text-right">R$ ${(item.valor_unitario || 0).toFixed(2)}</td>
                <td class="text-right">R$ ${(item.valor_total || 0).toFixed(2)}</td>
              </tr>
            `).join('')}
            ${itens.length === 0 ? '<tr><td colspan="12" style="height: 150px; text-align: center;">Nenhum procedimento registrado</td></tr>' : ''}
          </tbody>
        </table>
        
        <!-- 8 - IDENTIFICAÇÃO DOS PROFISSIONAIS EXECUTANTES -->
        <div class="titulo-secao">8 - IDENTIFICAÇÃO DOS PROFISSIONAIS EXECUTANTES</div>
        <table>
          <thead><tr><th>Seq</th><th>Grau Part.</th><th>CPF</th><th>Nome</th><th>Cons.</th><th>Nº Conselho</th><th>UF</th><th>CBO</th></tr></thead>
          <tbody>
            ${itens.map((item, idx) => `
              <tr>
                <td class="text-center">${idx+1}</td>
                <td class="text-center">${GRAU_PARTICIPACAO_MAP[item.grau_participacao] || item.grau_participacao || '___'}</td>
                <td>${item.prestador_cpf || '_______________'}</td>
                <td>${item.prestador_nome || '________________________________________'}</td>
                <td class="text-center">${CONSELHO_MAP[item.prestador_conselho] || item.prestador_conselho || '___'}</td>
                <td>${item.prestador_numero_conselho || '_______________'}</td>
                <td class="text-center">${item.prestador_uf_conselho || '___'}</td>
                <td>${item.prestador_cbos || '________'}</td>
              </tr>
            `).join('')}
            ${itens.length === 0 ? '<tr><td colspan="8" style="height: 80px; text-align: center;">Nenhum profissional registrado</td></tr>' : ''}
          </tbody>
        </table>
        
        <!-- 9 - VALORES TOTAIS -->
        <div class="titulo-secao">9 - VALORES TOTAIS (R$)</div>
        <div class="grid grid-8" style="border: 1px solid #000; border-top: none;">
          <div class="campo"><span class="numero-campo">31</span> Procedimentos<br>R$ ${totalProcedimentos.toFixed(2)}</div>
          <div class="campo"><span class="numero-campo">32</span> Taxas/Aluguéis<br>R$ ${totalTaxas.toFixed(2)}</div>
          <div class="campo"><span class="numero-campo">33</span> Materiais<br>R$ ${totalMateriais.toFixed(2)}</div>
          <div class="campo"><span class="numero-campo">34</span> OPME<br>R$ ${totalOPME.toFixed(2)}</div>
          <div class="campo"><span class="numero-campo">35</span> Medicamentos<br>R$ ${totalMedicamentos.toFixed(2)}</div>
          <div class="campo"><span class="numero-campo">36</span> Gases<br>R$ ${totalGases.toFixed(2)}</div>
          <div class="campo"><span class="numero-campo">37</span> TOTAL GERAL<br><strong>R$ ${totalGeral.toFixed(2)}</strong></div>
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
        
        <div class="rodape">
          Documento gerado eletronicamente - Sistema de Faturamento TISS - ${new Date().toLocaleString()}
        </div>
      </div>
    </body>
    </html>
  `;
};

// Função para imprimir uma única guia
export const imprimirGuiaTISSOficial = (atendimento, convenio, configClinica = {}) => {
  const html = gerarHTMLGuiaTISSOficial(atendimento, convenio, configClinica);
  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.onafterprint = () => printWindow.close();
};

// Função para imprimir múltiplas guias
export const imprimirMultiplasGuiasTISS = (guias, convenio, configClinica = {}) => {
  let htmlCompleto = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Múltiplas Guias TISS</title><style>${gerarHTMLGuiaTISSOficial(guias[0], convenio, configClinica).match(/<style>([\s\S]*?)<\/style>/)?.[1] || ''}</style></head><body>`;
  
  guias.forEach((guia, index) => {
    const guiaHtml = gerarHTMLGuiaTISSOficial(guia, convenio, configClinica);
    const bodyContent = guiaHtml.match(/<body>([\s\S]*?)<\/body>/)?.[1] || '';
    htmlCompleto += bodyContent;
    if (index < guias.length - 1) {
      htmlCompleto += '<div style="page-break-before: always;"></div>';
    }
  });
  
  htmlCompleto += `</body></html>`;
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(htmlCompleto);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.onafterprint = () => printWindow.close();
};
