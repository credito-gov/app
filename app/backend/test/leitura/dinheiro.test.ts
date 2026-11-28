// Origem: app/painel/test/dinheiro.test.ts (commit 39e4fae da main).
import Big from "big.js";
import { describe, expect, it } from "vitest";
import { formatar, formatarReais, percentual, somar, valor } from "../../src/leitura/dinheiro.js";

describe("soma em decimal exato (CA-16)", () => {
  it("0.1 + 0.2 dá exatamente 0.30", () => {
    expect(somar(["0.1", "0.2"]).toFixed(2)).toBe("0.30");
    expect(somar(["0.1", "0.2"]).eq(Big("0.3"))).toBe(true);
  });

  it("a soma de muitos itens fecha ao centavo", () => {
    const itens = Array.from({ length: 1000 }, () => "0.07");
    expect(somar(itens).toFixed(2)).toBe("70.00");
    const mistos = Array.from({ length: 300 }, (_, i) => (i % 2 === 0 ? "1234.56" : "0.1"));
    expect(somar(mistos).toFixed(2)).toBe("185199.00");
  });

  it("valor ausente vale zero (DT-8)", () => {
    expect(valor(undefined).eq(0)).toBe(true);
    expect(somar([undefined, "1.5", undefined]).toFixed(2)).toBe("1.50");
    expect(somar([]).toFixed(2)).toBe("0.00");
  });
});

describe("formatação em reais (CA-16)", () => {
  it("formata no padrão brasileiro", () => {
    expect(formatarReais(Big(0))).toBe("R$ 0,00");
    expect(formatarReais(Big("1.5"))).toBe("R$ 1,50");
    expect(formatarReais(Big("1234.56"))).toBe("R$ 1.234,56");
    expect(formatarReais(Big("1234567.89"))).toBe("R$ 1.234.567,89");
  });

  it("negativo leva o sinal antes do R$", () => {
    expect(formatarReais(Big("-1234.56"))).toBe("-R$ 1.234,56");
    expect(formatarReais(Big("-0.5"))).toBe("-R$ 0,50");
  });

  it("zero negativo não aparece com sinal", () => {
    expect(formatarReais(Big("-0.001"))).toBe("R$ 0,00");
  });

  it("formatar devolve só o número", () => {
    expect(formatar(Big("1234.5"))).toBe("1.234,50");
  });
});

describe("percentual com uma casa (CA-14)", () => {
  it("arredonda meio para cima", () => {
    expect(percentual(Big("1"), Big("8"))).toBe("12,5%");
    expect(percentual(Big("1"), Big("16"))).toBe("6,3%");
    expect(percentual(Big("1"), Big("3"))).toBe("33,3%");
    expect(percentual(Big("2"), Big("3"))).toBe("66,7%");
    expect(percentual(Big("5"), Big("5"))).toBe("100,0%");
  });

  it("total zero mostra traço", () => {
    expect(percentual(Big("0"), Big("0"))).toBe("—");
  });
});
