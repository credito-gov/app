import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import type { EnvioEmail } from "./tipos.js";

/** Grava um .txt por mensagem na pasta, para o desenvolvedor abrir o link. */
export function criarEmailArquivo(pasta: string): EnvioEmail {
  return {
    async enviar({ para, assunto, texto }) {
      await mkdir(pasta, { recursive: true });
      const carimbo = new Date().toISOString().replace(/[:.]/g, "-");
      const nome = `${carimbo}-${randomUUID().slice(0, 8)}.txt`;
      const conteudo = `Para: ${para}\nAssunto: ${assunto}\n\n${texto}\n`;
      await writeFile(join(pasta, nome), conteudo, "utf8");
    },
  };
}
