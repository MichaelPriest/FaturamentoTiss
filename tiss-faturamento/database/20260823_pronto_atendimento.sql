-- Pronto atendimento: classificação de risco e fila assistencial auditável.
begin;

create table if not exists public.classificacoes_risco (
  id uuid primary key default gen_random_uuid(), empresa_id uuid, unidade_id uuid not null,
  paciente_id bigint not null references public.pacientes(id) on delete restrict,
  atendimento_id bigint references public.atendimentos(id) on delete set null,
  protocolo text not null default 'institucional',
  prioridade text not null check (prioridade in ('vermelho','laranja','amarelo','verde','azul')),
  queixa_principal text not null, inicio_sintomas text, alergias text, medicamentos_uso text,
  pressao_sistolica integer, pressao_diastolica integer, frequencia_cardiaca integer,
  frequencia_respiratoria integer, saturacao numeric(5,2), temperatura numeric(4,1), glicemia numeric(7,2),
  escala_dor smallint check (escala_dor between 0 and 10), observacoes text,
  status text not null default 'aguardando' check (status in ('aguardando','chamado','em_atendimento','finalizado','evasao')),
  classificado_por uuid default auth.uid(), classificado_em timestamptz not null default now(),
  chamado_em timestamptz, inicio_atendimento_em timestamptz, finalizado_em timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create index if not exists classificacoes_fila_idx
  on public.classificacoes_risco(unidade_id,status,prioridade,classificado_em);
create index if not exists classificacoes_paciente_idx
  on public.classificacoes_risco(paciente_id,classificado_em desc);

alter table public.classificacoes_risco enable row level security;
create policy unidade_select on public.classificacoes_risco for select to authenticated
  using (unidade_id=public.usuario_unidade_id());
create policy unidade_insert on public.classificacoes_risco for insert to authenticated
  with check (unidade_id=public.usuario_unidade_id());
create policy unidade_update on public.classificacoes_risco for update to authenticated
  using (unidade_id=public.usuario_unidade_id()) with check (unidade_id=public.usuario_unidade_id());
create policy unidade_delete on public.classificacoes_risco for delete to authenticated
  using (unidade_id=public.usuario_unidade_id());
create trigger aplicar_escopo_usuario_tg before insert or update on public.classificacoes_risco
  for each row execute function public.aplicar_escopo_usuario();

create or replace function public.atualizar_status_classificacao(p_classificacao_id uuid,p_status text)
returns public.classificacoes_risco language plpgsql security invoker as $$
declare resultado public.classificacoes_risco; begin
  if p_status not in ('aguardando','chamado','em_atendimento','finalizado','evasao') then
    raise exception 'Status assistencial inválido';
  end if;
  update public.classificacoes_risco set status=p_status,updated_at=now(),
    chamado_em=case when p_status='chamado' then coalesce(chamado_em,now()) else chamado_em end,
    inicio_atendimento_em=case when p_status='em_atendimento' then coalesce(inicio_atendimento_em,now()) else inicio_atendimento_em end,
    finalizado_em=case when p_status in ('finalizado','evasao') then coalesce(finalizado_em,now()) else finalizado_em end
  where id=p_classificacao_id returning * into resultado;
  if resultado.id is null then raise exception 'Classificação não encontrada'; end if;
  return resultado;
end $$;

grant select,insert,update,delete on public.classificacoes_risco to authenticated;
grant execute on function public.atualizar_status_classificacao(uuid,text) to authenticated;
commit;
