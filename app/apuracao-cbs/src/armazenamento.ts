import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { ErroUso } from "./erros.js";
import { buscarServico, type NomeServico } from "./servicos.js";

const PADRAO_NOME = /^(\d{8}T\d{6}Z)_([a-z]+)_(.+?)(?:_(\d+))?\.json$/;

function carimboUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/**
 * Grava os bytes exatamente como chegaram, em .local/arquivos, sem sobrescrever.
 * Devolve o caminho do arquivo.
 */
export function guardar(opcoes: {
  pastaLocal: string;
  servico: NomeServico;
  tiquete: string;
  bytes: Uint8Array;
  agora: Date;
}): string {
  const pasta = join(opcoes.pastaLocal, "arquivos");
  mkdirSync(pasta, { recursive: true });
  const tiquete = opcoes.tiquete.replace(/[^A-Za-z0-9._-]/g, "_");
  const base = `${carimboUtc(opcoes.agora)}_${opcoes.servico}_${tiquete}`;
  for (let n = 1; ; n += 1) {
    const caminho = join(pasta, n === 1 ? `${base}.json` : `${base}_${n}.json`);
    if (existsSync(caminho)) continue;
    try {
      writeFileSync(caminho, opcoes.bytes, { flag: "wx" });
      return caminho;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "EEXIST") continue;
      throw e;
    }
  }
}

export interface ArquivoGuardado {
  servico: NomeServico;
  caminho: string;
  bytes: Uint8Array;
}

/** Lê um arquivo guardado e identifica a consulta pelo nome. */
export function abrirGuardado(caminho: string): ArquivoGuardado {
  const casa = PADRAO_NOME.exec(basename(caminho));
  const servico = casa ? buscarServico(casa[2]) : undefined;
  if (!servico) {
    throw new ErroUso(
      "Nome de arquivo fora do padrão. Use um arquivo guardado por esta aplicação, " +
        "com o nome AAAAMMDDTHHMMSSZ_<servico>_<tiquete>.json (servico: creditos, recolhimentos, pagamentos ou debitos).",
    );
  }
  if (!existsSync(caminho)) throw new ErroUso("Arquivo não encontrado.");
  return { servico: servico.nome, caminho, bytes: new Uint8Array(readFileSync(caminho)) };
}
