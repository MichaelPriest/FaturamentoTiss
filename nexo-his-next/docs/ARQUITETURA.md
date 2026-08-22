# Arquitetura

## Visão

Monólito modular Next.js App Router. Server Components consultam dados; Server Actions validam comandos; módulos encapsulam domínio, schemas e repositórios. O navegador recebe apenas a chave publicável. Supabase Auth usa cookies via `@supabase/ssr`.

## Camadas

- `src/app`: composição, rotas, layouts e limites server/client.
- `src/modules`: domínio, casos de uso, contratos e componentes de cada contexto.
- `src/lib/supabase`: clientes browser/server e middleware de sessão.
- `src/lib/permissions`: catálogo e avaliação RBAC.
- `src/lib/audit`: correlação e comandos auditáveis.
- `supabase/migrations`: schema, constraints, RLS e funções transacionais.

## Decisões

- SSR por padrão; Client Components apenas para interação.
- Negação por padrão no RBAC e RLS.
- Realtime reservado a filas/chamadas e ocupação, não a cadastros.
- Integrações TISS são adaptadores por versão.
- Storage clínico privado com objetos nomeados por UUID e URLs assinadas curtas.
