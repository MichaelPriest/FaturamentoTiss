# Módulo financeiro, glosas e recursos

## Fluxo transacional

1. `gerar_conta_hospitalar` consolida itens da guia e, quando vinculados à internação, consumos ainda não faturados. A operação é idempotente pela origem do item.
2. Contas fechadas são agrupadas por unidade, operadora e competência. A inclusão muda a conta para `ENVIADA`, impedindo faturamento duplicado.
3. O XML de intercâmbio somente pode ser enviado depois que um adaptador validar o documento no XSD da versão contratada e concluir a assinatura ICP-Brasil. `assinatura_status` permanece `PENDENTE` até essa etapa; o XML interno da RPC **não é uma mensagem TISS pronta para transmissão**.
4. O retorno validado é normalizado para `retornoFinanceiro`, conciliado em transação e origina as glosas.
5. Um recurso só abre dentro do prazo e com prontuário, guia e laudo identificados por tipo. Banco e API repetem a validação para evitar bypass do cliente.

## Precisão e concorrência

- PostgreSQL usa `numeric(20,2)` para moeda e `numeric(16,3)` para quantidades. O domínio Node converte textos monetários para `BigInt` em centavos e rejeita mais de duas casas.
- Totais de itens são colunas geradas. O total líquido possui restrição contábil e a geração usa transação, bloqueio da guia e chaves idempotentes.
- Não use `Number`, `real` ou `double precision` em cálculos financeiros. Valores da API permanecem strings decimais até a persistência.

## Segurança

- O endpoint retransmite o JWT do usuário ao PostgREST; não usa `service_role`.
- RLS limita registros à unidade. RPCs verificam `faturista`, `supervisor_financeiro` ou `admin`.
- Alterações nas entidades financeiras geram snapshot anterior/posterior em `auditoria_financeira`.
- XML tem limite de 10 MB e rejeita DTD/entidades. Uploads devem usar bucket privado, URL assinada curta, antivírus, hash e retenção.

## Dados oficiais ANS e tributação

Os códigos de glosa, índices de reajuste e artefatos TISS são dados regulatórios versionados. O repositório deliberadamente não inventa nem rotula dados incompletos como oficiais. Antes da produção:

1. baixe o pacote vigente no portal oficial da ANS;
2. valide assinatura/hash e registre URL, data, versão e vigência;
3. importe a terminologia completa em `tabela_glosas_ans` numa transação de homologação;
4. rode regressão contra XSD/WSDL e somente então promova a versão;
5. registre índices em `indices_reajuste_ans` apenas quando aplicáveis ao contrato — índice de planos individuais não deve ser aplicado automaticamente a contratos hospitalares;
6. configure PIS, COFINS, ISS e IRRF por regime, município, serviço e vigência. Nenhuma alíquota é fixa no código.

O seed inclui apenas estrutura contábil mínima e não constitui um PCASP oficial completo. A instituição deve validá-la com sua contabilidade.

## Alertas

Uma rotina agendada deve consultar glosas pendentes com prazo entre hoje e cinco dias, remessas com `percentual_glosa > 15` e mudanças de recurso. O limiar é parâmetro operacional, não “média oficial de mercado”. Alertas devem usar a tabela de notificações existente e chave idempotente.

Contrato REST: [`openapi-financeiro.yaml`](./openapi-financeiro.yaml).
