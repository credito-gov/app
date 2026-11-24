import { parse } from "lossless-json";

/**
 * Lê um texto JSON mantendo todo número como o texto original.
 * `JSON.parse` converteria number(18,2) em double e perderia dígitos.
 */
export function lerSemPerda(texto: string): unknown {
  return parse(texto, null, (s: string) => s);
}
