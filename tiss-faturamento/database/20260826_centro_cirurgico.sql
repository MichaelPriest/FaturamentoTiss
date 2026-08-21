-- Centro cirúrgico: mapa de cirurgias e checklist de cirurgia segura.
begin;

create table if not exists public.cirurgias (
  id uuid primary key default gen_random_uuid(), empresa_id uuid, unidade_id uuid not null,
  paciente_id bigint not null references public.pacientes(id) on delete restrict,
  internacao_id uuid references public.internacoes(id) on delete set null,
  cirurgiao_id bigint references public.prestadores(id) on delete set null,
  procedimento text not null, sala text not null, inicio_previsto timestamptz not null, fim_previsto timestamptz,
  lateralidade text default 'nao_aplicavel' check (lateralidade in ('direita','esquerda','bilateral','nao_aplicavel')),
  risco_cirurgico text, observacoes text, status text not null default 'agendada'
    check (status in ('agendada','confirmada','em_preparo','em_cirurgia','recuperacao','concluida','cancelada')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.checklist_cirurgia_segura (
  id uuid primary key default gen_random_uuid(), empresa_id uuid, unidade_id uuid not null,
  cirurgia_id uuid not null unique references public.cirurgias(id) on delete cascade,
  identidade_confirmada boolean not null default false, procedimento_confirmado boolean not null default false,
  sitio_confirmado boolean not null default false, consentimento_confirmado boolean not null default false,
  alergias_revisadas boolean not null default false, risco_via_aerea_revisado boolean not null default false,
  profilaxia_confirmada boolean not null default false, materiais_confirmados boolean not null default false,
  contagem_confirmada boolean not null default false, amostras_identificadas boolean not null default false,
  responsavel_id uuid default auth.uid(), confirmado_em timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists cirurgias_mapa_idx on public.cirurgias(unidade_id,inicio_previsto,status);
create index if not exists cirurgias_paciente_idx on public.cirurgias(paciente_id,inicio_previsto desc);

do $$ declare tabela text; begin
  foreach tabela in array array['cirurgias','checklist_cirurgia_segura'] loop
    execute format('alter table public.%I enable row level security',tabela);
    execute format('create policy unidade_select on public.%I for select to authenticated using (unidade_id=public.usuario_unidade_id() and public.usuario_pode_acessar_setor(array[''assistencial'']))',tabela);
    execute format('create policy unidade_insert on public.%I for insert to authenticated with check (unidade_id=public.usuario_unidade_id() and public.usuario_pode_acessar_setor(array[''assistencial'']))',tabela);
    execute format('create policy unidade_update on public.%I for update to authenticated using (unidade_id=public.usuario_unidade_id() and public.usuario_pode_acessar_setor(array[''assistencial''])) with check (unidade_id=public.usuario_unidade_id() and public.usuario_pode_acessar_setor(array[''assistencial'']))',tabela);
    execute format('create policy unidade_delete on public.%I for delete to authenticated using (unidade_id=public.usuario_unidade_id() and public.usuario_pode_acessar_setor(array[''assistencial'']))',tabela);
    execute format('create trigger aplicar_escopo_usuario_tg before insert or update on public.%I for each row execute function public.aplicar_escopo_usuario()',tabela);
  end loop;
end $$;

create or replace function public.avancar_cirurgia(p_cirurgia_id uuid,p_status text)
returns public.cirurgias language plpgsql security invoker as $$
declare atual public.cirurgias; lista public.checklist_cirurgia_segura; resultado public.cirurgias; begin
  select * into atual from public.cirurgias where id=p_cirurgia_id for update;
  if atual.id is null then raise exception 'Cirurgia não encontrada'; end if;
  if not ((atual.status='agendada' and p_status='confirmada') or (atual.status='confirmada' and p_status='em_preparo') or
    (atual.status='em_preparo' and p_status='em_cirurgia') or (atual.status='em_cirurgia' and p_status='recuperacao') or
    (atual.status='recuperacao' and p_status='concluida') or (p_status='cancelada' and atual.status not in ('concluida','cancelada'))) then
    raise exception 'Transição cirúrgica inválida';
  end if;
  if p_status='em_cirurgia' then
    select * into lista from public.checklist_cirurgia_segura where cirurgia_id=atual.id;
    if lista.id is null or not (lista.identidade_confirmada and lista.procedimento_confirmado and lista.sitio_confirmado and
      lista.consentimento_confirmado and lista.alergias_revisadas and lista.risco_via_aerea_revisado and
      lista.profilaxia_confirmada and lista.materiais_confirmados) then raise exception 'Checklist pré-operatório incompleto'; end if;
  end if;
  update public.cirurgias set status=p_status,updated_at=now() where id=atual.id returning * into resultado;
  return resultado;
end $$;

grant select,insert,update,delete on public.cirurgias,public.checklist_cirurgia_segura to authenticated;
grant execute on function public.avancar_cirurgia(uuid,text) to authenticated;
commit;
