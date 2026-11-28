// globalSetup do vitest: recria o banco de teste e roda as migrações (R-1).
import pg from "pg";
import { migrarParaCima } from "../../src/banco/migrar.js";
import { BANCO_TESTE, URL_MIGRACAO, URL_SUPER } from "./urls.js";

export default async function preparar(): Promise<void> {
  const cliente = new pg.Client({ connectionString: URL_SUPER });
  try {
    await cliente.connect();
  } catch {
    throw new Error("Banco de teste indisponível: rode `npm run banco:subir`");
  }
  try {
    await cliente.query(`DROP DATABASE IF EXISTS ${BANCO_TESTE} WITH (FORCE)`);
    await cliente.query(`CREATE DATABASE ${BANCO_TESTE} OWNER creditogov_migracao`);
    await cliente.query(`GRANT CONNECT ON DATABASE ${BANCO_TESTE} TO creditogov_app`);
  } finally {
    await cliente.end();
  }
  await migrarParaCima(URL_MIGRACAO);
}
