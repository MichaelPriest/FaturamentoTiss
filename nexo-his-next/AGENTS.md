# Regras permanentes do Nexo HIS

- O produto é um monólito modular Next.js; regras de domínio não pertencem a páginas ou componentes.
- TypeScript permanece em `strict`; não usar `any` sem justificativa documentada.
- Toda entrada externa é validada com Zod no limite da aplicação e novamente no banco quando crítica.
- Tabelas expostas usam RLS, `empresa_id` e `unidade_id` quando aplicável. Negação é o padrão.
- Nunca usar service role no navegador, registrar tokens, commitar segredos ou dados reais de pacientes.
- Registros clínicos assinados, auditoria e documentos são append-only; correções são novas versões.
- Datas persistidas usam `timestamptz`; apresentação usa `America/Sao_Paulo`; dinheiro usa `numeric`, nunca ponto flutuante.
- Catálogos regulatórios (TUSS, CID, CBO, CNES) só podem ser importados de fontes oficiais, com versão e origem.
- Cada mudança atualiza testes e `docs/STATUS.md`. Antes do commit: lint, typecheck, testes e build.
- Migrations são incrementais e nunca são reescritas depois de aplicadas em ambiente compartilhado.
