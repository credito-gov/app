// Fábrica do servidor Fastify (DT-2, DT-4). Recebe tudo por injeção, o que
// facilita os testes: configuração, banco, e-mail, relógio e verificador de senha.
import { randomBytes } from "node:crypto";
import type { Writable } from "node:stream";
import fastifyCookie from "@fastify/cookie";
import Fastify, { type FastifyError, type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import { criarLimite } from "../autenticacao/limite.js";
import { gerarHash, verificar, type CustoArgon2, type Verificador } from "../autenticacao/senha.js";
import { criarSessoes } from "../autenticacao/sessao.js";
import type { Banco } from "../banco/transacao.js";
import type { Config } from "../config.js";
import type { EnvioEmail } from "../email/tipos.js";
import { opcoesDeLog } from "../registro.js";
import type { Contexto } from "./contexto.js";
import { camposDoErro, enviarErro } from "./erros.js";
import { registrarRotasSessao } from "./rotasSessao.js";
import { lerCookie, vencerCookie } from "./sessaoHttp.js";

declare module "fastify" {
  interface FastifyInstance {
    /** `onRequest` das rotas que exigem sessão; preenche `request.usuario`. */
    exigirSessao: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    /** "MÉTODO /caminho" de toda rota registrada (usado pelos testes de CA-7). */
    rotas: string[];
  }
}

export type Servidor = FastifyInstance;

export interface DepsServidor {
  config: Config;
  banco: Banco;
  email: EnvioEmail;
  relogio?: () => Date;
  verificador?: Verificador;
  custoHash?: CustoArgon2;
  /** `false` desliga o log; sem valor, loga em stdout. */
  log?: false | { stream?: Writable };
}

const METODOS_QUE_MUDAM = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export async function criarServidor(deps: DepsServidor): Promise<Servidor> {
  const { config, banco } = deps;
  const relogio = deps.relogio ?? (() => new Date());
  const custoHash = deps.custoHash ?? {};

  const app = Fastify({
    logger: deps.log === false ? false : opcoesDeLog(deps.log ?? {}),
    trustProxy: config.confiarProxy,
    bodyLimit: 16 * 1024,
    ajv: { customOptions: { allErrors: true } },
  });

  const rotas: string[] = [];
  app.addHook("onRoute", (r) => {
    for (const m of Array.isArray(r.method) ? r.method : [r.method]) rotas.push(`${m} ${r.url}`);
  });
  app.decorate("rotas", rotas);

  await app.register(fastifyCookie);

  const ctx: Contexto = {
    config,
    banco,
    email: deps.email,
    relogio,
    verificador: deps.verificador ?? verificar,
    custoHash,
    sessoes: criarSessoes({ banco, segredo: config.sessaoSegredo, relogio }),
    limite: criarLimite({ banco, segredo: config.sessaoSegredo, relogio }),
    hashFicticio: await gerarHash(randomBytes(16).toString("hex"), custoHash),
  };

  app.decorateRequest("usuario", null);

  // Cabeçalhos de segurança em todo /api (CA-22).
  app.addHook("onSend", async (request, reply) => {
    if (request.url.startsWith("/api")) {
      reply.header("Referrer-Policy", "no-referrer");
      reply.header("X-Content-Type-Options", "nosniff");
      reply.header("Cache-Control", "no-store");
    }
  });

  // Proteção contra requisição de outro site (DT-4): cabeçalho obrigatório e Origin conferido.
  app.addHook("onRequest", async (request, reply) => {
    if (!request.url.startsWith("/api") || !METODOS_QUE_MUDAM.has(request.method)) return;
    const origin = request.headers.origin;
    const semCabecalho = request.headers["x-creditogov-requisicao"] !== "1";
    const origemErrada = origin !== undefined && origin !== config.webOrigem;
    if (semCabecalho || origemErrada) {
      return enviarErro(reply, 403, "origem_recusada", "Requisição recusada.");
    }
  });

  app.decorate("exigirSessao", async (request: FastifyRequest, reply: FastifyReply) => {
    const r = await ctx.sessoes.validar(lerCookie(request));
    if (r.tipo === "ok") {
      request.usuario = { id: r.usuarioId, sessaoId: r.sessaoId };
      return;
    }
    vencerCookie(reply);
    if (r.tipo === "sessao_expirada") {
      return enviarErro(reply, 401, "sessao_expirada", "Sua sessão expirou. Entre de novo.");
    }
    return enviarErro(reply, 401, "sem_sessao", "Entre para continuar.");
  });

  app.setNotFoundHandler((_request, reply) =>
    enviarErro(reply, 404, "nao_encontrado", "Recurso não encontrado."),
  );

  app.setErrorHandler((erro: FastifyError, request, reply) => {
    if (erro.validation) {
      return enviarErro(reply, 400, "entrada_invalida", "Confira os campos informados.", {
        campos: camposDoErro(erro),
      });
    }
    const status = erro.statusCode ?? 500;
    if (status >= 400 && status < 500) {
      return enviarErro(reply, 400, "entrada_invalida", "Requisição inválida.", { campos: [] });
    }
    request.log.error({ tipo: erro.name }, "erro_interno");
    return enviarErro(reply, 500, "erro_interno", "Algo deu errado. Tente de novo.");
  });

  registrarRotasSessao(app, ctx);

  await app.ready();
  return app;
}
