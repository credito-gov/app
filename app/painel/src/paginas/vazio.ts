// Textos de "não há dados": só atribuem o vazio à Receita quando nenhum arquivo ficou de fora.
import type { Visao } from "../nucleo/visao.js";
import { html, type Cru } from "./html.js";

function quantosNaoEntraram(n: number, servico: string): string {
  return n === 1
    ? `Há 1 arquivo de ${servico} que não entrou nos totais (recusado ou ignorado)`
    : `Há ${n} arquivos de ${servico} que não entraram nos totais (recusados ou ignorados)`;
}

export function textoSemCreditos(visao: Visao): Cru {
  const n = visao.naoEntraram.creditos;
  if (n === 0) return html`<p class="vazio">A Receita não devolveu créditos nos arquivos lidos.</p>`;
  return html`<p class="vazio">${quantosNaoEntraram(n, "créditos")}; por isso não há créditos para mostrar. <a href="/arquivos">Ver os arquivos</a></p>`;
}

export function textoSemDebitos(visao: Visao): Cru {
  const n = visao.naoEntraram.debitos;
  if (n === 0) return html`<p class="vazio">Nenhum débito nos arquivos lidos.</p>`;
  return html`<p class="vazio">${quantosNaoEntraram(n, "débitos")}; por isso não há débitos para mostrar. <a href="/arquivos">Ver os arquivos</a></p>`;
}
