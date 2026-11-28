// Origem: app/painel/test/apoio/dv.ts (commit 39e4fae da main), movido para src/ficticios na 033 (task 8).
// Módulo 11 de CNPJ e CPF, para gerar CNPJ fictício com o DV errado de propósito e provar que o dado NÃO é real (CA-26).
// Não é regra do produto: o sistema não confere o dígito verificador de CNPJ nem de CPF.

function digitos(texto: string): number[] {
  return [...texto].map((c) => c.charCodeAt(0) - 48);
}

function dvCnpj(base: number[]): number {
  const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const soma = base.reduce((acc, d, i) => acc + d * pesos[i], 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

/** true se os 14 dígitos formam um CNPJ com os dois dígitos verificadores corretos. */
export function cnpjValido(texto: string): boolean {
  if (!/^\d{14}$/.test(texto)) return false;
  const d = digitos(texto);
  const d1 = dvCnpj(d.slice(0, 12));
  const d2 = dvCnpj([...d.slice(0, 12), d1]);
  return d[12] === d1 && d[13] === d2;
}

function dvCpf(base: number[]): number {
  const soma = base.reduce((acc, d, i) => acc + d * (base.length + 1 - i), 0);
  const resto = (soma * 10) % 11;
  return resto === 10 ? 0 : resto;
}

/** true se os 11 dígitos formam um CPF com os dois dígitos verificadores corretos. */
export function cpfValido(texto: string): boolean {
  if (!/^\d{11}$/.test(texto)) return false;
  const d = digitos(texto);
  const d1 = dvCpf(d.slice(0, 9));
  const d2 = dvCpf([...d.slice(0, 9), d1]);
  return d[9] === d1 && d[10] === d2;
}

/** Devolve um CNPJ com a mesma base de 12 dígitos e o último dígito errado de propósito. */
export function cnpjInvalidoDe(base12: string): string {
  const d = digitos(base12);
  const d1 = dvCnpj(d);
  const d2 = dvCnpj([...d, d1]);
  return `${base12}${d1}${(d2 + 1) % 10}`;
}

/** Devolve um CPF com a mesma base de 9 dígitos e o último dígito errado de propósito. */
export function cpfInvalidoDe(base9: string): string {
  const d = digitos(base9);
  const d1 = dvCpf(d);
  const d2 = dvCpf([...d, d1]);
  return `${base9}${d1}${(d2 + 1) % 10}`;
}

/** Dígito verificador da chave de acesso: módulo 11, pesos 2 a 9 da direita para a esquerda, ASCII − 48. */
export function dvChave(base43: string): string {
  let soma = 0;
  let peso = 2;
  for (let i = base43.length - 1; i >= 0; i--) {
    soma += (base43.charCodeAt(i) - 48) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const resto = soma % 11;
  return String(resto < 2 ? 0 : 11 - resto);
}
