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
      return "Sem resposta (erro de rede). Nada foi repetido.";
    case "tempo-esgotado":
      return "Sem resposta (tempo esgotado). Nada foi repetido.";
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
    return `Falha no pedido de token (HTTP ${http ?? "sem resposta"}).`;
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
