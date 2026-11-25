import type { Visao } from "../nucleo/visao.js";
import { raizFormatada } from "./formatos.js";
import { html, juntar, type Cru } from "./html.js";
import { layout } from "./layout.js";

/** Bloco do conflito de empresas (CA-3): os arquivos de cada raiz, sem nenhum valor. */
export function blocoConflito(visao: Visao): Cru {
  const grupos = visao.empresa.grupos.map(
    (g) => html`<section class="grupo-empresa"><h3>Raiz do CNPJ ${raizFormatada(g.raiz)}</h3><ul>${juntar(g.arquivos.map((nome) => html`<li><code>${nome}</code></li>`))}</ul></section>`,
  );
  return html`<div class="erro">
<h2>Arquivos de mais de uma empresa</h2>
<p>O painel não mistura empresas e não mostra nenhum valor. Tire da pasta os arquivos de outra empresa.</p>
${juntar(grupos)}
</div>`;
}

/** Orientação conforme o código do erro: caminho errado e permissão pedem coisas diferentes. */
function orientacaoPasta(codigo: string | undefined): Cru {
  if (codigo === "EACCES" || codigo === "EPERM") {
    return html`<p>O sistema negou o acesso (${codigo}). Confira as permissões da pasta para o usuário que roda o painel.</p>`;
  }
  if (codigo === undefined || codigo === "ENOENT" || codigo === "ENOTDIR") {
    return html`<p>Confira o caminho passado em <code>--pasta</code>. O painel não cria a pasta.</p>`;
  }
  return html`<p>Confira se a pasta está acessível e não está em uso por outro programa (${codigo}).</p>`;
}

function blocoPasta(visao: Visao): Cru {
  return html`<div class="erro"><h2>Pasta ilegível</h2><p>${visao.erro ?? "A pasta não pôde ser lida."}</p>${orientacaoPasta(visao.codigoErro)}</div>`;
}

/** Página de erro para as rotas de valores: pasta ilegível ou conflito de empresas. Devolve null se não há erro. */
export function paginaDeErro(visao: Visao, titulo: string, ativo: string): string | null {
  if (!visao.legivel) return layout(visao, titulo, ativo, blocoPasta(visao));
  if (visao.empresa.conflito) return layout(visao, titulo, ativo, blocoConflito(visao));
  return null;
}

export function paginaNaoEncontrada(visao: Visao): string {
  return layout(visao, "Página não encontrada", "", html`<p>Não há nada neste endereço. Use o menu acima.</p>`);
}
