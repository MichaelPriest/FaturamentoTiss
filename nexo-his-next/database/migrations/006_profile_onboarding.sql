-- Provisiona o primeiro vínculo institucional sem expor escrita direta em usuarios.
begin;
create or replace function public.garantir_meu_perfil()
returns table(id uuid,nome text,role text,setor_acesso text,nivel_acesso text,unidade_id uuid)
language plpgsql security definer set search_path=public,auth as $$
declare
  v_user auth.users%rowtype;
  v_unidade uuid;
  v_empresa uuid;
  v_total_unidades integer;
  v_nome text;
begin
  if auth.uid() is null then raise exception 'Autenticação obrigatória'; end if;

  return query
    select u.id,u.nome,u.role,u.setor_acesso,u.nivel_acesso,u.unidade_id
      from public.usuarios u where u.id=auth.uid() and u.ativo;
  if found then return; end if;

  select * into v_user from auth.users where auth.users.id=auth.uid();
  v_nome:=coalesce(nullif(trim(v_user.raw_user_meta_data->>'nome'),''),
                   nullif(trim(v_user.raw_user_meta_data->>'full_name'),''),
                   nullif(split_part(v_user.email,'@',1),''),'Usuário');

  -- O vínculo automático só é seguro em uma instalação com uma única unidade.
  perform pg_advisory_xact_lock(hashtext('nexo_profile_onboarding'));
  select count(*),(array_agg(u.id order by u.id))[1] into v_total_unidades,v_unidade from public.unidades u;
  if v_total_unidades=0 then
    insert into public.empresas as e(nome) values ('Instituição principal') returning e.id into v_empresa;
    insert into public.unidades as u(empresa_id,nome) values (v_empresa,'Unidade principal') returning u.id into v_unidade;
  elsif v_total_unidades>1 then
    raise exception 'Há mais de uma unidade disponível. Um administrador deve definir o vínculo do usuário.';
  end if;

  select u.empresa_id into v_empresa from public.unidades u where u.id=v_unidade;
  insert into public.usuarios(id,empresa_id,unidade_id,nome,role,setor_acesso,nivel_acesso)
  values (auth.uid(),v_empresa,v_unidade,v_nome,'usuario','recepcao','operador')
  on conflict (id) do update set ativo=true;

  return query
    select u.id,u.nome,u.role,u.setor_acesso,u.nivel_acesso,u.unidade_id
      from public.usuarios u where u.id=auth.uid();
end$$;
revoke all on function public.garantir_meu_perfil() from public;
grant execute on function public.garantir_meu_perfil() to authenticated;
commit;
