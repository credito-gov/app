// Rotas de convite (CA-8 a CA-14): criar (com sessão), consultar e aceitar (pelo token).
import type { FastifyInstance } from "fastify";
import { emailValido, mascararEmail, normalizarEmail } from "../autenticacao/email.js";
import { gerarHash, validarSenha } from "../autenticacao/senha.js";
import type { Papel } from "../banco/esquema.js";
import { criarConvite, linkConvite } from "../convites/criar.js";
import { PAPEIS, PODE_CONVIDAR } from "../convites/permissoes.js";
import { aceitarConvite, consultarConvite } from "../convites/servico.js";
import { formatarCnpjRaiz } from "../empresas/empresas.js";
import { modeloConvite } from "../email/modelos.js";
import type { Contexto } from "./contexto.js";
import { enviarErro, erroCredencial, erroMuitasTentativas } from "./erros.js";
import { abrirSessao } from "./sessaoHttp.js";

const corpoCriar = {
  type: "object",
  required: ["email", "papel"],
  properties: {
    email: { type: "string", minLength: 1, maxLength: 254 },
    papel: { type: "string", enum: PAPEIS },
  },
} as const;

const corpoToken = {
  type: "object",
  required: ["empresaId", "token"],
  properties: {
    empresaId: { type: "string", minLength: 1, maxLength: 64 },
    token: { type: "string", minLength: 1, maxLength: 200 },
  },
} as const;

const corpoAceitar = {
  type: "object",
  required: ["empresaId", "token", "senha"],
  properties: {
    ...corpoToken.properties,
    senha: { type: "string", minLength: 1, maxLength: 1024 },
    nome: { type: "string", maxLength: 200 },
  },
} as const;

const MENSAGEM_CONVITE_INVALIDO =
  "Este convite não vale mais. Peça um novo a quem convidou você.";

