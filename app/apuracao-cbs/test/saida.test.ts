import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { lerSemPerda } from "../src/json.js";
import { resumirCreditos } from "../src/leitores/creditos.js";
import { resumirDebitos } from "../src/leitores/debitos.js";
import { resumirPagamentos } from "../src/leitores/pagamentos.js";
import { resumirRecolhimentos } from "../src/leitores/recolhimentos.js";
import { cabecalhoDe, linhasDoResumo, MENSAGEM_SEM_ALTERACOES, type Resumo } from "../src/saida.js";
import type { NomeServico } from "../src/servicos.js";

const PROIBIDOS = /dispon[ií]vel|a pagar|pendente|confirmado/i;

const dados = (servico: string, nome: string): unknown =>
  lerSemPerda(readFileSync(join(import.meta.dirname, "fixtures", servico, nome), "utf8"));

describe("resumo de créditos", () => {
  const brutos = dados("creditos", "valido.json");
  const texto = linhasDoResumo(cabecalhoDe("creditos", brutos, "C:/x/arquivo.json"), resumirCreditos(brutos)).join("\n");

  it("traz serviço, tíquete, geradoEm e o caminho do arquivo", () => {
    expect(texto).toContain("creditos");
    expect(texto).toContain("TIQUETE-FICTICIO-CRED-0001");
    expect(texto).toContain("2026-11-20T10:15:30.000-03:00");
    expect(texto).toContain("C:/x/arquivo.json");
  });

  it("não mostra o niConsumidor", () => {
    expect(texto).not.toContain("12345678000100");
  });

  it("mostra por crédito: chave, tipo, origem, a apropriar e apropriado, formatados", () => {
    expect(texto).toContain("Período 10/2026");
    expect(texto).toContain("FICT-NFE-0001");
    expect(texto).toContain("NF-e (55)");
    expect(texto).toContain("NORMAL (0)");
    expect(texto).toContain("a apropriar 1.000,10");
    expect(texto).toContain("apropriado 234,46");
  });

  it("mostra por período a quantidade e os totais", () => {
    expect(texto).toContain("2 crédito(s)");
    expect(texto).toContain("total a apropriar 1.000,10");
    expect(texto).toContain("total apropriado 734,66");
    expect(texto).toContain("total a apropriar 100,17");
    expect(texto).toContain("total apropriado 20,00");
  });

  it("usa os rótulos da documentação e não os proibidos", () => {
    expect(texto).toContain("a apropriar");
    expect(texto).toContain("apropriado");
    expect(texto).not.toMatch(PROIBIDOS);
  });

  it("arquivo vazio mostra a mensagem de que a API não devolveu alterações", () => {
    const vazio = dados("creditos", "vazio.json");
    const t = linhasDoResumo(cabecalhoDe("creditos", vazio, "C:/x/v.json"), resumirCreditos(vazio)).join("\n");
    expect(t).toContain(MENSAGEM_SEM_ALTERACOES);
    expect(MENSAGEM_SEM_ALTERACOES).toContain("A API não devolveu alterações");
    expect(MENSAGEM_SEM_ALTERACOES).toContain("8 dias");
    expect(t).not.toMatch(PROIBIDOS);
  });
});

describe("rótulos das quatro consultas (CA-9)", () => {
  const casos: Array<[NomeServico, (d: unknown) => Resumo, string[]]> = [
    ["creditos", resumirCreditos, ["a apropriar", "apropriado"]],
    ["recolhimentos", resumirRecolhimentos, ["total"]],
    ["pagamentos", resumirPagamentos, ["RAD", "PCONT", "total"]],
    ["debitos", resumirDebitos, ["apurado", "extinto", "saldo devedor"]],
  ];

  for (const [servico, resumir, rotulos] of casos) {
    it(`${servico}: usa os rótulos da documentação e nenhum de disponível, a pagar, pendente, confirmado`, () => {
      for (const arquivo of ["valido.json", "vazio.json"]) {
        const brutos = dados(servico, arquivo);
        const texto = linhasDoResumo(cabecalhoDe(servico, brutos, "C:/x/a.json"), resumir(brutos)).join("\n");
        expect(texto).not.toMatch(PROIBIDOS);
        if (arquivo === "valido.json") for (const rotulo of rotulos) expect(texto, rotulo).toContain(rotulo);
      }
    });
  }
});
