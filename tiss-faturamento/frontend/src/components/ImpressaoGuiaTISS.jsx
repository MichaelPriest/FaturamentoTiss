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

const limitar = (txt = '', max = 200) => {
  if (!txt) return '';
  return txt.length > max
    ? txt.substring(0, max) + '...'
    : txt;
};

const dividirPaginas = (itens = []) => {
  const MAX = 12;
  const paginas = [];
  for (let i = 0; i < itens.length; i += MAX) {
    paginas.push({
      itens: itens.slice(i, i + MAX),
      inicio: i + 1,
      fim: Math.min(i + MAX, itens.length)
    });
  }
  if (!paginas.length) {
    paginas.push({ itens: [], inicio: 0, fim: 0 });
  }
  return paginas;
};

/* =========================================================
   CSS
========================================================= */

const gerarCSS = () => `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, Helvetica, sans-serif;
  background: #FFF;
  color: #000;
}

.guia-page {
  width: 297mm;
  min-height: 210mm;
  padding: 3mm;
  margin: 0 auto;
  background: #FFF;
  page-break-after: always;
}

.guia-page:last-child {
  page-break-after: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
}

td, th {
  border: 1px solid #000;
  padding: 3px 4px;
  vertical-align: top;
  font-size: 7px;
  line-height: 1.2;
  word-break: break-word;
}

th {
  background: #d9d9d9;
  font-weight: bold;
  text-align: center;
}

.secao {
  background: #d9d9d9;
  font-weight: bold;
  font-size: 7px;
  text-align: center;
}

.label {
  font-size: 5.8px;
  font-weight: normal;
  color: #333;
}

.valor {
  font-size: 7.5px;
  font-weight: bold;
  margin-top: 2px;
}

.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

.text-left {
  text-align: left;
}

.titulo {
  font-size: 11px;
  font-weight: bold;
  text-align: center;
  line-height: 1.2;
}

.numero-guia {
  font-size: 18px;
  font-weight: bold;
  text-align: center;
}

/* Logo do convênio */
.logo-convenio {
  max-width: 100px;
  max-height: 45px;
  object-fit: contain;
}

.proc-table {
  width: 100%;
  table-layout: auto;
}

.proc-table th,
.proc-table td {
  padding: 3px 3px;
  font-size: 6.5px;
}

.proc-desc {
  min-width: 180px;
  max-width: 250px;
  white-space: normal;
  word-break: break-word;
}

.proc-table .num-col {
  text-align: center;
  white-space: nowrap;
}

.proc-table .money-col {
  text-align: right;
  white-space: nowrap;
}

.ass {
  height: 45px;
  vertical-align: bottom;
  text-align: center;
  font-size: 6px;
}

.ass div {
  border-top: 1px solid #000;
  padding-top: 4px;
  margin-top: 8px;
}

.serie {
  height: 18px;
  text-align: center;
}

.continuacao {
  font-size: 6px;
  text-align: right;
  margin-top: 3px;
  color: #666;
}

@page {
  size: A4 landscape;
  margin: 3mm;
}

@media print {
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  th, .secao {
    background: #d9d9d9 !important;
  }
}
`;

/* =========================================================
   CAMPO
========================================================= */

const campo = (numero, titulo, valor = '', colspan = 1) => `
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
  itensPagina,
  paginaAtual,
  totalPaginas
) => {
  const totalProcedimentos = (itensPagina || []).reduce(
    (s, i) => s + Number(i.valor_total || 0),
    0
  );
  
  const totalGeral = (atendimento.itens || []).reduce(
    (s, i) => s + Number(i.valor_total || 0),
    0
  );

  const isUltimaPagina = paginaAtual === totalPaginas;

  // Logo do convênio (prioriza logo do convênio, fallback para configClinica.nome_empresa)
  const logoTemplate = convenio?.logo_base64
    ? `<img src="${convenio.logo_base64}" alt="Logo do convênio" class="logo-convenio" style="max-width:100px;max-height:45px;" />`
    : `<div style="font-size:8px;font-weight:bold;">${configClinica.nome_empresa || ''}</div>`;

  // Nome do contratado (prioriza o nome_contratado do convênio)
  const nomeContratado = convenio?.nome_contratado || configClinica.nome_contratado || configClinica.nome_empresa || '';

  return `
