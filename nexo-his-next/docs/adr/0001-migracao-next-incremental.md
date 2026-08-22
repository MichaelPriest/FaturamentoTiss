# ADR 0001 — Migração incremental do protótipo Vite

**Status:** aceito.

O protótipo Vite permanece temporariamente em `apps/web` como referência funcional. A aplicação de produção passa a ser o Next.js na raiz. Uma reescrita total imediata elevaria risco clínico e impediria validação incremental. Funcionalidades só migram quando possuem domínio, persistência, RLS e testes; telas do protótipo não são consideradas concluídas.
