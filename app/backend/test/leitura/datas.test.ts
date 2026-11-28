// Origem: app/painel/test/datas.test.ts (commit 39e4fae da main).
import { describe, expect, it } from "vitest";
import { analisarData, compararInstantes, exibirData, exibirDia } from "../../src/leitura/datas.js";

describe("exibição de datas a partir do texto (CA-5)", () => {
  it("mostra dd/mm/aaaa hh:mm com o fuso do arquivo ao lado", () => {
    expect(exibirData("2026-11-20T10:15:30.000-03:00")).toBe("20/11/2026 10:15 (-03:00)");
  });

  it("aceita 0, 3 e 6 casas de fração", () => {
    expect(exibirData("2026-11-20T10:15:30-03:00")).toBe("20/11/2026 10:15 (-03:00)");
    expect(exibirData("2026-11-20T10:15:30.123-03:00")).toBe("20/11/2026 10:15 (-03:00)");
    expect(exibirData("2026-11-20T10:15:30.123456-03:00")).toBe("20/11/2026 10:15 (-03:00)");
  });

  it("não converte o fuso: a hora é a do arquivo", () => {
    expect(exibirData("2026-11-20T23:59:59.000-03:00")).toBe("20/11/2026 23:59 (-03:00)");
    expect(exibirData("2026-11-20T23:59:59Z")).toBe("20/11/2026 23:59 (UTC)");
  });

  it("data só com o dia", () => {
    expect(exibirDia("2026-11-10")).toBe("10/11/2026");
  });

  it("data inválida é identificada", () => {
    expect(analisarData("ontem")).toBeNull();
    expect(exibirData("ontem")).toBe("data inválida");
    expect(exibirData("2026-13-45T10:15:30-03:00")).toBe("data inválida");
    expect(exibirDia("10/11/2026")).toBe("data inválida");
  });
});

describe("comparação de instantes (D-5)", () => {
  it("compara fusos diferentes", () => {
    // 10:00-03:00 = 13:00Z
    expect(compararInstantes("2026-11-20T10:00:00-03:00", "2026-11-20T13:00:00Z")).toBe(0);
    expect(compararInstantes("2026-11-20T10:00:00-03:00", "2026-11-20T12:59:59Z")).toBe(1);
    expect(compararInstantes("2026-11-20T10:00:00-03:00", "2026-11-20T09:00:00-05:00")).toBe(-1);
  });

  it("compara frações de tamanhos diferentes", () => {
    expect(compararInstantes("2026-11-20T10:00:00.5-03:00", "2026-11-20T10:00:00.500000-03:00")).toBe(0);
    expect(compararInstantes("2026-11-20T10:00:00.123456-03:00", "2026-11-20T10:00:00.123-03:00")).toBe(1);
    expect(compararInstantes("2026-11-20T10:00:00-03:00", "2026-11-20T10:00:00.000001-03:00")).toBe(-1);
  });

  it("data inválida vale menos que qualquer data válida", () => {
    expect(compararInstantes("ontem", "2026-11-20T10:00:00-03:00")).toBe(-1);
    expect(compararInstantes("2026-11-20T10:00:00-03:00", "ontem")).toBe(1);
    expect(compararInstantes("ontem", "amanhã")).toBe(0);
  });
});
