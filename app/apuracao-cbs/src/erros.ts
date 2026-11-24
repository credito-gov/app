import type { Redator } from "./redacao.js";
import type { TipoChamada } from "./registro.js";

export type MotivoErro =
  | "rede"
  | "tempo-esgotado"
  | "url-vencida"
  | "situacao-erro"
  | "situacao-expirada"
  | "espera-maxima"
  | "outro";

export interface DadosErroApi {
  tipoChamada: TipoChamada;
  servico?: string;
  http?: number | null;
  codigoErro?: string;
  mensagemErro?: string;
  tiquete?: string;
  motivo?: MotivoErro;
  /** Só para compor a mensagem; não é guardado. */
  detalhe?: string;
  /** Só para compor a mensagem (429); não é guardado. */
  aberturasHoje?: { total: number; aceitas: number };
  /** Só para compor a mensagem (token 400/401); não é guardado. */
  tokensRestantes?: number;
  /** Só para compor a mensagem (rede): código da causa, como ENOTFOUND; nunca a mensagem do erro. */
  codigoRede?: string;
}

/** Código da causa de uma falha de rede (ex.: ENOTFOUND, CERT_HAS_EXPIRED); nunca a mensagem, que pode ter URL. */
export function codigoDaCausa(e: unknown): string | undefined {
  const candidatos: unknown[] = [e instanceof Error ? e.cause : undefined, e];
  for (const c of candidatos) {
    const codigo = typeof c === "object" && c !== null ? (c as { code?: unknown }).code : undefined;
    if (typeof codigo === "string" && /^[A-Za-z0-9_]{1,64}$/.test(codigo)) return codigo;
  }
  return undefined;
}

/** Código de um erro do sistema de arquivos (EBUSY, ENOSPC...), ou "erro desconhecido". */
export function codigoDoErro(e: unknown): string {
  const codigo = typeof e === "object" && e !== null ? (e as { code?: unknown }).code : undefined;
  return typeof codigo === "string" ? codigo : "erro desconhecido";
}

/** Causa de uma falha ao ler o corpo da resposta, em texto curto e sem dados da resposta. */
export function descreverFalhaDeLeitura(e: unknown): string {
  if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")) return "tempo esgotado";
  const codigo = codigoDaCausa(e);
  return codigo ? `erro de rede: ${codigo}` : "erro de rede";
}

export function comandoRetomada(servico: string, tiquete: string): string {
  return `npm run consulta -- ${servico} --tiquete ${tiquete}`;
}

/** Lê codigoErro e mensagemErro de um corpo JSON; qualquer outro corpo não é mostrado. */
export function extrairErroDoCorpo(texto: string): { codigoErro?: string; mensagemErro?: string } {
  let dado: unknown;
  try {
    dado = JSON.parse(texto);
  } catch {
    return {};
  }
  if (dado === null || typeof dado !== "object" || Array.isArray(dado)) return {};
  const o = dado as Record<string, unknown>;
  const saida: { codigoErro?: string; mensagemErro?: string } = {};
  if (typeof o.codigoErro === "string") saida.codigoErro = o.codigoErro;
  if (typeof o.mensagemErro === "string") saida.mensagemErro = o.mensagemErro;
  return saida;
}

