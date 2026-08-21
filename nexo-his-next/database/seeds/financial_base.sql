-- Seed estrutural auditável. Dados regulatórios NÃO são inventados neste arquivo.
-- tabela_glosas_ans e indices_reajuste_ans devem ser importadas do pacote oficial ANS,
-- preservando fonte_oficial, versão e vigência (veja docs/FINANCIAL.md).
begin;
insert into public.plano_contas_contabil(codigo,descricao,natureza,tipo,codigo_pai) values
 ('1','ATIVO','DEVEDORA','SINTETICA',null),
 ('1.1','ATIVO CIRCULANTE','DEVEDORA','SINTETICA','1'),
 ('1.1.2','CRÉDITOS A CURTO PRAZO','DEVEDORA','SINTETICA','1.1'),
 ('1.1.2.1','CONTAS A RECEBER DE OPERADORAS','DEVEDORA','ANALITICA','1.1.2'),
 ('3','VARIAÇÃO PATRIMONIAL DIMINUTIVA','DEVEDORA','SINTETICA',null),
 ('3.3','GLOSAS ACEITAS E PERDAS','DEVEDORA','ANALITICA','3'),
 ('4','VARIAÇÃO PATRIMONIAL AUMENTATIVA','CREDORA','SINTETICA',null),
 ('4.1','RECEITA DE SERVIÇOS ASSISTENCIAIS','CREDORA','ANALITICA','4')
on conflict (codigo) do update set descricao=excluded.descricao,natureza=excluded.natureza,tipo=excluded.tipo,codigo_pai=excluded.codigo_pai;
commit;
