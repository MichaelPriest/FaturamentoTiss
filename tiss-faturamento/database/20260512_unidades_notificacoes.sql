-- Sistema multi-unidade e central de notificações
-- Execute este script no SQL Editor do Supabase antes de publicar a funcionalidade.

create table if not exists public.unidades (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  codigo text,
  cnpj text,
  cnes text,
  responsavel text,
  telefone text,
  email text,
  endereco text,
  cidade text,
  uf char(2),
  observacao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.unidades (nome, codigo, uf, observacao)
select 'Unidade Matriz', 'MATRIZ', 'SP', 'Unidade padrão para registros sem unidade.'
where not exists (select 1 from public.unidades);

alter table public.notificacoes
  add column if not exists categoria text not null default 'sistema',
  add column if not exists prioridade text not null default 'normal',
  add column if not exists link text,
  add column if not exists arquivada boolean not null default false,
  add column if not exists usuario_id uuid,
  add column if not exists unidade_id uuid references public.unidades(id) on delete set null,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists lido_em timestamptz,
  add column if not exists updated_at timestamptz not null default now();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'convenios',
    'pacientes',
    'prestadores',
    'procedimentos',
    'atendimentos',
    'agendamentos',
    'salas',
    'lotes_faturamento',
    'glosas',
    'contas_receber',
    'contas_pagar',
    'fluxo_caixa',
    'notas_fiscais',
    'conciliacao_bancaria',
    'guias_geradas',
    'logs_faturamento'
  ] loop
    if to_regclass('public.' || table_name) is not null then
      execute format('alter table public.%I add column if not exists unidade_id uuid references public.unidades(id) on delete set null', table_name);
      execute format('create index if not exists %I on public.%I (unidade_id)', table_name || '_unidade_id_idx', table_name);
    end if;
  end loop;
end $$;

create index if not exists notificacoes_unidade_lido_idx on public.notificacoes (unidade_id, lido, arquivada, created_at desc);
create index if not exists unidades_ativo_nome_idx on public.unidades (ativo, nome);
