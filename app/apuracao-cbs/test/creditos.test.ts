import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { lerSemPerda } from "../src/json.js";
import { resumirCreditos } from "../src/leitores/creditos.js";

const ler = (nome: string): unknown => lerSemPerda(readFileSync(join(import.meta.dirname, "fixtures", "creditos", nome), "utf8"));

describe("leitor de créditos", () => {
  const resumo = resumirCreditos(ler("valido.json"));

  it("agrupa por período de apuração, na ordem do arquivo", () => {
    expect(resumo.vazio).toBe(false);
    expect(resumo.periodos.map((p) => p.pa)).toEqual(["10/2026", "11/2026"]);
  });

  it("uma linha por crédito, com período, chave, tipo, origem, a apropriar e apropriado", () => {
    const [a, b] = resumo.periodos[0].linhas;
    expect(a).toMatchObject({
      pa: "10/2026",
      chave: "FICT-NFE-0001",
      documento: { codigo: 55, nome: "NF-e" },
      origem: { codigo: 0, nome: "NORMAL" },
    });
    expect(a.aApropriar.toFixed(2)).toBe("1000.10");
    expect(a.apropriado.toFixed(2)).toBe("234.46");
    expect(b.chave).toBe("FICT-CTE-0002");
    expect(b.documento).toEqual({ codigo: 57, nome: "CT-e" });

    const [c, d] = resumo.periodos[1].linhas;
    expect(c.origem).toEqual({ codigo: 20, nome: "DEVOLUCAO_POR_PCONT" });
    expect(d.documento).toEqual({ codigo: 65, nome: "NFC-e" });
  });

  it("valor omitido vale 0,00 (sem aApropriar, sem apropriado)", () => {
    const [, semAApropriar] = resumo.periodos[0].linhas;
    expect(semAApropriar.aApropriar.toFixed(2)).toBe("0.00");
    expect(semAApropriar.apropriado.toFixed(2)).toBe("500.20");
    const [semApropriado] = resumo.periodos[1].linhas;
    expect(semApropriado.apropriado.toFixed(2)).toBe("0.00");
    expect(semApropriado.aApropriar.toFixed(2)).toBe("100.07");
  });

  it("por período: quantidade e os dois totais, ao centavo", () => {
    const [p10, p11] = resumo.periodos;
    expect(p10.quantidade).toBe(2);
    expect(p10.totalAApropriar.toFixed(2)).toBe("1000.10");
    expect(p10.totalApropriado.toFixed(2)).toBe("734.66");
    expect(p11.quantidade).toBe(2);
    expect(p11.totalAApropriar.toFixed(2)).toBe("100.17");
    expect(p11.totalApropriado.toFixed(2)).toBe("20.00");
  });

  it("apuracao vazia é resultado válido, sem períodos", () => {
    const vazio = resumirCreditos(ler("vazio.json"));
    expect(vazio.vazio).toBe(true);
    expect(vazio.periodos).toEqual([]);
  });

  it("o resumo não carrega o niConsumidor", () => {
    expect(JSON.stringify(resumo)).not.toContain("12345678000100");
  });
});
