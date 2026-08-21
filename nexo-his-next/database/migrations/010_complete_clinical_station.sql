-- Estação clínica completa: evolução SOAP, prescrição, exames e orientações.
begin;

alter table public.evolucoes_clinicas
  add column if not exists prescricao text,
  add column if not exists exames_solicitados text,
  add column if not exists orientacoes text;

create or replace function public.registrar_atendimento_clinico(
  p_atendimento_id uuid, p_subjetivo text, p_objetivo text,
  p_avaliacao text, p_plano text, p_cid10 text default null,
  p_prescricao text default null, p_exames text default null,
  p_orientacoes text default null, p_desfecho text default 'PERMANECE',
  p_finalizar boolean default false
) returns public.evolucoes_clinicas
language plpgsql security definer set search_path=public as $$
declare v_atendimento public.atendimentos; v_resultado public.evolucoes_clinicas;
begin
  select * into v_atendimento from public.atendimentos
   where id=p_atendimento_id and unidade_id=public.usuario_unidade_id() for update;
  if v_atendimento.id is null then raise exception 'Atendimento não encontrado nesta unidade'; end if;
  if v_atendimento.status<>'EM_ATENDIMENTO' then raise exception 'Atendimento deve estar em andamento para receber evolução'; end if;
  if p_finalizar and p_desfecho='PERMANECE' then raise exception 'Informe o desfecho para finalizar o atendimento'; end if;
  if p_finalizar and nullif(trim(p_orientacoes),'') is null then raise exception 'Informe as orientações de alta ou encaminhamento'; end if;
  insert into public.evolucoes_clinicas(
    atendimento_id,subjetivo,objetivo,avaliacao,plano,cid10,prescricao,
    exames_solicitados,orientacoes,desfecho
  ) values (
    p_atendimento_id,trim(p_subjetivo),trim(p_objetivo),trim(p_avaliacao),trim(p_plano),
    nullif(upper(trim(p_cid10)),''),nullif(trim(p_prescricao),''),nullif(trim(p_exames),''),
    nullif(trim(p_orientacoes),''),p_desfecho
  ) returning * into v_resultado;
  if p_finalizar then
    update public.atendimentos set status='FINALIZADO',updated_at=now() where id=p_atendimento_id;
  end if;
  return v_resultado;
end $$;

revoke all on function public.registrar_atendimento_clinico(uuid,text,text,text,text,text,text,text,text,text,boolean) from public;
grant execute on function public.registrar_atendimento_clinico(uuid,text,text,text,text,text,text,text,text,text,boolean) to authenticated;
commit;
