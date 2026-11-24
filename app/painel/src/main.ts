// Ponto de entrada: `npm start -- [--pasta <caminho>] [--porta <n>]` (DT-4). Sem arquivo de ambiente e sem variável de ambiente.
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { iniciarServidor, type ServidorPainel } from "./servidor.js";

/** Pasta da aplicação (a que tem o package.json), a partir de src/ ou de dist/. */
export const PASTA_APP = resolve(fileURLToPath(new URL("..", import.meta.url)));

const PORTA_PADRAO = 5180;
const USO = "Uso: npm start -- [--pasta <caminho>] [--porta <n>]";

export class ErroArgumento extends Error {}

export interface Argumentos {
  /** Caminho absoluto da pasta de arquivos. */
  pasta: string;
  porta: number;
}

export function lerArgumentos(argv: string[]): Argumentos {
  let pasta = join(PASTA_APP, "dados", "ficticios");
  let porta = PORTA_PADRAO;
  for (let i = 0; i < argv.length; i++) {
    const argumento = argv[i];
    if (argumento === "--pasta") {
      const valor = argv[++i];
      if (valor === undefined || valor === "") throw new ErroArgumento("--pasta precisa de um caminho.");
      pasta = resolve(PASTA_APP, valor);
    } else if (argumento === "--porta") {
      const valor = argv[++i];
      if (valor === undefined || !/^\d{1,5}$/.test(valor) || parseInt(valor, 10) > 65535) throw new ErroArgumento("--porta precisa de um número de 0 a 65535.");
      porta = parseInt(valor, 10);
    } else {
      throw new ErroArgumento(`Argumento desconhecido: ${argumento}`);
    }
  }
  return { pasta, porta };
}

export interface Saida {
  log(texto: string): void;
  erro(texto: string): void;
}

export async function executar(argv: string[], saida: Saida): Promise<{ codigo: number; servidor?: ServidorPainel }> {
  let argumentos: Argumentos;
  try {
    argumentos = lerArgumentos(argv);
  } catch (e) {
    if (!(e instanceof ErroArgumento)) throw e;
    saida.erro(`${e.message}\n${USO}`);
    return { codigo: 1 };
  }
  try {
    const servidor = await iniciarServidor({ pasta: argumentos.pasta, porta: argumentos.porta });
    saida.log(`Painel no ar: http://127.0.0.1:${servidor.porta}/`);
    saida.log(`Pasta de arquivos: ${argumentos.pasta}`);
    saida.log("Ctrl+C para parar.");
    return { codigo: 0, servidor };
  } catch (e) {
    if ((e as { code?: string }).code === "EADDRINUSE") {
      saida.erro(`A porta ${argumentos.porta} já está em uso. Escolha outra com --porta <n>.`);
      return { codigo: 2 };
    }
    throw e;
  }
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const resultado = await executar(process.argv.slice(2), { log: (t) => console.log(t), erro: (t) => console.error(t) });
  if (resultado.codigo !== 0) process.exitCode = resultado.codigo;
}
