// npm run migrar: usa CREDITOGOV_BANCO_MIGRACAO_URL (papel de migração).
import { descreverErro } from "../erro.js";
import { ErroMigracao, migrarParaCima } from "./migrar.js";

const url = process.env["CREDITOGOV_BANCO_MIGRACAO_URL"];
if (!url) {
  console.error("Variável obrigatória ausente: CREDITOGOV_BANCO_MIGRACAO_URL");
  process.exit(1);
}
try {
  const aplicadas = await migrarParaCima(url);
  console.log(
    aplicadas.length ? `Migrações aplicadas: ${aplicadas.join(", ")}` : "Nada a migrar.",
  );
} catch (e) {
  // Terminal do operador: pode mostrar o erro e a migração, nunca a URL.
  console.error("Falha ao migrar o banco. Confira CREDITOGOV_BANCO_MIGRACAO_URL e o banco local.");
  if (e instanceof ErroMigracao) {
    if (e.migracao) console.error(`Migração que falhou: ${e.migracao}`);
    console.error(descreverErro(e.cause));
  } else {
    console.error(descreverErro(e));
  }
  process.exit(1);
}
