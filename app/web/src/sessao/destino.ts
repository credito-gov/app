import type { Empresa } from "../api/cliente";

// CA-31: com uma empresa, direto nela; nos demais casos, a página de empresas.
export function destinoPosLogin(empresas: Empresa[]): string {
  return empresas.length === 1 ? `/e/${empresas[0].id}` : "/empresas";
}
