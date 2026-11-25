import { exibirData, exibirDia } from "../nucleo/datas.js";
import { formatarCnpj, formatarEmitente, type Emitente } from "../nucleo/emitente.js";
import { textoDocumento, textoOrigem } from "../nucleo/tabelas.js";
import type { NotaCredito } from "../nucleo/tipos.js";
import type { Visao } from "../nucleo/visao.js";
import { reais } from "./formatos.js";
import { html, juntar, type Cru } from "./html.js";
import { layout } from "./layout.js";

/** Campos monetários do crédito, com o nome oficial e o caminho no arquivo (página credito.html). */
const CAMPOS: Array<[string, string]> = [
  ["apurado", "cbs.apurado"],
  ["excedente", "cbs.excedente"],
  ["inapropriavel", "cbs.apropriacao.inapropriavel"],
  ["suspenso", "cbs.apropriacao.suspenso"],
  ["prescrito", "cbs.apropriacao.prescrito"],
  ["aApropriar", "cbs.apropriacao.aApropriar"],
  ["apropriado", "cbs.apropriacao.apropriado"],
  ["inutilizavel", "cbs.apropriacao.utilizacao.inutilizavel"],
  ["utilizado", "cbs.apropriacao.utilizacao.utilizado"],
  ["restabelecido", "cbs.apropriacao.utilizacao.restabelecido"],
  ["saldoCredor", "cbs.apropriacao.utilizacao.naoUtilizado.saldoCredor"],
  ["pedidoRessarcimento", "cbs.apropriacao.utilizacao.naoUtilizado.pedidoRessarcimento"],
];

const AUSENTE = html`<span class="ausente">não veio no arquivo</span>`;

function campo(nome: string, valor: unknown): Cru {
  return html`<dt><code>${nome}</code></dt><dd>${valor}</dd>`;
}

function textoEmitente(e: Emitente): Cru {
  if (e.tipo === "nao-identificado") return html`emitente não identificado${e.motivo === undefined ? "" : html` (${e.motivo})`}`;
  const proprio = e.tipo === "propria-empresa" ? html` <strong>(emitida pela própria empresa)</strong>` : "";
  return html`${formatarEmitente(e)}${proprio} <span class="nota">${e.rotulo}</span>`;
}

function blocoEmitente(n: NotaCredito): Cru {
  const r = n.emitente;
  const comparacao =
    r.recolhimento === undefined
      ? ""
      : html`${r.divergente ? html`<p class="aviso-busca">Recolhimento e chave divergem. Vale o do recolhimento.</p>` : ""}<ul>
<li>Pelo recolhimento: ${textoEmitente(r.recolhimento)}</li>
<li>Pela chave: ${textoEmitente(r.chave)}</li></ul>`;
  return html`<section class="bloco"><h2>Emitente</h2><p>${textoEmitente(r.emitente)}</p>${comparacao}</section>`;
}

function blocoRecolhimentos(n: NotaCredito, visao: Visao): Cru {
  const itens = visao.recolhimentos.filter((r) => r.chaveDFE === n.chave);
  if (itens.length === 0) return html`<section class="bloco"><h2>Recolhimentos ligados</h2><p class="nota">Nenhum recolhimento ligado a esta nota.</p></section>`;
  const linhas = itens.map(
    (i) => html`<tr><td>${exibirDia(i.dataArrecadacao)}</td><td><code>${i.numeroDARF}</code></td><td>${i.pa}</td><td>${exibirDia(i.vencimento)}</td><td>${formatarCnpj(i.niFornecedor)}</td>
<td class="valor">${reais(i.principal)}</td><td class="valor">${reais(i.multa)}</td><td class="valor">${reais(i.juros)}</td><td class="valor">${reais(i.total)}</td></tr>`,
  );
  return html`<section class="bloco"><h2>Recolhimentos ligados pela chave</h2>
<table><thead><tr><th>Data de arrecadação</th><th>DARF</th><th>Período</th><th>Vencimento</th><th>Fornecedor</th><th>Principal</th><th>Multa</th><th>Juros</th><th>Total</th></tr></thead>
<tbody>${juntar(linhas)}</tbody></table></section>`;
}

/** Devolve undefined se os parâmetros não acham nota (a rota responde 404). */
export function paginaDetalhe(visao: Visao, parametros: URLSearchParams): string | undefined {
  const pa = parametros.get("pa");
  const documento = parametros.get("documento");
  const origem = parametros.get("origem");
  const chave = parametros.get("chave");
  if (pa === null || documento === null || origem === null || chave === null) return undefined;
  const nota = visao.notas.find((n) => n.pa === pa && String(n.documento) === documento && String(n.origem) === origem && n.chave === chave);
  if (nota === undefined) return undefined;

  const aparece = visao.chavesEmDebitos.has(nota.chave)
    ? html`<p class="nota">Esta chave também aparece nos débitos (vendas). O painel não compensa um lado com o outro.</p>`
    : "";
  const campos = CAMPOS.map(([nome, caminho]) => {
    const v = nota.valores[caminho];
    return campo(nome, v === undefined ? AUSENTE : reais(v));
  });

  return layout(
    visao,
    "Detalhe da nota",
    "/creditos",
    html`<p><a href="/creditos">« Voltar à lista de créditos</a></p>
<section class="bloco"><h2>Crédito</h2>${aparece}
<dl class="campos">
${campo("pa", nota.pa)}
${campo("origem", textoOrigem(nota.origem))}
${campo("documento", textoDocumento(nota.documento))}
${campo("chave", html`<span class="chave">${nota.chave}</span>`)}
${campo("emissao", exibirData(nota.emissao))}
${campo("registro", exibirData(nota.registro))}
${campo("atualizacao", exibirData(nota.atualizacao))}
${juntar(campos)}
</dl></section>
${blocoEmitente(nota)}
${blocoRecolhimentos(nota, visao)}`,
  );
}
