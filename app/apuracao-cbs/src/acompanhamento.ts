import type { Situacao } from "./api.js";
import type { Config } from "./config.js";
import { ErroApi } from "./erros.js";
import type { Redator } from "./redacao.js";
import type { Registro } from "./registro.js";
import type { Relogio } from "./relogio.js";
import type { Dormir, Saida } from "./tipos.js";

export interface ResultadoAcompanhamento {
  /** Da abertura registrada até a primeira CONCLUIDA observada; medida do lado do cliente. */
  tempoProcessamentoMs: number | undefined;
}

const dois = (n: number): string => String(n).padStart(2, "0");

export function formatarDuracao(segundos: number): string {
  const s = Math.max(0, Math.round(segundos));
  return `${Math.floor(s / 60)} min ${s % 60} s`;
}

/** Acompanha a situação de um tíquete até CONCLUIDA; qualquer outro fim é erro. */
export async function acompanhar(opcoes: {
  servico: string;
  tiquete: string;
  /** tEASegundos da abertura; ausente na retomada. */
  teaSegundos?: number;
  config: Config;
  api: { situacao(tiquete: string): Promise<Situacao> };
  registro: Registro;
  relogio: Relogio;
  dormir: Dormir;
  saida: Saida;
  redator: Redator;
}): Promise<ResultadoAcompanhamento> {
  const { servico, tiquete, teaSegundos, config, api, registro, relogio, dormir, saida, redator } = opcoes;
  const intervaloS = config.intervaloSituacaoSegundos;
  const hora = (): string => {
    const d = relogio.agora();
    return `${dois(d.getHours())}:${dois(d.getMinutes())}:${dois(d.getSeconds())}`;
  };
  const erro = (dados: ConstructorParameters<typeof ErroApi>[0]): ErroApi => new ErroApi(dados, redator);

  saida.escrever(`Consulta: ${servico}`);
  saida.escrever(`Tíquete: ${tiquete}`);
  if (teaSegundos === undefined) saida.escrever("Estimativa: não disponível na retomada");
  else if (teaSegundos < 0) saida.escrever("Estimativa: sem estimativa");
  else saida.escrever(`Estimativa: ${formatarDuracao(teaSegundos)}`);

  const inicio = relogio.agora().getTime();
  const limiteMs = config.esperaMaximaMinutos * 60_000;
  let espera = teaSegundos !== undefined && teaSegundos > 0 ? Math.max(60, Math.min(teaSegundos, intervaloS)) : intervaloS;
  let ultima: string | undefined;

  for (;;) {
    await dormir(espera * 1000);
    espera = intervaloS;
    const lida = await api.situacao(tiquete);

    if (lida.situacao !== ultima) {
      saida.escrever(`[${hora()}] situação: ${lida.situacao}`);
      ultima = lida.situacao;
    }

    switch (lida.situacao) {
      case "CONCLUIDA": {
        const abertura = registro.primeiraAbertura(tiquete);
        if (!abertura) {
          saida.escrever("Tempo de processamento: não disponível (abertura deste tíquete não registrada neste computador).");
          return { tempoProcessamentoMs: undefined };
        }
        const ms = relogio.agora().getTime() - abertura.getTime();
        saida.escrever(`Tempo de processamento: ${formatarDuracao(ms / 1000)} (medido pelo cliente, limitado pelo intervalo de consulta).`);
        return { tempoProcessamentoMs: ms };
      }
      case "ERRO":
        throw erro({ tipoChamada: "situacao", servico, tiquete, motivo: "situacao-erro", codigoErro: lida.codigoErro, mensagemErro: lida.mensagemErro });
      case "EXPIRADA":
        throw erro({ tipoChamada: "situacao", servico, tiquete, motivo: "situacao-expirada", codigoErro: lida.codigoErro, mensagemErro: lida.mensagemErro });
      case "PENDENTE":
      case "EM_PROCESSAMENTO":
        break;
      default:
        throw erro({ tipoChamada: "situacao", servico, tiquete, motivo: "outro", detalhe: `situação não documentada: ${lida.situacao}` });
    }

    if (relogio.agora().getTime() - inicio >= limiteMs) {
      throw erro({ tipoChamada: "situacao", servico, tiquete, motivo: "espera-maxima" });
    }
  }
}
