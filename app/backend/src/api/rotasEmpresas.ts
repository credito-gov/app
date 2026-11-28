// Rotas de empresa (CA-29 a CA-34): lista, empresa em foco, pessoas e remoção de vínculo.
// Toda rota com :empresaId passa pelo rotaDeEmpresa, que confere o vínculo ativo.
import type { FastifyInstance } from "fastify";
import { ehUuid } from "../banco/transacao.js";
import { PODE_CONVIDAR } from "../convites/permissoes.js";
import { formatarCnpjRaiz, listarEmpresas } from "../empresas/empresas.js";
import { removerVinculo } from "../empresas/vinculos.js";
import type { Contexto } from "./contexto.js";
import { enviarErro } from "./erros.js";

export function registrarRotasEmpresas(app: FastifyInstance, ctx: Contexto): void {
  const antes = [app.exigirSessao, app.rotaDeEmpresa];

  app.get("/api/empresas", { onRequest: antes }, async (request) => {
    const usuarioId = request.usuario!.id;
    return request.naCarteira((trx) => listarEmpresas(trx, usuarioId));
  });

  app.get<{ Params: { empresaId: string } }>(
    "/api/empresas/:empresaId",
    { onRequest: antes },
    async (request) =>
      request.naEmpresa(async (trx, c) => {
        const e = await trx
          .selectFrom("empresa")
          .select(["id", "nome", "cnpj_raiz"])
          .where("id", "=", c.empresaId)
          .executeTakeFirstOrThrow();
        return {
          id: e.id,
          nome: e.nome,
          cnpjRaiz: e.cnpj_raiz,
          cnpjRaizFormatado: formatarCnpjRaiz(e.cnpj_raiz),
          papel: c.papel,
        };
      }),
  );

  app.get<{ Params: { empresaId: string } }>(
    "/api/empresas/:empresaId/pessoas",
    { onRequest: antes },
    async (request) => {
      const agora = ctx.relogio();
      return request.naEmpresa(async (trx, c) => {
        const vinculos = await trx
          .selectFrom("vinculo_empresa")
          .innerJoin("usuario", "usuario.id", "vinculo_empresa.usuario_id")
          .select([
            "usuario.id as usuarioId",
            "usuario.nome as nome",
            "usuario.email_normalizado as email",
            "vinculo_empresa.papel as papel",
            "vinculo_empresa.criado_em as desde",
          ])
          .where("vinculo_empresa.empresa_id", "=", c.empresaId)
          .where("vinculo_empresa.removido_em", "is", null)
          .orderBy("vinculo_empresa.criado_em")
          .orderBy("usuario.nome")
          .execute();
        const pendentes = await trx
          .selectFrom("convite")
          .select(["id", "email_normalizado as email", "papel", "expira_em as expiraEm"])
          .where("empresa_id", "=", c.empresaId)
          .where("usado_em", "is", null)
          .where("invalidado_em", "is", null)
          .where("expira_em", ">", agora)
          .orderBy("criado_em")
          .execute();
        return {
          vinculos: vinculos.map((v) => ({ ...v, desde: v.desde.toISOString() })),
          convitesPendentes: pendentes.map((p) => ({ ...p, expiraEm: p.expiraEm.toISOString() })),
          podeConvidar: PODE_CONVIDAR[c.papel],
          podeRemover: c.papel === "titular",
        };
      });
    },
  );

  app.delete<{ Params: { empresaId: string; usuarioId: string } }>(
    "/api/empresas/:empresaId/vinculos/:usuarioId",
    { onRequest: antes },
    async (request, reply) => {
      const { empresaId, usuarioId } = request.params;
      const agora = ctx.relogio();
      const r = await request.naEmpresa(async (trx, c) => {
        if (c.papel !== "titular") return "negado" as const;
        if (!ehUuid(usuarioId)) return "nao_encontrado" as const;
        return removerVinculo(trx, { empresaId, usuarioId, removidoPor: c.usuarioId, agora });
      });
      if (r === "negado") {
        return enviarErro(reply, 403, "papel_nao_permitido", "Só o titular pode remover acessos.");
      }
      if (r === "nao_encontrado") {
        return enviarErro(reply, 404, "vinculo_nao_encontrado", "Esta pessoa não tem acesso a esta empresa.");
      }
      if (r === "ultimo_titular") {
        return enviarErro(reply, 409, "ultimo_titular", "Não é possível remover o último titular.");
      }
      request.log.info({ evento: "vinculo_removido", usuarioId, empresaId }, "vinculo_removido");
      return reply.code(204).send();
    },
  );
}
