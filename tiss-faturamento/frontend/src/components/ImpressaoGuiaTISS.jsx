// src/components/ImpressaoGuiaTISS.jsx

import { format } from 'date-fns';

/* =========================================================
   MAPAS
========================================================= */

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
  '0': 'Ac. Trabalho',
  '1': 'Ac. Trânsito',
  '2': 'Outros',
  '9': 'Não'
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
      itens: itens.slice(i, i + MAX),
      pagina: paginas.length + 1,
      total: Math.ceil(itens.length / MAX)
    });

  }

  if (!paginas.length) {

    paginas.push({
      itens: [],
      pagina: 1,
      total: 1
    });

  }

  return paginas;
};

const campo = (
  numero,
  titulo,
  valor = '',
  colspan = 1
) => `
<td colspan="${colspan}">

<div class="campo-numero">
${numero} - ${titulo}
</div>

<div class="campo-valor">
${valor || '&nbsp;'}
</div>

</td>
`;

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
  padding:4mm;
  margin:0 auto;
  background:#FFF;
  page-break-after:always;
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
  font-size:8px;
  line-height:1.1;
}

th{
  border:1px solid #000;
  padding:2px;
  background:#d9d9d9;
  font-size:7px;
  font-weight:bold;
  text-align:center;
}

.secao{
  background:#d9d9d9;
  font-weight:bold;
  font-size:7px;
}

.campo-numero{
  font-size:6px;
}

