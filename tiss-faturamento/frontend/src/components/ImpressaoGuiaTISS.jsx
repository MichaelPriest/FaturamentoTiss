// src/components/ImpressaoGuiaTISS.jsx

import React from 'react';
import { format } from 'date-fns';

/* =========================================================
   MAPAS
========================================================= */

const TIPO_ATENDIMENTO_MAP = {
  '01': 'Remoção',
  '02': 'Pequena Cirurgia',
  '03': 'Outras Terapias',
  '04': 'Consulta',
  '08': 'Quimioterapia',
  '09': 'Radioterapia',
  '10': 'TRS',
  '13': 'Pequenos Atendimentos',
  '23': 'Exame'
};

const INDICADOR_ACIDENTE_MAP = {
  '0': 'Trabalho',
  '1': 'Trânsito',
  '2': 'Outros',
  '9': 'Não Acidente'
};

const TIPO_CONSULTA_MAP = {
  '1': 'Primeira',
  '2': 'Seguimento',
  '3': 'Pré-Natal',
  '4': 'Última'
};

const MOTIVO_ENCERRAMENTO_MAP = {
  '11': 'Alta Curado',
  '12': 'Alta Melhorado',
  '14': 'Alta Pedido',
  '31': 'Transferido',
  '41': 'Óbito'
};

const GRAU_PARTICIPACAO_MAP = {
  '00': 'Cirurgião',
  '01': '1º Aux',
  '02': '2º Aux',
  '03': '3º Aux',
  '04': '4º Aux',
  '05': 'Instrumentador',
  '06': 'Anestesista',
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
  '1': '1',
  '2': '2',
  '3': '3'
};

const TECNICA_MAP = {
  '1': '1',
  '2': '2',
  '3': '3'
};

/* =========================================================
   HELPERS
========================================================= */

