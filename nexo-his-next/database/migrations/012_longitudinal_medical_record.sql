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
