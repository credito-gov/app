// Valores e datas na web (CA-23): só por manipulação de texto, sem Number, parseFloat nem parseInt.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { compararDecimal, formatarPercentual, formatarReais } from "../../src/formatacao/dinheiro";
import { formatarData, formatarInstante, formatarPeriodo } from "../../src/formatacao/datas";

describe("formatarReais (CA-23)", () => {
  it.each([
    ["1234.5", "R$ 1.234,50"],
    ["-0.01", "-R$ 0,01"],
    ["12345678901234.56", "R$ 12.345.678.901.234,56"],
    ["0", "R$ 0,00"],
    ["0.00", "R$ 0,00"],
    ["-0.00", "R$ 0,00"],
    ["1234", "R$ 1.234,00"],
    ["0.1", "R$ 0,10"],
    ["999.99", "R$ 999,99"],
    ["1000.00", "R$ 1.000,00"],
    ["-15.50", "-R$ 15,50"],
    ["1000000", "R$ 1.000.000,00"],
  ])("%s vira %s", (entrada, esperado) => {
    expect(formatarReais(entrada)).toBe(esperado);
  });

  it.each(["", "abc", "1e5", "1,5", "1.234", ".5", "5.", "--1", "1 2", " 1", "R$ 1"])("a entrada %j, que não é texto decimal, lança erro", (entrada) => {
    expect(() => formatarReais(entrada)).toThrow();
  });

  it("número e nulo não são texto decimal e lançam erro", () => {
    expect(() => formatarReais(1234.5 as unknown as string)).toThrow();
    expect(() => formatarReais(null as unknown as string)).toThrow();
    expect(() => formatarReais(undefined as unknown as string)).toThrow();
  });
});

describe("compararDecimal", () => {
  it("ordena textos decimais, inclusive negativos e valores de 14 dígitos", () => {
    const valores = ["12345678901234.56", "10.00", "-1.00", "9.99", "0.00"];
    expect([...valores].sort(compararDecimal)).toEqual(["-1.00", "0.00", "9.99", "10.00", "12345678901234.56"]);
  });

  it("devolve -1, 0 e 1, e trata 1.5 e 1.50 como iguais", () => {
    expect(compararDecimal("1.00", "2.00")).toBe(-1);
    expect(compararDecimal("2.00", "1.00")).toBe(1);
    expect(compararDecimal("1.5", "1.50")).toBe(0);
    expect(compararDecimal("-0.00", "0.00")).toBe(0);
  });

  it("compara valores que o ponto flutuante confundiria", () => {
    expect(compararDecimal("12345678901234.56", "12345678901234.55")).toBe(1);
    expect(compararDecimal("-12345678901234.56", "-12345678901234.55")).toBe(-1);
  });
});

describe("formatarPercentual", () => {
  it("14.8 vira 14,8%", () => {
    expect(formatarPercentual("14.8")).toBe("14,8%");
    expect(formatarPercentual("100.0")).toBe("100,0%");
    expect(formatarPercentual("0.0")).toBe("0,0%");
  });

  it("entrada que não é texto decimal lança erro", () => {
    expect(() => formatarPercentual("abc")).toThrow();
  });
});

describe("datas (fuso America/Sao_Paulo)", () => {
  it("o instante 2026-11-26T15:05:00.000Z é 26/11/2026 às 12:05", () => {
    expect(formatarInstante("2026-11-26T15:05:00.000Z")).toBe("26/11/2026 às 12:05");
  });

  it("a virada do dia respeita o fuso", () => {
    expect(formatarInstante("2026-11-27T01:30:00.000Z")).toBe("26/11/2026 às 22:30");
    expect(formatarInstante("2026-11-27T03:00:00.000Z")).toBe("27/11/2026 às 00:00");
  });

  it("a data 2026-11-21 é 21/11/2026, sem mudar de dia", () => {
    expect(formatarData("2026-11-21")).toBe("21/11/2026");
    expect(formatarData("2026-01-01")).toBe("01/01/2026");
  });

  it("o período 2026-11 é 11/2026", () => {
    expect(formatarPeriodo("2026-11")).toBe("11/2026");
    expect(formatarPeriodo("2027-01")).toBe("01/2027");
  });

  it("entrada fora do formato lança erro", () => {
    expect(() => formatarInstante("ontem")).toThrow();
    expect(() => formatarData("21/11/2026")).toThrow();
    expect(() => formatarPeriodo("11/2026")).toThrow();
  });
});

describe("busca no código (CA-23)", () => {
  const raiz = join(import.meta.dirname, "..", "..", "src");
  const arquivos = (pasta: string): string[] =>
    !existsSync(pasta)
      ? []
      : readdirSync(pasta).flatMap((nome) => {
          const c = join(pasta, nome);
          return statSync(c).isDirectory() ? arquivos(c) : /\.(ts|tsx)$/.test(nome) ? [c] : [];
        });

  it("src/formatacao e src/paineis não contêm Number(, parseFloat nem parseInt", () => {
    const todos = [...arquivos(join(raiz, "formatacao")), ...arquivos(join(raiz, "paineis"))];
    expect(todos.length).toBeGreaterThan(0);
    for (const c of todos) {
      const texto = readFileSync(c, "utf8");
      for (const proibido of ["Number(", "parseFloat", "parseInt"]) {
        expect(texto, `${c}: ${proibido}`).not.toContain(proibido);
      }
    }
  });
});
