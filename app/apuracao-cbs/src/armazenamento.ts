import { constants, copyFileSync, existsSync, linkSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { ErroGravacao, ErroUso, codigoDoErro } from "./erros.js";
import { buscarServico, type NomeServico } from "./servicos.js";

const PADRAO_NOME = /^(\d{8}T\d{6}Z)_([a-z]+)_(.+?)(?:_(\d+))?\.json$/;

function carimboUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/**
 * Publica o nome final sem nunca sobrescrever. Devolve false se o nome já existe.
 * Tenta hard link; se o volume não suporta, copia com COPYFILE_EXCL e remove o destino incompleto que ela criou.
 */
function publicar(parcial: string, caminho: string): boolean {
  try {
    linkSync(parcial, caminho);
    return true;
  } catch (e) {
    if (codigoDoErro(e) === "EEXIST") return false;
  }
  try {
    copyFileSync(parcial, caminho, constants.COPYFILE_EXCL);
    return true;
  } catch (e) {
    if (codigoDoErro(e) === "EEXIST") return false;
    try {
      rmSync(caminho, { force: true });
    } catch {
      // o erro principal é o da cópia
    }
    throw e;
  }
}

/**
 * Grava os bytes exatamente como chegaram, em .local/arquivos, sem sobrescrever.
 * Escreve num nome temporário (.parcial) e só publica o nome final (hard link ou, sem suporte, cópia
 * exclusiva) depois de completo: o nome canônico nunca aponta para um arquivo truncado. Devolve o caminho do arquivo; em falha lança ErroGravacao.
 */
export function guardar(opcoes: {
  pastaLocal: string;
  servico: NomeServico;
  tiquete: string;
  bytes: Uint8Array;
  agora: Date;
}): string {
  const pasta = join(opcoes.pastaLocal, "arquivos");
  const tiquete = opcoes.tiquete.replace(/[^A-Za-z0-9._-]/g, "_");
  const base = `${carimboUtc(opcoes.agora)}_${opcoes.servico}_${tiquete}`;
  let caminho = join(pasta, `${base}.json`);
  try {
    mkdirSync(pasta, { recursive: true });
    for (let n = 1; ; n += 1) {
      caminho = join(pasta, n === 1 ? `${base}.json` : `${base}_${n}.json`);
      if (!existsSync(caminho)) break;
    }
  } catch (e) {
    throw new ErroGravacao(caminho, codigoDoErro(e));
  }
  let parcial = `${caminho}.parcial`;
  try {
    for (let n = 2; ; n += 1) {
      writeFileSync(parcial, opcoes.bytes);
      if (publicar(parcial, caminho)) break;
      // Outro arquivo ocupou o nome entre a checagem e a publicação: tenta o próximo sufixo.
      rmSync(parcial, { force: true });
      caminho = join(pasta, `${base}_${n}.json`);
      parcial = `${caminho}.parcial`;
    }
    // Já publicado: remover o .parcial é melhor esforço (antivírus pode segurar o arquivo no Windows).
    try {
      rmSync(parcial, { force: true });
    } catch {
      // sobra do .parcial não invalida o arquivo publicado
    }
    return caminho;
  } catch (e) {
    try {
      rmSync(parcial, { force: true });
    } catch {
      // sobra do .parcial não muda o erro principal
    }
    throw new ErroGravacao(caminho, codigoDoErro(e));
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
