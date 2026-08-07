-- Painel SaaS e acesso de usuários a uma ou mais unidades.
-- Execute após 20260807_multiempresa_rls.sql.

begin;

create table if not exists public.saas_administradores (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.usuario_unidades (
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  unidade_id uuid not null references public.unidades(id) on delete cascade,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  padrao boolean not null default false,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (usuario_id, unidade_id)
);

create table if not exists public.saas_auditoria (
  id bigint generated always as identity primary key,
  administrador_id uuid not null references auth.users(id) on delete restrict,
  acao text not null,
  entidade_id text,
  detalhes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists usuario_unidades_usuario_ativo_idx
  on public.usuario_unidades (usuario_id, ativo, unidade_id);
create index if not exists usuario_unidades_empresa_unidade_idx
  on public.usuario_unidades (empresa_id, unidade_id);
create unique index if not exists usuario_unidades_padrao_uidx
  on public.usuario_unidades (usuario_id) where padrao is true and ativo is true;

create or replace function public.validar_usuario_unidade_empresa()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.unidades
     where id = new.unidade_id and empresa_id = new.empresa_id
  ) or not exists (
    select 1 from public.usuarios
     where id = new.usuario_id and empresa_id = new.empresa_id
  ) then
    raise exception 'Usuário e unidade devem pertencer à mesma empresa' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists usuario_unidades_validar_empresa_tg on public.usuario_unidades;
create trigger usuario_unidades_validar_empresa_tg
  before insert or update on public.usuario_unidades
  for each row execute function public.validar_usuario_unidade_empresa();

-- Preserva o acesso único já configurado antes desta migration.
insert into public.usuario_unidades (usuario_id, unidade_id, empresa_id, padrao)
select id, unidade_id, empresa_id, true
  from public.usuarios
 where unidade_id is not null
on conflict (usuario_id, unidade_id) do update
set empresa_id = excluded.empresa_id;

create or replace function public.usuario_eh_saas_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.saas_administradores where usuario_id = auth.uid())
$$;

create or replace function public.usuario_tem_acesso_unidade(unidade uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.usuario_unidades uu
      join public.usuarios u on u.id = uu.usuario_id
     where uu.usuario_id = auth.uid()
       and uu.unidade_id = unidade
       and uu.empresa_id = u.empresa_id
       and uu.ativo is true
       and u.ativo is true
  )
$$;

create or replace function public.usuario_unidade_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select uu.unidade_id
    from public.usuario_unidades uu
    join public.usuarios u on u.id = uu.usuario_id
   where uu.usuario_id = auth.uid()
     and uu.ativo is true
     and u.ativo is true
   order by uu.padrao desc, uu.created_at
   limit 1
$$;

revoke all on function public.usuario_eh_saas_admin() from public;
revoke all on function public.usuario_tem_acesso_unidade(uuid) from public;
grant execute on function public.usuario_eh_saas_admin() to authenticated;
grant execute on function public.usuario_tem_acesso_unidade(uuid) to authenticated;

alter table public.saas_administradores enable row level security;
alter table public.usuario_unidades enable row level security;
alter table public.saas_auditoria enable row level security;

drop policy if exists saas_admin_select_proprio on public.saas_administradores;
create policy saas_admin_select_proprio on public.saas_administradores
  for select to authenticated using (usuario_id = auth.uid());

drop policy if exists usuario_unidades_select_proprio on public.usuario_unidades;
create policy usuario_unidades_select_proprio on public.usuario_unidades
  for select to authenticated using (usuario_id = auth.uid() and ativo is true);

drop policy if exists saas_auditoria_select_admin on public.saas_auditoria;
create policy saas_auditoria_select_admin on public.saas_auditoria
  for select to authenticated using (public.usuario_eh_saas_admin());

-- O usuário enxerga todas as unidades explicitamente liberadas para ele.
drop policy if exists unidades_select_unidade_usuario on public.unidades;
drop policy if exists unidades_select_unidades_usuario on public.unidades;
create policy unidades_select_unidades_usuario on public.unidades
  for select to authenticated
  using (
    empresa_id = public.usuario_empresa_id()
    and public.usuario_tem_acesso_unidade(id)
  );

-- O trigger aceita a unidade solicitada somente quando ela pertence à lista autorizada.
create or replace function public.aplicar_escopo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'pacientes' then
    new.empresa_id := public.usuario_empresa_id();
  elsif new.unidade_id is null then
    new.unidade_id := public.usuario_unidade_id();
  elsif not public.usuario_tem_acesso_unidade(new.unidade_id) then
    raise exception 'Usuário sem acesso à unidade informada' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- Atualiza as policies operacionais para qualquer unidade autorizada.
do $$
declare
  tabela text;
  tabelas text[] := array[
    'convenios', 'prestadores', 'procedimentos', 'atendimentos', 'agendamentos',
    'salas', 'lotes_faturamento', 'glosas', 'contas_receber', 'contas_pagar',
    'fluxo_caixa', 'notas_fiscais', 'conciliacao_bancaria', 'guias_geradas',
    'logs_faturamento', 'notificacoes', 'configuracoes', 'convenios_config',
    'especialidades', 'autorizacoes', 'prontuario', 'prescricoes', 'receitas',
    'atestados', 'chamados'
  ];
begin
  foreach tabela in array tabelas loop
    if to_regclass('public.' || tabela) is not null then
      execute format('drop policy if exists unidade_select on public.%I', tabela);
      execute format('drop policy if exists unidade_insert on public.%I', tabela);
      execute format('drop policy if exists unidade_update on public.%I', tabela);
      execute format('drop policy if exists unidade_delete on public.%I', tabela);
      execute format('create policy unidade_select on public.%I for select to authenticated using (public.usuario_tem_acesso_unidade(unidade_id))', tabela);
      execute format('create policy unidade_insert on public.%I for insert to authenticated with check (public.usuario_tem_acesso_unidade(unidade_id))', tabela);
      execute format('create policy unidade_update on public.%I for update to authenticated using (public.usuario_tem_acesso_unidade(unidade_id)) with check (public.usuario_tem_acesso_unidade(unidade_id))', tabela);
      execute format('create policy unidade_delete on public.%I for delete to authenticated using (public.usuario_tem_acesso_unidade(unidade_id))', tabela);
    end if;
  end loop;
end $$;

commit;

-- Primeiro administrador SaaS (execute manualmente uma única vez com o UUID do Auth):
-- insert into public.saas_administradores (usuario_id) values ('UUID_DO_USUARIO');
