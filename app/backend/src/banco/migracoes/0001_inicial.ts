// Migração inicial: funções, tabelas, segurança por linha e permissões (CA-2, CA-35 a CA-37).
import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  // Funções que leem o que a transação fixou. Sem valor: NULL e '{}', e nenhuma linha passa.
  await sql`
    create function app_usuario() returns uuid
      language sql stable set search_path = pg_catalog
      as $$ select nullif(current_setting('app.usuario_id', true), '')::uuid $$`.execute(db);
  await sql`
    create function app_empresas() returns uuid[]
      language sql stable set search_path = pg_catalog
      as $$ select coalesce(nullif(current_setting('app.empresas', true), '')::uuid[], '{}'::uuid[]) $$`.execute(db);

  await sql`
    create table empresa (
      id uuid primary key default gen_random_uuid(),
      cnpj_raiz char(8) not null unique check (cnpj_raiz ~ '^[0-9]{8}$'),
      nome text not null check (char_length(nome) between 1 and 200),
      criada_em timestamptz not null default now()
    )`.execute(db);

  await sql`
    create table usuario (
      id uuid primary key default gen_random_uuid(),
      nome text not null check (char_length(nome) between 1 and 120),
      email_normalizado text not null unique check (char_length(email_normalizado) between 3 and 254),
      criado_em timestamptz not null default now()
    )`.execute(db);

  await sql`
    create table identidade (
      id uuid primary key default gen_random_uuid(),
      usuario_id uuid not null references usuario (id),
      provedor text not null check (provedor in ('senha')),
      sujeito text not null check (char_length(sujeito) between 3 and 254),
      hash_senha text,
      criada_em timestamptz not null default now(),
      senha_alterada_em timestamptz,
      unique (provedor, sujeito)
    )`.execute(db);

  await sql`
    create table convite (
      id uuid primary key default gen_random_uuid(),
      empresa_id uuid not null references empresa (id),
      email_normalizado text not null check (char_length(email_normalizado) between 3 and 254),
      papel text not null check (papel in ('titular', 'contador', 'colaborador')),
      token_hmac text not null unique,
      criado_por uuid references usuario (id),
      origem text not null check (origem in ('equipe', 'usuario')),
      criado_em timestamptz not null default now(),
      expira_em timestamptz not null,
      usado_em timestamptz,
      aceito_por uuid references usuario (id),
      invalidado_em timestamptz
    )`.execute(db);
  await sql`create index convite_empresa_email on convite (empresa_id, email_normalizado)`.execute(db);

  await sql`
    create table vinculo_empresa (
      id uuid primary key default gen_random_uuid(),
      empresa_id uuid not null references empresa (id),
      usuario_id uuid not null references usuario (id),
      papel text not null check (papel in ('titular', 'contador', 'colaborador')),
      convite_id uuid references convite (id),
      criado_em timestamptz not null default now(),
      removido_em timestamptz,
      removido_por uuid references usuario (id)
    )`.execute(db);
  await sql`
    create unique index vinculo_ativo on vinculo_empresa (empresa_id, usuario_id)
      where removido_em is null`.execute(db);
  await sql`create index vinculo_usuario on vinculo_empresa (usuario_id)`.execute(db);

  await sql`
    create table sessao (
      id uuid primary key default gen_random_uuid(),
      usuario_id uuid not null references usuario (id),
      token_hmac text not null unique,
      criada_em timestamptz not null default now(),
      ultimo_uso_em timestamptz not null default now(),
      expira_em timestamptz not null,
      encerrada_em timestamptz,
      motivo_encerramento text check (motivo_encerramento in ('saida', 'nova_senha'))
    )`.execute(db);
  await sql`create index sessao_usuario on sessao (usuario_id)`.execute(db);

  await sql`
    create table recuperacao_senha (
      id uuid primary key default gen_random_uuid(),
      usuario_id uuid not null references usuario (id),
      token_hmac text not null unique,
      criada_em timestamptz not null default now(),
      expira_em timestamptz not null,
      usada_em timestamptz,
      invalidada_em timestamptz
    )`.execute(db);

  await sql`
    create table falha_acesso (
      id uuid primary key default gen_random_uuid(),
      tipo text not null check (tipo in ('login', 'recuperacao')),
      chave_hmac text not null,
      em timestamptz not null
    )`.execute(db);
  await sql`create index falha_acesso_chave on falha_acesso (tipo, chave_hmac, em)`.execute(db);

  await sql`
    create table bloqueio_acesso (
      tipo text not null check (tipo in ('login', 'recuperacao')),
      chave_hmac text not null,
      ate timestamptz not null,
      primary key (tipo, chave_hmac)
    )`.execute(db);

  // Segurança por linha: vale também para o dono (FORCE).
  for (const t of ["empresa", "vinculo_empresa", "convite"]) {
    await sql.raw(`alter table ${t} enable row level security`).execute(db);
    await sql.raw(`alter table ${t} force row level security`).execute(db);
  }

  await sql`
    create policy empresa_acesso on empresa for all
      using (id = any (public.app_empresas()))
      with check (id = any (public.app_empresas()))`.execute(db);

  // DT-5: o próprio usuário enxerga os seus vínculos; a escrita fica presa à empresa fixada.
  await sql`
    create policy vinculo_leitura on vinculo_empresa for select
      using (empresa_id = any (public.app_empresas()) or usuario_id = public.app_usuario())`.execute(db);
  await sql`
    create policy vinculo_insercao on vinculo_empresa for insert
      with check (empresa_id = any (public.app_empresas()))`.execute(db);
  await sql`
    create policy vinculo_alteracao on vinculo_empresa for update
      using (empresa_id = any (public.app_empresas()))
      with check (empresa_id = any (public.app_empresas()))`.execute(db);
  await sql`
    create policy vinculo_remocao on vinculo_empresa for delete
      using (empresa_id = any (public.app_empresas()))`.execute(db);

  await sql`
    create policy convite_acesso on convite for all
      using (empresa_id = any (public.app_empresas()))
      with check (empresa_id = any (public.app_empresas()))`.execute(db);

  // Permissões do papel de trabalho: só o necessário, sem TRUNCATE, REFERENCES nem TRIGGER.
  await sql`grant execute on function app_usuario(), app_empresas() to creditogov_app`.execute(db);
  await sql`grant select, insert, update on empresa, usuario, identidade, sessao, recuperacao_senha to creditogov_app`.execute(db);
  await sql`grant select, insert, update, delete on vinculo_empresa, convite, bloqueio_acesso to creditogov_app`.execute(db);
  await sql`grant select, insert, delete on falha_acesso to creditogov_app`.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  for (const t of [
    "bloqueio_acesso",
    "falha_acesso",
    "recuperacao_senha",
    "sessao",
    "vinculo_empresa",
    "convite",
    "identidade",
    "usuario",
    "empresa",
  ]) {
    await sql.raw(`drop table ${t}`).execute(db);
  }
  await sql`drop function app_empresas()`.execute(db);
  await sql`drop function app_usuario()`.execute(db);
}
