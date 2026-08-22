-- Executar com pgTAP disponível no ambiente de testes Supabase.
begin;create extension if not exists pgtap;select plan(8);
select has_table('public','empresas','empresas existe');select has_table('public','unidades','unidades existe');select has_table('public','auditoria_eventos','auditoria existe');
select ok((select relrowsecurity from pg_class where oid='public.empresas'::regclass),'RLS em empresas');select ok((select relrowsecurity from pg_class where oid='public.unidades'::regclass),'RLS em unidades');select ok((select relrowsecurity from pg_class where oid='public.auditoria_eventos'::regclass),'RLS em auditoria');
select has_function('public','tem_permissao',array['text','uuid','uuid'],'função granular existe');select is((select public.usuario_ativo()),false,'anônimo não é usuário ativo');select * from finish();rollback;
