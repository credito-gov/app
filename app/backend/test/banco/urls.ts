// URLs do banco de teste. Fixas, sem senha, só 127.0.0.1 (CA-3).
// CREDITOGOV_BANCO_TESTE_URL troca a URL do superusuário do contêiner (porta).
const SUPER =
  process.env["CREDITOGOV_BANCO_TESTE_URL"] ?? "postgres://postgres@127.0.0.1:5433/postgres";

export const BANCO_TESTE = "creditogov_teste";

function com(usuario: string, banco: string): string {
  const u = new URL(SUPER);
  u.username = usuario;
  u.password = "";
  u.pathname = `/${banco}`;
  return u.toString();
}

export const URL_SUPER = com(new URL(SUPER).username || "postgres", "postgres");
export const URL_MIGRACAO = com("creditogov_migracao", BANCO_TESTE);
export const URL_APP = com("creditogov_app", BANCO_TESTE);
