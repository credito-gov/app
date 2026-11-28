import type { FastifyError, FastifyReply } from "fastify";

export interface CampoInvalido {
  campo: string;
  mensagem: string;
}

/** Erro de API: `{erro, mensagem, ...extras}`. */
export function enviarErro(
  reply: FastifyReply,
  status: number,
  erro: string,
  mensagem: string,
  extras: Record<string, unknown> = {},
): FastifyReply {
  return reply.code(status).send({ erro, mensagem, ...extras });
}

export const MENSAGEM_MUITAS_TENTATIVAS = "Muitas tentativas. Tente de novo em alguns minutos.";
export const MENSAGEM_CREDENCIAL = "E-mail ou senha incorretos";

export const erroMuitasTentativas = (reply: FastifyReply) =>
  enviarErro(reply, 429, "muitas_tentativas", MENSAGEM_MUITAS_TENTATIVAS);

export const erroCredencial = (reply: FastifyReply) =>
  enviarErro(reply, 401, "credencial_invalida", MENSAGEM_CREDENCIAL);

const MENSAGEM_KEYWORD: Record<string, string> = {
  required: "Campo obrigatório.",
  maxLength: "Valor longo demais.",
  minLength: "Valor curto demais.",
  format: "Formato inválido.",
};

/** Converte o erro de validação do JSON Schema em `campos: [{campo, mensagem}]`. */
export function camposDoErro(erro: FastifyError): CampoInvalido[] {
  const lista = (erro.validation ?? []) as {
    instancePath?: string;
    keyword?: string;
    params?: { missingProperty?: string };
  }[];
  const vistos = new Set<string>();
  const campos: CampoInvalido[] = [];
  for (const v of lista) {
    const base = (v.instancePath ?? "").split("/").filter(Boolean).join(".");
    const campo = v.params?.missingProperty ?? base;
    if (!campo || vistos.has(campo)) continue;
    vistos.add(campo);
    campos.push({ campo, mensagem: MENSAGEM_KEYWORD[v.keyword ?? ""] ?? "Valor inválido." });
  }
  return campos;
}
