// Copiado de app/apuracao-cbs/src/dinheiro.ts (commit c3d8c56, DT-2) e estendido:
// formatação com R$, negativo com sinal antes do R$ e percentual com uma casa.
import Big from "big.js";

/** Valor monetário a partir do texto original; omitido vale zero (valores zero opcionais são omitidos). */
export function valor(texto: string | undefined): Big {
  return texto === undefined ? Big(0) : Big(texto);
}

/** Soma exata em decimal. Nenhum valor passa por ponto flutuante. */
export function somar(valores: ReadonlyArray<Big | string | undefined>): Big {
  let total = Big(0);
  for (const v of valores) {
    total = total.plus(v instanceof Big ? v : valor(v));
  }
  return total;
}

/** Formata como 1.234,56, por manipulação de texto. */
export function formatar(v: Big): string {
  const texto = v.toFixed(2);
  const negativo = texto.startsWith("-") && texto !== "-0.00";
  const [inteiro, centavos] = (texto.startsWith("-") ? texto.slice(1) : texto).split(".");
  const comMilhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${negativo ? "-" : ""}${comMilhar},${centavos}`;
}

/** Formata como R$ 1.234,56; negativo como -R$ 1.234,56. */
export function formatarReais(v: Big): string {
  const texto = formatar(v);
  return texto.startsWith("-") ? `-R$ ${texto.slice(1)}` : `R$ ${texto}`;
}

/** Percentual com uma casa, meio para cima; total zero mostra traço. */
export function percentual(parte: Big, total: Big): string {
  if (total.eq(0)) return "—";
  const p = parte.div(total).times(100).round(1, Big.roundHalfUp);
  return `${p.toFixed(1).replace(".", ",")}%`;
}
