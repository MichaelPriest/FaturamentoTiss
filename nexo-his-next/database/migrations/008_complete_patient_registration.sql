-- Cadastro demográfico completo e vínculo financeiro por atendimento.
begin;
alter table public.pacientes add column if not exists nome_social text;
alter table public.pacientes add column if not exists sexo text check(sexo is null or sexo in ('FEMININO','MASCULINO','INTERSEXO','NAO_INFORMADO'));
alter table public.pacientes add column if not exists nome_mae text;
alter table public.pacientes add column if not exists telefone text;
alter table public.pacientes add column if not exists email text;
alter table public.pacientes add column if not exists cep text;
alter table public.pacientes add column if not exists logradouro text;
alter table public.pacientes add column if not exists numero text;
alter table public.pacientes add column if not exists complemento text;
alter table public.pacientes add column if not exists bairro text;
alter table public.pacientes add column if not exists cidade text;
alter table public.pacientes add column if not exists uf char(2);
create unique index if not exists pacientes_empresa_cpf_uidx on public.pacientes(empresa_id,cpf) where cpf is not null;

alter table public.atendimentos add column if not exists modalidade_pagamento text not null default 'PARTICULAR' check(modalidade_pagamento in ('PARTICULAR','CONVENIO'));
alter table public.atendimentos add column if not exists convenio_id bigint references public.convenios(id);
alter table public.atendimentos add column if not exists numero_carteirinha text;
alter table public.atendimentos add column if not exists validade_carteirinha date;

alter table public.convenios enable row level security;
create policy convenios_unidade_select on public.convenios for select to authenticated using(unidade_id=public.usuario_unidade_id());
grant select on public.convenios to authenticated;

create or replace function public.registrar_chegada_completa(p_paciente jsonb,p_atendimento jsonb)
returns public.atendimentos language plpgsql security definer set search_path=public as $$
declare v_paciente_id bigint; v_resultado public.atendimentos; v_modalidade text; v_convenio bigint; begin
  v_modalidade:=coalesce(p_atendimento->>'modalidade_pagamento','PARTICULAR');
  v_convenio:=nullif(p_atendimento->>'convenio_id','')::bigint;
  if v_modalidade='CONVENIO' and (v_convenio is null or nullif(trim(p_atendimento->>'numero_carteirinha'),'') is null) then raise exception 'Convênio e número da carteirinha são obrigatórios'; end if;
  if v_modalidade='PARTICULAR' then v_convenio:=null; end if;
  if v_convenio is not null and not exists(select 1 from public.convenios where id=v_convenio and unidade_id=public.usuario_unidade_id()) then raise exception 'Convênio não disponível nesta unidade'; end if;
  insert into public.pacientes(empresa_id,nome,nome_social,cpf,data_nascimento,sexo,nome_mae,telefone,email,cep,logradouro,numero,complemento,bairro,cidade,uf)
  values(public.usuario_empresa_id(),trim(p_paciente->>'nome'),nullif(trim(p_paciente->>'nome_social'),''),nullif(regexp_replace(p_paciente->>'cpf','\D','','g'),''),nullif(p_paciente->>'data_nascimento','')::date,nullif(p_paciente->>'sexo',''),nullif(trim(p_paciente->>'nome_mae'),''),nullif(regexp_replace(p_paciente->>'telefone','\D','','g'),''),nullif(lower(trim(p_paciente->>'email')),''),nullif(regexp_replace(p_paciente->>'cep','\D','','g'),''),nullif(trim(p_paciente->>'logradouro'),''),nullif(trim(p_paciente->>'numero'),''),nullif(trim(p_paciente->>'complemento'),''),nullif(trim(p_paciente->>'bairro'),''),nullif(trim(p_paciente->>'cidade'),''),nullif(upper(trim(p_paciente->>'uf')),'')) returning id into v_paciente_id;
  insert into public.atendimentos(empresa_id,unidade_id,paciente_id,tipo,status,prioridade,data_chegada,observacoes,modalidade_pagamento,convenio_id,numero_carteirinha,validade_carteirinha)
  values(public.usuario_empresa_id(),public.usuario_unidade_id(),v_paciente_id,p_atendimento->>'tipo','CHEGOU',coalesce(p_atendimento->>'prioridade','NORMAL'),now(),nullif(trim(p_atendimento->>'observacoes'),''),v_modalidade,v_convenio,case when v_modalidade='CONVENIO' then trim(p_atendimento->>'numero_carteirinha') end,case when v_modalidade='CONVENIO' then nullif(p_atendimento->>'validade_carteirinha','')::date end) returning * into v_resultado;
  return v_resultado;
end$$;
revoke all on function public.registrar_chegada_completa(jsonb,jsonb) from public;
grant execute on function public.registrar_chegada_completa(jsonb,jsonb) to authenticated;
commit;
