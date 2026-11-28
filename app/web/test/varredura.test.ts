// Varredura de app/web (035): a raiz de CNPJ 00000000 é de empresa real e não pode aparecer
// em src/, test/ nem README.md; todo CNPJ completo exibido em PainelMarca tem DV inválido.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, test } from "vitest";

const RAIZ = join(import.meta.dirname, "..");
const IGNORAR = new Set(["node_modules", "dist"]);
const EXTENSOES = /\.(ts|tsx|css|html|md)$/;

function arquivos(pasta: string): string[] {
  const achados: string[] = [];
  for (const nome of readdirSync(pasta)) {
    if (IGNORAR.has(nome)) continue;
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) achados.push(...arquivos(caminho));
    else if (EXTENSOES.test(nome)) achados.push(caminho);
  }
  return achados;
}

const rel = (c: string) => relative(RAIZ, c).split(sep).join("/");

function digitoVerificador(base: string): string {
  const calcula = (digitos: number[]) => {
    const pesos = digitos.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = digitos.reduce((s, d, i) => s + d * pesos[i]!, 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const d = base.split("").map(Number);
  const d1 = calcula(d);
  const d2 = calcula([...d, d1]);
  return `${d1}${d2}`;
}

describe("varredura do repositório (035)", () => {
  test("a raiz 00000000 (de empresa real) não aparece em src/, test/ nem README.md", () => {
    const uuid = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
    const proibida = /00000000|00\.000\.000/;
    const achados: string[] = [];
    for (const c of arquivos(RAIZ)) {
      const r = rel(c);
      if (!r.startsWith("src/") && !r.startsWith("test/") && r !== "README.md") continue;
      if (r === "test/varredura.test.ts") continue;
      if (proibida.test(readFileSync(c, "utf8").replace(uuid, ""))) achados.push(r);
    }
    expect(achados).toEqual([]);
  });

  test("o cálculo do DV dá 91 para a matriz de raiz 11111111", () => {
    expect(digitoVerificador("111111110001")).toBe("91");
  });

  test("todo CNPJ completo exibido em PainelMarca tem DV inválido", () => {
    const fonte = readFileSync(join(RAIZ, "src/componentes/PainelMarca.tsx"), "utf8");
    const cnpjs = [...fonte.matchAll(/\b(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})-(\d{2})\b/g)];
    expect(cnpjs.length).toBeGreaterThan(0);
    for (const [completo, a, b, c, filial, dv] of cnpjs) {
      expect(digitoVerificador(`${a}${b}${c}${filial}`), completo).not.toBe(dv);
    }
  });
});
