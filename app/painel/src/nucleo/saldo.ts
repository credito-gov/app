// Totais de crédito por período e gerais (CA-7, D-3, DT-8). Cada total soma só o seu campo, como veio:
// nenhum é derivado de outro, e valor a apropriar, suspenso, inapropriável ou prescrito nunca entram noutro total (CA-8).
import type Big from "big.js";
import type { Nota } from "./consolidacao.js";
import { somar } from "./dinheiro.js";

export interface Totais {
  aApropriar: Big;
  apropriado: Big;
  utilizado: Big;
  saldoCredor: Big;
}

export interface TotaisPorPeriodo<T> {
  pa: string;
  totais: T;
}

/** Ordem cronológica de períodos no formato MM/AAAA. */
export function compararPeriodos(a: string, b: string): number {
  return `${a.slice(3)}-${a.slice(0, 2)}`.localeCompare(`${b.slice(3)}-${b.slice(0, 2)}`);
}

export const CAMINHOS_CREDITO = {
  aApropriar: "cbs.apropriacao.aApropriar",
  apropriado: "cbs.apropriacao.apropriado",
  utilizado: "cbs.apropriacao.utilizacao.utilizado",
  saldoCredor: "cbs.apropriacao.utilizacao.naoUtilizado.saldoCredor",
} as const;

function totaisDe(notas: Nota[]): Totais {
  const soma = (caminho: string) => somar(notas.map((n) => n.valores[caminho]));
  return {
    aApropriar: soma(CAMINHOS_CREDITO.aApropriar),
    apropriado: soma(CAMINHOS_CREDITO.apropriado),
    utilizado: soma(CAMINHOS_CREDITO.utilizado),
    saldoCredor: soma(CAMINHOS_CREDITO.saldoCredor),
  };
}

export function calcularTotais(notas: Nota[]): { porPeriodo: Array<TotaisPorPeriodo<Totais>>; geral: Totais } {
  const porPa = new Map<string, Nota[]>();
  for (const n of notas) porPa.set(n.pa, [...(porPa.get(n.pa) ?? []), n]);
  const porPeriodo = [...porPa.entries()].sort(([a], [b]) => compararPeriodos(a, b)).map(([pa, lista]) => ({ pa, totais: totaisDe(lista) }));
  return { porPeriodo, geral: totaisDe(notas) };
}
