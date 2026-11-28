// Rotas do dashboard (CA-1 a CA-25): painel, pendências e notas de um grupo de pendentes.
// Todas com sessão e vínculo (rotaDeEmpresa) e a empresa fixada na transação (AD-6).
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { consolidar, lerDadosDaEmpresa, lerPeriodo, montarNotasDoGrupo, montarPainel, montarPendencias, type Consolidado } from "../paineis/dados.js";
import type { Contexto } from "./contexto.js";
import { enviarErro } from "./erros.js";

type Params = { empresaId: string };
type Consulta = { periodo?: string; pagina?: string };

export function registrarRotasPaineis(app: FastifyInstance, ctx: Contexto): void {
  const antes = [app.exigirSessao, app.rotaDeEmpresa];

  /** Lê e consolida os dados da empresa e registra só identificadores e duração. */
  async function carregar(request: FastifyRequest<{ Params: Params }>, rota: string): Promise<Consolidado> {
    const inicio = Date.now();
    const agora = ctx.relogio();
    const consolidado = await request.naEmpresa(async (trx, c) => consolidar(await lerDadosDaEmpresa(trx, c.empresaId), agora));
    request.log.info(
      { evento: "painel_consultado", rota, usuarioId: request.usuario!.id, empresaId: request.params.empresaId, duracaoMs: Date.now() - inicio },
      "painel_consultado",
    );
    return consolidado;
  }

  const periodoInvalido = (reply: FastifyReply) =>
    enviarErro(reply, 400, "periodo_invalido", "O período deve ter o formato AAAA-MM, por exemplo 2026-11.");

  app.get<{ Params: Params; Querystring: Consulta }>("/api/empresas/:empresaId/painel", { onRequest: antes }, async (request, reply) => {
    const periodo = lerPeriodo(request.query.periodo);
    if (periodo === undefined) return periodoInvalido(reply);
    return montarPainel(await carregar(request, "painel"), periodo);
  });

  app.get<{ Params: Params; Querystring: Consulta }>("/api/empresas/:empresaId/pendencias", { onRequest: antes }, async (request, reply) => {
    const periodo = lerPeriodo(request.query.periodo);
    if (periodo === undefined) return periodoInvalido(reply);
    return montarPendencias(await carregar(request, "pendencias"), periodo);
  });

  app.get<{ Params: Params & { grupo: string }; Querystring: Consulta }>(
    "/api/empresas/:empresaId/pendencias/:grupo/notas",
    { onRequest: antes },
    async (request, reply) => {
      const periodo = lerPeriodo(request.query.periodo);
      if (periodo === undefined) return periodoInvalido(reply);
      const r = montarNotasDoGrupo(await carregar(request, "notas"), periodo, request.params.grupo, request.query.pagina);
      if (r.tipo === "grupo_nao_encontrado") return enviarErro(reply, 404, "grupo_nao_encontrado", "Não há notas neste grupo.");
      if (r.tipo === "pagina_invalida") return enviarErro(reply, 400, "pagina_invalida", "A página pedida não existe.");
      return r.corpo;
    },
  );
}
