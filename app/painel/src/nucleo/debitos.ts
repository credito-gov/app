// Totais de débitos por período e gerais (CA-D2). Nada daqui se soma, subtrai ou compara com crédito.
import type Big from "big.js";
import type { Nota } from "./consolidacao.js";
import { somar } from "./dinheiro.js";
import { compararPeriodos, type TotaisPorPeriodo } from "./saldo.js";

export interface TotaisDebitos {
  apurado: Big;
  extinto: Big;
  saldoDevedor: Big;
}

function totaisDe(notas: Nota[]): TotaisDebitos {
  const soma = (caminho: string) => somar(notas.map((n) => n.valores[caminho]));
  return { apurado: soma("cbs.apurado"), extinto: soma("cbs.extinto"), saldoDevedor: soma("cbs.saldoDevedor") };
}

export function calcularTotaisDebitos(notas: Nota[]): { porPeriodo: Array<TotaisPorPeriodo<TotaisDebitos>>; geral: TotaisDebitos } {
  const porPa = new Map<string, Nota[]>();
  for (const n of notas) porPa.set(n.pa, [...(porPa.get(n.pa) ?? []), n]);
  const porPeriodo = [...porPa.entries()].sort(([a], [b]) => compararPeriodos(a, b)).map(([pa, lista]) => ({ pa, totais: totaisDe(lista) }));
  return { porPeriodo, geral: totaisDe(notas) };
}
