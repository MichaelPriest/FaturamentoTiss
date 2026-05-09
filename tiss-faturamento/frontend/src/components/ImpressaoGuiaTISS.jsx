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

const limitarTexto = (texto = '', tamanho = 150) => {
  if (!texto) return '';

  if (texto.length <= tamanho) {
    return texto;
  }

  return texto.substring(0, tamanho) + '...';
};

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
  margin-bottom:2px;
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
}

.secao{
  background:#d9d9d9;
  font-size:8px;
  font-weight:bold;
}

.campo-numero{
  font-size:7px;
}

.campo-valor{
  font-size:9px;
  font-weight:bold;
  margin-top:2px;
  word-break:break-word;
}

.text-center{
  text-align:center;
}

.text-right{
  text-align:right;
}

.titulo-guia{
  font-size:11px;
  font-weight:bold;
  text-align:center;
}

.numero-guia{
  font-size:20px;
  font-weight:bold;
  text-align:center;
}

.assinatura{
  height:45px;
  vertical-align:bottom;
  text-align:center;
  font-size:7px;
}

.assinatura div{
  border-top:1px solid #000;
  padding-top:2px;
}

/* =========================================================
   PROCEDIMENTOS EXECUTADOS
========================================================= */

.tabela-procedimentos{
  width:100%;
  border-collapse:collapse;
  table-layout:auto;
}

.tabela-procedimentos th{
  font-size:8px;
  background:#d9d9d9;
  white-space:nowrap;
}

.tabela-procedimentos td{
  font-size:9px;
  padding:2px;
  vertical-align:top;
  white-space:nowrap;
}

.tabela-procedimentos .descricao{
  width:100%;
  min-width:260px;
  white-space:normal;
  word-break:break-word;
  line-height:1.15;
}

.tabela-procedimentos .w-data{
  width:60px;
}

.tabela-procedimentos .w-hora{
  width:45px;
}

.tabela-procedimentos .w-tabela{
  width:40px;
}

.tabela-procedimentos .w-codigo{
  width:75px;
}

.tabela-procedimentos .w-qtd{
  width:35px;
}

.tabela-procedimentos .w-via{
  width:35px;
}

.tabela-procedimentos .w-tec{
  width:35px;
}

.tabela-procedimentos .w-fator{
  width:45px;
}

.tabela-procedimentos .w-valor{
  width:75px;
}

