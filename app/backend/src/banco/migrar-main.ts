// npm run migrar: usa CREDITOGOV_BANCO_MIGRACAO_URL (papel de migração).
import { migrarParaCima } from "./migrar.js";

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
} catch {
  console.error("Falha ao migrar o banco. Confira CREDITOGOV_BANCO_MIGRACAO_URL e o banco local.");
  process.exit(1);
}
