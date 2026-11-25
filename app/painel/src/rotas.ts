// tratar(pedido) -> resposta, sem socket: a ligação com o HTTP fica em servidor.ts.
// Só lê: nenhuma rota recebe caminho de arquivo como parâmetro (CA-A3, DT-10).
import { criarCache, lerPasta } from "./nucleo/arquivos.js";
import { montarVisao, type Visao } from "./nucleo/visao.js";
import { paginaArquivos } from "./paginas/arquivos.js";
import { paginaDeErro, paginaNaoEncontrada } from "./paginas/erro.js";
import { ESTILO } from "./paginas/estilo.js";
import { paginaCreditos } from "./paginas/creditos.js";
import { paginaDetalhe } from "./paginas/detalhe.js";
import { paginaPendencias } from "./paginas/pendencias.js";
import { paginaSaldo } from "./paginas/saldo.js";

export interface Pedido {
  metodo: string;
  /** Caminho e query, como no pedido HTTP: `/creditos?pa=11/2026`. */
  url: string;
}

export interface Resposta {
  status: number;
  tipo: string;
  corpo: string;
}

export interface OpcoesPainel {
  pasta: string;
  lerArquivo?: (caminho: string) => Promise<Uint8Array>;
}

export interface Painel {
  tratar(pedido: Pedido): Promise<Resposta>;
}

const HTML = "text/html; charset=utf-8";

type Pagina = (visao: Visao, parametros: URLSearchParams) => string | undefined;

/** Rotas de valores: ficam atrás da guarda de pasta ilegível e de conflito de empresas. */
const PAGINAS: Record<string, { titulo: string; ativo: string; gerar?: Pagina }> = {
  "/": { titulo: "Saldo de CBS", ativo: "/", gerar: (v) => paginaSaldo(v) },
  "/creditos": { titulo: "Créditos", ativo: "/creditos", gerar: paginaCreditos },
  "/creditos/nota": { titulo: "Detalhe da nota", ativo: "/creditos", gerar: paginaDetalhe },
  "/pendencias": { titulo: "Pendências", ativo: "/pendencias", gerar: paginaPendencias },
};

export function criarPainel(opcoes: OpcoesPainel): Painel {
  const cache = criarCache();
  let memo: { assinatura: string; visao: Visao } | undefined;

  async function carregar(): Promise<Visao> {
    const lida = await lerPasta(opcoes.pasta, { cache, lerArquivo: opcoes.lerArquivo });
    const assinatura = `${lida.legivel}|${lida.arquivos.map((a) => `${a.nome}:${a.tamanho}:${a.mtimeMs}`).join(";")}`;
    if (memo?.assinatura === assinatura) return memo.visao;
    const visao = montarVisao(lida);
    // Falha passageira de leitura: a próxima requisição tem de tentar de novo.
    memo = lida.arquivos.some((a) => a.transitorio) ? undefined : { assinatura, visao };
    return visao;
  }

  return {
    async tratar(pedido) {
      const url = new URL(pedido.url, "http://127.0.0.1");
      const caminho = url.pathname;
      if (caminho === "/estilo.css") return { status: 200, tipo: "text/css; charset=utf-8", corpo: ESTILO };

      const visao = await carregar();
      if (caminho === "/arquivos") return { status: 200, tipo: HTML, corpo: paginaArquivos(visao) };

      const pagina = Object.hasOwn(PAGINAS, caminho) ? PAGINAS[caminho] : undefined;
      if (pagina === undefined) return { status: 404, tipo: HTML, corpo: paginaNaoEncontrada(visao) };

      const erro = paginaDeErro(visao, pagina.titulo, pagina.ativo);
      if (erro !== null) return { status: 200, tipo: HTML, corpo: erro };

      const corpo = pagina.gerar?.(visao, url.searchParams);
      if (corpo === undefined) return { status: 404, tipo: HTML, corpo: paginaNaoEncontrada(visao) };
      return { status: 200, tipo: HTML, corpo };
    },
  };
}
