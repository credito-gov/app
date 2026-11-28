// Remoção de vínculo (CA-34, P-8). Roda dentro de uma transação com a empresa fixada.
import type { Trx } from "../banco/transacao.js";

export type ResultadoRemocao = "ok" | "ultimo_titular" | "nao_encontrado";

/**
 * Trava com FOR UPDATE os vínculos ativos de titular da empresa, para que duas
 * remoções simultâneas não deixem a empresa sem titular. Marca `removido_em` e
 * `removido_por` (nulo quando a equipe removeu), sem apagar a linha.
 */
export async function removerVinculo(
  trx: Trx,
  d: { empresaId: string; usuarioId: string; removidoPor: string | null; agora: Date },
): Promise<ResultadoRemocao> {
  const titulares = await trx
    .selectFrom("vinculo_empresa")
    .select(["id", "usuario_id"])
    .where("empresa_id", "=", d.empresaId)
    .where("papel", "=", "titular")
    .where("removido_em", "is", null)
    .forUpdate()
    .execute();

  const alvo = await trx
    .selectFrom("vinculo_empresa")
    .select(["id", "papel"])
    .where("empresa_id", "=", d.empresaId)
    .where("usuario_id", "=", d.usuarioId)
    .where("removido_em", "is", null)
    .forUpdate()
    .executeTakeFirst();
  if (!alvo) return "nao_encontrado";
  if (alvo.papel === "titular" && titulares.length <= 1) return "ultimo_titular";

  await trx
    .updateTable("vinculo_empresa")
    .set({ removido_em: d.agora, removido_por: d.removidoPor })
    .where("id", "=", alvo.id)
    .execute();
  return "ok";
}
