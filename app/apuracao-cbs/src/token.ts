import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Config } from "./config.js";
import { ErroApi, codigoDaCausa, codigoDoErro, descreverFalhaDeLeitura, extrairErroDoCorpo, type DadosErroApi } from "./erros.js";
import type { Redator } from "./redacao.js";
import type { Registro } from "./registro.js";
import type { Relogio } from "./relogio.js";
import type { Saida } from "./tipos.js";

const MARGEM_MS = 120_000;
const JANELA_MS = 60 * 60_000;
const LIMITE_POR_HORA = 2;
const VALIDADE_PADRAO_S = 3600;

export interface ClienteToken {
  obter(): Promise<string>;
  descartar(): void;
}

interface CacheToken {
  chaveCredencial: string;
  obtidoEm: string;
  expiraEm: string;
  accessToken: string;
}

const dois = (n: number): string => String(n).padStart(2, "0");
const hhmm = (d: Date): string => `${dois(d.getHours())}:${dois(d.getMinutes())}`;

/** Codificação application/x-www-form-urlencoded (espaço vira +). */
function formEncode(texto: string): string {
  return new URLSearchParams({ v: texto }).toString().slice(2);
}

export function criarClienteToken(opcoes: {
  config: Config;
  fetch: typeof fetch;
  relogio: Relogio;
  registro: Registro;
  pastaLocal: string;
  saida: Saida;
  redator: Redator;
  servico: string;
}): ClienteToken {
  const { config, relogio, registro, pastaLocal, saida, redator, servico } = opcoes;
  const arquivoCache = join(pastaLocal, "token.json");
  const chave = createHash("sha256").update(`${config.urlToken}\n${config.clientId}`).digest("hex");
  let emMemoria: { accessToken: string; expiraEm: number } | undefined;

  let avisouCacheIlegivel = false;
  const lerCache = (): CacheToken | undefined => {
    if (!existsSync(arquivoCache)) return undefined;
    const ilegivel = (motivo: string): undefined => {
      if (!avisouCacheIlegivel) {
        avisouCacheIlegivel = true;
        saida.escrever(`Aviso: cache do token (.local/token.json) ilegível (${motivo}); será ignorado e um novo token será pedido.`);
      }
      return undefined;
    };
    let c: CacheToken;
    try {
      c = JSON.parse(readFileSync(arquivoCache, "utf8")) as CacheToken;
    } catch (e) {
      return ilegivel(e instanceof SyntaxError ? "JSON inválido" : codigoDoErro(e));
    }
    if (c === null || typeof c !== "object") return ilegivel("formato inesperado");
    if (c.chaveCredencial !== chave) return undefined; // cache de outra credencial: ignorado sem aviso
    if (typeof c.accessToken !== "string" || !c.accessToken) return ilegivel("sem token");
    if (typeof c.expiraEm !== "string" || Number.isNaN(new Date(c.expiraEm).getTime())) return ilegivel("validade inválida");
    return c;
  };

  const erro = (dados: Omit<DadosErroApi, "tipoChamada" | "servico">): ErroApi =>
    new ErroApi({ tipoChamada: "token", servico, ...dados }, redator);

  const pedir = async (): Promise<string> => {
    const agora = relogio.agora();
    const recentes = registro.pedidosDeTokenDesde(new Date(agora.getTime() - JANELA_MS));
    if (recentes.length >= LIMITE_POR_HORA) {
      const liberaEm = new Date(recentes[recentes.length - LIMITE_POR_HORA].getTime() + JANELA_MS);
      const ilegiveis = registro.linhasIlegiveisDesde(new Date(agora.getTime() - JANELA_MS));
      const sobre =
        ilegiveis.length > 0
          ? ` Há registro ilegível contado como pedido de token (${ilegiveis.map((n) => `linha ${n}`).join(", ")} de .local/chamadas.jsonl); se não foi um pedido real, corrija ou apague essa linha.`
          : "";
      throw erro({
        motivo: "outro",
        detalhe: `Pedido de token não feito: limite de 2 tokens por hora (controle local); pode pedir de novo a partir de ${hhmm(liberaEm)}.${sobre}`,
      });
    }

    const cabecalhos: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    };
    const corpo = new URLSearchParams();
    corpo.set("grant_type", "client_credentials");
    if (config.tokenCredenciais === "basic") {
      const par = `${formEncode(config.clientId)}:${formEncode(config.clientSecret)}`;
      const base64 = Buffer.from(par).toString("base64");
      redator.registrar(base64);
      cabecalhos.Authorization = `Basic ${base64}`;
    } else {
      corpo.set("client_id", config.clientId);
      corpo.set("client_secret", config.clientSecret);
    }
    redator.registrar(formEncode(config.clientId));
    redator.registrar(formEncode(config.clientSecret));
    if (config.tokenScope) corpo.set("scope", config.tokenScope);

    let resposta: Response;
    try {
      resposta = await opcoes.fetch(config.urlToken, {
        method: "POST",
        headers: cabecalhos,
        body: corpo.toString(),
        signal: AbortSignal.timeout(60_000),
      });
    } catch (e) {
      registro.registrar({ servico, tipo: "token", http: null, tiquete: null });
      const tempo = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
      throw erro({ http: null, motivo: tempo ? "tempo-esgotado" : "rede", codigoRede: codigoDaCausa(e) });
    }
    registro.registrar({ servico, tipo: "token", http: resposta.status, tiquete: null });

    if (resposta.status < 200 || resposta.status >= 300) {
      const texto = await resposta.text().catch(() => "");
      const naHora = registro.pedidosDeTokenDesde(new Date(relogio.agora().getTime() - JANELA_MS)).length;
      throw erro({
        http: resposta.status,
        ...extrairErroDoCorpo(texto),
        tokensRestantes: Math.max(0, LIMITE_POR_HORA - naHora),
      });
    }

    // 2xx: o pedido entra no controle local do limite de 2 por hora, qualquer que seja o estado do corpo.
    const contou = "O pedido foi contado no controle local do limite de 2 tokens por hora.";
    let texto: string;
    try {
      texto = await resposta.text();
    } catch (e) {
      throw erro({
        http: resposta.status,
        motivo: "outro",
        detalhe: `O pedido de token foi aceito (HTTP ${resposta.status}), mas o corpo da resposta não pôde ser lido (${descreverFalhaDeLeitura(e)}). ${contou}`,
      });
    }
    let dado: Record<string, unknown> | undefined;
    try {
      const lido: unknown = JSON.parse(texto);
      if (lido && typeof lido === "object" && !Array.isArray(lido)) dado = lido as Record<string, unknown>;
    } catch {
      // não é JSON: tratado abaixo
    }
    if (!dado) {
      throw erro({ http: resposta.status, motivo: "outro", detalhe: `A resposta do pedido de token (HTTP ${resposta.status}) não é um objeto JSON. ${contou}` });
    }
    const accessToken = dado.access_token;
    if (typeof accessToken !== "string" || accessToken === "") {
      throw erro({ http: resposta.status, motivo: "outro", detalhe: `A resposta do pedido de token não trouxe access_token. ${contou}` });
    }
    redator.registrar(accessToken);

    let validadeS = VALIDADE_PADRAO_S;
    const bruto = dado.expires_in;
    const numero = typeof bruto === "number" ? bruto : typeof bruto === "string" && /^\d+$/.test(bruto) ? Number(bruto) : NaN;
    if (Number.isFinite(numero) && numero > 0) {
      validadeS = numero;
    } else {
      saida.escrever(`Aviso: expires_in ausente na resposta do token; assumindo ${VALIDADE_PADRAO_S} s (manual v1.4: 1 hora).`);
    }

    const obtidoEm = relogio.agora();
    const expiraEm = new Date(obtidoEm.getTime() + validadeS * 1000);
    const cache: CacheToken = {
      chaveCredencial: chave,
      obtidoEm: obtidoEm.toISOString(),
      expiraEm: expiraEm.toISOString(),
      accessToken,
    };
    // O token já foi cobrado do limite: fica em memória antes de qualquer gravação.
    emMemoria = { accessToken, expiraEm: expiraEm.getTime() };
    try {
      mkdirSync(pastaLocal, { recursive: true });
      writeFileSync(arquivoCache, JSON.stringify(cache));
    } catch (e) {
      saida.escrever(
        `Aviso: não foi possível gravar o cache do token em .local/token.json (${codigoDoErro(e)}); o token vale só nesta execução e a próxima pedirá outro (limite: 2 por hora).`,
      );
    }
    saida.escrever(`token obtido, válido por ${validadeS} s.`);
    return accessToken;
  };

  return {
    async obter() {
      const agora = relogio.agora().getTime();
      if (emMemoria && emMemoria.expiraEm - agora > MARGEM_MS) return emMemoria.accessToken;
      const cache = lerCache();
      if (cache) {
        const expira = new Date(cache.expiraEm).getTime();
        if (expira - agora > MARGEM_MS) {
          redator.registrar(cache.accessToken);
          emMemoria = { accessToken: cache.accessToken, expiraEm: expira };
          saida.escrever(`token reaproveitado do cache, válido por mais ${Math.floor((expira - agora) / 1000)} s.`);
          return cache.accessToken;
        }
      }
      return pedir();
    },
    descartar() {
      emMemoria = undefined;
      try {
        rmSync(arquivoCache, { force: true });
      } catch (e) {
        saida.escrever(`Aviso: não foi possível apagar o cache do token (${codigoDoErro(e)}). Apague .local/token.json manualmente.`);
      }
    },
  };
}
