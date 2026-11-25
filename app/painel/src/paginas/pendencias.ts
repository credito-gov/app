import { exibirData } from "../nucleo/datas.js";
import type { GrupoPendencia } from "../nucleo/pendencias.js";
import { textoDocumento } from "../nucleo/tabelas.js";
import type { Visao } from "../nucleo/visao.js";
import { reais } from "./formatos.js";
import { html, juntar, type Cru } from "./html.js";
import { layout } from "./layout.js";
import { linkNota } from "./links.js";
import { textoSemCreditos } from "./vazio.js";

export const TEXTO_PENDENCIAS =
  "A Receita informa o valor a apropriar de cada nota, mas não informa o motivo. Esta tela não indica que o emitente deixou de recolher.";

function linhaGrupo(g: GrupoPendencia): Cru {
  return html`<tr><td><a href="/pendencias?grupo=${g.id}">${g.rotulo}</a></td><td>${juntar(g.rotulos, "<br>")}</td><td class="valor">${g.quantidade}</td><td class="valor">${reais(g.total)}</td></tr>`;
}

function resumo(visao: Visao): Cru {
  const p = visao.pendencias!;
  const igualdade = p.confere
    ? html`<p>A soma dos grupos é igual ao total a apropriar do saldo.</p>`
    : html`<p class="aviso-busca">A soma dos grupos difere do total a apropriar do saldo (${reais(p.somaGrupos)}).</p>`;
  const percentual =
    p.percentualNaoIdentificado === "—"
      ? html`<p>Não há valor a apropriar para distribuir entre emitentes.</p>`
      : html`<p><strong>${p.percentualNaoIdentificado}</strong> do total a apropriar está em emitente não identificado.</p>`;
  return html`<p>Total a apropriar: <strong>${reais(p.totalAApropriar)}</strong></p>${igualdade}${percentual}`;
}

export function paginaPendencias(visao: Visao, parametros: URLSearchParams): string | undefined {
  if (visao.vazio) return layout(visao, "Pendências", "/pendencias", textoSemCreditos(visao));
  const p = visao.pendencias!;
  const grupoId = parametros.get("grupo");

  if (grupoId !== null) {
    const grupo = grupoId === "negativas" ? { id: "negativas", rotulo: "notas com valor a apropriar negativo", ...p.negativas } : p.grupos.find((g) => g.id === grupoId);
    if (grupo === undefined) return undefined;
    const linhas = grupo.notas.map(
      (n) => html`<tr><td>${linkNota(n)}</td><td>${textoDocumento(n.documento)}</td><td>${n.pa}</td><td>${exibirData(n.emissao)}</td><td class="valor">${reais(n.valores["cbs.apropriacao.aApropriar"]!)}</td></tr>`,
    );
    return layout(
      visao,
      `Pendências: ${grupo.rotulo}`,
      "/pendencias",
      html`<p><a href="/pendencias">« Voltar aos grupos</a></p>
<p class="nota">${TEXTO_PENDENCIAS}</p>
<section class="bloco"><p><strong>${grupo.quantidade} notas</strong>, total a apropriar <strong>${reais(grupo.total)}</strong></p>
<table><thead><tr><th>Chave</th><th>Tipo de documento</th><th>Período</th><th>Emissão</th><th>A apropriar</th></tr></thead>
<tbody>${juntar(linhas)}</tbody></table></section>`,
    );
  }

  const negativas =
    p.negativas.quantidade === 0
      ? ""
      : html`<tr><td><a href="/pendencias?grupo=negativas">notas com valor a apropriar negativo</a></td><td></td><td class="valor">${p.negativas.quantidade}</td><td class="valor">${reais(p.negativas.total)}</td></tr>`;
  return layout(
    visao,
    "Pendências",
    "/pendencias",
    html`<p class="nota">${TEXTO_PENDENCIAS}</p>
<section class="bloco">
<table><thead><tr><th>Emitente</th><th>Como foi identificado</th><th>Notas</th><th>Total a apropriar</th></tr></thead>
<tbody>${juntar(p.grupos.map(linhaGrupo))}${negativas}</tbody></table>
</section>
<section class="bloco">${resumo(visao)}</section>`,
  );
}
