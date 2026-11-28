// Auxiliares de teste: limpar e semear com o papel de migração.
// As tabelas têm FORCE ROW LEVEL SECURITY; TRUNCATE não passa pela segurança por linha.
import { sql, type Kysely, type Transaction } from "kysely";
import { abrirKysely } from "../../src/banco/conexao.js";
import type { Esquema } from "../../src/banco/esquema.js";
import { URL_MIGRACAO } from "./urls.js";

const TABELAS = [
  "falha_acesso",
  "bloqueio_acesso",
  "recuperacao_senha",
  "sessao",
  "vinculo_empresa",
  "convite",
  "identidade",
  "usuario",
  "empresa",
];

export function abrirComoMigracao(): Kysely<Esquema> {
  return abrirKysely(URL_MIGRACAO);
}

export async function limparTabelas(db: Kysely<Esquema>): Promise<void> {
  await sql.raw(`TRUNCATE ${TABELAS.join(", ")} CASCADE`).execute(db);
}

/** Roda fn numa transação com as empresas indicadas fixadas (as regras valem para o dono). */
export async function semear<T>(
  db: Kysely<Esquema>,
  empresas: string[],
  fn: (trx: Transaction<Esquema>) => Promise<T>,
): Promise<T> {
  return db.transaction().execute(async (trx) => {
    await sql`select set_config('app.empresas', ${`{${empresas.join(",")}}`}, true)`.execute(trx);
    return fn(trx);
  });
}
