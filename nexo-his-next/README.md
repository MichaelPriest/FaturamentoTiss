# Nexo HIS

Monólito modular hospitalar em Next.js, TypeScript strict e Supabase. A implementação é incremental: consulte `docs/STATUS.md` antes de considerar qualquer módulo pronto.

## Requisitos

- Node.js 20 ou superior;
- Docker e Supabase CLI para banco local;
- projeto Supabase e Vercel separados por ambiente.

## Desenvolvimento

```bash
cp .env.example .env.local
npm install
supabase start
supabase db reset
npm run dev
```

Variáveis `NEXT_PUBLIC_*` contêm apenas URL e chave publicável. Nunca use `SUPABASE_SECRET_KEY` em Client Components. Preview não deve receber credenciais de produção.

## Qualidade

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

## Banco

A fonte oficial da nova arquitetura está em `supabase/migrations`. `supabase db reset` cria o banco local integralmente. Testes de RLS ficam em `supabase/tests` e não contêm dados reais.

O diretório `database/` pertence à geração anterior e permanece apenas durante a migração incremental descrita no ADR 0001. Não aplique os dois conjuntos no mesmo banco.

## Documentação

- `PLAN.md`: marcos e gates;
- `docs/ARQUITETURA.md`: limites e camadas;
- `docs/MODELO_DADOS.md`: entidades e convenções;
- `docs/MATRIZ_PERMISSOES.md`: RBAC;
- `docs/SEGURANCA.md`: controles e operação;
- `docs/STATUS.md`: estado real e bloqueios;
- `docs/adr`: decisões arquiteturais.

## Implantação

A Vercel detecta Next.js pela raiz. Configure URL/chave publicável por ambiente e mantenha a chave secreta somente no servidor. Deploy em produção exige autorização explícita, migrations validadas em staging, testes RLS e restauração de backup ensaiada.
