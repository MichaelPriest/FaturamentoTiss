# Estado real dos módulos

Atualizado em 2026-08-22.

| Marco | Estado | Evidência / pendência |
|---|---|---|
| 1 — Fundação | Implementado, validação externa pendente | Next/App Router, TypeScript strict, Auth SSR, shell protegido, RBAC, empresas/unidades, estrutura, auditoria, buckets privados, RLS, CI e E2E anônimo adicionados. |
| 2 — Cadastros mestres | Planejado | Ainda não migrado para a arquitetura Next. |
| 3–14 | Planejados | Código do protótipo Vite é referência, não funcionalidade aprovada para produção. |

## Validação desta entrega

- Testes legados executáveis sem dependências novas: 16 aprovados nesta entrega.
- Instalação limpa, lint, typecheck, build e Playwright: bloqueados neste ambiente porque o registry npm respondeu HTTP 403 ao instalar a stack Next.
- Migrations/RLS em PostgreSQL real: bloqueados até Supabase CLI/Docker ou projeto de desenvolvimento estarem disponíveis.

## Configurações externas pendentes

1. Criar projetos Supabase separados para desenvolvimento, preview e produção.
2. Aplicar `supabase/migrations` primeiro em desenvolvimento e executar `supabase/tests`.
3. Configurar variáveis Vercel sem expor chave secreta e sem ligar previews ao banco produtivo.
4. Configurar proteção de branch e secrets do GitHub Actions.
5. Definir rotina externa de backup do banco e Storage e testar restauração.
