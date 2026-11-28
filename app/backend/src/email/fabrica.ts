import type { AdaptadorEmail } from "../config.js";
import { criarEmailArquivo } from "./arquivo.js";
import { criarEmailMemoria } from "./memoria.js";
import type { EnvioEmail } from "./tipos.js";

/** Escolhe o adaptador pelo valor de CREDITOGOV_EMAIL. */
export function criarEnvioEmail(
  adaptador: AdaptadorEmail,
  opcoes: { pastaArquivo: string },
): EnvioEmail {
  return adaptador === "memoria"
    ? criarEmailMemoria()
    : criarEmailArquivo(opcoes.pastaArquivo);
}
