// Criação de convite, compartilhada entre a API e o `admin` (CA-6, CA-8 a CA-10).
import type { Papel, OrigemConvite } from "../banco/esquema.js";
import type { Trx } from "../banco/transacao.js";
import { gerarToken, hmacToken } from "../autenticacao/tokens.js";
import { sql } from "kysely";

export const CONVITE_VALIDADE_MS = 7 * 24 * 60 * 60_000;

export type ResultadoCriacao =
  | {
      tipo: "criado";
      conviteId: string;
      token: string;
      expiraEm: Date;
      empresaNome: string;
    }
  | { tipo: "ja_vinculado" }
  | { tipo: "empresa_inexistente" };

/** `<web>/convite#e=<empresaId>&t=<token>`: o token vai no fragmento, que não chega ao servidor. */
export function linkConvite(webUrl: string, empresaId: string, token: string): string {
  return `${webUrl.replace(/\/+$/, "")}/convite#e=${empresaId}&t=${token}`;
}

/**
 * Roda dentro de uma transação com a empresa fixada. Se o e-mail já tem vínculo ativo,
 * recusa; um convite pendente para o mesmo e-mail é invalidado e nasce um novo.
 */
export async function criarConvite(
  trx: Trx,
  d: {
    empresaId: string;
    email: string;
    papel: Papel;
    criadoPor: string | null;
    origem: OrigemConvite;
    agora: Date;
    segredo: string;
  },
): Promise<ResultadoCriacao> {
  // Serializa convites do mesmo e-mail na mesma empresa: o segundo espera o primeiro e então
  // o invalida (o índice convite_pendente_unico é a rede de segurança).
  await sql`select pg_advisory_xact_lock(hashtextextended(${d.empresaId + ":" + d.email}, 0))`.execute(trx);
  const empresa = await trx
    .selectFrom("empresa")
    .select("nome")
    .where("id", "=", d.empresaId)
    .executeTakeFirst();
  if (!empresa) return { tipo: "empresa_inexistente" };

  const ativo = await trx
    .selectFrom("vinculo_empresa")
    .innerJoin("usuario", "usuario.id", "vinculo_empresa.usuario_id")
    .select("vinculo_empresa.id")
    .where("vinculo_empresa.empresa_id", "=", d.empresaId)
    .where("vinculo_empresa.removido_em", "is", null)
    .where("usuario.email_normalizado", "=", d.email)
    .executeTakeFirst();
  if (ativo) return { tipo: "ja_vinculado" };

  await trx
    .updateTable("convite")
    .set({ invalidado_em: d.agora })
    .where("empresa_id", "=", d.empresaId)
    .where("email_normalizado", "=", d.email)
    .where("usado_em", "is", null)
    .where("invalidado_em", "is", null)
    .execute();

  const token = gerarToken();
  const expiraEm = new Date(d.agora.getTime() + CONVITE_VALIDADE_MS);
  const criado = await trx
    .insertInto("convite")
    .values({
      empresa_id: d.empresaId,
      email_normalizado: d.email,
      papel: d.papel,
      token_hmac: hmacToken(d.segredo, token),
      criado_por: d.criadoPor,
      origem: d.origem,
      criado_em: d.agora,
      expira_em: expiraEm,
    })
    .returning("id")
    .executeTakeFirstOrThrow();
  return { tipo: "criado", conviteId: criado.id, token, expiraEm, empresaNome: empresa.nome };
}
