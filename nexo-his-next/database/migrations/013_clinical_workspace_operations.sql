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
