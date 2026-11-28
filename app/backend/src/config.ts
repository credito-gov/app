// Leitura e validação das variáveis de ambiente (CA-4, CA-27).
// Recebe o objeto de ambiente: process.env só entra no ponto de entrada.
// As mensagens de erro citam o nome da variável, nunca o valor.

export class ErroConfig extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroConfig";
  }
}

export type Ambiente = "local" | "homologacao" | "producao";
export type AdaptadorEmail = "arquivo" | "memoria";

export interface Config {
  ambiente: Ambiente;
  bancoUrl: string;
  sessaoSegredo: string;
  webUrl: string;
  webOrigem: string;
  email: AdaptadorEmail;
  apiPorta: number;
  /** Número de saltos de proxy confiáveis (0 = não confia em X-Forwarded-For). */
  confiarProxy: number;
}

export type Env = Record<string, string | undefined>;

const AMBIENTES: readonly string[] = ["local", "homologacao", "producao"];
const ADAPTADORES: readonly string[] = ["arquivo", "memoria"];

function obrigatoria(env: Env, nome: string): string {
  const v = env[nome];
  if (v === undefined || v === "") {
    throw new ErroConfig(`Variável obrigatória ausente: ${nome}`);
  }
  return v;
}

export function carregarConfig(env: Env): Config {
  const ambiente = obrigatoria(env, "CREDITOGOV_AMBIENTE");
  if (!AMBIENTES.includes(ambiente)) {
    throw new ErroConfig("CREDITOGOV_AMBIENTE deve ser local, homologacao ou producao");
  }
  if (ambiente === "producao") {
    throw new ErroConfig(
      "CREDITOGOV_AMBIENTE=producao não é aceito: ainda não há adaptador real de e-mail",
    );
  }

  const bancoUrl = obrigatoria(env, "CREDITOGOV_BANCO_URL");

  const sessaoSegredo = obrigatoria(env, "CREDITOGOV_SESSAO_SEGREDO");
  if (Buffer.byteLength(sessaoSegredo, "utf8") < 32) {
    throw new ErroConfig("CREDITOGOV_SESSAO_SEGREDO deve ter pelo menos 32 bytes");
  }

  const webUrl = obrigatoria(env, "CREDITOGOV_WEB_URL");
  let webOrigem: string;
  try {
    webOrigem = new URL(webUrl).origin;
  } catch {
    throw new ErroConfig("CREDITOGOV_WEB_URL deve ser uma URL válida");
  }
  if (webOrigem === "null") {
    throw new ErroConfig("CREDITOGOV_WEB_URL deve ser uma URL http ou https");
  }

  const email = obrigatoria(env, "CREDITOGOV_EMAIL");
  if (!ADAPTADORES.includes(email)) {
    throw new ErroConfig("CREDITOGOV_EMAIL deve ser arquivo ou memoria");
  }

  let apiPorta = 3000;
  const porta = env["CREDITOGOV_API_PORTA"];
  if (porta !== undefined && porta !== "") {
    apiPorta = Number(porta);
    if (!/^\d+$/.test(porta) || apiPorta < 1 || apiPorta > 65535) {
      throw new ErroConfig("CREDITOGOV_API_PORTA deve ser um número de 1 a 65535");
    }
  }

  let confiarProxy = 0;
  const proxy = env["CREDITOGOV_CONFIAR_PROXY"];
  if (proxy !== undefined && proxy !== "") {
    if (!/^[0-9]{1,3}$/.test(proxy)) {
      throw new ErroConfig("CREDITOGOV_CONFIAR_PROXY deve ser um inteiro maior ou igual a 0 (número de proxies confiáveis)");
    }
    confiarProxy = Number(proxy);
  }

  return {
    ambiente: ambiente as Ambiente,
    bancoUrl,
    sessaoSegredo,
    webUrl,
    webOrigem,
    email: email as AdaptadorEmail,
    apiPorta,
    confiarProxy,
  };
}
