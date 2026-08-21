-- Leitura segura do próprio perfil e unidade para personalização da estação.
begin;
alter table public.usuarios enable row level security;
drop policy if exists usuarios_proprio_select on public.usuarios;
create policy usuarios_proprio_select on public.usuarios for select to authenticated using(id=auth.uid());
grant select on public.usuarios,public.unidades to authenticated;
alter table public.unidades enable row level security;
drop policy if exists unidades_usuario_select on public.unidades;
create policy unidades_usuario_select on public.unidades for select to authenticated using(id=public.usuario_unidade_id());
commit;
