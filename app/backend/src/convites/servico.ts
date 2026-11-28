// Consulta e aceitação de convite (CA-11 a CA-13, DT-6). O convite é lido pelo HMAC
// do token, com a empresa do link fixada na transação e sem usuário.
import { hmacToken } from "../autenticacao/tokens.js";
import type { Papel } from "../banco/esquema.js";
import { ehUuid, type Banco, type Trx } from "../banco/transacao.js";

export interface ConviteValido {
  id: string;
  empresaId: string;
  empresaNome: string;
  cnpjRaiz: string;
  papel: Papel;
  email: string;
}

export interface DepsConvites {
  banco: Banco;
  relogio: () => Date;
  segredo: string;
  /** Aviso de operação (log); só dados sem valores. */
  aviso?: (dados: Record<string, unknown>, msg: string) => void;
}

/** Restrições de unicidade que dois aceites simultâneos podem esbarrar. */
const RESTRICOES_DE_CORRIDA = ["usuario_email_normalizado_key", "identidade_provedor_sujeito_key", "vinculo_ativo"];

export function ehCorridaDeAceite(e: unknown): boolean {
  const { code, constraint } = (e ?? {}) as { code?: string; constraint?: string };
  return code === "23505" && constraint !== undefined && RESTRICOES_DE_CORRIDA.includes(constraint);
}

async function lerConvite(
  trx: Trx,
  d: DepsConvites,
  empresaId: string,
  token: string,
  travar: boolean,
): Promise<ConviteValido | null> {
  let q = trx
    .selectFrom("convite")
    .innerJoin("empresa", "empresa.id", "convite.empresa_id")
    .select([
      "convite.id as id",
      "convite.papel as papel",
      "convite.email_normalizado as email",
      "empresa.nome as empresaNome",
      "empresa.cnpj_raiz as cnpjRaiz",
    ])
    .where("convite.empresa_id", "=", empresaId)
    .where("convite.token_hmac", "=", hmacToken(d.segredo, token))
    .where("convite.usado_em", "is", null)
    .where("convite.invalidado_em", "is", null)
    .where("convite.expira_em", ">", d.relogio());
  if (travar) q = q.forUpdate("convite");
  const c = await q.executeTakeFirst();
  return c ? { ...c, empresaId } : null;
}

/** Devolve o convite que ainda vale, ou null (usado, invalidado, vencido, alterado, outra empresa). */
export async function consultarConvite(
  d: DepsConvites,
  empresaId: string,
  token: string,
): Promise<{ convite: ConviteValido; contaExistente: boolean } | null> {
  if (!ehUuid(empresaId)) return null;
  return d.banco.naEmpresaFixada(empresaId, async (trx) => {
    const convite = await lerConvite(trx, d, empresaId, token, false);
    if (!convite) return null;
    const conta = await trx
      .selectFrom("usuario")
      .select("id")
      .where("email_normalizado", "=", convite.email)
      .executeTakeFirst();
    return { convite, contaExistente: conta !== undefined };
  });
}

export type ResultadoAceite =
  | { tipo: "ok"; usuarioId: string; conviteId: string }
  | { tipo: "invalido" };

/**
 * Cria (se preciso) usuário e identidade, o vínculo, e marca o convite como usado,
 * tudo numa transação só. Relê e trava o convite, para não aceitar duas vezes.
 */
export async function aceitarConvite(
  d: DepsConvites,
  dados: {
    empresaId: string;
    token: string;
    usuarioExistenteId: string | null;
    novo: { nome: string; hashSenha: string } | null;
  },
): Promise<ResultadoAceite> {
  if (!ehUuid(dados.empresaId)) return { tipo: "invalido" };
  try {
    return await d.banco.naEmpresaFixada(dados.empresaId, async (trx) => {
      const convite = await lerConvite(trx, d, dados.empresaId, dados.token, true);
      if (!convite) return { tipo: "invalido" } as const;
      const agora = d.relogio();

      let usuarioId = dados.usuarioExistenteId;
      if (!usuarioId) {
        if (!dados.novo) return { tipo: "invalido" } as const;
        const u = await trx
          .insertInto("usuario")
          .values({ nome: dados.novo.nome, email_normalizado: convite.email, criado_em: agora })
          .returning("id")
          .executeTakeFirstOrThrow();
        usuarioId = u.id;
        await trx
          .insertInto("identidade")
          .values({
            usuario_id: usuarioId,
            provedor: "senha",
            sujeito: convite.email,
            hash_senha: dados.novo.hashSenha,
            criada_em: agora,
            senha_alterada_em: agora,
          })
          .execute();
      }

      await trx
        .insertInto("vinculo_empresa")
        .values({
          empresa_id: dados.empresaId,
          usuario_id: usuarioId,
          papel: convite.papel,
          convite_id: convite.id,
          criado_em: agora,
        })
        .execute();
      await trx
        .updateTable("convite")
        .set({ usado_em: agora, aceito_por: usuarioId })
        .where("id", "=", convite.id)
        .execute();
      return { tipo: "ok", usuarioId, conviteId: convite.id } as const;
    });
  } catch (e) {
    // Corrida: e-mail ou vínculo já criado por outra requisição. Outra violação de
    // unicidade é bug e sobe como erro.
    if (ehCorridaDeAceite(e)) {
      d.aviso?.({ restricao: (e as { constraint?: string }).constraint }, "aceite_corrida");
      return { tipo: "invalido" };
    }
    throw e;
  }
}
