-- Metadados da integração Orizon TISS 4.03.00 nos lotes de faturamento.
alter table public.lotes_faturamento
  add column if not exists protocolo_orizon text,
  add column if not exists status_integracao text,
  add column if not exists integracao_orizon jsonb not null default '{}'::jsonb;

create index if not exists lotes_faturamento_protocolo_orizon_idx
  on public.lotes_faturamento (protocolo_orizon);

create index if not exists lotes_faturamento_status_integracao_idx
  on public.lotes_faturamento (status_integracao);
