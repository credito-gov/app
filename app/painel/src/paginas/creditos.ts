import type Big from "big.js";
import { exibirData } from "../nucleo/datas.js";
import { compararPeriodos } from "../nucleo/saldo.js";
import { lerConsulta, listarCreditos, type ConsultaLista, type LinhaLista } from "../nucleo/lista.js";
import { textoDocumento, textoOrigem } from "../nucleo/tabelas.js";
import type { Visao } from "../nucleo/visao.js";
import { reais } from "./formatos.js";
import { html, juntar, type Cru } from "./html.js";
import { layout } from "./layout.js";
import { textoSemCreditos } from "./vazio.js";
import { celulaEmitente, linkNota } from "./links.js";

/** Endereço da lista com os filtros da consulta; só o que difere do padrão entra na URL. */
function urlLista(c: ConsultaLista, pagina: number): string {
  const p = new URLSearchParams();
  if (c.pa !== undefined) p.set("pa", c.pa);
  if (c.documento !== undefined) p.set("documento", String(c.documento));
  if (c.emitente !== undefined) p.set("emitente", c.emitente);
  if (c.pendente) p.set("pendente", "1");
  if (c.busca !== undefined) p.set("busca", c.busca);
  if (c.ordem !== "emissao") p.set("ordem", c.ordem);
  if (c.sentido !== "desc") p.set("sentido", c.sentido);
  if (pagina > 1) p.set("pagina", String(pagina));
  const consulta = p.toString();
  return consulta === "" ? "/creditos" : `/creditos?${consulta}`;
}

function formulario(visao: Visao, c: ConsultaLista): Cru {
  const periodos = [...new Set(visao.notas.map((n) => n.pa))].sort(compararPeriodos);
  const documentos = [...new Set(visao.notas.map((n) => n.documento))].sort((a, b) => a - b);
  const opcao = (valor: string, texto: string, atual: string | undefined) => html`<option value="${valor}"${atual === valor ? html` selected` : ""}>${texto}</option>`;
  return html`<form class="filtros" method="get" action="/creditos">
<label>Período<select name="pa">${opcao("", "todos", c.pa ?? "")}${juntar(periodos.map((pa) => opcao(pa, pa, c.pa)))}</select></label>
<label>Tipo de documento<select name="documento">${opcao("", "todos", c.documento === undefined ? "" : String(c.documento))}${juntar(documentos.map((d) => opcao(String(d), textoDocumento(d), c.documento === undefined ? undefined : String(c.documento))))}</select></label>
<label>Emitente (CNPJ, raiz, nao-identificado ou propria-empresa)<input type="text" name="emitente" value="${c.emitente ?? ""}"></label>
<label>Trecho da chave<input type="text" name="busca" value="${c.busca ?? ""}"></label>
<label>Ordenar por<select name="ordem">${opcao("emissao", "Data de emissão", c.ordem)}${opcao("aApropriar", "Valor a apropriar", c.ordem)}</select></label>
<label>Sentido<select name="sentido">${opcao("desc", "Decrescente", c.sentido)}${opcao("asc", "Crescente", c.sentido)}</select></label>
<label class="marcar"><input type="checkbox" name="pendente" value="1"${c.pendente ? html` checked` : ""}> Só com valor a apropriar</label>
<button type="submit">Filtrar</button>
</form>`;
}

const valor = (v: Big | undefined): string => (v === undefined ? "—" : reais(v));

function linha(n: LinhaLista): Cru {
  const v = n.valores;
  return html`<tr class="linha-nota${n.marcaOrigem === undefined ? "" : " origem-especial"}">
<td>${n.pa}</td>
<td>${textoDocumento(n.documento)}</td>
<td>${linkNota(n)}</td>
<td>${exibirData(n.emissao)}</td>
<td>${textoOrigem(n.origem)}${n.marcaOrigem === undefined ? "" : html`<br><span class="marca-origem">${n.marcaOrigem}</span>`}</td>
<td>${celulaEmitente(n.emitente.emitente)}</td>
<td class="valor">${valor(v["cbs.apurado"])}</td>
<td class="valor">${valor(v["cbs.apropriacao.aApropriar"])}</td>
<td class="valor">${valor(v["cbs.apropriacao.apropriado"])}</td>
<td class="valor">${valor(v["cbs.apropriacao.utilizacao.utilizado"])}</td>
</tr>`;
}

export function paginaCreditos(visao: Visao, parametros: URLSearchParams): string {
  if (visao.vazio) return layout(visao, "Créditos", "/creditos", textoSemCreditos(visao));
  const { consulta, avisos } = lerConsulta(parametros);
  const r = listarCreditos(visao.notas, consulta);
  const anterior = r.pagina > 1 ? html`<a href="${urlLista(consulta, r.pagina - 1)}">« Anterior</a>` : "";
  const proxima = r.pagina < r.totalPaginas ? html`<a href="${urlLista(consulta, r.pagina + 1)}">Próxima »</a>` : "";
  const navegacao = html`<div class="paginacao">${anterior}<span>Página ${r.pagina} de ${r.totalPaginas}</span>${proxima}</div>`;

  return layout(
    visao,
    "Créditos",
    "/creditos",
    html`${juntar(avisos.map((a) => html`<p class="aviso-busca">${a}</p>`))}
${formulario(visao, consulta)}
<section class="bloco">
<p class="resumo"><strong>${r.totalNotas} notas</strong> no filtro. Total a apropriar do filtro inteiro: <strong>${reais(r.totalAApropriar)}</strong></p>
${navegacao}
<table>
<thead><tr><th>Período</th><th>Tipo de documento</th><th>Chave</th><th>Emissão</th><th>Origem</th><th>Emitente</th><th>Apurado</th><th>A apropriar</th><th>Apropriado</th><th>Utilizado</th></tr></thead>
<tbody>${juntar(r.linhas.map(linha))}</tbody>
</table>
${navegacao}
</section>`,
  );
}
