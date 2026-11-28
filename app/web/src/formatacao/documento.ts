// Identificação do emitente como vem da chave: só por texto, sem aritmética.

/** AA.AAA.AAA/AAAA-DD, com as letras como vierem. */
export function formatarCnpj(numero: string): string {
  return `${numero.slice(0, 2)}.${numero.slice(2, 5)}.${numero.slice(5, 8)}/${numero.slice(8, 12)}-${numero.slice(12, 14)}`;
}

/** DDD.DDD.DDD-DD. */
export function formatarCpf(numero: string): string {
  return `${numero.slice(0, 3)}.${numero.slice(3, 6)}.${numero.slice(6, 9)}-${numero.slice(9, 11)}`;
}
