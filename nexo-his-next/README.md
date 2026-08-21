# Nexo HIS Next

Nova geração independente do sistema legado em `tiss-faturamento/`. Este diretório possui aplicação, domínio, banco e documentação próprios; nenhuma rota ou tabela desta versão é carregada pelo produto atual.

## Princípios

- jornada única do paciente, da recepção à alta e ao ciclo de receita;
- contexto clínico persistente em vez de módulos desconectados;
- navegação determinada pelo perfil e setor;
- segurança multiempresa/unidade no banco;
- valores financeiros decimais, auditoria e operações idempotentes;
- pacotes TISS versionados e homologados, sem declarar como oficial um artefato não verificado.

## Estrutura

```text
apps/web/       nova interface React/Vite
apps/api/       domínio e futura API independente
database/       schema criado do zero e seeds
docs/           OpenAPI e decisões regulatórias
```

## Interface

A primeira estação operacional implementa uma interface hospitalar densa e orientada à jornada: busca global de paciente, contexto persistente, fluxo assistencial, ocupação, contas a fechar, glosas no prazo e pendências acionáveis. Ela não copia código, marcas ou identidade proprietária de outros produtos.

```bash
cd apps/web
npm install
npm run dev
```

## Banco

Execute em uma base vazia, nesta ordem:

1. `database/migrations/000_core.sql`;
2. `database/migrations/001_financial_cycle.sql`;
3. `database/migrations/002_reception.sql`;
4. `database/migrations/003_triage.sql`;
5. `database/migrations/004_triage_idempotency.sql`;
6. `database/migrations/005_user_profile.sql`;
7. `database/migrations/006_profile_onboarding.sql`;
8. após validação contábil, `database/seeds/financial_base.sql`.

O contrato inicial está em `docs/openapi.yaml`. Antes de qualquer transmissão real ainda são obrigatórios adaptador TISS da versão contratada, validação XSD, assinatura ICP-Brasil e homologação da operadora.

## Fronteira com o legado

Não importe módulos de `tiss-faturamento/` diretamente. Integração e migração de dados deverão ocorrer por APIs versionadas e jobs reexecutáveis, com reconciliação de totais e relatório de divergências.

## Publicação na Vercel

O código-fonte continua independente, mas uma cópia compilada da interface é publicada pelo frontend legado em:

```text
https://faturamento-tiss.vercel.app/nexo
```

Os arquivos em `tiss-faturamento/frontend/public/nexo` são somente artefatos de distribuição; a fonte permanece neste diretório. Para publicar a nova geração em domínio totalmente independente:

1. crie um segundo projeto na Vercel usando o mesmo repositório;
2. em **Root Directory**, selecione `nexo-his-next`;
3. mantenha os comandos de `vercel.json`, que instalam e compilam somente `apps/web`;
4. associe um domínio próprio, por exemplo `nexo-his.vercel.app` ou `his.suaempresa.com.br`.

No projeto independente, a interface abre na raiz do novo domínio (`/`). No deploy legado, a regra específica da Vercel preserva `/nexo` e seus assets antes do fallback da aplicação antiga.

O comando `vercel-build` do frontend legado recompila esta fonte a cada deploy. Assim, `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` configuradas na Vercel são incorporadas à distribuição `/nexo`, sem duplicar código-fonte no legado.

Os bundles públicos usam os nomes estáveis `nexo-app.js` e `nexo-app.css`. Isso evita que um HTML mantido no cache referencie hashes removidos no deploy seguinte. As rotas da Vercel também mantêm compatibilidade com os primeiros hashes já publicados.

## Conexão com dados reais

Copie `apps/web/.env.example` para `apps/web/.env.local` e informe a URL e a chave pública `anon` do projeto Supabase criado pelas migrations. A interface exibe **Dados reais** somente após consultar com sucesso pacientes, internações, contas e glosas respeitando o JWT/RLS; sem configuração, mostra explicitamente **Demonstração**. Um token de sessão autenticado deve ser gravado em `sessionStorage` sob `nexo_access_token` pelo futuro módulo de login.

O ambiente de produção está apontado para o projeto Supabase institucional por meio de uma chave **publishable**, que é pública por definição. Nunca coloque `service_role`, senha de banco ou segredo de assinatura em arquivos `VITE_*`.

## Primeiro fluxo transacional

A migration `002_reception.sql` ativa o primeiro módulo completo: autenticação, cadastro real de paciente, registro de chegada, fila da recepção e avanço controlado pelos estados `AGENDADO → CHEGOU → TRIAGEM → EM_ATENDIMENTO → FINALIZADO`. Execute-a depois de `001_financial_cycle.sql`.

## Triagem e dashboard vivo

A migration `003_triage.sql` adiciona classificação de risco, sinais vitais, queixa principal e o RPC transacional que atualiza a etapa do atendimento. O dashboard deixa de usar números fixos para recepção, triagem, atendimento e internação quando conectado ao banco. A classificação é sempre escolhida pelo profissional habilitado; o sistema apenas valida limites técnicos dos dados informados.

## Correção de concorrência da triagem

A migration `004_triage_idempotency.sql` torna o registro idempotente: uma repetição devolve a triagem existente e uma classificação iniciada simultaneamente ao atendimento não perde os dados. Todas as mudanças de estado passam pela RPC `avancar_atendimento`, que bloqueia saltos de etapa e impede iniciar atendimento sem classificação concluída.

## Renovação de sessão

O cliente guarda access token, refresh token e vencimento somente em `sessionStorage`. Antes de uma consulta, renova preventivamente o JWT; diante de HTTP 401, tenta uma única renovação e repete a requisição. Se o refresh também estiver vencido ou revogado, limpa a sessão e retorna à tela de login, sem ciclo infinito de requisições.

## Identidade do usuário

As migrations `005_user_profile.sql` e `006_profile_onboarding.sql` liberam por RLS somente o próprio perfil e a unidade vinculada. No primeiro acesso sem cadastro, o RPC `garantir_meu_perfil` cria o vínculo automaticamente quando existe no máximo uma unidade; em instalações multiunidade, exige vínculo explícito de um administrador para evitar acesso à unidade errada. O cabeçalho, saudação, iniciais, setor, nível, nome da unidade e CNES passam a vir do banco; o e-mail é usado apenas como fallback.
