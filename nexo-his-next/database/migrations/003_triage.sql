-- Classificação de risco vinculada à chegada da recepção.
begin;
create table public.triagens (
  id uuid primary key default gen_random_uuid(), empresa_id uuid not null default public.usuario_empresa_id(),
  unidade_id uuid not null default public.usuario_unidade_id(), atendimento_id uuid not null references public.atendimentos(id) on delete restrict,
  classificacao text not null check(classificacao in ('AZUL','VERDE','AMARELO','LARANJA','VERMELHO')),
  queixa_principal text not null check(length(trim(queixa_principal))>=3),
  pressao_sistolica smallint check(pressao_sistolica between 40 and 300), pressao_diastolica smallint check(pressao_diastolica between 20 and 200),
  frequencia_cardiaca smallint check(frequencia_cardiaca between 20 and 250), saturacao smallint check(saturacao between 40 and 100),
  temperatura numeric(4,1) check(temperatura between 30 and 45), escala_dor smallint check(escala_dor between 0 and 10),
  observacoes text, profissional_id uuid not null default auth.uid(), realizada_em timestamptz not null default now(),
  created_at timestamptz not null default now(), unique(atendimento_id)
);
create index triagens_unidade_classificacao_idx on public.triagens(unidade_id,classificacao,realizada_em);
alter table public.triagens enable row level security;
create policy triagens_unidade_select on public.triagens for select to authenticated using(unidade_id=public.usuario_unidade_id());
create policy triagens_unidade_insert on public.triagens for insert to authenticated with check(unidade_id=public.usuario_unidade_id() and empresa_id=public.usuario_empresa_id());

create or replace function public.registrar_triagem(p_atendimento_id uuid,p_classificacao text,p_queixa text,p_sistolica smallint default null,p_diastolica smallint default null,p_fc smallint default null,p_saturacao smallint default null,p_temperatura numeric default null,p_dor smallint default null,p_observacoes text default null)
returns public.triagens language plpgsql security invoker as $$
declare resultado public.triagens; begin
  if not exists(select 1 from public.atendimentos where id=p_atendimento_id and unidade_id=public.usuario_unidade_id() and status in ('CHEGOU','TRIAGEM')) then raise exception 'Atendimento não está disponível para triagem'; end if;
  insert into public.triagens(atendimento_id,classificacao,queixa_principal,pressao_sistolica,pressao_diastolica,frequencia_cardiaca,saturacao,temperatura,escala_dor,observacoes)
  values(p_atendimento_id,p_classificacao,p_queixa,p_sistolica,p_diastolica,p_fc,p_saturacao,p_temperatura,p_dor,p_observacoes) returning * into resultado;
  update public.atendimentos set status='TRIAGEM',prioridade=case when p_classificacao in ('VERMELHO','LARANJA') then 'URGENTE' when p_classificacao='AMARELO' then 'PRIORITARIO' else 'NORMAL' end,updated_at=now() where id=p_atendimento_id;
  return resultado;
end $$;
grant select,insert on public.triagens to authenticated;
grant execute on function public.registrar_triagem(uuid,text,text,smallint,smallint,smallint,smallint,numeric,smallint,text) to authenticated;
commit;
