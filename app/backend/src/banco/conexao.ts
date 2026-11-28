import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import type { Esquema } from "./esquema.js";

/** Abre o Kysely sobre o pool do `pg`. `numeric` volta como string (CA-38). */
export function abrirKysely(url: string, opcoes: { max?: number } = {}): Kysely<Esquema> {
  const pool = new pg.Pool({ connectionString: url, max: opcoes.max ?? 10 });
  return new Kysely<Esquema>({ dialect: new PostgresDialect({ pool }) });
}
