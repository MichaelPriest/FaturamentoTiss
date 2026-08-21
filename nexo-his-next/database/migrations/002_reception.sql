-- Recepção e jornada inicial do paciente.
begin;
alter table public.pacientes alter column empresa_id set default public.usuario_empresa_id();
create table public.atendimentos (
  id uuid primary key default gen_random_uuid(), empresa_id uuid not null default public.usuario_empresa_id(),
  unidade_id uuid not null default public.usuario_unidade_id(), paciente_id bigint not null references public.pacientes(id) on delete restrict,
  tipo text not null check(tipo in ('CONSULTA','URGENCIA','EXAME','INTERNACAO')),
  status text not null default 'AGENDADO' check(status in ('AGENDADO','CHEGOU','TRIAGEM','EM_ATENDIMENTO','FINALIZADO','CANCELADO')),
  prioridade text not null default 'NORMAL' check(prioridade in ('NORMAL','PRIORITARIO','URGENTE')),
  data_agendada timestamptz, data_chegada timestamptz, observacoes text,
  created_by uuid not null default auth.uid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index atendimentos_fila_idx on public.atendimentos(unidade_id,status,data_chegada);

alter table public.pacientes enable row level security;
create policy pacientes_empresa_select on public.pacientes for select to authenticated using(empresa_id=public.usuario_empresa_id());
create policy pacientes_empresa_insert on public.pacientes for insert to authenticated with check(empresa_id=public.usuario_empresa_id());
alter table public.atendimentos enable row level security;
create policy atendimentos_unidade_select on public.atendimentos for select to authenticated using(unidade_id=public.usuario_unidade_id());
create policy atendimentos_unidade_insert on public.atendimentos for insert to authenticated with check(unidade_id=public.usuario_unidade_id() and empresa_id=public.usuario_empresa_id());
create policy atendimentos_unidade_update on public.atendimentos for update to authenticated using(unidade_id=public.usuario_unidade_id()) with check(unidade_id=public.usuario_unidade_id());
grant select,insert on public.pacientes to authenticated;
grant select,insert,update on public.atendimentos to authenticated;
commit;
