// Origem: app/painel/test/tabelas.test.ts (commit 39e4fae da main).
import { describe, expect, it } from "vitest";
import { textoDocumento, textoOrigem } from "../../src/leitura/tabelas.js";

describe("nomes oficiais de documento e origem (F-2)", () => {
  it("mostra o nome oficial como está, com o código", () => {
    expect(textoDocumento(55)).toBe("NF-e (55)");
    expect(textoDocumento(91)).toBe("NFS-e (91)");
    expect(textoOrigem(0)).toBe("NORMAL (0)");
    expect(textoOrigem(20)).toBe("DEVOLUCAO_POR_PCONT (20)");
  });

  it("código fora da tabela não inventa nome", () => {
    expect(textoDocumento(99)).toBe("código 99 (sem nome na tabela)");
    expect(textoOrigem(77)).toBe("código 77 (sem nome na tabela)");
  });
});
