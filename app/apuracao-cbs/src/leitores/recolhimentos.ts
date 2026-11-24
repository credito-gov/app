import type Big from "big.js";
import { somar, valor } from "../dinheiro.js";

export interface LinhaRecolhimento {
  pa: string;
  numeroDARF: string;
  dataArrecadacao: string;
  niFornecedor: string;
  /** Ausente quando o item veio sem chaveDFE (cardinalidade 0:1). */
  chaveDFE: string | undefined;
  total: Big;
}

export interface PeriodoRecolhimentos {
  pa: string;
  linhas: LinhaRecolhimento[];
  quantidade: number;
  total: Big;
}

export interface ResumoRecolhimentos {
  servico: "recolhimentos";
  vazio: boolean;
  periodos: PeriodoRecolhimentos[];
  itensSemChave: number;
  totalItens: number;
}

interface ArquivoRecolhimentos {
  apuracao: Array<{
    dataArrecadacao: string;
    pagamentos: Array<{
      numeroDARF: string;
      composicao: Array<{ pa: string; niFornecedor: string; chaveDFE?: string; total: string }>;
    }>;
  }>;
}

/** "mm/aaaa" vira aaaamm, para ordenar os períodos em ordem cronológica. */
const chaveDoPeriodo = (pa: string): string => `${pa.slice(3)}${pa.slice(0, 2)}`;

/**
 * Resume o arquivo de recolhimentos já validado e lido sem perda: uma linha por item de composição,
 * agrupada por período. Item sem chaveDFE é aceito e contado.
 */
export function resumirRecolhimentos(dados: unknown): ResumoRecolhimentos {
  const arquivo = dados as ArquivoRecolhimentos;
  const porPeriodo = new Map<string, LinhaRecolhimento[]>();
  let totalItens = 0;
  let itensSemChave = 0;

  for (const dia of arquivo.apuracao) {
    for (const pagamento of dia.pagamentos) {
      for (const item of pagamento.composicao) {
        const linha: LinhaRecolhimento = {
          pa: item.pa,
          numeroDARF: pagamento.numeroDARF,
          dataArrecadacao: dia.dataArrecadacao,
          niFornecedor: item.niFornecedor,
          chaveDFE: item.chaveDFE,
          total: valor(item.total),
        };
        totalItens += 1;
        if (linha.chaveDFE === undefined) itensSemChave += 1;
        const lista = porPeriodo.get(item.pa) ?? [];
        lista.push(linha);
        porPeriodo.set(item.pa, lista);
      }
    }
  }

  const periodos = [...porPeriodo.entries()]
    .sort(([a], [b]) => chaveDoPeriodo(a).localeCompare(chaveDoPeriodo(b)))
    .map(
      ([pa, linhas]): PeriodoRecolhimentos => ({
        pa,
        linhas,
        quantidade: linhas.length,
        total: somar(linhas.map((l) => l.total)),
      }),
    );

  return { servico: "recolhimentos", vazio: totalItens === 0, periodos, itensSemChave, totalItens };
}
