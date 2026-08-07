# Faturamento TISS

Aplicação React/Vite integrada ao Supabase para faturamento TISS 4.03.00.

## Desenvolvimento

1. O projeto atual já possui a URL e a chave pública `anon` usadas pelo cliente web em `.env.local`.
   Para outro ambiente/projeto Supabase, substitua os valores a partir de `.env.example` ou configure-os na plataforma de publicação.
2. Execute as migrations de `../database` na ordem cronológica. A migration
   `20260807_multiempresa_rls.sql` implanta o isolamento obrigatório.
3. Instale e execute:

```bash
npm ci
npm run dev
```

## Modelo de acesso

- Uma **empresa** possui uma ou mais unidades.
- Cada **usuário** pertence a uma empresa e a exatamente uma unidade operacional.
- Dados operacionais, inclusive convênios e contratos, são visíveis somente na unidade do usuário.
- **Pacientes** pertencem à empresa e são compartilhados entre todas as unidades da mesma empresa.
- A segurança é aplicada por Row Level Security no Supabase; filtros do frontend não são controles de segurança.
- A futura administração SaaS deve provisionar empresas, unidades e usuários por backend privilegiado. A chave
  `service_role` nunca pode ser usada no navegador ou em variável com prefixo `VITE_`.

Antes de aplicar a migration em produção, preencha `usuarios.unidade_id` para cada usuário existente. Usuários sem
unidade configurada não terão acesso a dados operacionais, de forma intencional.

## Proxy SOAP

O endpoint `/api/orizon-soap` exige um JWT Supabase válido, aceita somente HTTPS e somente hosts presentes em
`ORIZON_ALLOWED_HOSTS`. Configure no ambiente server-side:

- `SUPABASE_URL`;
- `SUPABASE_ANON_KEY`;
- `ORIZON_ALLOWED_HOSTS` (domínios exatos, separados por vírgula);
- opcionalmente `ORIZON_CLIENT_PFX_BASE64` e `ORIZON_CLIENT_PFX_PASSPHRASE` para mTLS.

Nunca inclua credenciais reais, certificados ou chaves locais no Git.

## Build

```bash
npm run build
npm run preview
```
