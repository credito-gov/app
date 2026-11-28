// Origem: app/painel/src/nucleo/json.ts (commit 39e4fae da main; AD-14). Cópia revisada: só o cabeçalho muda.
// Copiado de app/apuracao-cbs/src/json.ts (commit c3d8c56, DT-2) e estendido: BOM inicial e erro identificável.
import { parse } from "lossless-json";

/** Erro de um texto que não é JSON. */
export class ErroJsonIlegivel extends Error {
  constructor(mensagem = "JSON inválido: o arquivo não pôde ser lido") {
    super(mensagem);
    this.name = "ErroJsonIlegivel";
  }
}

/**
 * Lê um texto JSON mantendo todo número como o texto original.
 * `JSON.parse` converteria number(18,2) em double e perderia dígitos.
 */
export function lerSemPerda(texto: string): unknown {
  const limpo = texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto;
  try {
    return parse(limpo, null, (s: string) => s);
  } catch {
    throw new ErroJsonIlegivel();
  }
}
