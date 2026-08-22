# Matriz de permissões

| Perfil | Escopo principal | Permissões iniciais |
|---|---|---|
| Administrador do sistema | global | `sistema.administrar`, `auditoria.visualizar` |
| Administrador da empresa | empresa | `empresa.administrar`, `usuarios.gerenciar` |
| Administrador da unidade | unidade | `unidade.administrar`, `estrutura.gerenciar` |
| Recepção | unidade | `pacientes.visualizar/criar/editar`, `atendimentos.abrir` |
| Triagem | unidade | `pacientes.visualizar`, `triagem.registrar` |
| Médico | unidade/vínculo | `prontuario.visualizar/evoluir`, `prescricao.criar`, `atendimentos.alta` |
| Enfermagem | unidade | `prontuario.visualizar`, `enfermagem.evoluir`, `prescricao.checar` |
| Farmácia | unidade | `prescricao.visualizar`, `farmacia.dispensar` |
| Faturamento | unidade | `faturamento.visualizar/fechar`, sem evolução clínica |
| Auditoria | empresa | `auditoria.visualizar`, somente leitura |

Permissões são registros, não comparações com nomes de perfis. RLS repete os limites críticos no banco.
