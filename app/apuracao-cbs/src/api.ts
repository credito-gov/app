import type { Config } from "./config.js";
import { ErroApi, codigoDaCausa, comandoRetomada, descreverFalhaDeLeitura, extrairErroDoCorpo, type DadosErroApi } from "./erros.js";
import type { Redator } from "./redacao.js";
import type { Registro, TipoChamada } from "./registro.js";
import type { Relogio } from "./relogio.js";
import type { Servico } from "./servicos.js";
import type { Saida } from "./tipos.js";
import type { ClienteToken } from "./token.js";

const TEMPO_LIMITE_MS = 60_000;
// O arquivo pode ser grande e vem de outro servidor (armazenamento); 60 s derrubaria todo download
// lento. Dez minutos cobre um arquivo de dezenas de MB em conexão ruim e ainda encerra um travamento.
const TEMPO_LIMITE_ARQUIVO_MS = 10 * 60_000;

const CONTOU_ABERTURA = "A chamada contou no limite de 4 aberturas por dia e o tíquete é desconhecido.";

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
  /** Onde o tíquete recém-recebido é mostrado, antes de qualquer gravação em disco. */
  saida?: Saida;
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
    tempoLimiteMs = TEMPO_LIMITE_MS,
  ): Promise<{ status: number; resposta: Response }> => {
    let resposta: Response;
    try {
      resposta = await opcoes.fetch(url, { ...init, signal: AbortSignal.timeout(tempoLimiteMs) });
    } catch (e) {
      registro.registrar({ servico: servico.nome, tipo, http: null, tiquete: tiquete ?? null });
      const tempo = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
      throw erro({ tipoChamada: tipo, tiquete, http: null, motivo: tempo ? "tempo-esgotado" : "rede", codigoRede: codigoDaCausa(e) });
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

  /** Interpreta o texto como objeto JSON; undefined se não for (o corpo nunca é mostrado). */
  const comoObjeto = (texto: string): Record<string, unknown> | undefined => {
    try {
      const dado: unknown = JSON.parse(texto);
      if (dado && typeof dado === "object" && !Array.isArray(dado)) return dado as Record<string, unknown>;
    } catch {
      // não é JSON
    }
    return undefined;
  };

  /** Lê o corpo de uma resposta 2xx das APIs com Bearer e o devolve como objeto, ou lança ErroApi. */
  const lerJson = async (resposta: Response, tipo: TipoChamada, tiquete: string, rotulo: string): Promise<Record<string, unknown>> => {
    let texto: string;
    try {
      texto = await resposta.text();
    } catch (e) {
      throw erro({
        tipoChamada: tipo,
        tiquete,
        http: resposta.status,
        motivo: "outro",
        detalhe: `A resposta ${rotulo} chegou (HTTP ${resposta.status}), mas o corpo não pôde ser lido (${descreverFalhaDeLeitura(e)}).`,
      });
    }
    const dado = comoObjeto(texto);
    if (!dado) {
      throw erro({ tipoChamada: tipo, tiquete, http: resposta.status, motivo: "outro", detalhe: `A resposta ${rotulo} (HTTP ${resposta.status}) não é um objeto JSON.` });
    }
    return dado;
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
      // 2xx: a abertura contou no limite, qualquer que seja o estado do corpo.
      let texto: string;
      try {
        texto = await resposta.text();
      } catch (e) {
        registro.registrar({ servico: servico.nome, tipo: "abertura", http: status, tiquete: null });
        throw erro({
          tipoChamada: "abertura",
          http: status,
          motivo: "outro",
          detalhe: `A abertura foi aceita (HTTP ${status}), mas o corpo da resposta não pôde ser lido (${descreverFalhaDeLeitura(e)}). ${CONTOU_ABERTURA}`,
        });
      }
      const dado = comoObjeto(texto);
      const tiquete = dado?.tiqueteSolicitacao;
      if (typeof tiquete !== "string" || tiquete === "") {
        registro.registrar({ servico: servico.nome, tipo: "abertura", http: status, tiquete: null });
        throw erro({
          tipoChamada: "abertura",
          http: status,
          motivo: "outro",
          detalhe: dado
            ? `A resposta da abertura não trouxe tiqueteSolicitacao. ${CONTOU_ABERTURA}`
            : `A resposta da abertura (HTTP ${status}) não é um objeto JSON. ${CONTOU_ABERTURA}`,
        });
      }
      // O tíquete vale uma abertura do limite: vai para a tela antes de qualquer gravação em disco.
      opcoes.saida?.escrever(`Tíquete recebido: ${tiquete}. Para retomar: ${comandoRetomada(servico.nome, tiquete)}`);
      // O registro da abertura leva o tíquete (guia 5.1); se a gravação falhar, vira aviso.
      registro.registrar({ servico: servico.nome, tipo: "abertura", http: status, tiquete });
      const tea = typeof dado?.tEASegundos === "number" ? dado.tEASegundos : -1;
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
      const dado = await lerJson(resposta, "situacao", tiquete, "da consulta de situação");
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
      const dado = await lerJson(resposta, "download", tiquete, "do pedido de download");
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
      // Sem nenhum cabeçalho: a urlAssinada já leva a autorização. O registro só sai com o corpo lido.
      const { status, resposta } = await chamar("arquivo", urlAssinada, { method: "GET" }, tiquete, true, TEMPO_LIMITE_ARQUIVO_MS);
      if (!ok(status)) {
        registro.registrar({ servico: servico.nome, tipo: "arquivo", http: status, tiquete });
        if (status === 400 || status === 403) throw erro({ tipoChamada: "arquivo", tiquete, http: status, motivo: "url-vencida" });
        throw erro({ tipoChamada: "arquivo", tiquete, http: status });
      }
      let bytes: Uint8Array;
      try {
        bytes = new Uint8Array(await resposta.arrayBuffer());
      } catch (e) {
        registro.registrar({ servico: servico.nome, tipo: "arquivo", http: null, tiquete });
        throw erro({
          tipoChamada: "arquivo",
          tiquete,
          http: status,
          motivo: "outro",
          detalhe: `O download do arquivo foi interrompido antes do fim (${descreverFalhaDeLeitura(e)}); nada foi guardado. O arquivo continua disponível por 48 h.`,
        });
      }
      registro.registrar({ servico: servico.nome, tipo: "arquivo", http: status, tiquete });
      return bytes;
    },
  };
}
