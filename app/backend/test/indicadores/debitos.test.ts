// indicadoresDeDebito (CA-12, CA-13, CA-23, CA-25): somas de débito, sem nenhuma ligação com crédito.
import Big from "big.js";
import { describe, expect, it } from "vitest";
import * as creditos from "../../src/indicadores/creditos.js";
import * as debitos from "../../src/indicadores/debitos.js";
import { indicadoresDeDebito } from "../../src/indicadores/debitos.js";
import { notaDoBanco, notasDoCenario } from "../apoio/notas.js";
import { VALOR_LONGO } from "../apoio/valores.js";

const soma = (valores: Array<string | undefined>) => valores.reduce((t, v) => t.plus(v ?? "0"), Big(0)).toFixed(2);

describe("CA-13: débitos separados", () => {
  const notas = notasDoCenario("completo", "debitos");

  it("apurado, extinto e saldoDevedor, com a quantidade, iguais à soma nota a nota", () => {
    const r = indicadoresDeDebito(notas, null);
    if (r.semNotasNoRecorte) throw new Error("era esperado haver notas");
    expect(r.quantidadeNotas).toBe(notas.length);
    expect(r.totais).toEqual({
      apurado: soma(notas.map((n) => n.valores["apurado"])),
      extinto: soma(notas.map((n) => n.valores["extinto"])),
      saldoDevedor: soma(notas.map((n) => n.valores["saldoDevedor"])),
    });
  });

  it("a lista de chaves é fechada e não há campo que combine crédito e débito", () => {
    const r = indicadoresDeDebito(notas, null);
    expect(Object.keys(r).sort()).toEqual(["origens", "quantidadeNotas", "semNotasNoRecorte", "totais"]);
    if (r.semNotasNoRecorte) throw new Error("era esperado haver notas");
    expect(Object.keys(r.totais).sort()).toEqual(["apurado", "extinto", "saldoDevedor"]);
  });

  it("nenhuma função recebe crédito e débito juntos: as duas só aceitam notas de um serviço", () => {
    expect(indicadoresDeDebito.length).toBe(2);
    expect(creditos.indicadoresDeCredito.length).toBe(3);
    expect(Object.keys(debitos).sort()).toEqual(["indicadoresDeDebito"]);
  });

  it("a soma não é derivada: apurado menos extinto pode diferir de saldoDevedor e aparece como veio", () => {
    const r = indicadoresDeDebito([notaDoBanco({ valores: { apurado: "800.00", extinto: "300.00", saldoDevedor: "450.00" } })], null);
    if (r.semNotasNoRecorte) throw new Error("era esperado haver notas");
    expect(r.totais).toEqual({ apurado: "800.00", extinto: "300.00", saldoDevedor: "450.00" });
  });
});

describe("CA-12: recorte por período", () => {
  const notas = [
    notaDoBanco({ pa: "11/2026", valores: { apurado: "10.00", saldoDevedor: "10.00" } }),
    notaDoBanco({ pa: "10/2026", valores: { apurado: "5.00", extinto: "2.00", saldoDevedor: "3.00" } }),
  ];

  it("com recorte de um período, só as notas dele", () => {
    const r = indicadoresDeDebito(notas, "2026-10");
    if (r.semNotasNoRecorte) throw new Error("era esperado haver notas");
    expect(r.quantidadeNotas).toBe(1);
    expect(r.totais).toEqual({ apurado: "5.00", extinto: "2.00", saldoDevedor: "3.00" });
  });

  it("período sem débito dá semNotasNoRecorte, nunca zero", () => {
    expect(indicadoresDeDebito(notas, "2026-09")).toEqual({ semNotasNoRecorte: true });
    expect(indicadoresDeDebito([], null)).toEqual({ semNotasNoRecorte: true });
  });
});

describe("CA-23 e CA-25", () => {
  it("o valor de 14 dígitos inteiros chega ao total como texto igual", () => {
    const r = indicadoresDeDebito([notaDoBanco({ valores: { apurado: VALOR_LONGO, saldoDevedor: VALOR_LONGO } })], null);
    if (r.semNotasNoRecorte) throw new Error("era esperado haver notas");
    expect(r.totais.apurado).toBe(VALOR_LONGO);
  });

  it("origens diferentes de normal, com o nome da tabela oficial e a quantidade", () => {
    const r = indicadoresDeDebito(
      [notaDoBanco({ origem: 30, valores: { apurado: "1.00" } }), notaDoBanco({ origem: 30, valores: { apurado: "2.00" } }), notaDoBanco({ valores: { apurado: "3.00" } })],
      null,
    );
    if (r.semNotasNoRecorte) throw new Error("era esperado haver notas");
    expect(r.origens).toEqual([{ codigo: 30, nome: "CANCELAMENTO_CREDITO", quantidade: 2 }]);
    expect(r.totais.apurado).toBe("6.00");
  });
});
