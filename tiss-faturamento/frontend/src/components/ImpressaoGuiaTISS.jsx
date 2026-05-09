// src/components/ImpressaoGuiaTISS.jsx

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
  '0': 'Ac. Trabalho',
  '1': 'Ac. Trânsito',
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

/* =========================================================
   HELPERS
========================================================= */

const moeda = (valor) =>
  Number(valor || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const dataBR = (data) => {
  if (!data) return '';

  try {
    return format(new Date(data), 'dd/MM/yyyy');
  } catch {
    return data;
  }
};

const dividirEmPaginas = (itens = []) => {

  const MAX = 8;

  const paginas = [];

  for (let i = 0; i < itens.length; i += MAX) {

    paginas.push({
      numero: paginas.length + 1,
      total: Math.ceil(itens.length / MAX),
      itens: itens.slice(i, i + MAX)
    });

  }

  if (!paginas.length) {

    paginas.push({
      numero: 1,
      total: 1,
      itens: []
    });

  }

  return paginas;

};

/* =========================================================
   CSS
========================================================= */

const gerarCSS = () => `

*{
  margin:0;
  padding:0;
  box-sizing:border-box;
}

body{
  font-family:Arial, Helvetica, sans-serif;
  background:#FFF;
  color:#000;
}

.guia-page{
  width:297mm;
  min-height:210mm;
  margin:0 auto;
  padding:4mm;
  background:#FFF;
  page-break-after:always;
}

.guia-page:last-child{
  page-break-after:auto;
}

table{
  width:100%;
  border-collapse:collapse;
  table-layout:fixed;
  margin-bottom:2px;
  font-size:9px;
}

td{
  border:1px solid #000;
  padding:2px;
  vertical-align:top;
  font-size:9px;
  line-height:1.1;
}

th{
  border:1px solid #000;
  padding:2px;
  background:#d9d9d9;
  font-size:8px;
  font-weight:bold;
  text-align:center;
  line-height:1.1;
}

.secao{
  background:#d9d9d9;
  font-size:8px;
  font-weight:bold;
  padding:2px 4px;
}

.campo-numero{
  font-size:7px;
  line-height:1;
  min-height:10px;
}

.campo-valor{
  font-size:9px;
  font-weight:bold;
  line-height:1.1;
  margin-top:2px;
  word-break:break-word;
}

.titulo-guia{
  font-size:11px;
  font-weight:bold;
  text-align:center;
  line-height:1.2;
}

.numero-guia-label{
  font-size:8px;
}

.numero-guia{
  font-size:22px;
  font-weight:bold;
  text-align:center;
  margin-top:5px;
}

.empresa-nome{
  font-size:9px;
  font-weight:bold;
}

.empresa-info{
  font-size:7px;
  margin-top:2px;
}

.text-center{
  text-align:center;
}

.text-right{
  text-align:right;
}

.linha-assinatura{
  height:45px;
  vertical-align:bottom;
  text-align:center;
  font-size:7px;
}

.linha-assinatura div{
  border-top:1px solid #000;
  padding-top:2px;
}

/* =========================================================
   PROCEDIMENTOS
========================================================= */

.tabela-procedimentos{
  width:100%;
  border-collapse:collapse;
  table-layout:fixed;
  margin-bottom:2px;
}

.tabela-procedimentos th{
  border:1px solid #000;
  background:#d9d9d9;
  font-size:8px !important;
  font-weight:bold;
  text-align:center;
  padding:2px;
  line-height:1.1;
  vertical-align:middle;
}

.tabela-procedimentos td{
  border:1px solid #000;
  font-size:9px !important;
  padding:2px;
  line-height:1.15;
  vertical-align:top;
  word-break:break-word;
  overflow-wrap:break-word;
}

.tabela-procedimentos .descricao{
  font-size:9px !important;
  line-height:1.15;
  white-space:normal;
  word-break:break-word;
  overflow-wrap:break-word;
  text-align:left;
  vertical-align:top;
}

@page{
  size:A4 landscape;
  margin:4mm;
}

@media print{

  body{
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact;
  }

  th,
  .secao{
    background:#d9d9d9 !important;
  }

}

`;

/* =========================================================
   CAMPO
========================================================= */

const campo = (numero, titulo, valor = '') => `
<td>

  <div class="campo-numero">
    ${numero} - ${titulo}
  </div>

  <div class="campo-valor">
    ${valor || '&nbsp;'}
  </div>

</td>
`;

/* =========================================================
   PAGINA
========================================================= */

const gerarPagina = (
  atendimento,
  convenio,
  configClinica,
  itensPagina
) => {

  const total = (atendimento.itens || []).reduce(
    (s, i) => s + Number(i.valor_total || 0),
    0
  );

  return `

<div class="guia-page">

<!-- CABEÇALHO -->

<table>

<tr>

<td style="width:22%;height:55px;">

<div class="empresa-nome">
${configClinica.nome_empresa || ''}
</div>

<div class="empresa-info">
CNPJ: ${configClinica.cnpj || ''}
</div>

<div class="empresa-info">
CNES: ${configClinica.cnes || ''}
</div>

</td>

<td style="width:56%;vertical-align:middle;">

<div class="titulo-guia">
GUIA DE SERVIÇO PROFISSIONAL / SERVIÇO AUXILIAR DE
</div>

<div class="titulo-guia">
DIAGNÓSTICO E TERAPIA - SP/SADT
</div>

</td>

<td style="width:22%;">

<div class="numero-guia-label">
Nº Guia no Prestador
</div>

<div class="numero-guia">
${atendimento.numero_guia_prestador || '1000000'}
</div>

</td>

</tr>

</table>

<!-- BENEFICIARIO -->

<table>

<tr>
<td colspan="6" class="secao">
Dados do Beneficiário
</td>
</tr>

<tr>

${campo('8', 'Número Carteira', atendimento.numero_carteira)}

${campo('9', 'Validade', atendimento.validade_carteira)}

${campo('10', 'Nome', atendimento.paciente_nome)}

${campo('11', 'CNS', atendimento.cns)}

${campo('12', 'RN', atendimento.atendimento_rn)}

${campo('13', 'Nascimento', atendimento.data_nascimento)}

</tr>

</table>

<!-- PROCEDIMENTOS -->

<table class="tabela-procedimentos">

<tr>

<td colspan="12" class="secao">

Procedimentos Realizados

</td>

</tr>

<tr>

<th style="width:8%">
Data
</th>

<th style="width:6%">
Hora
</th>

<th style="width:5%">
Tabela
</th>

<th style="width:9%">
Código
</th>

<th style="width:34%">
Descrição
</th>

<th style="width:4%">
Qtd
</th>

<th style="width:4%">
Via
</th>

<th style="width:4%">
Tec
</th>

<th style="width:6%">
Fator
</th>

<th style="width:8%">
Valor Unit.
</th>

<th style="width:8%">
Valor Total
</th>

<th style="width:4%">
Seq
</th>

</tr>

${
  itensPagina.length > 0

    ? itensPagina.map((item, idx) => `

      <tr>

      <td class="text-center">
      ${item.data_execucao || ''}
      </td>

      <td class="text-center">
      ${item.hora_inicial || ''}
      </td>

      <td class="text-center">
      ${item.tabela_referencia || '22'}
      </td>

      <td class="text-center">
      ${item.codigo || ''}
      </td>

      <td class="descricao">

      ${(item.nome || '')
        .replace(/\n/g, '<br>')
        .substring(0, 180)}

      </td>

      <td class="text-center">
      ${item.quantidade || '1'}
      </td>

      <td class="text-center">
      ${item.viaAcesso || '1'}
      </td>

      <td class="text-center">
      ${item.tecnicaUtilizada || '1'}
      </td>

      <td class="text-center">
      1,00
      </td>

      <td class="text-right">
      ${moeda(item.valor_unitario)}
      </td>

      <td class="text-right">
      ${moeda(item.valor_total)}
      </td>

      <td class="text-center">
      ${idx + 1}
      </td>

      </tr>

    `).join('')

    : `

      <tr>

      <td colspan="12" style="height:55px;">
      </td>

      </tr>

    `
}

</table>

<!-- PROFISSIONAIS -->

<table>

<tr>

<td colspan="8" class="secao">
Profissionais Executantes
</td>

</tr>

<tr>

<th>Seq</th>
<th>Grau</th>
<th>CPF</th>
<th>Nome</th>
<th>Conselho</th>
<th>Nº Conselho</th>
<th>UF</th>
<th>CBO</th>

</tr>

${
  itensPagina.map((item, idx) => `

  <tr>

  <td class="text-center">
  ${idx + 1}
  </td>

  <td class="text-center">
  ${GRAU_PARTICIPACAO_MAP[item.grau_participacao] || ''}
  </td>

  <td class="text-center">
  ${item.prestador_cpf || ''}
  </td>

  <td>
  ${item.prestador_nome || ''}
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
}

</table>

<!-- TOTAL -->

<table>

<tr>

<td colspan="7" class="secao">
Valores Totais
</td>

</tr>

<tr>

${campo('59', 'Procedimentos', moeda(total))}
${campo('60', 'Taxas', '0,00')}
${campo('61', 'Materiais', '0,00')}
${campo('62', 'OPME', '0,00')}
${campo('63', 'Medicamentos', '0,00')}
${campo('64', 'Gases', '0,00')}
${campo('65', 'Total Geral', moeda(total))}

</tr>

</table>

<!-- ASSINATURAS -->

<table>

<tr>

<td class="linha-assinatura">
<div>Assinatura Responsável</div>
</td>

<td class="linha-assinatura">
<div>Assinatura Beneficiário</div>
</td>

<td class="linha-assinatura">
<div>Assinatura Contratado</div>
</td>

</tr>

</table>

</div>

`;
};

/* =========================================================
   HTML
========================================================= */

export const gerarHTMLGuiaTISSOficial = (
  atendimento,
  convenio,
  configClinica = {}
) => {

  const paginas = dividirEmPaginas(
    atendimento.itens || []
  );

  const paginasHTML = paginas.map((pagina) =>
    gerarPagina(
      atendimento,
      convenio,
      configClinica,
      pagina.itens
    )
  ).join('');

  return `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8"/>

<title>
Guia TISS
</title>

<style>
${gerarCSS()}
</style>

</head>

<body>

${paginasHTML}

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
    'width=1400,height=900'
  );

  if (!win) {
    alert('Permita popups.');
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
   MULTIPLAS GUIAS
========================================================= */

export const imprimirMultiplasGuiasTISS = (
  guias,
  convenio,
  configClinica = {}
) => {

  if (!guias?.length) {
    alert('Nenhuma guia.');
    return;
  }

  let htmlFinal = `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8"/>

<style>
${gerarCSS()}
</style>

</head>

<body>
`;

  guias.forEach((guia) => {

    const html = gerarHTMLGuiaTISSOficial(
      guia,
      convenio,
      configClinica
    );

    const match = html.match(
      /<body[^>]*>([\s\S]*)<\/body>/i
    );

    if (match?.[1]) {
      htmlFinal += match[1];
    }

  });

  htmlFinal += `
</body>
</html>
`;

  const win = window.open(
    '',
    '_blank',
    'width=1400,height=900'
  );

  if (!win) {
    alert('Permita popups.');
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
