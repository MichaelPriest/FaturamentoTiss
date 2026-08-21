# Arquitetura-alvo do Nexo Hospitalar

## Princípio

O produto evolui como um HIS integrado, e não como um conjunto de telas isoladas. A chave de navegação é o contexto do paciente e a chave de segurança é a combinação empresa, unidade, setor, nível e usuário. A interface utiliza padrões de estação clínica corporativa — alta densidade informacional, cabeçalho permanente do paciente, filas de trabalho e ações contextuais — sem copiar identidade, código ou componentes proprietários de outros produtos.

## Jornada ponta a ponta

1. **Cadastro mestre:** identificação, documentos, contatos, responsável, consentimentos e alertas cadastrais.
2. **Recepção:** agenda, elegibilidade, carteira, senha, chegada e abertura do atendimento.
3. **Triagem:** queixa, sinais vitais, classificação feita por profissional habilitado e fila por prioridade.
4. **Atendimento:** anamnese, evolução, problemas, diagnósticos, procedimentos e documentos.
5. **Internação:** admissão, leito, transferências, prescrições, checagens e evolução multiprofissional.
6. **Apoio terapêutico:** farmácia, materiais, laboratório, imagem, dietas e centro cirúrgico.
7. **Alta:** reconciliação, resumo de alta, orientações, retorno e liberação do leito.
8. **Conta assistencial:** captura dos itens, auditoria, autorização, crítica, valorização e fechamento.
9. **TISS:** geração, validação, assinatura/hash quando aplicável, transmissão, protocolo, demonstrativos, glosas e recursos.
10. **Financeiro e gestão:** contas, recebimentos, custos, indicadores e rastreabilidade.

## Contextos obrigatórios

- `empresa_id` e `unidade_id` em todo dado operacional;
- `paciente_id` em todo evento assistencial;
- `atendimento_id` e/ou `internacao_id` para determinar o episódio;
- usuário e profissional responsável separados;
- data/hora com fuso em eventos e data civil sem conversão em competências, validade e nascimento;
- trilha imutável para alteração, cancelamento, liberação e transmissão.

## Arquitetura de interface

- **Barra global:** unidade, setor, notificações, usuário e contingência.
- **Cabeçalho do paciente:** identificação, idade, episódio, leito, convênio e alertas.
- **Jornada:** recepção, triagem, atendimento, internação, terapêutica e alta.
- **Estação de trabalho:** abas permitidas pelo setor e ações do episódio selecionado.
- **Fila operacional:** prioridade, tempo, responsável e pendências.
- **Sidebar:** somente domínios de negócio; nenhuma troca manual de permissão ou setor.

## Segurança e LGPD

- RLS é obrigatório; ocultar menu não constitui autorização.
- Menor privilégio por setor e unidade.
- Dados clínicos não devem ser gravados em logs de navegador ou mensagens técnicas.
- Exportação e impressão devem ser auditáveis.
- Perfis administrativos não devem ser inferidos de metadados editáveis pelo cliente.
- Retenção, descarte, consentimento e atendimento aos direitos do titular precisam de política institucional documentada.

## Governança ANS/TISS

O sistema não deve declarar uma versão como “a mais atual” apenas por estar hardcoded. A versão precisa ser configurada por operadora/contrato e validada contra os artefatos oficiais vigentes antes da publicação:

- componente organizacional;
- componente de conteúdo e estrutura;
- componente de representação de conceitos em saúde;
- componente de comunicação;
- componente de segurança e privacidade;
- terminologias e tabelas TUSS da competência aplicável;
- schemas XSD, WSDL/endpoints e regras específicas da operadora.

Uma atualização normativa deve entrar como pacote versionado, com schemas, terminologias, data de vigência, testes de regressão, homologação por operadora e plano de rollback. Versão do XML, namespace, endpoint e validador devem ser compatíveis entre si.

## Estado atual e lacunas

### Entregue como fundação

- contexto e jornada do paciente;
- recepção/agenda e atendimentos;
- triagem e pronto atendimento;
- leitos, internação e alta operacional;
- prescrição e checagem;
- estoque hospitalar;
- laboratório/imagem;
- centro cirúrgico;
- autorização, faturamento, glosa e financeiro existentes;
- isolamento multiunidade e acesso setorial nos novos domínios.

### Necessário para um HIS completo

- MPI/deduplicação e histórico de fusão do paciente;
- evolução multiprofissional estruturada;
- problemas, alergias e reconciliação medicamentosa longitudinal;
- dispensação por dose/lote e rastreabilidade completa;
- banco de sangue, nutrição, CCIH, CME, higienização e manutenção;
- conta assistencial única com captura automática de consumo;
- terminologia clínica versionada e catálogo TUSS por competência;
- motor de regras de autorização e crítica por operadora;
- assinatura digital, gestão documental e contingência;
- auditoria imutável, observabilidade, backup e testes de restauração;
- suíte de integração para XSD, SOAP, protocolo, glosa e recurso;
- testes de banco executando todas as migrations em uma instância PostgreSQL limpa.

## Critério de pronto

Nenhum fluxo é considerado completo apenas porque a tela existe. Ele precisa ter persistência, RLS, auditoria, validação, estado de erro, contingência, testes automatizados, documentação, homologação de negócio e evidência de aderência à versão normativa configurada.
