// Montagem de HTML com escape automático. Esta é a única função de escape do painel (DT-10):
// todo texto interpolado passa por `esc`, exceto o que foi marcado como `Cru` pelo próprio código.

/** Trecho de HTML já montado por este módulo, que não deve ser escapado de novo. */
export class Cru {
  readonly texto: string;
  constructor(texto: string) {
    this.texto = texto;
  }
}

const SUBSTITUICOES: Readonly<Record<string, string>> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escapa o texto para uso em conteúdo ou em atributo entre aspas. */
export function esc(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => SUBSTITUICOES[c]);
}

function paraTexto(valor: unknown): string {
  if (valor instanceof Cru) return valor.texto;
  if (Array.isArray(valor)) return valor.map(paraTexto).join("");
  if (valor === undefined || valor === null || valor === false) return "";
  return esc(String(valor));
}

/** Template com escape automático: `html\`<p>${texto}</p>\``. */
export function html(partes: TemplateStringsArray, ...valores: unknown[]): Cru {
  let saida = partes[0];
  valores.forEach((v, i) => {
    saida += paraTexto(v) + partes[i + 1];
  });
  return new Cru(saida);
}

/** Junta trechos de HTML, escapando o que não for Cru. */
export function juntar(itens: unknown[], separador = ""): Cru {
  return new Cru(itens.map(paraTexto).join(separador));
}

export const vazio = new Cru("");
