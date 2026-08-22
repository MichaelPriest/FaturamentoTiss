-- Planos por convênio e jornada operacional da senha (recepção > triagem > atendimento).
begin;
alter table public.convenios add column if not exists planos jsonb not null default '[]'::jsonb;
alter table public.chamados add column if not exists etapa text not null default 'recepcao'
  check (etapa in ('recepcao','triagem','atendimento'));
alter table public.chamados add column if not exists etapa_ordem smallint not null default 1
  check (etapa_ordem between 1 and 3);
create index if not exists chamados_fluxo_idx on public.chamados(unidade_id, etapa, status, created_at);
commit;
