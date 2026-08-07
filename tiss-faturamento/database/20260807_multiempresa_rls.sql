-- Isolamento SaaS: empresas > unidades > usuários/dados operacionais.
-- Pacientes pertencem à empresa e podem ser usados em todas as suas unidades.
-- Convênios e os demais dados operacionais pertencem exclusivamente à unidade.

begin;

create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  documento text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.unidades
  add column if not exists empresa_id uuid references public.empresas(id) on delete restrict;

alter table public.usuarios
  add column if not exists empresa_id uuid references public.empresas(id) on delete restrict,
  add column if not exists unidade_id uuid references public.unidades(id) on delete restrict;

-- Permite aplicar a migration em uma base existente sem perder vínculos.
do $$
declare
  empresa_padrao uuid;
begin
  select id into empresa_padrao from public.empresas order by created_at limit 1;
  if empresa_padrao is null then
    insert into public.empresas (nome) values ('Empresa principal') returning id into empresa_padrao;
  end if;

  update public.unidades set empresa_id = empresa_padrao where empresa_id is null;

  update public.usuarios u
     set empresa_id = un.empresa_id
    from public.unidades un
   where u.unidade_id = un.id and u.empresa_id is null;

  update public.usuarios set empresa_id = empresa_padrao where empresa_id is null;
end $$;

alter table public.unidades alter column empresa_id set not null;
alter table public.usuarios alter column empresa_id set not null;

-- Paciente é global apenas dentro da mesma empresa.
alter table public.pacientes
  add column if not exists empresa_id uuid references public.empresas(id) on delete restrict;

update public.pacientes p
   set empresa_id = un.empresa_id
  from public.unidades un
 where p.unidade_id = un.id and p.empresa_id is null;

update public.pacientes p
   set empresa_id = u.empresa_id
  from public.usuarios u
 where p.empresa_id is null
   and u.id = auth.uid();

-- Bases antigas sem sessão durante a migration recebem a primeira empresa.
update public.pacientes
   set empresa_id = (select id from public.empresas order by created_at limit 1)
 where empresa_id is null;

alter table public.pacientes alter column empresa_id set not null;

create index if not exists unidades_empresa_id_idx on public.unidades (empresa_id);
create index if not exists usuarios_empresa_unidade_idx on public.usuarios (empresa_id, unidade_id);
create index if not exists pacientes_empresa_id_idx on public.pacientes (empresa_id);

-- Funções SECURITY DEFINER evitam recursão nas policies de usuarios.
create or replace function public.usuario_empresa_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select empresa_id from public.usuarios where id = auth.uid() and ativo is true limit 1
$$;

create or replace function public.usuario_unidade_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select unidade_id from public.usuarios where id = auth.uid() and ativo is true limit 1
$$;

create or replace function public.usuario_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.usuarios where id = auth.uid() and ativo is true limit 1
$$;

revoke all on function public.usuario_empresa_id() from public;
revoke all on function public.usuario_unidade_id() from public;
revoke all on function public.usuario_role() from public;
grant execute on function public.usuario_empresa_id() to authenticated;
grant execute on function public.usuario_unidade_id() to authenticated;
grant execute on function public.usuario_role() to authenticated;

create or replace function public.aplicar_escopo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'pacientes' then
    new.empresa_id := public.usuario_empresa_id();
  else
    new.unidade_id := public.usuario_unidade_id();
  end if;
  return new;
end;
$$;

revoke all on function public.aplicar_escopo_usuario() from public;

-- Remove policies antigas/permissivas antes de instalar a matriz oficial.
do $$
declare
  politica record;
