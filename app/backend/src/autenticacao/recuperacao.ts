// Recuperação de senha (CA-23 a CA-25). O banco guarda só o HMAC do token.
import { encerrarSessoesDoUsuario } from "./sessao.js";
import { gerarToken, hmacToken } from "./tokens.js";
import type { Banco } from "../banco/transacao.js";

export const RECUPERACAO_VALIDADE_MS = 60 * 60_000;

export interface DepsRecuperacao {
  banco: Banco;
  relogio: () => Date;
  segredo: string;
}

/**
 * Se há identidade de senha para o e-mail, invalida os pedidos pendentes e cria um novo.
 * Sem conta, não grava nada e devolve null.
 */
export async function criarPedido(
  d: DepsRecuperacao,
  email: string,
): Promise<{ usuarioId: string; token: string; expiraEm: Date } | null> {
  const agora = d.relogio();
  return d.banco.semUsuario(async (trx) => {
    const identidade = await trx
      .selectFrom("identidade")
      .select("usuario_id")
      .where("provedor", "=", "senha")
      .where("sujeito", "=", email)
      .executeTakeFirst();
    if (!identidade) return null;
    await trx
      .updateTable("recuperacao_senha")
      .set({ invalidada_em: agora })
      .where("usuario_id", "=", identidade.usuario_id)
      .where("usada_em", "is", null)
      .where("invalidada_em", "is", null)
      .execute();
    const token = gerarToken();
    const expiraEm = new Date(agora.getTime() + RECUPERACAO_VALIDADE_MS);
    await trx
      .insertInto("recuperacao_senha")
      .values({
        usuario_id: identidade.usuario_id,
        token_hmac: hmacToken(d.segredo, token),
        criada_em: agora,
        expira_em: expiraEm,
      })
      .execute();
    return { usuarioId: identidade.usuario_id, token, expiraEm };
  });
}

/** Verdadeiro se o token ainda vale (não usado, não invalidado, não vencido). */
export async function linkVale(d: DepsRecuperacao, token: string): Promise<boolean> {
  const agora = d.relogio();
  const r = await d.banco.semUsuario((trx) =>
    trx
      .selectFrom("recuperacao_senha")
      .select("id")
      .where("token_hmac", "=", hmacToken(d.segredo, token))
      .where("usada_em", "is", null)
      .where("invalidada_em", "is", null)
      .where("expira_em", ">", agora)
      .executeTakeFirst(),
  );
  return r !== undefined;
}

/**
 * Troca a senha, marca o link como usado e encerra todas as sessões abertas, numa
 * transação só. Devolve o usuário, ou null se o link não vale mais.
 */
export async function trocarSenha(
  d: DepsRecuperacao,
  token: string,
  hashSenha: string,
): Promise<{ usuarioId: string } | null> {
  const agora = d.relogio();
  return d.banco.semUsuario(async (trx) => {
    const link = await trx
      .selectFrom("recuperacao_senha")
      .select(["id", "usuario_id"])
      .where("token_hmac", "=", hmacToken(d.segredo, token))
      .where("usada_em", "is", null)
      .where("invalidada_em", "is", null)
      .where("expira_em", ">", agora)
      .forUpdate()
      .executeTakeFirst();
    if (!link) return null;
    await trx
      .updateTable("identidade")
      .set({ hash_senha: hashSenha, senha_alterada_em: agora })
      .where("usuario_id", "=", link.usuario_id)
      .where("provedor", "=", "senha")
      .execute();
    await trx.updateTable("recuperacao_senha").set({ usada_em: agora }).where("id", "=", link.id).execute();
    await encerrarSessoesDoUsuario(trx, link.usuario_id, agora, "nova_senha");
    return { usuarioId: link.usuario_id };
  });
}
