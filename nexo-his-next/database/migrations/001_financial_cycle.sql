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
