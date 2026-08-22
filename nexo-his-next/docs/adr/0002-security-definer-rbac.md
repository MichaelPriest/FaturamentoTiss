# ADR 0002 — Funções SECURITY DEFINER para RBAC

**Status:** aceito com revisão obrigatória.

As políticas RLS precisam consultar vínculos e permissões que também estão sob RLS. As funções `usuario_ativo`, `tem_empresa`, `tem_unidade` e `tem_permissao` são `SECURITY DEFINER` somente para romper essa recursão. Todas fixam `search_path=public`, derivam o ator exclusivamente de `auth.uid()`, verificam bloqueio, não aceitam usuário como parâmetro, não alteram dados e têm execução pública revogada. Casos de uso mutáveis continuam `SECURITY INVOKER` ou validam permissão explicitamente.
