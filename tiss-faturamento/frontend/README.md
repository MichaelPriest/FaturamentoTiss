# Faturamento TISS

Aplicação React/Vite integrada ao Supabase para faturamento TISS 4.03.00.

## Desenvolvimento

1. O projeto atual já possui a URL e a chave pública `anon` usadas pelo cliente web em `.env.local`.
   Para outro ambiente/projeto Supabase, substitua os valores a partir de `.env.example` ou configure-os na plataforma de publicação.
2. Execute as migrations de `../database` na ordem cronológica. As migrations
   `20260807_multiempresa_rls.sql` e `20260808_painel_saas.sql` implantam o isolamento e o painel SaaS.
3. Instale e execute:

```bash
npm ci
npm run dev
```

## Modelo de acesso

- Uma **empresa** possui uma ou mais unidades.
- Cada **usuário** pertence a uma empresa e recebe acesso explícito a uma ou mais unidades.
- Dados operacionais, inclusive convênios e contratos, são visíveis somente nas unidades autorizadas ao usuário.
- **Pacientes** pertencem à empresa e são compartilhados entre todas as unidades da mesma empresa.
- A segurança é aplicada por Row Level Security no Supabase; filtros do frontend não são controles de segurança.
- A administração SaaS provisiona empresas, unidades e usuários por uma API privilegiada. A chave
  `service_role` existe somente no servidor e nunca pode usar o prefixo `VITE_`.

### Ativação do primeiro administrador SaaS

Depois das migrations, cadastre uma única vez o UUID de um usuário existente pelo SQL Editor:

```sql
insert into public.saas_administradores (usuario_id)
values ('UUID_DO_USUARIO_NO_SUPABASE_AUTH');
```

Configure `SUPABASE_SERVICE_ROLE_KEY` (chave legada `service_role`) ou `SUPABASE_SECRET_KEY`
(chave secreta atual) exclusivamente nas variáveis server-side da Vercel e publique novamente.
Em URLs de deploy que contêm `git-`, a variável precisa estar habilitada para o ambiente **Preview**.
O menu **Administração SaaS** permitirá cadastrar empresas, unidades, usuários, unidade padrão e todas as unidades
às quais cada usuário terá acesso.

## Proxy SOAP

O endpoint `/api/orizon-soap` exige um JWT Supabase válido, aceita somente HTTPS e somente hosts presentes em
`ORIZON_ALLOWED_HOSTS`. Configure no ambiente server-side:

- `SUPABASE_URL`;
- `SUPABASE_ANON_KEY`;
- `SUPABASE_SERVICE_ROLE_KEY` ou `SUPABASE_SECRET_KEY` (somente servidor, necessária para o painel SaaS);
- `ORIZON_ALLOWED_HOSTS` (domínios exatos, separados por vírgula);
- opcionalmente `ORIZON_CLIENT_PFX_BASE64` e `ORIZON_CLIENT_PFX_PASSPHRASE` para mTLS.

Nunca inclua credenciais reais, certificados ou chaves locais no Git.

## Build

```bash
npm run build
npm run preview
```
