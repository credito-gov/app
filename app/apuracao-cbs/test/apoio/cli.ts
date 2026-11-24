import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { executar, type DepsCli } from "../../src/cli.js";
import type { NomeServico } from "../../src/servicos.js";
import { criarApiSimulada, type ApiSimulada, type RespostaSimulada } from "./apiSimulada.js";
import { TOKEN, URL_ASSINADA, envFicticio } from "./ficticios.js";
import { pastaTemporaria } from "./pasta.js";
import { criarDormirFalso, criarRelogioFalso } from "./relogio.js";
import { criarSaidaCapturada } from "./saida.js";

export const pastaFixtures = join(import.meta.dirname, "..", "fixtures");

export function bytesDaFixture(servico: string, arquivo: string): Uint8Array {
  return new Uint8Array(readFileSync(join(pastaFixtures, servico, arquivo)));
}

export interface AmbienteCli {
  api: ApiSimulada;
  deps: DepsCli;
  saida: ReturnType<typeof criarSaidaCapturada>;
  relogio: ReturnType<typeof criarRelogioFalso>;
  dormir: ReturnType<typeof criarDormirFalso>;
  pastaLocal: string;
  rodar(argv: string[]): Promise<number>;
  /** Arquivos de .local, exceto token.json (que guarda só o token), com o conteúdo em texto. */
  arquivosLocais(): Array<{ caminho: string; texto: string }>;
  /** Arquivos guardados em .local/arquivos. */
  guardados(): string[];
}

/** Ambiente completo para testar o `cli`: tudo injetado, sem rede, sem .env, com pasta temporária. */
export function criarAmbienteCli(env: Record<string, string | undefined> = {}): AmbienteCli {
  const api = criarApiSimulada();
  const relogio = criarRelogioFalso();
  const dormir = criarDormirFalso(relogio);
  const saida = criarSaidaCapturada();
  const pastaLocal = pastaTemporaria();
  const deps: DepsCli = { env: envFicticio(env), fetch: api.fetch, relogio, dormir, saida, pastaLocal };

  const varrer = (pasta: string, acumulado: Array<{ caminho: string; texto: string }>) => {
    if (!existsSync(pasta)) return acumulado;
    for (const e of readdirSync(pasta, { withFileTypes: true })) {
      const caminho = join(pasta, e.name);
      if (e.isDirectory()) varrer(caminho, acumulado);
      else if (e.name !== "token.json") acumulado.push({ caminho, texto: readFileSync(caminho, "utf8") });
    }
    return acumulado;
  };

  return {
    api,
    deps,
    saida,
    relogio,
    dormir,
    pastaLocal,
    rodar: (argv) => executar(argv, deps),
    arquivosLocais: () => varrer(pastaLocal, []),
    guardados: () => (existsSync(join(pastaLocal, "arquivos")) ? readdirSync(join(pastaLocal, "arquivos")) : []),
  };
}

export const RESPOSTA_TOKEN: RespostaSimulada = { status: 200, corpo: { access_token: TOKEN, expires_in: 3600 } };

/** Roteiriza o ciclo completo de uma consulta: token, abertura, situações, download e arquivo. */
export function roteirizarCiclo(
  api: ApiSimulada,
  opcoes: {
    servico: NomeServico;
    bytes: Uint8Array;
    tiquete?: string;
    situacoes?: string[];
    tea?: number;
    expiraEm?: Date;
    /** Substitui a resposta do arquivo (padrão: 200 com os bytes). */
    arquivo?: RespostaSimulada;
  },
): void {
  const tiquete = opcoes.tiquete ?? "TIQ-1";
  const situacoes = opcoes.situacoes ?? ["PENDENTE", "EM_PROCESSAMENTO", "CONCLUIDA"];
  api.rota("POST", "/token", RESPOSTA_TOKEN);
  api.rota("POST", `/${opcoes.servico}/12345678`, {
    status: 201,
    corpo: { tiqueteSolicitacao: tiquete, tEASegundos: opcoes.tea ?? 120 },
  });
  api.rota("GET", "/situacao/", ...situacoes.map((s) => ({ status: 200, corpo: { situacao: s } })));
  api.rota("GET", "/download/", {
    status: 200,
    corpo: { urlAssinada: URL_ASSINADA, urlAssinadaExpiraEm: (opcoes.expiraEm ?? new Date(2026, 10, 24, 10, 0, 0)).toISOString() },
  });
  api.rota("GET", "arquivo?assinatura", opcoes.arquivo ?? { status: 200, bytes: opcoes.bytes });
}