.campo-valor{
  font-size:8px;
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

.titulo{
  font-size:11px;
  font-weight:bold;
  text-align:center;
}

.numero-guia{
  font-size:18px;
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

.proc-table{
  table-layout:auto;
}

.proc-table td{
  font-size:8px;
}

.proc-desc{
  min-width:260px;
  width:100%;
  white-space:normal;
  word-break:break-word;
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

<td style="width:56%;">

<div class="titulo">
GUIA SP/SADT
</div>

<div class="titulo">
SERVIÇO PROFISSIONAL / SADT
</div>

</td>

<td style="width:22%;">

<div style="font-size:7px;">
Nº Guia Prestador
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
<td colspan="6" class="secao">
1 - Registro ANS / Autorização
</td>
</tr>

<tr>

${campo('1', 'Registro ANS', convenio?.registro_ans)}
${campo('2', 'Guia Principal', atendimento.guia_principal)}
${campo('3', 'Data Aut.', formatarData(atendimento.data_autorizacao))}
${campo('4', 'Senha', atendimento.senha_autorizacao)}
${campo('5', 'Validade', formatarData(atendimento.data_validade_senha))}
${campo('6', 'Guia Operadora', atendimento.numero_guia_operadora)}

</tr>

</table>

<!-- 7-12 -->

<table>

<tr>
<td colspan="6" class="secao">
2 - Dados Beneficiário
</td>
</tr>

<tr>

${campo('7', 'Carteira', atendimento.numero_carteira)}
${campo('8', 'Validade', atendimento.validade_carteira)}
${campo('9', 'Nome', atendimento.paciente_nome, 2)}
${campo('10', 'CNS', atendimento.cns)}
${campo('11', 'RN', atendimento.atendimento_rn)}
${campo('12', 'Nascimento', atendimento.data_nascimento)}

</tr>

</table>

<!-- 13-20 -->

<table>

<tr>
<td colspan="8" class="secao">
3 - Contratado Solicitante
</td>
</tr>

<tr>

${campo(
  '13',
  'Nome Contratado',
  atendimento.nome_contratado ||
  configClinica.nome_empresa,
  2
)}

${campo(
  '14',
  'Código Operadora',
  convenio?.codigo_prestador
)}

${campo(
  '15',
  'Profissional',
  atendimento.profissional_solicitante,
  2
)}

${campo(
  '16',
  'Conselho',
  CONSELHO_MAP[
    atendimento.conselho_solicitante
  ] || ''
)}

${campo(
  '17',
  'Nº Conselho',
  atendimento.numero_conselho_solicitante
)}

${campo(
  '18',
  'UF',
  atendimento.uf_solicitante
)}

${campo(
  '19',
  'CBO',
  atendimento.cbos_solicitante
)}

${campo(
  '20',
  'Assinatura',
  ''
)}

</tr>

</table>

<!-- 21-26 -->

<table>

<tr>
<td colspan="6" class="secao">
4 - Solicitação / Procedimentos
</td>
</tr>

<tr>

<th>21 Seq</th>
<th>22 Tabela</th>
<th>23 Código</th>
<th>24 Descrição</th>
<th>25 Qtd Sol.</th>
<th>26 Qtd Aut.</th>

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
      ${limitar(item.nome)}
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
    <td colspan="6" style="height:30px;"></td>
    </tr>

    `
}

</table>

<!-- 27-30 -->

<table>

<tr>
<td colspan="4" class="secao">
5 - Dados Atendimento
</td>
</tr>

<tr>

${campo(
  '27',
  'Tipo Atendimento',
  TIPO_ATENDIMENTO_MAP[
    atendimento.tipo_atendimento
  ] || ''
)}

${campo(
  '28',
  'Indicação Acidente',
  INDICADOR_ACIDENTE_MAP[
    atendimento.indicacao_acidente
  ] || ''
)}

${campo(
  '29',
  'Tipo Consulta',
  TIPO_CONSULTA_MAP[
    atendimento.tipo_consulta
  ] || ''
)}

${campo(
  '30',
  'Motivo Encerramento',
  MOTIVO_ENCERRAMENTO_MAP[
    atendimento.motivo_encerramento
  ] || ''
)}

</tr>

</table>

<!-- 31-48 -->

<table class="proc-table">

<tr>
<td colspan="18" class="secao">
6 - Procedimentos Executados
</td>
</tr>

<tr>

<th>31 Data</th>
<th>32 H.Ini</th>
<th>33 H.Fim</th>
<th>34 Tabela</th>
<th>35 Código</th>
<th>36 Descrição</th>
<th>37 Qtde</th>
<th>38 Via</th>
<th>39 Técnica</th>
<th>40 Red/Acresc</th>
<th>41 Fator</th>
<th>42 Valor Unit.</th>
<th>43 Valor Total</th>
<th>44 Filme</th>
<th>45 %</th>
<th>46 Unidade</th>
<th>47 Seq Ref</th>
<th>48 Seq</th>

</tr>

${
  itensPagina.length

    ? itensPagina.map((item, idx) => `

      <tr>

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
      ${item.viaAcesso || ''}
      </td>

      <td class="text-center">
      ${item.tecnicaUtilizada || ''}
      </td>

      <td class="text-center">
      ${item.reducao_acrescimo || ''}
      </td>

      <td class="text-center">
      ${item.fator_reducao || '1,00'}
      </td>

      <td class="text-right">
      ${moeda(item.valor_unitario)}
      </td>

      <td class="text-right">
      ${moeda(item.valor_total)}
      </td>

      <td class="text-center">
      ${item.filme || ''}
      </td>

      <td class="text-center">
      ${item.percentual_reducao || ''}
      </td>

      <td class="text-center">
      ${item.unidade_medida || ''}
      </td>

      <td class="text-center">
      ${item.sequencial_referencia || ''}
      </td>

      <td class="text-center">
      ${idx + 1}
      </td>

      </tr>

    `).join('')

    : `

    <tr>
    <td colspan="18" style="height:40px;"></td>
    </tr>

    `
}

</table>

<!-- 49-58 -->

<table>

<tr>
<td colspan="8" class="secao">
7 - Profissionais Executantes
</td>
</tr>

<tr>

<th>49 Seq</th>
<th>50 Grau Participação</th>
<th>51 CPF</th>
<th>52 Nome</th>
<th>53 Conselho</th>
<th>54 Nº Conselho</th>
<th>55 UF</th>
<th>56 CBO</th>

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
  ${limitar(item.prestador_nome || '', 60)}
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

<!-- 59-65 -->

<table>

<tr>
<td colspan="7" class="secao">
8 - Valores Totais
</td>
</tr>

<tr>

${campo('59', 'Procedimentos', moeda(total))}
${campo('60', 'Taxas', moeda(atendimento.total_taxas))}
${campo('61', 'Materiais', moeda(atendimento.total_materiais))}
${campo('62', 'OPME', moeda(atendimento.total_opme))}
${campo('63', 'Medicamentos', moeda(atendimento.total_medicamentos))}
${campo('64', 'Gases', moeda(atendimento.total_gases))}
${campo('65', 'Total Geral', moeda(total))}

</tr>

</table>

<!-- 66 -->

<table>

<tr>
<td class="secao">
66 - Observações
</td>
</tr>

<tr>

<td style="height:35px;">
${limitar(atendimento.observacao || '', 300)}
</td>

</tr>

</table>

<!-- 67-68 -->

<table>

<tr>

<td class="assinatura">

<div>
67 - Assinatura Beneficiário
</div>

</td>

<td class="assinatura">

<div>
68 - Assinatura Contratado
</div>

</td>

</tr>

</table>

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

${paginas.map((p) =>
  gerarPagina(
    atendimento,
    convenio,
    configClinica,
    p.itens
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
