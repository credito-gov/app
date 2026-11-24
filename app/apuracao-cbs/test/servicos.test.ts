import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { NOMES_SERVICOS, SERVICOS, buscarServico } from "../src/servicos.js";

describe("catálogo de serviços", () => {
  it("tem exatamente as quatro consultas, na ordem de entrega", () => {
    expect(SERVICOS.map((s) => s.nome)).toEqual(["creditos", "recolhimentos", "pagamentos", "debitos"]);
    expect([...NOMES_SERVICOS]).toEqual(["creditos", "recolhimentos", "pagamentos", "debitos"]);
  });

  it("liga cada consulta ao seu caminho e ao seu schema", () => {
    expect(buscarServico("creditos")).toMatchObject({ caminho: "creditos", schema: "credito-retorno.schema.json" });
    expect(buscarServico("recolhimentos")).toMatchObject({
      caminho: "recolhimentos",
      schema: "recolhimento-retorno.schema.json",
    });
    expect(buscarServico("pagamentos")).toMatchObject({
      caminho: "pagamentos",
      schema: "pagamento-retorno.schema.json",
    });
    expect(buscarServico("debitos")).toMatchObject({ caminho: "debitos", schema: "debito-retorno.schema.json" });
  });

  it("não encontra nome fora da lista, inclusive todas", () => {
    for (const nome of ["todas", "rad", "pcont", "credito", "", "CREDITOS", "situacao", "download"]) {
      expect(buscarServico(nome), nome).toBeUndefined();
    }
  });

  it("não há código para /rad nem /pcont em src/ (CA-15)", () => {
    const achados: string[] = [];
    const varrer = (pasta: string): void => {
      for (const nome of readdirSync(pasta)) {
        const caminho = join(pasta, nome);
        if (statSync(caminho).isDirectory()) varrer(caminho);
        else if (/\/(rad|pcont)\b/i.test(readFileSync(caminho, "utf8"))) achados.push(caminho);
      }
    };
    varrer(join(import.meta.dirname, "..", "src"));
    expect(achados).toEqual([]);
  });
});
