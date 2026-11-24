import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const pasta = join(import.meta.dirname, "fixtures");

const ESPERADOS: Record<string, string[]> = {
  creditos: ["valido.json", "vazio.json", "invalido-obrigatorio.json", "invalido-tres-casas.json"],
  recolhimentos: ["valido.json", "vazio.json", "invalido.json"],
  pagamentos: ["valido.json", "vazio.json", "rad-vencimento-data.json"],
  debitos: ["valido.json", "vazio.json", "invalido.json"],
};

const CAMPOS_NI = ["niConsumidor", "niFornecedor", "niAdquirente", "niContribuinte"];

function cnpjComDvValido(ni: string): boolean {
  const d = [...ni].map(Number);
  const dv = (n: number) => {
    const pesos = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = pesos.reduce((s, p, i) => s + p * d[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return dv(12) === d[12] && dv(13) === d[13];
}

function cpfComDvValido(ni: string): boolean {
  const d = [...ni].map(Number);
  if (d.every((x) => x === d[0])) return false;
  const dv = (n: number) => {
    const soma = d.slice(0, n).reduce((s, x, i) => s + x * (n + 1 - i), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return dv(9) === d[9] && dv(10) === d[10];
}

function arquivos(): string[] {
  const todos: string[] = [];
  for (const sub of readdirSync(pasta, { withFileTypes: true })) {
    if (!sub.isDirectory()) continue;
    for (const f of readdirSync(join(pasta, sub.name))) todos.push(join(pasta, sub.name, f));
  }
  return todos;
}

function percorrer(valor: unknown, visita: (chave: string, v: unknown) => void): void {
  if (Array.isArray(valor)) {
    for (const item of valor) percorrer(item, visita);
  } else if (valor && typeof valor === "object") {
    for (const [k, v] of Object.entries(valor)) {
      visita(k, v);
      percorrer(v, visita);
    }
  }
}

describe("fixtures fictícias", () => {
  for (const [sub, nomes] of Object.entries(ESPERADOS)) {
    for (const nome of nomes) {
      it(`existe test/fixtures/${sub}/${nome}`, () => {
        expect(existsSync(join(pasta, sub, nome))).toBe(true);
      });
    }
  }

  it("nenhum NI fictício tem dígito verificador válido e o CNPJ base é 12345678", () => {
    const achados: string[] = [];
    for (const arquivo of arquivos()) {
      const dados: unknown = JSON.parse(readFileSync(arquivo, "utf8"));
      percorrer(dados, (chave, v) => {
        if (CAMPOS_NI.includes(chave) && typeof v === "string") {
          if (v.length === 14) {
            if (cnpjComDvValido(v)) achados.push(`${arquivo}: ${chave} com DV de CNPJ válido`);
            if (!v.startsWith("12345678")) achados.push(`${arquivo}: ${chave} fora do CNPJ base 12345678`);
          } else if (v.length === 11 && cpfComDvValido(v)) {
            achados.push(`${arquivo}: ${chave} com DV de CPF válido`);
          }
        }
        if (chave === "ni" && typeof v === "string" && v !== "12345678") {
          achados.push(`${arquivo}: ni diferente de 12345678`);
        }
      });
    }
    expect(achados).toEqual([]);
  });

  it("toda chave de documento começa com FICT", () => {
    const achados: string[] = [];
    for (const arquivo of arquivos()) {
      const dados: unknown = JSON.parse(readFileSync(arquivo, "utf8"));
      percorrer(dados, (chave, v) => {
        if ((chave === "chave" || chave === "chaveDFE") && !(typeof v === "string" && v.startsWith("FICT"))) {
          achados.push(`${arquivo}: ${chave}`);
        }
      });
    }
    expect(achados).toEqual([]);
  });
});
