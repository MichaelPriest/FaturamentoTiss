-- Atendimento clínico com evolução SOAP e encerramento transacional.
begin;
create table public.evolucoes_clinicas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null default public.usuario_empresa_id(),
  unidade_id uuid not null default public.usuario_unidade_id(),
  atendimento_id uuid not null references public.atendimentos(id) on delete restrict,
  subjetivo text not null check(length(trim(subjetivo))>=3),
  objetivo text not null check(length(trim(objetivo))>=3),
  avaliacao text not null check(length(trim(avaliacao))>=3),
  plano text not null check(length(trim(plano))>=3),
  cid10 text,
  desfecho text not null default 'PERMANECE' check(desfecho in ('PERMANECE','ALTA','INTERNACAO','TRANSFERENCIA')),
  profissional_id uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);
create index evolucoes_atendimento_idx on public.evolucoes_clinicas(atendimento_id,created_at desc);
alter table public.evolucoes_clinicas enable row level security;
create policy evolucoes_unidade_select on public.evolucoes_clinicas for select to authenticated using(unidade_id=public.usuario_unidade_id());

create or replace function public.registrar_evolucao_clinica(p_atendimento_id uuid,p_subjetivo text,p_objetivo text,p_avaliacao text,p_plano text,p_cid10 text default null,p_desfecho text default 'PERMANECE',p_finalizar boolean default false)
returns public.evolucoes_clinicas language plpgsql security definer set search_path=public as $$
declare v_atendimento public.atendimentos; v_resultado public.evolucoes_clinicas; begin
  select * into v_atendimento from public.atendimentos where id=p_atendimento_id and unidade_id=public.usuario_unidade_id() for update;
  if v_atendimento.id is null then raise exception 'Atendimento não encontrado nesta unidade'; end if;
  if v_atendimento.status<>'EM_ATENDIMENTO' then raise exception 'Atendimento deve estar em andamento para receber evolução'; end if;
  if p_finalizar and p_desfecho='PERMANECE' then raise exception 'Informe o desfecho para finalizar o atendimento'; end if;
  insert into public.evolucoes_clinicas(atendimento_id,subjetivo,objetivo,avaliacao,plano,cid10,desfecho)
  values(p_atendimento_id,trim(p_subjetivo),trim(p_objetivo),trim(p_avaliacao),trim(p_plano),nullif(upper(trim(p_cid10)),''),p_desfecho)
  returning * into v_resultado;
  if p_finalizar then update public.atendimentos set status='FINALIZADO',updated_at=now() where id=p_atendimento_id; end if;
  return v_resultado;
end$$;
revoke all on function public.registrar_evolucao_clinica(uuid,text,text,text,text,text,text,boolean) from public;
grant execute on function public.registrar_evolucao_clinica(uuid,text,text,text,text,text,text,boolean) to authenticated;
grant select on public.evolucoes_clinicas to authenticated;
commit;
