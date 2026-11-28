// Limite de tentativas no banco (CA-17, CA-26, DT-9). Relógio injetável.
// As chaves gravadas são HMAC do e-mail normalizado e do endereço de origem.
import type { Banco } from "../banco/transacao.js";
import type { TipoLimite } from "../banco/esquema.js";
import { hmacToken } from "./tokens.js";

export const MAX_FALHAS = 5;
export const JANELA_MS = 15 * 60_000;
export const BLOQUEIO_MS = 15 * 60_000;
export const RETENCAO_MS = 24 * 60 * 60_000;

export function chaveEmail(segredo: string, emailNormalizado: string): string {
  return hmacToken(segredo, `email:${emailNormalizado}`);
}

export function chaveOrigem(segredo: string, origem: string): string {
  return hmacToken(segredo, `origem:${origem}`);
}

export interface Identificacao {
  email: string;
  origem: string;
}

export interface Limite {
  /** Verdadeiro se a chave do e-mail ou a da origem está bloqueada agora. */
  estaBloqueado(tipo: TipoLimite, quem: Identificacao): Promise<boolean>;
  /** Registra uma falha (login) ou um pedido (recuperação) nas duas chaves. */
  registrarFalha(tipo: TipoLimite, quem: Identificacao): Promise<void>;
  /** O login certo apaga as falhas da chave do e-mail. */
  registrarSucesso(tipo: TipoLimite, quem: { email: string }): Promise<void>;
}

export function criarLimite(opcoes: {
  banco: Banco;
  segredo: string;
  relogio: () => Date;
}): Limite {
  const { banco, segredo, relogio } = opcoes;
  const chaves = (q: Identificacao) => [chaveEmail(segredo, q.email), chaveOrigem(segredo, q.origem)];

  return {
    estaBloqueado(tipo, quem) {
      const agora = relogio();
      return banco.semUsuario(async (trx) => {
        const linha = await trx
          .selectFrom("bloqueio_acesso")
          .select("chave_hmac")
          .where("tipo", "=", tipo)
          .where("chave_hmac", "in", chaves(quem))
          .where("ate", ">", agora)
          .executeTakeFirst();
        return linha !== undefined;
      });
    },

    registrarFalha(tipo, quem) {
      const agora = relogio();
      return banco.semUsuario(async (trx) => {
        await trx
          .deleteFrom("falha_acesso")
          .where("em", "<", new Date(agora.getTime() - RETENCAO_MS))
          .execute();
        for (const chave of chaves(quem)) {
          await trx.insertInto("falha_acesso").values({ tipo, chave_hmac: chave, em: agora }).execute();
          const contagem = await trx
            .selectFrom("falha_acesso")
            .select((eb) => eb.fn.countAll<string>().as("n"))
            .where("tipo", "=", tipo)
            .where("chave_hmac", "=", chave)
            .where("em", ">", new Date(agora.getTime() - JANELA_MS))
            .executeTakeFirstOrThrow();
          if (Number(contagem.n) >= MAX_FALHAS) {
            // Só (re)abre o bloqueio se não há um ativo: tentativas durante ele não o prolongam.
            await trx
              .insertInto("bloqueio_acesso")
              .values({ tipo, chave_hmac: chave, ate: new Date(agora.getTime() + BLOQUEIO_MS) })
              .onConflict((oc) =>
                oc
                  .columns(["tipo", "chave_hmac"])
                  .doUpdateSet((eb) => ({ ate: eb.ref("excluded.ate") }))
                  .where("bloqueio_acesso.ate", "<=", agora),
              )
              .execute();
          }
        }
      });
    },

    registrarSucesso(tipo, quem) {
      return banco.semUsuario(async (trx) => {
        await trx
          .deleteFrom("falha_acesso")
          .where("tipo", "=", tipo)
          .where("chave_hmac", "=", chaveEmail(segredo, quem.email))
          .execute();
      });
    },
  };
}
