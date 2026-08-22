# Segurança

- Autenticação SSR em cookies `httpOnly`, `secure` em produção e `sameSite=lax`.
- Rotas privadas protegidas no middleware e revalidadas no servidor.
- RLS em toda relação exposta; isolamento por vínculo ativo de empresa e unidade.
- Funções `security definer` são excepcionais, usam `search_path` fixo, verificam escopo e têm `PUBLIC` revogado.
- Buckets clínicos privados; MIME, extensão e tamanho validados; download por URL assinada curta.
- Auditoria append-only e correlação por requisição.
- Preview nunca aponta automaticamente para produção.
- Backup do banco e Storage deve ser configurado externamente e testado por restauração.
