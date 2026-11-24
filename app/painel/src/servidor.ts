// Servidor HTTP local (CA-A1, DT-10): escuta só em 127.0.0.1, confere o Host, aceita só GET e HEAD
// e põe os cabeçalhos de segurança em toda resposta. Não tem login: só aceita conexão da própria máquina.
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { criarPainel, type Resposta } from "./rotas.js";

export interface OpcoesServidor {
  pasta: string;
  /** 0 pede uma porta livre ao sistema (usado nos testes). */
  porta: number;
  lerArquivo?: (caminho: string) => Promise<Uint8Array>;
}

export interface ServidorPainel {
  porta: number;
  endereco: string;
  fechar(): Promise<void>;
}

const ENDERECO = "127.0.0.1";

const CABECALHOS_DE_SEGURANCA: Readonly<Record<string, string>> = {
  "Content-Security-Policy": "default-src 'none'; style-src 'self'; img-src 'self'; form-action 'self'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Cache-Control": "no-store",
};

function responder(req: IncomingMessage, res: ServerResponse, status: number, tipo: string, corpo: string, extras: Record<string, string> = {}): void {
  const bytes = Buffer.from(corpo, "utf8");
  res.writeHead(status, { ...CABECALHOS_DE_SEGURANCA, "Content-Type": tipo, "Content-Length": bytes.length, ...extras });
  res.end(req.method === "HEAD" ? undefined : bytes);
}

/** Registra o erro interno em stderr com a rota (sem a query, sem conteúdo de arquivo nem valores). */
function registrarErro(url: string, e: unknown): void {
  const rota = url.split("?")[0];
  const pilha = (e instanceof Error ? (e.stack ?? "") : "").split("\n").slice(1, 6).join("\n");
  const detalhe = e instanceof Error ? `${e.name}: ${e.message}\n${pilha}` : "erro que não é Error";
  process.stderr.write(`Erro interno em GET ${rota}: ${detalhe}\n`);
}

export async function iniciarServidor(opcoes: OpcoesServidor): Promise<ServidorPainel> {
  const painel = criarPainel({ pasta: opcoes.pasta, lerArquivo: opcoes.lerArquivo });
  let porta = opcoes.porta;

  const servidor = createServer((req, res) => {
    const host = req.headers.host;
    if (host !== `${ENDERECO}:${porta}` && host !== `localhost:${porta}`) {
      responder(req, res, 421, "text/plain; charset=utf-8", "Host não aceito.");
      return;
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      responder(req, res, 405, "text/plain; charset=utf-8", "Método não permitido.", { Allow: "GET, HEAD" });
      return;
    }
    const url = req.url ?? "/";
    if (!url.startsWith("/") || url.startsWith("//")) {
      responder(req, res, 400, "text/plain; charset=utf-8", "Pedido inválido.");
      return;
    }
    painel
      .tratar({ metodo: "GET", url })
      .then((r: Resposta) => responder(req, res, r.status, r.tipo, r.corpo))
      .catch((e: unknown) => {
        registrarErro(url, e);
        responder(req, res, 500, "text/plain; charset=utf-8", "Erro interno.");
      });
  });

  await new Promise<void>((resolver, rejeitar) => {
    servidor.once("error", rejeitar);
    servidor.listen(opcoes.porta, ENDERECO, () => {
      servidor.off("error", rejeitar);
      resolver();
    });
  });
  const endereco = servidor.address();
  if (endereco === null || typeof endereco === "string") throw new Error("endereço de escuta inesperado");
  porta = endereco.port;

  return {
    porta,
    endereco: endereco.address,
    fechar: () =>
      new Promise<void>((resolver) => {
        servidor.close(() => resolver());
        servidor.closeAllConnections();
      }),
  };
}