const moeda = (valor) =>
  Number(valor || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const formatarData = (data) => {
  if (!data) return '';
  try {
    return format(new Date(data), 'dd/MM/yyyy');
  } catch {
    return data;
  }
};

const dividirEmPaginas = (itens) => {
  const MAX = 7;
  const paginas = [];

  for (let i = 0; i < itens.length; i += MAX) {
    paginas.push({
      numero_pagina: paginas.length + 1,
      itens: itens.slice(i, i + MAX),
      total_paginas: Math.ceil(itens.length / MAX)
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

/* =========================================================
   CSS
========================================================= */

const gerarCSS = () => {
  return `
    *{
      margin:0;
      padding:0;
      box-sizing:border-box;
    }

    body{
      font-family: Arial, Helvetica, sans-serif;
      background:#fff;
      color:#000;
    }

    .print-container{
      width:100%;
    }

    .guia-page{
      width:297mm;
      min-height:210mm;
      margin:0 auto;
      background:#fff;
      page-break-after:always;
      overflow:hidden;
    }

    .guia-page:last-child{
      page-break-after:auto;
    }

    .guia-container{
      padding:4mm;
      width:100%;
    }

    .grid{
      display:grid;
      width:100%;
    }

    .grid-2{ grid-template-columns:1fr 1fr; }
    .grid-3{ grid-template-columns:1fr 1fr 1fr; }
    .grid-4{ grid-template-columns:repeat(4,1fr); }
    .grid-5{ grid-template-columns:repeat(5,1fr); }
    .grid-6{ grid-template-columns:repeat(6,1fr); }
    .grid-8{ grid-template-columns:repeat(8,1fr); }

    .titulo-principal{
      font-size:10pt;
      font-weight:bold;
      text-align:center;
      line-height:1.1;
      margin-top:2px;
    }

    .titulo-secao{
      background:#d9d9d9;
      border:1px solid #000;
      border-bottom:none;
      padding:2px 4px;
      font-size:7pt;
      font-weight:bold;
      text-transform:uppercase;
    }

    .campo{
      border:1px solid #000;
      padding:2px 3px;
      min-height:28px;
      font-size:7pt;
      line-height:1.1;
      overflow:hidden;
    }

    .numero-campo{
      font-weight:bold;
      font-size:6pt;
    }

    .label{
      font-size:6pt;
    }

    .valor{
      font-size:8pt;
      font-weight:bold;
      margin-top:2px;
      word-break:break-word;
    }

    .altura-fixa{
      height:28px;
    }

    .altura-media{
      height:42px;
    }

    .altura-grande{
      height:60px;
    }

    table{
      width:100%;
      border-collapse:collapse;
      table-layout:fixed;
      font-size:6.5pt;
    }

    th{
      border:1px solid #000;
      background:#d9d9d9;
      padding:2px;
      font-size:6pt;
      line-height:1;
      font-weight:bold;
      text-align:center;
      vertical-align:middle;
    }

    td{
      border:1px solid #000;
      padding:2px;
      line-height:1.1;
      vertical-align:top;
      word-wrap:break-word;
    }

    .text-center{
      text-align:center;
    }

    .text-right{
      text-align:right;
    }

    .text-left{
      text-align:left;
    }

    .assinatura{
      display:grid;
      grid-template-columns:1fr 1fr 1fr;
      gap:10px;
      margin-top:10px;
    }

    .assinatura-item{
      font-size:6pt;
      text-align:center;
    }

    .linha-assinatura{
      border-top:1px solid #000;
      margin-top:18px;
      padding-top:2px;
    }

    .rodape{
      margin-top:4px;
      font-size:5pt;
      text-align:center;
    }

    .pagina-info{
      font-size:7pt;
      margin-top:2px;
    }

    .aviso-continuacao{
      border:1px solid #000;
      padding:5px;
      text-align:center;
      font-size:8pt;
      font-weight:bold;
    }

    .tabela-wrapper{
      width:100%;
      overflow:hidden;
    }

    @media print{

      body{
        margin:0;
        padding:0;
      }

      .guia-page{
        width:297mm;
        height:210mm;
        margin:0;
      }

      .titulo-secao,
      th{
        background:#d9d9d9 !important;
        -webkit-print-color-adjust:exact;
        print-color-adjust:exact;
      }

      @page{
        size:A4 landscape;
        margin:4mm;
      }
    }
  `;
};

/* =========================================================
   COMPONENTE DE CAMPO
========================================================= */

const campo = (numero, label, valor, classe = 'altura-fixa') => `
  <div class="campo ${classe}">
    <div class="label">
      <span class="numero-campo">${numero}</span>
      ${label}
    </div>

    <div class="valor">
      ${valor || ''}
    </div>
  </div>
`;

/* =========================================================
   PÁGINA
========================================================= */

const gerarPaginaGuia = (
  atendimento,
  convenio,
  configClinica,
  paginaAtual,
  totalPaginas,
  itensPagina
) => {

  const totalTodosItens = (atendimento.itens || []).reduce(
    (s, i) => s + Number(i.valor_total || 0),
    0
  );

  const ehUltimaPagina = paginaAtual === totalPaginas;

  return `
  <div class="guia-page">

    <div class="guia-container">

      <!-- CABEÇALHO -->

      <div class="grid grid-3">

        <div class="campo altura-media">
          <div class="valor">
            ${configClinica.nome_empresa || ''}
          </div>

          <div style="font-size:6pt;">
            CNPJ: ${configClinica.cnpj || ''}
          </div>

          <div style="font-size:6pt;">
            CNES: ${configClinica.cnes || ''}
          </div>
        </div>

        <div class="campo altura-media text-center">

          <div class="titulo-principal">
            GUIA DE SERVIÇO PROFISSIONAL /
          </div>

          <div class="titulo-principal">
            SERVIÇO AUXILIAR DE DIAGNÓSTICO E TERAPIA
          </div>

          <div style="font-size:9pt;font-weight:bold;">
            SP/SADT
          </div>

          ${
            totalPaginas > 1
              ? `<div class="pagina-info">
                  Página ${paginaAtual} de ${totalPaginas}
                </div>`
              : ''
          }

        </div>

        <div class="campo altura-media text-center">

          <div style="font-size:7pt;">
            Nº Guia Prestador
          </div>

          <div style="font-size:14pt;font-weight:bold;margin-top:4px;">
            ${atendimento.numero_guia_prestador || '1000000'}
          </div>

        </div>

      </div>

      <!-- REGISTRO -->

      <div class="titulo-secao">
        1 - Registro ANS / Autorização
      </div>

      <div class="grid grid-5">

        ${campo('01', 'Registro ANS', convenio?.registro_ans)}
        ${campo('02', 'Nº Guia Principal', atendimento.guia_principal)}
        ${campo('03', 'Data Autorização', formatarData(atendimento.data_autorizacao))}
        ${campo('04', 'Senha', atendimento.senha_autorizacao)}
        ${campo('05', 'Validade Senha', formatarData(atendimento.data_validade_senha))}

      </div>

      <div class="grid grid-2">

        ${campo('06', 'Nº Guia Operadora', atendimento.numero_guia_operadora)}
        ${campo('', '', '')}

      </div>

      <!-- BENEFICIARIO -->

      <div class="titulo-secao">
        2 - Dados do Beneficiário
      </div>

      <div class="grid grid-6">

        ${campo('07', 'Número Carteira', atendimento.numero_carteira)}
        ${campo('08', 'Validade', atendimento.validade_carteira)}
        ${campo('09', 'Nome', atendimento.paciente_nome)}
        ${campo('10', 'CNS', atendimento.cns)}
        ${campo('11', 'Atendimento RN', atendimento.atendimento_rn)}
        ${campo('12', 'Nascimento', atendimento.data_nascimento)}

      </div>

      <!-- SOLICITANTE -->

      <div class="titulo-secao">
        3 - Dados do Solicitante
      </div>

      <div class="grid grid-2">

        ${campo(
          '13',
          'Nome Contratado',
          atendimento.nome_contratado || configClinica.nome_empresa
        )}

        ${campo(
          '14',
          'Código Operadora',
          convenio?.codigo_prestador
        )}

      </div>

      <div class="grid grid-6">

        ${campo('15', 'Profissional', atendimento.profissional_solicitante)}
        ${campo('16', 'Conselho', CONSELHO_MAP[atendimento.conselho_solicitante])}
        ${campo('17', 'Número Conselho', atendimento.numero_conselho_solicitante)}
        ${campo('18', 'UF', atendimento.uf_solicitante)}
        ${campo('19', 'CBO', atendimento.cbos_solicitante)}
        ${campo('20', 'Assinatura', '________________')}

      </div>

      <!-- PROCEDIMENTOS -->

      <div class="titulo-secao">
        4 - Solicitação / Procedimentos
      </div>

      <table>

        <thead>
          <tr>
            <th style="width:5%">Seq</th>
            <th style="width:8%">Tabela</th>
            <th style="width:12%">Código</th>
            <th style="width:50%">Descrição</th>
            <th style="width:12%">Qtd Sol.</th>
            <th style="width:13%">Qtd Aut.</th>
          </tr>
        </thead>

        <tbody>

          ${
            atendimento.itens_autorizados?.length
              ? atendimento.itens_autorizados.map((item, idx) => `
                <tr>

                  <td class="text-center">${idx + 1}</td>

                  <td class="text-center">
                    ${item.tabela_referencia || '22'}
                  </td>

                  <td class="text-center">
                    ${item.codigo || ''}
                  </td>

                  <td>
                    ${(item.nome || '').substring(0, 90)}
                  </td>

                  <td class="text-center">
                    ${item.quantidade_solicitada || '1'}
                  </td>

                  <td class="text-center">
                    ${item.quantidade_autorizada || '1'}
                  </td>

                </tr>
              `).join('')
              : `
                <tr>
                  <td colspan="6" style="height:40px;text-align:center;">
                    Nenhum procedimento
                  </td>
                </tr>
              `
          }

        </tbody>

      </table>

      <!-- EXECUTANTE -->

      <div class="titulo-secao">
        5 - Dados do Contratado Executante
      </div>

      <div class="grid grid-3">

        ${campo('24', 'Código Operadora', convenio?.codigo_prestador)}

        ${campo(
          '25',
          'Nome Contratado',
          atendimento.nome_contratado_executante ||
          configClinica.nome_empresa
        )}

        ${campo('26', 'CNES', configClinica.cnes)}

      </div>

      <!-- ATENDIMENTO -->

      <div class="titulo-secao">
        6 - Dados do Atendimento
      </div>

      <div class="grid grid-4">

        ${campo(
          '27',
          'Tipo Atendimento',
          TIPO_ATENDIMENTO_MAP[atendimento.tipo_atendimento]
        )}

        ${campo(
          '28',
          'Indicação Acidente',
          INDICADOR_ACIDENTE_MAP[atendimento.indicacao_acidente]
        )}

        ${campo(
          '29',
          'Tipo Consulta',
          TIPO_CONSULTA_MAP[atendimento.tipo_consulta]
        )}

        ${campo(
          '30',
          'Motivo Encerramento',
          MOTIVO_ENCERRAMENTO_MAP[atendimento.motivo_encerramento]
        )}

      </div>

      <!-- EXECUÇÃO -->

      <div class="titulo-secao">
        7 - Execução / Procedimentos Realizados
      </div>

      <table>

        <thead>

          <tr>

            <th style="width:4%">Seq</th>
            <th style="width:8%">Data</th>
            <th style="width:7%">H.Ini</th>
            <th style="width:7%">H.Fim</th>
            <th style="width:6%">Tabela</th>
            <th style="width:10%">Código</th>
            <th style="width:30%">Descrição</th>
            <th style="width:5%">Qtd</th>
            <th style="width:4%">Via</th>
            <th style="width:4%">Tec</th>
            <th style="width:7%">Unit</th>
            <th style="width:8%">Total</th>

          </tr>

        </thead>

        <tbody>

          ${
            itensPagina.length
              ? itensPagina.map((item, idx) => `
                <tr>

                  <td class="text-center">
                    ${idx + 1}
                  </td>

                  <td class="text-center">
                    ${item.data_execucao || ''}
                  </td>

                  <td class="text-center">
                    ${item.hora_inicial || ''}
                  </td>

                  <td class="text-center">
                    ${item.hora_final || ''}
                  </td>

                  <td class="text-center">
                    ${item.tabela_referencia || '22'}
                  </td>

                  <td class="text-center">
                    ${item.codigo || ''}
                  </td>

                  <td>
                    ${(item.nome || '').substring(0, 90)}
                  </td>

                  <td class="text-center">
                    ${item.quantidade || 1}
                  </td>

                  <td class="text-center">
                    ${VIA_ACESSO_MAP[item.viaAcesso] || ''}
                  </td>

                  <td class="text-center">
                    ${TECNICA_MAP[item.tecnicaUtilizada] || ''}
                  </td>

                  <td class="text-right">
                    ${moeda(item.valor_unitario)}
                  </td>

                  <td class="text-right">
                    ${moeda(item.valor_total)}
                  </td>

                </tr>
              `).join('')
              : `
                <tr>
                  <td colspan="12" style="height:60px;text-align:center;">
                    Nenhum procedimento
                  </td>
                </tr>
              `
          }

        </tbody>

      </table>

      <!-- PROFISSIONAIS -->

      <div class="titulo-secao">
        8 - Identificação dos Profissionais Executantes
      </div>

      <table>

        <thead>

          <tr>

            <th style="width:4%">Seq</th>
            <th style="width:10%">Grau</th>
            <th style="width:14%">CPF</th>
            <th style="width:32%">Nome</th>
            <th style="width:8%">Cons.</th>
            <th style="width:14%">Nº Conselho</th>
            <th style="width:6%">UF</th>
            <th style="width:12%">CBO</th>

          </tr>

        </thead>

        <tbody>

          ${
            itensPagina.length
              ? itensPagina.map((item, idx) => `
                <tr>

                  <td class="text-center">${idx + 1}</td>

                  <td class="text-center">
                    ${GRAU_PARTICIPACAO_MAP[item.grau_participacao] || ''}
                  </td>

                  <td class="text-center">
                    ${item.prestador_cpf || ''}
                  </td>

                  <td>
                    ${(item.prestador_nome || '').substring(0, 70)}
                  </td>

                  <td class="text-center">
                    ${CONSELHO_MAP[item.prestador_conselho] || ''}
                  </td>

                  <td class="text-center">
                    ${item.prestador_numero_conselho || ''}
                  </td>

                  <td class="text-center">
                    ${item.prestador_uf_conselho || ''}
                  </td>

                  <td class="text-center">
                    ${item.prestador_cbos || ''}
                  </td>

                </tr>
              `).join('')
              : `
                <tr>
                  <td colspan="8" style="height:50px;text-align:center;">
                    Nenhum profissional
                  </td>
                </tr>
              `
          }

        </tbody>

      </table>

      ${
        ehUltimaPagina
          ? `
          <!-- VALORES -->

          <div class="titulo-secao">
            9 - Valores Totais
          </div>

          <div class="grid grid-8">

            ${campo('31', 'Procedimentos', moeda(totalTodosItens))}
            ${campo('32', 'Taxas', '0,00')}
            ${campo('33', 'Materiais', '0,00')}
            ${campo('34', 'OPME', '0,00')}
            ${campo('35', 'Medicamentos', '0,00')}
            ${campo('36', 'Gases', '0,00')}
            ${campo('37', 'Total Geral', moeda(totalTodosItens))}
            ${campo('38', 'Forma Pagto', '')}

          </div>

          <!-- OBS -->

          <div class="titulo-secao">
            10 - Observações
          </div>

          <div class="campo altura-grande">
            ${atendimento.observacao || ''}
          </div>

          <!-- ASSINATURAS -->

          <div class="assinatura">

            <div class="assinatura-item">
              <div class="linha-assinatura"></div>
              Assinatura Responsável
            </div>

            <div class="assinatura-item">
              <div class="linha-assinatura"></div>
              Assinatura Beneficiário
            </div>

            <div class="assinatura-item">
              <div class="linha-assinatura"></div>
              Assinatura Contratado
            </div>

          </div>
        `
          : `
            <div class="aviso-continuacao">
              CONTINUA NA PRÓXIMA PÁGINA
            </div>
          `
      }

      <div class="rodape">
        Documento gerado eletronicamente
      </div>

    </div>

  </div>
  `;
};

/* =========================================================
   HTML COMPLETO
========================================================= */

export const gerarHTMLGuiaTISSOficial = (
  atendimento,
  convenio,
  configClinica = {}
) => {

  const paginas = dividirEmPaginas(atendimento.itens || []);

  const paginasHTML = paginas.map((pagina) =>
    gerarPaginaGuia(
      atendimento,
      convenio,
      configClinica,
      pagina.numero_pagina,
      pagina.total_paginas,
      pagina.itens
    )
  );

  return `
  <!DOCTYPE html>

  <html>

    <head>

      <meta charset="UTF-8" />

      <title>
        Guia TISS
      </title>

      <style>
        ${gerarCSS()}
      </style>

    </head>

    <body>

      <div class="print-container">

        ${paginasHTML.join('')}

      </div>

    </body>

  </html>
  `;
};

/* =========================================================
   IMPRIMIR
========================================================= */

export const imprimirGuiaTISSOficial = (
  atendimento,
  convenio,
  configClinica = {}
) => {

  const html = gerarHTMLGuiaTISSOficial(
    atendimento,
    convenio,
    configClinica
  );

  const win = window.open(
    '',
    '_blank',
    'width=1200,height=900'
  );

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
