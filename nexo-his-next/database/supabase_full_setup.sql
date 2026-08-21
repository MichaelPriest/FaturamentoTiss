-- ============================================================================
-- NEXO HIS NEXT - INSTALACAO COMPLETA PARA SUPABASE
-- Arquivo gerado automaticamente. Nao edite manualmente.
-- Execute em um projeto Supabase NOVO pelo SQL Editor, usando uma conta owner.
-- Fonte: database/migrations/000_core...014_attendance_relationships, na ordem abaixo.
-- Gerado em ordem deterministica; nenhuma credencial ou dado inicial e incluido.
-- ============================================================================

-- ============================================================================
-- MIGRATION: 000_core.sql
-- ============================================================================
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

-- ============================================================================
-- MIGRATION: 001_financial_cycle.sql
-- ============================================================================
-- Ciclo financeiro hospitalar: conta, remessa, retorno, glosa, recurso e auditoria.
-- Valores monetários usam numeric(20,2); nunca real/double precision.
begin;
create extension if not exists pgcrypto;

create sequence if not exists public.faturamento_numero_lote_seq;

create table if not exists public.contas_hospitalares (
  id uuid primary key default gen_random_uuid(), empresa_id uuid, unidade_id uuid not null,
  guia_tiss_id bigint not null references public.guias_geradas(id) on delete restrict,
  internacao_id uuid references public.internacoes(id) on delete restrict,
  operadora_id bigint references public.convenios(id) on delete restrict,
  tipo_atendimento text not null default 'SP_SADT', data_abertura timestamptz not null default now(), data_fechamento timestamptz,
  situacao text not null default 'ABERTA' check (situacao in ('ABERTA','FECHADA','ENVIADA','PAGA','RESSARCIDA')),
  valor_total_bruto numeric(20,2) not null default 0 check (valor_total_bruto >= 0),
  valor_desconto numeric(20,2) not null default 0 check (valor_desconto >= 0),
  valor_total_liquido numeric(20,2) not null default 0 check (valor_total_liquido >= 0),
  valor_ressarcido numeric(20,2) not null default 0 check (valor_ressarcido >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (unidade_id, guia_tiss_id), check (valor_desconto <= valor_total_bruto),
  check (valor_total_liquido = round(valor_total_bruto - valor_desconto, 2))
);

create table if not exists public.itens_conta_hospitalar (
  id uuid primary key default gen_random_uuid(), empresa_id uuid, unidade_id uuid not null,
  conta_id uuid not null references public.contas_hospitalares(id) on delete cascade,
  procedimento_tuss_id bigint references public.procedimentos(id) on delete restrict,
  estoque_item_id uuid references public.estoque_itens(id) on delete restrict,
  origem text not null check (origem in ('GUIA','PRESCRICAO','ESTOQUE','MANUAL')),
  origem_id text, descricao_livre text not null, quantidade numeric(16,3) not null check (quantidade > 0),
  data_realizacao timestamptz not null, valor_unitario numeric(20,2) not null check (valor_unitario >= 0),
  valor_total numeric(20,2) generated always as (round(quantidade * valor_unitario, 2)) stored,
  registro_conselho text, created_at timestamptz not null default now(),
  unique nulls not distinct (conta_id, origem, origem_id)
);

create table if not exists public.faturamento_remessas (
  id uuid primary key default gen_random_uuid(), empresa_id uuid, unidade_id uuid not null,
  prestador_id bigint not null references public.prestadores(id) on delete restrict,
  operadora_id bigint not null references public.convenios(id) on delete restrict,
  numero_lote bigint not null default nextval('public.faturamento_numero_lote_seq'),
  periodo_inicio date not null, periodo_fim date not null, data_envio timestamptz,
  status text not null default 'GERADO' check (status in ('GERADO','ENVIADO','PROCESSADO','FECHADO')),
  valor_total_lote numeric(20,2) not null default 0 check (valor_total_lote >= 0),
  valor_glosado numeric(20,2) not null default 0 check (valor_glosado >= 0),
  percentual_glosa numeric(9,4) not null default 0, arquivo_xml_remessa text not null,
  hash_xml text not null, assinatura_status text not null default 'PENDENTE' check (assinatura_status in ('PENDENTE','ASSINADO','ERRO')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (unidade_id, numero_lote), check (periodo_fim >= periodo_inicio)
);

create table if not exists public.guias_faturamento (
  id uuid primary key default gen_random_uuid(), empresa_id uuid, unidade_id uuid not null,
  remessa_id uuid not null references public.faturamento_remessas(id) on delete restrict,
  guia_tiss_id bigint not null references public.guias_geradas(id) on delete restrict,
  conta_id uuid not null references public.contas_hospitalares(id) on delete restrict,
  sequencial_no_lote integer not null check (sequencial_no_lote > 0),
  valor_autorizado numeric(20,2) not null default 0, valor_glosado numeric(20,2) not null default 0,
  valor_pago numeric(20,2) not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (remessa_id, sequencial_no_lote), unique (remessa_id, guia_tiss_id)
);

create table if not exists public.tabela_glosas_ans (
  id bigint generated always as identity primary key, codigo_ans integer not null unique,
  categoria text not null check (categoria in ('1 - FALTA DOCUMENTAÇÃO','2 - FALTA PREENCHIMENTO','3 - DIVERGÊNCIA DADOS','4 - NEGATIVA DE COBERTURA','5 - NÃO PREENCHER','6 - NÃO REALIZADO','7 - VALOR/QUANTIDADE','8 - PRAZO/VALIDADE','9 - REGISTRO/CONSELHO','10 - COBRANÇA INDEVIDA')),
  descricao_padrao text not null, orientacao_recurso text, vigencia_inicio date, vigencia_fim date,
  fonte_oficial text not null, versao_terminologia text not null, ativo boolean not null default true
);

create table if not exists public.glosas_financeiras (
  id uuid primary key default gen_random_uuid(), empresa_id uuid, unidade_id uuid not null,
  item_conta_id uuid references public.itens_conta_hospitalar(id) on delete restrict,
  guia_faturamento_id uuid not null references public.guias_faturamento(id) on delete restrict,
  operadora_id bigint not null references public.convenios(id) on delete restrict,
  codigo_glosa_ans integer not null references public.tabela_glosas_ans(codigo_ans) on update cascade,
  descricao_glosa text not null, tipo_glosa text not null check (tipo_glosa in ('ADMINISTRATIVA','TECNICA','FINANCEIRA')),
  valor_glosado numeric(20,2) not null check (valor_glosado > 0), data_glosa date not null,
  prazo_recurso date not null, situacao text not null default 'PENDENTE' check (situacao in ('PENDENTE','RECORRIDO','ACEITO','JULGADO')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.recursos_glosa (
  id uuid primary key default gen_random_uuid(), empresa_id uuid, unidade_id uuid not null,
  numero_protocolo_recurso text not null, data_abertura timestamptz not null default now(), data_encerramento timestamptz,
  status text not null default 'ABERTO' check (status in ('ABERTO','EM_ANALISE','DEFERIDO','INDEFERIDO')),
  valor_reivindicado numeric(20,2) not null check (valor_reivindicado > 0), valor_aprovado numeric(20,2) not null default 0,
  justificativa text not null check (length(trim(justificativa)) >= 20), justificativa_decisao text,
  anexos jsonb not null default '[]'::jsonb check (jsonb_typeof(anexos) = 'array'),
  created_by uuid not null default auth.uid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (unidade_id, numero_protocolo_recurso)
);

create table if not exists public.recurso_glosa_itens (
  unidade_id uuid not null,
  recurso_id uuid not null references public.recursos_glosa(id) on delete restrict,
  glosa_id uuid not null references public.glosas_financeiras(id) on delete restrict,
  primary key (recurso_id, glosa_id)
);

create table if not exists public.auditoria_financeira (
  id bigint generated always as identity primary key, empresa_id uuid, unidade_id uuid not null,
  tabela text not null, registro_id text not null, operacao text not null check (operacao in ('INSERT','UPDATE','DELETE')),
  dados_anteriores jsonb, dados_novos jsonb, usuario_id uuid default auth.uid(), ocorrido_em timestamptz not null default clock_timestamp()
);

create table if not exists public.indices_reajuste_ans (
  id bigint generated always as identity primary key, ano integer not null unique, indice_percentual numeric(9,4) not null,
  vigencia_inicio date not null, fonte_oficial text not null, publicado_em date not null
);
create table if not exists public.plano_contas_contabil (
  id bigint generated always as identity primary key, codigo text not null unique, descricao text not null,
  natureza text not null check (natureza in ('DEVEDORA','CREDORA')), tipo text not null check (tipo in ('SINTETICA','ANALITICA')),
  codigo_pai text references public.plano_contas_contabil(codigo), ativo boolean not null default true
);

alter table public.estoque_movimentacoes add column if not exists internacao_id uuid references public.internacoes(id) on delete restrict;
alter table public.estoque_movimentacoes add column if not exists faturado_em timestamptz;

create index if not exists contas_hospitalares_fila_idx on public.contas_hospitalares(unidade_id,operadora_id,situacao,data_fechamento);
create index if not exists glosas_prazo_idx on public.glosas_financeiras(unidade_id,situacao,prazo_recurso);
create index if not exists remessas_periodo_idx on public.faturamento_remessas(unidade_id,operadora_id,periodo_inicio,periodo_fim);

create or replace function public.exigir_perfil_financeiro(p_niveis text[]) returns void language plpgsql stable security invoker as $$
declare setor text; nivel text; papel text; begin
  select setor_acesso,nivel_acesso,role into setor,nivel,papel from public.usuarios where id=auth.uid() and ativo;
  if papel='admin' or nivel='administrador' then return; end if;
  if setor not in ('faturamento','financeiro') then raise exception 'Setor sem acesso ao módulo financeiro' using errcode='42501'; end if;
  if nivel='operador' and not ('faturista'=any(p_niveis)) then raise exception 'Operação exige supervisão financeira' using errcode='42501'; end if;
  if nivel='supervisor' and not ('supervisor_financeiro'=any(p_niveis) or 'faturista'=any(p_niveis)) then raise exception 'Perfil sem permissão financeira' using errcode='42501'; end if;
end $$;

create or replace function public.auditar_financeiro() returns trigger language plpgsql security definer set search_path=public as $$
declare atual jsonb := case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end; begin
  insert into public.auditoria_financeira(empresa_id,unidade_id,tabela,registro_id,operacao,dados_anteriores,dados_novos)
  values((atual->>'empresa_id')::uuid,(atual->>'unidade_id')::uuid,tg_table_name,atual->>'id',tg_op,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end);
  return coalesce(new,old);
end $$;

do $$ declare tabela text; begin
  foreach tabela in array array['contas_hospitalares','itens_conta_hospitalar','faturamento_remessas','guias_faturamento','glosas_financeiras','recursos_glosa','recurso_glosa_itens','auditoria_financeira'] loop
    execute format('alter table public.%I enable row level security', tabela);
    execute format('drop policy if exists unidade_financeiro on public.%I', tabela);
    execute format('create policy unidade_financeiro on public.%I for all to authenticated using (unidade_id=public.usuario_unidade_id()) with check (unidade_id=public.usuario_unidade_id())', tabela);
  end loop;
  foreach tabela in array array['contas_hospitalares','itens_conta_hospitalar','faturamento_remessas','guias_faturamento','glosas_financeiras','recursos_glosa'] loop
    execute format('drop trigger if exists auditoria_financeira_tg on public.%I', tabela);
    execute format('create trigger auditoria_financeira_tg after insert or update or delete on public.%I for each row execute function public.auditar_financeiro()', tabela);
  end loop;
end $$;

create or replace function public.gerar_conta_hospitalar(p_guia_id bigint) returns public.contas_hospitalares
language plpgsql security invoker as $$
declare guia jsonb; conta public.contas_hospitalares; item jsonb; bruto numeric(20,2); begin
  perform public.exigir_perfil_financeiro(array['faturista','supervisor_financeiro']);
  select to_jsonb(g) into guia from public.guias_geradas g where g.id=p_guia_id for update;
  if guia is null then raise exception 'Guia TISS não encontrada'; end if;
  insert into public.contas_hospitalares(unidade_id,guia_tiss_id,internacao_id,operadora_id,tipo_atendimento,situacao,data_fechamento)
  values(public.usuario_unidade_id(),p_guia_id,nullif(guia->>'internacao_id','')::uuid,nullif(guia->>'convenio_id','')::bigint,coalesce(guia->>'tipo_guia','SP_SADT'),'FECHADA',now())
  on conflict (unidade_id,guia_tiss_id) do update set updated_at=now() returning * into conta;
  for item in select * from jsonb_array_elements(coalesce(guia->'itens','[]'::jsonb)) loop
    insert into public.itens_conta_hospitalar(unidade_id,conta_id,procedimento_tuss_id,origem,origem_id,descricao_livre,quantidade,data_realizacao,valor_unitario,registro_conselho)
    values(public.usuario_unidade_id(),conta.id,nullif(item->>'procedimento_id','')::bigint,'GUIA',item->>'id',
      coalesce(nullif(item->>'descricao',''),'Procedimento TISS'),coalesce(nullif(item->>'quantidade','')::numeric,1),
      coalesce(nullif(item->>'data_execucao','')::timestamptz,now()),coalesce(nullif(item->>'valor_unitario','')::numeric,0),item->>'registro_conselho')
    on conflict (conta_id,origem,origem_id) do update set quantidade=excluded.quantidade,valor_unitario=excluded.valor_unitario,data_realizacao=excluded.data_realizacao;
  end loop;
  if conta.internacao_id is not null then
    insert into public.itens_conta_hospitalar(unidade_id,conta_id,estoque_item_id,origem,origem_id,descricao_livre,quantidade,data_realizacao,valor_unitario)
    select public.usuario_unidade_id(),conta.id,m.item_id,'ESTOQUE',m.id::text,e.nome,m.quantidade,m.created_at,e.custo_medio
      from public.estoque_movimentacoes m join public.estoque_itens e on e.id=m.item_id
     where m.internacao_id=conta.internacao_id and m.tipo in ('saida','perda') and m.faturado_em is null
    on conflict (conta_id,origem,origem_id) do nothing;
    update public.estoque_movimentacoes set faturado_em=now() where internacao_id=conta.internacao_id and faturado_em is null;
  end if;
  select coalesce(sum(valor_total),0) into bruto from public.itens_conta_hospitalar where conta_id=conta.id;
  update public.contas_hospitalares set valor_total_bruto=bruto,valor_total_liquido=round(bruto-valor_desconto,2),updated_at=now() where id=conta.id returning * into conta;
  return conta;
end $$;

create or replace function public.abrir_recurso_glosa(p_glosa_ids uuid[],p_justificativa text,p_anexos jsonb) returns public.recursos_glosa
language plpgsql security invoker as $$
declare recurso public.recursos_glosa; total numeric(20,2); faltantes text[]; begin
  perform public.exigir_perfil_financeiro(array['supervisor_financeiro']);
  if length(trim(p_justificativa))<20 then raise exception 'Justificativa técnica insuficiente'; end if;
  select array_agg(tipo) into faltantes from unnest(array['prontuario','guia','laudo']) tipo
   where not exists(select 1 from jsonb_array_elements(p_anexos) a where a->>'tipo'=tipo and nullif(a->>'url','') is not null);
  if faltantes is not null then raise exception 'Documentos obrigatórios ausentes: %',array_to_string(faltantes,', '); end if;
  if exists(select 1 from public.glosas_financeiras where id=any(p_glosa_ids) and (situacao<>'PENDENTE' or prazo_recurso<current_date)) then raise exception 'Glosa inelegível ou fora do prazo'; end if;
  select sum(valor_glosado) into total from public.glosas_financeiras where id=any(p_glosa_ids);
  if total is null then raise exception 'Nenhuma glosa válida selecionada'; end if;
  insert into public.recursos_glosa(unidade_id,numero_protocolo_recurso,valor_reivindicado,justificativa,anexos)
  values(public.usuario_unidade_id(),'REC-'||to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS'),total,p_justificativa,p_anexos) returning * into recurso;
  insert into public.recurso_glosa_itens(unidade_id,recurso_id,glosa_id)
  select public.usuario_unidade_id(),recurso.id,id from public.glosas_financeiras where id=any(p_glosa_ids);
  update public.glosas_financeiras set situacao='RECORRIDO',updated_at=now() where id=any(p_glosa_ids);
  return recurso;
end $$;

create or replace function public.gerar_remessa_faturamento(p_operadora_id bigint,p_data_inicio date,p_data_fim date) returns public.faturamento_remessas
language plpgsql security invoker as $$
declare remessa public.faturamento_remessas; prestador bigint; total numeric(20,2); xml text; begin
  perform public.exigir_perfil_financeiro(array['faturista','supervisor_financeiro']);
  if p_data_fim<p_data_inicio then raise exception 'Período de faturamento inválido'; end if;
  select id into prestador from public.prestadores where unidade_id=public.usuario_unidade_id() order by id limit 1;
  if prestador is null then raise exception 'Prestador da unidade não configurado'; end if;
  select coalesce(sum(valor_total_liquido),0) into total from public.contas_hospitalares
   where unidade_id=public.usuario_unidade_id() and operadora_id=p_operadora_id and situacao='FECHADA'
     and data_fechamento::date between p_data_inicio and p_data_fim;
  if total=0 then raise exception 'Nenhuma conta fechada encontrada para o período'; end if;
  xml := format('<remessaFinanceira versao="INTERNA"><operadora>%s</operadora><periodoInicio>%s</periodoInicio><periodoFim>%s</periodoFim><valorTotal>%s</valorTotal></remessaFinanceira>',
    p_operadora_id,p_data_inicio,p_data_fim,total);
  insert into public.faturamento_remessas(unidade_id,prestador_id,operadora_id,periodo_inicio,periodo_fim,valor_total_lote,arquivo_xml_remessa,hash_xml)
  values(public.usuario_unidade_id(),prestador,p_operadora_id,p_data_inicio,p_data_fim,total,xml,encode(digest(xml,'sha256'),'hex')) returning * into remessa;
  insert into public.guias_faturamento(unidade_id,remessa_id,guia_tiss_id,conta_id,sequencial_no_lote,valor_autorizado)
  select public.usuario_unidade_id(),remessa.id,guia_tiss_id,id,row_number() over(order by data_fechamento,id),valor_total_liquido
    from public.contas_hospitalares where unidade_id=public.usuario_unidade_id() and operadora_id=p_operadora_id and situacao='FECHADA'
      and data_fechamento::date between p_data_inicio and p_data_fim;
  update public.contas_hospitalares set situacao='ENVIADA',updated_at=now()
   where id in(select conta_id from public.guias_faturamento where remessa_id=remessa.id);
  return remessa;
end $$;

-- Importa retorno normalizado após validação contra o XSD da versão do convênio.
-- O adaptador de comunicação deve preservar sequencial, código ANS e valores como texto decimal.
create or replace function public.processar_retorno_faturamento(p_remessa_id uuid,p_xml text) returns public.faturamento_remessas
language plpgsql security invoker as $$
declare remessa public.faturamento_remessas; doc xml; linha record; guia public.guias_faturamento; begin
  perform public.exigir_perfil_financeiro(array['supervisor_financeiro']);
  if p_xml~*'<!DOCTYPE|<!ENTITY' then raise exception 'DTD e entidades não permitidas'; end if;
  select * into remessa from public.faturamento_remessas where id=p_remessa_id for update;
  if remessa.id is null then raise exception 'Remessa não encontrada'; end if;
  doc:=xmlparse(document p_xml);
  for linha in select * from xmltable('/retornoFinanceiro/guia' passing doc columns
    sequencial integer path '@sequencial',valor_pago numeric path '@valorPago',valor_glosado numeric path '@valorGlosado',
    codigo_glosa integer path '@codigoGlosa',descricao text path '@descricaoGlosa',prazo date path '@prazoRecurso') loop
    update public.guias_faturamento set valor_pago=coalesce(linha.valor_pago,0),valor_glosado=coalesce(linha.valor_glosado,0),updated_at=now()
      where remessa_id=remessa.id and sequencial_no_lote=linha.sequencial returning * into guia;
    if guia.id is null then raise exception 'Sequencial % não pertence à remessa',linha.sequencial; end if;
    if coalesce(linha.valor_glosado,0)>0 then
      insert into public.glosas_financeiras(unidade_id,guia_faturamento_id,operadora_id,codigo_glosa_ans,descricao_glosa,tipo_glosa,valor_glosado,data_glosa,prazo_recurso)
      values(public.usuario_unidade_id(),guia.id,remessa.operadora_id,linha.codigo_glosa,coalesce(linha.descricao,'Glosa informada pela operadora'),'ADMINISTRATIVA',linha.valor_glosado,current_date,linha.prazo);
    end if;
    update public.contas_hospitalares set situacao=case when linha.valor_pago>0 then 'PAGA' else situacao end,updated_at=now() where id=guia.conta_id;
  end loop;
  update public.faturamento_remessas r set status='PROCESSADO',valor_glosado=(select coalesce(sum(valor_glosado),0) from public.guias_faturamento where remessa_id=r.id),
    percentual_glosa=round(100*(select coalesce(sum(valor_glosado),0) from public.guias_faturamento where remessa_id=r.id)/nullif(valor_total_lote,0),4),updated_at=now()
   where r.id=remessa.id returning * into remessa;
  return remessa;
end $$;

create or replace function public.dashboard_financeiro() returns jsonb language sql stable security invoker as $$
select jsonb_build_object(
 'total_faturado_mes',coalesce(sum(g.valor_autorizado) filter(where r.created_at>=date_trunc('month',now())),0),
 'total_pago',coalesce(sum(g.valor_pago),0),'total_glosado',coalesce(sum(g.valor_glosado),0),
 'recursos_em_andamento',(select count(*) from public.recursos_glosa where status in ('ABERTO','EM_ANALISE')),
 'contas_a_receber',coalesce(sum(g.valor_autorizado-g.valor_glosado-g.valor_pago),0))
from public.guias_faturamento g join public.faturamento_remessas r on r.id=g.remessa_id
where g.unidade_id=public.usuario_unidade_id()
$$;

create or replace function public.relatorio_glosas_por_motivo() returns table(codigo_ans integer,descricao text,quantidade bigint,valor numeric,percentual numeric)
language sql stable security invoker as $$
select g.codigo_glosa_ans,max(t.descricao_padrao),count(*),sum(g.valor_glosado),
 round(100*sum(g.valor_glosado)/nullif(sum(sum(g.valor_glosado)) over(),0),2)
from public.glosas_financeiras g join public.tabela_glosas_ans t on t.codigo_ans=g.codigo_glosa_ans
where g.unidade_id=public.usuario_unidade_id() group by g.codigo_glosa_ans order by sum(g.valor_glosado) desc
$$;

grant select on public.tabela_glosas_ans,public.indices_reajuste_ans,public.plano_contas_contabil to authenticated;
grant select,insert,update on public.contas_hospitalares,public.itens_conta_hospitalar,public.faturamento_remessas,public.guias_faturamento,public.glosas_financeiras,public.recursos_glosa to authenticated;
grant select,insert on public.recurso_glosa_itens to authenticated;
grant select on public.auditoria_financeira to authenticated;
grant execute on function public.gerar_conta_hospitalar(bigint),public.gerar_remessa_faturamento(bigint,date,date),public.processar_retorno_faturamento(uuid,text),public.abrir_recurso_glosa(uuid[],text,jsonb),public.dashboard_financeiro(),public.relatorio_glosas_por_motivo() to authenticated;
commit;

-- ============================================================================
-- MIGRATION: 002_reception.sql
-- ============================================================================
-- Recepção e jornada inicial do paciente.
begin;
alter table public.pacientes alter column empresa_id set default public.usuario_empresa_id();
create table public.atendimentos (
  id uuid primary key default gen_random_uuid(), empresa_id uuid not null default public.usuario_empresa_id(),
  unidade_id uuid not null default public.usuario_unidade_id(), paciente_id bigint not null references public.pacientes(id) on delete restrict,
  tipo text not null check(tipo in ('CONSULTA','URGENCIA','EXAME','INTERNACAO')),
  status text not null default 'AGENDADO' check(status in ('AGENDADO','CHEGOU','TRIAGEM','EM_ATENDIMENTO','FINALIZADO','CANCELADO')),
  prioridade text not null default 'NORMAL' check(prioridade in ('NORMAL','PRIORITARIO','URGENTE')),
  data_agendada timestamptz, data_chegada timestamptz, observacoes text,
  created_by uuid not null default auth.uid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index atendimentos_fila_idx on public.atendimentos(unidade_id,status,data_chegada);

alter table public.pacientes enable row level security;
create policy pacientes_empresa_select on public.pacientes for select to authenticated using(empresa_id=public.usuario_empresa_id());
create policy pacientes_empresa_insert on public.pacientes for insert to authenticated with check(empresa_id=public.usuario_empresa_id());
alter table public.atendimentos enable row level security;
create policy atendimentos_unidade_select on public.atendimentos for select to authenticated using(unidade_id=public.usuario_unidade_id());
create policy atendimentos_unidade_insert on public.atendimentos for insert to authenticated with check(unidade_id=public.usuario_unidade_id() and empresa_id=public.usuario_empresa_id());
create policy atendimentos_unidade_update on public.atendimentos for update to authenticated using(unidade_id=public.usuario_unidade_id()) with check(unidade_id=public.usuario_unidade_id());
grant select,insert on public.pacientes to authenticated;
grant select,insert,update on public.atendimentos to authenticated;
commit;

-- ============================================================================
-- MIGRATION: 003_triage.sql
-- ============================================================================
-- Classificação de risco vinculada à chegada da recepção.
begin;
create table public.triagens (
  id uuid primary key default gen_random_uuid(), empresa_id uuid not null default public.usuario_empresa_id(),
  unidade_id uuid not null default public.usuario_unidade_id(), atendimento_id uuid not null references public.atendimentos(id) on delete restrict,
  classificacao text not null check(classificacao in ('AZUL','VERDE','AMARELO','LARANJA','VERMELHO')),
  queixa_principal text not null check(length(trim(queixa_principal))>=3),
  pressao_sistolica smallint check(pressao_sistolica between 40 and 300), pressao_diastolica smallint check(pressao_diastolica between 20 and 200),
  frequencia_cardiaca smallint check(frequencia_cardiaca between 20 and 250), saturacao smallint check(saturacao between 40 and 100),
  temperatura numeric(4,1) check(temperatura between 30 and 45), escala_dor smallint check(escala_dor between 0 and 10),
  observacoes text, profissional_id uuid not null default auth.uid(), realizada_em timestamptz not null default now(),
  created_at timestamptz not null default now(), unique(atendimento_id)
);
create index triagens_unidade_classificacao_idx on public.triagens(unidade_id,classificacao,realizada_em);
alter table public.triagens enable row level security;
create policy triagens_unidade_select on public.triagens for select to authenticated using(unidade_id=public.usuario_unidade_id());
create policy triagens_unidade_insert on public.triagens for insert to authenticated with check(unidade_id=public.usuario_unidade_id() and empresa_id=public.usuario_empresa_id());

create or replace function public.registrar_triagem(p_atendimento_id uuid,p_classificacao text,p_queixa text,p_sistolica smallint default null,p_diastolica smallint default null,p_fc smallint default null,p_saturacao smallint default null,p_temperatura numeric default null,p_dor smallint default null,p_observacoes text default null)
returns public.triagens language plpgsql security invoker as $$
declare resultado public.triagens; atendimento public.atendimentos; begin
  select * into atendimento from public.atendimentos where id=p_atendimento_id and unidade_id=public.usuario_unidade_id() for update;
  if atendimento.id is null then raise exception 'Atendimento não encontrado nesta unidade'; end if;
  select * into resultado from public.triagens where atendimento_id=p_atendimento_id;
  if resultado.id is not null then return resultado; end if;
  if atendimento.status not in ('CHEGOU','TRIAGEM','EM_ATENDIMENTO') then raise exception 'Atendimento no estado % não pode receber triagem',atendimento.status; end if;
  insert into public.triagens(atendimento_id,classificacao,queixa_principal,pressao_sistolica,pressao_diastolica,frequencia_cardiaca,saturacao,temperatura,escala_dor,observacoes)
  values(p_atendimento_id,p_classificacao,p_queixa,p_sistolica,p_diastolica,p_fc,p_saturacao,p_temperatura,p_dor,p_observacoes) returning * into resultado;
  update public.atendimentos set status=case when status='EM_ATENDIMENTO' then status else 'TRIAGEM' end,prioridade=case when p_classificacao in ('VERMELHO','LARANJA') then 'URGENTE' when p_classificacao='AMARELO' then 'PRIORITARIO' else 'NORMAL' end,updated_at=now() where id=p_atendimento_id;
  return resultado;
end $$;
grant select,insert on public.triagens to authenticated;
grant execute on function public.registrar_triagem(uuid,text,text,smallint,smallint,smallint,smallint,numeric,smallint,text) to authenticated;
commit;

-- ============================================================================
-- MIGRATION: 004_triage_idempotency.sql
-- ============================================================================
-- Corrige concorrência entre recepção, triagem e início do atendimento.
begin;
create or replace function public.registrar_triagem(p_atendimento_id uuid,p_classificacao text,p_queixa text,p_sistolica smallint default null,p_diastolica smallint default null,p_fc smallint default null,p_saturacao smallint default null,p_temperatura numeric default null,p_dor smallint default null,p_observacoes text default null)
returns public.triagens language plpgsql security invoker as $$
declare resultado public.triagens; atendimento public.atendimentos; begin
  select * into atendimento from public.atendimentos where id=p_atendimento_id and unidade_id=public.usuario_unidade_id() for update;
  if atendimento.id is null then raise exception 'Atendimento não encontrado nesta unidade'; end if;
  select * into resultado from public.triagens where atendimento_id=p_atendimento_id;
  if resultado.id is not null then return resultado; end if;
  if atendimento.status not in ('CHEGOU','TRIAGEM','EM_ATENDIMENTO') then raise exception 'Atendimento no estado % não pode receber triagem',atendimento.status; end if;
  insert into public.triagens(atendimento_id,classificacao,queixa_principal,pressao_sistolica,pressao_diastolica,frequencia_cardiaca,saturacao,temperatura,escala_dor,observacoes)
  values(p_atendimento_id,p_classificacao,p_queixa,p_sistolica,p_diastolica,p_fc,p_saturacao,p_temperatura,p_dor,p_observacoes) returning * into resultado;
  update public.atendimentos set status=case when status='EM_ATENDIMENTO' then status else 'TRIAGEM' end,
    prioridade=case when p_classificacao in ('VERMELHO','LARANJA') then 'URGENTE' when p_classificacao='AMARELO' then 'PRIORITARIO' else 'NORMAL' end,updated_at=now()
  where id=p_atendimento_id;
  return resultado;
end $$;

create or replace function public.avancar_atendimento(p_atendimento_id uuid,p_novo_status text) returns public.atendimentos
language plpgsql security invoker as $$
declare atual public.atendimentos; resultado public.atendimentos; permitido boolean; begin
  select * into atual from public.atendimentos where id=p_atendimento_id and unidade_id=public.usuario_unidade_id() for update;
  if atual.id is null then raise exception 'Atendimento não encontrado nesta unidade'; end if;
  permitido := (atual.status='AGENDADO' and p_novo_status='CHEGOU') or (atual.status='CHEGOU' and p_novo_status='TRIAGEM')
    or (atual.status='TRIAGEM' and p_novo_status='EM_ATENDIMENTO') or (atual.status='EM_ATENDIMENTO' and p_novo_status='FINALIZADO');
  if not permitido then raise exception 'Transição inválida: % para %',atual.status,p_novo_status; end if;
  if p_novo_status='EM_ATENDIMENTO' and not exists(select 1 from public.triagens where atendimento_id=atual.id) then raise exception 'Conclua a classificação de risco antes de iniciar o atendimento'; end if;
  update public.atendimentos set status=p_novo_status,updated_at=now() where id=atual.id returning * into resultado;
  return resultado;
end $$;
grant execute on function public.avancar_atendimento(uuid,text) to authenticated;
commit;

-- ============================================================================
-- MIGRATION: 005_user_profile.sql
-- ============================================================================
-- Leitura segura do próprio perfil e unidade para personalização da estação.
begin;
alter table public.usuarios enable row level security;
drop policy if exists usuarios_proprio_select on public.usuarios;
create policy usuarios_proprio_select on public.usuarios for select to authenticated using(id=auth.uid());
grant select on public.usuarios,public.unidades to authenticated;
alter table public.unidades enable row level security;
drop policy if exists unidades_usuario_select on public.unidades;
create policy unidades_usuario_select on public.unidades for select to authenticated using(id=public.usuario_unidade_id());
commit;

-- ============================================================================
-- MIGRATION: 006_profile_onboarding.sql
-- ============================================================================
-- Provisiona o primeiro vínculo institucional sem expor escrita direta em usuarios.
begin;
create or replace function public.garantir_meu_perfil()
returns table(id uuid,nome text,role text,setor_acesso text,nivel_acesso text,unidade_id uuid)
language plpgsql security definer set search_path=public,auth as $$
declare
  v_user auth.users%rowtype;
  v_unidade uuid;
  v_empresa uuid;
  v_total_unidades integer;
  v_nome text;
begin
  if auth.uid() is null then raise exception 'Autenticação obrigatória'; end if;

  return query
    select u.id,u.nome,u.role,u.setor_acesso,u.nivel_acesso,u.unidade_id
      from public.usuarios u where u.id=auth.uid() and u.ativo;
  if found then return; end if;

  select * into v_user from auth.users where auth.users.id=auth.uid();
  v_nome:=coalesce(nullif(trim(v_user.raw_user_meta_data->>'nome'),''),
                   nullif(trim(v_user.raw_user_meta_data->>'full_name'),''),
                   nullif(split_part(v_user.email,'@',1),''),'Usuário');

  -- O vínculo automático só é seguro em uma instalação com uma única unidade.
  perform pg_advisory_xact_lock(hashtext('nexo_profile_onboarding'));
  select count(*),(array_agg(u.id order by u.id))[1] into v_total_unidades,v_unidade from public.unidades u;
  if v_total_unidades=0 then
    insert into public.empresas as e(nome) values ('Instituição principal') returning e.id into v_empresa;
    insert into public.unidades as u(empresa_id,nome) values (v_empresa,'Unidade principal') returning u.id into v_unidade;
  elsif v_total_unidades>1 then
    raise exception 'Há mais de uma unidade disponível. Um administrador deve definir o vínculo do usuário.';
  end if;

  select u.empresa_id into v_empresa from public.unidades u where u.id=v_unidade;
  insert into public.usuarios(id,empresa_id,unidade_id,nome,role,setor_acesso,nivel_acesso)
  values (auth.uid(),v_empresa,v_unidade,v_nome,'usuario','recepcao','operador')
  on conflict (id) do update set ativo=true;

  return query
    select u.id,u.nome,u.role,u.setor_acesso,u.nivel_acesso,u.unidade_id
      from public.usuarios u where u.id=auth.uid();
end$$;
revoke all on function public.garantir_meu_perfil() from public;
grant execute on function public.garantir_meu_perfil() to authenticated;
commit;

-- ============================================================================
-- MIGRATION: 007_clinical_care.sql
-- ============================================================================
-- Atendimento clínico com evolução SOAP e encerramento transacional.
begin;
create table public.evolucoes_clinicas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null default public.usuario_empresa_id(),
  unidade_id uuid not null default public.usuario_unidade_id(),
  atendimento_id uuid not null references public.atendimentos(id) on delete restrict,
  subjetivo text not null check(length(trim(subjetivo))>=3),
  objetivo text not null check(length(trim(objetivo))>=3),
  avaliacao text not null check(length(trim(avaliacao))>=3),
  plano text not null check(length(trim(plano))>=3),
  cid10 text,
  desfecho text not null default 'PERMANECE' check(desfecho in ('PERMANECE','ALTA','INTERNACAO','TRANSFERENCIA')),
  profissional_id uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);
create index evolucoes_atendimento_idx on public.evolucoes_clinicas(atendimento_id,created_at desc);
alter table public.evolucoes_clinicas enable row level security;
create policy evolucoes_unidade_select on public.evolucoes_clinicas for select to authenticated using(unidade_id=public.usuario_unidade_id());

create or replace function public.registrar_evolucao_clinica(p_atendimento_id uuid,p_subjetivo text,p_objetivo text,p_avaliacao text,p_plano text,p_cid10 text default null,p_desfecho text default 'PERMANECE',p_finalizar boolean default false)
returns public.evolucoes_clinicas language plpgsql security definer set search_path=public as $$
declare v_atendimento public.atendimentos; v_resultado public.evolucoes_clinicas; begin
  select * into v_atendimento from public.atendimentos where id=p_atendimento_id and unidade_id=public.usuario_unidade_id() for update;
  if v_atendimento.id is null then raise exception 'Atendimento não encontrado nesta unidade'; end if;
  if v_atendimento.status<>'EM_ATENDIMENTO' then raise exception 'Atendimento deve estar em andamento para receber evolução'; end if;
  if p_finalizar and p_desfecho='PERMANECE' then raise exception 'Informe o desfecho para finalizar o atendimento'; end if;
  insert into public.evolucoes_clinicas(atendimento_id,subjetivo,objetivo,avaliacao,plano,cid10,desfecho)
  values(p_atendimento_id,trim(p_subjetivo),trim(p_objetivo),trim(p_avaliacao),trim(p_plano),nullif(upper(trim(p_cid10)),''),p_desfecho)
  returning * into v_resultado;
  if p_finalizar then update public.atendimentos set status='FINALIZADO',updated_at=now() where id=p_atendimento_id; end if;
  return v_resultado;
end$$;
revoke all on function public.registrar_evolucao_clinica(uuid,text,text,text,text,text,text,boolean) from public;
grant execute on function public.registrar_evolucao_clinica(uuid,text,text,text,text,text,text,boolean) to authenticated;
grant select on public.evolucoes_clinicas to authenticated;
commit;

-- ============================================================================
-- MIGRATION: 008_complete_patient_registration.sql
-- ============================================================================
-- Cadastro demográfico completo e vínculo financeiro por atendimento.
begin;
alter table public.pacientes add column if not exists nome_social text;
alter table public.pacientes add column if not exists sexo text check(sexo is null or sexo in ('FEMININO','MASCULINO','INTERSEXO','NAO_INFORMADO'));
alter table public.pacientes add column if not exists nome_mae text;
alter table public.pacientes add column if not exists telefone text;
alter table public.pacientes add column if not exists email text;
alter table public.pacientes add column if not exists cep text;
alter table public.pacientes add column if not exists logradouro text;
alter table public.pacientes add column if not exists numero text;
alter table public.pacientes add column if not exists complemento text;
alter table public.pacientes add column if not exists bairro text;
alter table public.pacientes add column if not exists cidade text;
alter table public.pacientes add column if not exists uf char(2);
create unique index if not exists pacientes_empresa_cpf_uidx on public.pacientes(empresa_id,cpf) where cpf is not null;

alter table public.atendimentos add column if not exists modalidade_pagamento text not null default 'PARTICULAR' check(modalidade_pagamento in ('PARTICULAR','CONVENIO'));
alter table public.atendimentos add column if not exists convenio_id bigint references public.convenios(id);
alter table public.atendimentos add column if not exists numero_carteirinha text;
alter table public.atendimentos add column if not exists validade_carteirinha date;

alter table public.convenios enable row level security;
create policy convenios_unidade_select on public.convenios for select to authenticated using(unidade_id=public.usuario_unidade_id());
grant select on public.convenios to authenticated;

create or replace function public.registrar_chegada_completa(p_paciente jsonb,p_atendimento jsonb)
returns public.atendimentos language plpgsql security definer set search_path=public as $$
declare v_paciente_id bigint; v_resultado public.atendimentos; v_modalidade text; v_convenio bigint; begin
  v_modalidade:=coalesce(p_atendimento->>'modalidade_pagamento','PARTICULAR');
  v_convenio:=nullif(p_atendimento->>'convenio_id','')::bigint;
  if v_modalidade='CONVENIO' and (v_convenio is null or nullif(trim(p_atendimento->>'numero_carteirinha'),'') is null) then raise exception 'Convênio e número da carteirinha são obrigatórios'; end if;
  if v_modalidade='PARTICULAR' then v_convenio:=null; end if;
  if v_convenio is not null and not exists(select 1 from public.convenios where id=v_convenio and unidade_id=public.usuario_unidade_id()) then raise exception 'Convênio não disponível nesta unidade'; end if;
  insert into public.pacientes(empresa_id,nome,nome_social,cpf,data_nascimento,sexo,nome_mae,telefone,email,cep,logradouro,numero,complemento,bairro,cidade,uf)
  values(public.usuario_empresa_id(),trim(p_paciente->>'nome'),nullif(trim(p_paciente->>'nome_social'),''),nullif(regexp_replace(p_paciente->>'cpf','\D','','g'),''),nullif(p_paciente->>'data_nascimento','')::date,nullif(p_paciente->>'sexo',''),nullif(trim(p_paciente->>'nome_mae'),''),nullif(regexp_replace(p_paciente->>'telefone','\D','','g'),''),nullif(lower(trim(p_paciente->>'email')),''),nullif(regexp_replace(p_paciente->>'cep','\D','','g'),''),nullif(trim(p_paciente->>'logradouro'),''),nullif(trim(p_paciente->>'numero'),''),nullif(trim(p_paciente->>'complemento'),''),nullif(trim(p_paciente->>'bairro'),''),nullif(trim(p_paciente->>'cidade'),''),nullif(upper(trim(p_paciente->>'uf')),'')) returning id into v_paciente_id;
  insert into public.atendimentos(empresa_id,unidade_id,paciente_id,tipo,status,prioridade,data_chegada,observacoes,modalidade_pagamento,convenio_id,numero_carteirinha,validade_carteirinha)
  values(public.usuario_empresa_id(),public.usuario_unidade_id(),v_paciente_id,p_atendimento->>'tipo','CHEGOU',coalesce(p_atendimento->>'prioridade','NORMAL'),now(),nullif(trim(p_atendimento->>'observacoes'),''),v_modalidade,v_convenio,case when v_modalidade='CONVENIO' then trim(p_atendimento->>'numero_carteirinha') end,case when v_modalidade='CONVENIO' then nullif(p_atendimento->>'validade_carteirinha','')::date end) returning * into v_resultado;
  return v_resultado;
end$$;
revoke all on function public.registrar_chegada_completa(jsonb,jsonb) from public;
grant execute on function public.registrar_chegada_completa(jsonb,jsonb) to authenticated;
commit;

-- ============================================================================
-- MIGRATION: 009_triage_to_clinical.sql
-- ============================================================================
-- Conclui a classificação e encaminha o paciente para a estação clínica
-- na mesma transação, evitando atendimentos presos no estado TRIAGEM.
begin;

create or replace function public.concluir_triagem_e_encaminhar(
  p_atendimento_id uuid,
  p_classificacao text,
  p_queixa text,
  p_sistolica smallint default null,
  p_diastolica smallint default null,
  p_fc smallint default null,
  p_saturacao smallint default null,
  p_temperatura numeric default null,
  p_dor smallint default null,
  p_observacoes text default null
) returns public.atendimentos
language plpgsql security invoker as $$
declare
  v_atendimento public.atendimentos;
begin
  perform public.registrar_triagem(
    p_atendimento_id, p_classificacao, p_queixa, p_sistolica,
    p_diastolica, p_fc, p_saturacao, p_temperatura, p_dor, p_observacoes
  );

  select * into v_atendimento
    from public.atendimentos
   where id = p_atendimento_id
     and unidade_id = public.usuario_unidade_id()
   for update;

  if v_atendimento.status = 'TRIAGEM' then
    return public.avancar_atendimento(p_atendimento_id, 'EM_ATENDIMENTO');
  end if;
  if v_atendimento.status = 'EM_ATENDIMENTO' then
    return v_atendimento;
  end if;
  raise exception 'Classificação concluída, mas o atendimento está no estado %', v_atendimento.status;
end $$;

revoke all on function public.concluir_triagem_e_encaminhar(uuid,text,text,smallint,smallint,smallint,smallint,numeric,smallint,text) from public;
grant execute on function public.concluir_triagem_e_encaminhar(uuid,text,text,smallint,smallint,smallint,smallint,numeric,smallint,text) to authenticated;

commit;

-- ============================================================================
-- MIGRATION: 010_complete_clinical_station.sql
-- ============================================================================
-- Estação clínica completa: evolução SOAP, prescrição, exames e orientações.
begin;

alter table public.evolucoes_clinicas
  add column if not exists prescricao text,
  add column if not exists exames_solicitados text,
  add column if not exists orientacoes text;

create or replace function public.registrar_atendimento_clinico(
  p_atendimento_id uuid, p_subjetivo text, p_objetivo text,
  p_avaliacao text, p_plano text, p_cid10 text default null,
  p_prescricao text default null, p_exames text default null,
  p_orientacoes text default null, p_desfecho text default 'PERMANECE',
  p_finalizar boolean default false
) returns public.evolucoes_clinicas
language plpgsql security definer set search_path=public as $$
declare v_atendimento public.atendimentos; v_resultado public.evolucoes_clinicas;
begin
  select * into v_atendimento from public.atendimentos
   where id=p_atendimento_id and unidade_id=public.usuario_unidade_id() for update;
  if v_atendimento.id is null then raise exception 'Atendimento não encontrado nesta unidade'; end if;
  if v_atendimento.status<>'EM_ATENDIMENTO' then raise exception 'Atendimento deve estar em andamento para receber evolução'; end if;
  if p_finalizar and p_desfecho='PERMANECE' then raise exception 'Informe o desfecho para finalizar o atendimento'; end if;
  if p_finalizar and nullif(trim(p_orientacoes),'') is null then raise exception 'Informe as orientações de alta ou encaminhamento'; end if;
  insert into public.evolucoes_clinicas(
    atendimento_id,subjetivo,objetivo,avaliacao,plano,cid10,prescricao,
    exames_solicitados,orientacoes,desfecho
  ) values (
    p_atendimento_id,trim(p_subjetivo),trim(p_objetivo),trim(p_avaliacao),trim(p_plano),
    nullif(upper(trim(p_cid10)),''),nullif(trim(p_prescricao),''),nullif(trim(p_exames),''),
    nullif(trim(p_orientacoes),''),p_desfecho
  ) returning * into v_resultado;
  if p_finalizar then
    update public.atendimentos set status='FINALIZADO',updated_at=now() where id=p_atendimento_id;
  end if;
  return v_resultado;
end $$;

revoke all on function public.registrar_atendimento_clinico(uuid,text,text,text,text,text,text,text,text,text,boolean) from public;
grant execute on function public.registrar_atendimento_clinico(uuid,text,text,text,text,text,text,text,text,text,boolean) to authenticated;
commit;

-- ============================================================================
-- MIGRATION: 011_medical_workflow.sql
-- ============================================================================
-- Fluxo médico ampliado: farmácia, documentos assinados, observação e reavaliação.
begin;
create extension if not exists pgcrypto;

create table if not exists public.solicitacoes_farmacia (
  id uuid primary key default gen_random_uuid(), empresa_id uuid not null default public.usuario_empresa_id(),
  unidade_id uuid not null default public.usuario_unidade_id(), atendimento_id uuid not null references public.atendimentos(id),
  paciente_id bigint not null references public.pacientes(id), prescricao_id uuid not null references public.evolucoes_clinicas(id),
  conteudo text not null, prioridade text not null default 'ROTINA' check(prioridade in ('ROTINA','URGENTE','IMEDIATA')),
  status text not null default 'PENDENTE' check(status in ('PENDENTE','EM_SEPARACAO','DISPENSADA','CANCELADA')),
  solicitado_por uuid not null default auth.uid(), solicitado_em timestamptz not null default now(), dispensado_em timestamptz
);
create index if not exists solicitacoes_farmacia_fila_idx on public.solicitacoes_farmacia(unidade_id,status,prioridade,solicitado_em);

create table if not exists public.documentos_medicos (
  id uuid primary key default gen_random_uuid(), empresa_id uuid not null default public.usuario_empresa_id(),
  unidade_id uuid not null default public.usuario_unidade_id(), atendimento_id uuid not null references public.atendimentos(id),
  paciente_id bigint not null references public.pacientes(id), tipo text not null check(tipo in ('ATESTADO','DECLARACAO','RELATORIO')),
  conteudo text not null, dias_afastamento smallint check(dias_afastamento between 1 and 365),
  medico_id uuid not null default auth.uid(), assinado_em timestamptz not null default now(), assinatura_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists documentos_medicos_paciente_idx on public.documentos_medicos(paciente_id,created_at desc);

create table if not exists public.movimentacoes_clinicas (
  id uuid primary key default gen_random_uuid(), empresa_id uuid not null default public.usuario_empresa_id(),
  unidade_id uuid not null default public.usuario_unidade_id(), atendimento_id uuid not null references public.atendimentos(id),
  tipo text not null check(tipo in ('OBSERVACAO','REAVALIACAO','INTERNACAO','ALTA','TRANSFERENCIA')),
  observacao text, reavaliar_em timestamptz, profissional_id uuid not null default auth.uid(), created_at timestamptz not null default now()
);

do $$ declare tabela text; begin
  foreach tabela in array array['solicitacoes_farmacia','documentos_medicos','movimentacoes_clinicas'] loop
    execute format('alter table public.%I enable row level security',tabela);
    execute format('create policy %I on public.%I for select to authenticated using(unidade_id=public.usuario_unidade_id())',tabela||'_select',tabela);
    execute format('create policy %I on public.%I for insert to authenticated with check(unidade_id=public.usuario_unidade_id() and empresa_id=public.usuario_empresa_id())',tabela||'_insert',tabela);
    execute format('create policy %I on public.%I for update to authenticated using(unidade_id=public.usuario_unidade_id()) with check(unidade_id=public.usuario_unidade_id())',tabela||'_update',tabela);
  end loop;
end $$;

drop function if exists public.registrar_atendimento_clinico(uuid,text,text,text,text,text,text,text,text,text,boolean);
create function public.registrar_atendimento_clinico(
  p_atendimento_id uuid,p_subjetivo text,p_objetivo text,p_avaliacao text,p_plano text,p_cid10 text default null,
  p_prescricao text default null,p_exames text default null,p_orientacoes text default null,p_desfecho text default 'PERMANECE',
  p_finalizar boolean default false,p_prioridade_farmacia text default 'ROTINA',p_emitir_atestado boolean default false,
  p_dias_atestado smallint default null,p_texto_atestado text default null,p_reavaliar_em timestamptz default null
) returns public.evolucoes_clinicas language plpgsql security definer set search_path=public as $$
declare a public.atendimentos; e public.evolucoes_clinicas; documento_texto text;
begin
  select * into a from public.atendimentos where id=p_atendimento_id and unidade_id=public.usuario_unidade_id() for update;
  if a.id is null or a.status<>'EM_ATENDIMENTO' then raise exception 'Atendimento clínico ativo não encontrado'; end if;
  if p_desfecho not in ('PERMANECE','REAVALIACAO','OBSERVACAO','ALTA','INTERNACAO','TRANSFERENCIA') then raise exception 'Desfecho inválido'; end if;
  if p_finalizar and p_desfecho in ('PERMANECE','REAVALIACAO','OBSERVACAO') then raise exception 'Selecione um desfecho definitivo para finalizar'; end if;
  if p_finalizar and nullif(trim(p_orientacoes),'') is null then raise exception 'Informe as orientações de alta ou encaminhamento'; end if;
  if p_desfecho='REAVALIACAO' and p_reavaliar_em is null then raise exception 'Informe quando o paciente deve ser reavaliado'; end if;
  if p_emitir_atestado and (p_dias_atestado is null or nullif(trim(p_texto_atestado),'') is null) then raise exception 'Informe dias e conteúdo do atestado'; end if;
  insert into public.evolucoes_clinicas(atendimento_id,subjetivo,objetivo,avaliacao,plano,cid10,prescricao,exames_solicitados,orientacoes,desfecho)
  values(a.id,trim(p_subjetivo),trim(p_objetivo),trim(p_avaliacao),trim(p_plano),nullif(upper(trim(p_cid10)),''),nullif(trim(p_prescricao),''),nullif(trim(p_exames),''),nullif(trim(p_orientacoes),''),case when p_desfecho in ('OBSERVACAO','REAVALIACAO') then 'PERMANECE' else p_desfecho end) returning * into e;
  if nullif(trim(p_prescricao),'') is not null then
    insert into public.solicitacoes_farmacia(atendimento_id,paciente_id,prescricao_id,conteudo,prioridade) values(a.id,a.paciente_id,e.id,trim(p_prescricao),p_prioridade_farmacia);
  end if;
  if p_emitir_atestado then
    documento_texto:=trim(p_texto_atestado);
    insert into public.documentos_medicos(atendimento_id,paciente_id,tipo,conteudo,dias_afastamento,assinatura_hash)
    values(a.id,a.paciente_id,'ATESTADO',documento_texto,p_dias_atestado,encode(digest(a.id::text||a.paciente_id::text||auth.uid()::text||documento_texto||clock_timestamp()::text,'sha256'),'hex'));
  end if;
  if p_desfecho<>'PERMANECE' then insert into public.movimentacoes_clinicas(atendimento_id,tipo,observacao,reavaliar_em) values(a.id,p_desfecho,p_orientacoes,p_reavaliar_em); end if;
  if p_desfecho='INTERNACAO' and not exists(select 1 from public.internacoes where paciente_id=a.paciente_id and status='ativa') then insert into public.internacoes(unidade_id,paciente_id,status) values(a.unidade_id,a.paciente_id,'ativa'); end if;
  if p_finalizar then update public.atendimentos set status='FINALIZADO',updated_at=now() where id=a.id; end if;
  return e;
end $$;
grant select,insert,update on public.solicitacoes_farmacia to authenticated;
grant select on public.documentos_medicos,public.movimentacoes_clinicas to authenticated;
grant execute on function public.registrar_atendimento_clinico(uuid,text,text,text,text,text,text,text,text,text,boolean,text,boolean,smallint,text,timestamptz) to authenticated;
commit;

-- ============================================================================
-- MIGRATION: 012_longitudinal_medical_record.sql
-- ============================================================================
-- Prontuário longitudinal: identificação, medições, diagnósticos, pedidos, cobrança e auditoria imutável.
begin;

alter table public.pacientes add column if not exists responsavel_nome text;
alter table public.pacientes add column if not exists foto_url text;
alter table public.pacientes add column if not exists alergias text;
alter table public.pacientes add column if not exists doencas_cronicas text;
alter table public.pacientes add column if not exists medicamentos_continuos text;
alter table public.pacientes add column if not exists alertas_clinicos text;

alter table public.atendimentos add column if not exists numero_atendimento text;
alter table public.atendimentos add column if not exists setor text not null default 'PRONTO_ATENDIMENTO';
alter table public.atendimentos add column if not exists local_atendimento text;
alter table public.atendimentos add column if not exists medico_responsavel_id bigint references public.prestadores(id);
alter table public.atendimentos add column if not exists plano text;
alter table public.atendimentos add column if not exists numero_guia text;
alter table public.atendimentos add column if not exists senha_autorizacao text;
alter table public.atendimentos add column if not exists validade_autorizacao date;
alter table public.atendimentos add column if not exists origem_paciente text;
alter table public.atendimentos add column if not exists motivo_atendimento text;
update public.atendimentos set numero_atendimento='ATD-'||upper(substr(replace(id::text,'-',''),1,12)) where numero_atendimento is null;
alter table public.atendimentos alter column numero_atendimento set default ('ATD-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)));
alter table public.atendimentos alter column numero_atendimento set not null;
create unique index if not exists atendimentos_numero_uidx on public.atendimentos(unidade_id,numero_atendimento);

alter table public.atendimentos drop constraint if exists atendimentos_status_check;
alter table public.atendimentos add constraint atendimentos_status_check check(status in (
  'AGENDADO','CHEGOU','TRIAGEM','AGUARDANDO_MEDICO','EM_ATENDIMENTO','OBSERVACAO','INTERNADO',
  'FINALIZADO','TRANSFERIDO','EVADIDO','OBITO','CANCELADO'
));

create table public.atendimentos_status_historico (
  id uuid primary key default gen_random_uuid(),empresa_id uuid not null default public.usuario_empresa_id(),
  unidade_id uuid not null default public.usuario_unidade_id(),atendimento_id uuid not null references public.atendimentos(id),
  status_anterior text,status_novo text not null,justificativa text,usuario_id uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);
create table public.medicoes_clinicas (
  id uuid primary key default gen_random_uuid(),empresa_id uuid not null default public.usuario_empresa_id(),
  unidade_id uuid not null default public.usuario_unidade_id(),atendimento_id uuid not null references public.atendimentos(id),
  pressao_sistolica smallint,pressao_diastolica smallint,frequencia_cardiaca smallint,frequencia_respiratoria smallint,
  temperatura numeric(4,1),saturacao smallint,glicemia numeric(7,2),peso numeric(6,2),altura numeric(4,2),
  imc numeric(5,2) generated always as (case when altura>0 then round(peso/(altura*altura),2) end) stored,
  escala_dor smallint check(escala_dor between 0 and 10),glasgow smallint check(glasgow between 3 and 15),
  profissional_id uuid not null default auth.uid(),created_at timestamptz not null default now()
);
create table public.atendimento_diagnosticos (
  id uuid primary key default gen_random_uuid(),empresa_id uuid not null default public.usuario_empresa_id(),
  unidade_id uuid not null default public.usuario_unidade_id(),atendimento_id uuid not null references public.atendimentos(id),
  cid10 text not null,descricao text not null,tipo text not null check(tipo in ('PRINCIPAL','SECUNDARIO')),
  situacao text not null check(situacao in ('PROVISORIO','CONFIRMADO')),infectocontagioso boolean not null default false,
  inicio date default current_date,resolvido_em date,profissional_id uuid not null default auth.uid(),created_at timestamptz not null default now()
);
create table public.solicitacoes_assistenciais (
  id uuid primary key default gen_random_uuid(),empresa_id uuid not null default public.usuario_empresa_id(),
  unidade_id uuid not null default public.usuario_unidade_id(),atendimento_id uuid not null references public.atendimentos(id),
  tipo text not null check(tipo in ('LABORATORIO','IMAGEM','PATOLOGIA','PROCEDIMENTO','CIRURGIA','TERAPIA','HEMOTERAPIA','INTERCONSULTA')),
  codigo_tuss text,descricao text not null,quantidade numeric(10,2) not null default 1,indicacao_clinica text,cid10 text,
  urgencia text not null default 'ROTINA',requer_autorizacao boolean not null default false,senha_autorizacao text,
  status text not null default 'SOLICITADO',resultado text,anexos jsonb not null default '[]',cancelado_em timestamptz,
  justificativa_cancelamento text,solicitante_id uuid not null default auth.uid(),created_at timestamptz not null default now()
);
create table public.conta_hospitalar_itens (
  id uuid primary key default gen_random_uuid(),empresa_id uuid not null default public.usuario_empresa_id(),
  unidade_id uuid not null default public.usuario_unidade_id(),atendimento_id uuid not null references public.atendimentos(id),
  origem_tipo text not null,origem_id uuid,codigo_tuss text,descricao text not null,quantidade numeric(10,2) not null default 1,
  valor_unitario numeric(14,2) not null default 0,status text not null default 'PENDENTE',created_at timestamptz not null default now()
);
create table public.logs_auditoria_clinica (
  id bigint generated always as identity primary key,empresa_id uuid,unidade_id uuid,atendimento_id uuid,
  entidade text not null,registro_id text,acao text not null,usuario_id uuid default auth.uid(),dados jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.auditar_status_atendimento() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if old.status is distinct from new.status then
    insert into public.atendimentos_status_historico(empresa_id,unidade_id,atendimento_id,status_anterior,status_novo)
    values(new.empresa_id,new.unidade_id,new.id,old.status,new.status);
  end if; return new;
end $$;
create trigger atendimentos_status_auditoria after update of status on public.atendimentos for each row execute function public.auditar_status_atendimento();

do $$ declare t text; begin
  foreach t in array array['atendimentos_status_historico','medicoes_clinicas','atendimento_diagnosticos','solicitacoes_assistenciais','conta_hospitalar_itens','logs_auditoria_clinica'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('create policy %I on public.%I for select to authenticated using(unidade_id=public.usuario_unidade_id())',t||'_select',t);
    execute format('create policy %I on public.%I for insert to authenticated with check(unidade_id=public.usuario_unidade_id())',t||'_insert',t);
  end loop;
end $$;
grant select,insert on public.atendimentos_status_historico,public.medicoes_clinicas,public.atendimento_diagnosticos,public.solicitacoes_assistenciais,public.conta_hospitalar_itens,public.logs_auditoria_clinica to authenticated;
commit;

-- ============================================================================
-- MIGRATION: 013_clinical_workspace_operations.sql
-- ============================================================================
-- Operações transacionais usadas pelos painéis de diagnóstico e solicitações da Estação clínica.
begin;
create or replace function public.registrar_diagnostico_atendimento(
  p_atendimento_id uuid,p_cid10 text,p_descricao text,p_tipo text default 'PRINCIPAL',
  p_situacao text default 'PROVISORIO',p_infectocontagioso boolean default false
) returns public.atendimento_diagnosticos language plpgsql security definer set search_path=public as $$
declare r public.atendimento_diagnosticos; begin
  if not exists(select 1 from public.atendimentos where id=p_atendimento_id and unidade_id=public.usuario_unidade_id()) then raise exception 'Atendimento não encontrado'; end if;
  if p_cid10 !~* '^[A-Z][0-9]{2}(\.[0-9A-Z]{1,2})?$' then raise exception 'CID-10 inválido'; end if;
  if p_tipo not in ('PRINCIPAL','SECUNDARIO') or p_situacao not in ('PROVISORIO','CONFIRMADO') then raise exception 'Classificação diagnóstica inválida'; end if;
  if p_tipo='PRINCIPAL' then update public.atendimento_diagnosticos set tipo='SECUNDARIO' where atendimento_id=p_atendimento_id and tipo='PRINCIPAL' and resolvido_em is null; end if;
  insert into public.atendimento_diagnosticos(atendimento_id,cid10,descricao,tipo,situacao,infectocontagioso)
  values(p_atendimento_id,upper(trim(p_cid10)),trim(p_descricao),p_tipo,p_situacao,p_infectocontagioso) returning * into r;
  insert into public.logs_auditoria_clinica(empresa_id,unidade_id,atendimento_id,entidade,registro_id,acao,dados)
  values(r.empresa_id,r.unidade_id,r.atendimento_id,'atendimento_diagnosticos',r.id::text,'INCLUSAO',to_jsonb(r));
  return r;
end $$;

create or replace function public.registrar_solicitacao_assistencial(
  p_atendimento_id uuid,p_tipo text,p_descricao text,p_codigo_tuss text default null,p_quantidade numeric default 1,
  p_indicacao text default null,p_cid10 text default null,p_urgencia text default 'ROTINA',
  p_requer_autorizacao boolean default false,p_senha text default null,p_valor_unitario numeric default 0
) returns public.solicitacoes_assistenciais language plpgsql security definer set search_path=public as $$
declare r public.solicitacoes_assistenciais; begin
  if not exists(select 1 from public.atendimentos where id=p_atendimento_id and unidade_id=public.usuario_unidade_id()) then raise exception 'Atendimento não encontrado'; end if;
  if p_quantidade<=0 then raise exception 'Quantidade deve ser positiva'; end if;
  insert into public.solicitacoes_assistenciais(atendimento_id,tipo,codigo_tuss,descricao,quantidade,indicacao_clinica,cid10,urgencia,requer_autorizacao,senha_autorizacao)
  values(p_atendimento_id,p_tipo,nullif(trim(p_codigo_tuss),''),trim(p_descricao),p_quantidade,nullif(trim(p_indicacao),''),nullif(upper(trim(p_cid10)),''),p_urgencia,p_requer_autorizacao,nullif(trim(p_senha),'')) returning * into r;
  insert into public.conta_hospitalar_itens(atendimento_id,origem_tipo,origem_id,codigo_tuss,descricao,quantidade,valor_unitario)
  values(r.atendimento_id,'SOLICITACAO_ASSISTENCIAL',r.id,r.codigo_tuss,r.descricao,r.quantidade,coalesce(p_valor_unitario,0));
  insert into public.logs_auditoria_clinica(empresa_id,unidade_id,atendimento_id,entidade,registro_id,acao,dados)
  values(r.empresa_id,r.unidade_id,r.atendimento_id,'solicitacoes_assistenciais',r.id::text,'INCLUSAO',to_jsonb(r));
  return r;
end $$;
revoke all on function public.registrar_diagnostico_atendimento(uuid,text,text,text,text,boolean) from public;
revoke all on function public.registrar_solicitacao_assistencial(uuid,text,text,text,numeric,text,text,text,boolean,text,numeric) from public;
grant execute on function public.registrar_diagnostico_atendimento(uuid,text,text,text,text,boolean) to authenticated;
grant execute on function public.registrar_solicitacao_assistencial(uuid,text,text,text,numeric,text,text,text,boolean,text,numeric) to authenticated;
commit;

-- ============================================================================
-- MIGRATION: 014_attendance_relationships.sql
-- ============================================================================
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

-- ============================================================================
-- VERIFICACAO DA INSTALACAO
-- ============================================================================
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;

-- PROXIMO PASSO (execute separadamente depois de criar o primeiro usuario no Auth):
-- 1. Cadastre uma empresa e uma unidade.
-- 2. Vincule auth.users.id a public.usuarios.id, empresa_id e unidade_id.
-- Exemplo intencionalmente comentado para evitar criar credenciais inseguras:
-- insert into public.empresas(nome) values ('Hospital Exemplo') returning id;
-- insert into public.unidades(empresa_id,nome) values ('EMPRESA_UUID','Unidade Matriz') returning id;
-- insert into public.usuarios(id,empresa_id,unidade_id,nome,role,setor_acesso,nivel_acesso)
-- values ('AUTH_USER_UUID','EMPRESA_UUID','UNIDADE_UUID','Administrador','admin','todos','administrador');
