// Valores monetários como texto decimal, só por manipulação de texto e sem aritmética (CA-23, AD-13).
// A API manda "1234.50"; a tela mostra R$ 1.234,50. Nada aqui passa por ponto flutuante.

const DECIMAL = /^(-?)(\d+)(?:\.(\d{1,2}))?$/;
const DECIMAL_LIVRE = /^(-?)(\d+)(?:\.(\d+))?$/;

function dividir(texto: unknown, padrao: RegExp): { negativo: boolean; inteiro: string; fracao: string } {
  if (typeof texto !== "string") throw new Error("Valor deve ser texto decimal.");
  const m = padrao.exec(texto);
  if (!m) throw new Error("Valor não é texto decimal.");
  return { negativo: m[1] === "-", inteiro: (m[2] ?? "0").replace(/^0+(?=\d)/, ""), fracao: m[3] ?? "" };
}

/** `"1234.5"` vira `R$ 1.234,50`; negativo vira `-R$ 0,01`; entrada que não é texto decimal lança erro. */
export function formatarReais(texto: string): string {
  const { negativo, inteiro, fracao } = dividir(texto, DECIMAL);
  const centavos = fracao.padEnd(2, "0");
  const comMilhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const zero = /^0*$/.test(inteiro) && /^0*$/.test(centavos);
  return `${negativo && !zero ? "-" : ""}R$ ${comMilhar},${centavos}`;
}

/** -1, 0 ou 1, comparando os textos decimais dígito a dígito. */
export function compararDecimal(a: string, b: string): -1 | 0 | 1 {
  const x = dividir(a, DECIMAL_LIVRE);
  const y = dividir(b, DECIMAL_LIVRE);
  const tamanho = Math.max(x.fracao.length, y.fracao.length);
  const magnitude = (d: typeof x) => `${d.inteiro.padStart(30, "0")}${d.fracao.padEnd(tamanho, "0")}`;
  const mx = magnitude(x);
  const my = magnitude(y);
  const zeroX = /^0*$/.test(mx);
  const zeroY = /^0*$/.test(my);
  const sx = zeroX ? 0 : x.negativo ? -1 : 1;
  const sy = zeroY ? 0 : y.negativo ? -1 : 1;
  if (sx !== sy) return sx < sy ? -1 : 1;
  if (mx === my) return 0;
  const maior = mx > my ? 1 : -1;
  return (sx < 0 ? -maior : maior) as -1 | 1;
}

/** `"14.8"` vira `14,8%`. */
export function formatarPercentual(texto: string): string {
  const { negativo, inteiro, fracao } = dividir(texto, DECIMAL_LIVRE);
  return `${negativo ? "-" : ""}${inteiro}${fracao ? `,${fracao}` : ""}%`;
}