.tabela-procedimentos .w-seq{
  width:35px;
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

<div style="font-size:9px;font-weight:bold;">
${configClinica.nome_empresa || ''}
</div>

<div style="font-size:7px;">
CNPJ: ${configClinica.cnpj || ''}
</div>

<div style="font-size:7px;">
CNES: ${configClinica.cnes || ''}
</div>

</td>

<td style="width:56%;vertical-align:middle;">

<div class="titulo-guia">
GUIA SP/SADT
</div>

<div class="titulo-guia">
SERVIÇO PROFISSIONAL / SADT
</div>

</td>

<td style="width:22%;">

<div style="font-size:8px;">
Nº Guia Prestador
</div>

<div class="numero-guia">
${atendimento.numero_guia_prestador || ''}
</div>

</td>

</tr>

</table>

<!-- AUTORIZAÇÃO -->

<table>

<tr>
<td colspan="5" class="secao">
Registro ANS / Autorização
</td>
</tr>

<tr>

${campo('1', 'Registro ANS', convenio?.registro_ans)}
${campo('2', 'Guia Principal', atendimento.guia_principal)}
${campo('3', 'Data Aut.', dataBR(atendimento.data_autorizacao))}
${campo('4', 'Senha', atendimento.senha_autorizacao)}
${campo('5', 'Validade', dataBR(atendimento.data_validade_senha))}

</tr>

</table>

<!-- BENEFICIARIO -->

<table>

<tr>
<td colspan="6" class="secao">
Dados Beneficiário
</td>
</tr>

<tr>

${campo('6', 'Carteira', atendimento.numero_carteira)}
${campo('7', 'Validade', atendimento.validade_carteira)}
${campo('8', 'Nome', atendimento.paciente_nome)}
${campo('9', 'CNS', atendimento.cns)}
${campo('10', 'RN', atendimento.atendimento_rn)}
${campo('11', 'Nascimento', atendimento.data_nascimento)}

</tr>

</table>

<!-- SOLICITANTE -->

<table>

<tr>
<td colspan="6" class="secao">
Contratado Solicitante
</td>
</tr>

<tr>

${campo(
  '12',
  'Nome Contratado',
  atendimento.nome_contratado ||
  configClinica.nome_empresa
)}

${campo(
  '13',
  'Código Operadora',
  convenio?.codigo_prestador
)}

${campo(
  '14',
  'Profissional',
  atendimento.profissional_solicitante
)}

${campo(
  '15',
  'Conselho',
  CONSELHO_MAP[
    atendimento.conselho_solicitante
  ] || ''
)}

${campo(
  '16',
  'Nº Conselho',
  atendimento.numero_conselho_solicitante
)}

${campo(
  '17',
  'UF',
  atendimento.uf_solicitante
)}

</tr>

</table>

<!-- SOLICITAÇÃO -->

<table>

<tr>
<td colspan="6" class="secao">
Solicitação / Procedimentos
</td>
</tr>

<tr>

<th>Seq</th>
<th>Tabela</th>
<th>Código</th>
<th>Descrição</th>
<th>Qtd Sol.</th>
<th>Qtd Aut.</th>

</tr>

${
  atendimento.itens_autorizados?.length

    ? atendimento.itens_autorizados.map(
      (item, idx) => `

      <tr>

      <td class="text-center">
      ${idx + 1}
      </td>

      <td class="text-center">
      ${item.tabela_referencia || '22'}
      </td>

      <td class="text-center">
      ${item.codigo || ''}
      </td>

      <td>
      ${limitarTexto(item.nome)}
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

    <td colspan="6" style="height:35px;"></td>

    </tr>

    `
}

</table>

<!-- EXECUTANTE -->

<table>

<tr>
<td colspan="4" class="secao">
Contratado Executante
</td>
</tr>

<tr>

${campo(
  '18',
  'Código Operadora',
  convenio?.codigo_prestador
)}

${campo(
  '19',
  'Nome Contratado',
  atendimento.nome_contratado_executante ||
  configClinica.nome_empresa
)}

${campo(
  '20',
  'CNES',
  configClinica.cnes
)}

${campo(
  '21',
  'Tipo Atendimento',
  TIPO_ATENDIMENTO_MAP[
    atendimento.tipo_atendimento
  ] || ''
)}

</tr>

</table>

<!-- DADOS ATENDIMENTO -->

<table>

<tr>
<td colspan="4" class="secao">
Dados Atendimento
</td>
</tr>

<tr>

${campo(
  '22',
  'Indicação Acidente',
  INDICADOR_ACIDENTE_MAP[
    atendimento.indicacao_acidente
  ] || ''
)}

${campo(
  '23',
  'Tipo Consulta',
  TIPO_CONSULTA_MAP[
    atendimento.tipo_consulta
  ] || ''
)}

${campo(
  '24',
  'Motivo Encerramento',
  MOTIVO_ENCERRAMENTO_MAP[
    atendimento.motivo_encerramento
  ] || ''
)}

${campo(
  '25',
  'Observação',
  limitarTexto(atendimento.observacao || '', 120)
)}

</tr>

</table>

<!-- PROCEDIMENTOS EXECUTADOS -->

<table class="tabela-procedimentos">

<tr>
<td colspan="12" class="secao">
Procedimentos Executados
</td>
</tr>

<tr>

<th class="w-data">
Data
</th>

<th class="w-hora">
Hora
</th>

<th class="w-tabela">
Tabela
</th>

<th class="w-codigo">
Código
</th>

<th>
Descrição
</th>

<th class="w-qtd">
Qtd
</th>

<th class="w-via">
Via
</th>

<th class="w-tec">
Tec
</th>

<th class="w-fator">
Fator
</th>

<th class="w-valor">
Vl Unit.
</th>

<th class="w-valor">
Vl Total
</th>

<th class="w-seq">
Seq
</th>

</tr>

${
  itensPagina.length > 0

    ? itensPagina.map((item, idx) => `

      <tr>

      <td class="text-center w-data">
      ${item.data_execucao || ''}
      </td>

      <td class="text-center w-hora">
      ${item.hora_inicial || ''}
      </td>

      <td class="text-center w-tabela">
      ${item.tabela_referencia || '22'}
      </td>

      <td class="text-center w-codigo">
      ${item.codigo || ''}
      </td>

      <td class="descricao">

      ${limitarTexto(item.nome || '', 150)}

      </td>

      <td class="text-center w-qtd">
      ${item.quantidade || 1}
      </td>

      <td class="text-center w-via">
      ${item.viaAcesso || '1'}
      </td>

      <td class="text-center w-tec">
      ${item.tecnicaUtilizada || '1'}
      </td>

      <td class="text-center w-fator">
      1,00
      </td>

      <td class="text-right w-valor">
      ${moeda(item.valor_unitario)}
      </td>

      <td class="text-right w-valor">
      ${moeda(item.valor_total)}
      </td>

      <td class="text-center w-seq">
      ${idx + 1}
      </td>

      </tr>

    `).join('')

    : `

      <tr>

      <td colspan="12" style="height:50px;"></td>

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
<th>Cons.</th>
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
  ${limitarTexto(item.prestador_nome || '', 60)}
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

<!-- TOTAIS -->

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

<td class="assinatura">
<div>Assinatura Responsável</div>
</td>

<td class="assinatura">
<div>Assinatura Beneficiário</div>
</td>

<td class="assinatura">
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
