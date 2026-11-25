import type { TotaisDebitos } from "../nucleo/debitos.js";
import type { Totais } from "../nucleo/saldo.js";
import type { Visao } from "../nucleo/visao.js";
import { arquivos, dataHora, reais, TEXTO_SO_DOS_ARQUIVOS } from "./formatos.js";
import { html, juntar, type Cru } from "./html.js";
import { layout } from "./layout.js";
import { textoSemCreditos, textoSemDebitos } from "./vazio.js";

function dadosPorServico(visao: Visao): Cru {
  const linhas: Array<[string, typeof visao.servicos.creditos]> = [
    ["Créditos", visao.servicos.creditos],
    ["Recolhimentos", visao.servicos.recolhimentos],
    ["Débitos", visao.servicos.debitos],
  ];
  const trs = linhas.map(([nome, s]) => {
    const intervalo = s.atualizacaoMinima === undefined ? "—" : `${dataHora(s.atualizacaoMinima)} a ${dataHora(s.atualizacaoMaxima)}`;
    return html`<tr><th scope="row">${nome}</th><td>${arquivos(s.arquivos)}</td><td>${dataHora(s.geradoEmMaisRecente)}</td><td>${intervalo}</td></tr>`;
  });
  return html`<section class="bloco">
<h2>Data dos dados</h2>
<table><thead><tr><th>Serviço</th><th>Arquivos lidos</th><th>Gerado em (mais recente)</th><th>Atualização dos itens</th></tr></thead>
<tbody>${juntar(trs)}</tbody></table>
<p class="nota">${TEXTO_SO_DOS_ARQUIVOS}</p>
</section>`;
}

function tabelaCredito(visao: Visao): Cru {
  const t = visao.totais!;
  const linha = (nome: string, v: Totais, classe = "") =>
    html`<tr class="${classe}"><th scope="row">${nome}</th><td class="valor">${reais(v.aApropriar)}</td><td class="valor">${reais(v.apropriado)}</td><td class="valor">${reais(v.utilizado)}</td><td class="valor">${reais(v.saldoCredor)}</td></tr>`;
  return html`<section class="bloco">
<h2>Crédito de CBS (compras)</h2>
<p class="nota">Quatro totais separados. Cada um é a soma do campo como veio no arquivo; nenhum é calculado a partir dos outros.</p>
<table><thead><tr><th>Período</th>
<th>A apropriar (pendente)<br><code>aApropriar</code></th>
<th>Apropriado<br><code>apropriado</code></th>
<th>Já utilizado<br><code>utilizado</code></th>
<th>Saldo credor não utilizado<br><code>saldoCredor</code></th></tr></thead>
<tbody>${juntar(t.porPeriodo.map((p) => linha(p.pa, p.totais)))}${linha("Geral", t.geral, "geral")}</tbody></table>
</section>`;
}

function tabelaDebito(visao: Visao): Cru {
  const t = visao.totaisDebitos;
  const intro = html`<p class="nota">Débitos das vendas, mostrados à parte. O painel não calcula saldo líquido entre crédito e débito.</p>`;
  if (t === undefined) return html`<section class="bloco"><h2>Débitos de CBS (vendas)</h2>${intro}${textoSemDebitos(visao)}</section>`;
  const linha = (nome: string, v: TotaisDebitos, classe = "") =>
    html`<tr class="${classe}"><th scope="row">${nome}</th><td class="valor">${reais(v.apurado)}</td><td class="valor">${reais(v.extinto)}</td><td class="valor">${reais(v.saldoDevedor)}</td></tr>`;
  return html`<section class="bloco">
<h2>Débitos de CBS (vendas)</h2>
${intro}
<table><thead><tr><th>Período</th>
<th>Apurado<br><code>apurado</code></th>
<th>Extinto<br><code>extinto</code></th>
<th>Saldo devedor<br><code>saldoDevedor</code></th></tr></thead>
<tbody>${juntar(t.porPeriodo.map((p) => linha(p.pa, p.totais)))}${linha("Geral", t.geral, "geral")}</tbody></table>
</section>`;
}

export function paginaSaldo(visao: Visao): string {
  const corpo = visao.vazio
    ? textoSemCreditos(visao)
    : tabelaCredito(visao);
  return layout(
    visao,
    "Saldo de CBS",
    "/",
    html`<p class="so-cbs">Só CBS: o IBS não está na fonte de dados.</p>
${dadosPorServico(visao)}
${corpo}
${tabelaDebito(visao)}`,
  );
}
