// Sessão guardada no banco, com o HMAC do token (CA-19 a CA-22). Sem @fastify/session (DT-2).
import type { MotivoEncerramento } from "../banco/esquema.js";
import type { Banco, Trx } from "../banco/transacao.js";
import { gerarToken, hmacToken } from "./tokens.js";

export const SESSAO_DURACAO_MS = 12 * 60 * 60_000;
export const SESSAO_OCIOSA_MS = 2 * 60 * 60_000;
export const SESSAO_TOQUE_MS = 60_000;

export type ResultadoSessao =
  | { tipo: "ok"; usuarioId: string; sessaoId: string }
  | { tipo: "sem_sessao" }
  | { tipo: "sessao_expirada" };

export interface Sessoes {
  criar(usuarioId: string): Promise<{ token: string }>;
  validar(token: string | undefined): Promise<ResultadoSessao>;
  encerrar(token: string, motivo: MotivoEncerramento): Promise<void>;
}

/** Encerra todas as sessões abertas do usuário (nova senha, CA-24). Roda na transação dada. */
export async function encerrarSessoesDoUsuario(
  trx: Trx,
  usuarioId: string,
  agora: Date,
  motivo: MotivoEncerramento,
): Promise<void> {
  await trx
    .updateTable("sessao")
    .set({ encerrada_em: agora, motivo_encerramento: motivo })
    .where("usuario_id", "=", usuarioId)
    .where("encerrada_em", "is", null)
    .execute();
}

export function criarSessoes(opcoes: {
  banco: Banco;
  segredo: string;
  relogio: () => Date;
}): Sessoes {
  const { banco, segredo, relogio } = opcoes;
  return {
    async criar(usuarioId) {
      const token = gerarToken();
      const agora = relogio();
      await banco.semUsuario((trx) =>
        trx
          .insertInto("sessao")
          .values({
            usuario_id: usuarioId,
            token_hmac: hmacToken(segredo, token),
            criada_em: agora,
            ultimo_uso_em: agora,
            expira_em: new Date(agora.getTime() + SESSAO_DURACAO_MS),
          })
          .execute(),
      );
      return { token };
    },

    async validar(token) {
      if (!token) return { tipo: "sem_sessao" };
      const agora = relogio();
      return banco.semUsuario(async (trx) => {
        const s = await trx
          .selectFrom("sessao")
          .select(["id", "usuario_id", "expira_em", "ultimo_uso_em", "encerrada_em"])
          .where("token_hmac", "=", hmacToken(segredo, token))
          .executeTakeFirst();
        if (!s || s.encerrada_em) return { tipo: "sem_sessao" } as const;
        if (
          agora.getTime() >= s.expira_em.getTime() ||
          agora.getTime() >= s.ultimo_uso_em.getTime() + SESSAO_OCIOSA_MS
        ) {
          return { tipo: "sessao_expirada" } as const;
        }
        if (agora.getTime() - s.ultimo_uso_em.getTime() >= SESSAO_TOQUE_MS) {
          await trx.updateTable("sessao").set({ ultimo_uso_em: agora }).where("id", "=", s.id).execute();
        }
        return { tipo: "ok", usuarioId: s.usuario_id, sessaoId: s.id } as const;
      });
    },

    async encerrar(token, motivo) {
      const agora = relogio();
      await banco.semUsuario((trx) =>
        trx
          .updateTable("sessao")
          .set({ encerrada_em: agora, motivo_encerramento: motivo })
          .where("token_hmac", "=", hmacToken(segredo, token))
          .where("encerrada_em", "is", null)
          .execute(),
      );
    },
  };
}
