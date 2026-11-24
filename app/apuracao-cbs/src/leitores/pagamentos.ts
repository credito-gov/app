import type Big from "big.js";
import { somar, valor } from "../dinheiro.js";

export interface OrigemPagamento {
  codigo: 1 | 2;
  sigla: "RAD" | "PCONT";
  nome: string;
}

const RAD: OrigemPagamento = { codigo: 1, sigla: "RAD", nome: "RAD (recolhimento pelo adquirente)" };
const PCONT: OrigemPagamento = { codigo: 2, sigla: "PCONT", nome: "PCONT (pagamento pelo contribuinte)" };

export interface LinhaPagamento {
  pa: string;
  origem: OrigemPagamento;
  numeroDARF: string;
  dataArrecadacao: string;
  total: Big;
}

export interface PeriodoPagamentos {
  pa: string;
  linhas: LinhaPagamento[];
  quantidade: number;
  totalRAD: Big;
  totalPCONT: Big;
  totalGeral: Big;
}

export interface ResumoPagamentos {
  servico: "pagamentos";
  vazio: boolean;
  periodos: PeriodoPagamentos[];
}

interface ArquivoPagamentos {
  apuracao: Array<{
    dataArrecadacao: string;
    pagamentos: Array<{
      numeroDARF: string;
      tipo: string;
      composicao: Array<{ pa: string; total: string }>;
    }>;
  }>;
}

const chaveDoPeriodo = (pa: string): string => `${pa.slice(3)}${pa.slice(0, 2)}`;

/**
 * Resume o arquivo de pagamentos já validado e lido sem perda. A origem vem do campo tipo
 * (1 = RAD, 2 = PCONT). Um pagamento pode ter itens de períodos diferentes: a linha é por item.
 * niAdquirente, niContribuinte, chaveDFE, principal, multa e juros ficam no arquivo bruto.
 */
export function resumirPagamentos(dados: unknown): ResumoPagamentos {
  const arquivo = dados as ArquivoPagamentos;
  const porPeriodo = new Map<string, LinhaPagamento[]>();
  let itens = 0;

  for (const dia of arquivo.apuracao) {
    for (const pagamento of dia.pagamentos) {
      const origem = Number(pagamento.tipo) === 1 ? RAD : PCONT;
      for (const item of pagamento.composicao) {
        itens += 1;
        const lista = porPeriodo.get(item.pa) ?? [];
        lista.push({
          pa: item.pa,
          origem,
          numeroDARF: pagamento.numeroDARF,
          dataArrecadacao: dia.dataArrecadacao,
          total: valor(item.total),
        });
        porPeriodo.set(item.pa, lista);
      }
    }
  }

  const periodos = [...porPeriodo.entries()]
    .sort(([a], [b]) => chaveDoPeriodo(a).localeCompare(chaveDoPeriodo(b)))
    .map(([pa, linhas]): PeriodoPagamentos => {
      const rad = somar(linhas.filter((l) => l.origem.sigla === "RAD").map((l) => l.total));
      const pcont = somar(linhas.filter((l) => l.origem.sigla === "PCONT").map((l) => l.total));
      return { pa, linhas, quantidade: linhas.length, totalRAD: rad, totalPCONT: pcont, totalGeral: rad.plus(pcont) };
    });

  return { servico: "pagamentos", vazio: itens === 0, periodos };
}
