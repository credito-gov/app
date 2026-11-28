// valoresDe: o valor de coluna que o banco devolve (revisão, item B1). Texto decimal ou null; qualquer outro
// tipo é defeito de leitura e não pode virar zero em silêncio.
import { describe, expect, it } from "vitest";
import { valoresDe } from "../../src/paineis/dados.js";

const COLUNAS = [
  ["apurado", "apurado"],
  ["a_apropriar", "aApropriar"],
] as const;
const ARQUIVO = "11111111-1111-4111-8111-111111111111";

describe("valoresDe", () => {
  it("texto entra como veio, null fica de fora", () => {
    expect(valoresDe({ arquivo_id: ARQUIVO, apurado: "10.50", a_apropriar: null }, COLUNAS)).toEqual({ apurado: "10.50" });
  });

  it.each([
    ["number", 10.5],
    ["bigint", 10n],
    ["boolean", true],
    ["objeto", { x: 1 }],
    ["undefined", undefined],
  ])("valor %s lança erro com a coluna e o arquivoId, sem virar zero", (_nome, v) => {
    const chama = () => valoresDe({ arquivo_id: ARQUIVO, apurado: "1.00", a_apropriar: v }, COLUNAS);
    if (v === undefined) {
      // coluna ausente da linha não é erro: o select * pode não trazer coluna de outro serviço
      expect(chama()).toEqual({ apurado: "1.00" });
      return;
    }
    expect(chama).toThrowError(/a_apropriar/);
    expect(chama).toThrowError(new RegExp(ARQUIVO));
  });
});
