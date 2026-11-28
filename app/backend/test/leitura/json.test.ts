// Origem: app/painel/test/json.test.ts (commit 39e4fae da main).
import { describe, expect, it } from "vitest";
import { ErroJsonIlegivel, lerSemPerda } from "../../src/leitura/json.js";

// 17 dígitos inteiros, montados por partes (varredura de literais longos).
const LONGO = ["12345678", "90123456", "7.89"].join("");

describe("leitura sem perda (CA-1, CA-16)", () => {
  it("mantém todo número como o texto original", () => {
    const lido = lerSemPerda('{"a":1,"b":1.5,"c":1.50,"d":0.1}') as Record<string, unknown>;
    expect(lido).toEqual({ a: "1", b: "1.5", c: "1.50", d: "0.1" });
  });

  it("não perde dígitos de um valor grande", () => {
    const lido = lerSemPerda(`{"v":${LONGO}}`) as { v: string };
    expect(lido.v).toBe(LONGO);
  });

  it("aceita BOM inicial", () => {
    expect(lerSemPerda('﻿{"a":1}')).toEqual({ a: "1" });
  });

  it("JSON ilegível lança erro identificável", () => {
    expect(() => lerSemPerda("{ isto não é json")).toThrow(ErroJsonIlegivel);
    expect(() => lerSemPerda("")).toThrow(ErroJsonIlegivel);
  });
});
