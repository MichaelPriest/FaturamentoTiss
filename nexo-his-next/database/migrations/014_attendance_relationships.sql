-- Relacionamentos explícitos necessários para embeds do PostgREST/Supabase.
begin;

alter table public.atendimentos
  drop constraint if exists atendimentos_empresa_id_fkey,
  drop constraint if exists atendimentos_unidade_id_fkey;

alter table public.atendimentos
  add constraint atendimentos_empresa_id_fkey foreign key (empresa_id)
    references public.empresas(id) on update cascade on delete restrict,
  add constraint atendimentos_unidade_id_fkey foreign key (unidade_id)
    references public.unidades(id) on update cascade on delete restrict;

create index if not exists atendimentos_empresa_idx on public.atendimentos(empresa_id);
create index if not exists atendimentos_unidade_idx on public.atendimentos(unidade_id);

-- Solicita ao PostgREST a atualização imediata do cache de relacionamentos.
notify pgrst, 'reload schema';
commit;
