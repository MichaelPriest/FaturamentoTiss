import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const databaseDir = resolve(here, '..');
const migrationsDir = resolve(databaseDir, 'migrations');
const output = resolve(databaseDir, 'supabase_full_setup.sql');
const files = (await readdir(migrationsDir)).filter(name => /^\d{3}_.+\.sql$/.test(name)).sort();
const firstMigration = files.at(0)?.replace('.sql', '') || 'nenhuma';
const lastMigration = files.at(-1)?.replace('.sql', '') || 'nenhuma';
const header = `-- ============================================================================\n-- NEXO HIS NEXT - INSTALACAO COMPLETA PARA SUPABASE\n-- Arquivo gerado automaticamente. Nao edite manualmente.\n-- Execute em um projeto Supabase NOVO pelo SQL Editor, usando uma conta owner.\n-- Fonte: database/migrations/${firstMigration}...${lastMigration}, na ordem abaixo.\n-- Gerado em ordem deterministica; nenhuma credencial ou dado inicial e incluido.\n-- ============================================================================\n\n`;
const sections = [];
for (const file of files) {
  const sql = (await readFile(resolve(migrationsDir, file), 'utf8')).trim();
  sections.push(`-- ============================================================================\n-- MIGRATION: ${file}\n-- ============================================================================\n${sql}\n`);
}
const footer = `\n-- ============================================================================\n-- VERIFICACAO DA INSTALACAO\n-- ============================================================================\nselect table_name\nfrom information_schema.tables\nwhere table_schema = 'public'\norder by table_name;\n\n-- PROXIMO PASSO (execute separadamente depois de criar o primeiro usuario no Auth):\n-- 1. Cadastre uma empresa e uma unidade.\n-- 2. Vincule auth.users.id a public.usuarios.id, empresa_id e unidade_id.\n-- Exemplo intencionalmente comentado para evitar criar credenciais inseguras:\n-- insert into public.empresas(nome) values ('Hospital Exemplo') returning id;\n-- insert into public.unidades(empresa_id,nome) values ('EMPRESA_UUID','Unidade Matriz') returning id;\n-- insert into public.usuarios(id,empresa_id,unidade_id,nome,role,setor_acesso,nivel_acesso)\n-- values ('AUTH_USER_UUID','EMPRESA_UUID','UNIDADE_UUID','Administrador','admin','todos','administrador');\n`;
await writeFile(output, header + sections.join('\n') + footer);
console.log(`Gerado ${output} com ${files.length} migrations.`);
