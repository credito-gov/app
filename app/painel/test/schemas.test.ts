import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pasta = new URL("../schemas/oficiais/", import.meta.url);
const pastaVizinha = new URL("../../apuracao-cbs/schemas/oficiais/", import.meta.url);

const ARQUIVOS = [
  "credito-retorno.schema.json",
  "recolhimento-retorno.schema.json",
  "pagamento-retorno.schema.json",
  "debito-retorno.schema.json",
];

interface Entrada {
  sha256: string;
}

describe("cópias dos schemas oficiais (CA-2, DT-2)", () => {
  const lerVersoes = () => JSON.parse(readFileSync(new URL("versoes.json", pasta), "utf8")) as Record<string, Entrada>;

  it("versoes.json tem exatamente as quatro entradas", () => {
    expect(Object.keys(lerVersoes()).sort()).toEqual([...ARQUIVOS].sort());
  });

  for (const arquivo of ARQUIVOS) {
    it(`${arquivo}: sha256 dos bytes é o registrado em versoes.json`, () => {
      const bytes = readFileSync(new URL(arquivo, pasta));
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(lerVersoes()[arquivo].sha256);
    });
  }

  it("versoes.json é idêntico, byte a byte, ao da apuracao-cbs", () => {
    const meu = readFileSync(new URL("versoes.json", pasta));
    const dela = readFileSync(new URL("versoes.json", pastaVizinha));
    expect(meu.equals(dela)).toBe(true);
  });
});