function textoBase(d: DadosErroApi): string {
  switch (d.motivo) {
    case "rede":
      return `Sem resposta (erro de rede${d.codigoRede ? `: ${d.codigoRede}` : ""}). Nada foi repetido.`;
    case "tempo-esgotado":
      return d.tipoChamada === "abertura"
        ? "Sem resposta (tempo esgotado). A solicitação pode ter sido aceita e contada no limite de 4 aberturas por dia; o tíquete é desconhecido. Nada foi repetido."
        : "Sem resposta (tempo esgotado). Nada foi repetido.";
    case "url-vencida":
      return "urlAssinada vencida. Peça outra com --tiquete enquanto o arquivo estiver disponível (48 h).";
    case "situacao-erro":
      return "Situação ERRO: a solicitação terminou com erro. Uma nova solicitação exige rodar o comando de novo e consome uma chamada do limite.";
    case "situacao-expirada":
      return "Situação EXPIRADA: o prazo de processamento acabou. Uma nova solicitação exige rodar o comando de novo e consome uma chamada do limite.";
    case "espera-maxima":
      return "Espera máxima atingida sem a solicitação concluir. Nada foi aberto de novo.";
    case "outro":
      return d.detalhe ?? "Falha na chamada.";
    default:
      break;
  }

  const http = d.http ?? undefined;
  if (d.tipoChamada === "token") {
    if (http === 400 || http === 401) {
      const restam = d.tokensRestantes === undefined ? "" : ` Restam ${d.tokensRestantes} pedido(s) de token nesta hora.`;
      return (
        `Credencial recusada no pedido de token (HTTP ${http}). Confira client id e segredo no .env e APURACAO_TOKEN_CREDENCIAIS; ` +
        `credencial gerada antes da v2 (28/10/2026) precisa ser gerada de novo. Não foi feita nova tentativa.${restam}`
      );
    }
    if (http === 403) {
      return "Credencial sem permissão para pedir token (HTTP 403). Confira se a credencial está ativa, os serviços marcados nela e APURACAO_TOKEN_SCOPE. Não foi feita nova tentativa.";
    }
    if (http === 429) {
      return "Limite de pedidos de token excedido (HTTP 429): são 2 por hora. Espere cerca de uma hora antes de tentar de novo. Não foi feita nova tentativa.";
    }
    if (http === 500) {
      return "Erro interno do servidor de token (HTTP 500). Tente mais tarde; o pedido contou no limite de 2 tokens por hora. Não foi feita nova tentativa.";
    }
    return `Falha no pedido de token (HTTP ${http ?? "sem resposta"}).`;
  }
  if (d.tipoChamada === "arquivo") {
    // Download pela urlAssinada: não usa Bearer, não usa APURACAO_URL_BASE e não mexe no cache do token.
    const sufixo = "Peça outra urlAssinada com --tiquete enquanto o arquivo estiver disponível (48 h).";
    if (http === 401) return `A urlAssinada foi recusada pelo armazenamento (HTTP 401). ${sufixo}`;
    if (http === 404) return `O armazenamento não achou o arquivo (HTTP 404). ${sufixo}`;
    return `O download do arquivo falhou (HTTP ${http ?? "sem resposta"}). Tente de novo mais tarde com --tiquete; ${sufixo.charAt(0).toLowerCase()}${sufixo.slice(1)}`;
  }
  switch (http) {
    case 401:
      return "Token recusado ou consumidor não autorizado para este NI. Cache do token descartado. Confira se a credencial é do estabelecimento matriz do CNPJ base.";
    case 403:
      return "Sem permissão ou escopo para este serviço. Confira os serviços marcados na credencial e APURACAO_TOKEN_SCOPE.";
    case 404:
      return d.tipoChamada === "download"
        ? "Arquivo indisponível (ARQUIVO_INDISPONIVEL): solicitação inexistente ou não concluída."
        : "Endereço não encontrado (HTTP 404). Confira APURACAO_URL_BASE.";
    case 429: {
      const n = d.aberturasHoje;
      const aberturas = n ? ` Aberturas de ${d.servico ?? "?"} registradas hoje: ${n.total} (${n.aceitas} aceitas).` : "";
      return `Limite excedido (HTTP 429).${aberturas} A FAQ diz que a cota reinicia à meia-noite.`;
    }
    case 500:
      return "HTTP 500: erro interno da API. Tente mais tarde.";
    default:
      return `HTTP ${http ?? "sem resposta"}: resposta de erro da API.`;
  }
}

/** Erro da API. Nunca guarda cabeçalhos, corpo enviado, token nem urlAssinada. */
export class ErroApi extends Error {
  readonly tipoChamada: TipoChamada;
  readonly servico: string | undefined;
  readonly http: number | null | undefined;
  readonly codigoErro: string | undefined;
  readonly mensagemErro: string | undefined;
  readonly tiquete: string | undefined;
  readonly motivo: MotivoErro | undefined;
  readonly codigoSaida = 1;

  constructor(dados: DadosErroApi, redator: Redator) {
    const codigoErro = dados.codigoErro === undefined ? undefined : redator.redigir(dados.codigoErro);
    const mensagemErro = dados.mensagemErro === undefined ? undefined : redator.redigir(dados.mensagemErro);
    const partes = [textoBase(dados)];
    if (codigoErro !== undefined) partes.push(`codigoErro=${codigoErro}`);
    if (mensagemErro !== undefined) partes.push(`mensagemErro=${mensagemErro}`);
    let mensagem = partes.join(" ");
    if (dados.tiquete && dados.servico) {
      mensagem += `\nPara retomar: ${comandoRetomada(dados.servico, dados.tiquete)}`;
    }
    super(redator.redigir(mensagem));
    Object.defineProperty(this, "name", { value: "ErroApi", enumerable: false });
    this.tipoChamada = dados.tipoChamada;
    this.servico = dados.servico;
    this.http = dados.http;
    this.codigoErro = codigoErro;
    this.mensagemErro = mensagemErro;
    this.tiquete = dados.tiquete;
    this.motivo = dados.motivo;
  }
}

/** Uso incorreto ou configuração inválida (código de saída 2). */
export class ErroUso extends Error {
  readonly codigoSaida = 2;
  constructor(mensagem: string) {
    super(mensagem);
    Object.defineProperty(this, "name", { value: "ErroUso", enumerable: false });
  }
}

/** Falha local (disco, pasta de trabalho). O que importa para o usuário vai na mensagem. */
export class ErroLocal extends Error {
  readonly codigoSaida = 1;
  constructor(mensagem: string) {
    super(mensagem);
    Object.defineProperty(this, "name", { value: "ErroLocal", enumerable: false, configurable: true });
  }
}

/** Falha ao gravar o arquivo bruto recebido. */
export class ErroGravacao extends ErroLocal {
  constructor(
    readonly caminho: string,
    readonly codigo: string,
  ) {
    super(
      `Não foi possível guardar o arquivo bruto em ${caminho} (${codigo}). Nada foi gravado com esse nome. O arquivo continua disponível na Receita por 48 h.`,
    );
    Object.defineProperty(this, "name", { value: "ErroGravacao", enumerable: false });
  }
}
