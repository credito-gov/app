// Dados fiscais lidos da Receita: consulta, arquivo_bruto, credito_lido e debito_lido
// (demanda 033; AD-6, AD-8, AD-9). Segurança por linha e permissões como na 0001.
import { sql, type Kysely } from "kysely";

const CAMPOS_CREDITO = [
  "apurado",
  "a_apropriar",
  "apropriado",
  "suspenso",
  "inapropriavel",
  "prescrito",
  "utilizado",
  "restabelecido",
  "inutilizavel",
  "saldo_credor",
  "pedido_ressarcimento",
  "excedente",
];
const CAMPOS_DEBITO = ["apurado", "extinto", "saldo_devedor", "suspenso", "inexigivel", "pgto_antecipado", "excedente"];

const numerico = (campos: string[]): string => campos.map((c) => `${c} numeric(20,2)`).join(",\n      ");

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    create table consulta (
      id uuid primary key default gen_random_uuid(),
      empresa_id uuid not null references empresa (id),
      servico text not null check (servico in ('creditos', 'debitos', 'recolhimentos', 'pagamentos')),
      estado text not null check (estado in (
        'agendada', 'abrindo', 'aberta', 'concluida', 'baixada', 'lida',
        'erro', 'expirada', 'credencial_invalida', 'servico_indisponivel', 'aberta_sem_tiquete')),
      criada_em timestamptz not null default now(),
      concluida_em timestamptz,
      finalizada_em timestamptz,
      unique (id, empresa_id),
      check (estado <> 'lida' or (concluida_em is not null and finalizada_em is not null)),
      check (estado not in ('erro', 'expirada', 'credencial_invalida', 'servico_indisponivel', 'aberta_sem_tiquete')
             or finalizada_em is not null)
    )`.execute(db);
  await sql`create index consulta_empresa_servico on consulta (empresa_id, servico, criada_em desc)`.execute(db);

  await sql`
    create table arquivo_bruto (
      id uuid primary key default gen_random_uuid(),
      empresa_id uuid not null references empresa (id),
      consulta_id uuid not null unique,
      servico text not null check (servico in ('creditos', 'debitos')),
      recebido_em timestamptz not null,
      tamanho integer not null check (tamanho >= 0),
      sha256 char(64) not null check (sha256 ~ '^[0-9a-f]{64}$'),
      gerado_em text,
      versao_schema text,
      situacao text not null check (situacao in ('aceito', 'aceito_com_divergencia', 'recusado')),
      motivo_recusa text check (motivo_recusa in ('ilegivel', 'fora_do_schema', 'outra_empresa', 'valor_fora_do_limite')),
      versao_leitor text not null,
      objeto text,
      unique (id, empresa_id),
      foreign key (consulta_id, empresa_id) references consulta (id, empresa_id),
      check ((situacao = 'recusado') = (motivo_recusa is not null))
    )`.execute(db);

  await sql.raw(`
    create table credito_lido (
      id uuid primary key default gen_random_uuid(),
      empresa_id uuid not null references empresa (id),
      arquivo_id uuid not null,
      pa char(7) not null,
      chave text not null,
      documento smallint not null,
      origem smallint not null,
      emissao text,
      registro text,
      atualizacao text,
      ${numerico(CAMPOS_CREDITO)},
      foreign key (arquivo_id, empresa_id) references arquivo_bruto (id, empresa_id)
    )`).execute(db);
  await sql`create index credito_lido_empresa on credito_lido (empresa_id, arquivo_id)`.execute(db);

  await sql.raw(`
    create table debito_lido (
      id uuid primary key default gen_random_uuid(),
      empresa_id uuid not null references empresa (id),
      arquivo_id uuid not null,
      pa char(7) not null,
      chave text not null,
      documento smallint not null,
      origem smallint not null,
      emissao text,
      registro text,
      atualizacao text,
      ${numerico(CAMPOS_DEBITO)},
      foreign key (arquivo_id, empresa_id) references arquivo_bruto (id, empresa_id)
    )`).execute(db);
  await sql`create index debito_lido_empresa on debito_lido (empresa_id, arquivo_id)`.execute(db);

  for (const t of ["consulta", "arquivo_bruto", "credito_lido", "debito_lido"]) {
    await sql.raw(`alter table ${t} enable row level security`).execute(db);
    await sql.raw(`alter table ${t} force row level security`).execute(db);
    await sql
      .raw(
        `create policy ${t}_acesso on ${t} for all
          using (empresa_id = any (public.app_empresas()))
          with check (empresa_id = any (public.app_empresas()))`,
      )
      .execute(db);
  }

  // Só leitura e inclusão: UPDATE em consulta fica para a demanda do coletor; não há DELETE.
  await sql`grant select, insert on consulta, arquivo_bruto, credito_lido, debito_lido to creditogov_app`.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  for (const t of ["debito_lido", "credito_lido", "arquivo_bruto", "consulta"]) {
    await sql.raw(`drop table ${t}`).execute(db);
  }
}
