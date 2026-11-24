import type { Nota } from "../nucleo/consolidacao.js";
import { formatarEmitente, type Emitente } from "../nucleo/emitente.js";
import { html, type Cru } from "./html.js";

/** Endereço do detalhe de uma nota; os valores são codificados na URL e escapados ao entrar na página. */
export function urlNota(n: Nota): string {
  const p = new URLSearchParams({ pa: n.pa, documento: String(n.documento), origem: String(n.origem), chave: n.chave });
  return `/creditos/nota?${p.toString()}`;
}

export function linkNota(n: Nota): Cru {
  return html`<a class="chave" href="${urlNota(n)}">${n.chave}</a>`;
}

/** Emitente para uma célula: número formatado e a fonte, ou o texto fixo de não identificado ou de própria empresa. */
export function celulaEmitente(e: Emitente): Cru {
  if (e.tipo === "nao-identificado") return html`<span class="nao-identificado">emitente não identificado</span>`;
  const quem = e.tipo === "propria-empresa" ? html`<strong>emitida pela própria empresa</strong><br>` : "";
  return html`${quem}${formatarEmitente(e)}<br><span class="nota">${e.rotulo}</span>`;
}
