-- Define o setor e o nível operacional que controlam a árvore de navegação.
begin;

alter table public.usuarios add column if not exists setor_acesso text default 'recepcao';
alter table public.usuarios add column if not exists nivel_acesso text default 'operador';

update public.usuarios set setor_acesso='todos',nivel_acesso='administrador' where role='admin';
update public.usuarios set setor_acesso=coalesce(setor_acesso,'recepcao'),nivel_acesso=coalesce(nivel_acesso,'operador') where role<>'admin' or role is null;

alter table public.usuarios drop constraint if exists usuarios_setor_acesso_check;
alter table public.usuarios add constraint usuarios_setor_acesso_check check
  (setor_acesso in ('todos','recepcao','assistencial','diagnostico','farmacia','faturamento','financeiro','administracao'));
alter table public.usuarios drop constraint if exists usuarios_nivel_acesso_check;
alter table public.usuarios add constraint usuarios_nivel_acesso_check check
  (nivel_acesso in ('operador','supervisor','administrador'));

create or replace function public.usuario_pode_acessar_setor(p_setores text[])
returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.usuarios u where u.id=auth.uid() and coalesce(u.ativo,true)
      and (u.role='admin' or u.nivel_acesso='administrador' or u.setor_acesso=any(p_setores))
  );
$$;
revoke all on function public.usuario_pode_acessar_setor(text[]) from public;
grant execute on function public.usuario_pode_acessar_setor(text[]) to authenticated;

-- Reforça no banco as mesmas permissões aplicadas à árvore e às rotas da interface.
do $$ declare regra record; acao text; begin
  for regra in select * from (values
    ('setores_hospitalares',array['assistencial','farmacia']),('leitos',array['assistencial','farmacia']),
    ('internacoes',array['assistencial','farmacia']),('estoque_itens',array['assistencial','farmacia']),
    ('estoque_movimentacoes',array['assistencial','farmacia']),
    ('prescricoes_hospitalares',array['assistencial','farmacia']),('prescricao_hospitalar_itens',array['assistencial','farmacia']),
    ('administracoes_hospitalares',array['assistencial','farmacia']),
    ('classificacoes_risco',array['recepcao','assistencial']),
    ('exames_catalogo',array['assistencial','diagnostico']),('solicitacoes_exames',array['assistencial','diagnostico']),
    ('resultados_exames',array['assistencial','diagnostico']),
    ('cirurgias',array['assistencial']),('checklist_cirurgia_segura',array['assistencial'])
  ) as r(tabela,setores) loop
    if to_regclass('public.'||regra.tabela) is not null then
      foreach acao in array array['select','insert','update','delete'] loop
        execute format('drop policy if exists unidade_%s on public.%I',acao,regra.tabela);
      end loop;
      execute format('create policy unidade_select on public.%I for select to authenticated using (unidade_id=public.usuario_unidade_id() and public.usuario_pode_acessar_setor(%L::text[]))',regra.tabela,regra.setores);
      execute format('create policy unidade_insert on public.%I for insert to authenticated with check (unidade_id=public.usuario_unidade_id() and public.usuario_pode_acessar_setor(%L::text[]))',regra.tabela,regra.setores);
      execute format('create policy unidade_update on public.%I for update to authenticated using (unidade_id=public.usuario_unidade_id() and public.usuario_pode_acessar_setor(%L::text[])) with check (unidade_id=public.usuario_unidade_id() and public.usuario_pode_acessar_setor(%L::text[]))',regra.tabela,regra.setores,regra.setores);
      execute format('create policy unidade_delete on public.%I for delete to authenticated using (unidade_id=public.usuario_unidade_id() and public.usuario_pode_acessar_setor(%L::text[]))',regra.tabela,regra.setores);
    end if;
  end loop;
end $$;

commit;
