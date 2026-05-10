// src/components/ImpressaoGuiaTISS.jsx

import { format } from 'date-fns';

/* =========================================================
   MAPAS
========================================================= */

const CONSELHO_MAP = {
  '06': 'CRM',
  '08': 'CRO',
  '03': 'CRF',
  '02': 'COREN',
  '05': 'CREFITO',
  '09': 'CRP',
  '07': 'CRN'
};

const GRAU_PARTICIPACAO_MAP = {
  '00': '0',
  '01': '1',
  '02': '2',
  '03': '3',
  '04': '4',
  '05': '5',
  '06': '6',
  '12': '12',
  '13': '13'
};

const TIPO_ATENDIMENTO_MAP = {
  '01': 'Remoção',
  '02': 'Pequena Cirurgia',
  '03': 'Terapias',
  '04': 'Consulta',
  '08': 'Quimioterapia',
  '09': 'Radioterapia',
  '10': 'TRS',
  '13': 'Peq. Atendimento',
  '23': 'Exame'
};

const INDICADOR_ACIDENTE_MAP = {
  '0': '0',
  '1': '1',
  '2': '2',
  '9': '9'
};

const TIPO_CONSULTA_MAP = {
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4'
};

/* =========================================================
   HELPERS
========================================================= */

const formatarData = (data) => {
  if (!data) return '';

  try {
    return format(new Date(data), 'dd/MM/yyyy');
  } catch {
    return data;
  }
};

