-- Planos dos convênios e emissão atômica de senhas para o fluxo assistencial.
begin;

create table if not exists public.planos_convenio (
  id uuid primary key default gen_random_uuid(),
  convenio_id bigint not null references public.convenios(id) on delete cascade,
  nome text not null,
  codigo text,
  acomodacao text not null default 'ambulatorial',
  coparticipacao boolean not null default false,
  percentual_coparticipacao numeric(5,2) not null default 0 check (percentual_coparticipacao between 0 and 100),
  ativo boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(convenio_id, nome)
);

create table if not exists public.sequencias_senha (
  unidade_id uuid not null references public.unidades(id) on delete cascade,
  data date not null default current_date,
  prefixo text not null,
  ultimo_numero integer not null default 0,
  primary key (unidade_id, data, prefixo)
);

alter table public.planos_convenio enable row level security;
alter table public.sequencias_senha enable row level security;
create policy planos_select on public.planos_convenio for select to authenticated using (true);
create policy planos_write on public.planos_convenio for all to authenticated using (true) with check (true);
create policy senha_unidade on public.sequencias_senha for all to authenticated
  using (unidade_id=public.usuario_unidade_id()) with check (unidade_id=public.usuario_unidade_id());

grant select,insert,update,delete on public.planos_convenio to authenticated;
grant select,insert,update on public.sequencias_senha to authenticated;

create or replace function public.proxima_senha_atendimento(p_unidade_id uuid, p_preferencial boolean default false)
returns text language plpgsql security invoker as $$
declare v_prefixo text := case when p_preferencial then 'P' else 'A' end; v_numero integer;
begin
  if p_unidade_id is null or p_unidade_id <> public.usuario_unidade_id() then raise exception 'Unidade inválida'; end if;
  insert into public.sequencias_senha(unidade_id,data,prefixo,ultimo_numero)
    values(p_unidade_id,current_date,v_prefixo,1)
    on conflict(unidade_id,data,prefixo) do update set ultimo_numero=sequencias_senha.ultimo_numero+1
    returning ultimo_numero into v_numero;
  return v_prefixo || lpad(v_numero::text,3,'0');
end $$;
grant execute on function public.proxima_senha_atendimento(uuid,boolean) to authenticated;

-- Vincula a fila de chamada à classificação de risco sem duplicar pacientes.
alter table public.classificacoes_risco add column if not exists chamado_id uuid references public.chamados(id) on delete set null;
create unique index if not exists classificacoes_chamado_uidx on public.classificacoes_risco(chamado_id) where chamado_id is not null;

create or replace function public.encaminhar_chamado_triagem(p_chamado_id uuid, p_queixa text default 'Aguardando avaliação da triagem')
returns public.classificacoes_risco language plpgsql security invoker as $$
declare v_chamado public.chamados; v_resultado public.classificacoes_risco;
begin
  select * into v_chamado from public.chamados where id=p_chamado_id for update;
  if v_chamado.id is null then raise exception 'Senha não encontrada'; end if;
  if v_chamado.paciente_id is null or v_chamado.paciente_id !~ '^\\d+$' then raise exception 'Vincule um paciente cadastrado à senha'; end if;
  insert into public.classificacoes_risco(unidade_id,paciente_id,chamado_id,prioridade,queixa_principal,status)
    values(v_chamado.unidade_id,v_chamado.paciente_id::bigint,v_chamado.id,'verde',coalesce(nullif(trim(p_queixa),''),'Aguardando avaliação da triagem'),'aguardando')
    on conflict(chamado_id) where chamado_id is not null do update set updated_at=now()
    returning * into v_resultado;
  update public.chamados set status='finalizado',finalizado_em=now(),updated_at=now(),destino_tipo='triagem',destino_nome='Triagem' where id=p_chamado_id;
  return v_resultado;
end $$;
grant execute on function public.encaminhar_chamado_triagem(uuid,text) to authenticated;
commit;
