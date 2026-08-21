export const SECTOR_WORKSPACES = [
  { id: 'todos', name: 'Visão geral', shortName: 'Geral', description: 'Indicadores integrados de toda a instituição', color: 'blue', items: [] },
  { id: 'recepcao', name: 'Recepção e agenda', shortName: 'Recepção', description: 'Jornada do paciente, agenda e filas', color: 'cyan', items: ['dashboard','pacientes','agendamentos','ocupacao','atendimentos','central-assistencial','chamados','chamados-painel'] },
  { id: 'assistencial', name: 'Assistência clínica', shortName: 'Assistencial', description: 'Atendimento, internação, prescrição e prontuário', color: 'emerald', items: ['dashboard','pacientes','atendimentos','central-assistencial'] },
  { id: 'diagnostico', name: 'Laboratório e imagem', shortName: 'Diagnóstico', description: 'Solicitações, coleta, processamento e resultados', color: 'violet', items: ['dashboard','pacientes','central-assistencial','atendimentos'] },
  { id: 'farmacia', name: 'Farmácia e suprimentos', shortName: 'Farmácia', description: 'Estoque, dispensação e segurança medicamentosa', color: 'violet', items: ['dashboard','central-assistencial','procedimentos'] },
  { id: 'faturamento', name: 'Faturamento e auditoria', shortName: 'Faturamento', description: 'Autorizações, contas, lotes TISS e glosas', color: 'amber', items: ['dashboard','convenios','procedimentos','atendimentos','autorizacoes','faturamento','glosas','relatorios'] },
  { id: 'financeiro', name: 'Financeiro e gestão', shortName: 'Gestão', description: 'Receitas, despesas, unidades e indicadores', color: 'indigo', items: ['dashboard','financeiro','relatorios','prestadores','salas','unidades'] },
  { id: 'administracao', name: 'Administração do sistema', shortName: 'Administração', description: 'Cadastros, integrações, usuários e configurações', color: 'slate', items: ['dashboard','convenios','pacientes','prestadores','procedimentos','salas','unidades','homologacao-webservice','perfil','notificacoes','configuracoes','saas-admin'] }
];

export function getWorkspace(id) {
  return SECTOR_WORKSPACES.find(workspace => workspace.id === id) || SECTOR_WORKSPACES[0];
}

export function getUserWorkspace(user) {
  if (user?.role === 'admin' || user?.nivel_acesso === 'administrador') return getWorkspace('todos');
  return getWorkspace(user?.setor_acesso || 'recepcao');
}

export function filterMenuGroups(groups, workspaceId, canAccess = () => true) {
  const workspace = getWorkspace(workspaceId);
  return groups
    .map(group => ({
      ...group,
      items: group.items.filter(item => canAccess(item.id) && (workspace.id === 'todos' || workspace.items.includes(item.id) || ['perfil','notificacoes'].includes(item.id)))
    }))
    .filter(group => group.items.length > 0);
}