export function registrarRotasConvites(app: FastifyInstance, ctx: Contexto): void {
  const dep = {
    banco: ctx.banco,
    relogio: ctx.relogio,
    segredo: ctx.config.sessaoSegredo,
    aviso: (dados: Record<string, unknown>, msg: string) => app.log.warn(dados, msg),
  };
  const conviteInvalido = (reply: Parameters<typeof enviarErro>[0]) =>
    enviarErro(reply, 410, "convite_invalido", MENSAGEM_CONVITE_INVALIDO);

  app.post<{ Params: { empresaId: string }; Body: { email: string; papel: Papel } }>(
    "/api/empresas/:empresaId/convites",
    { onRequest: [app.exigirSessao, app.rotaDeEmpresa], schema: { body: corpoCriar } },
    async (request, reply) => {
      const email = normalizarEmail(request.body.email);
      if (!emailValido(email)) {
        return enviarErro(reply, 400, "entrada_invalida", "Confira os campos informados.", {
          campos: [{ campo: "email", mensagem: "E-mail inválido." }],
        });
      }
      const papelConvidado = request.body.papel;
      const { empresaId } = request.params;
      const agora = ctx.relogio();

      const r = await request.naEmpresa(async (trx, c) => {
        if (!PODE_CONVIDAR[c.papel].includes(papelConvidado)) return { tipo: "negado" } as const;
        const quem = await trx
          .selectFrom("usuario")
          .select("nome")
          .where("id", "=", c.usuarioId)
          .executeTakeFirstOrThrow();
        const criado = await criarConvite(trx, {
          empresaId,
          email,
          papel: papelConvidado,
          criadoPor: c.usuarioId,
          origem: "usuario",
          agora,
          segredo: ctx.config.sessaoSegredo,
        });
        return { tipo: "feito", quem: quem.nome, criado } as const;
      });

      if (r.tipo === "negado") {
        return enviarErro(reply, 403, "papel_nao_permitido", "Você não pode convidar com este papel.");
      }
      if (r.criado.tipo === "ja_vinculado") {
        return enviarErro(reply, 409, "ja_vinculado", "Esta pessoa já tem acesso a esta empresa.");
      }
      if (r.criado.tipo !== "criado") {
        return enviarErro(reply, 404, "empresa_nao_encontrada", "Empresa não encontrada ou sem acesso.");
      }
      // O e-mail sai depois de a transação gravar.
      request.log.info(
        { evento: "convite_criado", usuarioId: request.usuario!.id, empresaId, conviteId: r.criado.conviteId },
        "convite_criado",
      );
      try {
        await ctx.email.enviar(
          modeloConvite({
            para: email,
            quemConvidou: r.quem,
            empresaNome: r.criado.empresaNome,
            papel: papelConvidado,
            link: linkConvite(ctx.config.webUrl, empresaId, r.criado.token),
            expiraEm: r.criado.expiraEm,
          }),
        );
      } catch (e) {
        request.log.error(
          {
            evento: "email_falhou",
            tipo: "convite",
            usuarioId: request.usuario!.id,
            empresaId,
            conviteId: r.criado.conviteId,
            erro: (e as Error).name,
          },
          "email_falhou",
        );
        return enviarErro(
          reply,
          502,
          "email_nao_enviado",
          "O convite foi criado, mas o e-mail não saiu. Tente reenviar.",
        );
      }
      return reply.code(202).send({ mensagem: "Convite enviado" });
    },
  );

  app.post<{ Body: { empresaId: string; token: string } }>(
    "/api/convites/consultar",
    { schema: { body: corpoToken } },
    async (request, reply) => {
      const r = await consultarConvite(dep, request.body.empresaId, request.body.token);
      if (!r) return conviteInvalido(reply);
      return reply.code(200).send({
        empresa: { nome: r.convite.empresaNome, cnpjRaizFormatado: formatarCnpjRaiz(r.convite.cnpjRaiz) },
        papel: r.convite.papel,
        emailMascarado: mascararEmail(r.convite.email),
        contaExistente: r.contaExistente,
      });
    },
  );

  app.post<{ Body: { empresaId: string; token: string; senha: string; nome?: string } }>(
    "/api/convites/aceitar",
    { schema: { body: corpoAceitar } },
    async (request, reply) => {
      const { empresaId, token, senha } = request.body;
      const achado = await consultarConvite(dep, empresaId, token);
      if (!achado) return conviteInvalido(reply);
      const { convite } = achado;
      const quem = { email: convite.email, origem: request.ip };

      let usuarioExistenteId: string | null = null;
      let novo: { nome: string; hashSenha: string } | null = null;

      if (achado.contaExistente) {
        // Conta existente: confere a senha atual, com o mesmo limite do login (CA-12).
        if (await ctx.limite.estaBloqueado("login", quem)) return erroMuitasTentativas(reply);
        const identidade = await ctx.banco.semUsuario((trx) =>
          trx
            .selectFrom("identidade")
            .select(["usuario_id", "hash_senha"])
            .where("provedor", "=", "senha")
            .where("sujeito", "=", convite.email)
            .executeTakeFirst(),
        );
        const certa = await ctx.verificador(identidade?.hash_senha ?? ctx.hashFicticio, senha, () =>
          request.log.error(
            { evento: "hash_invalido", usuarioId: identidade?.usuario_id },
            "hash_invalido",
          ),
        );
        if (!identidade?.hash_senha || !certa) {
          await ctx.limite.registrarFalha("login", quem);
          request.log.info({ evento: "login_recusado" }, "login_recusado");
          return erroCredencial(reply);
        }
        await ctx.limite.registrarSucesso("login", quem);
        usuarioExistenteId = identidade.usuario_id;
      } else {
        const nome = request.body.nome?.trim();
        if (!nome || nome.length > 120) {
          return enviarErro(reply, 400, "entrada_invalida", "Confira os campos informados.", {
            campos: [{ campo: "nome", mensagem: nome ? "Nome longo demais." : "Campo obrigatório." }],
          });
        }
        const regra = validarSenha(senha);
        if (!regra.ok) {
          return enviarErro(reply, 400, "senha_invalida", mensagemDaRegra(regra.regra), { regra: regra.regra });
        }
        novo = { nome, hashSenha: await gerarHash(senha, ctx.custoHash) };
      }

      const aceite = await aceitarConvite(dep, { empresaId, token, usuarioExistenteId, novo });
      if (aceite.tipo !== "ok") return conviteInvalido(reply);

      request.log.info(
        { evento: "convite_aceito", usuarioId: aceite.usuarioId, empresaId, conviteId: aceite.conviteId },
        "convite_aceito",
      );
      let dados;
      try {
        dados = await abrirSessao(ctx, request, reply, aceite.usuarioId);
      } catch (e) {
        // O aceite já foi gravado: dizer isso, em vez de um erro genérico que convida a repetir.
        request.log.error(
          {
            evento: "convite_aceito_sem_sessao",
            usuarioId: aceite.usuarioId,
            empresaId,
            conviteId: aceite.conviteId,
            erro: (e as Error).name,
          },
          "convite_aceito_sem_sessao",
        );
        return enviarErro(reply, 500, "convite_aceito_sem_sessao", "Convite aceito. Entre com seu e-mail e senha.");
      }
      return reply.code(200).send(dados);
    },
  );
}

export function mensagemDaRegra(regra: "tamanho_minimo" | "tamanho_maximo" | "senha_comum"): string {
  switch (regra) {
    case "tamanho_minimo":
      return "A senha precisa ter pelo menos 12 caracteres.";
    case "tamanho_maximo":
      return "A senha pode ter no máximo 128 caracteres.";
    case "senha_comum":
      return "Esta senha é muito comum. Escolha outra.";
  }
}
