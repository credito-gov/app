// Peças comuns dos indicadores de crédito e de débito. Funções puras sobre notas consolidadas.
import Big from "big.js";
import { nomeOrigem } from "../leitura/tabelas.js";
import { periodoOrdenavel, type NotaDoBanco } from "./consolidacao.js";

/** Soma exata de um campo, com ausente valendo zero (CA-23). */
export function somarCampo(notas: readonly NotaDoBanco[], campo: string): Big {
  let total = Big(0);
  for (const n of notas) {
    const v = n.valores[campo];
    if (v !== undefined) total = total.plus(v);
  }
  return total;
}

/** Texto decimal com duas casas. */
export const texto = (v: Big): string => v.toFixed(2);

/** `AAAA-MM` de um `MM/AAAA`. */
export const periodoIso = (pa: string): string => periodoOrdenavel(pa);

/** Só as notas do período `AAAA-MM`; sem recorte, todas. */
export function noRecorte<T extends NotaDoBanco>(notas: readonly T[], recorte: string | null): T[] {
  return recorte === null ? [...notas] : notas.filter((n) => periodoIso(n.pa) === recorte);
}

/** Períodos `AAAA-MM` com nota, em ordem cronológica e sem repetir. */
export function periodosDisponiveis(notas: readonly NotaDoBanco[]): string[] {
  return [...new Set(notas.map((n) => periodoIso(n.pa)))].sort();
}

export interface OrigemEmNotas {
  codigo: number;
  nome: string;
  quantidade: number;
}

/** Origens diferentes de normal (0), com o nome da tabela oficial e a quantidade (CA-25, D-6). */
export function origensDe(notas: readonly NotaDoBanco[]): OrigemEmNotas[] {
  const porCodigo = new Map<number, number>();
  for (const n of notas) if (n.origem !== 0) porCodigo.set(n.origem, (porCodigo.get(n.origem) ?? 0) + 1);
  return [...porCodigo.entries()]
    .sort(([a], [b]) => a - b)
    .map(([codigo, quantidade]) => ({ codigo, nome: nomeOrigem(codigo) ?? "sem nome na tabela", quantidade }));
}
