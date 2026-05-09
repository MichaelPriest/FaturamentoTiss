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
  const totalMateriais = 0; // Implementar se houver
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
      <title>GUIA SP/SADT - ${atendimento.numero_guia_prestador}</title>
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
        
        /* Container principal formato A4 paisagem */
        .guia-container {
          max-width: 297mm;
          width: 100%;
          margin: 0 auto;
          background: white;
          border: 1px solid #000;
          padding: 10px;
        }
        
        /* Grid System */
        .grid {
          display: grid;
          gap: 0;
        }
        
        .grid-2 {
          grid-template-columns: repeat(2, 1fr);
        }
        
        .grid-3 {
          grid-template-columns: repeat(3, 1fr);
        }
        
        .grid-4 {
          grid-template-columns: repeat(4, 1fr);
        }
        
        .grid-5 {
          grid-template-columns: repeat(5, 1fr);
        }
        
        .grid-6 {
          grid-template-columns: repeat(6, 1fr);
        }
        
        .grid-8 {
          grid-template-columns: repeat(8, 1fr);
        }
        
        .grid-12 {
          grid-template-columns: repeat(12, 1fr);
        }
        
        /* Bordas e linhas */
        .borda {
          border: 1px solid #000;
        }
        
        .borda-top {
          border-top: 1px solid #000;
        }
        
        .borda-bottom {
          border-bottom: 1px solid #000;
        }
        
        .borda-left {
          border-left: 1px solid #000;
        }
        
        .borda-right {
          border-right: 1px solid #000;
        }
        
        /* Títulos e cabeçalhos */
        .titulo-principal {
          font-size: 12pt;
          font-weight: bold;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .titulo-secao {
          font-size: 10pt;
          font-weight: bold;
          background: #e0e0e0;
          padding: 4px 6px;
          margin: 0;
          border: 1px solid #000;
          border-bottom: none;
        }
        
        .campo {
          padding: 3px 5px;
          border: 1px solid #000;
        }
        
        .campo-label {
          font-size: 7pt;
          font-weight: bold;
          display: block;
          margin-bottom: 2px;
          color: #333;
        }
        
        .campo-valor {
          font-size: 9pt;
          font-weight: normal;
        }
        
        .campo-valor-grande {
          font-size: 10pt;
          font-weight: bold;
        }
        
        /* Grid interno para campos numerados */
        .campo-com-numero {
          position: relative;
          padding: 2px 4px;
        }
        
        .numero-campo {
          font-size: 6pt;
          font-weight: bold;
          color: #666;
          display: inline-block;
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
        
        td {
          text-align: left;
        }
        
        .text-center {
          text-align: center;
        }
        
        .text-right {
          text-align: right;
        }
        
        /* Mini divisórias para campos numéricos */
        .campo-numerico {
          position: relative;
          letter-spacing: 2px;
          font-family: 'Courier New', monospace;
        }
        
        .campo-numerico::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: repeating-linear-gradient(90deg, #000, #000 8px, #fff 8px, #fff 16px);
        }
        
        /* Rodapé */
        .rodape {
          margin-top: 10px;
          padding-top: 8px;
          border-top: 2px solid #000;
        }
        
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
        
        /* Linhas internas para tabelas */
        .linha-interna {
          border-bottom: 1px dotted #ccc;
        }
        
        /* Responsivo mantendo A4 paisagem */
        @media print {
          body {
            padding: 0;
            margin: 0;
          }
          .guia-container {
            border: none;
            padding: 5mm;
          }
          .no-print {
            display: none;
          }
          th {
            background: #e8e8e8 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .titulo-secao {
            background: #e0e0e0 !important;
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
        
        <!-- ============================================ -->
        <!-- CABEÇALHO SUPERIOR -->
        <!-- ============================================ -->
        <div class="grid grid-3" style="margin-bottom: 8px;">
          <div class="campo" style="text-align: left;">
            <div style="font-size: 8pt; font-weight: bold;">${configClinica.nome_empresa || '_________________________'}</div>
            <div style="font-size: 7pt;">CNPJ: ${configClinica.cnpj || '______________'}</div>
            <div style="font-size: 7pt;">CNES: ${configClinica.cnes || '_______'}</div>
          </div>
          <div class="campo" style="text-align: center;">
            <div class="titulo-principal">GUIA DE SERVIÇO PROFISSIONAL /</div>
            <div class="titulo-principal">SERVIÇO AUXILIAR DE DIAGNÓSTICO E TERAPIA</div>
            <div style="font-size: 8pt; font-weight: bold; margin-top: 2px;">SP/SADT</div>
          </div>
          <div class="campo" style="text-align: right;">
            <div style="font-size: 7pt;">Nº DA GUIA</div>
            <div style="font-size: 14pt; font-weight: bold; font-family: monospace;">${atendimento.numero_guia_prestador || '_______________'}</div>
            <div style="font-size: 6pt;">Versão TISS: ${atendimento.versao_tiss || '4.03.00'}</div>
          </div>
        </div>
        
        <!-- ============================================ -->
        <!-- 1. REGISTRO ANS / AUTORIZAÇÃO -->
        <!-- ============================================ -->
        <div class="titulo-secao">1 - REGISTRO ANS / AUTORIZAÇÃO</div>
        <div class="grid grid-5" style="border: 1px solid #000; border-top: none;">
          <div class="campo">
            <div class="campo-label"><span class="numero-campo">01</span> REGISTRO ANS</div>
            <div class="campo-valor-grande">${convenio?.registro_ans || '_______________'}</div>
          </div>
          <div class="campo">
            <div class="campo-label"><span class="numero-campo">02</span> Nº GUIA PRINCIPAL</div>
            <div class="campo-valor">${atendimento.guia_principal || '_________________'}</div>
          </div>
          <div class="campo">
            <div class="campo-label"><span class="numero-campo">03</span> DATA AUTORIZAÇÃO</div>
            <div class="campo-valor">${atendimento.data_autorizacao ? format(new Date(atendimento.data_autorizacao), 'dd/MM/yyyy') : '___/___/_____'}</div>
          </div>
          <div class="campo">
            <div class="campo-label"><span class="numero-campo">04</span> SENHA</div>
            <div class="campo-valor campo-numerico">${atendimento.senha_autorizacao || '_______________'}</div>
          </div>
          <div class="campo">
            <div class="campo-label"><span class="numero-campo">05</span> VALIDADE DA SENHA</div>
            <div class="campo-valor">${atendimento.data_validade_senha ? format(new Date(atendimento.data_validade_senha), 'dd/MM/yyyy') : '___/___/_____'}</div>
          </div>
        </div>
        <div class="grid grid-2">
          <div class="campo" style="border-top: none;">
            <div class="campo-label"><span class="numero-campo">06</span> Nº GUIA OPERADORA</div>
            <div class="campo-valor">${atendimento.numero_guia_operadora || '_____________________________'}</div>
          </div>
          <div class="campo" style="border-top: none; border-left: none;">
            <!-- espaço reservado -->
          </div>
        </div>
        
        <!-- ============================================ -->
        <!-- 2 - DADOS DO BENEFICIÁRIO -->
        <!-- ============================================ -->
        <div class="titulo-secao" style="margin-top: 8px;">2 - DADOS DO BENEFICIÁRIO</div>
        <div class="grid grid-6" style="border: 1px solid #000; border-top: none;">
          <div class="campo">
            <div class="campo-label"><span class="numero-campo">07</span> Nº CARTEIRA</div>
            <div class="campo-valor campo-numerico">${atendimento.numero_carteira || '_________________________'}</div>
          </div>
          <div class="campo">
            <div class="campo-label"><span class="numero-campo">08</span> VALIDADE</div>
            <div class="campo-valor">${atendimento.validade_carteira || '___/___/_____'}</div>
          </div>
          <div class="campo">
            <div class="campo-label"><span class="numero-campo">09</span> NOME</div>
            <div class="campo-valor">${atendimento.paciente_nome || '________________________________________'}</div>
          </div>
          <div class="campo">
            <div class="campo-label"><span class="numero-campo">10</span> CNS</div>
            <div class="campo-valor campo-numerico">${atendimento.cns || '_______________________________'}</div>
          </div>
          <div class="campo">
            <div class="campo-label"><span class="numero-campo">11</span> ATENDIMENTO RN</div>
            <div class="campo-valor text-center">${atendimento.atendimento_rn === 'S' ? '[X] SIM' : atendimento.atendimento_rn === 'N' ? '[ ] NÃO' : '[ ] SIM / [ ] NÃO'}</div>
          </div>
          <div class="campo">
            <div class="campo-label"><span class="numero-campo">12</span> DATA NASCIMENTO</div>
            <div class="campo-valor">${atendimento.data_nascimento || '___/___/_____'}</div>
          </div>
        </div>
        
        <!-- ============================================ -->
        <!-- 3 - DADOS DO CONTRATADO SOLICITANTE -->
        <!-- ============================================ -->
        <div class="titulo-secao" style="margin-top: 8px;">3 - DADOS DO CONTRATADO SOLICITANTE</div>
        <div class="grid grid-2" style="border: 1px solid #000; border-top: none;">
          <div class="campo">
            <div class="campo-label"><span class="numero-campo">13</span> NOME DO CONTRATADO</div>
            <div class="campo-valor">${atendimento.nome_contratado || configClinica.nome_contratado || '________________________________________'}</div>
          </div>
          <div class="campo" style="border-left: none;">
            <div class="campo-label"><span class="numero-campo">14</span> CÓDIGO NA OPERADORA</div>
            <div class="campo-valor campo-numerico">${atendimento.codigo_operadora || convenio?.codigo_prestador || '_______________'}</div>
          </div>
        </div>
        <div class="grid grid-6" style="border: 1px solid #000; border-top: none;">
          <div class="campo">
            <div class="campo-label"><span class="numero-campo">15</span> PROFISSIONAL</div>
            <div class="campo-valor">${atendimento.profissional_solicitante || '________________________________________'}</div>
          </div>
          <div class="campo">
            <div class="campo-label"><span class="numero-campo">16</span> CONSELHO</div>
            <div class="campo-valor">${CONSELHO_MAP[atendimento.conselho_solicitante] || '_____'}</div>
          </div>
          <div class="campo">
            <div class="campo-label"><span class="numero-campo">17</span> Nº CONSELHO</div>
            <div class="campo-valor campo-numerico">${atendimento.numero_conselho_solicitante || '_______________'}</div>
          </div>
          <div class="campo">
            <div class="campo-label"><span class="numero-campo">18</span> UF</div>
            <div class="campo-valor">${atendimento.uf_solicitante || '___'}</div>
          </div>
          <div class="campo">
            <div class="campo-label"><span class="numero-campo">19</span> CBO</div>
            <div class="campo-valor campo-numerico">${atendimento.cbos_solicitante || '________'}</div>
          </div>
          <div class="campo">
            <div class="campo-label"><span class="numero-campo">20</span> ASSINATURA</div>
            <div class="campo-valor">_________________________</div>
          </div>
        </div>
        
        <!-- ============================================ -->
        <!-- 4 - SOLICITAÇÃO / PROCEDIMENTOS -->
        <!-- ============================================ -->
        <div class="titulo-secao" style="margin-top: 8px;">4 - SOLICITAÇÃO / PROCEDIMENTOS</div>
        <div class="grid grid-3" style="border: 1px solid #000; border-top: none;">
          <div class="campo">
            <div class="campo-label"><span class="numero-campo">21</span> CARÁTER ATENDIMENTO</div>
            <div class="campo-valor">${atendimento.carater_atendimento === '1' ? 'ELETIVO' : atendimento.carater_atendimento === '2' ? 'URGÊNCIA' : '________'}</div>
          </div>
          <div class="campo">
            <div class="campo-label"><span class="numero-campo">22</span> DATA SOLICITAÇÃO</div>
            <div class="campo-valor">${atendimento.data_solicitacao ? format(new Date(atendimento.data_solicitacao), 'dd/MM/yyyy') : '___/___/_____'}</div>
          </div>
          <div class="campo">
            <div class="campo-label"><span class="numero-campo">23</span> INDICAÇÃO CLÍNICA</div>
            <div class="campo-valor">${atendimento.indicacao_clinica || '________________________________________'}</div>
          </div>
        </div>
        
        <!-- Tabela de Procedimentos Solicitados -->
        <table style="width: 100%; margin-top: 0;">
          <thead>
            <tr>
              <th width="15">Seq</th>
              <th width="30">Tabela</th>
              <th width="45">Código</th>
              <th>Descrição</th>
              <th width="20">Qtd Sol.</th>
              <th width="20">Qtd Aut.</th>
            </tr>
          </thead>
          <tbody>
            ${itensAutorizados.length > 0 ? itensAutorizados.map((item, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td class="text-center">${item.tabela_referencia || '22'}</td>
                <td class="text-center">${item.codigo || '-'}</td>
                <td>${item.nome || '-'}</td>
                <td class="text-center">${item.quantidade_solicitada || '-'}</td>
                <td class="text-center">${item.quantidade_autorizada || 0}</td>
              </tr>
              <tr class="linha-interna"><td colspan="6" style="border: none;"></td></tr>
            `).join('') : `
              <tr>
                <td class="text-center">1</td>
                <td class="text-center">___</td>
                <td class="text-center">_______</td>
                <td>_________________________________________________</td>
                <td class="text-center">__</td>
                <td class="text-center">__</td>
              </tr>
              <tr><td colspan="6" style="height: 80px;"></td></tr>
            `}
          </tbody>
        </table>
        
        <!-- ============================================ -->
        <!-- 5 - DADOS DO CONTRATADO EXECUTANTE -->
        <!-- ============================================ -->
        <div class="titulo-secao" style="margin-top: 8px;">5 - DADOS DO CONTRATADO EXECUTANTE</div>
        <div class="grid grid-3" style="border: 1px solid #000; border-top: none;">
          <div class="campo">
            <div class="campo-label"><span class="numero-campo">24</span> CÓDIGO OPERADORA</div>
            <div class="campo-valor campo-numerico">${atendimento.codigo_operadora_executante || convenio?.codigo_prestador || '_______________'}</div>
          </div>
          <div class="campo">
            <div class="campo-label"><span class="numero-campo">25</span> NOME DO CONTRATADO</div>
            <div class="campo-valor">${atendimento.nome_contratado_executante || configClinica.nome_contratado || '________________________________________'}</div>
          </div>
          <div class="campo">
            <div class="campo-label"><span class="numero-campo">26</span> CNES</div>
            <div class="campo-valor campo-numerico">${configClinica.cnes || atendimento.cnes || '_______'}</div>
          </div>
        </div>
        
        <!-- ============================================ -->
        <!-- 6 - DADOS DO ATENDIMENTO -->
        <!-- ============================================ -->
        <div class="titulo-secao" style="margin-top: 8px;">6 - DADOS DO ATENDIMENTO</div>
        <div class="grid grid-4" style="border: 1px solid #000; border-top: none;">
          <div class="campo">
            <div class="campo-label"><span class="numero-campo">27</span> TIPO ATENDIMENTO</div>
            <div class="campo-valor">${TIPO_ATENDIMENTO_MAP[atendimento.tipo_atendimento] || atendimento.tipo_atendimento || '________'}</div>
          </div>
          <div class="campo">
            <div class="campo-label"><span class="numero-campo">28</span> INDICAÇÃO ACIDENTE</div>
            <div class="campo-valor">${INDICADOR_ACIDENTE_MAP[atendimento.indicacao_acidente] || atendimento.indicacao_acidente || '________'}</div>
          </div>
          <div class="campo">
            <div class="campo-label"><span class="numero-campo">29</span> TIPO CONSULTA</div>
            <div class="campo-valor">${TIPO_CONSULTA_MAP[atendimento.tipo_consulta] || atendimento.tipo_consulta || '________'}</div>
          </div>
          <div class="campo">
            <div class="campo-label"><span class="numero-campo">30</span> MOTIVO ENCERRAMENTO</div>
            <div class="campo-valor">${MOTIVO_ENCERRAMENTO_MAP[atendimento.motivo_encerramento] || atendimento.motivo_encerramento || '________'}</div>
          </div>
        </div>
        
        <!-- ============================================ -->
        <!-- 7 - EXECUÇÃO / PROCEDIMENTOS REALIZADOS -->
        <!-- ============================================ -->
        <div class="titulo-secao" style="margin-top: 8px;">7 - EXECUÇÃO / PROCEDIMENTOS REALIZADOS</div>
        <table style="width: 100%;">
          <thead>
            <tr>
              <th width="12">Seq</th>
              <th width="20">Data</th>
              <th width="15">H.Ini</th>
              <th width="15">H.Fim</th>
              <th width="20">Tabela</th>
              <th width="25">Código</th>
              <th>Descrição</th>
              <th width="12">Qtd</th>
              <th width="15">Via</th>
              <th width="15">Téc</th>
              <th width="15">Red/Acr</th>
              <th width="25">Valor Unit</th>
              <th width="25">Valor Total</th>
            </tr>
          </thead>
          <tbody>
            ${itens.map((item, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td class="text-center">${item.data_execucao || '___/___/___'}</td>
                <td class="text-center">${item.hora_inicial || '__:__'}</td>
                <td class="text-center">${item.hora_final || '__:__'}</td>
                <td class="text-center">${item.tabela_referencia || '22'}</td>
                <td class="text-center">${item.codigo || '_______'}</td>
                <td>${item.nome || '_________________________________________________'}</td>
                <td class="text-center">${item.quantidade || 1}</td>
                <td class="text-center">${VIA_ACESSO_MAP[item.viaAcesso] || item.viaAcesso || '_'}</td>
                <td class="text-center">${TECNICA_MAP[item.tecnicaUtilizada] || item.tecnicaUtilizada || '_'}</td>
                <td class="text-center">${item.reducaoAcrescimo || '1.00'}</td>
                <td class="text-right">R$ ${(item.valor_unitario || 0).toFixed(2)}</td>
                <td class="text-right">R$ ${(item.valor_total || 0).toFixed(2)}</td>
              </tr>
            `).join('')}
            ${itens.length === 0 ? `
              <tr><td colspan="13" style="height: 200px; text-align: center;">Nenhum procedimento registrado</td></tr>
            ` : ''}
          </tbody>
        </table>
        
        <!-- ============================================ -->
        <!-- 8 - IDENTIFICAÇÃO DOS PROFISSIONAIS EXECUTANTES -->
        <!-- ============================================ -->
        <div class="titulo-secao" style="margin-top: 8px;">8 - IDENTIFICAÇÃO DOS PROFISSIONAIS EXECUTANTES</div>
        <table style="width: 100%;">
          <thead>
            <tr>
              <th width="10">Seq</th>
              <th width="20">Grau Part.</th>
              <th width="25">CPF</th>
              <th>Nome</th>
              <th width="15">Cons.</th>
              <th width="20">Nº Conselho</th>
              <th width="10">UF</th>
              <th width="15">CBO</th>
            </tr>
          </thead>
          <tbody>
            ${itens.map((item, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td class="text-center">${GRAU_PARTICIPACAO_MAP[item.grau_participacao] || item.grau_participacao || '___'}</td>
                <td class="text-center campo-numerico">${item.prestador_cpf || '_______________'}</td>
                <td>${item.prestador_nome || '________________________________________'}</td>
                <td class="text-center">${CONSELHO_MAP[item.prestador_conselho] || item.prestador_conselho || '___'}</td>
                <td class="text-center campo-numerico">${item.prestador_numero_conselho || '_______________'}</td>
                <td class="text-center">${item.prestador_uf_conselho || '___'}</td>
                <td class="text-center campo-numerico">${item.prestador_cbos || '________'}</td>
              </tr>
            `).join('')}
            ${itens.length === 0 ? `
              <tr><td colspan="8" style="height: 100px; text-align: center;">Nenhum profissional registrado</td></tr>
            ` : ''}
          </tbody>
        </table>
        
        <!-- ============================================ -->
        <!-- 9 - VALORES TOTAIS -->
        <!-- ============================================ -->
        <div class="titulo-secao" style="margin-top: 8px;">9 - VALORES TOTAIS (R$)</div>
        <div class="grid grid-8" style="border: 1px solid #000; border-top: none;">
          <div class="campo"><div class="campo-label">31- Procedimentos</div><div class="campo-valor text-right">R$ ${totalProcedimentos.toFixed(2)}</div></div>
          <div class="campo"><div class="campo-label">32- Taxas/Aluguéis</div><div class="campo-valor text-right">R$ ${totalTaxas.toFixed(2)}</div></div>
          <div class="campo"><div class="campo-label">33- Materiais</div><div class="campo-valor text-right">R$ ${totalMateriais.toFixed(2)}</div></div>
          <div class="campo"><div class="campo-label">34- OPME</div><div class="campo-valor text-right">R$ ${totalOPME.toFixed(2)}</div></div>
          <div class="campo"><div class="campo-label">35- Medicamentos</div><div class="campo-valor text-right">R$ ${totalMedicamentos.toFixed(2)}</div></div>
          <div class="campo"><div class="campo-label">36- Gases</div><div class="campo-valor text-right">R$ ${totalGases.toFixed(2)}</div></div>
          <div class="campo"><div class="campo-label">37- TOTAL GERAL</div><div class="campo-valor text-right"><strong>R$ ${totalGeral.toFixed(2)}</strong></div></div>
          <div class="campo"><div class="campo-label">38- FORMA PAGTO</div><div class="campo-valor">_______________</div></div>
        </div>
        
        <!-- ============================================ -->
        <!-- 10 - OBSERVAÇÕES / ASSINATURAS -->
        <!-- ============================================ -->
        <div class="titulo-secao" style="margin-top: 8px;">10 - OBSERVAÇÕES / ASSINATURAS</div>
        <div class="grid grid-1" style="border: 1px solid #000; border-top: none;">
          <div class="campo">
            <div class="campo-label">OBSERVAÇÕES</div>
            <div class="campo-valor" style="min-height: 40px;">${atendimento.observacao || '_________________________________________________________________'}</div>
          </div>
        </div>
        
        <div class="assinatura">
          <div class="assinatura-item">
            <div class="linha-assinatura"></div>
            <div class="campo-label">ASSINATURA DO RESPONSÁVEL</div>
          </div>
          <div class="assinatura-item">
            <div class="linha-assinatura"></div>
            <div class="campo-label">ASSINATURA DO BENEFICIÁRIO</div>
          </div>
          <div class="assinatura-item">
            <div class="linha-assinatura"></div>
            <div class="campo-label">ASSINATURA DO CONTRATADO</div>
          </div>
        </div>
        
        <!-- Rodapé -->
        <div class="rodape">
          <div style="font-size: 6pt; text-align: center;">
            Documento gerado eletronicamente - Sistema de Faturamento TISS - ${new Date().toLocaleString()}
          </div>
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
  let htmlCompleto = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Múltiplas Guias TISS</title><style>${gerarHTMLGuiaTISSOficial(guias[0], convenio, configClinica).match(/<style>([\\s\\S]*?)<\/style>/)?.[1] || ''}</style></head><body>`;
  
  guias.forEach((guia, index) => {
    const guiaHtml = gerarHTMLGuiaTISSOficial(guia, convenio, configClinica);
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
  printWindow.onafterprint = () => printWindow.close();
};
