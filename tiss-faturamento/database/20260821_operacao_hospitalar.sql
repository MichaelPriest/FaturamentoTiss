-- Núcleo operacional hospitalar: setores, leitos, internações e estoque.
begin;
create extension if not exists pgcrypto;

create table if not exists public.setores_hospitalares (
  id uuid primary key default gen_random_uuid(), empresa_id uuid, unidade_id uuid not null,
  nome text not null, tipo text not null default 'internacao', ativo boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (unidade_id, nome)
);
create table if not exists public.leitos (
  id uuid primary key default gen_random_uuid(), empresa_id uuid, unidade_id uuid not null,
  setor_id uuid references public.setores_hospitalares(id) on delete restrict,
  codigo text not null, tipo text not null default 'enfermaria', status text not null default 'livre'
    check (status in ('livre','ocupado','reservado','higienizacao','manutencao','bloqueado')),
  observacao text, ativo boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (unidade_id, codigo)
);
create table if not exists public.internacoes (
  id uuid primary key default gen_random_uuid(), empresa_id uuid, unidade_id uuid not null,
  paciente_id bigint references public.pacientes(id) on delete restrict,
  leito_id uuid references public.leitos(id) on delete restrict,
  atendimento_id bigint references public.atendimentos(id) on delete set null,
  medico_responsavel_id bigint references public.prestadores(id) on delete set null,
  numero_internacao text not null, data_entrada timestamptz not null default now(), data_saida timestamptz,
  tipo text not null default 'eletiva', origem text, diagnostico text, observacao text,
  status text not null default 'ativa' check (status in ('ativa','alta','transferida','cancelada')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (unidade_id, numero_internacao)
);
create unique index if not exists internacoes_leito_ativo_uidx on public.internacoes(leito_id) where status = 'ativa';
create table if not exists public.estoque_itens (
  id uuid primary key default gen_random_uuid(), empresa_id uuid, unidade_id uuid not null,
  codigo text, nome text not null, categoria text not null default 'material', unidade_medida text not null default 'UN',
  lote text, validade date, estoque_atual numeric(14,3) not null default 0,
  estoque_minimo numeric(14,3) not null default 0, custo_medio numeric(14,2) not null default 0,
  localizacao text, ativo boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.estoque_movimentacoes (
  id uuid primary key default gen_random_uuid(), empresa_id uuid, unidade_id uuid not null,
  item_id uuid not null references public.estoque_itens(id) on delete restrict,
  tipo text not null check (tipo in ('entrada','saida','ajuste_entrada','ajuste_saida','perda')),
  quantidade numeric(14,3) not null check (quantidade > 0), saldo_anterior numeric(14,3) not null,
  saldo_posterior numeric(14,3) not null, motivo text, documento text,
  usuario_id uuid default auth.uid(), created_at timestamptz not null default now()
);

create index if not exists leitos_unidade_status_idx on public.leitos(unidade_id,status);
create index if not exists internacoes_unidade_status_idx on public.internacoes(unidade_id,status,data_entrada desc);
create index if not exists estoque_unidade_nome_idx on public.estoque_itens(unidade_id,nome);
create index if not exists estoque_mov_item_data_idx on public.estoque_movimentacoes(item_id,created_at desc);

-- Aplica a mesma matriz RLS multiempresa já usada pelo sistema.
do $$ declare tabela text; begin
  foreach tabela in array array['setores_hospitalares','leitos','internacoes','estoque_itens','estoque_movimentacoes'] loop
    execute format('alter table public.%I enable row level security', tabela);
    execute format('drop policy if exists unidade_select on public.%I', tabela);
    execute format('drop policy if exists unidade_insert on public.%I', tabela);
    execute format('drop policy if exists unidade_update on public.%I', tabela);
    execute format('drop policy if exists unidade_delete on public.%I', tabela);
    execute format('create policy unidade_select on public.%I for select to authenticated using (unidade_id = public.usuario_unidade_id())', tabela);
    execute format('create policy unidade_insert on public.%I for insert to authenticated with check (unidade_id = public.usuario_unidade_id())', tabela);
    execute format('create policy unidade_update on public.%I for update to authenticated using (unidade_id = public.usuario_unidade_id()) with check (unidade_id = public.usuario_unidade_id())', tabela);
    execute format('create policy unidade_delete on public.%I for delete to authenticated using (unidade_id = public.usuario_unidade_id())', tabela);
    execute format('drop trigger if exists aplicar_escopo_usuario_tg on public.%I', tabela);
    execute format('create trigger aplicar_escopo_usuario_tg before insert or update on public.%I for each row execute function public.aplicar_escopo_usuario()', tabela);
  end loop;
end $$;

create or replace function public.registrar_internacao(p_paciente_id bigint, p_leito_id uuid, p_medico_id bigint default null, p_diagnostico text default null)
returns public.internacoes language plpgsql security invoker as $$
declare resultado public.internacoes; begin
  if not exists(select 1 from public.leitos where id=p_leito_id and unidade_id=public.usuario_unidade_id() and status='livre' and ativo) then
    raise exception 'Leito indisponível';
  end if;
  insert into public.internacoes(unidade_id,paciente_id,leito_id,medico_responsavel_id,numero_internacao,diagnostico)
  values(public.usuario_unidade_id(),p_paciente_id,p_leito_id,p_medico_id,'INT-'||to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS'),p_diagnostico)
  returning * into resultado;
  update public.leitos set status='ocupado',updated_at=now() where id=p_leito_id;
  return resultado;
end $$;

create or replace function public.registrar_movimento_estoque(p_item_id uuid,p_tipo text,p_quantidade numeric,p_motivo text default null)
returns public.estoque_movimentacoes language plpgsql security invoker as $$
declare item public.estoque_itens; novo numeric; mov public.estoque_movimentacoes; begin
  select * into item from public.estoque_itens where id=p_item_id for update;
  if item.id is null then raise exception 'Item não encontrado'; end if;
  novo := item.estoque_atual + case when p_tipo in ('entrada','ajuste_entrada') then p_quantidade else -p_quantidade end;
  if novo < 0 then raise exception 'Saldo insuficiente'; end if;
  update public.estoque_itens set estoque_atual=novo,updated_at=now() where id=item.id;
  insert into public.estoque_movimentacoes(unidade_id,item_id,tipo,quantidade,saldo_anterior,saldo_posterior,motivo)
  values(item.unidade_id,item.id,p_tipo,p_quantidade,item.estoque_atual,novo,p_motivo) returning * into mov;
  return mov;
end $$;

create or replace function public.registrar_alta(p_internacao_id uuid, p_status text default 'alta')
returns public.internacoes language plpgsql security invoker as $$
declare resultado public.internacoes; begin
  if p_status not in ('alta','transferida','cancelada') then raise exception 'Status de encerramento inválido'; end if;
  update public.internacoes set status=p_status,data_saida=now(),updated_at=now()
    where id=p_internacao_id and status='ativa' returning * into resultado;
  if resultado.id is null then raise exception 'Internação ativa não encontrada'; end if;
  update public.leitos set status='higienizacao',updated_at=now() where id=resultado.leito_id;
  return resultado;
end $$;

grant execute on function public.registrar_internacao(bigint,uuid,bigint,text) to authenticated;
grant execute on function public.registrar_movimento_estoque(uuid,text,numeric,text) to authenticated;
grant execute on function public.registrar_alta(uuid,text) to authenticated;
grant select, insert, update, delete on public.setores_hospitalares, public.leitos, public.internacoes, public.estoque_itens, public.estoque_movimentacoes to authenticated;

commit;
