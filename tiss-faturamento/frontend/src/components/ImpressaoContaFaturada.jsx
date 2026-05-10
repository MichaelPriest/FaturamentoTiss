// Adicionar import
import { imprimirContaFaturada } from '../components/ImpressaoContaFaturada';

// Função para imprimir conta de um lote
const handleImprimirConta = (lote) => {
  const dadosConta = {
    numero_conta: lote.numero_lote,
    data_emissao: lote.data_envio,
    data_vencimento: lote.dados_fatura?.data_previsao_pagamento || '',
    status: 'faturado',
    paciente: {
      nome: 'Nome do Paciente',
      numero_carteira: '000000',
      cpf: '000.000.000-00'
    },
    convenio: {
      razao_social: lote.convenio_nome,
      registro_ans: convenio?.registro_ans,
      codigo_prestador: convenio?.codigo_prestador
    },
    clinica: configClinica,
    itens: atendimentosDoLote.flatMap(a => a.itens || []),
    subtotal: lote.dados_fatura?.base_calculo || 0,
    total_geral: lote.dados_fatura?.valor_liquido || 0,
    impostos: {
      iss: lote.dados_fatura?.valor_iss || 0,
      ibs: lote.dados_fatura?.valor_ibs || 0,
      cbs: lote.dados_fatura?.valor_cbs || 0,
      ir: lote.dados_fatura?.valor_ir || 0,
      csll: lote.dados_fatura?.valor_csll || 0,
      pis: lote.dados_fatura?.valor_pis || 0,
      cofins: lote.dados_fatura?.valor_cofins || 0
    },
    total_impostos: (lote.dados_fatura?.valor_iss || 0) + 
                    (lote.dados_fatura?.valor_ibs || 0) + 
                    (lote.dados_fatura?.valor_cbs || 0) +
                    (lote.dados_fatura?.valor_ir || 0) +
                    (lote.dados_fatura?.valor_csll || 0) +
                    (lote.dados_fatura?.valor_pis || 0) +
                    (lote.dados_fatura?.valor_cofins || 0),
    logo_base64: convenio?.logo_base64 || configClinica.logo_base64,
    observacoes: lote.dados_fatura?.observacoes || ''
  };
  
  imprimirContaFaturada(dadosConta);
  toast.success('Conta enviada para impressão!');
};
