// POST, GET e DELETE /api/sessao (CA-15 a CA-17, CA-19 a CA-22).
import type { FastifyInstance } from "fastify";
import { normalizarEmail } from "../autenticacao/email.js";
import type { Contexto } from "./contexto.js";
import { erroCredencial, erroMuitasTentativas } from "./erros.js";
import { abrirSessao, dadosDaSessao, lerCookie, vencerCookie } from "./sessaoHttp.js";

const corpoLogin = {
  type: "object",
  required: ["email", "senha"],
  properties: {
    email: { type: "string", minLength: 1, maxLength: 254 },
    senha: { type: "string", minLength: 1, maxLength: 1024 },
  },
} as const;

export function registrarRotasSessao(app: FastifyInstance, ctx: Contexto): void {
  app.post<{ Body: { email: string; senha: string } }>(
    "/api/sessao",
    { schema: { body: corpoLogin } },
    async (request, reply) => {
      const email = normalizarEmail(request.body.email);
      const quem = { email, origem: request.ip };

      if (await ctx.limite.estaBloqueado("login", quem)) return erroMuitasTentativas(reply);

      const identidade = await ctx.banco.semUsuario((trx) =>
        trx
          .selectFrom("identidade")
          .innerJoin("usuario", "usuario.id", "identidade.usuario_id")
          .select(["usuario.id as usuarioId", "identidade.hash_senha as hash"])
          .where("identidade.provedor", "=", "senha")
          .where("identidade.sujeito", "=", email)
          .executeTakeFirst(),
      );

      // Sem identidade, verifica contra o hash fictício e descarta o resultado (CA-16).
      const certa = await ctx.verificador(identidade?.hash ?? ctx.hashFicticio, request.body.senha);
      if (!identidade || !identidade.hash || !certa) {
        await ctx.limite.registrarFalha("login", quem);
        request.log.info({ evento: "login_recusado" }, "login_recusado");
        return erroCredencial(reply);
      }

      await ctx.limite.registrarSucesso("login", quem);
      const dados = await abrirSessao(ctx, request, reply, identidade.usuarioId);
      request.log.info({ evento: "login_ok", usuarioId: identidade.usuarioId }, "login_ok");
      return reply.code(200).send(dados);
    },
  );

  app.get("/api/sessao", { onRequest: app.exigirSessao }, async (request) => {
    return dadosDaSessao(ctx, request.usuario!.id);
  });

  // Sair é tolerante: sem sessão válida, só vence o cookie.
  app.delete("/api/sessao", async (request, reply) => {
    const token = lerCookie(request);
    if (token) {
      const r = await ctx.sessoes.validar(token);
      await ctx.sessoes.encerrar(token, "saida");
      if (r.tipo === "ok") {
        request.log.info({ evento: "sessao_encerrada", usuarioId: r.usuarioId }, "sessao_encerrada");
      }
    }
    vencerCookie(reply);
    return reply.code(204).send();
  });

}