begin
  for politica in
    select schemaname, tablename, policyname
      from pg_policies
     where schemaname = 'public'
       and tablename = any(array[
         'empresas', 'unidades', 'usuarios', 'pacientes', 'convenios', 'prestadores',
         'procedimentos', 'atendimentos', 'agendamentos', 'salas', 'lotes_faturamento',
         'glosas', 'contas_receber', 'contas_pagar', 'fluxo_caixa', 'notas_fiscais',
         'conciliacao_bancaria', 'guias_geradas', 'logs_faturamento', 'notificacoes',
         'configuracoes', 'convenios_config', 'especialidades', 'autorizacoes',
         'prontuario', 'prescricoes', 'receitas', 'atestados', 'chamados'
       ])
  loop
    execute format('drop policy if exists %I on %I.%I', politica.policyname, politica.schemaname, politica.tablename);
  end loop;
end $$;

alter table public.empresas enable row level security;
alter table public.unidades enable row level security;
alter table public.usuarios enable row level security;
alter table public.pacientes enable row level security;

drop policy if exists empresas_select_mesma_empresa on public.empresas;
create policy empresas_select_mesma_empresa on public.empresas
  for select to authenticated
  using (id = public.usuario_empresa_id());

drop policy if exists unidades_select_unidade_usuario on public.unidades;
create policy unidades_select_unidade_usuario on public.unidades
  for select to authenticated
  using (id = public.usuario_unidade_id() and empresa_id = public.usuario_empresa_id());

drop policy if exists usuarios_select_proprio on public.usuarios;
create policy usuarios_select_proprio on public.usuarios
  for select to authenticated using (id = auth.uid());

drop policy if exists usuarios_update_proprio on public.usuarios;
create policy usuarios_update_proprio on public.usuarios
  for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and empresa_id = public.usuario_empresa_id()
    and unidade_id is not distinct from public.usuario_unidade_id()
    and role = public.usuario_role()
  );

drop policy if exists pacientes_select_empresa on public.pacientes;
create policy pacientes_select_empresa on public.pacientes
  for select to authenticated using (empresa_id = public.usuario_empresa_id());
drop policy if exists pacientes_insert_empresa on public.pacientes;
create policy pacientes_insert_empresa on public.pacientes
  for insert to authenticated with check (empresa_id = public.usuario_empresa_id());
drop policy if exists pacientes_update_empresa on public.pacientes;
create policy pacientes_update_empresa on public.pacientes
  for update to authenticated
  using (empresa_id = public.usuario_empresa_id())
  with check (empresa_id = public.usuario_empresa_id());
drop policy if exists pacientes_delete_empresa on public.pacientes;
create policy pacientes_delete_empresa on public.pacientes
  for delete to authenticated using (empresa_id = public.usuario_empresa_id());

drop trigger if exists pacientes_aplicar_escopo on public.pacientes;
create trigger pacientes_aplicar_escopo
  before insert or update on public.pacientes
  for each row execute function public.aplicar_escopo_usuario();

-- Todas as tabelas abaixo são isoladas pela unidade configurada no usuário.
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
      execute format('alter table public.%I enable row level security', tabela);
      execute format('drop policy if exists unidade_select on public.%I', tabela);
      execute format('drop policy if exists unidade_insert on public.%I', tabela);
      execute format('drop policy if exists unidade_update on public.%I', tabela);
      execute format('drop policy if exists unidade_delete on public.%I', tabela);
      execute format('create policy unidade_select on public.%I for select to authenticated using (unidade_id = public.usuario_unidade_id())', tabela);
      execute format('create policy unidade_insert on public.%I for insert to authenticated with check (unidade_id = public.usuario_unidade_id())', tabela);
      execute format('create policy unidade_update on public.%I for update to authenticated using (unidade_id = public.usuario_unidade_id()) with check (unidade_id = public.usuario_unidade_id())', tabela);
      execute format('create policy unidade_delete on public.%I for delete to authenticated using (unidade_id = public.usuario_unidade_id())', tabela);
      execute format('drop trigger if exists aplicar_escopo_usuario_tg on public.%I', tabela);
      execute format('create trigger aplicar_escopo_usuario_tg before insert or update on public.%I for each row execute function public.aplicar_escopo_usuario()', tabela);
    end if;
  end loop;
end $$;

commit;