const moeda = (v) =>
  Number(v || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const limitar = (txt = '', max = 150) => {

  if (!txt) return '';

  return txt.length > max
    ? txt.substring(0, max) + '...'
    : txt;
};

const dividirPaginas = (itens = []) => {

  const MAX = 8;

  const paginas = [];

  for (let i = 0; i < itens.length; i += MAX) {

    paginas.push({
      itens: itens.slice(i, i + MAX)
    });

  }

  if (!paginas.length) {

    paginas.push({
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
  padding:3mm;
  margin:0 auto;
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
}

td{
  border:1px solid #000;
  padding:1px 2px;
  vertical-align:top;
  font-size:6.5px;
  line-height:1.1;
  word-break:break-word;
}

th{
  border:1px solid #000;
  padding:1px;
  background:#d9d9d9;
  font-size:6px;
  font-weight:bold;
  text-align:center;
}

.secao{
  background:#d9d9d9;
  font-weight:bold;
  font-size:6px;
}

.label{
  font-size:5.8px;
}

.valor{
  font-size:6.8px;
  font-weight:bold;
  margin-top:1px;
}

.text-center{
  text-align:center;
}

.text-right{
  text-align:right;
}

.titulo{
  font-size:11px;
  font-weight:bold;
  text-align:center;
  line-height:1.2;
}

.numero-guia{
  font-size:18px;
  font-weight:bold;
  text-align:center;
}

.proc-table td{
  font-size:6.5px;
}

.proc-desc{
  width:auto;
  min-width:220px;
  white-space:normal;
  word-break:break-word;
}

.ass{
  height:42px;
  vertical-align:bottom;
  text-align:center;
  font-size:6px;
}

.ass div{
  border-top:1px solid #000;
  padding-top:2px;
}

.serie{
  height:16px;
}

@page{
  size:A4 landscape;
  margin:3mm;
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

const campo = (
  numero,
  titulo,
  valor = '',
  colspan = 1
) => `

<td colspan="${colspan}">

<div class="label">
${numero}- ${titulo}
</div>

<div class="valor">
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

  const totalProcedimentos = (atendimento.itens || []).reduce(
    (s, i) => s + Number(i.valor_total || 0),
    0
  );

  return `

<div class="guia-page">

<!-- CABEÇALHO -->

<table>

<tr>

<td style="width:22%;height:45px;">

<div style="font-size:8px;font-weight:bold;">
${configClinica.nome_empresa || ''}
</div>

<div>
CNPJ: ${configClinica.cnpj || ''}
</div>

<div>
CNES: ${configClinica.cnes || ''}
</div>

</td>

<td style="width:56%;vertical-align:middle;">

<div class="titulo">
GUIA DE SERVIÇO PROFISSIONAL / SERVIÇO AUXILIAR DE
DIAGNÓSTICO E TERAPIA - SP/SADT
</div>

</td>

<td style="width:22%;">

<div class="label">
2- Nº Guia no Prestador
</div>

<div class="numero-guia">
${atendimento.numero_guia_prestador || ''}
</div>

</td>

</tr>

</table>

<!-- 1-6 -->

<table>

<tr>

${campo('1', 'Registro ANS', convenio?.registro_ans)}
${campo('3', 'Número da Guia Principal', atendimento.guia_principal)}
${campo('4', 'Data da Autorização', formatarData(atendimento.data_autorizacao))}
${campo('5', 'Senha', atendimento.senha_autorizacao)}
${campo('6', 'Data de Validade da Senha', formatarData(atendimento.data_validade_senha))}
${campo('7', 'Número da Guia Operadora', atendimento.numero_guia_operadora)}

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

${campo('8', 'Número da Carteira', atendimento.numero_carteira)}
${campo('9', 'Validade da Carteira', atendimento.validade_carteira)}
${campo('10', 'Nome', atendimento.paciente_nome, 2)}
${campo('89', 'Nome Social', atendimento.nome_social)}
${campo('12', 'Atendimento a RN', atendimento.atendimento_rn)}

</tr>

</table>

<!-- SOLICITANTE -->

<table>

<tr>
<td colspan="8" class="secao">
Dados do Solicitante
</td>
</tr>

<tr>

${campo(
  '13',
  'Código na Operadora',
  convenio?.codigo_prestador
)}

${campo(
  '14',
  'Nome do Contratado',
  atendimento.nome_contratado ||
  configClinica.nome_empresa,
  2
)}

${campo(
  '15',
  'Nome do Profissional Solicitante',
  atendimento.profissional_solicitante,
  2
)}

${campo(
  '16',
  'Conselho Profissional',
  CONSELHO_MAP[
    atendimento.conselho_solicitante
  ] || ''
)}

${campo(
  '17',
  'Número no Conselho',
  atendimento.numero_conselho_solicitante
)}

${campo(
  '18',
  'UF',
  atendimento.uf_solicitante
)}

${campo(
  '19',
  'Código CBO',
  atendimento.cbos_solicitante
)}

</tr>

<tr>

${campo(
  '20',
  'Assinatura do Profissional Solicitante',
  '',
  8
)}

</tr>

</table>

<!-- SOLICITAÇÃO -->

<table>

<tr>
<td colspan="6" class="secao">
Dados da Solicitação / Procedimentos e Exames Solicitados
</td>
</tr>

<tr>

${campo(
  '21',
  'Caráter Atendimento',
  atendimento.carater_atendimento || 'Eletivo'
)}

${campo(
  '22',
  'Data da Solicitação',
  formatarData(atendimento.data_solicitacao)
)}

${campo(
  '23',
  'Indicação Clínica',
  atendimento.indicacao_clinica,
  2
)}

${campo(
  '90',
  'Indicador de Cobertura Especial',
  atendimento.indicador_cobertura
)}

</tr>

</table>

<table>

<tr>

<th>24-Tabela</th>
<th>25-Código do Procedimento</th>
<th>26-Descrição</th>
<th>27-Qtde. Solic.</th>
<th>28-Qtde. Aut.</th>

</tr>

${
  atendimento.itens_autorizados?.length

    ? atendimento.itens_autorizados.map(
      (item) => `

      <tr>

      <td class="text-center">
      ${item.tabela_referencia || '22'}
      </td>

      <td class="text-center">
      ${item.codigo || ''}
      </td>

      <td>
      ${limitar(item.nome || '', 150)}
      </td>

      <td class="text-center">
      ${item.quantidade_solicitada || 1}
      </td>

      <td class="text-center">
      ${item.quantidade_autorizada || 1}
      </td>

      </tr>

    `
    ).join('')

    : `

      <tr>
      <td colspan="5" style="height:18px;"></td>
      </tr>

    `
}

</table>

<!-- EXECUTANTE -->

<table>

<tr>
<td colspan="3" class="secao">
Dados do Contratado Executante
</td>
</tr>

<tr>

${campo(
  '29',
  'Código na Operadora',
  convenio?.codigo_prestador
)}

${campo(
  '30',
  'Nome do Contratado',
  atendimento.nome_contratado_executante ||
  configClinica.nome_empresa
)}

${campo(
  '31',
  'Código CNES',
  configClinica.cnes
)}

</tr>

</table>

<!-- ATENDIMENTO -->

<table>

<tr>
<td colspan="5" class="secao">
Dados do Atendimento
</td>
</tr>

<tr>

${campo(
  '32',
  'Tipo de Atendimento',
  TIPO_ATENDIMENTO_MAP[
    atendimento.tipo_atendimento
  ] || ''
)}

${campo(
  '33',
  'Indicação de Acidente',
  INDICADOR_ACIDENTE_MAP[
    atendimento.indicacao_acidente
  ] || ''
)}

${campo(
  '34',
  'Tipo de Consulta',
  TIPO_CONSULTA_MAP[
    atendimento.tipo_consulta
  ] || ''
)}

${campo(
  '35',
  'Motivo Encerramento',
  atendimento.motivo_encerramento
)}

${campo(
  '91',
  'Regime de Atendimento',
  atendimento.regime_atendimento
)}

${campo(
  '92',
  'Saúde Ocupacional',
  atendimento.saude_ocupacional
)}

</tr>

</table>

<!-- EXECUÇÃO -->

<table class="proc-table">

<tr>
<td colspan="13" class="secao">
Dados da Execução / Procedimentos e Exames Realizados
</td>
</tr>

<tr>

<th style="width:18px;">Seq</th>
<th style="width:55px;">36- Data</th>
<th style="width:40px;">37-Hora Inicial</th>
<th style="width:40px;">38-Hora Final</th>
<th style="width:35px;">39-Tabela</th>
<th style="width:70px;">40-Cód. Procedimento</th>
<th>41- Descrição</th>
<th style="width:30px;">42-Qtde</th>
<th style="width:25px;">43-Via</th>
<th style="width:25px;">44-Tec.</th>
<th style="width:45px;">45-% Red.</th>
<th style="width:70px;">46-Valor Unitário</th>
<th style="width:70px;">47-Valor Total</th>

</tr>

${
  itensPagina.length

    ? itensPagina.map(
      (item, idx) => `

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

      <td class="proc-desc">
      ${limitar(item.nome || '', 150)}
      </td>

      <td class="text-center">
      ${item.quantidade || 1}
      </td>

      <td class="text-center">
      ${item.viaAcesso || '1'}
      </td>

      <td class="text-center">
      ${item.tecnicaUtilizada || '1'}
      </td>

      <td class="text-center">
      ${item.percentual_reducao || ''}
      </td>

      <td class="text-right">
      ${moeda(item.valor_unitario)}
      </td>

      <td class="text-right">
      ${moeda(item.valor_total)}
      </td>

      </tr>

    `
    ).join('')

    : `

      <tr>
      <td colspan="13" style="height:25px;"></td>
      </tr>

    `
}

</table>

<!-- PROFISSIONAIS -->

<table>

<tr>
<td colspan="8" class="secao">
Identificação do(s) Profissional(is) Executante(s)
</td>
</tr>

<tr>

<th style="width:30px;">48- Ref.</th>
<th style="width:50px;">49- Grau Part.</th>
<th style="width:90px;">50-Código na Operadora / CPF</th>
<th>51-Nome do Profissional</th>
<th style="width:45px;">52-Conselho</th>
<th style="width:70px;">53-Número do Conselho</th>
<th style="width:25px;">54-UF</th>
<th style="width:60px;">55-Código CBO</th>

</tr>

${
  itensPagina.map(
    (item, idx) => `

    <tr>

    <td class="text-center">
    ${idx + 1}
    </td>

    <td class="text-center">
    ${GRAU_PARTICIPACAO_MAP[
      item.grau_participacao
    ] || ''}
    </td>

    <td class="text-center">
    ${item.prestador_cpf || ''}
    </td>

    <td>
    ${limitar(item.prestador_nome || '', 60)}
    </td>

    <td class="text-center">
    ${CONSELHO_MAP[
      item.prestador_conselho
    ] || ''}
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

  `
  ).join('')
}

</table>

<!-- PROCEDIMENTOS EM SERIE -->

<table>

<tr>
<td colspan="5" class="secao">
56- Data de Realização de Procedimento em Série
57- Assinatura do Beneficiário ou Responsável
</td>
</tr>

${Array.from({ length: 10 }).map(
  (_, i) => `

  <tr>

  <td class="serie" style="width:50%;">
  ${i + 1}- ____/____/________
  </td>

  <td class="serie">
  ______________________________
  </td>

  </tr>

`
).join('')}

</table>

<!-- OBS -->

<table>

<tr>

<td class="secao">
58 - Observação
</td>

</tr>

<tr>

<td style="height:30px;">
${limitar(atendimento.observacao || '', 300)}
</td>

</tr>

</table>

<!-- TOTAIS -->

<table>

<tr>

${campo('59', 'Total Procedimentos (R$)', moeda(totalProcedimentos))}
${campo('60', 'Total Taxas e Aluguéis (R$)', moeda(atendimento.total_taxas))}
${campo('61', 'Total Materiais (R$)', moeda(atendimento.total_materiais))}
${campo('62', 'Total OPME (R$)', moeda(atendimento.total_opme))}
${campo('63', 'Total Medicamentos (R$)', moeda(atendimento.total_medicamentos))}
${campo('64', 'Total Gases Medicinais (R$)', moeda(atendimento.total_gases))}
${campo('65', 'Total Geral (R$)', moeda(totalProcedimentos))}

</tr>

</table>

<!-- ASSINATURAS -->

<table>

<tr>

<td class="ass">

<div>
66 - Assinatura do Responsável pela Autorização
</div>

</td>

<td class="ass">

<div>
67 - Assinatura do Beneficiário ou Responsável
</div>

</td>

<td class="ass">

<div>
68 - Assinatura do Contratado
</div>

</td>

</tr>

</table>

<div style="margin-top:2px;font-size:5px;text-align:right;">
Copyright Orizon Brasil - WebService Gera PDF
</div>

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

  const paginas = dividirPaginas(
    atendimento.itens || []
  );

  return `

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8"/>

<title>
Guia SP/SADT
</title>

<style>
${gerarCSS()}
</style>

</head>

<body>

${paginas.map((pagina) =>
  gerarPagina(
    atendimento,
    convenio,
    configClinica,
    pagina.itens
  )
).join('')}

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
