-- Painel de chamados por unidade.
create table if not exists public.chamados (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  categoria text not null default 'suporte',
  prioridade text not null default 'normal',
  status text not null default 'aberto',
  solicitante_id uuid,
  solicitante_nome text,
  responsavel_id uuid,
  responsavel_nome text,
  paciente_id text,
  paciente_nome text,
  senha text,
  origem_nome text,
  destino_tipo text,
  destino_nome text,
  agendamento_id text,
  chamado_em timestamptz,
  atendido_em timestamptz,
  finalizado_em timestamptz,
  unidade_id uuid references public.unidades(id) on delete set null,
  resolvido_em timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chamados_unidade_status_idx on public.chamados (unidade_id, status, prioridade, created_at desc);
create index if not exists chamados_solicitante_idx on public.chamados (solicitante_id, created_at desc);
create index if not exists chamados_paciente_idx on public.chamados (paciente_id, created_at desc);

alter table public.chamados
  add column if not exists paciente_id text,
  add column if not exists paciente_nome text,
  add column if not exists senha text,
  add column if not exists origem_nome text,
  add column if not exists destino_tipo text,
  add column if not exists destino_nome text,
  add column if not exists agendamento_id text,
  add column if not exists chamado_em timestamptz,
  add column if not exists atendido_em timestamptz,
  add column if not exists finalizado_em timestamptz;

-- Inclui chamados no sistema automático de notificações quando a migration de notificações já estiver aplicada.
do $$
begin
  if to_regclass('public.chamados') is not null and to_regprocedure('public.emitir_notificacao_acao()') is not null then
    drop trigger if exists chamados_notificar_acoes_tg on public.chamados;
    create trigger chamados_notificar_acoes_tg
      after insert or update or delete on public.chamados
      for each row execute function public.emitir_notificacao_acao();
  end if;
end $$;
