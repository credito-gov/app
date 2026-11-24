import type { Nota } from "./consolidacao.js";
import type { ResultadoEmitente } from "./emitente.js";

/** Crédito consolidado com o emitente já resolvido (CA-12). */
export interface NotaCredito extends Nota {
  emitente: ResultadoEmitente;
}
