import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const pastaOficiais = join(import.meta.dirname, "..", "schemas", "oficiais");

const NOMES = [
  "credito-retorno.schema.json",
  "recolhimento-retorno.schema.json",
  "pagamento-retorno.schema.json",
  "debito-retorno.schema.json",
];

describe("cópias oficiais dos schemas", () => {
  const versoes = JSON.parse(readFileSync(join(pastaOficiais, "versoes.json"), "utf8")) as Record<
    string,
    Record<string, string>
  >;

  it("registra exatamente as quatro cópias", () => {
    expect(Object.keys(versoes).sort()).toEqual([...NOMES].sort());
  });

  for (const nome of NOMES) {
    describe(nome, () => {
      it("tem todos os campos de proveniência e a URL oficial", () => {
        const entrada = versoes[nome];
        for (const campo of ["url", "versaoSchema", "pagina", "versaoPagina", "lidoEm", "sha256"]) {
          expect(entrada[campo], campo).toBeTruthy();
        }
        expect(entrada.url).toBe(`https://docs.receitafederal.gov.br/apuracao-cbs/schemas/${nome}`);
      });

      it("tem o SHA-256 dos bytes igual ao registrado", () => {
        const bytes = readFileSync(join(pastaOficiais, nome));
        expect(createHash("sha256").update(bytes).digest("hex")).toBe(versoes[nome].sha256);
      });

      it("é JSON Schema Draft 2020-12", () => {
        const schema = JSON.parse(readFileSync(join(pastaOficiais, nome), "utf8")) as { $schema: string };
        expect(schema.$schema).toMatch(/2020-12/);
      });
    });
  }
});
