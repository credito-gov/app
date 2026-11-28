import { Kysely, PostgresDialect } from "kysely";
import { Migrator, type MigrationProvider } from "kysely/migration";
import pg from "pg";
import * as inicial from "./migracoes/0001_inicial.js";

// Provedor estático: evita carregar arquivos por caminho, que difere entre
// `src` (testes) e `dist` (build). Cada migração nova entra aqui, na ordem.
const provedor: MigrationProvider = {
  async getMigrations() {
    return { "0001_inicial": inicial };
  },
};

export class ErroMigracao extends Error {
  constructor(
    readonly migracao: string | null,
    causa: unknown,
  ) {
    super(migracao ? `Falha na migração ${migracao}` : "Falha ao migrar", { cause: causa });
    this.name = "ErroMigracao";
  }
}

/** Aplica todas as migrações pendentes com o papel de migração. */
export async function migrarParaCima(url: string, prov: MigrationProvider = provedor): Promise<string[]> {
  const db = new Kysely<unknown>({
    dialect: new PostgresDialect({ pool: new pg.Pool({ connectionString: url, max: 1 }) }),
  });
  try {
    const { error, results } = await new Migrator({ db, provider: prov }).migrateToLatest();
    if (error) throw new ErroMigracao(results?.find((r) => r.status === "Error")?.migrationName ?? null, error);
    return (results ?? []).filter((r) => r.status === "Success").map((r) => r.migrationName);
  } finally {
    await db.destroy();
  }
}
