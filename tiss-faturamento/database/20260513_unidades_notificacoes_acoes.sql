-- Complemento do sistema multi-unidade e notificações por ações.
-- Execute após 20260512_unidades_notificacoes.sql no SQL Editor do Supabase.

-- 1) Garante coluna unidade_id também nas tabelas auxiliares/configurações que podem ser filtradas por unidade.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'usuarios',
    'configuracoes',
    'convenios_config',
    'especialidades',
    'prestador_especialidade',
    'contas_receber',
    'contas_pagar',
    'fluxo_caixa',
    'notas_fiscais',
    'conciliacao_bancaria',
    'guias_geradas',
    'logs_faturamento',
    'salas',
    'agendamentos',
    'autorizacoes',
    'prontuario',
    'prescricoes',
    'receitas',
    'atestados'
  ] loop
    if to_regclass('public.' || table_name) is not null then
      execute format('alter table public.%I add column if not exists unidade_id uuid references public.unidades(id) on delete set null', table_name);
      execute format('create index if not exists %I on public.%I (unidade_id)', table_name || '_unidade_id_idx', table_name);
    end if;
  end loop;
end $$;

-- 2) Metadados de origem para rastrear qual registro/ação gerou cada notificação.
alter table public.notificacoes
  add column if not exists origem_tabela text,
  add column if not exists origem_id text,
  add column if not exists acao text;

create index if not exists notificacoes_origem_idx on public.notificacoes (origem_tabela, origem_id, acao, created_at desc);

-- 3) Trigger genérica: INSERT/UPDATE/DELETE em tabelas operacionais geram notificação.
create or replace function public.emitir_notificacao_acao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  registro record;
  registro_id text;
  registro_nome text;
  unidade uuid;
  titulo_acao text;
  tipo_notificacao text;
begin
  if tg_op = 'DELETE' then
    registro := old;
    titulo_acao := 'excluído';
    tipo_notificacao := 'warning';
  elsif tg_op = 'UPDATE' then
    registro := new;
    titulo_acao := 'atualizado';
    tipo_notificacao := 'info';
  else
    registro := new;
    titulo_acao := 'criado';
    tipo_notificacao := 'success';
  end if;

  registro_id := coalesce(to_jsonb(registro)->>'id', '');
  registro_nome := coalesce(
    to_jsonb(registro)->>'nome',
    to_jsonb(registro)->>'razao_social',
    to_jsonb(registro)->>'paciente_nome',
    to_jsonb(registro)->>'numero_lote',
    to_jsonb(registro)->>'numero_guia_prestador',
    to_jsonb(registro)->>'titulo',
    registro_id
  );

  unidade := nullif(to_jsonb(registro)->>'unidade_id', '')::uuid;

  insert into public.notificacoes (
    titulo,
    mensagem,
    tipo,
    categoria,
    prioridade,
    unidade_id,
    origem_tabela,
    origem_id,
    acao,
    metadata,
    created_at,
    updated_at
  ) values (
    initcap(replace(tg_table_name, '_', ' ')) || ' ' || titulo_acao,
    coalesce(registro_nome, tg_table_name) || ' foi ' || titulo_acao || '.',
    tipo_notificacao,
    'acao',
    case when tg_op = 'DELETE' then 'alta' else 'normal' end,
    unidade,
    tg_table_name,
    registro_id,
    lower(tg_op),
    jsonb_build_object('table', tg_table_name, 'operation', tg_op, 'record_id', registro_id),
    now(),
    now()
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- 4) Instala triggers nas principais tabelas de ação do sistema.
do $$
declare
  table_name text;
  trigger_name text;
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
    'prontuario',
    'prescricoes',
    'receitas',
    'atestados'
  ] loop
    if to_regclass('public.' || table_name) is not null then
      trigger_name := table_name || '_notificar_acoes_tg';
      execute format('drop trigger if exists %I on public.%I', trigger_name, table_name);
      execute format(
        'create trigger %I after insert or update or delete on public.%I for each row execute function public.emitir_notificacao_acao()',
        trigger_name,
        table_name
      );
    end if;
  end loop;
end $$;
