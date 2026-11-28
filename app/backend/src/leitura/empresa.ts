// Origem: app/painel/src/nucleo/empresa.ts (commit 39e4fae da main; AD-14). Só raizDe: verificarEmpresa depende da interface de pasta, que não é copiada.
// Empresa (CA-3): a comparação é pela raiz do CNPJ, os 8 primeiros dígitos de `ni`.
/** Raiz de um `ni` de 8 ou 14 dígitos; null se não for nenhum dos dois. */
export function raizDe(ni: string): string | null {
  return /^(\d{8}|\d{14})$/.test(ni) ? ni.slice(0, 8) : null;
}
