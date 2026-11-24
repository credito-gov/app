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
  const negativo = texto.startsWith("-");
  const [inteiro, centavos] = (negativo ? texto.slice(1) : texto).split(".");
  const comMilhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${negativo ? "-" : ""}${comMilhar},${centavos}`;
}
