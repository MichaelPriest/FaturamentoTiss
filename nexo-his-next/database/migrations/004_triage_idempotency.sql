-- Corrige concorrência entre recepção, triagem e início do atendimento.
begin;
create or replace function public.registrar_triagem(p_atendimento_id uuid,p_classificacao text,p_queixa text,p_sistolica smallint default null,p_diastolica smallint default null,p_fc smallint default null,p_saturacao smallint default null,p_temperatura numeric default null,p_dor smallint default null,p_observacoes text default null)
returns public.triagens language plpgsql security invoker as $$
declare resultado public.triagens; atendimento public.atendimentos; begin
  select * into atendimento from public.atendimentos where id=p_atendimento_id and unidade_id=public.usuario_unidade_id() for update;
  if atendimento.id is null then raise exception 'Atendimento não encontrado nesta unidade'; end if;
  select * into resultado from public.triagens where atendimento_id=p_atendimento_id;
  if resultado.id is not null then return resultado; end if;
  if atendimento.status not in ('CHEGOU','TRIAGEM','EM_ATENDIMENTO') then raise exception 'Atendimento no estado % não pode receber triagem',atendimento.status; end if;
  insert into public.triagens(atendimento_id,classificacao,queixa_principal,pressao_sistolica,pressao_diastolica,frequencia_cardiaca,saturacao,temperatura,escala_dor,observacoes)
  values(p_atendimento_id,p_classificacao,p_queixa,p_sistolica,p_diastolica,p_fc,p_saturacao,p_temperatura,p_dor,p_observacoes) returning * into resultado;
  update public.atendimentos set status=case when status='EM_ATENDIMENTO' then status else 'TRIAGEM' end,
    prioridade=case when p_classificacao in ('VERMELHO','LARANJA') then 'URGENTE' when p_classificacao='AMARELO' then 'PRIORITARIO' else 'NORMAL' end,updated_at=now()
  where id=p_atendimento_id;
  return resultado;
end $$;

create or replace function public.avancar_atendimento(p_atendimento_id uuid,p_novo_status text) returns public.atendimentos
language plpgsql security invoker as $$
declare atual public.atendimentos; resultado public.atendimentos; permitido boolean; begin
  select * into atual from public.atendimentos where id=p_atendimento_id and unidade_id=public.usuario_unidade_id() for update;
  if atual.id is null then raise exception 'Atendimento não encontrado nesta unidade'; end if;
  permitido := (atual.status='AGENDADO' and p_novo_status='CHEGOU') or (atual.status='CHEGOU' and p_novo_status='TRIAGEM')
    or (atual.status='TRIAGEM' and p_novo_status='EM_ATENDIMENTO') or (atual.status='EM_ATENDIMENTO' and p_novo_status='FINALIZADO');
  if not permitido then raise exception 'Transição inválida: % para %',atual.status,p_novo_status; end if;
  if p_novo_status='EM_ATENDIMENTO' and not exists(select 1 from public.triagens where atendimento_id=atual.id) then raise exception 'Conclua a classificação de risco antes de iniciar o atendimento'; end if;
  update public.atendimentos set status=p_novo_status,updated_at=now() where id=atual.id returning * into resultado;
  return resultado;
end $$;
grant execute on function public.avancar_atendimento(uuid,text) to authenticated;
commit;
