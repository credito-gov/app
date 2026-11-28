// Origem: app/painel/src/nucleo/debitos.ts (commit 39e4fae da main; AD-14), sobre notas do banco (CA-12, CA-13, CA-25).
// Nada daqui se soma, subtrai ou compara com crédito: a função só recebe notas de débito.
import { type NotaDoBanco } from "./consolidacao.js";
import { noRecorte, origensDe, somarCampo, texto, type OrigemEmNotas } from "./comum.js";

export type IndicadoresDeDebito =
  | { semNotasNoRecorte: true }
  | {
      semNotasNoRecorte: false;
      quantidadeNotas: number;
      totais: { apurado: string; extinto: string; saldoDevedor: string };
      origens: OrigemEmNotas[];
    };

/** `recorte` é `AAAA-MM` ou nulo (todos os períodos coletados). */
export function indicadoresDeDebito(notas: readonly NotaDoBanco[], recorte: string | null): IndicadoresDeDebito {
  const doRecorte = noRecorte(notas, recorte);
  if (doRecorte.length === 0) return { semNotasNoRecorte: true };
  return {
    semNotasNoRecorte: false,
    quantidadeNotas: doRecorte.length,
    totais: {
      apurado: texto(somarCampo(doRecorte, "apurado")),
      extinto: texto(somarCampo(doRecorte, "extinto")),
      saldoDevedor: texto(somarCampo(doRecorte, "saldoDevedor")),
    },
    origens: origensDe(doRecorte),
  };
}
