# Nexo Hospitalar

Plataforma React/Vite integrada ao Supabase para jornada assistencial, operação hospitalar, faturamento e comunicação TISS 4.03.00.

## Áreas integradas

- **Central Assistencial:** pronto atendimento, classificação de risco, internação, leitos, prescrição, enfermagem, farmácia, laboratório, imagem e centro cirúrgico em uma navegação única.
- **Jornada ambulatorial:** pacientes, agenda, ocupação, atendimentos, procedimentos e prontuário.
- **Receita e auditoria:** autorizações, faturamento TISS, lotes, glosas, financeiro e relatórios.
- **Administração:** unidades, prestadores, convênios, salas, usuários, configurações e integrações.

A árvore de navegação não é escolhida manualmente. Ela é montada a partir de `setor_acesso` e `nivel_acesso` do usuário; administradores recebem a visão institucional. As rotas e as tabelas hospitalares repetem a validação no frontend e nas políticas RLS.

## Desenvolvimento

1. O projeto atual já possui a URL e a chave pública `anon` usadas pelo cliente web em `.env.local`.
   Para outro ambiente/projeto Supabase, substitua os valores a partir de `.env.example` ou configure-os na plataforma de publicação.
2. Execute as migrations de `../database` na ordem cronológica. As migrations
   `20260807_multiempresa_rls.sql` e `20260808_painel_saas.sql` implantam o isolamento e o painel SaaS.
   Para os recursos hospitalares, aplique também, nesta ordem:
   - `20260821_operacao_hospitalar.sql`;
   - `20260822_prescricao_enfermagem.sql`;
   - `20260823_pronto_atendimento.sql`;
   - `20260824_diagnostico.sql`;
   - `20260825_acesso_setorial.sql`;
   - `20260826_centro_cirurgico.sql`.
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
- Cada usuário operacional possui um único setor principal (`recepcao`, `assistencial`, `diagnostico`, `farmacia`, `faturamento` ou `financeiro`) e nível (`operador`, `supervisor` ou `administrador`).
- A Central Assistencial mostra somente as áreas autorizadas para o setor. Seletores de pacientes permitem busca digitando nome, CPF ou código disponível.
- Listas de internação exibem somente internações ativas; altas permanecem preservadas no banco para histórico e auditoria.
- A administração SaaS provisiona empresas, unidades e usuários por uma API privilegiada. A chave
  `service_role` existe somente no servidor e nunca pode usar o prefixo `VITE_`.

### Ativação do primeiro administrador SaaS

Depois das migrations, cadastre uma única vez o UUID de um usuário existente pelo SQL Editor:

```sql
insert into public.saas_administradores (usuario_id)
values ('UUID_DO_USUARIO_NO_SUPABASE_AUTH');
```

Configure `SUPABASE_SERVICE_ROLE_KEY` exclusivamente nas variáveis server-side da Vercel e publique novamente.
O menu **Administração SaaS** permitirá cadastrar empresas, unidades, usuários, unidade padrão e todas as unidades
às quais cada usuário terá acesso.

## Proxy SOAP

O endpoint `/api/orizon-soap` exige um JWT Supabase válido, aceita somente HTTPS e somente hosts presentes em
`ORIZON_ALLOWED_HOSTS`. Configure no ambiente server-side:

- `SUPABASE_URL`;
- `SUPABASE_ANON_KEY`;
- `SUPABASE_SERVICE_ROLE_KEY` (somente servidor, necessária para o painel SaaS);
- `ORIZON_ALLOWED_HOSTS` (domínios exatos, separados por vírgula). Se omitida, a API permite somente os quatro hosts oficiais já usados pelos modelos Orizon de homologação e produção;
- opcionalmente `ORIZON_CLIENT_PFX_BASE64` e `ORIZON_CLIENT_PFX_PASSPHRASE` para mTLS.

Nunca inclua credenciais reais, certificados ou chaves locais no Git.

O cliente tenta primeiro a transmissão compactada e repete uma vez sem GZIP quando o servidor remoto rejeita a primeira tentativa. Mesmo com a aplicação configurada, a Orizon pode exigir liberação do IP de saída e certificado A1 no proxy; esses requisitos devem ser habilitados no ambiente da API.

## Build

```bash
npm run build
npm run preview
```
