-- Conclui a classificação e encaminha o paciente para a estação clínica
-- na mesma transação, evitando atendimentos presos no estado TRIAGEM.
begin;

create or replace function public.concluir_triagem_e_encaminhar(
  p_atendimento_id uuid,
  p_classificacao text,
  p_queixa text,
  p_sistolica smallint default null,
  p_diastolica smallint default null,
  p_fc smallint default null,
  p_saturacao smallint default null,
  p_temperatura numeric default null,
  p_dor smallint default null,
  p_observacoes text default null
) returns public.atendimentos
language plpgsql security invoker as $$
declare
  v_atendimento public.atendimentos;
begin
  perform public.registrar_triagem(
    p_atendimento_id, p_classificacao, p_queixa, p_sistolica,
    p_diastolica, p_fc, p_saturacao, p_temperatura, p_dor, p_observacoes
  );

  select * into v_atendimento
    from public.atendimentos
   where id = p_atendimento_id
     and unidade_id = public.usuario_unidade_id()
   for update;

  if v_atendimento.status = 'TRIAGEM' then
    return public.avancar_atendimento(p_atendimento_id, 'EM_ATENDIMENTO');
  end if;
  if v_atendimento.status = 'EM_ATENDIMENTO' then
    return v_atendimento;
  end if;
  raise exception 'Classificação concluída, mas o atendimento está no estado %', v_atendimento.status;
end $$;

revoke all on function public.concluir_triagem_e_encaminhar(uuid,text,text,smallint,smallint,smallint,smallint,numeric,smallint,text) from public;
grant execute on function public.concluir_triagem_e_encaminhar(uuid,text,text,smallint,smallint,smallint,smallint,numeric,smallint,text) to authenticated;

commit;
