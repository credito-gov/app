// Monta um painel sobre uma pasta temporária com os arquivos pedidos, sem socket.
import { fileURLToPath } from "node:url";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { criarPainel, type Painel, type Resposta } from "../../src/rotas.js";
import { bytes } from "./construtores.js";
import { pastaTemporaria, type PastaTemporaria } from "./pasta.js";

export const PASTA_FICTICIOS = fileURLToPath(new URL("../../dados/ficticios/", import.meta.url));
export const PASTA_ERROS = fileURLToPath(new URL("../fixtures/erros/", import.meta.url));

export interface PainelDeTeste {
  painel: Painel;
  pasta: PastaTemporaria;
  get(url: string): Promise<Resposta>;
}

const abertos: PastaTemporaria[] = [];

/** Apaga as pastas temporárias abertas; chamar em afterEach. */
export async function limparPaineis(): Promise<void> {
  while (abertos.length > 0) await abertos.pop()?.limpar();
}

/** `arquivos`: pares [nome, conteúdo]; o conteúdo pode ser um objeto fictício, que é serializado. */
export async function painelCom(arquivos: Array<[string, unknown]>): Promise<PainelDeTeste> {
  const pasta = await pastaTemporaria();
  abertos.push(pasta);
  for (const [nome, conteudo] of arquivos) {
    await pasta.escrever(nome, typeof conteudo === "string" ? conteudo : bytes(conteudo));
  }
  return sobre(pasta);
}

/** Painel sobre uma cópia temporária de pastas existentes (fictícios, fixtures de erro). */
export async function painelCopiando(...origens: string[]): Promise<PainelDeTeste> {
  const pasta = await pastaTemporaria();
  abertos.push(pasta);
  for (const origem of origens) {
    for (const nome of await readdir(origem)) await pasta.copiarDe(join(origem, nome), nome);
  }
  return sobre(pasta);
}

function sobre(pasta: PastaTemporaria): PainelDeTeste {
  const painel = criarPainel({ pasta: pasta.caminho });
  return { painel, pasta, get: (url) => painel.tratar({ metodo: "GET", url }) };
}

/** Painel sobre uma pasta que não existe. */
export function painelSemPasta(caminho: string): PainelDeTeste {
  const painel = criarPainel({ pasta: caminho });
  return { painel, pasta: undefined as unknown as PastaTemporaria, get: (url) => painel.tratar({ metodo: "GET", url }) };
}
