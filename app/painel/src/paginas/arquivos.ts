import type { ArquivoLido } from "../nucleo/arquivos.js";
import type { Visao } from "../nucleo/visao.js";
import { dataHora, raizFormatada, TEXTO_SO_DOS_ARQUIVOS } from "./formatos.js";
import { html, juntar, type Cru } from "./html.js";
import { blocoConflito } from "./erro.js";
import { layout } from "./layout.js";

const SERVICOS: Record<string, string> = { creditos: "créditos", recolhimentos: "recolhimentos", debitos: "débitos", pagamentos: "pagamentos" };

function situacao(a: ArquivoLido): string {
  switch (a.situacao) {
    case "aceito":
      return "aceito";
    case "aceito-com-divergencia":
      return "aceito com divergência conhecida do schema 1.0.0";
    case "recusado":
      return "recusado";
    case "ignorado":
      return `ignorado: ${a.motivos[0] ?? ""}`;
  }
}

function linha(a: ArquivoLido): Cru {
  const motivos = a.situacao === "ignorado" ? [] : a.motivos;
  return html`<tr class="situacao-${a.situacao}">
<td><code>${a.nome}</code></td>
<td>${a.servico === null ? "—" : (SERVICOS[a.servico] ?? a.servico)}</td>
<td>${situacao(a)}</td>
<td>${a.raiz === undefined || a.raiz === "" ? "—" : raizFormatada(a.raiz)}</td>
<td class="valor">${a.quantidade ?? "—"}</td>
<td>${dataHora(a.geradoEm)}</td>
<td>${motivos.length === 0 ? "" : html`<ul>${juntar(motivos.map((m) => html`<li>${m}</li>`))}</ul>`}</td>
</tr>`;
}

export function paginaArquivos(visao: Visao): string {
  if (!visao.legivel) {
    return layout(visao, "Arquivos", "/arquivos", html`<div class="erro"><h2>Pasta ilegível</h2><p>${visao.erro ?? "A pasta não pôde ser lida."}</p></div>`);
  }
  const s = visao.substituidas;
  const conteudo = html`${visao.empresa.conflito ? blocoConflito(visao) : ""}
<section class="bloco">
<p class="nota">Pasta lida: <code>${visao.pasta}</code></p>
<p class="nota">${TEXTO_SO_DOS_ARQUIVOS}</p>
${visao.arquivos.length === 0 ? html`<p class="vazio">Nenhum arquivo .json na pasta.</p>` : html`<table>
<thead><tr><th>Arquivo</th><th>Serviço</th><th>Situação</th><th>Raiz do CNPJ</th><th>Itens</th><th>Gerado em</th><th>Motivo</th></tr></thead>
<tbody>${juntar(visao.arquivos.map(linha))}</tbody></table>`}
</section>
<section class="bloco">
<h2>Versões substituídas na consolidação</h2>
<p class="nota">Quando o mesmo item aparece em mais de um arquivo, vale a versão mais recente; as outras são contadas aqui.</p>
<ul><li>Créditos: ${s.creditos}</li><li>Recolhimentos: ${s.recolhimentos}</li><li>Débitos: ${s.debitos}</li></ul>
</section>`;
  return layout(visao, "Arquivos", "/arquivos", conteudo);
}
