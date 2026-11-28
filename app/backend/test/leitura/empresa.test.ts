// Origem: app/painel/test/empresa.test.ts (commit 39e4fae da main). Só os casos de raizDe: os de verificarEmpresa dependem da interface de pasta, que não é copiada.
import { describe, expect, it } from "vitest";
import { raizDe } from "../../src/leitura/empresa.js";
import { NI14, RAIZ } from "../apoio/construtores.js";

describe("raiz do CNPJ (CA-3)", () => {
  it("ni de 8 e de 14 dígitos têm a mesma raiz", () => {
    expect(raizDe("90817263")).toBe(RAIZ);
    expect(raizDe(NI14)).toBe(RAIZ);
  });

  it("ni fora de 8 ou 14 dígitos não tem raiz", () => {
    expect(raizDe("9081726")).toBeNull();
    expect(raizDe(`${RAIZ}00018`)).toBeNull();
    expect(raizDe("9081726A")).toBeNull();
  });
});
