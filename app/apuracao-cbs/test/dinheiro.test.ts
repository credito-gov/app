import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import Big from "big.js";
import { describe, expect, it } from "vitest";
import { formatar, somar, valor } from "../src/dinheiro.js";

describe("valor", () => {
  it("converte o texto em decimal exato", () => {
    expect(valor("0.10").toFixed(2)).toBe("0.10");
    expect(valor("12345678901234.56").toFixed(2)).toBe("12345678901234.56");
  });

  it("trata valor omitido como zero", () => {
    expect(valor(undefined).toFixed(2)).toBe("0.00");
  });
});

describe("somar", () => {
  it("soma 0.10 + 0.20 = 0.30 sem erro de ponto flutuante", () => {
    expect(somar(["0.10", "0.20"]).toFixed(2)).toBe("0.30");
  });

  it("soma uma lista com centavos ao centavo", () => {
    const lista = ["1000.10", "234.46", "500.20", "100.07", "0.10", "20.00"];
    expect(somar(lista).toFixed(2)).toBe("1854.93");
  });

  it("soma valores de 16 dígitos inteiros ao centavo", () => {
    expect(somar(["1234567890123456.78", "0.22"]).toFixed(2)).toBe("1234567890123457.00");
    expect(somar(["9999999999999999.99", "0.01"]).toFixed(2)).toBe("10000000000000000.00");
  });

  it("aceita decimais e valores omitidos", () => {
    expect(somar([Big("1.10"), "2.20", undefined]).toFixed(2)).toBe("3.30");
  });

  it("lista vazia soma zero", () => {
    expect(somar([]).toFixed(2)).toBe("0.00");
  });
});

describe("formatar", () => {
  it("usa ponto de milhar e vírgula decimal", () => {
    expect(formatar(Big("1234.5"))).toBe("1.234,50");
  });

  it("formata negativo", () => {
    expect(formatar(Big("-1234.5"))).toBe("-1.234,50");
  });

  it("formata zero", () => {
    expect(formatar(Big("0"))).toBe("0,00");
  });

  it("formata valor de 16 dígitos inteiros", () => {
    expect(formatar(Big("1234567890123456.78"))).toBe("1.234.567.890.123.456,78");
  });

  it("formata valor sem milhar", () => {
    expect(formatar(Big("12.07"))).toBe("12,07");
  });
});

describe("sem ponto flutuante", () => {
  it("não há parseFloat em src/dinheiro.ts nem em src/leitores/", () => {
    const raiz = join(import.meta.dirname, "..", "src");
    const arquivos = [join(raiz, "dinheiro.ts")];
    const leitores = join(raiz, "leitores");
    if (existsSync(leitores)) {
      for (const f of readdirSync(leitores)) arquivos.push(join(leitores, f));
    }
    for (const arquivo of arquivos) {
      expect(readFileSync(arquivo, "utf8"), arquivo).not.toContain("parseFloat");
    }
  });
});
