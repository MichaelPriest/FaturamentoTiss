-- Apoio diagnóstico: catálogo, solicitações e resultados laboratoriais/imagem.
begin;

create table if not exists public.exames_catalogo (
  id uuid primary key default gen_random_uuid(), empresa_id uuid, unidade_id uuid not null,
  codigo text, nome text not null, modalidade text not null check (modalidade in ('laboratorio','imagem','cardiologia','outro')),
  preparo text, prazo_horas integer not null default 24 check (prazo_horas >= 0), ativo boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(unidade_id,nome)
);
create table if not exists public.solicitacoes_exames (
  id uuid primary key default gen_random_uuid(), empresa_id uuid, unidade_id uuid not null,
  paciente_id bigint not null references public.pacientes(id) on delete restrict,
  atendimento_id bigint references public.atendimentos(id) on delete set null,
  internacao_id uuid references public.internacoes(id) on delete set null,
  exame_id uuid not null references public.exames_catalogo(id) on delete restrict,
  solicitante_id bigint references public.prestadores(id) on delete set null,
  prioridade text not null default 'rotina' check (prioridade in ('rotina','urgente','emergencia')),
  indicacao_clinica text, status text not null default 'solicitado'
    check (status in ('solicitado','coletado','em_processamento','laudo_disponivel','cancelado')),
  solicitado_em timestamptz not null default now(), coletado_em timestamptz, liberado_em timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.resultados_exames (
  id uuid primary key default gen_random_uuid(), empresa_id uuid, unidade_id uuid not null,
  solicitacao_id uuid not null unique references public.solicitacoes_exames(id) on delete restrict,
  resultado_texto text not null, conclusao text, valor_critico boolean not null default false,
  responsavel_id bigint references public.prestadores(id) on delete set null,
  liberado_por uuid default auth.uid(), liberado_em timestamptz not null default now(), created_at timestamptz not null default now()
);

create index if not exists solicitacoes_exames_fila_idx on public.solicitacoes_exames(unidade_id,status,prioridade,solicitado_em);
create index if not exists solicitacoes_exames_paciente_idx on public.solicitacoes_exames(paciente_id,solicitado_em desc);

do $$ declare tabela text; begin
  foreach tabela in array array['exames_catalogo','solicitacoes_exames','resultados_exames'] loop
    execute format('alter table public.%I enable row level security',tabela);
    execute format('create policy unidade_select on public.%I for select to authenticated using (unidade_id=public.usuario_unidade_id())',tabela);
    execute format('create policy unidade_insert on public.%I for insert to authenticated with check (unidade_id=public.usuario_unidade_id())',tabela);
    execute format('create policy unidade_update on public.%I for update to authenticated using (unidade_id=public.usuario_unidade_id()) with check (unidade_id=public.usuario_unidade_id())',tabela);
    execute format('create policy unidade_delete on public.%I for delete to authenticated using (unidade_id=public.usuario_unidade_id())',tabela);
    execute format('create trigger aplicar_escopo_usuario_tg before insert or update on public.%I for each row execute function public.aplicar_escopo_usuario()',tabela);
  end loop;
end $$;

create or replace function public.avancar_solicitacao_exame(p_solicitacao_id uuid,p_status text)
returns public.solicitacoes_exames language plpgsql security invoker as $$
declare atual public.solicitacoes_exames; resultado public.solicitacoes_exames; begin
  select * into atual from public.solicitacoes_exames where id=p_solicitacao_id for update;
  if atual.id is null then raise exception 'Solicitação não encontrada'; end if;
  if not ((atual.status='solicitado' and p_status in ('coletado','cancelado')) or
          (atual.status='coletado' and p_status='em_processamento')) then raise exception 'Transição de status inválida'; end if;
  update public.solicitacoes_exames set status=p_status,updated_at=now(),
    coletado_em=case when p_status='coletado' then now() else coletado_em end
    where id=p_solicitacao_id returning * into resultado;
  return resultado;
end $$;

create or replace function public.liberar_resultado_exame(p_solicitacao_id uuid,p_resultado text,p_conclusao text default null,p_valor_critico boolean default false,p_responsavel_id bigint default null)
returns public.resultados_exames language plpgsql security invoker as $$
declare solicitacao public.solicitacoes_exames; resultado public.resultados_exames; begin
  select * into solicitacao from public.solicitacoes_exames where id=p_solicitacao_id for update;
  if solicitacao.id is null or solicitacao.status not in ('coletado','em_processamento') then raise exception 'Solicitação não está pronta para liberação'; end if;
  if nullif(trim(p_resultado),'') is null then raise exception 'Resultado é obrigatório'; end if;
  insert into public.resultados_exames(unidade_id,solicitacao_id,resultado_texto,conclusao,valor_critico,responsavel_id)
  values(solicitacao.unidade_id,solicitacao.id,p_resultado,p_conclusao,p_valor_critico,p_responsavel_id) returning * into resultado;
  update public.solicitacoes_exames set status='laudo_disponivel',liberado_em=now(),updated_at=now() where id=solicitacao.id;
  return resultado;
end $$;

grant select,insert,update,delete on public.exames_catalogo,public.solicitacoes_exames,public.resultados_exames to authenticated;
grant execute on function public.avancar_solicitacao_exame(uuid,text) to authenticated;
grant execute on function public.liberar_resultado_exame(uuid,text,text,boolean,bigint) to authenticated;
commit;
