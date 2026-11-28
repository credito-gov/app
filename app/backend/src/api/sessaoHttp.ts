// Cookie de sessão e abertura de sessão no login (CA-19, CA-22).
import type { FastifyReply, FastifyRequest } from "fastify";
import { SESSAO_DURACAO_MS } from "../autenticacao/sessao.js";
import { listarEmpresas, type EmpresaDto } from "../empresas/empresas.js";
import type { Contexto } from "./contexto.js";

export const COOKIE_SESSAO = "cg_sessao";

const base = { path: "/api", httpOnly: true, secure: true, sameSite: "strict" as const };

export interface DadosSessao {
  usuario: { id: string; nome: string };
  empresas: EmpresaDto[];
}

export function lerCookie(request: FastifyRequest): string | undefined {
  return request.cookies?.[COOKIE_SESSAO] || undefined;
}

export function vencerCookie(reply: FastifyReply): void {
  reply.clearCookie(COOKIE_SESSAO, base);
}

export async function dadosDaSessao(ctx: Contexto, usuarioId: string): Promise<DadosSessao> {
  return ctx.banco.naCarteira(usuarioId, async (trx) => {
    const u = await trx
      .selectFrom("usuario")
      .select(["id", "nome"])
      .where("id", "=", usuarioId)
      .executeTakeFirstOrThrow();
    return { usuario: { id: u.id, nome: u.nome }, empresas: await listarEmpresas(trx, usuarioId) };
  });
}

/**
 * Abre uma sessão nova para o usuário. Se a requisição trouxe uma sessão válida
 * anterior, ela é encerrada antes (CA-22).
 */
export async function abrirSessao(
  ctx: Contexto,
  request: FastifyRequest,
  reply: FastifyReply,
  usuarioId: string,
): Promise<DadosSessao> {
  const anterior = lerCookie(request);
  if (anterior) {
    const r = await ctx.sessoes.validar(anterior);
    if (r.tipo === "ok") {
      await ctx.sessoes.encerrar(anterior, "saida");
      request.log.info({ evento: "sessao_encerrada", usuarioId: r.usuarioId }, "sessao_encerrada");
    }
  }
  const { token } = await ctx.sessoes.criar(usuarioId);
  reply.setCookie(COOKIE_SESSAO, token, { ...base, maxAge: SESSAO_DURACAO_MS / 1000 });
  return dadosDaSessao(ctx, usuarioId);
}
