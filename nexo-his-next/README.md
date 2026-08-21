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
3. após validação contábil, `database/seeds/financial_base.sql`.

O contrato inicial está em `docs/openapi.yaml`. Antes de qualquer transmissão real ainda são obrigatórios adaptador TISS da versão contratada, validação XSD, assinatura ICP-Brasil e homologação da operadora.

## Fronteira com o legado

Não importe módulos de `tiss-faturamento/` diretamente. Integração e migração de dados deverão ocorrer por APIs versionadas e jobs reexecutáveis, com reconciliação de totais e relatório de divergências.

## Publicação na Vercel

O endereço `https://faturamento-tiss.vercel.app/` continua sendo o projeto legado e não expõe esta aplicação em uma subrota. Para publicar a nova geração sem misturar os projetos:

1. crie um segundo projeto na Vercel usando o mesmo repositório;
2. em **Root Directory**, selecione `nexo-his-next`;
3. mantenha os comandos de `vercel.json`, que instalam e compilam somente `apps/web`;
4. associe um domínio próprio, por exemplo `nexo-his.vercel.app` ou `his.suaempresa.com.br`.

Depois do deploy, a nova interface abre na raiz do novo domínio (`/`). Ela não está disponível em `/nexo`, `/next` ou `/nexo-his-next` no domínio legado até que seja criada, deliberadamente, uma regra de proxy entre os dois projetos.
