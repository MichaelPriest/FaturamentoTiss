-- Base independente do Nexo HIS Next. Não depende do banco do sistema legado.
begin;
create extension if not exists pgcrypto;
create table public.empresas(id uuid primary key default gen_random_uuid(),nome text not null,created_at timestamptz not null default now());
create table public.unidades(id uuid primary key default gen_random_uuid(),empresa_id uuid not null references public.empresas(id),nome text not null,cnpj text,cnes text);
create table public.usuarios(id uuid primary key,empresa_id uuid not null references public.empresas(id),unidade_id uuid not null references public.unidades(id),nome text not null,role text not null default 'usuario',setor_acesso text not null default 'recepcao',nivel_acesso text not null default 'operador',ativo boolean not null default true);
create table public.pacientes(id bigint generated always as identity primary key,empresa_id uuid not null references public.empresas(id),nome text not null,cpf text,data_nascimento date,created_at timestamptz not null default now());
create table public.convenios(id bigint generated always as identity primary key,unidade_id uuid not null references public.unidades(id),razao_social text not null,registro_ans text,versao_tiss text);
create table public.prestadores(id bigint generated always as identity primary key,unidade_id uuid not null references public.unidades(id),nome text not null,conselho text,numero_conselho text,cnes text);
create table public.procedimentos(id bigint generated always as identity primary key,unidade_id uuid not null references public.unidades(id),codigo_tuss text not null,descricao text not null,valor numeric(20,2) not null default 0);
create table public.internacoes(id uuid primary key default gen_random_uuid(),unidade_id uuid not null references public.unidades(id),paciente_id bigint not null references public.pacientes(id),data_entrada timestamptz not null default now(),data_saida timestamptz,status text not null default 'ativa');
create table public.guias_geradas(id bigint generated always as identity primary key,unidade_id uuid not null references public.unidades(id),paciente_id bigint not null references public.pacientes(id),convenio_id bigint references public.convenios(id),internacao_id uuid references public.internacoes(id),tipo_guia text not null,itens jsonb not null default '[]',created_at timestamptz not null default now());
create table public.estoque_itens(id uuid primary key default gen_random_uuid(),unidade_id uuid not null references public.unidades(id),nome text not null,custo_medio numeric(20,2) not null default 0,estoque_atual numeric(16,3) not null default 0);
create table public.estoque_movimentacoes(id uuid primary key default gen_random_uuid(),unidade_id uuid not null references public.unidades(id),item_id uuid not null references public.estoque_itens(id),tipo text not null,quantidade numeric(16,3) not null,created_at timestamptz not null default now());

create or replace function public.usuario_empresa_id() returns uuid language sql stable security definer set search_path=public as $$select empresa_id from public.usuarios where id=auth.uid() and ativo limit 1$$;
create or replace function public.usuario_unidade_id() returns uuid language sql stable security definer set search_path=public as $$select unidade_id from public.usuarios where id=auth.uid() and ativo limit 1$$;
create or replace function public.aplicar_escopo_usuario() returns trigger language plpgsql security definer set search_path=public as $$begin new.unidade_id:=public.usuario_unidade_id();if to_jsonb(new)?'empresa_id' then new.empresa_id:=public.usuario_empresa_id();end if;return new;end$$;
grant execute on function public.usuario_empresa_id(),public.usuario_unidade_id() to authenticated;
commit;
