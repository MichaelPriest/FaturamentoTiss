-- Fluxo médico ampliado: farmácia, documentos assinados, observação e reavaliação.
begin;
create extension if not exists pgcrypto;

create table if not exists public.solicitacoes_farmacia (
  id uuid primary key default gen_random_uuid(), empresa_id uuid not null default public.usuario_empresa_id(),
  unidade_id uuid not null default public.usuario_unidade_id(), atendimento_id uuid not null references public.atendimentos(id),
  paciente_id bigint not null references public.pacientes(id), prescricao_id uuid not null references public.evolucoes_clinicas(id),
  conteudo text not null, prioridade text not null default 'ROTINA' check(prioridade in ('ROTINA','URGENTE','IMEDIATA')),
  status text not null default 'PENDENTE' check(status in ('PENDENTE','EM_SEPARACAO','DISPENSADA','CANCELADA')),
  solicitado_por uuid not null default auth.uid(), solicitado_em timestamptz not null default now(), dispensado_em timestamptz
);
create index if not exists solicitacoes_farmacia_fila_idx on public.solicitacoes_farmacia(unidade_id,status,prioridade,solicitado_em);

create table if not exists public.documentos_medicos (
  id uuid primary key default gen_random_uuid(), empresa_id uuid not null default public.usuario_empresa_id(),
  unidade_id uuid not null default public.usuario_unidade_id(), atendimento_id uuid not null references public.atendimentos(id),
  paciente_id bigint not null references public.pacientes(id), tipo text not null check(tipo in ('ATESTADO','DECLARACAO','RELATORIO')),
  conteudo text not null, dias_afastamento smallint check(dias_afastamento between 1 and 365),
  medico_id uuid not null default auth.uid(), assinado_em timestamptz not null default now(), assinatura_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists documentos_medicos_paciente_idx on public.documentos_medicos(paciente_id,created_at desc);

create table if not exists public.movimentacoes_clinicas (
  id uuid primary key default gen_random_uuid(), empresa_id uuid not null default public.usuario_empresa_id(),
  unidade_id uuid not null default public.usuario_unidade_id(), atendimento_id uuid not null references public.atendimentos(id),
  tipo text not null check(tipo in ('OBSERVACAO','REAVALIACAO','INTERNACAO','ALTA','TRANSFERENCIA')),
  observacao text, reavaliar_em timestamptz, profissional_id uuid not null default auth.uid(), created_at timestamptz not null default now()
);

do $$ declare tabela text; begin
  foreach tabela in array array['solicitacoes_farmacia','documentos_medicos','movimentacoes_clinicas'] loop
    execute format('alter table public.%I enable row level security',tabela);
    execute format('create policy %I on public.%I for select to authenticated using(unidade_id=public.usuario_unidade_id())',tabela||'_select',tabela);
    execute format('create policy %I on public.%I for insert to authenticated with check(unidade_id=public.usuario_unidade_id() and empresa_id=public.usuario_empresa_id())',tabela||'_insert',tabela);
    execute format('create policy %I on public.%I for update to authenticated using(unidade_id=public.usuario_unidade_id()) with check(unidade_id=public.usuario_unidade_id())',tabela||'_update',tabela);
  end loop;
end $$;

drop function if exists public.registrar_atendimento_clinico(uuid,text,text,text,text,text,text,text,text,text,boolean);
create function public.registrar_atendimento_clinico(
  p_atendimento_id uuid,p_subjetivo text,p_objetivo text,p_avaliacao text,p_plano text,p_cid10 text default null,
  p_prescricao text default null,p_exames text default null,p_orientacoes text default null,p_desfecho text default 'PERMANECE',
  p_finalizar boolean default false,p_prioridade_farmacia text default 'ROTINA',p_emitir_atestado boolean default false,
  p_dias_atestado smallint default null,p_texto_atestado text default null,p_reavaliar_em timestamptz default null
) returns public.evolucoes_clinicas language plpgsql security definer set search_path=public as $$
declare a public.atendimentos; e public.evolucoes_clinicas; documento_texto text;
begin
  select * into a from public.atendimentos where id=p_atendimento_id and unidade_id=public.usuario_unidade_id() for update;
  if a.id is null or a.status<>'EM_ATENDIMENTO' then raise exception 'Atendimento clínico ativo não encontrado'; end if;
  if p_desfecho not in ('PERMANECE','REAVALIACAO','OBSERVACAO','ALTA','INTERNACAO','TRANSFERENCIA') then raise exception 'Desfecho inválido'; end if;
  if p_finalizar and p_desfecho in ('PERMANECE','REAVALIACAO','OBSERVACAO') then raise exception 'Selecione um desfecho definitivo para finalizar'; end if;
  if p_finalizar and nullif(trim(p_orientacoes),'') is null then raise exception 'Informe as orientações de alta ou encaminhamento'; end if;
  if p_desfecho='REAVALIACAO' and p_reavaliar_em is null then raise exception 'Informe quando o paciente deve ser reavaliado'; end if;
  if p_emitir_atestado and (p_dias_atestado is null or nullif(trim(p_texto_atestado),'') is null) then raise exception 'Informe dias e conteúdo do atestado'; end if;
  insert into public.evolucoes_clinicas(atendimento_id,subjetivo,objetivo,avaliacao,plano,cid10,prescricao,exames_solicitados,orientacoes,desfecho)
  values(a.id,trim(p_subjetivo),trim(p_objetivo),trim(p_avaliacao),trim(p_plano),nullif(upper(trim(p_cid10)),''),nullif(trim(p_prescricao),''),nullif(trim(p_exames),''),nullif(trim(p_orientacoes),''),case when p_desfecho in ('OBSERVACAO','REAVALIACAO') then 'PERMANECE' else p_desfecho end) returning * into e;
  if nullif(trim(p_prescricao),'') is not null then
    insert into public.solicitacoes_farmacia(atendimento_id,paciente_id,prescricao_id,conteudo,prioridade) values(a.id,a.paciente_id,e.id,trim(p_prescricao),p_prioridade_farmacia);
  end if;
  if p_emitir_atestado then
    documento_texto:=trim(p_texto_atestado);
    insert into public.documentos_medicos(atendimento_id,paciente_id,tipo,conteudo,dias_afastamento,assinatura_hash)
    values(a.id,a.paciente_id,'ATESTADO',documento_texto,p_dias_atestado,encode(digest(a.id::text||a.paciente_id::text||auth.uid()::text||documento_texto||clock_timestamp()::text,'sha256'),'hex'));
  end if;
  if p_desfecho<>'PERMANECE' then insert into public.movimentacoes_clinicas(atendimento_id,tipo,observacao,reavaliar_em) values(a.id,p_desfecho,p_orientacoes,p_reavaliar_em); end if;
  if p_desfecho='INTERNACAO' and not exists(select 1 from public.internacoes where paciente_id=a.paciente_id and status='ativa') then insert into public.internacoes(unidade_id,paciente_id,status) values(a.unidade_id,a.paciente_id,'ativa'); end if;
  if p_finalizar then update public.atendimentos set status='FINALIZADO',updated_at=now() where id=a.id; end if;
  return e;
end $$;
grant select,insert,update on public.solicitacoes_farmacia to authenticated;
grant select on public.documentos_medicos,public.movimentacoes_clinicas to authenticated;
grant execute on function public.registrar_atendimento_clinico(uuid,text,text,text,text,text,text,text,text,text,boolean,text,boolean,smallint,text,timestamptz) to authenticated;
commit;
