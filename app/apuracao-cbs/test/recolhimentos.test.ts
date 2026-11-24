import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { lerSemPerda } from "../src/json.js";
import { resumirRecolhimentos } from "../src/leitores/recolhimentos.js";
import { cabecalhoDe, linhasDoResumo, MENSAGEM_SEM_ALTERACOES } from "../src/saida.js";
import { descreverCicloDaConsulta } from "./apoio/cicloCli.js";

const PROIBIDOS = /dispon[ií]vel|a pagar|pendente|confirmado/i;

const ler = (nome: string): unknown => lerSemPerda(readFileSync(join(import.meta.dirname, "fixtures", "recolhimentos", nome), "utf8"));

describe("leitor de recolhimentos", () => {
  const resumo = resumirRecolhimentos(ler("valido.json"));

  it("agrupa os itens por período de apuração, em ordem cronológica", () => {
    expect(resumo.vazio).toBe(false);
    expect(resumo.periodos.map((p) => p.pa)).toEqual(["09/2026", "10/2026"]);
  });

  it("uma linha por item de composicao, com DARF, data de arrecadação, fornecedor, chave e total", () => {
    const p10 = resumo.periodos[1];
    expect(p10.linhas).toHaveLength(3);
    expect(p10.linhas[0]).toMatchObject({
      pa: "10/2026",
      numeroDARF: "12345678901234567",
      dataArrecadacao: "2026-11-10",
      niFornecedor: "12345678000100",
      chaveDFE: "FICT-NFE-0001",
    });
    expect(p10.linhas[0].total.toFixed(2)).toBe("100.00");
    expect(p10.linhas[1].niFornecedor).toBe("12345678000200");
    expect(p10.linhas[1].chaveDFE).toBeUndefined();
    expect(p10.linhas[1].total.toFixed(2)).toBe("51.35");
    expect(p10.linhas[2]).toMatchObject({ numeroDARF: "12345678901234568", dataArrecadacao: "2026-11-12", chaveDFE: "FICT-NFE-0004" });
    expect(resumo.periodos[0].linhas[0]).toMatchObject({ pa: "09/2026", chaveDFE: "FICT-NFE-0003" });
  });

  it("por período: quantidade e total, ao centavo", () => {
    const [p09, p10] = resumo.periodos;
    expect(p09.quantidade).toBe(1);
    expect(p09.total.toFixed(2)).toBe("20.00");
    expect(p10.quantidade).toBe(3);
    expect(p10.total.toFixed(2)).toBe("181.40");
  });

  it("conta os itens sem chaveDFE", () => {
    expect(resumo.itensSemChave).toBe(1);
    expect(resumo.totalItens).toBe(4);
  });

  it("apuracao vazia é resultado válido", () => {
    const vazio = resumirRecolhimentos(ler("vazio.json"));
    expect(vazio.vazio).toBe(true);
    expect(vazio.periodos).toEqual([]);
    expect(vazio.itensSemChave).toBe(0);
    expect(vazio.totalItens).toBe(0);
  });
});

describe("resumo de recolhimentos", () => {
  const brutos = ler("valido.json");
  const texto = linhasDoResumo(cabecalhoDe("recolhimentos", brutos, "C:/x/r.json"), resumirRecolhimentos(brutos)).join("\n");

  it("traz o cabeçalho comum", () => {
    expect(texto).toContain("recolhimentos");
    expect(texto).toContain("TIQUETE-FICTICIO-RECO-0001");
    expect(texto).toContain("2026-11-20T10:15:30.000-03:00");
    expect(texto).toContain("C:/x/r.json");
  });

  it("mostra por item o DARF, a arrecadação, o fornecedor, a chave (ou sem chave) e o total", () => {
    expect(texto).toContain("Período 10/2026");
    expect(texto).toContain("DARF 12345678901234567");
    expect(texto).toContain("arrecadação 2026-11-10");
    expect(texto).toContain("fornecedor 12345678000200");
    expect(texto).toContain("chave FICT-NFE-0001");
    expect(texto).toContain("sem chave");
    expect(texto).toContain("total 51,35");
  });

  it("mostra a quantidade e o total por período", () => {
    expect(texto).toContain("3 item(ns)");
    expect(texto).toContain("total do período 181,40");
    expect(texto).toContain("total do período 20,00");
  });

  it("informa quantos itens vieram sem chaveDFE", () => {
    expect(texto).toContain("Itens sem chaveDFE: 1 de 4");
  });

  it("não usa os rótulos proibidos", () => {
    expect(texto).not.toMatch(PROIBIDOS);
  });

  it("arquivo vazio mostra a mensagem de sem alterações", () => {
    const vazio = ler("vazio.json");
    const t = linhasDoResumo(cabecalhoDe("recolhimentos", vazio, "C:/x/v.json"), resumirRecolhimentos(vazio)).join("\n");
    expect(t).toContain(MENSAGEM_SEM_ALTERACOES);
    expect(t).not.toContain("Itens sem chaveDFE");
  });
});

descreverCicloDaConsulta("recolhimentos", {
  esperado: ["Itens sem chaveDFE: 1 de 4", "FICT-NFE-0001", "sem chave", "12345678901234567", "total do período 181,40"],
  marcaDeResumo: "Período",
  invalidos: ["invalido.json"],
  divergencia: "/apuracao/0/pagamentos/0/composicao/0",
});
