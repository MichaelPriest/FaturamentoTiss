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
}

td, th{
  border:1px solid #000;
  padding:2px;
  vertical-align:top;
}

th{
  background:#d9d9d9;
  font-size:7px;
  font-weight:bold;
  text-align:center;
  line-height:1;
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

.text-center{
  text-align:center;
}

.text-right{
  text-align:right;
}

.sem-borda{
  border:none !important;
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
   PÁGINA
========================================================= */

const gerarPagina = (
  atendimento,
  convenio,
  configClinica,
  paginaAtual,
  totalPaginas,
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
          2 - Nº Guia no Prestador
        </div>

        <div class="numero-guia">
          ${atendimento.numero_guia_prestador || '1000000'}
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

      ${campo('3', 'Número Guia Principal', atendimento.guia_principal)}

      ${campo('4', 'Data Autorização', dataBR(atendimento.data_autorizacao))}

      ${campo('5', 'Senha', atendimento.senha_autorizacao)}

      ${campo('6', 'Data Validade Senha', dataBR(atendimento.data_validade_senha))}

    </tr>

    <tr>

      <td colspan="2">

        <div class="campo-numero">
          7 - Número Guia Operadora
        </div>

        <div class="campo-valor">
          ${atendimento.numero_guia_operadora || ''}
        </div>

      </td>

      <td colspan="3"></td>

    </tr>

  </table>

  <!-- BENEFICIÁRIO -->

  <table>

    <tr>
      <td colspan="6" class="secao">
        Dados do Beneficiário
      </td>
    </tr>

    <tr>

      ${campo('8', 'Número Carteira', atendimento.numero_carteira)}

      ${campo('9', 'Validade Carteira', atendimento.validade_carteira)}

      ${campo('10', 'Nome', atendimento.paciente_nome)}

      ${campo('11', 'Cartão Nacional Saúde', atendimento.cns)}

      ${campo('12', 'Atendimento RN', atendimento.atendimento_rn)}

      ${campo('13', 'Nascimento', atendimento.data_nascimento)}

    </tr>

  </table>

  <!-- SOLICITANTE -->

  <table>

    <tr>
      <td colspan="6" class="secao">
        Dados do Solicitante
      </td>
    </tr>

    <tr>

      ${campo(
        '14',
        'Nome Contratado',
        atendimento.nome_contratado || configClinica.nome_empresa
      )}

      ${campo(
        '15',
        'Código Operadora',
        convenio?.codigo_prestador
      )}

      ${campo(
        '16',
        'Nome Profissional Solicitante',
        atendimento.profissional_solicitante
      )}

      ${campo(
        '17',
        'Conselho',
        CONSELHO_MAP[atendimento.conselho_solicitante]
      )}

      ${campo(
        '18',
        'Número Conselho',
        atendimento.numero_conselho_solicitante
      )}

      ${campo(
        '19',
        'UF',
        atendimento.uf_solicitante
      )}

    </tr>

  </table>

  <!-- PROCEDIMENTOS SOLICITADOS -->

  <table>

    <tr>
      <td colspan="6" class="secao">
        Dados da Solicitação / Procedimentos ou Itens Assistenciais Solicitados
      </td>
    </tr>

    <tr>

      <th style="width:10%">
        24 - Tabela
      </th>

      <th style="width:15%">
        25 - Código Procedimento
      </th>

      <th style="width:45%">
        26 - Descrição
      </th>

      <th style="width:10%">
        27 - Qtde Sol.
      </th>

      <th style="width:10%">
        28 - Qtde Aut.
      </th>

      <th style="width:10%">
        Seq
      </th>

    </tr>

    ${
      atendimento.itens_autorizados?.length
        ? atendimento.itens_autorizados.map((item, idx) => `
          <tr>

            <td class="text-center">
              ${item.tabela_referencia || '22'}
            </td>

            <td class="text-center">
              ${item.codigo || ''}
            </td>

            <td>
              ${(item.nome || '').substring(0, 100)}
            </td>

            <td class="text-center">
              ${item.quantidade_solicitada || '1,00'}
            </td>

            <td class="text-center">
              ${item.quantidade_autorizada || '1,00'}
            </td>

            <td class="text-center">
              ${idx + 1}
            </td>

          </tr>
        `).join('')
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
      <td colspan="3" class="secao">
        Dados do Contratado Executante
      </td>
    </tr>

    <tr>

      ${campo(
        '29',
        'Código Operadora',
        convenio?.codigo_prestador
      )}

      ${campo(
        '30',
        'Nome Contratado',
        atendimento.nome_contratado_executante ||
        configClinica.nome_empresa
      )}

      ${campo(
        '31',
        'CNES',
        configClinica.cnes
      )}

    </tr>

  </table>

  <!-- DADOS ATENDIMENTO -->

  <table>

    <tr>
      <td colspan="4" class="secao">
        Dados do Atendimento
      </td>
    </tr>

    <tr>

      ${campo(
        '32',
        'Tipo Atendimento',
        TIPO_ATENDIMENTO_MAP[atendimento.tipo_atendimento]
      )}

      ${campo(
        '33',
        'Indicação Acidente',
        INDICADOR_ACIDENTE_MAP[atendimento.indicacao_acidente]
      )}

      ${campo(
        '34',
        'Tipo Consulta',
        TIPO_CONSULTA_MAP[atendimento.tipo_consulta]
      )}

      ${campo(
        '35',
        'Motivo Encerramento',
        MOTIVO_ENCERRAMENTO_MAP[atendimento.motivo_encerramento]
      )}

    </tr>

  </table>

  <!-- EXECUÇÃO -->

  <table>

    <tr>
      <td colspan="12" class="secao">
        Dados da Execução / Procedimentos e Exames Realizados
      </td>
    </tr>

    <tr>

      <th style="width:7%">36 - Data</th>
      <th style="width:10%">37/38 Hora</th>
      <th style="width:6%">39 Tabela</th>
      <th style="width:10%">40 Código</th>
      <th style="width:30%">41 Descrição</th>
      <th style="width:5%">42 Qtde</th>
      <th style="width:4%">43 Via</th>
      <th style="width:4%">44 Tec</th>
      <th style="width:7%">45 Fator</th>
      <th style="width:8%">46 Valor Unit.</th>
      <th style="width:9%">47 Valor Total</th>
      <th style="width:5%">48 Seq</th>

    </tr>

    ${
      itensPagina.length
        ? itensPagina.map((item, idx) => `
          <tr>

            <td class="text-center">
              ${item.data_execucao || ''}
            </td>

            <td class="text-center">
              ${item.hora_inicial || ''} a ${item.hora_final || ''}
            </td>

            <td class="text-center">
              ${item.tabela_referencia || '22'}
            </td>

            <td class="text-center">
              ${item.codigo || ''}
            </td>

            <td>
              ${(item.nome || '').substring(0, 100)}
            </td>

            <td class="text-center">
              ${item.quantidade || '1,00'}
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
            <td colspan="12" style="height:50px;"></td>
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

      <th style="width:6%">48 Seq</th>
      <th style="width:10%">49 Grau</th>
      <th style="width:16%">50 CPF</th>
      <th style="width:32%">51 Nome</th>
      <th style="width:8%">52 Conselho</th>
      <th style="width:12%">53 Nº Conselho</th>
      <th style="width:6%">54 UF</th>
      <th style="width:10%">55 CBO</th>

    </tr>

    ${
      itensPagina.length
        ? itensPagina.map((item, idx) => `
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
              ${(item.prestador_nome || '').substring(0, 100)}
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
            <td colspan="8" style="height:40px;"></td>
          </tr>
        `
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

      ${campo('59', 'Total Procedimentos', moeda(total))}
      ${campo('60', 'Taxas', '0,00')}
      ${campo('61', 'Materiais', '0,00')}
      ${campo('62', 'OPME', '0,00')}
      ${campo('63', 'Medicamentos', '0,00')}
      ${campo('64', 'Gases', '0,00')}
      ${campo('65', 'Total Geral', moeda(total))}

    </tr>

  </table>

  <!-- OBS -->

  <table>

    <tr>

      <td style="height:55px;">

        <div class="campo-numero">
          58 - Observação / Justificativa
        </div>

      </td>

    </tr>

  </table>

  <!-- ASSINATURAS -->

  <table>

    <tr>

      <td class="linha-assinatura">

        <div>
          66 - Assinatura do Responsável pela Autorização
        </div>

      </td>

      <td class="linha-assinatura">

        <div>
          67 - Assinatura do Beneficiário ou Responsável
        </div>

      </td>

      <td class="linha-assinatura">

        <div>
          68 - Assinatura do Contratado
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

  const paginas = dividirEmPaginas(atendimento.itens || []);

  const htmlPaginas = paginas.map((pagina) =>
    gerarPagina(
      atendimento,
      convenio,
      configClinica,
      pagina.numero,
      pagina.total,
      pagina.itens
    )
  ).join('');

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

${htmlPaginas}

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
   MÚLTIPLAS GUIAS
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
