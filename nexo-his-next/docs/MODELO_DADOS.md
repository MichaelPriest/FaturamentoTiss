# Modelo de dados

## Núcleo institucional

`empresas → unidades → setores → ambientes → quartos → leitos`. Usuários se vinculam a empresas/unidades por tabelas N:N e recebem perfis compostos por permissões.

## Jornada

`pacientes → atendimentos → movimentacoes_atendimento`. Triagem, prontuário, prescrições, pedidos, internações, documentos e contas referenciam obrigatoriamente `atendimento_id`.

## Convenções

Novas entidades usam UUID, `timestamptz`, metadados de criação/alteração, soft delete quando cabível e constraints de domínio. Registros clínicos assinados, documentos, auditoria e contas fechadas não sofrem exclusão física.

## Auditoria

`auditoria_eventos` é append-only, inclui correlação, ator, escopo, entidade, ação e alterações sanitizadas. Tokens e segredos são proibidos.
