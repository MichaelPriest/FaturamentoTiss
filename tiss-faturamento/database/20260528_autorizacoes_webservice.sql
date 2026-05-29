-- Integração WebService TISS para autorizações
alter table if exists public.atendimentos
  add column if not exists protocolo_autorizacao text,
  add column if not exists status_autorizacao_ws text,
  add column if not exists integracao_autorizacao jsonb default '{}'::jsonb;

create index if not exists idx_atendimentos_protocolo_autorizacao
  on public.atendimentos (protocolo_autorizacao);

create index if not exists idx_atendimentos_status_autorizacao_ws
  on public.atendimentos (status_autorizacao_ws);
