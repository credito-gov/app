// Pastas temporárias dos testes, no diretório temporário do sistema, apagadas ao fim.
import { cp, mkdtemp, readFile, rm, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface PastaTemporaria {
  caminho: string;
  escrever(nome: string, conteudo: string | Uint8Array): Promise<void>;
  /** Copia um arquivo ou uma pasta para dentro da pasta temporária. */
  copiarDe(origem: string, nome?: string): Promise<void>;
  /** Move a data de modificação para a frente, para simular arquivo alterado. */
  tocar(nome: string, segundos?: number): Promise<void>;
  ler(nome: string): Promise<Uint8Array>;
  limpar(): Promise<void>;
}

export async function pastaTemporaria(): Promise<PastaTemporaria> {
  const caminho = await mkdtemp(join(tmpdir(), "painel-teste-"));
  return {
    caminho,
    escrever: (nome, conteudo) => writeFile(join(caminho, nome), conteudo),
    copiarDe: (origem, nome) => cp(origem, join(caminho, nome ?? origem.split(/[\\/]/).pop() ?? origem), { recursive: true }),
    tocar: async (nome, segundos = 5) => {
      const depois = new Date(Date.now() + segundos * 1000);
      await utimes(join(caminho, nome), depois, depois);
    },
    ler: async (nome) => new Uint8Array(await readFile(join(caminho, nome))),
    limpar: () => rm(caminho, { recursive: true, force: true }),
  };
}

/** Nome de arquivo no padrão da apuracao-cbs. */
export function nomeArquivo(servico: string, tiquete: string, instante = "20261120T101530Z"): string {
  return `${instante}_${servico}_${tiquete}.json`;
}
