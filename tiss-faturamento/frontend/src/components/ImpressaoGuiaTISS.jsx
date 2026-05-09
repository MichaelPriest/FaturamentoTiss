// src/components/ImpressaoGuiaTISS.jsx
import React from 'react';
import { format } from 'date-fns';

export const gerarHTMLGuiaTISS = (atendimento, convenio) => {
  const itens = atendimento.itens || [];
  const itensAutorizados = atendimento.itens_autorizados || [];
  
  const valorTotalProcedimentos = itens.reduce((sum, item) => sum + (item.valor_total || 0), 0);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Guia TISS - ${atendimento.numero_guia_prestador}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 10pt;
          line-height: 1.2;
          background: white;
          margin: 0;
          padding: 20px;
        }
        .guia-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border: 1px solid #000;
          padding: 15px;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .header h1 {
          font-size: 14pt;
          font-weight: bold;
          margin: 0;
        }
        .header h2 {
          font-size: 12pt;
          margin: 5px 0 0 0;
        }
        .header p {
          font-size: 9pt;
          margin-top: 5px;
        }
        .section {
          margin-bottom: 15px;
          border: 1px solid #ccc;
          padding: 8px;
        }
        .section-title {
          font-weight: bold;
          font-size: 11pt;
          background: #f0f0f0;
          padding: 4px 8px;
          margin: -8px -8px 8px -8px;
          border-bottom: 1px solid #ccc;
        }
        .row {
          display: flex;
          margin-bottom: 5px;
          padding: 2px 0;
          border-bottom: 1px dotted #eee;
        }
        .label {
          width: 180px;
          font-weight: bold;
        }
        .value {
          flex: 1;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .table th, .table td {
          border: 1px solid #000;
          padding: 4px;
          text-align: left;
          font-size: 8pt;
        }
        .table th {
          background: #f0f0f0;
          font-weight: bold;
        }
        .table td {
          vertical-align: top;
        }
        .text-right {
          text-align: right;
        }
        .text-center {
          text-align: center;
        }
        .total-row {
          font-weight: bold;
          background: #f9f9f9;
        }
        .footer {
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid #000;
          font-size: 8pt;
          text-align: center;
        }
        .assinatura {
          margin-top: 20px;
          display: flex;
          justify-content: space-between;
        }
        .assinatura-line {
          width: 200px;
          text-align: center;
          border-top: 1px solid #000;
          padding-top: 5px;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="guia-container">
        <div class="header">
          <h1>GUIA DE SERVIÇOS PROFISSIONAIS / SP-SADT</h1>
          <h2>Padrão TISS - ${atendimento.versao_tiss || '4.03.00'}</h2>
          <p>ANS - Agência Nacional de Saúde Suplementar</p>
        </div>
        
        <!-- Cabeçalho da Guia -->
        <div class="section">
          <div class="section-title">IDENTIFICAÇÃO DA GUIA</div>
          <div class="row">
            <div class="label">Número da Guia (Prestador):</div>
            <div class="value">${atendimento.numero_guia_prestador || '-'}</div>
          </div>
          <div class="row">
            <div class="label">Número da Guia (Operadora):</div>
            <div class="value">${atendimento.numero_guia_operadora || '-'}</div>
          </div>
          <div class="row">
            <div class="label">Senha de Autorização:</div>
            <div class="value">${atendimento.senha_autorizacao || '-'}</div>
          </div>
          <div class="row">
            <div class="label">Data de Autorização:</div>
            <div class="value">${atendimento.data_autorizacao ? format(new Date(atendimento.data_autorizacao), 'dd/MM/yyyy') : '-'}</div>
          </div>
          <div class="row">
            <div class="label">Validade da Senha:</div>
            <div class="value">${atendimento.data_validade_senha ? format(new Date(atendimento.data_validade_senha), 'dd/MM/yyyy') : '-'}</div>
          </div>
          <div class="row">
            <div class="label">Status:</div>
            <div class="value">${atendimento.status === 'pendente' ? 'PENDENTE' : atendimento.status === 'autorizado' ? 'AUTORIZADO' : atendimento.status === 'parcial' ? 'PARCIALMENTE AUTORIZADO' : atendimento.status === 'faturado' ? 'FATURADO' : atendimento.status === 'finalizado' ? 'FINALIZADO' : atendimento.status || '-'}</div>
          </div>
        </div>
        
        <!-- Dados do Beneficiário -->
        <div class="section">
          <div class="section-title">DADOS DO BENEFICIÁRIO</div>
          <div class="row">
            <div class="label">Nome do Paciente:</div>
            <div class="value">${atendimento.paciente_nome || '-'}</div>
          </div>
          <div class="row">
            <div class="label">Número da Carteira:</div>
            <div class="value">${atendimento.numero_carteira || '-'}</div>
          </div>
          <div class="row">
            <div class="label">Convênio:</div>
            <div class="value">${atendimento.paciente_convenio_nome || '-'}</div>
          </div>
          <div class="row">
            <div class="label">Registro ANS:</div>
            <div class="value">${atendimento.convenio_registro_ans || '-'}</div>
          </div>
          <div class="row">
            <div class="label">Código do Prestador na Operadora:</div>
            <div class="value">${atendimento.convenio_codigo_prestador || '-'}</div>
          </div>
        </div>
        
        <!-- Dados do Contratado Executante -->
        <div class="section">
          <div class="section-title">DADOS DO CONTRATADO EXECUTANTE</div>
          <div class="row">
            <div class="label">Nome Contratado:</div>
            <div class="value">${atendimento.nome_contratado || atendimento.paciente_convenio_nome || '-'}</div>
          </div>
          <div class="row">
            <div class="label">Código na Operadora:</div>
            <div class="value">${atendimento.codigo_operadora || atendimento.convenio_codigo_prestador || '-'}</div>
          </div>
          <div class="row">
            <div class="label">CNES:</div>
            <div class="value">${atendimento.cnes || '0000000'}</div>
          </div>
        </div>
        
        <!-- Dados do Profissional Solicitante -->
        <div class="section">
          <div class="section-title">DADOS DO PROFISSIONAL SOLICITANTE</div>
          <div class="row">
            <div class="label">Nome:</div>
            <div class="value">${atendimento.profissional_solicitante || '-'}</div>
          </div>
          <div class="row">
            <div class="label">Conselho / Nº / UF:</div>
            <div class="value">${atendimento.conselho_solicitante === '06' ? 'CRM' : atendimento.conselho_solicitante === '08' ? 'CRO' : atendimento.conselho_solicitante === '03' ? 'CRF' : atendimento.conselho_solicitante === '02' ? 'COREN' : atendimento.conselho_solicitante === '05' ? 'CREFITO' : atendimento.conselho_solicitante === '09' ? 'CRP' : '-'} ${atendimento.numero_conselho_solicitante || ''} / ${atendimento.uf_solicitante || '-'}</div>
          </div>
          <div class="row">
            <div class="label">CBOS:</div>
            <div class="value">${atendimento.cbos_solicitante || '-'}</div>
          </div>
        </div>
        
        <!-- Dados do Atendimento -->
        <div class="section">
          <div class="section-title">DADOS DO ATENDIMENTO</div>
          <div class="row">
            <div class="label">Data de Solicitação:</div>
            <div class="value">${atendimento.data_solicitacao ? format(new Date(atendimento.data_solicitacao), 'dd/MM/yyyy') : '-'}</div>
          </div>
          <div class="row">
            <div class="label">Caráter do Atendimento:</div>
            <div class="value">${atendimento.carater_atendimento === '1' ? 'Eletivo' : atendimento.carater_atendimento === '2' ? 'Urgência/Emergência' : '-'}</div>
          </div>
          <div class="row">
            <div class="label">Tipo de Atendimento:</div>
            <div class="value">${atendimento.tipo_atendimento ? getTipoAtendimentoLabel(atendimento.tipo_atendimento) : '-'}</div>
          </div>
          <div class="row">
            <div class="label">Indicação de Acidente:</div>
            <div class="value">${atendimento.indicacao_acidente === '0' ? 'Acidente de Trabalho' : atendimento.indicacao_acidente === '1' ? 'Acidente de Trânsito' : atendimento.indicacao_acidente === '2' ? 'Outros Acidentes' : atendimento.indicacao_acidente === '9' ? 'Não Acidente' : '-'}</div>
          </div>
          <div class="row">
            <div class="label">Tipo de Consulta:</div>
            <div class="value">${atendimento.tipo_consulta === '1' ? 'Primeira Consulta' : atendimento.tipo_consulta === '2' ? 'Seguimento' : atendimento.tipo_consulta === '3' ? 'Pré-Natal' : atendimento.tipo_consulta === '4' ? 'Por encaminhamento' : '-'}</div>
          </div>
          <div class="row">
            <div class="label">Regime de Atendimento:</div>
            <div class="value">${atendimento.regime_atendimento === '01' ? 'Ambulatorial' : atendimento.regime_atendimento === '02' ? 'Domiciliar' : atendimento.regime_atendimento === '03' ? 'Internação' : atendimento.regime_atendimento === '04' ? 'Pronto Socorro' : atendimento.regime_atendimento === '05' ? 'Telessaúde' : '-'}</div>
          </div>
          ${atendimento.indicacao_clinica ? `<div class="row"><div class="label">Indicação Clínica:</div><div class="value">${atendimento.indicacao_clinica}</div></div>` : ''}
        </div>
        
        <!-- Itens Executados/Procedimentos -->
        <div class="section">
          <div class="section-title">PROCEDIMENTOS EXECUTADOS</div>
          <table class="table">
            <thead>
              <tr>
                <th width="30">Seq</th>
                <th width="80">Data</th>
                <th width="80">H.Início</th>
                <th width="80">H.Fim</th>
                <th width="80">Código</th>
                <th>Procedimento</th>
                <th width="50">Qtd</th>
                <th width="80">Valor Unit.</th>
                <th width="80">Valor Total</th>
              </tr>
            </thead>
            <tbody>
              ${itens.map((item, idx) => `
                <tr>
                  <td class="text-center">${idx + 1}</td>
                  <td class="text-center">${item.data_execucao || '-'}</td>
                  <td class="text-center">${item.hora_inicial || '-'}</td>
                  <td class="text-center">${item.hora_final || '-'}</td>
                  <td class="text-center">${item.codigo || '-'}</td>
                  <td>${item.nome || '-'}</td>
                  <td class="text-center">${item.quantidade || 1}</td>
                  <td class="text-right">R$ ${(item.valor_unitario || 0).toFixed(2)}</td>
                  <td class="text-right">R$ ${(item.valor_total || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="8" class="text-right">TOTAL GERAL:</td>
                <td class="text-right">R$ ${valorTotalProcedimentos.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <!-- Itens Autorizados (se houver) -->
        ${itensAutorizados.length > 0 ? `
        <div class="section">
          <div class="section-title">PROCEDIMENTOS AUTORIZADOS PELO CONVÊNIO</div>
          <table class="table">
            <thead>
              <tr>
                <th width="80">Código</th>
                <th>Procedimento</th>
                <th width="80">Qtd Autorizada</th>
                <th width="80">Qtd Utilizada</th>
                <th width="80">Saldo</th>
                <th width="80">Valor Unit.</th>
              </tr>
            </thead>
            <tbody>
              ${itensAutorizados.map((item, idx) => `
                <tr>
                  <td>${item.codigo || '-'}</td>
                  <td>${item.nome || '-'}</td>
                  <td class="text-center">${item.quantidade_autorizada || 0}</td>
                  <td class="text-center">${item.quantidade_utilizada || 0}</td>
                  <td class="text-center">${(item.quantidade_autorizada || 0) - (item.quantidade_utilizada || 0)}</td>
                  <td class="text-right">R$ ${(item.valor_unitario || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
        
        <!-- Observações -->
        ${atendimento.observacao ? `
        <div class="section">
          <div class="section-title">OBSERVAÇÕES</div>
          <div class="row">
            <div class="value">${atendimento.observacao}</div>
          </div>
        </div>
        ` : ''}
        
        <!-- Assinaturas -->
        <div class="assinatura">
          <div class="assinatura-line">
            <p>Profissional Solicitante</p>
            <p>${atendimento.profissional_solicitante || '_________________________'}</p>
          </div>
          <div class="assinatura-line">
            <p>Profissional Executante</p>
            <p>${itens[0]?.prestador_nome || '_________________________'}</p>
          </div>
        </div>
        
        <div class="footer">
          <p>Documento gerado eletronicamente - Sistema de Faturamento TISS</p>
          <p>Gerado em: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Função auxiliar para obter label do tipo de atendimento
function getTipoAtendimentoLabel(tipo) {
  const tipos = {
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
  return tipos[tipo] || tipo;
}

export const imprimirGuiaTISS = (atendimento, convenio) => {
  const html = gerarHTMLGuiaTISS(atendimento, convenio);
  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  
  // Fechar após impressão (opcional)
  printWindow.onafterprint = () => {
    printWindow.close();
  };
};

export const imprimirGuiaTISSMultiplas = (guias, convenio) => {
  let htmlCompleto = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Múltiplas Guias TISS</title><style>${guias[0] ? gerarHTMLGuiaTISS(guias[0], convenio).match(/<style>([\\s\\S]*?)<\/style>/)?.[1] : ''}</style></head><body>`;
  
  guias.forEach((guia, index) => {
    const guiaHtml = gerarHTMLGuiaTISS(guia, convenio);
    const bodyContent = guiaHtml.match(/<body>([\\s\\S]*?)<\/body>/)?.[1] || '';
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
  
  printWindow.onafterprint = () => {
    printWindow.close();
  };
};
