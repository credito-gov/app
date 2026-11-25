import { compararInstantes } from "../nucleo/datas.js";
import type { Visao } from "../nucleo/visao.js";
import { dataHora, raizFormatada } from "./formatos.js";
import { Cru, html, juntar } from "./html.js";

const NAVEGACAO: Array<[string, string]> = [
  ["/", "Saldo"],
  ["/creditos", "Créditos"],
  ["/pendencias", "Pendências"],
  ["/arquivos", "Arquivos"],
];

function dataDosDados(visao: Visao): string | undefined {
  let maisRecente: string | undefined;
  for (const s of [visao.servicos.creditos, visao.servicos.recolhimentos, visao.servicos.debitos]) {
    if (s.geradoEmMaisRecente !== undefined && (maisRecente === undefined || compararInstantes(s.geradoEmMaisRecente, maisRecente) > 0)) maisRecente = s.geradoEmMaisRecente;
  }
  return maisRecente;
}

/** "1 arquivo recusado" / "2 arquivos recusados". */
function contagem(n: number, singular: string, plural: string): string {
  return n === 1 ? `1 arquivo ${singular}` : `${n} arquivos ${plural}`;
}

/** Aviso único, com as contagens separadas: recusado não entra nos totais; divergência conhecida entra. */
function aviso(visao: Visao): Cru {
  const conta = (situacao: string) => visao.arquivos.filter((a) => a.situacao === situacao).length;
  const recusados = conta("recusado");
  const ignorados = conta("ignorado");
  const divergentes = conta("aceito-com-divergencia");
  const partes: string[] = [];
  if (recusados > 0) partes.push(`${contagem(recusados, "recusado", "recusados")} (${recusados === 1 ? "não entra" : "não entram"} nos totais)`);
  if (ignorados > 0) partes.push(contagem(ignorados, "ignorado", "ignorados"));
  if (divergentes > 0) partes.push(`${contagem(divergentes, "aceito", "aceitos")} com divergência conhecida do schema 1.0.0`);
  if (partes.length === 0) return new Cru("");
  return html`<div class="aviso-arquivos">Atenção: ${partes.join("; ")}. <a href="/arquivos">Ver os arquivos</a></div>`;
}

/** Página completa com o cabeçalho comum a todas as rotas. */
export function layout(visao: Visao, titulo: string, ativo: string, conteudo: Cru): string {
  const data = dataDosDados(visao);
  const raiz = visao.empresa.raiz;
  const links = NAVEGACAO.map(([href, nome]) => html`<a href="${href}"${href === ativo ? new Cru(' class="ativo"') : ""}>${nome}</a>`);
  return html`<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titulo} · Painel de crédito de CBS</title>
<link rel="stylesheet" href="/estilo.css">
</head>
<body>
<header class="topo">
<div class="marca">Painel de crédito de CBS</div>
<nav>${juntar(links)}</nav>
<div class="contexto">${raiz === undefined ? "" : html`<span>Empresa (raiz do CNPJ): <strong>${raizFormatada(raiz)}</strong></span>`}${data === undefined ? "" : html`<span>Dados gerados em ${dataHora(data)}</span>`}</div>
</header>
${aviso(visao)}
<main>
<h1>${titulo}</h1>
${conteudo}
</main>
</body>
</html>
`.texto;
}
