import type { Config } from "./config.js";
import { ErroApi, extrairErroDoCorpo, type DadosErroApi } from "./erros.js";
import type { Redator } from "./redacao.js";
import type { Registro, TipoChamada } from "./registro.js";
import type { Relogio } from "./relogio.js";
import type { Servico } from "./servicos.js";
import type { ClienteToken } from "./token.js";

const TEMPO_LIMITE_MS = 60_000;

export interface Abertura {
  tiquete: string;
  /** tEASegundos da resposta; -1 = sem estimativa. */
  teaSegundos: number;
}

export interface Situacao {
  situacao: string;
  codigoErro?: string;
  mensagemErro?: string;
}

export interface LinkDownload {
  urlAssinada: string;
  expiraEm?: Date;
}

export interface ClienteApi {
  abrir(): Promise<Abertura>;
  situacao(tiquete: string): Promise<Situacao>;
  linkDownload(tiquete: string): Promise<LinkDownload>;
  baixarArquivo(urlAssinada: string, tiquete: string, expiraEm?: Date): Promise<Uint8Array>;
}

/**
 * Cliente das APIs de uma consulta. Só leitura: abertura, situação, download e arquivo.
 * Nenhuma chamada é repetida por conta própria; todo erro encerra.
 */
export function criarClienteApi(opcoes: {
  config: Config;
  fetch: typeof fetch;
  token: ClienteToken;
  registro: Registro;
  relogio: Relogio;
  redator: Redator;
  servico: Servico;
}): ClienteApi {
  const { config, token, registro, relogio, redator, servico } = opcoes;

  const erro = (dados: Omit<DadosErroApi, "servico">): ErroApi => new ErroApi({ servico: servico.nome, ...dados }, redator);

  /** Faz o pedido, registra a chamada e devolve a resposta; rede e tempo esgotado viram ErroApi. */
  const chamar = async (
    tipo: TipoChamada,
    url: string,
    init: RequestInit,
    tiquete: string | undefined,
    adiarRegistro = false,
  ): Promise<{ status: number; resposta: Response }> => {
    let resposta: Response;
    try {
      resposta = await opcoes.fetch(url, { ...init, signal: AbortSignal.timeout(TEMPO_LIMITE_MS) });
    } catch (e) {
      registro.registrar({ servico: servico.nome, tipo, http: null, tiquete: tiquete ?? null });
      const tempo = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
      throw erro({ tipoChamada: tipo, tiquete, http: null, motivo: tempo ? "tempo-esgotado" : "rede" });
    }
    if (!adiarRegistro) registro.registrar({ servico: servico.nome, tipo, http: resposta.status, tiquete: tiquete ?? null });
    return { status: resposta.status, resposta };
  };

  const ok = (status: number): boolean => status >= 200 && status < 300;

  /** Erro de uma resposta não 2xx das APIs com Bearer (nunca o arquivo). */
  const erroHttp = async (tipo: TipoChamada, status: number, resposta: Response, tiquete: string | undefined): Promise<ErroApi> => {
    const texto = await resposta.text().catch(() => "");
    if (status === 401) token.descartar();
    const aberturasHoje = status === 429 ? registro.contarAberturas(servico.nome, relogio.agora()) : undefined;
    return erro({ tipoChamada: tipo, tiquete, http: status, aberturasHoje, ...extrairErroDoCorpo(texto) });
  };

  const lerJson = async (resposta: Response): Promise<Record<string, unknown>> => {
    const texto = await resposta.text().catch(() => "");
    try {
      const dado: unknown = JSON.parse(texto);
      if (dado && typeof dado === "object" && !Array.isArray(dado)) return dado as Record<string, unknown>;
    } catch {
      // sem JSON: o campo esperado fica ausente
    }
    return {};
  };

  const base = config.urlBase;

  return {
    async abrir() {
      const bearer = await token.obter();
      const url = `${base}/${servico.caminho}/${config.cnpjBase}`;
      const { status, resposta } = await chamar(
        "abertura",
        url,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${bearer}`, "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ urlRetorno: "" }),
        },
        undefined,
        true,
      );
      if (!ok(status)) {
        registro.registrar({ servico: servico.nome, tipo: "abertura", http: status, tiquete: null });
        throw await erroHttp("abertura", status, resposta, undefined);
      }
      const dado = await lerJson(resposta);
      const tiquete = dado.tiqueteSolicitacao;
      // O tíquete só é conhecido agora; o registro da abertura leva o tíquete (guia 5.1).
      registro.registrar({ servico: servico.nome, tipo: "abertura", http: status, tiquete: typeof tiquete === "string" && tiquete !== "" ? tiquete : null });
      if (typeof tiquete !== "string" || tiquete === "") {
        throw erro({ tipoChamada: "abertura", http: status, motivo: "outro", detalhe: "A resposta da abertura não trouxe tiqueteSolicitacao." });
      }
      const tea = typeof dado.tEASegundos === "number" ? dado.tEASegundos : -1;
      return { tiquete, teaSegundos: tea };
    },

    async situacao(tiquete) {
      const bearer = await token.obter();
      const { status, resposta } = await chamar(
        "situacao",
        `${base}/situacao/${encodeURIComponent(tiquete)}`,
        { method: "GET", headers: { Authorization: `Bearer ${bearer}`, Accept: "application/json" } },
        tiquete,
      );
      if (!ok(status)) throw await erroHttp("situacao", status, resposta, tiquete);
      const dado = await lerJson(resposta);
      if (typeof dado.situacao !== "string" || dado.situacao === "") {
        throw erro({ tipoChamada: "situacao", tiquete, http: status, motivo: "outro", detalhe: "A resposta da consulta de situação não trouxe o campo situacao." });
      }
      const saida: Situacao = { situacao: dado.situacao };
      if (typeof dado.codigoErro === "string") saida.codigoErro = dado.codigoErro;
      if (typeof dado.mensagemErro === "string") saida.mensagemErro = dado.mensagemErro;
      return saida;
    },

    async linkDownload(tiquete) {
      const bearer = await token.obter();
      const { status, resposta } = await chamar(
        "download",
        `${base}/download/${encodeURIComponent(tiquete)}`,
        { method: "GET", headers: { Authorization: `Bearer ${bearer}`, Accept: "application/json" } },
        tiquete,
      );
      if (!ok(status)) throw await erroHttp("download", status, resposta, tiquete);
      const dado = await lerJson(resposta);
      const url = dado.urlAssinada;
      if (typeof url !== "string" || url === "") {
        throw erro({ tipoChamada: "download", tiquete, http: status, motivo: "outro", detalhe: "A resposta do download não trouxe urlAssinada." });
      }
      redator.registrar(url);
      const saida: LinkDownload = { urlAssinada: url };
      const validade = typeof dado.urlAssinadaExpiraEm === "string" ? new Date(dado.urlAssinadaExpiraEm) : undefined;
      if (validade && !Number.isNaN(validade.getTime())) saida.expiraEm = validade;
      return saida;
    },

    async baixarArquivo(urlAssinada, tiquete, expiraEm) {
      redator.registrar(urlAssinada);
      if (expiraEm && expiraEm.getTime() <= relogio.agora().getTime()) {
        throw erro({ tipoChamada: "arquivo", tiquete, motivo: "url-vencida" });
      }
      // Sem nenhum cabeçalho: a urlAssinada já leva a autorização.
      const { status, resposta } = await chamar("arquivo", urlAssinada, { method: "GET" }, tiquete);
      if (status === 400 || status === 403) {
        throw erro({ tipoChamada: "arquivo", tiquete, http: status, motivo: "url-vencida" });
      }
      if (!ok(status)) throw erro({ tipoChamada: "arquivo", tiquete, http: status });
      return new Uint8Array(await resposta.arrayBuffer());
    },
  };
}
