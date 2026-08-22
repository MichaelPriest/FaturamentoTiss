# Plano de implementação

## Estratégia

O Nexo HIS será migrado do protótipo Vite para um monólito modular Next.js sem afirmar que módulos ainda não validados estão prontos. Cada marco só muda para concluído após migrations, RLS, interface, testes e build.

## Marcos

1. **Fundação** — Next/App Router, Supabase SSR, autenticação, RBAC granular, estrutura hospitalar, auditoria e RLS.
2. **Cadastros mestres** — paciente, profissionais, convênios/planos, produtos e controle de duplicidade.
3. **Atendimento/ADT** — atendimento central, admissões, movimentações, transferências, alta e autorizações.
4. **Agenda/recepção/fila** — agenda, check-in, chamadas e Realtime apenas na fila.
5. **Triagem** — classificação e medições seriadas.
6. **Prontuário** — anamnese, SOAP, diagnóstico, assinatura interna, retificação e impressão auditada.
7. **Prescrição e pedidos** — itens estruturados e regras de segurança clínica sem decisão autônoma.
8. **Documentos** — emissão, validação, cancelamento e interface futura de assinatura qualificada.
9. **Internação/enfermagem** — leitos, prescrição diária, checagem e alta.
10. **Farmácia/estoque** — lotes, dispensação, devolução e rastreabilidade.
11. **Laboratório/imagem** — amostras, resultados, laudos e integração externa.
12. **Conta hospitalar** — lançamentos automáticos, ajustes, fechamento e reconciliação assistencial.
13. **Autorizações/TISS/faturamento/glosas** — adaptadores versionados e catálogos oficiais.
14. **Financeiro/BI** — financeiro e indicadores reais sob RLS.

## Gate de qualidade por marco

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e E2E dos fluxos alterados. Falhas de ambiente ficam registradas em `docs/STATUS.md`; falhas controláveis bloqueiam conclusão.
