-- Prescrição eletrônica e checagem segura pela enfermagem.
begin;

create table if not exists public.prescricoes (
  id uuid primary key default gen_random_uuid(), empresa_id uuid, unidade_id uuid not null,
  internacao_id uuid not null references public.internacoes(id) on delete restrict,
  medico_id bigint references public.prestadores(id) on delete set null,
  data_prescricao date not null default current_date,
  status text not null default 'rascunho' check (status in ('rascunho','ativa','suspensa','encerrada')),
  observacoes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.prescricao_itens (
  id uuid primary key default gen_random_uuid(), empresa_id uuid, unidade_id uuid not null,
  prescricao_id uuid not null references public.prescricoes(id) on delete cascade,
  item_estoque_id uuid references public.estoque_itens(id) on delete set null,
  tipo text not null default 'medicamento' check (tipo in ('medicamento','dieta','cuidado','procedimento')),
  descricao text not null, dose text, via text, frequencia text, horarios text[] not null default '{}',
  inicio timestamptz not null default now(), fim timestamptz, se_necessario boolean not null default false,
  orientacoes text, status text not null default 'ativo' check (status in ('ativo','suspenso','concluido')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.administracoes_enfermagem (
  id uuid primary key default gen_random_uuid(), empresa_id uuid, unidade_id uuid not null,
  prescricao_item_id uuid not null references public.prescricao_itens(id) on delete restrict,
  horario_previsto timestamptz not null, horario_realizado timestamptz,
  status text not null check (status in ('administrado','recusado','nao_administrado','adiado')),
  profissional_id bigint references public.prestadores(id) on delete set null,
  observacao text, usuario_id uuid default auth.uid(), created_at timestamptz not null default now(),
  unique (prescricao_item_id, horario_previsto)
);

create index if not exists prescricoes_internacao_idx on public.prescricoes(internacao_id,data_prescricao desc);
create index if not exists prescricao_itens_prescricao_idx on public.prescricao_itens(prescricao_id,status);
create index if not exists administracoes_horario_idx on public.administracoes_enfermagem(unidade_id,horario_previsto desc);

do $$ declare tabela text; begin
  foreach tabela in array array['prescricoes','prescricao_itens','administracoes_enfermagem'] loop
    execute format('alter table public.%I enable row level security', tabela);
    execute format('create policy unidade_select on public.%I for select to authenticated using (unidade_id = public.usuario_unidade_id())', tabela);
    execute format('create policy unidade_insert on public.%I for insert to authenticated with check (unidade_id = public.usuario_unidade_id())', tabela);
    execute format('create policy unidade_update on public.%I for update to authenticated using (unidade_id = public.usuario_unidade_id()) with check (unidade_id = public.usuario_unidade_id())', tabela);
    execute format('create policy unidade_delete on public.%I for delete to authenticated using (unidade_id = public.usuario_unidade_id())', tabela);
    execute format('create trigger aplicar_escopo_usuario_tg before insert or update on public.%I for each row execute function public.aplicar_escopo_usuario()', tabela);
  end loop;
end $$;

create or replace function public.ativar_prescricao(p_prescricao_id uuid)
returns public.prescricoes language plpgsql security invoker as $$
declare resultado public.prescricoes; begin
  if not exists(select 1 from public.prescricao_itens where prescricao_id=p_prescricao_id and status='ativo') then
    raise exception 'Inclua ao menos um item antes de ativar a prescrição';
  end if;
  update public.prescricoes set status='encerrada',updated_at=now()
   where internacao_id=(select internacao_id from public.prescricoes where id=p_prescricao_id) and status='ativa' and id<>p_prescricao_id;
  update public.prescricoes set status='ativa',updated_at=now() where id=p_prescricao_id and status='rascunho' returning * into resultado;
  if resultado.id is null then raise exception 'Prescrição em rascunho não encontrada'; end if;
  return resultado;
end $$;

create or replace function public.checar_administracao(
  p_item_id uuid, p_horario_previsto timestamptz, p_status text,
  p_profissional_id bigint default null, p_observacao text default null
) returns public.administracoes_enfermagem language plpgsql security invoker as $$
declare item public.prescricao_itens; resultado public.administracoes_enfermagem; begin
  if p_status not in ('administrado','recusado','nao_administrado','adiado') then raise exception 'Status de checagem inválido'; end if;
  select pi.* into item from public.prescricao_itens pi
    join public.prescricoes p on p.id=pi.prescricao_id
    where pi.id=p_item_id and pi.status='ativo' and p.status='ativa';
  if item.id is null then raise exception 'Item de prescrição não está ativo'; end if;
  insert into public.administracoes_enfermagem(unidade_id,prescricao_item_id,horario_previsto,horario_realizado,status,profissional_id,observacao)
  values(item.unidade_id,item.id,p_horario_previsto,case when p_status='administrado' then now() else null end,p_status,p_profissional_id,p_observacao)
  on conflict (prescricao_item_id,horario_previsto) do update set
    horario_realizado=excluded.horario_realizado,status=excluded.status,profissional_id=excluded.profissional_id,
    observacao=excluded.observacao,usuario_id=auth.uid()
  returning * into resultado;
  return resultado;
end $$;

grant select,insert,update,delete on public.prescricoes,public.prescricao_itens,public.administracoes_enfermagem to authenticated;
grant execute on function public.ativar_prescricao(uuid) to authenticated;
grant execute on function public.checar_administracao(uuid,timestamptz,text,bigint,text) to authenticated;
commit;
