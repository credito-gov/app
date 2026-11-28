// POST /api/recuperacao e /api/recuperacao/confirmar (CA-23 a CA-26).
import type { FastifyInstance } from "fastify";
import { normalizarEmail } from "../autenticacao/email.js";
import { criarPedido, linkVale, trocarSenha } from "../autenticacao/recuperacao.js";
import { gerarHash, validarSenha } from "../autenticacao/senha.js";
import { modeloRecuperacao } from "../email/modelos.js";
import type { Contexto } from "./contexto.js";
import { enviarErro, erroMuitasTentativas } from "./erros.js";
import { mensagemDaRegra } from "./rotasConvites.js";

const MENSAGEM_PEDIDO =
  "Se houver uma conta com esse e-mail, enviaremos um link para criar uma nova senha.";
const MENSAGEM_LINK = "Este link não vale mais. Peça um novo.";

export function registrarRotasRecuperacao(app: FastifyInstance, ctx: Contexto): void {
  const dep = { banco: ctx.banco, relogio: ctx.relogio, segredo: ctx.config.sessaoSegredo };

  app.post<{ Body: { email: string } }>(
    "/api/recuperacao",
    {
      schema: {
        body: {
          type: "object",
          required: ["email"],
          properties: { email: { type: "string", minLength: 1, maxLength: 254 } },
        },
      },
    },
    async (request, reply) => {
      const email = normalizarEmail(request.body.email);
      const quem = { email, origem: request.ip };
      if (await ctx.limite.estaBloqueado("recuperacao", quem)) return erroMuitasTentativas(reply);
      // Cada pedido conta, exista ou não a conta: o limite não revela nada.
      await ctx.limite.registrarFalha("recuperacao", quem);

      const pedido = await criarPedido(dep, email);
      if (pedido) {
        const base = ctx.config.webUrl.replace(/\/+$/, "");
        await ctx.email.enviar(
          modeloRecuperacao({
            para: email,
            link: `${base}/redefinir-senha#t=${pedido.token}`,
            expiraEm: pedido.expiraEm,
          }),
        );
        request.log.info({ evento: "recuperacao_pedida", usuarioId: pedido.usuarioId }, "recuperacao_pedida");
      } else {
        request.log.info({ evento: "recuperacao_pedida" }, "recuperacao_pedida");
      }
      return reply.code(202).send({ mensagem: MENSAGEM_PEDIDO });
    },
  );

  app.post<{ Body: { token: string; senha: string } }>(
    "/api/recuperacao/confirmar",
    {
      schema: {
        body: {
          type: "object",
          required: ["token", "senha"],
          properties: {
            token: { type: "string", minLength: 1, maxLength: 200 },
            senha: { type: "string", minLength: 1, maxLength: 1024 },
          },
        },
      },
    },
    async (request, reply) => {
      const { token, senha } = request.body;
      const invalido = () => enviarErro(reply, 410, "link_invalido", MENSAGEM_LINK);
      if (!(await linkVale(dep, token))) return invalido();

      const regra = validarSenha(senha);
      if (!regra.ok) {
        return enviarErro(reply, 400, "senha_invalida", mensagemDaRegra(regra.regra), { regra: regra.regra });
      }
      const r = await trocarSenha(dep, token, await gerarHash(senha, ctx.custoHash));
      if (!r) return invalido();
      request.log.info({ evento: "senha_redefinida", usuarioId: r.usuarioId }, "senha_redefinida");
      return reply.code(204).send();
    },
  );
}