<div class="guia-page">
  <!-- CABEÇALHO -->
  <table>
    <tr>
      <td style="width:22%;height:45px;text-align:center;vertical-align:middle;">
        ${logoTemplate}
        <div style="font-size:7px;">CNPJ: ${convenio?.cnpj || configClinica.cnpj || ''}</div>
        <div style="font-size:7px;">CNES: ${convenio?.cnes || configClinica.cnes || ''}</div>
      </td>
      <td style="width:56%;vertical-align:middle;">
        <div class="titulo">
          GUIA DE SERVIÇO PROFISSIONAL / SERVIÇO AUXILIAR DE<br>
          DIAGNÓSTICO E TERAPIA - SP/SADT
        </div>
      </td>
      <td style="width:22%;">
        <div class="label">2- Nº Guia no Prestador</div>
        <div class="numero-guia">${atendimento.numero_guia_prestador || ''}</div>
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
      <td colspan="6" class="secao">Dados do Beneficiário</td>
    </tr>
    <tr>
      ${campo('8', 'Número da Carteira', atendimento.numero_carteira)}
      ${campo('9', 'Validade da Carteira', atendimento.validade_carteira)}
      ${campo('10', 'Nome', atendimento.paciente_nome, 2)}
      ${campo('12', 'Atendimento a RN', atendimento.atendimento_rn)}
    </tr>
  </table>

  <!-- SOLICITANTE -->
  <table>
    <tr>
      <td colspan="8" class="secao">Dados do Solicitante</td>
    </tr>
    <tr>
      ${campo('13', 'Código na Operadora', convenio?.codigo_prestador)}
      ${campo('14', 'Nome do Contratado', nomeContratado, 2)}
      ${campo('15', 'Nome do Profissional Solicitante', atendimento.profissional_solicitante, 2)}
      ${campo('16', 'Conselho Profissional', CONSELHO_MAP[atendimento.conselho_solicitante] || '')}
      ${campo('17', 'Número no Conselho', atendimento.numero_conselho_solicitante)}
      ${campo('18', 'UF', atendimento.uf_solicitante)}
      ${campo('19', 'Código CBO', atendimento.cbos_solicitante)}
    </tr>
    <tr>
      ${campo('20', 'Assinatura do Profissional Solicitante', '', 8)}
    </tr>
  </table>

  <!-- SOLICITAÇÃO -->
  <table>
    <tr>
      <td colspan="6" class="secao">Dados da Solicitação / Procedimentos e Exames Solicitados</td>
    </tr>
    <tr>
      ${campo('21', 'Caráter Atendimento', atendimento.carater_atendimento || 'Eletivo')}
      ${campo('22', 'Data da Solicitação', formatarData(atendimento.data_solicitacao))}
      ${campo('23', 'Indicação Clínica', atendimento.indicacao_clinica, 2)}
    </tr>
  </table>

  <table>
    <tr>
      <th width="10%">24-Tabela</th>
      <th width="12%">25-Código</th>
      <th width="55%">26-Descrição</th>
      <th width="10%">27-Qtde.Solic.</th>
      <th width="13%">28-Qtde.Aut.</th>
    </tr>
    ${(atendimento.itens_autorizados || []).length > 0
      ? (atendimento.itens_autorizados || []).map(
          (item) => `
          <tr>
            <td class="text-center">${item.tabela_referencia || '22'}</td>
            <td class="text-center">${item.codigo || ''}</td>
            <td class="proc-desc">${limitar(item.nome || '', 150)}</td>
            <td class="text-center">${item.quantidade_solicitada || 1}</td>
            <td class="text-center">${item.quantidade_autorizada || 1}</td>
          </tr>
        `
        ).join('')
      : '<tr><td colspan="5" style="height:18px;"></td></tr>'
    }
  </table>

  <!-- EXECUTANTE -->
  <table>
    <tr>
      <td colspan="3" class="secao">Dados do Contratado Executante</td>
    </tr>
    <tr>
      ${campo('29', 'Código na Operadora', convenio?.codigo_prestador)}
      ${campo('30', 'Nome do Contratado', nomeContratado)}
      ${campo('31', 'Código CNES', convenio?.cnes || configClinica.cnes)}
    </tr>
  </table>

  <!-- ATENDIMENTO -->
  <table>
    <tr>
      <td colspan="6" class="secao">Dados do Atendimento</td>
    </tr>
    <tr>
      ${campo('32', 'Tipo de Atendimento', TIPO_ATENDIMENTO_MAP[atendimento.tipo_atendimento] || '')}
      ${campo('33', 'Indicação de Acidente', INDICADOR_ACIDENTE_MAP[atendimento.indicacao_acidente] || '')}
      ${campo('34', 'Tipo de Consulta', TIPO_CONSULTA_MAP[atendimento.tipo_consulta] || '')}
      ${campo('35', 'Motivo Encerramento', atendimento.motivo_encerramento)}
      ${campo('91', 'Regime de Atendimento', atendimento.regime_atendimento)}
    </tr>
  </table>

  <!-- EXECUÇÃO - TABELA DE PROCEDIMENTOS -->
  <table class="proc-table">
    <tr>
      <td colspan="13" class="secao">
        Dados da Execução / Procedimentos e Exames Realizados
        ${totalPaginas > 1 ? ` (Página ${paginaAtual} de ${totalPaginas})` : ''}
      </td>
    </tr>
    <tr>
      <th width="5%">Seq</th>
      <th width="10%">36-Data</th>
      <th width="8%">37-H.Ini</th>
      <th width="8%">38-H.Fim</th>
      <th width="7%">39-Tab</th>
      <th width="10%">40-Código</th>
      <th width="22%">41-Descrição</th>
      <th width="6%">42-Qtde</th>
      <th width="7%">43-Via</th>
      <th width="7%">44-Téc</th>
      <th width="7%">45-Red%</th>
      <th width="9%">46-Valor Unit</th>
      <th width="9%">47-Valor Total</th>
    </tr>
    ${itensPagina.length > 0
      ? itensPagina.map(
          (item, idx) => `
          <tr>
            <td class="text-center num-col">${idx + 1}</td>
            <td class="text-center num-col">${item.data_execucao || ''}</td>
            <td class="text-center num-col">${item.hora_inicial || ''}</td>
            <td class="text-center num-col">${item.hora_final || ''}</td>
            <td class="text-center num-col">${item.tabela_referencia || '22'}</td>
            <td class="text-center num-col">${item.codigo || ''}</td>
            <td class="proc-desc">${limitar(item.nome || '', 120)}</td>
            <td class="text-center num-col">${item.quantidade || 1}</td>
            <td class="text-center num-col">${VIA_ACESSO_MAP[item.viaAcesso] || item.viaAcesso || '-'}</td>
            <td class="text-center num-col">${TECNICA_MAP[item.tecnicaUtilizada] || item.tecnicaUtilizada || '-'}</td>
            <td class="text-center num-col">${item.reducaoAcrescimo ? item.reducaoAcrescimo + '%' : '-'}</td>
            <td class="text-right money-col">R$ ${moeda(item.valor_unitario)}</td>
            <td class="text-right money-col">R$ ${moeda(item.valor_total)}</td>
          </tr>
        `
        ).join('')
      : `
        <tr>
          <td colspan="13" style="height:25px; text-align:center;">Nenhum procedimento registrado</td>
        </tr>
      `
    }
  </table>

  <!-- PROFISSIONAIS EXECUTANTES -->
  <table>
    <tr>
      <td colspan="8" class="secao">Identificação do(s) Profissional(is) Executante(s)</td>
    </tr>
    <tr>
      <th width="5%">48-Ref</th>
      <th width="8%">49-Grau</th>
      <th width="15%">50-Código/CPF</th>
      <th width="35%">51-Nome do Profissional</th>
      <th width="8%">52-Cons</th>
      <th width="12%">53-Nº Conselho</th>
      <th width="5%">54-UF</th>
      <th width="12%">55-CBO</th>
    </tr>
    ${itensPagina.map(
      (item, idx) => `
      <tr>
        <td class="text-center num-col">${idx + 1}</td>
        <td class="text-center num-col">${GRAU_PARTICIPACAO_MAP[item.grau_participacao] || ''}</td>
        <td class="text-center num-col">${item.prestador_cpf || ''}</td>
        <td>${limitar(item.prestador_nome || '', 60)}</td>
        <td class="text-center num-col">${CONSELHO_MAP[item.prestador_conselho] || ''}</td>
        <td class="text-center num-col">${item.prestador_numero_conselho || ''}</td>
        <td class="text-center num-col">${item.prestador_uf_conselho || ''}</td>
        <td class="text-center num-col">${item.prestador_cbos || ''}</td>
      </tr>
    `
    ).join('')}
  </table>

  <!-- ASSINATURAS EM SÉRIE (apenas na última página) -->
  ${isUltimaPagina ? `
  <table>
    <tr>
      <td colspan="10" class="secao">
        56 - Data de Realização de Procedimento em Série / 
        57 - Assinatura do Beneficiário ou Responsável
      </td>
    </tr>
    <tr>
      <td class="serie">1-____/____/________</td>
      <td class="serie">________________________</td>
      <td class="serie">3-____/____/________</td>
      <td class="serie">________________________</td>
      <td class="serie">5-____/____/________</td>
      <td class="serie">________________________</td>
      <td class="serie">7-____/____/________</td>
      <td class="serie">________________________</td>
      <td class="serie">9-____/____/________</td>
      <td class="serie">________________________</td>
    </tr>
    <tr>
      <td class="serie">2-____/____/________</td>
      <td class="serie">________________________</td>
      <td class="serie">4-____/____/________</td>
      <td class="serie">________________________</td>
      <td class="serie">6-____/____/________</td>
      <td class="serie">________________________</td>
      <td class="serie">8-____/____/________</td>
      <td class="serie">________________________</td>
      <td class="serie">10-____/____/________</td>
      <td class="serie">________________________</td>
    </tr>
  </table>

  <!-- OBSERVAÇÃO -->
  <table>
    <tr>
      <td class="secao">58 - Observação</td>
    </tr>
    <tr>
      <td style="height:30px;">${limitar(atendimento.observacao || '', 300)}</td>
    </tr>
  </table>

  <!-- TOTAIS -->
  <table>
    <tr>
      ${campo('59', 'Total Procedimentos', moeda(totalProcedimentos))}
      ${campo('60', 'Total Taxas', moeda(atendimento.total_taxas || 0))}
      ${campo('61', 'Total Materiais', moeda(atendimento.total_materiais || 0))}
      ${campo('62', 'Total OPME', moeda(atendimento.total_opme || 0))}
      ${campo('63', 'Total Medicamentos', moeda(atendimento.total_medicamentos || 0))}
      ${campo('64', 'Total Gases', moeda(atendimento.total_gases || 0))}
      ${campo('65', 'Total Geral', moeda(totalGeral))}
    </tr>
  </table>

  <!-- ASSINATURAS -->
  <table>
    <tr>
      <td class="ass">
        <div>66 - Assinatura do Responsável pela Autorização</div>
      </td>
      <td class="ass">
        <div>67 - Assinatura do Beneficiário ou Responsável</div>
      </td>
      <td class="ass">
        <div>68 - Assinatura do Contratado</div>
      </td>
    </tr>
  </table>
  ` : `
  <div class="continuacao">
    * Continua na próxima página *
  </div>
  `}

  <div style="margin-top:3px;font-size:5px;text-align:right;">
    Gerado por Sistema TISS
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
  const paginas = dividirPaginas(atendimento.itens || []);
  const totalPaginas = paginas.length;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Guia SP/SADT - ${atendimento.numero_guia_prestador}</title>
  <style>${gerarCSS()}</style>
</head>
<body>
  ${paginas.map((pagina, idx) =>
    gerarPagina(
      atendimento,
      convenio,
      configClinica,
      pagina.itens,
      idx + 1,
      totalPaginas
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

/* =========================================================
   MULTIPLAS GUIAS
========================================================= */

export const imprimirMultiplasGuiasTISS = (
  guias,
  convenio,
  configClinica = {}
) => {
  if (!guias?.length) {
    alert('Nenhuma guia para imprimir.');
    return;
  }

  let htmlFinal = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>${gerarCSS()}</style>
</head>
<body>
`;

  guias.forEach((guia, idx) => {
    const html = gerarHTMLGuiaTISSOficial(
      guia,
      convenio,
      configClinica
    );
    const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (match?.[1]) {
      htmlFinal += match[1];
      if (idx < guias.length - 1) {
        htmlFinal += '<div style="page-break-before: always;"></div>';
      }
    }
  });

  htmlFinal += `</body></html>`;

  const win = window.open(
    '',
    '_blank',
    'width=1400,height=900'
  );

  if (!win) {
    alert('Permita popups para imprimir.');
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
