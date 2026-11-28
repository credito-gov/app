// Logger (pino, via Fastify) com redação (CA-39). O corpo da requisição e da
// resposta nunca é registrado. Os eventos próprios levam só uuids.
import type { Writable } from "node:stream";

export const CAMINHOS_REDIGIDOS = [
  "req.headers.cookie",
  "req.headers.authorization",
  'res.headers["set-cookie"]',
];

export interface OpcoesLog {
  stream?: Writable;
}

export function opcoesDeLog(opcoes: OpcoesLog = {}) {
  return {
    level: "info",
    redact: { paths: CAMINHOS_REDIGIDOS, censor: "[redigido]" },
    ...(opcoes.stream ? { stream: opcoes.stream } : {}),
  };
}

export type EventoLog =
  | "login_ok"
  | "login_recusado"
  | "convite_criado"
  | "convite_aceito"
  | "recuperacao_pedida"
  | "senha_redefinida"
  | "vinculo_removido"
  | "sessao_encerrada";

/** Dados permitidos num evento: só identificadores uuid. */
export interface DadosEvento {
  usuarioId?: string;
  empresaId?: string;
  conviteId?: string;
}
