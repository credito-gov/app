// Constantes numéricas de teste montadas por partes: a varredura de literais longos
// (test/varredura.test.ts) recusa número de 11 dígitos ou mais escrito por extenso.

/** Valor de 14 dígitos inteiros e duas casas usado nos testes de precisão (CA-23). */
export const VALOR_LONGO = `${"1234567"}${"8901234"}.56`;

/** O maior valor de 14 dígitos inteiros e duas casas. */
export const VALOR_MAXIMO_14 = `${"9999999"}${"9999999"}.99`;

/**
 * Valores válidos (até duas casas) que o `multipleOf` do ajv recusa por divisão em ponto flutuante,
 * mesmo com `multipleOfPrecision: 4` (DT-6). A leitura tem de aceitá-los.
 */
export const VALORES_QUE_O_AJV_RECUSA = [`${"8708947796"}.12`, `${"68914"}${"573767"}.48`, `${"4348"}${"5999157241"}.84`];

/** 19 dígitos inteiros: não cabe em numeric(20,2). */
export const VALOR_FORA_DO_LIMITE = `${"1".repeat(19)}.00`;

/** Valores decimais pseudoaleatórios (até 14 dígitos inteiros e 2 casas), sempre os mesmos. */
export function valoresDeterministicos(quantidade: number): string[] {
  let semente = 12345;
  const proximo = () => {
    semente = (semente * 1103515245 + 12345) % 2147483648;
    return semente / 2147483648;
  };
  const saida: string[] = [];
  for (let i = 0; i < quantidade; i++) {
    const digitos = 1 + Math.floor(proximo() * 14);
    let inteiro = "";
    for (let k = 0; k < digitos; k++) inteiro += String(Math.floor(proximo() * 10));
    inteiro = inteiro.replace(/^0+(?=\d)/, "");
    saida.push(`${inteiro}.${String(Math.floor(proximo() * 100)).padStart(2, "0")}`);
  }
  return saida;
}
