export const NOMES_VARIAVEIS = [
  "APURACAO_CLIENT_ID",
  "APURACAO_CLIENT_SECRET",
  "APURACAO_URL_TOKEN",
  "APURACAO_URL_BASE",
  "APURACAO_TOKEN_CREDENCIAIS",
  "APURACAO_TOKEN_SCOPE",
  "APURACAO_CNPJ_BASE",
  "APURACAO_INTERVALO_SITUACAO_SEGUNDOS",
  "APURACAO_ESPERA_MAXIMA_MINUTOS",
] as const;

export interface Config {
  clientId: string;
  clientSecret: string;
  urlToken: string;
  urlBase: string;
  tokenCredenciais: "basic" | "corpo";
  tokenScope: string | undefined;
  cnpjBase: string;
  intervaloSituacaoSegundos: number;
  esperaMaximaMinutos: number;
}

/** Erro de configuração: lista só os NOMES das variáveis, nunca os valores. */
export class ErroConfig extends Error {
  readonly variaveis: string[];
  constructor(variaveis: string[]) {
    super(`Configuração inválida. Variáveis ausentes ou inválidas: ${variaveis.join(", ")}. Confira o .env (modelo em .env.example).`);
    this.name = "ErroConfig";
    this.variaveis = variaveis;
  }
}

type Env = Record<string, string | undefined>;

function urlHttps(texto: string): string | undefined {
  try {
    const u = new URL(texto);
    return u.protocol === "https:" ? texto : undefined;
  } catch {
    return undefined;
  }
}

export function lerConfig(env: Env): Config {
  const problemas: string[] = [];
  const texto = (nome: string): string | undefined => {
    const v = env[nome];
    return v === undefined || v === "" ? undefined : v;
  };
  const obrigatoria = (nome: string): string => {
    const v = texto(nome);
    if (v === undefined) problemas.push(nome);
    return v ?? "";
  };
  const inteiroMinimo = (nome: string, minimo: number, padrao: number): number => {
    const v = texto(nome);
    if (v === undefined) return padrao;
    if (!/^\d+$/.test(v) || Number(v) < minimo) {
      problemas.push(nome);
      return padrao;
    }
    return Number(v);
  };

  const clientId = obrigatoria("APURACAO_CLIENT_ID");
  const clientSecret = obrigatoria("APURACAO_CLIENT_SECRET");

  let urlToken = obrigatoria("APURACAO_URL_TOKEN");
  if (urlToken && urlHttps(urlToken) === undefined) {
    problemas.push("APURACAO_URL_TOKEN");
    urlToken = "";
  }

  let urlBase = obrigatoria("APURACAO_URL_BASE");
  if (urlBase && urlHttps(urlBase) === undefined) {
    problemas.push("APURACAO_URL_BASE");
    urlBase = "";
  }
  urlBase = urlBase.replace(/\/+$/, "");

  const credenciais = obrigatoria("APURACAO_TOKEN_CREDENCIAIS");
  if (credenciais && credenciais !== "basic" && credenciais !== "corpo") problemas.push("APURACAO_TOKEN_CREDENCIAIS");

  const cnpjBase = obrigatoria("APURACAO_CNPJ_BASE");
  if (cnpjBase && !/^\d{8}$/.test(cnpjBase)) problemas.push("APURACAO_CNPJ_BASE");

  const intervaloSituacaoSegundos = inteiroMinimo("APURACAO_INTERVALO_SITUACAO_SEGUNDOS", 60, 300);
  const esperaMaximaMinutos = inteiroMinimo("APURACAO_ESPERA_MAXIMA_MINUTOS", 1, 250);

  if (problemas.length > 0) throw new ErroConfig(problemas);

  return {
    clientId,
    clientSecret,
    urlToken,
    urlBase,
    tokenCredenciais: credenciais as "basic" | "corpo",
    tokenScope: texto("APURACAO_TOKEN_SCOPE"),
    cnpjBase,
    intervaloSituacaoSegundos,
    esperaMaximaMinutos,
  };
}
